import type { Person } from "@/data/people";
import { calculateAge, isExpired } from "./utils";

// All government service keys (excluding senior which is derived from age)
export const GOV_SERVICE_KEYS = [
	"voter",
	"philhealth",
	"sss",
	"fourPs",
	"pwd",
	"soloParent",
	"pagibig",
	"tin",
	"barangayClearance",
	"senior",
] as const;

export type GovServiceKey = (typeof GOV_SERVICE_KEYS)[number];

// Services that have expiry dates
export const EXPIRABLE_SERVICES: GovServiceKey[] = [
	"pwd",
	"soloParent",
	"barangayClearance",
];

export interface GovServiceConfig {
	emoji: string;
	label: string;
	shortLabel: string;
}

export const GOV_SERVICE_CONFIG: Record<GovServiceKey, GovServiceConfig> = {
	voter: {
		emoji: "🗳️",
		label: "Registered Voter",
		shortLabel: "Voter",
	},
	philhealth: {
		emoji: "🏥",
		label: "PhilHealth",
		shortLabel: "PhilHealth",
	},
	sss: {
		emoji: "🛡️",
		label: "SSS",
		shortLabel: "SSS",
	},
	fourPs: {
		emoji: "👨‍👩‍👧‍👦",
		label: "4Ps Beneficiary",
		shortLabel: "4Ps",
	},
	pwd: {
		emoji: "♿",
		label: "PWD",
		shortLabel: "PWD",
	},
	soloParent: {
		emoji: "👤",
		label: "Solo Parent",
		shortLabel: "Solo",
	},
	pagibig: {
		emoji: "🏠",
		label: "Pag-IBIG",
		shortLabel: "Pag-IBIG",
	},
	tin: {
		emoji: "📋",
		label: "TIN",
		shortLabel: "TIN",
	},
	barangayClearance: {
		emoji: "📜",
		label: "Barangay Clearance",
		shortLabel: "Brgy",
	},
	senior: {
		emoji: "👴",
		label: "Senior Citizen",
		shortLabel: "Senior",
	},
};

export interface ActiveService {
	key: GovServiceKey;
	config: GovServiceConfig;
	expired: boolean;
}

/**
 * Returns list of active government services for a person
 */
export function getActiveServices(person: Person): ActiveService[] {
	const services: ActiveService[] = [];

	// Check senior status first (derived from age)
	const age = calculateAge(person.birthdate);
	if (age >= 60) {
		services.push({
			key: "senior",
			config: GOV_SERVICE_CONFIG.senior,
			expired: false,
		});
	}

	// Check each government service record
	const serviceKeys: Exclude<GovServiceKey, "senior">[] = [
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

	for (const key of serviceKeys) {
		const record = person[key];
		if (record.registered) {
			const expired = EXPIRABLE_SERVICES.includes(key)
				? isExpired(record.expiryDate)
				: false;
			services.push({
				key,
				config: GOV_SERVICE_CONFIG[key],
				expired,
			});
		}
	}

	return services;
}

/**
 * Check if a person has a specific government service
 */
export function personHasService(
	person: Person,
	serviceKey: GovServiceKey,
): boolean {
	if (serviceKey === "senior") {
		return calculateAge(person.birthdate) >= 60;
	}
	return person[serviceKey].registered;
}

/**
 * Filter helper to check if person matches selected badge filters
 * @param person - The person to check
 * @param selectedBadges - Set of selected service keys to filter by
 * @param mode - "any" matches if person has any of the selected services, "all" matches if person has all
 */
export function personMatchesBadgeFilter(
	person: Person,
	selectedBadges: Set<GovServiceKey>,
	mode: "any" | "all",
): boolean {
	if (selectedBadges.size === 0) {
		return true; // No filter applied
	}

	const selectedArray = Array.from(selectedBadges);

	if (mode === "any") {
		return selectedArray.some((key) => personHasService(person, key));
	}
	// mode === "all"
	return selectedArray.every((key) => personHasService(person, key));
}
