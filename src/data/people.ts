import { createServerFn } from "@tanstack/react-start";
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

const mockPeople: Person[] = [
	{
		id: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
		firstName: "Maria",
		middleName: "Concepcion",
		lastName: "Santos",
		birthdate: "1985-03-15",
		address: {
			street: "123 Rizal Street",
			barangay: "Poblacion",
		},
		phoneNumber: "(632) 555-0101",
		status: "active",
		profilePhoto: "https://i.pravatar.cc/150?u=maria.santos",
		voter: {
			registered: true,
			idNumber: "1234-5678A-B12CD3E",
			issueDate: "2022-05-10",
		},
		philhealth: {
			registered: true,
			idNumber: "01-234567890-1",
			issueDate: "2020-03-15",
		},
		sss: {
			registered: true,
			idNumber: "12-3456789-0",
			issueDate: "2010-06-20",
		},
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: {
			registered: true,
			idNumber: "123456789012",
			issueDate: "2015-08-10",
		},
		tin: {
			registered: true,
			idNumber: "123-456-789",
			issueDate: "2008-01-15",
		},
		barangayClearance: {
			registered: true,
			idNumber: "BC-2024-001234",
			issueDate: "2024-06-01",
			expiryDate: "2025-06-01",
		},
		createdAt: "2024-01-15T08:30:00Z",
		updatedAt: "2024-12-01T10:15:00Z",
	},
	{
		id: "2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e",
		firstName: "Juan",
		middleName: "Bautista",
		lastName: "Dela Cruz",
		suffix: "Jr.",
		birthdate: "1990-07-22",
		address: {
			street: "456 Bonifacio Avenue",
			barangay: "Binucayan",
		},
		phoneNumber: "(632) 555-0102",
		status: "active",
		profilePhoto: "https://i.pravatar.cc/150?u=juan.delacruz",
		voter: {
			registered: true,
			idNumber: "2345-6789B-C23DE4F",
			issueDate: "2019-10-15",
		},
		philhealth: {
			registered: true,
			idNumber: "02-345678901-2",
			issueDate: "2021-02-20",
		},
		sss: { registered: false },
		fourPs: {
			registered: true,
			idNumber: "4PS-2020-123456",
			issueDate: "2020-01-10",
		},
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: { registered: false },
		tin: { registered: false },
		barangayClearance: {
			registered: true,
			idNumber: "BC-2024-002345",
			issueDate: "2024-08-15",
			expiryDate: "2025-08-15",
		},
		createdAt: "2024-02-10T09:00:00Z",
		updatedAt: "2024-11-28T14:30:00Z",
	},
	{
		id: "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
		firstName: "Rosa",
		middleName: "Magtanggol",
		lastName: "Reyes",
		birthdate: "1978-11-08",
		address: {
			street: "789 Mabini Street",
			barangay: "Johnson",
		},
		phoneNumber: "(632) 555-0103",
		status: "inactive",
		profilePhoto: "https://i.pravatar.cc/150?u=rosa.reyes",
		voter: {
			registered: true,
			idNumber: "3456-7890C-D34EF5G",
			issueDate: "2016-04-20",
		},
		philhealth: { registered: false },
		sss: {
			registered: true,
			idNumber: "34-5678901-2",
			issueDate: "2005-09-12",
		},
		fourPs: { registered: false },
		pwd: {
			registered: true,
			idNumber: "PWD-2019-789012",
			issueDate: "2019-03-25",
			expiryDate: "2024-03-25",
		},
		soloParent: {
			registered: true,
			idNumber: "SP-2018-456789",
			issueDate: "2018-07-10",
			expiryDate: "2025-07-10",
		},
		pagibig: {
			registered: true,
			idNumber: "345678901234",
			issueDate: "2008-11-30",
		},
		tin: {
			registered: true,
			idNumber: "345-678-901",
			issueDate: "2003-05-18",
		},
		barangayClearance: {
			registered: true,
			idNumber: "BC-2023-003456",
			issueDate: "2023-10-01",
			expiryDate: "2024-10-01",
		},
		createdAt: "2024-01-20T11:45:00Z",
		updatedAt: "2024-10-15T16:20:00Z",
	},
	{
		id: "4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a",
		firstName: "Jose",
		middleName: "Mercado",
		lastName: "Garcia",
		suffix: "Sr.",
		birthdate: "1960-05-30",
		address: {
			street: "321 Quezon Boulevard",
			barangay: "Kasapa",
		},
		phoneNumber: "(632) 555-0104",
		status: "active",
		profilePhoto: "https://i.pravatar.cc/150?u=jose.garcia",
		voter: {
			registered: true,
			idNumber: "4567-8901D-E45FG6H",
			issueDate: "1988-06-15",
		},
		philhealth: {
			registered: true,
			idNumber: "04-567890123-4",
			issueDate: "1997-01-20",
		},
		sss: {
			registered: true,
			idNumber: "45-6789012-3",
			issueDate: "1985-03-10",
		},
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: {
			registered: true,
			idNumber: "456789012345",
			issueDate: "1990-07-25",
		},
		tin: {
			registered: true,
			idNumber: "456-789-012",
			issueDate: "1988-12-05",
		},
		barangayClearance: {
			registered: true,
			idNumber: "BC-2024-004567",
			issueDate: "2024-03-01",
			expiryDate: "2025-03-01",
		},
		createdAt: "2024-03-05T13:20:00Z",
		updatedAt: "2024-12-05T09:10:00Z",
	},
	{
		id: "5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b",
		firstName: "Ana",
		middleName: "Liza",
		lastName: "Mendoza",
		birthdate: "1995-09-12",
		address: {
			street: "654 Luna Street",
			barangay: "Katipunan",
		},
		phoneNumber: "(632) 555-0105",
		status: "pending",
		voter: { registered: false },
		philhealth: { registered: false },
		sss: { registered: false },
		fourPs: {
			registered: true,
			idNumber: "4PS-2022-234567",
			issueDate: "2022-06-15",
		},
		pwd: { registered: false },
		soloParent: {
			registered: true,
			idNumber: "SP-2023-567890",
			issueDate: "2023-01-20",
			expiryDate: "2026-01-20",
		},
		pagibig: { registered: false },
		tin: { registered: false },
		barangayClearance: { registered: false },
		createdAt: "2024-11-01T15:30:00Z",
		updatedAt: "2024-12-10T11:45:00Z",
	},
	{
		id: "6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c",
		firstName: "Pedro",
		middleName: "Rizal",
		lastName: "Ramos",
		suffix: "III",
		birthdate: "1988-12-25",
		address: {
			street: "987 Del Pilar Avenue",
			barangay: "Kauswagan",
		},
		phoneNumber: "(632) 555-0106",
		status: "active",
		voter: {
			registered: true,
			idNumber: "5678-9012E-F56GH7I",
			issueDate: "2010-11-20",
		},
		philhealth: {
			registered: true,
			idNumber: "05-678901234-5",
			issueDate: "2012-04-15",
		},
		sss: {
			registered: true,
			idNumber: "56-7890123-4",
			issueDate: "2010-08-25",
		},
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: {
			registered: true,
			idNumber: "567890123456",
			issueDate: "2011-02-10",
		},
		tin: {
			registered: true,
			idNumber: "567-890-123",
			issueDate: "2010-05-30",
		},
		barangayClearance: {
			registered: true,
			idNumber: "BC-2024-005678",
			issueDate: "2024-07-01",
			expiryDate: "2025-07-01",
		},
		createdAt: "2024-04-12T10:00:00Z",
		updatedAt: "2024-11-30T13:25:00Z",
	},
	{
		id: "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
		firstName: "Carmen",
		middleName: "Aguirre",
		lastName: "Aquino",
		birthdate: "1955-06-18",
		address: {
			street: "147 Aguinaldo Street",
			barangay: "Magaud",
		},
		phoneNumber: "(632) 555-0107",
		status: "active",
		voter: {
			registered: true,
			idNumber: "6789-0123F-G67HI8J",
			issueDate: "1978-05-10",
		},
		philhealth: {
			registered: true,
			idNumber: "06-789012345-6",
			issueDate: "1995-09-20",
		},
		sss: {
			registered: true,
			idNumber: "67-8901234-5",
			issueDate: "1980-02-15",
		},
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: {
			registered: true,
			idNumber: "678901234567",
			issueDate: "1985-11-05",
		},
		tin: {
			registered: true,
			idNumber: "678-901-234",
			issueDate: "1982-07-20",
		},
		barangayClearance: {
			registered: true,
			idNumber: "BC-2024-006789",
			issueDate: "2024-05-15",
			expiryDate: "2025-05-15",
		},
		createdAt: "2024-02-28T12:15:00Z",
		updatedAt: "2024-12-08T08:50:00Z",
	},
	{
		id: "8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e",
		firstName: "Miguel",
		middleName: "Angelo",
		lastName: "Torres",
		birthdate: "1992-04-05",
		address: {
			street: "258 Lapu-Lapu Road",
			barangay: "Nueva Gracia",
		},
		phoneNumber: "(632) 555-0108",
		status: "inactive",
		voter: { registered: false },
		philhealth: { registered: false },
		sss: { registered: false },
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: { registered: false },
		tin: { registered: false },
		barangayClearance: {
			registered: true,
			idNumber: "BC-2023-007890",
			issueDate: "2023-09-01",
			expiryDate: "2024-09-01",
		},
		createdAt: "2024-05-20T14:40:00Z",
		updatedAt: "2024-09-22T10:30:00Z",
	},
	{
		id: "9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f",
		firstName: "Elena",
		middleName: "Marie",
		lastName: "Cruz",
		birthdate: "1987-08-14",
		address: {
			street: "369 Roxas Boulevard",
			barangay: "Sabud",
		},
		phoneNumber: "(632) 555-0109",
		status: "active",
		voter: {
			registered: true,
			idNumber: "7890-1234G-H78IJ9K",
			issueDate: "2013-03-25",
		},
		philhealth: {
			registered: true,
			idNumber: "07-890123456-7",
			issueDate: "2015-06-10",
		},
		sss: {
			registered: true,
			idNumber: "78-9012345-6",
			issueDate: "2012-11-18",
		},
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: {
			registered: true,
			idNumber: "789012345678",
			issueDate: "2014-04-22",
		},
		tin: {
			registered: true,
			idNumber: "789-012-345",
			issueDate: "2012-08-30",
		},
		barangayClearance: {
			registered: true,
			idNumber: "BC-2024-008901",
			issueDate: "2024-09-01",
			expiryDate: "2025-09-01",
		},
		createdAt: "2024-06-15T09:25:00Z",
		updatedAt: "2024-12-03T15:10:00Z",
	},
	{
		id: "0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a",
		firstName: "Roberto",
		middleName: "Pascual",
		lastName: "Villanueva",
		suffix: "II",
		birthdate: "1980-02-28",
		address: {
			street: "741 Taft Avenue",
			barangay: "San Isidro",
		},
		phoneNumber: "(632) 555-0110",
		status: "pending",
		voter: {
			registered: true,
			idNumber: "8901-2345H-I89JK0L",
			issueDate: "2004-07-12",
		},
		philhealth: { registered: false },
		sss: { registered: false },
		fourPs: { registered: false },
		pwd: {
			registered: true,
			idNumber: "PWD-2022-890123",
			issueDate: "2022-05-15",
			expiryDate: "2027-05-15",
		},
		soloParent: { registered: false },
		pagibig: { registered: false },
		tin: { registered: false },
		barangayClearance: { registered: false },
		createdAt: "2024-10-05T11:50:00Z",
		updatedAt: "2024-12-09T14:20:00Z",
	},
	{
		id: "1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b",
		firstName: "Luisa",
		middleName: "Fernanda",
		lastName: "Fernandez",
		birthdate: "1993-10-20",
		address: {
			street: "852 Escolta Street",
			barangay: "San Mariano",
		},
		phoneNumber: "(632) 555-0111",
		status: "active",
		voter: {
			registered: true,
			idNumber: "9012-3456I-J90KL1M",
			issueDate: "2016-08-18",
		},
		philhealth: {
			registered: true,
			idNumber: "08-901234567-8",
			issueDate: "2018-02-28",
		},
		sss: { registered: false },
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: {
			registered: true,
			idNumber: "890123456789",
			issueDate: "2017-10-05",
		},
		tin: {
			registered: true,
			idNumber: "890-123-456",
			issueDate: "2016-04-15",
		},
		barangayClearance: {
			registered: true,
			idNumber: "BC-2024-009012",
			issueDate: "2024-04-01",
			expiryDate: "2025-04-01",
		},
		createdAt: "2024-03-18T08:15:00Z",
		updatedAt: "2024-11-25T12:40:00Z",
	},
	{
		id: "2f3a4b5c-6d7e-8f9a-0b1c-2d3e4f5a6b7c",
		firstName: "Antonio",
		middleName: "Buenaventura",
		lastName: "Navarro",
		birthdate: "1956-01-10",
		address: {
			street: "963 Makati Avenue",
			barangay: "San Vicente",
		},
		phoneNumber: "(632) 555-0112",
		status: "active",
		voter: {
			registered: true,
			idNumber: "0123-4567J-K01LM2N",
			issueDate: "1979-03-10",
		},
		philhealth: {
			registered: true,
			idNumber: "09-012345678-9",
			issueDate: "1997-11-15",
		},
		sss: {
			registered: true,
			idNumber: "89-0123456-7",
			issueDate: "1981-06-25",
		},
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: {
			registered: true,
			idNumber: "901234567890",
			issueDate: "1986-09-12",
		},
		tin: {
			registered: true,
			idNumber: "901-234-567",
			issueDate: "1983-02-28",
		},
		barangayClearance: {
			registered: true,
			idNumber: "BC-2024-010123",
			issueDate: "2024-10-01",
			expiryDate: "2025-10-01",
		},
		createdAt: "2024-07-22T13:30:00Z",
		updatedAt: "2024-12-07T09:55:00Z",
	},
	{
		id: "3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d",
		firstName: "Isabel",
		middleName: "Cristina",
		lastName: "Lopez",
		birthdate: "1989-09-03",
		address: {
			street: "159 Buendia Avenue",
			barangay: "Santa Teresa",
		},
		phoneNumber: "(632) 555-0113",
		status: "inactive",
		voter: {
			registered: true,
			idNumber: "1234-5678K-L12MN3O",
			issueDate: "2013-09-20",
		},
		philhealth: { registered: false },
		sss: {
			registered: true,
			idNumber: "90-1234567-8",
			issueDate: "2014-05-10",
		},
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: { registered: false },
		tin: {
			registered: true,
			idNumber: "012-345-678",
			issueDate: "2013-11-22",
		},
		barangayClearance: {
			registered: true,
			idNumber: "BC-2023-011234",
			issueDate: "2023-08-01",
			expiryDate: "2024-08-01",
		},
		createdAt: "2024-04-08T10:20:00Z",
		updatedAt: "2024-08-14T16:00:00Z",
	},
	{
		id: "4b5c6d7e-8f9a-0b1c-2d3e-4f5a6b7c8d9e",
		firstName: "Rafael",
		middleName: "Miguel",
		lastName: "Morales",
		birthdate: "1991-07-17",
		address: {
			street: "357 EDSA",
			barangay: "Santo Nino",
		},
		phoneNumber: "(632) 555-0114",
		status: "active",
		voter: {
			registered: true,
			idNumber: "2345-6789L-M23NO4P",
			issueDate: "2014-10-05",
		},
		philhealth: {
			registered: true,
			idNumber: "10-123456789-0",
			issueDate: "2016-03-18",
		},
		sss: {
			registered: true,
			idNumber: "01-2345678-9",
			issueDate: "2015-07-22",
		},
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: {
			registered: true,
			idNumber: "012345678901",
			issueDate: "2015-12-08",
		},
		tin: {
			registered: true,
			idNumber: "123-456-780",
			issueDate: "2014-06-30",
		},
		barangayClearance: {
			registered: true,
			idNumber: "BC-2024-012345",
			issueDate: "2024-11-01",
			expiryDate: "2025-11-01",
		},
		createdAt: "2024-08-10T15:45:00Z",
		updatedAt: "2024-12-02T11:30:00Z",
	},
	{
		id: "5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f",
		firstName: "Teresa",
		middleName: "Lucia",
		lastName: "Castillo",
		birthdate: "1984-12-01",
		address: {
			street: "468 Shaw Boulevard",
			barangay: "Santo Tomas",
		},
		phoneNumber: "(632) 555-0115",
		status: "pending",
		voter: { registered: false },
		philhealth: {
			registered: true,
			idNumber: "11-234567890-1",
			issueDate: "2019-08-12",
		},
		sss: { registered: false },
		fourPs: {
			registered: true,
			idNumber: "4PS-2021-345678",
			issueDate: "2021-03-25",
		},
		pwd: { registered: false },
		soloParent: {
			registered: true,
			idNumber: "SP-2020-678901",
			issueDate: "2020-09-15",
			expiryDate: "2025-09-15",
		},
		pagibig: { registered: false },
		tin: { registered: false },
		barangayClearance: { registered: false },
		createdAt: "2024-09-25T12:10:00Z",
		updatedAt: "2024-12-11T10:05:00Z",
	},
	{
		id: "6d7e8f9a-0b1c-2d3e-4f5a-6b7c8d9e0f1a",
		firstName: "Francisco",
		middleName: "Jose",
		lastName: "Gutierrez",
		suffix: "IV",
		birthdate: "1959-03-26",
		address: {
			street: "579 Ortigas Avenue",
			barangay: "Violanta",
		},
		phoneNumber: "(632) 555-0116",
		status: "active",
		voter: {
			registered: true,
			idNumber: "3456-7890M-N34OP5Q",
			issueDate: "1982-04-15",
		},
		philhealth: {
			registered: true,
			idNumber: "12-345678901-2",
			issueDate: "1998-07-20",
		},
		sss: {
			registered: true,
			idNumber: "12-3456780-1",
			issueDate: "1984-01-08",
		},
		fourPs: { registered: false },
		pwd: {
			registered: true,
			idNumber: "PWD-2020-901234",
			issueDate: "2020-11-10",
			expiryDate: "2025-11-10",
		},
		soloParent: { registered: false },
		pagibig: {
			registered: true,
			idNumber: "123456789012",
			issueDate: "1988-05-25",
		},
		tin: {
			registered: true,
			idNumber: "234-567-890",
			issueDate: "1985-09-18",
		},
		barangayClearance: {
			registered: true,
			idNumber: "BC-2024-013456",
			issueDate: "2024-02-15",
			expiryDate: "2025-02-15",
		},
		createdAt: "2024-05-14T09:35:00Z",
		updatedAt: "2024-11-20T14:15:00Z",
	},
	{
		id: "7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b",
		firstName: "Patricia",
		middleName: "Ann",
		lastName: "Ramirez",
		birthdate: "1996-11-29",
		address: {
			street: "680 Ayala Avenue",
			barangay: "Waloe",
		},
		phoneNumber: "(632) 555-0117",
		status: "active",
		voter: {
			registered: true,
			idNumber: "4567-8901N-O45PQ6R",
			issueDate: "2019-11-25",
		},
		philhealth: {
			registered: true,
			idNumber: "13-456789012-3",
			issueDate: "2021-05-08",
		},
		sss: { registered: false },
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: { registered: false },
		tin: { registered: false },
		barangayClearance: {
			registered: true,
			idNumber: "BC-2024-014567",
			issueDate: "2024-06-01",
			expiryDate: "2025-06-01",
		},
		createdAt: "2024-06-30T11:00:00Z",
		updatedAt: "2024-12-06T13:45:00Z",
	},
	{
		id: "8f9a0b1c-2d3e-4f5a-6b7c-8d9e0f1a2b3c",
		firstName: "Diego",
		middleName: "Alfonso",
		lastName: "Bautista",
		birthdate: "1986-05-07",
		address: {
			street: "791 Gil Puyat Avenue",
			barangay: "Poblacion",
		},
		phoneNumber: "(632) 555-0118",
		status: "inactive",
		voter: {
			registered: true,
			idNumber: "5678-9012O-P56QR7S",
			issueDate: "2010-05-12",
		},
		philhealth: { registered: false },
		sss: {
			registered: true,
			idNumber: "23-4567890-1",
			issueDate: "2011-02-28",
		},
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: {
			registered: true,
			idNumber: "234567890123",
			issueDate: "2012-08-15",
		},
		tin: {
			registered: true,
			idNumber: "345-678-901",
			issueDate: "2010-10-22",
		},
		barangayClearance: {
			registered: true,
			idNumber: "BC-2023-015678",
			issueDate: "2023-10-01",
			expiryDate: "2024-10-01",
		},
		createdAt: "2024-07-08T14:25:00Z",
		updatedAt: "2024-10-01T09:20:00Z",
	},
	{
		id: "9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d",
		firstName: "Angelica",
		middleName: "Rose",
		lastName: "Rivera",
		birthdate: "1994-08-23",
		address: {
			street: "802 Aurora Boulevard",
			barangay: "Binucayan",
		},
		phoneNumber: "(632) 555-0119",
		status: "active",
		voter: {
			registered: true,
			idNumber: "6789-0123P-Q67RS8T",
			issueDate: "2017-08-20",
		},
		philhealth: {
			registered: true,
			idNumber: "14-567890123-4",
			issueDate: "2019-01-15",
		},
		sss: {
			registered: true,
			idNumber: "34-5678901-2",
			issueDate: "2018-06-10",
		},
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: {
			registered: true,
			idNumber: "345678901234",
			issueDate: "2018-11-28",
		},
		tin: {
			registered: true,
			idNumber: "456-789-012",
			issueDate: "2017-04-05",
		},
		barangayClearance: {
			registered: true,
			idNumber: "BC-2024-016789",
			issueDate: "2024-08-01",
			expiryDate: "2025-08-01",
		},
		createdAt: "2024-08-20T10:50:00Z",
		updatedAt: "2024-12-04T15:30:00Z",
	},
	{
		id: "0b1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e",
		firstName: "Carlos",
		middleName: "Eduardo",
		lastName: "Jimenez",
		suffix: "V",
		birthdate: "1981-04-16",
		address: {
			street: "913 Commonwealth Avenue",
			barangay: "Johnson",
		},
		phoneNumber: "(632) 555-0120",
		status: "pending",
		voter: { registered: false },
		philhealth: { registered: false },
		sss: { registered: false },
		fourPs: {
			registered: true,
			idNumber: "4PS-2023-456789",
			issueDate: "2023-04-10",
		},
		pwd: { registered: false },
		soloParent: {
			registered: true,
			idNumber: "SP-2022-789012",
			issueDate: "2022-12-05",
			expiryDate: "2025-12-05",
		},
		pagibig: { registered: false },
		tin: { registered: false },
		barangayClearance: { registered: false },
		createdAt: "2024-09-12T13:15:00Z",
		updatedAt: "2024-12-12T08:25:00Z",
	},
	{
		id: "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
		firstName: "Gloria",
		middleName: "Esperanza",
		lastName: "Soriano",
		birthdate: "1957-06-11",
		address: {
			street: "024 Espana Boulevard",
			barangay: "Kasapa",
		},
		phoneNumber: "(632) 555-0121",
		status: "active",
		voter: {
			registered: true,
			idNumber: "7890-1234Q-R78ST9U",
			issueDate: "1980-07-18",
		},
		philhealth: {
			registered: true,
			idNumber: "15-678901234-5",
			issueDate: "1997-12-10",
		},
		sss: {
			registered: true,
			idNumber: "45-6789012-3",
			issueDate: "1982-03-25",
		},
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: {
			registered: true,
			idNumber: "456789012345",
			issueDate: "1987-06-15",
		},
		tin: {
			registered: true,
			idNumber: "567-890-123",
			issueDate: "1984-08-20",
		},
		barangayClearance: {
			registered: true,
			idNumber: "BC-2024-017890",
			issueDate: "2024-10-01",
			expiryDate: "2025-10-01",
		},
		createdAt: "2024-10-18T09:40:00Z",
		updatedAt: "2024-11-29T12:55:00Z",
	},
	{
		id: "2d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a",
		firstName: "Fernando",
		middleName: "Luis",
		lastName: "Santiago",
		birthdate: "1998-02-14",
		address: {
			street: "135 Marcos Highway",
			barangay: "Katipunan",
		},
		phoneNumber: "(632) 555-0122",
		status: "active",
		voter: {
			registered: true,
			idNumber: "8901-2345R-S89TU0V",
			issueDate: "2021-02-10",
		},
		philhealth: { registered: false },
		sss: { registered: false },
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: { registered: false },
		tin: { registered: false },
		barangayClearance: {
			registered: true,
			idNumber: "BC-2024-018901",
			issueDate: "2024-11-01",
			expiryDate: "2025-11-01",
		},
		createdAt: "2024-11-05T14:05:00Z",
		updatedAt: "2024-12-10T16:40:00Z",
	},
	{
		id: "3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7a8b",
		firstName: "Beatriz",
		middleName: "Carmen",
		lastName: "Flores",
		birthdate: "1983-10-09",
		address: {
			street: "246 Katipunan Avenue",
			barangay: "Kauswagan",
		},
		phoneNumber: "(632) 555-0123",
		status: "inactive",
		voter: {
			registered: true,
			idNumber: "9012-3456S-T90UV1W",
			issueDate: "2007-10-15",
		},
		philhealth: {
			registered: true,
			idNumber: "16-789012345-6",
			issueDate: "2010-05-22",
		},
		sss: { registered: false },
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: { registered: false },
		tin: {
			registered: true,
			idNumber: "678-901-234",
			issueDate: "2008-02-18",
		},
		barangayClearance: {
			registered: true,
			idNumber: "BC-2023-019012",
			issueDate: "2023-07-01",
			expiryDate: "2024-07-01",
		},
		createdAt: "2024-04-25T11:30:00Z",
		updatedAt: "2024-07-19T13:10:00Z",
	},
	{
		id: "4f5a6b7c-8d9e-0f1a-2b3c-4d5e6f7a8b9c",
		firstName: "Rodrigo",
		middleName: "Antonio",
		lastName: "Hernandez",
		birthdate: "1990-01-21",
		address: {
			street: "357 Macapagal Boulevard",
			barangay: "Magaud",
		},
		phoneNumber: "(632) 555-0124",
		status: "active",
		voter: {
			registered: true,
			idNumber: "0123-4567T-U01VW2X",
			issueDate: "2013-01-25",
		},
		philhealth: {
			registered: true,
			idNumber: "17-890123456-7",
			issueDate: "2015-09-08",
		},
		sss: {
			registered: true,
			idNumber: "56-7890123-4",
			issueDate: "2014-04-20",
		},
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: {
			registered: true,
			idNumber: "567890123456",
			issueDate: "2014-12-15",
		},
		tin: {
			registered: true,
			idNumber: "789-012-345",
			issueDate: "2013-06-30",
		},
		barangayClearance: {
			registered: true,
			idNumber: "BC-2024-020123",
			issueDate: "2024-12-01",
			expiryDate: "2025-12-01",
		},
		createdAt: "2024-12-01T08:00:00Z",
		updatedAt: "2024-12-11T10:20:00Z",
	},
	{
		id: "5a6b7c8d-9e0f-1a2b-3c4d-5e6f7a8b9c0d",
		firstName: "Victoria",
		middleName: "Isabel",
		lastName: "Pascual",
		birthdate: "1997-09-27",
		address: {
			street: "468 Araneta Avenue",
			barangay: "Nueva Gracia",
		},
		phoneNumber: "(632) 555-0125",
		status: "pending",
		voter: { registered: false },
		philhealth: {
			registered: true,
			idNumber: "18-901234567-8",
			issueDate: "2022-03-15",
		},
		sss: { registered: false },
		fourPs: { registered: false },
		pwd: { registered: false },
		soloParent: { registered: false },
		pagibig: { registered: false },
		tin: { registered: false },
		barangayClearance: { registered: false },
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

interface UpdatePersonInput {
	personId: string;
	updates: Partial<Omit<Person, "id" | "createdAt" | "updatedAt">>;
}

export const updatePerson = createServerFn({
	method: "POST",
})
	.inputValidator((input: UpdatePersonInput) => input)
	.handler(async ({ data: { personId, updates } }) => {
		const personIndex = mockPeople.findIndex((p) => p.id === personId);
		if (personIndex === -1) {
			throw new Error(`Person with ID ${personId} not found`);
		}

		const existingPerson = mockPeople[personIndex];
		const updatedPerson: Person = {
			...existingPerson,
			...updates,
			address: updates.address
				? { ...existingPerson.address, ...updates.address }
				: existingPerson.address,
			// Deep merge government service records to preserve ID numbers and dates
			voter: updates.voter
				? { ...existingPerson.voter, ...updates.voter }
				: existingPerson.voter,
			philhealth: updates.philhealth
				? { ...existingPerson.philhealth, ...updates.philhealth }
				: existingPerson.philhealth,
			sss: updates.sss
				? { ...existingPerson.sss, ...updates.sss }
				: existingPerson.sss,
			fourPs: updates.fourPs
				? { ...existingPerson.fourPs, ...updates.fourPs }
				: existingPerson.fourPs,
			pwd: updates.pwd
				? { ...existingPerson.pwd, ...updates.pwd }
				: existingPerson.pwd,
			soloParent: updates.soloParent
				? { ...existingPerson.soloParent, ...updates.soloParent }
				: existingPerson.soloParent,
			pagibig: updates.pagibig
				? { ...existingPerson.pagibig, ...updates.pagibig }
				: existingPerson.pagibig,
			tin: updates.tin
				? { ...existingPerson.tin, ...updates.tin }
				: existingPerson.tin,
			barangayClearance: updates.barangayClearance
				? { ...existingPerson.barangayClearance, ...updates.barangayClearance }
				: existingPerson.barangayClearance,
			updatedAt: new Date().toISOString(),
		};

		mockPeople[personIndex] = updatedPerson;
		return updatedPerson;
	});
