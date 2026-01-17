import { config } from "dotenv";

config({ path: ".env.local" });
config(); // fallback to .env

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { departments, users } from "./schema";

// Create a separate pool for seeding (uses DATABASE_URL from .env)
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function seed() {
	console.log("Seeding database...");

	// Seed departments for Municipality of Loreto
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

	console.log("Seeding departments...");
	for (const dept of departmentList) {
		try {
			await db
				.insert(departments)
				.values(dept)
				.onConflictDoNothing({ target: departments.code });
			console.log(`Created/skipped department: ${dept.code} - ${dept.name}`);
		} catch (error) {
			console.error(`Error creating department ${dept.code}:`, error);
		}
	}

	// Insert initial superuser(s)
	// Update these with your actual phone numbers
	const superusers = [
		{
			phoneNumber: "639227567025",
			firstName: "Admin",
			lastName: "User",
			role: "superuser" as const,
		},
	];

	console.log("Seeding superusers...");
	for (const superuser of superusers) {
		try {
			await db
				.insert(users)
				.values(superuser)
				.onConflictDoNothing({ target: users.phoneNumber });
			console.log(`Created/skipped superuser: ${superuser.phoneNumber}`);
		} catch (error) {
			console.error(
				`Error creating superuser ${superuser.phoneNumber}:`,
				error,
			);
		}
	}

	console.log("Seeding complete!");
	await pool.end();
}

seed().catch((error) => {
	console.error("Seeding failed:", error);
	process.exit(1);
});
