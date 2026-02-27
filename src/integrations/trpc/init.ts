import { initTRPC, TRPCError } from "@trpc/server";
import type { auth } from "src/lib/auth";
import superjson from "superjson";

export interface TRPCContext {
	user: typeof auth.$Infer.Session.user | null;
	session: typeof auth.$Infer.Session.session | null;
}

const t = initTRPC.context<TRPCContext>().create({
	transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const authedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.user || !ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Not authenticated",
		});
	}
	return next({
		ctx: {
			...ctx,
			user: ctx.user,
			session: ctx.session,
		},
	});
});

export const adminProcedure = authedProcedure.use(({ ctx, next }) => {
	if (ctx.user.role !== "admin") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Admin role required",
		});
	}
	return next({ ctx });
});

export const viewerProcedure = authedProcedure;
