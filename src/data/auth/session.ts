import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { type UserRole, users } from "@/db/schema";
import { getAppSession, type SessionData } from "@/lib/session";

export interface AuthenticatedUser {
	id: string;
	phoneNumber: string;
	firstName: string;
	lastName: string;
	role: UserRole;
	isActive: boolean;
}

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
	async (): Promise<AuthenticatedUser | null> => {
		const session = await getAppSession();
		const userId = session.data.userId;

		if (!userId) {
			return null;
		}

		// Verify user still exists and is active
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (!user || !user.isActive) {
			// Clear invalid session
			await session.clear();
			return null;
		}

		return {
			id: user.id,
			phoneNumber: user.phoneNumber,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role as UserRole,
			isActive: user.isActive,
		};
	},
);

export const getSessionData = createServerFn({ method: "GET" }).handler(
	async (): Promise<SessionData | null> => {
		const session = await getAppSession();
		if (!session.data.userId) {
			return null;
		}
		return session.data as SessionData;
	},
);

export const logout = createServerFn({ method: "POST" }).handler(async () => {
	const session = await getAppSession();
	await session.clear();
	return { success: true };
});

// Helper to check if user has required role
export function hasRole(
	user: AuthenticatedUser | null,
	requiredRoles: UserRole[],
): boolean {
	if (!user) return false;
	return requiredRoles.includes(user.role);
}

// Helper to check if user is admin or superuser
export function isAdmin(user: AuthenticatedUser | null): boolean {
	return hasRole(user, ["admin", "superuser"]);
}

// Helper to check if user is superuser
export function isSuperuser(user: AuthenticatedUser | null): boolean {
	return hasRole(user, ["superuser"]);
}
