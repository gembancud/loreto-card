import { Link } from "@tanstack/react-router";
import { Calendar, MapPin, Pencil, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonStatusBadge } from "./PersonStatusBadge";
import type { Person } from "@/data/people";

interface PersonQuickViewPopoverProps {
	person: Person;
	onClose: () => void;
}

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

function formatDate(isoDate: string): string {
	return new Date(isoDate).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function PersonQuickViewPopover({
	person,
	onClose,
}: PersonQuickViewPopoverProps) {
	const age = calculateAge(person.birthdate);

	return (
		<div>
			{/* Header with photo and name */}
			<div className="flex items-center gap-3 mb-4">
				{person.profilePhoto ? (
					<img
						src={person.profilePhoto}
						alt={`${person.firstName} ${person.lastName}`}
						className="h-14 w-14 rounded-full object-cover"
					/>
				) : (
					<div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
						<User className="h-7 w-7 text-muted-foreground" />
					</div>
				)}
				<div className="flex-1 min-w-0">
					<h3 className="font-semibold truncate">
						{person.firstName} {person.lastName}
					</h3>
					<PersonStatusBadge status={person.status} />
				</div>
			</div>

			{/* Details */}
			<div className="space-y-2 text-sm">
				<div className="flex items-center gap-2 text-muted-foreground">
					<MapPin className="h-4 w-4 flex-shrink-0" />
					<span className="truncate">{person.address.barangay}</span>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground">
					<Phone className="h-4 w-4 flex-shrink-0" />
					<span className="truncate">{person.phoneNumber}</span>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground">
					<Calendar className="h-4 w-4 flex-shrink-0" />
					<span>
						{formatDate(person.birthdate)} ({age} years old)
					</span>
				</div>
			</div>

			{/* Edit button */}
			<div className="mt-4 pt-3 border-t">
				<Link
					to="/people/$personId"
					params={{ personId: person.id }}
					onClick={onClose}
					className="block"
				>
					<Button className="w-full gap-2">
						<Pencil className="h-4 w-4" />
						Edit Person
					</Button>
				</Link>
			</div>
		</div>
	);
}
