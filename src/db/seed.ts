import { config } from "dotenv";

config({ path: ".env.local" });
config(); // fallback to .env

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users } from "./schema";

// Create a separate pool for seeding (uses DATABASE_URL from .env)
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function seed() {
	console.log("Seeding database...");

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
