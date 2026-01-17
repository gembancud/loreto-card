import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { type UserRole, users } from "@/db/schema";
import { getAppSession, type SessionData } from "@/lib/session";
import { normalizePhoneNumber } from "./otp";

// Helper to verify current user is superuser
async function requireSuperuser(): Promise<void> {
	const session = await getAppSession();
	if (!session.data.userId || session.data.role !== "superuser") {
		throw new Error("Unauthorized: Superuser access required");
	}
}

// Helper to verify current user is admin or superuser, returns session data
async function requireAdmin(): Promise<SessionData> {
	const session = await getAppSession();
	if (!session.data.userId) {
		throw new Error("Unauthorized: Not authenticated");
	}
	if (session.data.role !== "admin" && session.data.role !== "superuser") {
		throw new Error("Unauthorized: Admin access required");
	}
	return session.data as SessionData;
}

export interface UserListItem {
	id: string;
	phoneNumber: string;
	firstName: string;
	lastName: string;
	role: UserRole;
	departmentId: string | null;
	departmentName: string | null;
	isActive: boolean;
	createdAt: Date | null;
}

export const getUsers = createServerFn({ method: "GET" }).handler(
	async (): Promise<UserListItem[]> => {
		const currentUser = await requireAdmin();

		// Superusers see all users, admins only see users in their department
		const isSuperuser = currentUser.role === "superuser";

		const allUsers = await db.query.users.findMany({
			with: { department: true },
			where: isSuperuser
				? undefined
				: currentUser.departmentId
					? eq(users.departmentId, currentUser.departmentId)
					: eq(users.id, currentUser.userId), // Admin with no dept only sees themselves
			orderBy: (users, { asc }) => [asc(users.lastName), asc(users.firstName)],
		});

		return allUsers.map((user) => ({
			id: user.id,
			phoneNumber: user.phoneNumber,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role as UserRole,
			departmentId: user.departmentId,
			departmentName: user.department?.name ?? null,
			isActive: user.isActive,
			createdAt: user.createdAt,
		}));
	},
);

export const getUserById = createServerFn({ method: "GET" })
	.inputValidator((userId: string) => userId)
	.handler(async ({ data: userId }): Promise<UserListItem | null> => {
		const currentUser = await requireAdmin();

		// Superusers can view any user, admins can only view users in their department
		const isSuperuser = currentUser.role === "superuser";

		const user = await db.query.users.findFirst({
			with: { department: true },
			where: isSuperuser
				? eq(users.id, userId)
				: currentUser.departmentId
					? and(
							eq(users.id, userId),
							eq(users.departmentId, currentUser.departmentId),
						)
					: and(eq(users.id, userId), eq(users.id, currentUser.userId)),
		});

		if (!user) return null;

		return {
			id: user.id,
			phoneNumber: user.phoneNumber,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role as UserRole,
			departmentId: user.departmentId,
			departmentName: user.department?.name ?? null,
			isActive: user.isActive,
			createdAt: user.createdAt,
		};
	});

interface CreateUserInput {
	phoneNumber: string;
	firstName: string;
	lastName: string;
	role: UserRole;
	departmentId?: string;
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
					departmentId: data.departmentId ?? null,
				})
				.returning();

			// Fetch with department to get the name
			const userWithDept = await db.query.users.findFirst({
				with: { department: true },
				where: eq(users.id, newUser.id),
			});

			return {
				success: true,
				user: {
					id: newUser.id,
					phoneNumber: newUser.phoneNumber,
					firstName: newUser.firstName,
					lastName: newUser.lastName,
					role: newUser.role as UserRole,
					departmentId: newUser.departmentId,
					departmentName: userWithDept?.department?.name ?? null,
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
		departmentId?: string | null;
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
