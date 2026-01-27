import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
	type AuditAction,
	type AuditEntityType,
	auditLogs,
	type UserRole,
	users,
} from "@/db/schema";
import { getAppSession, type SessionData } from "@/lib/session";

// Helper to get current authenticated user
async function requireAuth(): Promise<SessionData> {
	const session = await getAppSession();
	if (!session.data.userId) {
		throw new Error("Unauthorized: Not authenticated");
	}
	return session.data as SessionData;
}

// Change tracking types - using simple Record for JSON serialization compatibility
export type ChangesRecord = Record<
	string,
	{
		old: string | number | boolean | null;
		new: string | number | boolean | null;
	}
>;

// Normalize value to a JSON-serializable primitive or stringified object
function normalizeValue(val: unknown): string | number | boolean | null {
	if (val === undefined || val === null) return null;
	if (
		typeof val === "string" ||
		typeof val === "number" ||
		typeof val === "boolean"
	)
		return val;
	// For objects/arrays, stringify them
	return JSON.stringify(val);
}

// Compute changes between old and new values for update operations
export function computeChanges(
	oldValues: Record<string, unknown>,
	newValues: Record<string, unknown>,
	fieldsToTrack?: string[],
): ChangesRecord | null {
	const changes: ChangesRecord = {};
	const fields = fieldsToTrack ?? Object.keys(newValues);

	for (const field of fields) {
		if (!(field in newValues)) continue;

		const oldVal = oldValues[field];
		const newVal = newValues[field];

		// Skip if values are the same (handle null/undefined equivalence)
		const oldNormalized = normalizeValue(oldVal);
		const newNormalized = normalizeValue(newVal);

		if (oldNormalized !== newNormalized) {
			changes[field] = {
				old: oldNormalized,
				new: newNormalized,
			};
		}
	}

	return Object.keys(changes).length > 0 ? changes : null;
}

// Core function to insert audit log entries
export interface LogActivityInput {
	action: AuditAction;
	entityType: AuditEntityType;
	entityId: string;
	entityName?: string;
	changes?: ChangesRecord | null;
}

export const logActivity = createServerFn({ method: "POST" })
	.inputValidator((data: LogActivityInput) => data)
	.handler(async ({ data: input }): Promise<void> => {
		const session = await getAppSession();

		// Skip logging if no user session (shouldn't happen in normal use)
		if (!session.data.userId) {
			console.warn("Attempted to log activity without user session");
			return;
		}

		// Get actor details for denormalization
		const actor = await db.query.users.findFirst({
			with: { department: true },
			where: eq(users.id, session.data.userId),
		});

		if (!actor) {
			console.warn("Could not find actor user for audit log");
			return;
		}

		await db.insert(auditLogs).values({
			actorId: actor.id,
			actorName: `${actor.firstName} ${actor.lastName}`,
			actorRole: actor.role,
			actorDepartmentId: actor.departmentId,
			actorDepartmentName: actor.department?.name ?? null,
			action: input.action,
			entityType: input.entityType,
			entityId: input.entityId,
			entityName: input.entityName ?? null,
			changes: input.changes ?? null,
		});
	});

// Audit log list item for UI
export interface AuditLogListItem {
	id: string;
	actorId: string;
	actorName: string;
	actorRole: UserRole;
	actorDepartmentId: string | null;
	actorDepartmentName: string | null;
	action: AuditAction;
	entityType: AuditEntityType;
	entityId: string;
	entityName: string | null;
	changes: ChangesRecord | null;
	createdAt: Date;
}

// Query audit logs with permission filtering + pagination
interface GetAuditLogsInput {
	entityType?: AuditEntityType;
	startDate?: string; // ISO date string
	endDate?: string; // ISO date string
	page?: number;
	pageSize?: number;
}

export const getAuditLogs = createServerFn({ method: "GET" })
	.inputValidator((data: GetAuditLogsInput) => data)
	.handler(
		async ({
			data,
		}): Promise<{
			logs: AuditLogListItem[];
			total: number;
			page: number;
			pageSize: number;
			totalPages: number;
		}> => {
			const currentUser = await requireAuth();

			const page = data.page ?? 1;
			const pageSize = data.pageSize ?? 20;
			const offset = (page - 1) * pageSize;

			// Build permission filter based on role
			// - Superuser: No filter (sees all)
			// - Admin: Filter by actorDepartmentId = currentUser.departmentId AND actorRole IN ('admin', 'user')
			// - User: Filter by actorDepartmentId = currentUser.departmentId AND actorRole = 'user'
			const permissionConditions = [];

			if (currentUser.role === "superuser") {
				// Superuser sees all - no permission filter
			} else if (currentUser.role === "admin") {
				// Admin sees admin and user activities in their department
				if (currentUser.departmentId) {
					permissionConditions.push(
						and(
							eq(auditLogs.actorDepartmentId, currentUser.departmentId),
							or(
								eq(auditLogs.actorRole, "admin"),
								eq(auditLogs.actorRole, "user"),
							),
						),
					);
				} else {
					// Admin without department only sees their own activities
					permissionConditions.push(eq(auditLogs.actorId, currentUser.userId));
				}
			} else {
				// Regular user sees only user activities in their department
				if (currentUser.departmentId) {
					permissionConditions.push(
						and(
							eq(auditLogs.actorDepartmentId, currentUser.departmentId),
							eq(auditLogs.actorRole, "user"),
						),
					);
				} else {
					// User without department only sees their own activities
					permissionConditions.push(eq(auditLogs.actorId, currentUser.userId));
				}
			}

			// Build additional filters
			const filterConditions = [];

			if (data.entityType) {
				filterConditions.push(eq(auditLogs.entityType, data.entityType));
			}

			if (data.startDate) {
				filterConditions.push(
					sql`${auditLogs.createdAt} >= ${new Date(data.startDate)}`,
				);
			}

			if (data.endDate) {
				// Add 1 day to include the end date fully
				const endDatePlusOne = new Date(data.endDate);
				endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
				filterConditions.push(sql`${auditLogs.createdAt} < ${endDatePlusOne}`);
			}

			// Combine all conditions
			const allConditions = [...permissionConditions, ...filterConditions];
			const whereClause =
				allConditions.length > 0 ? and(...allConditions) : undefined;

			// Get total count
			const [countResult] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(auditLogs)
				.where(whereClause);

			const total = countResult?.count ?? 0;

			// Get paginated logs
			const logs = await db.query.auditLogs.findMany({
				where: whereClause,
				orderBy: [desc(auditLogs.createdAt)],
				limit: pageSize,
				offset,
			});

			return {
				logs: logs.map((log) => ({
					id: log.id,
					actorId: log.actorId,
					actorName: log.actorName,
					actorRole: log.actorRole as UserRole,
					actorDepartmentId: log.actorDepartmentId,
					actorDepartmentName: log.actorDepartmentName,
					action: log.action as AuditAction,
					entityType: log.entityType as AuditEntityType,
					entityId: log.entityId,
					entityName: log.entityName,
					changes: log.changes as ChangesRecord | null,
					createdAt: log.createdAt,
				})),
				total,
				page,
				pageSize,
				totalPages: Math.ceil(total / pageSize),
			};
		},
	);

// Get history for a specific entity
interface GetEntityHistoryInput {
	entityType: AuditEntityType;
	entityId: string;
	limit?: number;
}

export const getEntityHistory = createServerFn({ method: "GET" })
	.inputValidator((data: GetEntityHistoryInput) => data)
	.handler(async ({ data }): Promise<AuditLogListItem[]> => {
		const currentUser = await requireAuth();

		const limit = data.limit ?? 10;

		// Build permission filter (same logic as getAuditLogs)
		const permissionConditions = [];

		if (currentUser.role === "superuser") {
			// Superuser sees all
		} else if (currentUser.role === "admin") {
			if (currentUser.departmentId) {
				permissionConditions.push(
					and(
						eq(auditLogs.actorDepartmentId, currentUser.departmentId),
						or(
							eq(auditLogs.actorRole, "admin"),
							eq(auditLogs.actorRole, "user"),
						),
					),
				);
			} else {
				permissionConditions.push(eq(auditLogs.actorId, currentUser.userId));
			}
		} else {
			if (currentUser.departmentId) {
				permissionConditions.push(
					and(
						eq(auditLogs.actorDepartmentId, currentUser.departmentId),
						eq(auditLogs.actorRole, "user"),
					),
				);
			} else {
				permissionConditions.push(eq(auditLogs.actorId, currentUser.userId));
			}
		}

		// Entity filter
		const entityConditions = [
			eq(auditLogs.entityType, data.entityType),
			eq(auditLogs.entityId, data.entityId),
		];

		const allConditions = [...permissionConditions, ...entityConditions];
		const whereClause = and(...allConditions);

		const logs = await db.query.auditLogs.findMany({
			where: whereClause,
			orderBy: [desc(auditLogs.createdAt)],
			limit,
		});

		return logs.map((log) => ({
			id: log.id,
			actorId: log.actorId,
			actorName: log.actorName,
			actorRole: log.actorRole as UserRole,
			actorDepartmentId: log.actorDepartmentId,
			actorDepartmentName: log.actorDepartmentName,
			action: log.action as AuditAction,
			entityType: log.entityType as AuditEntityType,
			entityId: log.entityId,
			entityName: log.entityName,
			changes: log.changes as ChangesRecord | null,
			createdAt: log.createdAt,
		}));
	});
