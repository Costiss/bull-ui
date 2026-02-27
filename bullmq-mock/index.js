import IORedis from "ioredis";
import bullmqPkg from "bullmq";
const { Queue, Worker, QueueScheduler } = bullmqPkg;

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);

// When running inside the monorepo with pnpm and Node ESM loader, warn if
// host is a Docker service name and user runs mocks locally. Users can set
// REDIS_HOST to the correct address (e.g. "redis" when inside compose network).

const connection = new IORedis(REDIS_PORT, REDIS_HOST, {
  maxRetriesPerRequest: null,
});

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function startMockQueue(name, workerCount = 1, addEveryMs = 3000) {
  const queue = new Queue(name, { connection });

  const workers = [];
  for (let i = 0; i < workerCount; i++) {
    const w = new Worker(
      name,
      async (job) => {
        // Simulate work
        console.log(`[${name}] Worker:${i} processing job`, job.id, job.name);
        await sleep(500 + Math.random() * 1500);
        if (Math.random() < 0.05) {
          throw new Error("Random failure");
        }
        return { ok: true };
      },
      {
        connection,
        // give each worker a unique name so Queue.getWorkers returns useful info
        name: `${name}-worker-${i}`,
      },
    );

    w.on("completed", (job) => {
      console.log(`[${name}] Worker:${i} completed job`, job.id);
    });
    w.on("failed", (job, err) => {
      console.log(`[${name}] Worker:${i} failed job`, job.id, String(err));
    });

    workers.push(w);
  }

  // Periodically add jobs so the UI has something to show
  const interval = setInterval(async () => {
    try {
      const job = await queue.add("task", { createdAt: Date.now() }, { removeOnComplete: 100 });
      console.log(`[${name}] Added job`, job.id);
    } catch (e) {
      console.error(`Failed to add job to ${name}:`, e);
    }
  }, addEveryMs);

  return async function stop() {
    clearInterval(interval);
    await Promise.all(workers.map((w) => w.close()));
    await queue.close();
  };
}

async function main() {
  console.log("Starting mock bullmq workers, connecting to", REDIS_HOST + ":" + REDIS_PORT);

  const stopFns = [];

  stopFns.push(await startMockQueue("email", 2, 4000));
  stopFns.push(await startMockQueue("video", 1, 6000));
  stopFns.push(await startMockQueue("reports", 1, 8000));

  const shutdown = async () => {
    console.log("Shutting down mock workers...");
    try {
      await Promise.all(stopFns.map((fn) => fn()));
      await connection.disconnect();
    } catch (e) {
      // ignore
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
