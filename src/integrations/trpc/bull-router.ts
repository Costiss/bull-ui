import { Queue } from "bullmq";
import { and, eq } from "drizzle-orm";
import IORedis from "ioredis";
import { z } from "zod";
import { db } from "../../db/index";
import { redisInstances } from "../../db/schema";
import { authedProcedure } from "./init";

// Cache connections
const connections: Record<number, IORedis> = {};

function getRedisConnection(instanceId: number, host: string, port: number) {
	if (!connections[instanceId]) {
		connections[instanceId] = new IORedis(port, host, {
			maxRetriesPerRequest: null,
		});
	}
	return connections[instanceId];
}

export const redisRouter = {
	list: authedProcedure.query(async ({ ctx }) => {
		return await db.query.redisInstances.findMany({
			where: (table, { eq }) => eq(table.userId, ctx.user.id),
		});
	}),
	add: authedProcedure
		.input(
			z.object({
				name: z.string(),
				host: z.string(),
				port: z.number().default(6379),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const [instance] = await db
				.insert(redisInstances)
				.values({
					...input,
					userId: ctx.user.id,
				})
				.returning();
			return instance;
		}),
	delete: authedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input, ctx }) => {
			await db
				.delete(redisInstances)
				.where(
					and(
						eq(redisInstances.id, input.id),
						eq(redisInstances.userId, ctx.user.id),
					),
				);

			if (connections[input.id]) {
				connections[input.id].disconnect();
				delete connections[input.id];
			}
			return { success: true };
		}),
};

export const bullmqRouter = {
	getQueues: authedProcedure
		.input(z.object({ instanceId: z.number() }))
		.query(async ({ input, ctx }) => {
			const instance = await db.query.redisInstances.findFirst({
				where: (table, { eq, and }) =>
					and(eq(table.id, input.instanceId), eq(table.userId, ctx.user.id)),
			});

			if (!instance) {
				throw new Error("Instance not found");
			}

			const redis = getRedisConnection(
				instance.id,
				instance.host,
				instance.port,
			);

			const keys = await redis.keys("bull:*:meta");
			const queueNames = keys.map((key) => key.split(":")[1]);

			const queuesInfo = await Promise.all(
				queueNames.map(async (name) => {
					const q = new Queue(name, { connection: redis });
					const [
						active,
						waiting,
						completed,
						failed,
						delayed,
						isPaused,
						workers,
					] = await Promise.all([
						q.getActiveCount(),
						q.getWaitingCount(),
						q.getCompletedCount(),
						q.getFailedCount(),
						q.getDelayedCount(),
						q.isPaused(),
						q.getWorkers(),
					]);
					await q.close();
					return {
						name,
						isPaused,
						counts: { active, waiting, completed, failed, delayed },
						workers: workers.map((w) => ({ id: w.id, name: w.name })),
					};
				}),
			);

			return queuesInfo;
		}),

	controlQueue: authedProcedure
		.input(
			z.object({
				instanceId: z.number(),
				queueName: z.string(),
				action: z.enum(["pause", "resume", "clean"]),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const instance = await db.query.redisInstances.findFirst({
				where: (table, { eq, and }) =>
					and(eq(table.id, input.instanceId), eq(table.userId, ctx.user.id)),
			});

			if (!instance) throw new Error("Instance not found");

			const redis = getRedisConnection(
				instance.id,
				instance.host,
				instance.port,
			);
			const q = new Queue(input.queueName, { connection: redis });

			if (input.action === "pause") await q.pause();
			else if (input.action === "resume") await q.resume();
			else if (input.action === "clean") await q.clean(0, 1000, "completed");

			await q.close();
			return { success: true };
		}),
};
