import { createServerFn } from "@tanstack/react-start";

export type PersonStatus = "active" | "inactive" | "pending";

export interface PersonAddress {
	street: string;
	zipCode: string;
}

export interface Person {
	id: string;
	firstName: string;
	lastName: string;
	birthdate: string;
	address: PersonAddress;
	phoneNumber: string;
	status: PersonStatus;
	createdAt: string;
	updatedAt: string;
}

const mockPeople: Person[] = [
	{
		id: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
		firstName: "Maria",
		lastName: "Santos",
		birthdate: "1985-03-15",
		address: {
			street: "123 Rizal Street",
			zipCode: "1000",
		},
		phoneNumber: "(632) 555-0101",
		status: "active",
		createdAt: "2024-01-15T08:30:00Z",
		updatedAt: "2024-12-01T10:15:00Z",
	},
	{
		id: "2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e",
		firstName: "Juan",
		lastName: "Dela Cruz",
		birthdate: "1990-07-22",
		address: {
			street: "456 Bonifacio Avenue",
			zipCode: "1001",
		},
		phoneNumber: "(632) 555-0102",
		status: "active",
		createdAt: "2024-02-10T09:00:00Z",
		updatedAt: "2024-11-28T14:30:00Z",
	},
	{
		id: "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
		firstName: "Rosa",
		lastName: "Reyes",
		birthdate: "1978-11-08",
		address: {
			street: "789 Mabini Street",
			zipCode: "1002",
		},
		phoneNumber: "(632) 555-0103",
		status: "inactive",
		createdAt: "2024-01-20T11:45:00Z",
		updatedAt: "2024-10-15T16:20:00Z",
	},
	{
		id: "4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a",
		firstName: "Jose",
		lastName: "Garcia",
		birthdate: "1982-05-30",
		address: {
			street: "321 Quezon Boulevard",
			zipCode: "1003",
		},
		phoneNumber: "(632) 555-0104",
		status: "active",
		createdAt: "2024-03-05T13:20:00Z",
		updatedAt: "2024-12-05T09:10:00Z",
	},
	{
		id: "5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b",
		firstName: "Ana",
		lastName: "Mendoza",
		birthdate: "1995-09-12",
		address: {
			street: "654 Luna Street",
			zipCode: "1004",
		},
		phoneNumber: "(632) 555-0105",
		status: "pending",
		createdAt: "2024-11-01T15:30:00Z",
		updatedAt: "2024-12-10T11:45:00Z",
	},
	{
		id: "6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c",
		firstName: "Pedro",
		lastName: "Ramos",
		birthdate: "1988-12-25",
		address: {
			street: "987 Del Pilar Avenue",
			zipCode: "1005",
		},
		phoneNumber: "(632) 555-0106",
		status: "active",
		createdAt: "2024-04-12T10:00:00Z",
		updatedAt: "2024-11-30T13:25:00Z",
	},
	{
		id: "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
		firstName: "Carmen",
		lastName: "Aquino",
		birthdate: "1975-06-18",
		address: {
			street: "147 Aguinaldo Street",
			zipCode: "1006",
		},
		phoneNumber: "(632) 555-0107",
		status: "active",
		createdAt: "2024-02-28T12:15:00Z",
		updatedAt: "2024-12-08T08:50:00Z",
	},
	{
		id: "8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e",
		firstName: "Miguel",
		lastName: "Torres",
		birthdate: "1992-04-05",
		address: {
			street: "258 Lapu-Lapu Road",
			zipCode: "1007",
		},
		phoneNumber: "(632) 555-0108",
		status: "inactive",
		createdAt: "2024-05-20T14:40:00Z",
		updatedAt: "2024-09-22T10:30:00Z",
	},
	{
		id: "9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f",
		firstName: "Elena",
		lastName: "Cruz",
		birthdate: "1987-08-14",
		address: {
			street: "369 Roxas Boulevard",
			zipCode: "1008",
		},
		phoneNumber: "(632) 555-0109",
		status: "active",
		createdAt: "2024-06-15T09:25:00Z",
		updatedAt: "2024-12-03T15:10:00Z",
	},
	{
		id: "0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a",
		firstName: "Roberto",
		lastName: "Villanueva",
		birthdate: "1980-02-28",
		address: {
			street: "741 Taft Avenue",
			zipCode: "1009",
		},
		phoneNumber: "(632) 555-0110",
		status: "pending",
		createdAt: "2024-10-05T11:50:00Z",
		updatedAt: "2024-12-09T14:20:00Z",
	},
	{
		id: "1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b",
		firstName: "Luisa",
		lastName: "Fernandez",
		birthdate: "1993-10-20",
		address: {
			street: "852 Escolta Street",
			zipCode: "1010",
		},
		phoneNumber: "(632) 555-0111",
		status: "active",
		createdAt: "2024-03-18T08:15:00Z",
		updatedAt: "2024-11-25T12:40:00Z",
	},
	{
		id: "2f3a4b5c-6d7e-8f9a-0b1c-2d3e4f5a6b7c",
		firstName: "Antonio",
		lastName: "Navarro",
		birthdate: "1976-01-10",
		address: {
			street: "963 Makati Avenue",
			zipCode: "1011",
		},
		phoneNumber: "(632) 555-0112",
		status: "active",
		createdAt: "2024-07-22T13:30:00Z",
		updatedAt: "2024-12-07T09:55:00Z",
	},
	{
		id: "3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d",
		firstName: "Isabel",
		lastName: "Lopez",
		birthdate: "1989-09-03",
		address: {
			street: "159 Buendia Avenue",
			zipCode: "1012",
		},
		phoneNumber: "(632) 555-0113",
		status: "inactive",
		createdAt: "2024-04-08T10:20:00Z",
		updatedAt: "2024-08-14T16:00:00Z",
	},
	{
		id: "4b5c6d7e-8f9a-0b1c-2d3e-4f5a6b7c8d9e",
		firstName: "Rafael",
		lastName: "Morales",
		birthdate: "1991-07-17",
		address: {
			street: "357 EDSA",
			zipCode: "1013",
		},
		phoneNumber: "(632) 555-0114",
		status: "active",
		createdAt: "2024-08-10T15:45:00Z",
		updatedAt: "2024-12-02T11:30:00Z",
	},
	{
		id: "5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f",
		firstName: "Teresa",
		lastName: "Castillo",
		birthdate: "1984-12-01",
		address: {
			street: "468 Shaw Boulevard",
			zipCode: "1014",
		},
		phoneNumber: "(632) 555-0115",
		status: "pending",
		createdAt: "2024-09-25T12:10:00Z",
		updatedAt: "2024-12-11T10:05:00Z",
	},
	{
		id: "6d7e8f9a-0b1c-2d3e-4f5a-6b7c8d9e0f1a",
		firstName: "Francisco",
		lastName: "Gutierrez",
		birthdate: "1979-03-26",
		address: {
			street: "579 Ortigas Avenue",
			zipCode: "1015",
		},
		phoneNumber: "(632) 555-0116",
		status: "active",
		createdAt: "2024-05-14T09:35:00Z",
		updatedAt: "2024-11-20T14:15:00Z",
	},
	{
		id: "7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b",
		firstName: "Patricia",
		lastName: "Ramirez",
		birthdate: "1996-11-29",
		address: {
			street: "680 Ayala Avenue",
			zipCode: "1016",
		},
		phoneNumber: "(632) 555-0117",
		status: "active",
		createdAt: "2024-06-30T11:00:00Z",
		updatedAt: "2024-12-06T13:45:00Z",
	},
	{
		id: "8f9a0b1c-2d3e-4f5a-6b7c-8d9e0f1a2b3c",
		firstName: "Diego",
		lastName: "Bautista",
		birthdate: "1986-05-07",
		address: {
			street: "791 Gil Puyat Avenue",
			zipCode: "1017",
		},
		phoneNumber: "(632) 555-0118",
		status: "inactive",
		createdAt: "2024-07-08T14:25:00Z",
		updatedAt: "2024-10-01T09:20:00Z",
	},
	{
		id: "9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d",
		firstName: "Angelica",
		lastName: "Rivera",
		birthdate: "1994-08-23",
		address: {
			street: "802 Aurora Boulevard",
			zipCode: "1018",
		},
		phoneNumber: "(632) 555-0119",
		status: "active",
		createdAt: "2024-08-20T10:50:00Z",
		updatedAt: "2024-12-04T15:30:00Z",
	},
	{
		id: "0b1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e",
		firstName: "Carlos",
		lastName: "Jimenez",
		birthdate: "1981-04-16",
		address: {
			street: "913 Commonwealth Avenue",
			zipCode: "1019",
		},
		phoneNumber: "(632) 555-0120",
		status: "pending",
		createdAt: "2024-09-12T13:15:00Z",
		updatedAt: "2024-12-12T08:25:00Z",
	},
	{
		id: "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
		firstName: "Gloria",
		lastName: "Soriano",
		birthdate: "1977-06-11",
		address: {
			street: "024 España Boulevard",
			zipCode: "1020",
		},
		phoneNumber: "(632) 555-0121",
		status: "active",
		createdAt: "2024-10-18T09:40:00Z",
		updatedAt: "2024-11-29T12:55:00Z",
	},
	{
		id: "2d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a",
		firstName: "Fernando",
		lastName: "Santiago",
		birthdate: "1998-02-14",
		address: {
			street: "135 Marcos Highway",
			zipCode: "1021",
		},
		phoneNumber: "(632) 555-0122",
		status: "active",
		createdAt: "2024-11-05T14:05:00Z",
		updatedAt: "2024-12-10T16:40:00Z",
	},
	{
		id: "3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7a8b",
		firstName: "Beatriz",
		lastName: "Flores",
		birthdate: "1983-10-09",
		address: {
			street: "246 Katipunan Avenue",
			zipCode: "1022",
		},
		phoneNumber: "(632) 555-0123",
		status: "inactive",
		createdAt: "2024-04-25T11:30:00Z",
		updatedAt: "2024-07-19T13:10:00Z",
	},
	{
		id: "4f5a6b7c-8d9e-0f1a-2b3c-4d5e6f7a8b9c",
		firstName: "Rodrigo",
		lastName: "Hernandez",
		birthdate: "1990-01-21",
		address: {
			street: "357 Macapagal Boulevard",
			zipCode: "1023",
		},
		phoneNumber: "(632) 555-0124",
		status: "active",
		createdAt: "2024-12-01T08:00:00Z",
		updatedAt: "2024-12-11T10:20:00Z",
	},
	{
		id: "5a6b7c8d-9e0f-1a2b-3c4d-5e6f7a8b9c0d",
		firstName: "Victoria",
		lastName: "Pascual",
		birthdate: "1997-09-27",
		address: {
			street: "468 Araneta Avenue",
			zipCode: "1024",
		},
		phoneNumber: "(632) 555-0125",
		status: "pending",
		createdAt: "2024-11-20T15:20:00Z",
		updatedAt: "2024-12-13T09:15:00Z",
	},
];

export const getPeople = createServerFn({
	method: "GET",
}).handler(async () => {
	return mockPeople;
});

export const getPersonById = createServerFn({
	method: "GET",
})
	.inputValidator((personId: string) => personId)
	.handler(async ({ data: personId }) => {
		const person = mockPeople.find((p) => p.id === personId);
		if (!person) {
			throw new Error(`Person with ID ${personId} not found`);
		}
		return person;
	});
