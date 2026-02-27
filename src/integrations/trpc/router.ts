import { bullmqRouter, redisRouter } from "./bull-router";
import { createTRPCRouter } from "./init";
import { setupRouter } from "./setup-router";

export const trpcRouter = createTRPCRouter({
	redis: redisRouter,
	bullmq: bullmqRouter,
	setup: setupRouter,
});
export type TRPCRouter = typeof trpcRouter;
