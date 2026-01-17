import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
	type BenefitAssignmentRole,
	benefitAssignments,
	benefits,
	users,
} from "@/db/schema";
import { getAppSession, type SessionData } from "@/lib/session";

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

export interface BenefitAssignmentItem {
	id: string;
	userId: string;
	userName: string;
	role: BenefitAssignmentRole;
}

export interface BenefitListItem {
	id: string;
	departmentId: string;
	departmentName: string | null;
	name: string;
	description: string | null;
	valuePesos: number | null;
	quantity: number | null;
	isActive: boolean;
	createdAt: Date | null;
	providers: BenefitAssignmentItem[];
	releasers: BenefitAssignmentItem[];
}

// Get benefits for user's department (admin sees own dept, superuser sees all)
export const getBenefits = createServerFn({ method: "GET" }).handler(
	async (): Promise<BenefitListItem[]> => {
		const currentUser = await requireAdmin();
		const isSuperuser = currentUser.role === "superuser";

		const allBenefits = await db.query.benefits.findMany({
			with: {
				department: true,
				assignments: {
					with: {
						user: true,
					},
				},
			},
			where: isSuperuser
				? undefined
				: currentUser.departmentId
					? eq(benefits.departmentId, currentUser.departmentId)
					: undefined,
			orderBy: (benefits, { asc }) => [asc(benefits.name)],
		});

		return allBenefits.map((benefit) => ({
			id: benefit.id,
			departmentId: benefit.departmentId,
			departmentName: benefit.department?.name ?? null,
			name: benefit.name,
			description: benefit.description,
			valuePesos: benefit.valuePesos,
			quantity: benefit.quantity,
			isActive: benefit.isActive,
			createdAt: benefit.createdAt,
			providers: benefit.assignments
				.filter((a) => a.role === "provider")
				.map((a) => ({
					id: a.id,
					userId: a.userId,
					userName: `${a.user.firstName} ${a.user.lastName}`,
					role: a.role as BenefitAssignmentRole,
				})),
			releasers: benefit.assignments
				.filter((a) => a.role === "releaser")
				.map((a) => ({
					id: a.id,
					userId: a.userId,
					userName: `${a.user.firstName} ${a.user.lastName}`,
					role: a.role as BenefitAssignmentRole,
				})),
		}));
	},
);

export const getBenefitById = createServerFn({ method: "GET" })
	.inputValidator((benefitId: string) => benefitId)
	.handler(async ({ data: benefitId }): Promise<BenefitListItem | null> => {
		const currentUser = await requireAdmin();
		const isSuperuser = currentUser.role === "superuser";

		const benefit = await db.query.benefits.findFirst({
			with: {
				department: true,
				assignments: {
					with: {
						user: true,
					},
				},
			},
			where: isSuperuser
				? eq(benefits.id, benefitId)
				: currentUser.departmentId
					? and(
							eq(benefits.id, benefitId),
							eq(benefits.departmentId, currentUser.departmentId),
						)
					: eq(benefits.id, benefitId),
		});

		if (!benefit) return null;

		return {
			id: benefit.id,
			departmentId: benefit.departmentId,
			departmentName: benefit.department?.name ?? null,
			name: benefit.name,
			description: benefit.description,
			valuePesos: benefit.valuePesos,
			quantity: benefit.quantity,
			isActive: benefit.isActive,
			createdAt: benefit.createdAt,
			providers: benefit.assignments
				.filter((a) => a.role === "provider")
				.map((a) => ({
					id: a.id,
					userId: a.userId,
					userName: `${a.user.firstName} ${a.user.lastName}`,
					role: a.role as BenefitAssignmentRole,
				})),
			releasers: benefit.assignments
				.filter((a) => a.role === "releaser")
				.map((a) => ({
					id: a.id,
					userId: a.userId,
					userName: `${a.user.firstName} ${a.user.lastName}`,
					role: a.role as BenefitAssignmentRole,
				})),
		};
	});

interface CreateBenefitInput {
	name: string;
	description?: string;
	valuePesos?: number;
	quantity?: number;
	departmentId?: string; // Only superusers can set this
	providerIds: string[];
	releaserIds: string[];
}

export const createBenefit = createServerFn({ method: "POST" })
	.inputValidator((data: CreateBenefitInput) => data)
	.handler(
		async ({
			data,
		}): Promise<{ success: boolean; error?: string; benefit?: BenefitListItem }> => {
			const currentUser = await requireAdmin();
			const isSuperuser = currentUser.role === "superuser";

			// Determine department - superusers can specify, admins use their own
			const departmentId = isSuperuser
				? data.departmentId || currentUser.departmentId
				: currentUser.departmentId;

			if (!departmentId) {
				return { success: false, error: "Department is required" };
			}

			// Validate that assigned users are in the same department (for admins)
			if (!isSuperuser) {
				const allUserIds = [...data.providerIds, ...data.releaserIds];
				if (allUserIds.length > 0) {
					const assignedUsers = await db.query.users.findMany({
						where: inArray(users.id, allUserIds),
					});

					const invalidUsers = assignedUsers.filter(
						(u) => u.departmentId !== departmentId,
					);
					if (invalidUsers.length > 0) {
						return {
							success: false,
							error: "Can only assign users from your department",
						};
					}
				}
			}

			// Create benefit
			const [newBenefit] = await db
				.insert(benefits)
				.values({
					name: data.name,
					description: data.description ?? null,
					valuePesos: data.valuePesos ?? null,
					quantity: data.quantity ?? null,
					departmentId,
				})
				.returning();

			// Create assignments
			const assignments = [
				...data.providerIds.map((userId) => ({
					benefitId: newBenefit.id,
					userId,
					role: "provider" as const,
				})),
				...data.releaserIds.map((userId) => ({
					benefitId: newBenefit.id,
					userId,
					role: "releaser" as const,
				})),
			];

			if (assignments.length > 0) {
				await db.insert(benefitAssignments).values(assignments);
			}

			// Fetch the complete benefit
			const createdBenefit = await getBenefitById({ data: newBenefit.id });

			return {
				success: true,
				benefit: createdBenefit ?? undefined,
			};
		},
	);

interface UpdateBenefitInput {
	benefitId: string;
	updates: {
		name?: string;
		description?: string | null;
		valuePesos?: number | null;
		quantity?: number | null;
		isActive?: boolean;
	};
	providerIds?: string[];
	releaserIds?: string[];
}

export const updateBenefit = createServerFn({ method: "POST" })
	.inputValidator((data: UpdateBenefitInput) => data)
	.handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
		const currentUser = await requireAdmin();
		const isSuperuser = currentUser.role === "superuser";

		const { benefitId, updates, providerIds, releaserIds } = data;

		// Verify benefit exists and user has access
		const existingBenefit = await db.query.benefits.findFirst({
			where: isSuperuser
				? eq(benefits.id, benefitId)
				: currentUser.departmentId
					? and(
							eq(benefits.id, benefitId),
							eq(benefits.departmentId, currentUser.departmentId),
						)
					: eq(benefits.id, benefitId),
		});

		if (!existingBenefit) {
			return { success: false, error: "Benefit not found" };
		}

		// Validate new user assignments (for admins)
		if (!isSuperuser) {
			const allUserIds = [
				...(providerIds ?? []),
				...(releaserIds ?? []),
			];
			if (allUserIds.length > 0) {
				const assignedUsers = await db.query.users.findMany({
					where: inArray(users.id, allUserIds),
				});

				const invalidUsers = assignedUsers.filter(
					(u) => u.departmentId !== existingBenefit.departmentId,
				);
				if (invalidUsers.length > 0) {
					return {
						success: false,
						error: "Can only assign users from the benefit's department",
					};
				}
			}
		}

		// Update benefit
		if (Object.keys(updates).length > 0) {
			await db
				.update(benefits)
				.set({
					...updates,
					updatedAt: new Date(),
				})
				.where(eq(benefits.id, benefitId));
		}

		// Update assignments if provided
		if (providerIds !== undefined || releaserIds !== undefined) {
			// Remove existing assignments
			await db
				.delete(benefitAssignments)
				.where(eq(benefitAssignments.benefitId, benefitId));

			// Add new assignments
			const assignments = [
				...(providerIds ?? []).map((userId) => ({
					benefitId,
					userId,
					role: "provider" as const,
				})),
				...(releaserIds ?? []).map((userId) => ({
					benefitId,
					userId,
					role: "releaser" as const,
				})),
			];

			if (assignments.length > 0) {
				await db.insert(benefitAssignments).values(assignments);
			}
		}

		return { success: true };
	});

export const deactivateBenefit = createServerFn({ method: "POST" })
	.inputValidator((benefitId: string) => benefitId)
	.handler(
		async ({ data: benefitId }): Promise<{ success: boolean; error?: string }> => {
			const currentUser = await requireAdmin();
			const isSuperuser = currentUser.role === "superuser";

			// Verify benefit exists and user has access
			const existingBenefit = await db.query.benefits.findFirst({
				where: isSuperuser
					? eq(benefits.id, benefitId)
					: currentUser.departmentId
						? and(
								eq(benefits.id, benefitId),
								eq(benefits.departmentId, currentUser.departmentId),
							)
						: eq(benefits.id, benefitId),
			});

			if (!existingBenefit) {
				return { success: false, error: "Benefit not found" };
			}

			await db
				.update(benefits)
				.set({ isActive: false, updatedAt: new Date() })
				.where(eq(benefits.id, benefitId));

			return { success: true };
		},
	);

// Get users in a department for assignment dropdowns
export const getDepartmentUsersForAssignment = createServerFn({ method: "GET" })
	.inputValidator((departmentId: string | undefined) => departmentId)
	.handler(
		async ({
			data: departmentId,
		}): Promise<Array<{ id: string; name: string }>> => {
			const currentUser = await requireAdmin();
			const isSuperuser = currentUser.role === "superuser";

			// Admins can only get users from their own department
			const targetDeptId = isSuperuser
				? departmentId || currentUser.departmentId
				: currentUser.departmentId;

			if (!targetDeptId) {
				return [];
			}

			const deptUsers = await db.query.users.findMany({
				where: and(
					eq(users.departmentId, targetDeptId),
					eq(users.isActive, true),
				),
				orderBy: (users, { asc }) => [asc(users.lastName), asc(users.firstName)],
			});

			return deptUsers.map((u) => ({
				id: u.id,
				name: `${u.firstName} ${u.lastName}`,
			}));
		},
	);
