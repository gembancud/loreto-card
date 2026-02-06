import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, type SQL } from "drizzle-orm";
import { computeChanges, logActivity } from "@/data/audit";
import { db } from "@/db";
import { type UserRole, users } from "@/db/schema";
import { getAppSession, type SessionData } from "@/lib/session";
import { normalizePhoneNumber } from "./otp";

// Helper to verify current user is admin, superuser, or barangay_admin; returns session data
async function requireAdminOrBarangayAdmin(): Promise<SessionData> {
	const session = await getAppSession();
	if (!session.data.userId) {
		throw new Error("Unauthorized: Not authenticated");
	}
	const role = session.data.role;
	if (role !== "admin" && role !== "superuser" && role !== "barangay_admin") {
		throw new Error("Unauthorized: Admin access required");
	}
	return session.data as SessionData;
}

// Helper to verify current user can manage users (superuser or barangay_admin)
async function requireUserManager(): Promise<SessionData> {
	const session = await getAppSession();
	if (!session.data.userId) {
		throw new Error("Unauthorized: Not authenticated");
	}
	const role = session.data.role;
	if (role !== "superuser" && role !== "barangay_admin") {
		throw new Error("Unauthorized: User management access required");
	}
	return session.data as SessionData;
}

export interface UserListItem {
	id: string;
	phoneNumber: string;
	email: string | null;
	firstName: string;
	lastName: string;
	role: UserRole;
	departmentId: string | null;
	departmentName: string | null;
	barangay: string | null;
	isActive: boolean;
	createdAt: Date | null;
}

export const getUsers = createServerFn({ method: "GET" }).handler(
	async (): Promise<UserListItem[]> => {
		const currentUser = await requireAdminOrBarangayAdmin();

		const isSuperuser = currentUser.role === "superuser";
		const isBarangayAdmin = currentUser.role === "barangay_admin";

		let whereClause: SQL | undefined;
		if (isSuperuser) {
			whereClause = undefined;
		} else if (isBarangayAdmin) {
			// Barangay admins see only barangay users in their barangay
			whereClause = currentUser.barangay
				? and(
						eq(users.barangay, currentUser.barangay),
						inArray(users.role, ["barangay_admin", "barangay_user"]),
					)
				: eq(users.id, currentUser.userId);
		} else {
			// Regular admins see users in their department
			whereClause = currentUser.departmentId
				? eq(users.departmentId, currentUser.departmentId)
				: eq(users.id, currentUser.userId);
		}

		const allUsers = await db.query.users.findMany({
			with: { department: true },
			where: whereClause,
			orderBy: (users, { asc }) => [asc(users.lastName), asc(users.firstName)],
		});

		return allUsers.map((user) => ({
			id: user.id,
			phoneNumber: user.phoneNumber,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role as UserRole,
			departmentId: user.departmentId,
			departmentName: user.department?.name ?? null,
			barangay: user.barangay,
			isActive: user.isActive,
			createdAt: user.createdAt,
		}));
	},
);

export const getUserById = createServerFn({ method: "GET" })
	.inputValidator((userId: string) => userId)
	.handler(async ({ data: userId }): Promise<UserListItem | null> => {
		const currentUser = await requireAdminOrBarangayAdmin();

		const isSuperuser = currentUser.role === "superuser";
		const isBarangayAdmin = currentUser.role === "barangay_admin";

		let whereClause: SQL | undefined;
		if (isSuperuser) {
			whereClause = eq(users.id, userId);
		} else if (isBarangayAdmin) {
			whereClause = currentUser.barangay
				? and(eq(users.id, userId), eq(users.barangay, currentUser.barangay))
				: and(eq(users.id, userId), eq(users.id, currentUser.userId));
		} else {
			whereClause = currentUser.departmentId
				? and(
						eq(users.id, userId),
						eq(users.departmentId, currentUser.departmentId),
					)
				: and(eq(users.id, userId), eq(users.id, currentUser.userId));
		}

		const user = await db.query.users.findFirst({
			with: { department: true },
			where: whereClause,
		});

		if (!user) return null;

		return {
			id: user.id,
			phoneNumber: user.phoneNumber,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role as UserRole,
			departmentId: user.departmentId,
			departmentName: user.department?.name ?? null,
			barangay: user.barangay,
			isActive: user.isActive,
			createdAt: user.createdAt,
		};
	});

interface CreateUserInput {
	phoneNumber: string;
	email?: string;
	firstName: string;
	lastName: string;
	role: UserRole;
	departmentId?: string;
	barangay?: string;
}

export const createUser = createServerFn({ method: "POST" })
	.inputValidator((data: CreateUserInput) => data)
	.handler(
		async ({
			data,
		}): Promise<{ success: boolean; error?: string; user?: UserListItem }> => {
			const currentUser = await requireUserManager();

			const isBarangayAdmin = currentUser.role === "barangay_admin";

			// Barangay admins can only create barangay_user in their own barangay
			if (isBarangayAdmin) {
				if (data.role !== "barangay_user") {
					return {
						success: false,
						error: "You can only create barangay users",
					};
				}
				// Force barangay to match the admin's own barangay
				data.barangay = currentUser.barangay ?? undefined;
			}

			const normalizedPhone = normalizePhoneNumber(data.phoneNumber);

			// Check if phone number already exists
			const existing = await db.query.users.findFirst({
				where: eq(users.phoneNumber, normalizedPhone),
			});

			if (existing) {
				return { success: false, error: "Phone number already registered" };
			}

			// Normalize and validate email if provided
			const normalizedEmail = data.email?.trim().toLowerCase() || null;
			if (normalizedEmail) {
				const existingEmail = await db.query.users.findFirst({
					where: eq(users.email, normalizedEmail),
				});
				if (existingEmail) {
					return { success: false, error: "Email already registered" };
				}
			}

			const [newUser] = await db
				.insert(users)
				.values({
					phoneNumber: normalizedPhone,
					email: normalizedEmail,
					firstName: data.firstName,
					lastName: data.lastName,
					role: data.role,
					departmentId: data.departmentId ?? null,
					barangay: data.barangay ?? null,
				})
				.returning();

			// Fetch with department to get the name
			const userWithDept = await db.query.users.findFirst({
				with: { department: true },
				where: eq(users.id, newUser.id),
			});

			// Log activity
			await logActivity({
				data: {
					action: "create",
					entityType: "user",
					entityId: newUser.id,
					entityName: `${data.firstName} ${data.lastName}`,
				},
			});

			return {
				success: true,
				user: {
					id: newUser.id,
					phoneNumber: newUser.phoneNumber,
					email: newUser.email,
					firstName: newUser.firstName,
					lastName: newUser.lastName,
					role: newUser.role as UserRole,
					departmentId: newUser.departmentId,
					departmentName: userWithDept?.department?.name ?? null,
					barangay: newUser.barangay,
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
		email?: string | null;
		firstName?: string;
		lastName?: string;
		role?: UserRole;
		departmentId?: string | null;
		barangay?: string | null;
		isActive?: boolean;
	};
}

export const updateUser = createServerFn({ method: "POST" })
	.inputValidator((data: UpdateUserInput) => data)
	.handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
		const currentUser = await requireUserManager();

		const { userId, updates } = data;
		const isBarangayAdmin = currentUser.role === "barangay_admin";

		// Get target user to check they exist
		const targetUser = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (!targetUser) {
			return { success: false, error: "User not found" };
		}

		// Barangay admin restrictions
		if (isBarangayAdmin) {
			// Can only edit barangay_user in their own barangay
			if (
				targetUser.role !== "barangay_user" ||
				targetUser.barangay !== currentUser.barangay
			) {
				return {
					success: false,
					error: "You can only edit barangay users in your barangay",
				};
			}
			// Cannot change role to anything other than barangay_user
			if (updates.role && updates.role !== "barangay_user") {
				return {
					success: false,
					error: "You can only assign the barangay user role",
				};
			}
			// Cannot change barangay assignment
			if (updates.barangay !== undefined) {
				delete updates.barangay;
			}
			// Cannot change department
			if (updates.departmentId !== undefined) {
				delete updates.departmentId;
			}
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

		// If updating email, normalize and check for duplicates
		if (updates.email !== undefined) {
			const normalizedEmail = updates.email?.trim().toLowerCase() || null;
			if (normalizedEmail) {
				const existingEmail = await db.query.users.findFirst({
					where: eq(users.email, normalizedEmail),
				});

				if (existingEmail && existingEmail.id !== userId) {
					return {
						success: false,
						error: "Email already registered to another user",
					};
				}
			}
			updates.email = normalizedEmail;
		}

		await db
			.update(users)
			.set({
				...updates,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));

		// Log activity with changes
		const changes = computeChanges(
			targetUser as Record<string, unknown>,
			updates as Record<string, unknown>,
		);
		await logActivity({
			data: {
				action: "update",
				entityType: "user",
				entityId: userId,
				entityName: `${targetUser.firstName} ${targetUser.lastName}`,
				changes,
			},
		});

		return { success: true };
	});

export const deleteUser = createServerFn({ method: "POST" })
	.inputValidator((userId: string) => userId)
	.handler(
		async ({ data: userId }): Promise<{ success: boolean; error?: string }> => {
			const currentUser = await requireUserManager();

			const isBarangayAdmin = currentUser.role === "barangay_admin";

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

			// Barangay admin can only deactivate barangay_user in their barangay
			if (isBarangayAdmin) {
				if (
					user.role !== "barangay_user" ||
					user.barangay !== currentUser.barangay
				) {
					return {
						success: false,
						error: "You can only deactivate barangay users in your barangay",
					};
				}
			}

			// Soft delete by deactivating instead of hard delete
			await db
				.update(users)
				.set({ isActive: false, updatedAt: new Date() })
				.where(eq(users.id, userId));

			// Log activity
			await logActivity({
				data: {
					action: "deactivate",
					entityType: "user",
					entityId: userId,
					entityName: `${user.firstName} ${user.lastName}`,
				},
			});

			return { success: true };
		},
	);
