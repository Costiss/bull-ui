import { createFileRoute } from "@tanstack/react-router";
import { Queue } from "bullmq";
import { db } from "#/db/index";
import { auth } from "#/lib/auth";
import { getRedisConnection } from "#/lib/bullmq";

export const Route = createFileRoute("/api/events")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const instanceIdStr = url.searchParams.get("instanceId");
				if (!instanceIdStr) {
					return new Response("Missing instanceId", { status: 400 });
				}
				const instanceId = Number(instanceIdStr);

				const session = await auth.api.getSession({ headers: request.headers });
				if (!session) {
					return new Response("Unauthorized", { status: 401 });
				}

				const instance = await db.query.redisInstances.findFirst({
					where: (table, { eq, and }) =>
						and(eq(table.id, instanceId), eq(table.userId, session.user.id)),
				});

				if (!instance) {
					return new Response("Instance not found", { status: 404 });
				}

				const redis = getRedisConnection(
					instance.id,
					instance.host,
					instance.port,
				);

				const stream = new ReadableStream({
					async start(controller) {
						const encoder = new TextEncoder();
						const sendEvent = (data: any) => {
							try {
								controller.enqueue(
									encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
								);
							} catch (e) {
								// Controller might be closed
							}
						};

						sendEvent({ type: "connected" });

						const fetchMetrics = async () => {
							try {
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

								sendEvent({ type: "metrics", queues: queuesInfo });
							} catch (error) {
								sendEvent({ type: "error", message: String(error) });
							}
						};

						// Initial fetch
						await fetchMetrics();

						const interval = setInterval(fetchMetrics, 5000);

						request.signal.addEventListener("abort", () => {
							clearInterval(interval);
							try {
								controller.close();
							} catch (e) {}
						});
					},
				});

				return new Response(stream, {
					headers: {
						"Content-Type": "text/event-stream",
						"Cache-Control": "no-cache",
						Connection: "keep-alive",
					},
				});
			},
		},
	},
});
