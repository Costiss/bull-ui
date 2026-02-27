import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
	id: text().primaryKey(),
	name: text().notNull(),
	email: text().notNull().unique(),
	emailVerified: boolean().notNull(),
	image: text(),
	role: text().default("viewer"),
	createdAt: timestamp().notNull(),
	updatedAt: timestamp().notNull(),
});

export const sessions = pgTable("session", {
	id: text().primaryKey(),
	expiresAt: timestamp().notNull(),
	token: text().notNull().unique(),
	createdAt: timestamp().notNull(),
	updatedAt: timestamp().notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text()
		.notNull()
		.references(() => users.id),
});

export const accounts = pgTable("account", {
	id: text().primaryKey(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text()
		.notNull()
		.references(() => users.id),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp(),
	refreshTokenExpiresAt: timestamp(),
	scope: text(),
	password: text(),
	createdAt: timestamp().notNull(),
	updatedAt: timestamp().notNull(),
});

export const verifications = pgTable("verification", {
	id: text().primaryKey(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp().notNull(),
	createdAt: timestamp(),
	updatedAt: timestamp(),
});

export const redisInstances = pgTable("redis_instances", {
	id: serial().primaryKey(),
	name: text().notNull(),
	host: text().notNull(),
	port: integer().notNull().default(6379),
	userId: text()
		.notNull()
		.references(() => users.id),
	createdAt: timestamp("created_at").defaultNow(),
});

export const todos = pgTable("todos", {
	id: serial().primaryKey(),
	title: text().notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});
