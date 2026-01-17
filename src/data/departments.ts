import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { getAppSession } from "@/lib/session";

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

export interface DepartmentListItem {
	id: string;
	name: string;
	code: string;
	isActive: boolean;
	createdAt: Date | null;
}

export const getDepartments = createServerFn({ method: "GET" }).handler(
	async (): Promise<DepartmentListItem[]> => {
		await requireAdmin();

		const allDepartments = await db.query.departments.findMany({
			orderBy: (departments, { asc }) => [asc(departments.name)],
		});

		return allDepartments.map((dept) => ({
			id: dept.id,
			name: dept.name,
			code: dept.code,
			isActive: dept.isActive,
			createdAt: dept.createdAt,
		}));
	},
);

// Get only active departments (for dropdowns)
export const getActiveDepartments = createServerFn({ method: "GET" }).handler(
	async (): Promise<DepartmentListItem[]> => {
		await requireAdmin();

		const activeDepartments = await db.query.departments.findMany({
			where: eq(departments.isActive, true),
			orderBy: (departments, { asc }) => [asc(departments.name)],
		});

		return activeDepartments.map((dept) => ({
			id: dept.id,
			name: dept.name,
			code: dept.code,
			isActive: dept.isActive,
			createdAt: dept.createdAt,
		}));
	},
);

export const getDepartmentById = createServerFn({ method: "GET" })
	.inputValidator((departmentId: string) => departmentId)
	.handler(
		async ({ data: departmentId }): Promise<DepartmentListItem | null> => {
			await requireAdmin();

			const dept = await db.query.departments.findFirst({
				where: eq(departments.id, departmentId),
			});

			if (!dept) return null;

			return {
				id: dept.id,
				name: dept.name,
				code: dept.code,
				isActive: dept.isActive,
				createdAt: dept.createdAt,
			};
		},
	);

interface CreateDepartmentInput {
	name: string;
	code: string;
}

export const createDepartment = createServerFn({ method: "POST" })
	.inputValidator((data: CreateDepartmentInput) => data)
	.handler(
		async ({
			data,
		}): Promise<{
			success: boolean;
			error?: string;
			department?: DepartmentListItem;
		}> => {
			await requireAdmin();

			// Check if code already exists
			const existing = await db.query.departments.findFirst({
				where: eq(departments.code, data.code.toUpperCase()),
			});

			if (existing) {
				return { success: false, error: "Department code already exists" };
			}

			const [newDept] = await db
				.insert(departments)
				.values({
					name: data.name,
					code: data.code.toUpperCase(),
				})
				.returning();

			return {
				success: true,
				department: {
					id: newDept.id,
					name: newDept.name,
					code: newDept.code,
					isActive: newDept.isActive,
					createdAt: newDept.createdAt,
				},
			};
		},
	);

interface UpdateDepartmentInput {
	departmentId: string;
	updates: {
		name?: string;
		code?: string;
		isActive?: boolean;
	};
}

export const updateDepartment = createServerFn({ method: "POST" })
	.inputValidator((data: UpdateDepartmentInput) => data)
	.handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
		await requireAdmin();

		const { departmentId, updates } = data;

		const currentDept = await db.query.departments.findFirst({
			where: eq(departments.id, departmentId),
		});

		if (!currentDept) {
			return { success: false, error: "Department not found" };
		}

		// If updating code, check for duplicates
		if (updates.code) {
			const codeUpper = updates.code.toUpperCase();
			const existing = await db.query.departments.findFirst({
				where: eq(departments.code, codeUpper),
			});

			if (existing && existing.id !== departmentId) {
				return {
					success: false,
					error: "Department code already exists",
				};
			}

			updates.code = codeUpper;
		}

		await db
			.update(departments)
			.set(updates)
			.where(eq(departments.id, departmentId));

		return { success: true };
	});

// Seed departments for Municipality of Loreto
export const seedDepartments = createServerFn({ method: "POST" }).handler(
	async (): Promise<{ success: boolean; error?: string; count?: number }> => {
		await requireAdmin();

		const departmentList = [
			{ code: "MAYOR", name: "Mayor's Office" },
			{ code: "VICE", name: "Vice Mayor's Office" },
			{ code: "SB", name: "Sangguniang Bayan (Municipal Council)" },
			{ code: "ADMIN", name: "Municipal Administrator's Office" },
			{ code: "BUDGET", name: "Budget Office" },
			{ code: "ACCOUNTING", name: "Accounting Office" },
			{ code: "TREASURER", name: "Treasurer's Office" },
			{ code: "ASSESSOR", name: "Assessor's Office" },
			{ code: "PLANNING", name: "Planning & Development Office (MPDO)" },
			{ code: "ENGINEER", name: "Municipal Engineer's Office" },
			{ code: "HEALTH", name: "Municipal Health Office" },
			{ code: "SOCIAL", name: "Social Welfare & Development (MSWDO)" },
			{ code: "AGRICULTURE", name: "Municipal Agriculture Office" },
			{ code: "CIVIL", name: "Civil Registry Office" },
			{ code: "DILG", name: "DILG Field Office" },
			{ code: "HR", name: "Human Resources Management Office" },
		];

		let insertedCount = 0;
		for (const dept of departmentList) {
			const existing = await db.query.departments.findFirst({
				where: eq(departments.code, dept.code),
			});

			if (!existing) {
				await db.insert(departments).values(dept);
				insertedCount++;
			}
		}

		return { success: true, count: insertedCount };
	},
);
