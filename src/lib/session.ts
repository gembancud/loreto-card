import { useSession } from "@tanstack/react-start/server";
import type { UserRole } from "@/db/schema";

export interface SessionData {
	userId: string;
	phoneNumber: string;
	firstName: string;
	lastName: string;
	role: UserRole;
	departmentId: string | null;
}

export function getAppSession() {
	return useSession<SessionData>({
		name: "loreto-session",
		password:
			process.env.SESSION_SECRET ??
			"default-dev-secret-change-in-production-32chars",
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 7, // 7 days
		},
	});
}
