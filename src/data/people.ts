import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
	type DbPerson,
	type IdentificationType,
	type PersonIdentification,
	people,
	personIdentifications,
} from "@/db/schema";
import type { LoretoBarangay } from "./barangays";

export type PersonStatus = "active" | "inactive" | "pending";

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
	status: PersonStatus;
	profilePhoto?: string;
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
function transformDbPersonToPerson(
	dbPerson: DbPerson,
	identifications: PersonIdentification[],
): Person {
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
		status: dbPerson.status as PersonStatus,
		profilePhoto: dbPerson.profilePhoto ?? undefined,
		voter: buildRecord("voter"),
		philhealth: buildRecord("philhealth"),
		sss: buildRecord("sss"),
		fourPs: buildRecord("fourPs"),
		pwd: buildRecord("pwd"),
		soloParent: buildRecord("soloParent"),
		pagibig: buildRecord("pagibig"),
		tin: buildRecord("tin"),
		barangayClearance: buildRecord("barangayClearance"),
		createdAt: dbPerson.createdAt?.toISOString() ?? new Date().toISOString(),
		updatedAt: dbPerson.updatedAt?.toISOString() ?? new Date().toISOString(),
	};
}

export const getPeople = createServerFn({
	method: "GET",
}).handler(async (): Promise<Person[]> => {
	const dbPeople = await db.query.people.findMany({
		with: {
			identifications: true,
		},
		orderBy: (people, { asc }) => [asc(people.lastName), asc(people.firstName)],
	});

	return dbPeople.map((p) => transformDbPersonToPerson(p, p.identifications));
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

		return transformDbPersonToPerson(dbPerson, dbPerson.identifications);
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
		// Verify person exists
		const existingPerson = await db.query.people.findFirst({
			where: eq(people.id, personId),
		});

		if (!existingPerson) {
			throw new Error(`Person with ID ${personId} not found`);
		}

		// Build update values for person table
		const personUpdates: Partial<DbPerson> = {};

		if (updates.firstName !== undefined) personUpdates.firstName = updates.firstName;
		if (updates.middleName !== undefined) personUpdates.middleName = updates.middleName ?? null;
		if (updates.lastName !== undefined) personUpdates.lastName = updates.lastName;
		if (updates.suffix !== undefined) personUpdates.suffix = updates.suffix ?? null;
		if (updates.birthdate !== undefined) personUpdates.birthdate = updates.birthdate;
		if (updates.phoneNumber !== undefined) personUpdates.phoneNumber = updates.phoneNumber;
		if (updates.status !== undefined) personUpdates.status = updates.status;
		if (updates.profilePhoto !== undefined) personUpdates.profilePhoto = updates.profilePhoto ?? null;

		// Handle address fields
		if (updates.address) {
			if (updates.address.street !== undefined) personUpdates.street = updates.address.street;
			if (updates.address.purok !== undefined) personUpdates.purok = updates.address.purok ?? null;
			if (updates.address.barangay !== undefined) personUpdates.barangay = updates.address.barangay;
		}

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
						target: [personIdentifications.personId, personIdentifications.type],
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

		return transformDbPersonToPerson(updatedPerson, updatedPerson.identifications);
	});

interface CreatePersonInput {
	firstName: string;
	middleName?: string;
	lastName: string;
	suffix?: string;
	birthdate: string;
	address: PersonAddress;
	phoneNumber: string;
	status?: PersonStatus;
	profilePhoto?: string;
	voter?: GovServiceRecord;
	philhealth?: GovServiceRecord;
	sss?: GovServiceRecord;
	fourPs?: GovServiceRecord;
	pwd?: GovServiceRecord;
	soloParent?: GovServiceRecord;
	pagibig?: GovServiceRecord;
	tin?: GovServiceRecord;
	barangayClearance?: GovServiceRecord;
}

export const createPerson = createServerFn({
	method: "POST",
})
	.inputValidator((input: CreatePersonInput) => input)
	.handler(async ({ data }): Promise<Person> => {
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
				status: data.status ?? "active",
				profilePhoto: data.profilePhoto ?? null,
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

		return transformDbPersonToPerson(createdPerson, createdPerson.identifications);
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
			where: sql`(
				LOWER(${people.firstName}) LIKE ${searchTerm} OR
				LOWER(${people.lastName}) LIKE ${searchTerm} OR
				LOWER(${people.middleName}) LIKE ${searchTerm} OR
				${people.phoneNumber} LIKE ${searchTerm}
			)`,
			orderBy: (people, { asc }) => [asc(people.lastName), asc(people.firstName)],
			limit: 50,
		});

		return dbPeople.map((p) => transformDbPersonToPerson(p, p.identifications));
	});
