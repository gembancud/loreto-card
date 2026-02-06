import { createServerFn } from "@tanstack/react-start";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
	type DbPerson,
	type IdentificationType,
	type PersonIdentification,
	people,
	personIdentifications,
	type ResidencyStatus,
} from "@/db/schema";
import { getAppSession } from "@/lib/session";
import { getPresignedUrl } from "@/lib/storage";
import { computeChanges, logActivity } from "./audit";
import type { LoretoBarangay } from "./barangays";

export type PersonStatus = "active" | "inactive" | "pending" | "deleted";
export type { ResidencyStatus } from "@/db/schema";

export interface GovServiceRecord {
	registered: boolean;
	idNumber?: string;
	issueDate?: string; // ISO date (YYYY-MM-DD)
	expiryDate?: string; // ISO date (optional - some services don't expire)
}

export interface PersonAddress {
	street: string;
	purok?: string;
	barangay: LoretoBarangay;
}

export interface Person {
	id: string;
	firstName: string;
	middleName?: string;
	lastName: string;
	suffix?: string;
	birthdate: string;
	address: PersonAddress;
	phoneNumber: string;
	monthlyIncome: number | null;
	status: PersonStatus;
	profilePhoto?: string | null;
	// Government service fields
	voter: GovServiceRecord;
	philhealth: GovServiceRecord;
	sss: GovServiceRecord;
	fourPs: GovServiceRecord;
	pwd: GovServiceRecord;
	soloParent: GovServiceRecord;
	pagibig: GovServiceRecord;
	tin: GovServiceRecord;
	barangayClearance: GovServiceRecord;
	// Emergency contact
	emergencyContactName?: string;
	emergencyContactPhone?: string;
	// Medical info
	bloodType?: string;
	// Demographics
	gender?: string;
	civilStatus?: string;
	placeOfBirth?: string;
	residencyStatus: ResidencyStatus;
	createdAt: string;
	updatedAt: string;
}

// All government service types
const GOV_SERVICE_TYPES: IdentificationType[] = [
	"voter",
	"philhealth",
	"sss",
	"fourPs",
	"pwd",
	"soloParent",
	"pagibig",
	"tin",
	"barangayClearance",
];

// Transform DB person + identifications to frontend Person interface
async function transformDbPersonToPerson(
	dbPerson: DbPerson,
	identifications: PersonIdentification[],
): Promise<Person> {
	// Build a map of identifications by type
	const idMap = new Map<string, PersonIdentification>();
	for (const id of identifications) {
		idMap.set(id.type, id);
	}

	// Build GovServiceRecord for each service type
	const buildRecord = (type: IdentificationType): GovServiceRecord => {
		const id = idMap.get(type);
		if (!id) {
			return { registered: false };
		}
		return {
			registered: true,
			idNumber: id.idNumber ?? undefined,
			issueDate: id.issueDate ?? undefined,
			expiryDate: id.expiryDate ?? undefined,
		};
	};

	// Generate presigned URL for profile photo if it exists
	let profilePhoto: string | undefined;
	if (dbPerson.profilePhoto) {
		profilePhoto = await getPresignedUrl(dbPerson.profilePhoto);
	}

	return {
		id: dbPerson.id,
		firstName: dbPerson.firstName,
		middleName: dbPerson.middleName ?? undefined,
		lastName: dbPerson.lastName,
		suffix: dbPerson.suffix ?? undefined,
		birthdate: dbPerson.birthdate,
		address: {
			street: dbPerson.street,
			purok: dbPerson.purok ?? undefined,
			barangay: dbPerson.barangay as LoretoBarangay,
		},
		phoneNumber: dbPerson.phoneNumber,
		monthlyIncome: dbPerson.monthlyIncome,
		status: dbPerson.status as PersonStatus,
		profilePhoto,
		voter: buildRecord("voter"),
		philhealth: buildRecord("philhealth"),
		sss: buildRecord("sss"),
		fourPs: buildRecord("fourPs"),
		pwd: buildRecord("pwd"),
		soloParent: buildRecord("soloParent"),
		pagibig: buildRecord("pagibig"),
		tin: buildRecord("tin"),
		barangayClearance: buildRecord("barangayClearance"),
		emergencyContactName: dbPerson.emergencyContactName ?? undefined,
		emergencyContactPhone: dbPerson.emergencyContactPhone ?? undefined,
		bloodType: dbPerson.bloodType ?? undefined,
		gender: dbPerson.gender ?? undefined,
		civilStatus: dbPerson.civilStatus ?? undefined,
		placeOfBirth: dbPerson.placeOfBirth ?? undefined,
		residencyStatus: dbPerson.residencyStatus as ResidencyStatus,
		createdAt: dbPerson.createdAt?.toISOString() ?? new Date().toISOString(),
		updatedAt: dbPerson.updatedAt?.toISOString() ?? new Date().toISOString(),
	};
}

export const getPeople = createServerFn({
	method: "GET",
}).handler(async (): Promise<Person[]> => {
	const session = await getAppSession();
	const role = session.data.role;

	// Department staff don't access the people table — they use QR/search lookup
	const isDeptStaff = role === "department_admin" || role === "department_user";
	if (isDeptStaff) {
		return [];
	}

	const isBarangay = role === "barangay_admin" || role === "barangay_user";

	const whereClause =
		isBarangay && session.data.barangay
			? and(
					ne(people.status, "deleted"),
					eq(people.barangay, session.data.barangay),
				)
			: ne(people.status, "deleted");

	const dbPeople = await db.query.people.findMany({
		with: {
			identifications: true,
		},
		where: whereClause,
		orderBy: (people, { asc }) => [asc(people.lastName), asc(people.firstName)],
	});

	return Promise.all(
		dbPeople.map((p) => transformDbPersonToPerson(p, p.identifications)),
	);
});

export const getPersonById = createServerFn({
	method: "GET",
})
	.inputValidator((personId: string) => personId)
	.handler(async ({ data: personId }): Promise<Person> => {
		const dbPerson = await db.query.people.findFirst({
			with: {
				identifications: true,
			},
			where: eq(people.id, personId),
		});

		if (!dbPerson) {
			throw new Error(`Person with ID ${personId} not found`);
		}

		// Barangay staff can only view people in their barangay
		const session = await getAppSession();
		const role = session.data.role;
		if (
			(role === "barangay_admin" || role === "barangay_user") &&
			session.data.barangay &&
			dbPerson.barangay !== session.data.barangay
		) {
			throw new Error("Unauthorized: Person is not in your barangay");
		}

		return await transformDbPersonToPerson(dbPerson, dbPerson.identifications);
	});

interface UpdatePersonInput {
	personId: string;
	updates: Partial<Omit<Person, "id" | "createdAt" | "updatedAt">>;
}

export const updatePerson = createServerFn({
	method: "POST",
})
	.inputValidator((input: UpdatePersonInput) => input)
	.handler(async ({ data: { personId, updates } }): Promise<Person> => {
		const session = await getAppSession();
		const role = session.data.role;
		const isBarangay = role === "barangay_admin" || role === "barangay_user";
		if (role !== "superuser" && !isBarangay) {
			throw new Error("Unauthorized");
		}

		// Verify person exists
		const existingPerson = await db.query.people.findFirst({
			where: eq(people.id, personId),
		});

		if (!existingPerson) {
			throw new Error(`Person with ID ${personId} not found`);
		}

		if (isBarangay) {
			if (existingPerson.barangay !== session.data.barangay)
				throw new Error("Can only edit people in your own barangay");
			if (
				updates.address?.barangay &&
				updates.address.barangay !== session.data.barangay
			)
				throw new Error("Cannot move person to different barangay");
		}

		// Build update values for person table
		const personUpdates: Partial<DbPerson> = {};

		if (updates.firstName !== undefined)
			personUpdates.firstName = updates.firstName;
		if (updates.middleName !== undefined)
			personUpdates.middleName = updates.middleName ?? null;
		if (updates.lastName !== undefined)
			personUpdates.lastName = updates.lastName;
		if (updates.suffix !== undefined)
			personUpdates.suffix = updates.suffix ?? null;
		if (updates.birthdate !== undefined)
			personUpdates.birthdate = updates.birthdate;
		if (updates.phoneNumber !== undefined)
			personUpdates.phoneNumber = updates.phoneNumber;
		if (updates.monthlyIncome !== undefined)
			personUpdates.monthlyIncome = updates.monthlyIncome;
		if (updates.status !== undefined) personUpdates.status = updates.status;
		if (updates.profilePhoto !== undefined)
			personUpdates.profilePhoto = updates.profilePhoto ?? null;

		// Handle address fields
		if (updates.address) {
			if (updates.address.street !== undefined)
				personUpdates.street = updates.address.street;
			if (updates.address.purok !== undefined)
				personUpdates.purok = updates.address.purok ?? null;
			if (updates.address.barangay !== undefined)
				personUpdates.barangay = updates.address.barangay;
		}

		// Handle emergency contact fields
		if (updates.emergencyContactName !== undefined)
			personUpdates.emergencyContactName = updates.emergencyContactName ?? null;
		if (updates.emergencyContactPhone !== undefined)
			personUpdates.emergencyContactPhone =
				updates.emergencyContactPhone ?? null;

		// Handle blood type
		if (updates.bloodType !== undefined)
			personUpdates.bloodType = updates.bloodType ?? null;

		// Handle demographics
		if (updates.gender !== undefined)
			personUpdates.gender = updates.gender ?? null;
		if (updates.civilStatus !== undefined)
			personUpdates.civilStatus = updates.civilStatus ?? null;
		if (updates.placeOfBirth !== undefined)
			personUpdates.placeOfBirth = updates.placeOfBirth ?? null;
		if (updates.residencyStatus !== undefined)
			personUpdates.residencyStatus = updates.residencyStatus;

		// Update person record
		personUpdates.updatedAt = new Date();
		await db.update(people).set(personUpdates).where(eq(people.id, personId));

		// Handle government service identifications using upsert pattern
		for (const serviceType of GOV_SERVICE_TYPES) {
			const record = updates[serviceType];
			if (record === undefined) continue;

			if (record.registered) {
				// Upsert: insert or update on conflict
				await db
					.insert(personIdentifications)
					.values({
						personId,
						type: serviceType,
						idNumber: record.idNumber ?? null,
						issueDate: record.issueDate ?? null,
						expiryDate: record.expiryDate ?? null,
						updatedAt: new Date(),
					})
					.onConflictDoUpdate({
						target: [
							personIdentifications.personId,
							personIdentifications.type,
						],
						set: {
							idNumber: record.idNumber ?? null,
							issueDate: record.issueDate ?? null,
							expiryDate: record.expiryDate ?? null,
							updatedAt: new Date(),
						},
					});
			} else {
				// If not registered, delete the identification record if it exists
				await db
					.delete(personIdentifications)
					.where(
						and(
							eq(personIdentifications.personId, personId),
							eq(personIdentifications.type, serviceType),
						),
					);
			}
		}

		// Fetch and return updated person
		const updatedPerson = await db.query.people.findFirst({
			with: {
				identifications: true,
			},
			where: eq(people.id, personId),
		});

		if (!updatedPerson) {
			throw new Error(`Person with ID ${personId} not found after update`);
		}

		// Log activity with changes
		const changes = computeChanges(
			existingPerson as Record<string, unknown>,
			personUpdates as Record<string, unknown>,
		);
		const personName = [
			updatedPerson.firstName,
			updatedPerson.middleName,
			updatedPerson.lastName,
			updatedPerson.suffix,
		]
			.filter(Boolean)
			.join(" ");
		await logActivity({
			data: {
				action: "update",
				entityType: "person",
				entityId: personId,
				entityName: personName,
				changes,
			},
		});

		return await transformDbPersonToPerson(
			updatedPerson,
			updatedPerson.identifications,
		);
	});

interface CreatePersonInput {
	firstName: string;
	middleName?: string;
	lastName: string;
	suffix?: string;
	birthdate: string;
	address: PersonAddress;
	phoneNumber: string;
	monthlyIncome?: number | null;
	status?: PersonStatus;
	profilePhoto?: string | null;
	voter?: GovServiceRecord;
	philhealth?: GovServiceRecord;
	sss?: GovServiceRecord;
	fourPs?: GovServiceRecord;
	pwd?: GovServiceRecord;
	soloParent?: GovServiceRecord;
	pagibig?: GovServiceRecord;
	tin?: GovServiceRecord;
	barangayClearance?: GovServiceRecord;
	emergencyContactName?: string;
	emergencyContactPhone?: string;
	bloodType?: string;
	gender?: string;
	civilStatus?: string;
	placeOfBirth?: string;
	residencyStatus?: ResidencyStatus;
}

export const createPerson = createServerFn({
	method: "POST",
})
	.inputValidator((input: CreatePersonInput) => input)
	.handler(async ({ data }): Promise<Person> => {
		const session = await getAppSession();
		const role = session.data.role;
		const isBarangay = role === "barangay_admin" || role === "barangay_user";
		if (role !== "superuser" && !isBarangay) {
			throw new Error("Unauthorized");
		}
		if (isBarangay) {
			if (!session.data.barangay) throw new Error("No assigned barangay");
			if (data.address.barangay !== session.data.barangay)
				throw new Error("Can only add people to your own barangay");
		}

		// Insert person
		const [newPerson] = await db
			.insert(people)
			.values({
				firstName: data.firstName,
				middleName: data.middleName ?? null,
				lastName: data.lastName,
				suffix: data.suffix ?? null,
				birthdate: data.birthdate,
				street: data.address.street,
				purok: data.address.purok ?? null,
				barangay: data.address.barangay,
				phoneNumber: data.phoneNumber,
				monthlyIncome: data.monthlyIncome ?? null,
				status: data.status ?? "active",
				profilePhoto: data.profilePhoto ?? null,
				emergencyContactName: data.emergencyContactName ?? null,
				emergencyContactPhone: data.emergencyContactPhone ?? null,
				bloodType: data.bloodType ?? null,
				gender: data.gender ?? null,
				civilStatus: data.civilStatus ?? null,
				placeOfBirth: data.placeOfBirth ?? null,
				residencyStatus: data.residencyStatus ?? "resident",
			})
			.returning();

		// Insert identifications for registered services
		for (const serviceType of GOV_SERVICE_TYPES) {
			const record = data[serviceType];
			if (record?.registered) {
				await db.insert(personIdentifications).values({
					personId: newPerson.id,
					type: serviceType,
					idNumber: record.idNumber ?? null,
					issueDate: record.issueDate ?? null,
					expiryDate: record.expiryDate ?? null,
				});
			}
		}

		// Fetch and return new person with identifications
		const createdPerson = await db.query.people.findFirst({
			with: {
				identifications: true,
			},
			where: eq(people.id, newPerson.id),
		});

		if (!createdPerson) {
			throw new Error("Failed to create person");
		}

		// Log activity
		const personName = [
			data.firstName,
			data.middleName,
			data.lastName,
			data.suffix,
		]
			.filter(Boolean)
			.join(" ");
		await logActivity({
			data: {
				action: "create",
				entityType: "person",
				entityId: newPerson.id,
				entityName: personName,
			},
		});

		return await transformDbPersonToPerson(
			createdPerson,
			createdPerson.identifications,
		);
	});

// Search people by name
export const searchPeople = createServerFn({
	method: "GET",
})
	.inputValidator((query: string) => query)
	.handler(async ({ data: query }): Promise<Person[]> => {
		const searchTerm = `%${query.toLowerCase()}%`;

		const dbPeople = await db.query.people.findMany({
			with: {
				identifications: true,
			},
			where: and(
				ne(people.status, "deleted"),
				sql`(
					LOWER(${people.firstName}) LIKE ${searchTerm} OR
					LOWER(${people.lastName}) LIKE ${searchTerm} OR
					LOWER(${people.middleName}) LIKE ${searchTerm} OR
					${people.phoneNumber} LIKE ${searchTerm}
				)`,
			),
			orderBy: (people, { asc }) => [
				asc(people.lastName),
				asc(people.firstName),
			],
			limit: 50,
		});

		return Promise.all(
			dbPeople.map((p) => transformDbPersonToPerson(p, p.identifications)),
		);
	});

// Soft delete a person (sets status to "deleted")
export const deletePerson = createServerFn({
	method: "POST",
})
	.inputValidator((personId: string) => personId)
	.handler(
		async ({
			data: personId,
		}): Promise<{ success: boolean; error?: string }> => {
			const session = await getAppSession();
			const role = session.data.role;
			const isBarangayAdmin = role === "barangay_admin";
			if (role !== "superuser" && !isBarangayAdmin) {
				throw new Error("Unauthorized");
			}

			const person = await db.query.people.findFirst({
				where: eq(people.id, personId),
			});

			if (!person) {
				return { success: false, error: "Person not found" };
			}

			if (isBarangayAdmin) {
				if (!session.data.barangay || person.barangay !== session.data.barangay)
					throw new Error("Can only delete people in your own barangay");
			}

			// Soft delete - set status to "deleted"
			await db
				.update(people)
				.set({ status: "deleted", updatedAt: new Date() })
				.where(eq(people.id, personId));

			// Log activity
			const personName = [
				person.firstName,
				person.middleName,
				person.lastName,
				person.suffix,
			]
				.filter(Boolean)
				.join(" ");
			await logActivity({
				data: {
					action: "delete",
					entityType: "person",
					entityId: personId,
					entityName: personName,
				},
			});

			return { success: true };
		},
	);
