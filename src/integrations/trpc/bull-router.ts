import { Queue } from "bullmq";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/index";
import { redisInstances } from "../../db/schema";
import { closeRedisConnection, getRedisConnection } from "../../lib/bullmq";
import { adminProcedure, viewerProcedure } from "./init";

export const redisRouter = {
	list: viewerProcedure.query(async ({ ctx }) => {
		return await db.query.redisInstances.findMany({
			where: (table, { eq }) => eq(table.userId, ctx.user.id),
		});
	}),
	add: adminProcedure
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
	delete: adminProcedure
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

			closeRedisConnection(input.id);
			return { success: true };
		}),
};

export const bullmqRouter = {
	getQueues: viewerProcedure
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

	getJobs: viewerProcedure
		.input(
			z.object({
				instanceId: z.number(),
				queueName: z.string(),
				state: z
					.enum(["active", "waiting", "completed", "failed", "delayed"])
					.optional(),
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ input, ctx }) => {
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

			const jobs = await q.getJobs(
				input.state
					? [input.state]
					: ["active", "waiting", "completed", "failed", "delayed"],
				input.offset,
				input.offset + input.limit - 1,
			);

			const jobSummaries = jobs.map((job) => ({
				id: job.id,
				name: job.name,
				data: job.data,
				opts: job.opts,
				progress: job.progress,
				attemptsMade: job.attemptsMade,
				finishedOn: job.finishedOn,
				processedOn: job.processedOn,
				failedReason: job.failedReason,
				returnvalue: job.returnvalue,
			}));

			await q.close();
			return jobSummaries;
		}),

	getJob: viewerProcedure
		.input(
			z.object({
				instanceId: z.number(),
				queueName: z.string(),
				jobId: z.string(),
			}),
		)
		.query(async ({ input, ctx }) => {
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

			const [job, logs] = await Promise.all([
				q.getJob(input.jobId),
				q.getJobLogs(input.jobId),
			]);

			if (!job) throw new Error("Job not found");

			const jobDetails = {
				id: job.id,
				name: job.name,
				data: job.data,
				opts: job.opts,
				progress: job.progress,
				attemptsMade: job.attemptsMade,
				finishedOn: job.finishedOn,
				processedOn: job.processedOn,
				failedReason: job.failedReason,
				returnvalue: job.returnvalue,
				stacktrace: job.stacktrace,
				logs: logs.logs,
			};

			await q.close();
			return jobDetails;
		}),

	controlQueue: adminProcedure
		.input(
			z.object({
				instanceId: z.number(),
				queueName: z.string(),
				action: z.enum(["pause", "resume", "clean", "purge"]),
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
			else if (input.action === "purge") await q.obliterate({ force: true });

			await q.close();
			return { success: true };
		}),

	removeJob: adminProcedure
		.input(
			z.object({
				instanceId: z.number(),
				queueName: z.string(),
				jobId: z.string(),
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

			const job = await q.getJob(input.jobId);
			if (job) {
				await job.remove();
			}

			await q.close();
			return { success: true };
		}),

	retryJob: adminProcedure
		.input(
			z.object({
				instanceId: z.number(),
				queueName: z.string(),
				jobId: z.string(),
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

			const job = await q.getJob(input.jobId);
			if (job) {
				await job.retry();
			}

			await q.close();
			return { success: true };
		}),

	getWorkers: viewerProcedure
		.input(
			z.object({
				instanceId: z.number(),
				queueName: z.string(),
			}),
		)
		.query(async ({ input, ctx }) => {
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

			const workers = await q.getWorkers();

			await q.close();
			return workers.map((w) => ({
				id: w.id,
				name: w.name,
				opts: w.opts,
			}));
		}),
};
