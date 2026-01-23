import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";

export const todos = pgTable("todos", {
	id: serial("id").primaryKey(),
	title: text("title").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});

// People (residents/beneficiaries)
export const people = pgTable("people", {
	id: uuid("id").primaryKey().defaultRandom(),
	firstName: text("first_name").notNull(),
	middleName: text("middle_name"),
	lastName: text("last_name").notNull(),
	suffix: text("suffix"),
	birthdate: date("birthdate").notNull(),
	street: text("street").notNull(),
	purok: text("purok"),
	barangay: text("barangay").notNull(),
	phoneNumber: text("phone_number").notNull(),
	monthlyIncome: integer("monthly_income"),
	status: text("status").notNull().default("active"), // active | inactive | pending
	profilePhoto: text("profile_photo"),
	emergencyContactName: text("emergency_contact_name"),
	emergencyContactPhone: text("emergency_contact_phone"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Person government identifications (normalized)
export const personIdentifications = pgTable(
	"person_identifications",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		personId: uuid("person_id")
			.notNull()
			.references(() => people.id, { onDelete: "cascade" }),
		type: text("type").notNull(), // voter | philhealth | sss | fourPs | pwd | soloParent | pagibig | tin | barangayClearance
		idNumber: text("id_number"),
		issueDate: date("issue_date"),
		expiryDate: date("expiry_date"),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => [unique().on(table.personId, table.type)],
);

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
	email: text("email").unique(), // Optional - users may have phone, email, or both
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
	identifier: text("identifier").notNull(), // phone number or email
	type: text("type").notNull(), // "phone" | "email"
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

// Benefits - department-scoped benefit types
export const benefits = pgTable("benefits", {
	id: uuid("id").primaryKey().defaultRandom(),
	departmentId: uuid("department_id")
		.notNull()
		.references(() => departments.id),
	name: text("name").notNull(),
	description: text("description"),
	valuePesos: integer("value_pesos"), // Optional monetary value
	quantity: integer("quantity"), // Optional quantity/units
	isActive: boolean("is_active").notNull().default(true),
	createdById: uuid("created_by_id").references(() => users.id), // Nullable for existing data
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// User assignments per benefit (providers and releasers)
export const benefitAssignments = pgTable(
	"benefit_assignments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		benefitId: uuid("benefit_id")
			.notNull()
			.references(() => benefits.id),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id),
		role: text("role").notNull(), // 'provider' | 'releaser'
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [unique().on(table.benefitId, table.userId)],
);

// Vouchers - individual voucher instances
export const vouchers = pgTable("vouchers", {
	id: uuid("id").primaryKey().defaultRandom(),
	benefitId: uuid("benefit_id")
		.notNull()
		.references(() => benefits.id),
	personId: uuid("person_id")
		.notNull()
		.references(() => people.id),
	status: text("status").notNull().default("pending"), // pending | released | cancelled
	providedById: uuid("provided_by_id")
		.notNull()
		.references(() => users.id),
	providedAt: timestamp("provided_at").defaultNow(),
	releasedById: uuid("released_by_id").references(() => users.id),
	releasedAt: timestamp("released_at"),
	notes: text("notes"),
	createdAt: timestamp("created_at").defaultNow(),
});

// Relations for query builder
export const peopleRelations = relations(people, ({ many }) => ({
	identifications: many(personIdentifications),
	vouchers: many(vouchers),
}));

export const personIdentificationsRelations = relations(
	personIdentifications,
	({ one }) => ({
		person: one(people, {
			fields: [personIdentifications.personId],
			references: [people.id],
		}),
	}),
);

export const departmentsRelations = relations(departments, ({ many }) => ({
	users: many(users),
	benefits: many(benefits),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
	department: one(departments, {
		fields: [users.departmentId],
		references: [departments.id],
	}),
	benefitAssignments: many(benefitAssignments),
	createdBenefits: many(benefits, { relationName: "createdBenefits" }),
	providedVouchers: many(vouchers, { relationName: "provider" }),
	releasedVouchers: many(vouchers, { relationName: "releaser" }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const benefitsRelations = relations(benefits, ({ one, many }) => ({
	department: one(departments, {
		fields: [benefits.departmentId],
		references: [departments.id],
	}),
	createdBy: one(users, {
		fields: [benefits.createdById],
		references: [users.id],
		relationName: "createdBenefits",
	}),
	assignments: many(benefitAssignments),
	vouchers: many(vouchers),
}));

export const benefitAssignmentsRelations = relations(
	benefitAssignments,
	({ one }) => ({
		benefit: one(benefits, {
			fields: [benefitAssignments.benefitId],
			references: [benefits.id],
		}),
		user: one(users, {
			fields: [benefitAssignments.userId],
			references: [users.id],
		}),
	}),
);

export const vouchersRelations = relations(vouchers, ({ one }) => ({
	benefit: one(benefits, {
		fields: [vouchers.benefitId],
		references: [benefits.id],
	}),
	person: one(people, {
		fields: [vouchers.personId],
		references: [people.id],
	}),
	providedBy: one(users, {
		fields: [vouchers.providedById],
		references: [users.id],
		relationName: "provider",
	}),
	releasedBy: one(users, {
		fields: [vouchers.releasedById],
		references: [users.id],
		relationName: "releaser",
	}),
}));

// Type exports for use in application code
export type DbPerson = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;
export type PersonStatus = "active" | "inactive" | "pending";

export type PersonIdentification = typeof personIdentifications.$inferSelect;
export type NewPersonIdentification = typeof personIdentifications.$inferInsert;

export type IdentificationType =
	| "voter"
	| "philhealth"
	| "sss"
	| "fourPs"
	| "pwd"
	| "soloParent"
	| "pagibig"
	| "tin"
	| "barangayClearance";

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = "superuser" | "admin" | "user";

export type OtpVerification = typeof otpVerifications.$inferSelect;
export type NewOtpVerification = typeof otpVerifications.$inferInsert;
export type OtpType = "phone" | "email";

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Benefit = typeof benefits.$inferSelect;
export type NewBenefit = typeof benefits.$inferInsert;

export type BenefitAssignment = typeof benefitAssignments.$inferSelect;
export type NewBenefitAssignment = typeof benefitAssignments.$inferInsert;
export type BenefitAssignmentRole = "provider" | "releaser";

export type Voucher = typeof vouchers.$inferSelect;
export type NewVoucher = typeof vouchers.$inferInsert;
export type VoucherStatus = "pending" | "released" | "cancelled";
