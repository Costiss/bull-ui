import { TRPCError } from "@trpc/server";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/index";
import { users } from "../../db/schema";
import { auth } from "../../lib/auth";
import { createTRPCRouter, publicProcedure } from "./init";

export const setupRouter = createTRPCRouter({
	isInitialSetup: publicProcedure.query(async () => {
		const [res] = await db.select({ value: count() }).from(users);
		return res.value === 0;
	}),

	createInitialAdmin: publicProcedure
		.input(
			z.object({
				name: z.string().min(1),
				email: z.string().email(),
				password: z.string().min(8),
			}),
		)
		.mutation(async ({ input }) => {
			const [res] = await db.select({ value: count() }).from(users);
			if (res.value !== 0) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Setup already completed",
				});
			}

			const user = await auth.api.signUpEmail({
				body: {
					email: input.email,
					password: input.password,
					name: input.name,
				},
			});

			if (!user) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create admin user",
				});
			}

			// BetterAuth might not have set the role to admin, so we force it
			await db
				.update(users)
				.set({ role: "admin" })
				.where(eq(users.email, input.email));

			return { success: true };
		}),
});
