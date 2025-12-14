import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function calculateAge(birthdate: string): number {
	const today = new Date();
	const birth = new Date(birthdate);
	let age = today.getFullYear() - birth.getFullYear();
	const monthDiff = today.getMonth() - birth.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
		age--;
	}
	return age;
}

export function formatDate(isoDate: string): string {
	return new Date(isoDate).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

interface PersonNameParts {
	firstName: string;
	middleName?: string;
	lastName: string;
	suffix?: string;
}

export function formatFullName(person: PersonNameParts): string {
	const parts = [person.firstName];
	if (person.middleName) {
		parts.push(person.middleName);
	}
	parts.push(person.lastName);
	if (person.suffix) {
		parts.push(person.suffix);
	}
	return parts.join(" ");
}

export function isExpired(dateString?: string): boolean {
	if (!dateString) return false;
	const expiryDate = new Date(dateString);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return expiryDate < today;
}
