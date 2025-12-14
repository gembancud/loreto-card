import { Link } from "@tanstack/react-router";
import { Calendar, MapPin, Pencil, Phone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PersonStatusBadge } from "./PersonStatusBadge";
import type { Person } from "@/data/people";
import { calculateAge, formatDate, formatFullName, isExpired } from "@/lib/utils";

interface PersonQuickViewPopoverProps {
	person: Person;
	onClose: () => void;
}

export function PersonQuickViewPopover({
	person,
	onClose,
}: PersonQuickViewPopoverProps) {
	const age = calculateAge(person.birthdate);
	const isSenior = age >= 60;

	return (
		<div>
			{/* Header with photo and name */}
			<div className="flex items-center gap-3 mb-4">
				{person.profilePhoto ? (
					<img
						src={person.profilePhoto}
						alt={formatFullName(person)}
						className="h-14 w-14 rounded-full object-cover"
					/>
				) : (
					<div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
						<User className="h-7 w-7 text-muted-foreground" />
					</div>
				)}
				<div className="flex-1 min-w-0">
					<h3 className="font-semibold truncate">{formatFullName(person)}</h3>
					<PersonStatusBadge status={person.status} />
				</div>
			</div>

			{/* Details */}
			<div className="space-y-2 text-sm">
				<div className="flex items-center gap-2 text-muted-foreground">
					<MapPin className="h-4 w-4 flex-shrink-0" />
					<span className="truncate">
						{person.address.street}, {person.address.barangay}
					</span>
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

			{/* Government Services Badges */}
			<div className="mt-3 pt-3 border-t">
				<div className="flex flex-wrap gap-1">
					{person.voter.registered && (
						<Badge variant="outline" className="text-xs" title={person.voter.idNumber}>
							{"🗳️ Voter"}
						</Badge>
					)}
					{person.philhealth.registered && (
						<Badge variant="outline" className="text-xs" title={person.philhealth.idNumber}>
							{"🏥 PhilHealth"}
						</Badge>
					)}
					{person.sss.registered && (
						<Badge variant="outline" className="text-xs" title={person.sss.idNumber}>
							{"🔒 SSS"}
						</Badge>
					)}
					{person.fourPs.registered && (
						<Badge variant="outline" className="text-xs" title={person.fourPs.idNumber}>
							{"💰 4Ps"}
						</Badge>
					)}
					{person.pwd.registered && !isExpired(person.pwd.expiryDate) && (
						<Badge
							variant="outline"
							className="text-xs bg-green-50 border-green-200 text-green-700"
							title={person.pwd.idNumber}
						>
							{"♿ PWD"}
						</Badge>
					)}
					{person.pwd.registered && isExpired(person.pwd.expiryDate) && (
						<Badge
							variant="outline"
							className="text-xs bg-red-50 border-red-200 text-red-700"
							title={person.pwd.idNumber}
						>
							{"♿ PWD Expired"}
						</Badge>
					)}
					{person.soloParent.registered && !isExpired(person.soloParent.expiryDate) && (
						<Badge
							variant="outline"
							className="text-xs bg-green-50 border-green-200 text-green-700"
							title={person.soloParent.idNumber}
						>
							{"👨‍👧 Solo Parent"}
						</Badge>
					)}
					{person.soloParent.registered && isExpired(person.soloParent.expiryDate) && (
						<Badge
							variant="outline"
							className="text-xs bg-red-50 border-red-200 text-red-700"
							title={person.soloParent.idNumber}
						>
							{"👨‍👧 Solo Parent Expired"}
						</Badge>
					)}
					{person.pagibig.registered && (
						<Badge variant="outline" className="text-xs" title={person.pagibig.idNumber}>
							{"🏠 Pag-IBIG"}
						</Badge>
					)}
					{person.tin.registered && (
						<Badge variant="outline" className="text-xs" title={person.tin.idNumber}>
							{"📋 TIN"}
						</Badge>
					)}
					{person.barangayClearance.registered && !isExpired(person.barangayClearance.expiryDate) && (
						<Badge
							variant="outline"
							className="text-xs bg-green-50 border-green-200 text-green-700"
							title={person.barangayClearance.idNumber}
						>
							{"📜 Brgy Valid"}
						</Badge>
					)}
					{person.barangayClearance.registered && isExpired(person.barangayClearance.expiryDate) && (
						<Badge
							variant="outline"
							className="text-xs bg-red-50 border-red-200 text-red-700"
							title={person.barangayClearance.idNumber}
						>
							{"📜 Brgy Expired"}
						</Badge>
					)}
					{isSenior && (
						<Badge variant="outline" className="text-xs">
							{"👴 Senior"}
						</Badge>
					)}
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
