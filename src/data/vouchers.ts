import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
	type BenefitAssignmentRole,
	type BenefitEligibility,
	benefitAssignments,
	benefits,
	type IdentificationType,
	people,
	personIdentifications,
	type VoucherStatus,
	vouchers,
} from "@/db/schema";
import { getAppSession, type SessionData } from "@/lib/session";
import { logActivity } from "./audit";
import type { LoretoBarangay } from "./barangays";

// Helper to get current authenticated user
async function requireAuth(): Promise<SessionData> {
	const session = await getAppSession();
	if (!session.data.userId) {
		throw new Error("Unauthorized: Not authenticated");
	}
	return session.data as SessionData;
}

// Helper to verify current user is admin or superuser
async function requireAdmin(): Promise<SessionData> {
	const session = await getAppSession();
	if (!session.data.userId) {
		throw new Error("Unauthorized: Not authenticated");
	}
	if (
		session.data.role !== "department_admin" &&
		session.data.role !== "superuser"
	) {
		throw new Error("Unauthorized: Admin access required");
	}
	return session.data as SessionData;
}

export interface AssignedBenefitItem {
	id: string;
	name: string;
	description: string | null;
	valuePesos: number | null;
	quantity: number | null;
	departmentName: string | null;
	role: BenefitAssignmentRole;
}

// Get benefits where current user is assigned as provider or releaser
export const getMyAssignedBenefits = createServerFn({ method: "GET" }).handler(
	async (): Promise<AssignedBenefitItem[]> => {
		const currentUser = await requireAuth();

		const assignments = await db.query.benefitAssignments.findMany({
			with: {
				benefit: {
					with: {
						department: true,
					},
				},
			},
			where: and(
				eq(benefitAssignments.userId, currentUser.userId),
				// Only get active benefits
			),
		});

		// Filter to only include active benefits
		return assignments
			.filter((a) => a.benefit.isActive)
			.map((a) => ({
				id: a.benefit.id,
				name: a.benefit.name,
				description: a.benefit.description,
				valuePesos: a.benefit.valuePesos,
				quantity: a.benefit.quantity,
				departmentName: a.benefit.department?.name ?? null,
				role: a.role as BenefitAssignmentRole,
			}));
	},
);

export interface VoucherListItem {
	id: string;
	benefitId: string;
	benefitName: string;
	personId: string;
	personName: string;
	status: VoucherStatus;
	providedById: string;
	providedByName: string;
	providedAt: Date | null;
	releasedById: string | null;
	releasedByName: string | null;
	releasedAt: Date | null;
	notes: string | null;
	createdAt: Date | null;
}

// Helper to build person full name
function buildPersonName(person: {
	firstName: string;
	middleName: string | null;
	lastName: string;
	suffix: string | null;
}): string {
	const parts = [person.firstName];
	if (person.middleName) parts.push(person.middleName);
	parts.push(person.lastName);
	if (person.suffix) parts.push(person.suffix);
	return parts.join(" ");
}

// Helper to calculate age from birthdate
function calculateAge(birthdate: string): number {
	const today = new Date();
	const birth = new Date(birthdate);
	let age = today.getFullYear() - birth.getFullYear();
	const monthDiff = today.getMonth() - birth.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
		age--;
	}
	return age;
}

// Eligibility check result
export interface EligibilityResult {
	eligible: boolean;
	reasons: string[]; // List of reasons for ineligibility
}

// Helper to check if a person meets eligibility criteria
function checkEligibility(
	person: {
		barangay: string;
		monthlyIncome: number | null;
		birthdate: string;
		gender: string | null;
		residencyStatus: string;
	},
	personCategoryIds: string[],
	eligibility: BenefitEligibility,
): EligibilityResult {
	const reasons: string[] = [];

	// Check barangay restriction
	if (eligibility.barangays && eligibility.barangays.length > 0) {
		if (!eligibility.barangays.includes(person.barangay as LoretoBarangay)) {
			reasons.push(
				`Barangay must be one of: ${eligibility.barangays.join(", ")}`,
			);
		}
	}

	// Check max monthly income
	if (eligibility.maxMonthlyIncome !== null) {
		if (person.monthlyIncome === null) {
			reasons.push(
				`Monthly income must be recorded (max: ₱${eligibility.maxMonthlyIncome.toLocaleString()})`,
			);
		} else if (person.monthlyIncome > eligibility.maxMonthlyIncome) {
			reasons.push(
				`Monthly income exceeds limit (₱${person.monthlyIncome.toLocaleString()} > ₱${eligibility.maxMonthlyIncome.toLocaleString()})`,
			);
		}
	}

	// Check age restrictions
	const age = calculateAge(person.birthdate);
	if (eligibility.minAge !== null && age < eligibility.minAge) {
		reasons.push(
			`Must be at least ${eligibility.minAge} years old (is ${age})`,
		);
	}
	if (eligibility.maxAge !== null && age > eligibility.maxAge) {
		reasons.push(`Must be at most ${eligibility.maxAge} years old (is ${age})`);
	}

	// Check gender restriction
	if (eligibility.gender !== null) {
		if (person.gender !== eligibility.gender) {
			reasons.push(`Must be ${eligibility.gender}`);
		}
	}

	// Check residency status restriction
	if (eligibility.residencyStatus !== null) {
		if (person.residencyStatus !== eligibility.residencyStatus) {
			const label =
				eligibility.residencyStatus === "resident"
					? "Resident"
					: "Non-Resident";
			reasons.push(`Must be a ${label}`);
		}
	}

	// Check required categories
	if (
		eligibility.requiredCategories &&
		eligibility.requiredCategories.length > 0
	) {
		const hasCategories = eligibility.requiredCategories.filter((cat) =>
			personCategoryIds.includes(cat),
		);

		if (eligibility.categoryMode === "all") {
			// Must have ALL required categories
			if (hasCategories.length !== eligibility.requiredCategories.length) {
				const missing = eligibility.requiredCategories.filter(
					(cat) => !personCategoryIds.includes(cat),
				);
				reasons.push(
					`Missing required categories: ${missing.map(formatCategoryLabel).join(", ")}`,
				);
			}
		} else {
			// Must have ANY of the required categories
			if (hasCategories.length === 0) {
				reasons.push(
					`Must have at least one of: ${eligibility.requiredCategories.map(formatCategoryLabel).join(", ")}`,
				);
			}
		}
	}

	return {
		eligible: reasons.length === 0,
		reasons,
	};
}

// Format category ID to human-readable label
function formatCategoryLabel(category: IdentificationType): string {
	const labels: Record<IdentificationType, string> = {
		voter: "Voter",
		philhealth: "PhilHealth",
		sss: "SSS",
		fourPs: "4Ps",
		pwd: "PWD",
		soloParent: "Solo Parent",
		pagibig: "Pag-IBIG",
		tin: "TIN",
		barangayClearance: "Barangay Clearance",
	};
	return labels[category] || category;
}

// Server function to check person eligibility for a benefit
export const checkPersonEligibility = createServerFn({ method: "POST" })
	.inputValidator((data: { benefitId: string; personId: string }) => data)
	.handler(
		async ({
			data,
		}): Promise<{
			success: boolean;
			error?: string;
			result?: EligibilityResult;
			eligibility?: BenefitEligibility | null;
		}> => {
			await requireAuth();

			// Get the benefit with eligibility
			const benefit = await db.query.benefits.findFirst({
				where: eq(benefits.id, data.benefitId),
			});

			if (!benefit) {
				return { success: false, error: "Benefit not found" };
			}

			// If no eligibility criteria, everyone is eligible
			if (!benefit.eligibility) {
				return {
					success: true,
					result: { eligible: true, reasons: [] },
					eligibility: null,
				};
			}

			// Get person data
			const person = await db.query.people.findFirst({
				where: eq(people.id, data.personId),
			});

			if (!person) {
				return { success: false, error: "Person not found" };
			}

			// Get person's identification types
			const identifications = await db.query.personIdentifications.findMany({
				where: eq(personIdentifications.personId, data.personId),
			});
			const personCategoryIds = identifications.map((id) => id.type);

			// Check eligibility
			const result = checkEligibility(
				{
					barangay: person.barangay,
					monthlyIncome: person.monthlyIncome,
					birthdate: person.birthdate,
					gender: person.gender,
					residencyStatus: person.residencyStatus,
				},
				personCategoryIds,
				benefit.eligibility,
			);

			return {
				success: true,
				result,
				eligibility: benefit.eligibility,
			};
		},
	);

// Get pending vouchers for benefits where current user is a releaser
export const getPendingVouchersToRelease = createServerFn({
	method: "GET",
}).handler(async (): Promise<VoucherListItem[]> => {
	const currentUser = await requireAuth();

	// Get benefit IDs where user is a releaser
	const releaserAssignments = await db.query.benefitAssignments.findMany({
		where: and(
			eq(benefitAssignments.userId, currentUser.userId),
			eq(benefitAssignments.role, "releaser"),
		),
	});

	const benefitIds = releaserAssignments.map((a) => a.benefitId);
	if (benefitIds.length === 0) return [];

	const pendingVouchers = await db.query.vouchers.findMany({
		with: {
			benefit: true,
			person: true,
			providedBy: true,
			releasedBy: true,
		},
		where: and(
			inArray(vouchers.benefitId, benefitIds),
			eq(vouchers.status, "pending"),
		),
		orderBy: (vouchers, { desc }) => [desc(vouchers.providedAt)],
	});

	return pendingVouchers.map((v) => ({
		id: v.id,
		benefitId: v.benefitId,
		benefitName: v.benefit.name,
		personId: v.personId,
		personName: buildPersonName(v.person),
		status: v.status as VoucherStatus,
		providedById: v.providedById,
		providedByName: `${v.providedBy.firstName} ${v.providedBy.lastName}`,
		providedAt: v.providedAt,
		releasedById: v.releasedById,
		releasedByName: v.releasedBy
			? `${v.releasedBy.firstName} ${v.releasedBy.lastName}`
			: null,
		releasedAt: v.releasedAt,
		notes: v.notes,
		createdAt: v.createdAt,
	}));
});

// Get vouchers issued by current user (provider history)
export const getMyIssuedVouchers = createServerFn({ method: "GET" }).handler(
	async (): Promise<VoucherListItem[]> => {
		const currentUser = await requireAuth();

		const myVouchers = await db.query.vouchers.findMany({
			with: {
				benefit: true,
				person: true,
				providedBy: true,
				releasedBy: true,
			},
			where: eq(vouchers.providedById, currentUser.userId),
			orderBy: (vouchers, { desc }) => [desc(vouchers.providedAt)],
		});

		return myVouchers.map((v) => ({
			id: v.id,
			benefitId: v.benefitId,
			benefitName: v.benefit.name,
			personId: v.personId,
			personName: buildPersonName(v.person),
			status: v.status as VoucherStatus,
			providedById: v.providedById,
			providedByName: `${v.providedBy.firstName} ${v.providedBy.lastName}`,
			providedAt: v.providedAt,
			releasedById: v.releasedById,
			releasedByName: v.releasedBy
				? `${v.releasedBy.firstName} ${v.releasedBy.lastName}`
				: null,
			releasedAt: v.releasedAt,
			notes: v.notes,
			createdAt: v.createdAt,
		}));
	},
);

// Get vouchers released by current user (releaser history)
export const getMyReleasedVouchers = createServerFn({ method: "GET" }).handler(
	async (): Promise<VoucherListItem[]> => {
		const currentUser = await requireAuth();

		const myVouchers = await db.query.vouchers.findMany({
			with: {
				benefit: true,
				person: true,
				providedBy: true,
				releasedBy: true,
			},
			where: eq(vouchers.releasedById, currentUser.userId),
			orderBy: (vouchers, { desc }) => [desc(vouchers.releasedAt)],
		});

		return myVouchers
			.filter((v) => v.benefit && v.person && v.providedBy)
			.map((v) => ({
				id: v.id,
				benefitId: v.benefitId,
				benefitName: v.benefit?.name ?? "",
				personId: v.personId,
				personName: buildPersonName(
					v.person ?? { firstName: "", lastName: "" },
				),
				status: v.status as VoucherStatus,
				providedById: v.providedById,
				providedByName: `${v.providedBy?.firstName ?? ""} ${v.providedBy?.lastName ?? ""}`,
				providedAt: v.providedAt,
				releasedById: v.releasedById,
				releasedByName: v.releasedBy
					? `${v.releasedBy.firstName} ${v.releasedBy.lastName}`
					: null,
				releasedAt: v.releasedAt,
				notes: v.notes,
				createdAt: v.createdAt,
			}));
	},
);

interface CreateVoucherInput {
	benefitId: string;
	personId: string;
	notes?: string;
	overrideEligibility?: boolean; // Allow provider to override eligibility check
}

// Create a new voucher (provider only)
export const createVoucher = createServerFn({ method: "POST" })
	.inputValidator((data: CreateVoucherInput) => data)
	.handler(
		async ({
			data,
		}): Promise<{
			success: boolean;
			error?: string;
			voucher?: VoucherListItem;
			eligibilityIssues?: string[]; // Return issues if blocked by eligibility
		}> => {
			const currentUser = await requireAuth();

			// Verify user is a provider for this benefit
			const assignment = await db.query.benefitAssignments.findFirst({
				with: { benefit: true },
				where: and(
					eq(benefitAssignments.benefitId, data.benefitId),
					eq(benefitAssignments.userId, currentUser.userId),
					eq(benefitAssignments.role, "provider"),
				),
			});

			if (!assignment) {
				return {
					success: false,
					error: "Not authorized to provide this benefit",
				};
			}

			if (!assignment.benefit.isActive) {
				return { success: false, error: "This benefit is no longer active" };
			}

			// Check eligibility if benefit has eligibility criteria
			if (assignment.benefit.eligibility && !data.overrideEligibility) {
				// Get person data
				const person = await db.query.people.findFirst({
					where: eq(people.id, data.personId),
				});

				if (!person) {
					return { success: false, error: "Person not found" };
				}

				// Get person's identification types
				const identifications = await db.query.personIdentifications.findMany({
					where: eq(personIdentifications.personId, data.personId),
				});
				const personCategoryIds = identifications.map((id) => id.type);

				// Check eligibility
				const eligibilityResult = checkEligibility(
					{
						barangay: person.barangay,
						monthlyIncome: person.monthlyIncome,
						birthdate: person.birthdate,
						gender: person.gender,
						residencyStatus: person.residencyStatus,
					},
					personCategoryIds,
					assignment.benefit.eligibility,
				);

				if (!eligibilityResult.eligible) {
					return {
						success: false,
						error: "Person does not meet eligibility criteria",
						eligibilityIssues: eligibilityResult.reasons,
					};
				}
			}

			// Check for existing pending voucher for same person-benefit
			const existingPending = await db.query.vouchers.findFirst({
				where: and(
					eq(vouchers.benefitId, data.benefitId),
					eq(vouchers.personId, data.personId),
					eq(vouchers.status, "pending"),
				),
			});

			if (existingPending) {
				return {
					success: false,
					error: "This person already has a pending voucher for this benefit",
				};
			}

			// Create voucher
			const [newVoucher] = await db
				.insert(vouchers)
				.values({
					benefitId: data.benefitId,
					personId: data.personId,
					providedById: currentUser.userId,
					notes: data.notes ?? null,
				})
				.returning();

			// Fetch complete voucher
			const voucherWithRelations = await db.query.vouchers.findFirst({
				with: {
					benefit: true,
					person: true,
					providedBy: true,
					releasedBy: true,
				},
				where: eq(vouchers.id, newVoucher.id),
			});

			if (!voucherWithRelations) {
				return { success: true };
			}

			// Log activity
			const personName = buildPersonName(voucherWithRelations.person);
			await logActivity({
				data: {
					action: "create",
					entityType: "voucher",
					entityId: newVoucher.id,
					entityName: `${voucherWithRelations.benefit.name} for ${personName}`,
				},
			});

			return {
				success: true,
				voucher: {
					id: voucherWithRelations.id,
					benefitId: voucherWithRelations.benefitId,
					benefitName: voucherWithRelations.benefit.name,
					personId: voucherWithRelations.personId,
					personName: personName,
					status: voucherWithRelations.status as VoucherStatus,
					providedById: voucherWithRelations.providedById,
					providedByName: `${voucherWithRelations.providedBy.firstName} ${voucherWithRelations.providedBy.lastName}`,
					providedAt: voucherWithRelations.providedAt,
					releasedById: voucherWithRelations.releasedById,
					releasedByName: null,
					releasedAt: voucherWithRelations.releasedAt,
					notes: voucherWithRelations.notes,
					createdAt: voucherWithRelations.createdAt,
				},
			};
		},
	);

// Release a voucher (releaser only, cannot be the same person who provided)
export const releaseVoucher = createServerFn({ method: "POST" })
	.inputValidator((voucherId: string) => voucherId)
	.handler(
		async ({
			data: voucherId,
		}): Promise<{ success: boolean; error?: string }> => {
			const currentUser = await requireAuth();

			// Get the voucher
			const voucher = await db.query.vouchers.findFirst({
				where: eq(vouchers.id, voucherId),
			});

			if (!voucher) {
				return { success: false, error: "Voucher not found" };
			}

			if (voucher.status !== "pending") {
				return { success: false, error: "Voucher is not pending" };
			}

			// Check separation of duties
			if (voucher.providedById === currentUser.userId) {
				return {
					success: false,
					error: "Cannot release a voucher you provided",
				};
			}

			// Verify user is a releaser for this benefit
			const assignment = await db.query.benefitAssignments.findFirst({
				where: and(
					eq(benefitAssignments.benefitId, voucher.benefitId),
					eq(benefitAssignments.userId, currentUser.userId),
					eq(benefitAssignments.role, "releaser"),
				),
			});

			if (!assignment) {
				return {
					success: false,
					error: "Not authorized to release this benefit",
				};
			}

			// Update voucher
			await db
				.update(vouchers)
				.set({
					status: "released",
					releasedById: currentUser.userId,
					releasedAt: new Date(),
				})
				.where(eq(vouchers.id, voucherId));

			// Fetch voucher with relations for log message
			const releasedVoucher = await db.query.vouchers.findFirst({
				with: { benefit: true, person: true },
				where: eq(vouchers.id, voucherId),
			});

			// Log activity
			if (releasedVoucher) {
				const personName = buildPersonName(releasedVoucher.person);
				await logActivity({
					data: {
						action: "release",
						entityType: "voucher",
						entityId: voucherId,
						entityName: `${releasedVoucher.benefit.name} for ${personName}`,
					},
				});
			}

			return { success: true };
		},
	);

// Cancel a voucher (admin or original provider, only if pending)
export const cancelVoucher = createServerFn({ method: "POST" })
	.inputValidator((voucherId: string) => voucherId)
	.handler(
		async ({
			data: voucherId,
		}): Promise<{ success: boolean; error?: string }> => {
			const currentUser = await requireAuth();

			const voucher = await db.query.vouchers.findFirst({
				with: { benefit: true, person: true },
				where: eq(vouchers.id, voucherId),
			});

			if (!voucher) {
				return { success: false, error: "Voucher not found" };
			}

			if (voucher.status !== "pending") {
				return { success: false, error: "Can only cancel pending vouchers" };
			}

			// Check authorization: department_admin/superuser OR original provider
			const isAdmin =
				currentUser.role === "department_admin" ||
				currentUser.role === "superuser";
			const isProvider = voucher.providedById === currentUser.userId;

			// For department admins, check they have access to the benefit's department
			if (isAdmin && currentUser.role === "department_admin") {
				if (voucher.benefit.departmentId !== currentUser.departmentId) {
					return {
						success: false,
						error: "Not authorized for this department",
					};
				}
			}

			if (!isAdmin && !isProvider) {
				return {
					success: false,
					error: "Not authorized to cancel this voucher",
				};
			}

			await db
				.update(vouchers)
				.set({ status: "cancelled" })
				.where(eq(vouchers.id, voucherId));

			// Log activity
			const personName = buildPersonName(voucher.person);
			await logActivity({
				data: {
					action: "cancel",
					entityType: "voucher",
					entityId: voucherId,
					entityName: `${voucher.benefit.name} for ${personName}`,
				},
			});

			return { success: true };
		},
	);

export interface VoucherStats {
	benefitId: string;
	pending: number;
	released: number;
	cancelled: number;
	total: number;
}

// Get voucher statistics for a benefit
export const getVoucherStats = createServerFn({ method: "GET" })
	.inputValidator((benefitId: string) => benefitId)
	.handler(async ({ data: benefitId }): Promise<VoucherStats> => {
		await requireAdmin();

		const stats = await db
			.select({
				status: vouchers.status,
				count: sql<number>`count(*)::int`,
			})
			.from(vouchers)
			.where(eq(vouchers.benefitId, benefitId))
			.groupBy(vouchers.status);

		const result: VoucherStats = {
			benefitId,
			pending: 0,
			released: 0,
			cancelled: 0,
			total: 0,
		};

		for (const stat of stats) {
			const count = stat.count;
			result.total += count;
			if (stat.status === "pending") result.pending = count;
			else if (stat.status === "released") result.released = count;
			else if (stat.status === "cancelled") result.cancelled = count;
		}

		return result;
	});

// Get all vouchers for a benefit (admin view)
export const getVouchersForBenefit = createServerFn({ method: "GET" })
	.inputValidator((benefitId: string) => benefitId)
	.handler(async ({ data: benefitId }): Promise<VoucherListItem[]> => {
		const currentUser = await requireAdmin();
		const isSuperuser = currentUser.role === "superuser";

		// Verify access to the benefit
		const benefit = await db.query.benefits.findFirst({
			where: isSuperuser
				? eq(benefits.id, benefitId)
				: currentUser.departmentId
					? and(
							eq(benefits.id, benefitId),
							eq(benefits.departmentId, currentUser.departmentId),
						)
					: eq(benefits.id, benefitId),
		});

		if (!benefit) {
			return [];
		}

		const allVouchers = await db.query.vouchers.findMany({
			with: {
				benefit: true,
				person: true,
				providedBy: true,
				releasedBy: true,
			},
			where: eq(vouchers.benefitId, benefitId),
			orderBy: (vouchers, { desc }) => [desc(vouchers.providedAt)],
		});

		return allVouchers.map((v) => ({
			id: v.id,
			benefitId: v.benefitId,
			benefitName: v.benefit.name,
			personId: v.personId,
			personName: buildPersonName(v.person),
			status: v.status as VoucherStatus,
			providedById: v.providedById,
			providedByName: `${v.providedBy.firstName} ${v.providedBy.lastName}`,
			providedAt: v.providedAt,
			releasedById: v.releasedById,
			releasedByName: v.releasedBy
				? `${v.releasedBy.firstName} ${v.releasedBy.lastName}`
				: null,
			releasedAt: v.releasedAt,
			notes: v.notes,
			createdAt: v.createdAt,
		}));
	});

export interface PendingVoucherForRelease {
	id: string;
	benefitId: string;
	benefitName: string;
	personId: string;
	personName: string;
	providedById: string;
	providedByName: string;
	providedAt: Date | null;
	notes: string | null;
}

interface FindPendingVoucherInput {
	benefitId: string;
	personId: string;
}

// Get all vouchers for a specific person
export const getVouchersForPerson = createServerFn({ method: "GET" })
	.inputValidator((personId: string) => personId)
	.handler(async ({ data: personId }): Promise<VoucherListItem[]> => {
		await requireAuth();

		const personVouchers = await db.query.vouchers.findMany({
			with: {
				benefit: true,
				person: true,
				providedBy: true,
				releasedBy: true,
			},
			where: eq(vouchers.personId, personId),
			orderBy: (vouchers, { desc }) => [desc(vouchers.providedAt)],
		});

		return personVouchers.map((v) => ({
			id: v.id,
			benefitId: v.benefitId,
			benefitName: v.benefit.name,
			personId: v.personId,
			personName: buildPersonName(v.person),
			status: v.status as VoucherStatus,
			providedById: v.providedById,
			providedByName: `${v.providedBy.firstName} ${v.providedBy.lastName}`,
			providedAt: v.providedAt,
			releasedById: v.releasedById,
			releasedByName: v.releasedBy
				? `${v.releasedBy.firstName} ${v.releasedBy.lastName}`
				: null,
			releasedAt: v.releasedAt,
			notes: v.notes,
			createdAt: v.createdAt,
		}));
	});

// Find a pending voucher for a specific person and benefit (for secure release flow)
export const findPendingVoucherForRelease = createServerFn({ method: "POST" })
	.inputValidator((data: FindPendingVoucherInput) => data)
	.handler(
		async ({
			data,
		}): Promise<{
			success: boolean;
			error?: string;
			voucher?: PendingVoucherForRelease;
		}> => {
			const currentUser = await requireAuth();

			// Verify user is a releaser for this benefit
			const assignment = await db.query.benefitAssignments.findFirst({
				with: { benefit: true },
				where: and(
					eq(benefitAssignments.benefitId, data.benefitId),
					eq(benefitAssignments.userId, currentUser.userId),
					eq(benefitAssignments.role, "releaser"),
				),
			});

			if (!assignment) {
				return {
					success: false,
					error: "Not authorized to release this benefit",
				};
			}

			// Find pending voucher for this person-benefit
			const voucher = await db.query.vouchers.findFirst({
				with: {
					benefit: true,
					person: true,
					providedBy: true,
				},
				where: and(
					eq(vouchers.benefitId, data.benefitId),
					eq(vouchers.personId, data.personId),
					eq(vouchers.status, "pending"),
				),
			});

			if (!voucher) {
				return {
					success: false,
					error: "No pending voucher found for this person",
				};
			}

			// Check separation of duties
			if (voucher.providedById === currentUser.userId) {
				return {
					success: false,
					error: "You cannot release a voucher you provided",
				};
			}

			return {
				success: true,
				voucher: {
					id: voucher.id,
					benefitId: voucher.benefitId,
					benefitName: voucher.benefit.name,
					personId: voucher.personId,
					personName: buildPersonName(voucher.person),
					providedById: voucher.providedById,
					providedByName: `${voucher.providedBy.firstName} ${voucher.providedBy.lastName}`,
					providedAt: voucher.providedAt,
					notes: voucher.notes,
				},
			};
		},
	);
