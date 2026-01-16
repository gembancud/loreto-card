import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { type UserRole, users } from "@/db/schema";
import { getAppSession } from "@/lib/session";
import { normalizePhoneNumber } from "./otp";

// Helper to verify current user is superuser
async function requireSuperuser(): Promise<void> {
	const session = await getAppSession();
	if (!session.data.userId || session.data.role !== "superuser") {
		throw new Error("Unauthorized: Superuser access required");
	}
}

// Helper to verify current user is admin or superuser
async function requireAdmin(): Promise<void> {
	const session = await getAppSession();
	if (!session.data.userId) {
		throw new Error("Unauthorized: Not authenticated");
	}
	if (session.data.role !== "admin" && session.data.role !== "superuser") {
		throw new Error("Unauthorized: Admin access required");
	}
}

export interface UserListItem {
	id: string;
	phoneNumber: string;
	firstName: string;
	lastName: string;
	role: UserRole;
	isActive: boolean;
	createdAt: Date | null;
}

export const getUsers = createServerFn({ method: "GET" }).handler(
	async (): Promise<UserListItem[]> => {
		await requireAdmin();

		const allUsers = await db.query.users.findMany({
			orderBy: (users, { asc }) => [asc(users.lastName), asc(users.firstName)],
		});

		return allUsers.map((user) => ({
			id: user.id,
			phoneNumber: user.phoneNumber,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role as UserRole,
			isActive: user.isActive,
			createdAt: user.createdAt,
		}));
	},
);

export const getUserById = createServerFn({ method: "GET" })
	.inputValidator((userId: string) => userId)
	.handler(async ({ data: userId }): Promise<UserListItem | null> => {
		await requireAdmin();

		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (!user) return null;

		return {
			id: user.id,
			phoneNumber: user.phoneNumber,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role as UserRole,
			isActive: user.isActive,
			createdAt: user.createdAt,
		};
	});

interface CreateUserInput {
	phoneNumber: string;
	firstName: string;
	lastName: string;
	role: UserRole;
}

export const createUser = createServerFn({ method: "POST" })
	.inputValidator((data: CreateUserInput) => data)
	.handler(
		async ({
			data,
		}): Promise<{ success: boolean; error?: string; user?: UserListItem }> => {
			await requireSuperuser();

			const normalizedPhone = normalizePhoneNumber(data.phoneNumber);

			// Check if phone number already exists
			const existing = await db.query.users.findFirst({
				where: eq(users.phoneNumber, normalizedPhone),
			});

			if (existing) {
				return { success: false, error: "Phone number already registered" };
			}

			const [newUser] = await db
				.insert(users)
				.values({
					phoneNumber: normalizedPhone,
					firstName: data.firstName,
					lastName: data.lastName,
					role: data.role,
				})
				.returning();

			return {
				success: true,
				user: {
					id: newUser.id,
					phoneNumber: newUser.phoneNumber,
					firstName: newUser.firstName,
					lastName: newUser.lastName,
					role: newUser.role as UserRole,
					isActive: newUser.isActive,
					createdAt: newUser.createdAt,
				},
			};
		},
	);

interface UpdateUserInput {
	userId: string;
	updates: {
		phoneNumber?: string;
		firstName?: string;
		lastName?: string;
		role?: UserRole;
		isActive?: boolean;
	};
}

export const updateUser = createServerFn({ method: "POST" })
	.inputValidator((data: UpdateUserInput) => data)
	.handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
		await requireSuperuser();

		const { userId, updates } = data;

		// Get current user to check they exist
		const currentUser = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (!currentUser) {
			return { success: false, error: "User not found" };
		}

		// If updating phone number, normalize and check for duplicates
		if (updates.phoneNumber) {
			const normalizedPhone = normalizePhoneNumber(updates.phoneNumber);
			const existing = await db.query.users.findFirst({
				where: eq(users.phoneNumber, normalizedPhone),
			});

			if (existing && existing.id !== userId) {
				return {
					success: false,
					error: "Phone number already registered to another user",
				};
			}

			updates.phoneNumber = normalizedPhone;
		}

		await db
			.update(users)
			.set({
				...updates,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));

		return { success: true };
	});

export const deleteUser = createServerFn({ method: "POST" })
	.inputValidator((userId: string) => userId)
	.handler(
		async ({ data: userId }): Promise<{ success: boolean; error?: string }> => {
			await requireSuperuser();

			// Get current session to prevent self-deletion
			const session = await getAppSession();
			if (session.data.userId === userId) {
				return { success: false, error: "Cannot delete your own account" };
			}

			const user = await db.query.users.findFirst({
				where: eq(users.id, userId),
			});

			if (!user) {
				return { success: false, error: "User not found" };
			}

			// Soft delete by deactivating instead of hard delete
			await db
				.update(users)
				.set({ isActive: false, updatedAt: new Date() })
				.where(eq(users.id, userId));

			return { success: true };
		},
	);
