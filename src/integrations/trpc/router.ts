import { bullmqRouter, redisRouter } from "./bull-router";
import { createTRPCRouter } from "./init";

export const trpcRouter = createTRPCRouter({
	redis: redisRouter,
	bullmq: bullmqRouter,
});
export type TRPCRouter = typeof trpcRouter;
