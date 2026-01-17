import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const todos = pgTable("todos", {
	id: serial("id").primaryKey(),
	title: text("title").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});

// Government departments
export const departments = pgTable("departments", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(), // e.g., "Mayor's Office"
	code: text("code").notNull().unique(), // e.g., "MAYOR"
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at").defaultNow(),
});

// Users table - admin-managed (no self-registration)
export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	phoneNumber: text("phone_number").notNull().unique(), // Format: 639XXXXXXXXX
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	role: text("role").notNull().default("user"), // 'superuser' | 'admin' | 'user'
	departmentId: uuid("department_id").references(() => departments.id),
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// OTP verification tracking
export const otpVerifications = pgTable("otp_verifications", {
	id: serial("id").primaryKey(),
	phoneNumber: text("phone_number").notNull(),
	code: text("code").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	attempts: integer("attempts").notNull().default(0),
	verified: boolean("verified").notNull().default(false),
	createdAt: timestamp("created_at").defaultNow(),
});

// Sessions table
export const sessions = pgTable("sessions", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});

// Relations for query builder
export const departmentsRelations = relations(departments, ({ many }) => ({
	users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
	department: one(departments, {
		fields: [users.departmentId],
		references: [departments.id],
	}),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

// Type exports for use in application code
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = "superuser" | "admin" | "user";

export type OtpVerification = typeof otpVerifications.$inferSelect;
export type NewOtpVerification = typeof otpVerifications.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
