import { createFileRoute, Link } from "@tanstack/react-router";
import { getPersonById } from "@/data/people";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { PersonStatusBadge } from "@/components/people/PersonStatusBadge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	ArrowLeft,
	User,
	Phone,
	MapPin,
	Calendar,
	Clock,
	Hash,
} from "lucide-react";

export const Route = createFileRoute("/people/$personId")({
	component: PersonDetails,
	loader: async ({ params }) => await getPersonById({ data: params.personId }),
});

function PersonDetails() {
	const person = Route.useLoaderData();

	const formatDate = (isoDate: string) => {
		return new Date(isoDate).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatDateTime = (isoDateTime: string) => {
		return new Date(isoDateTime).toLocaleString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="max-w-4xl mx-auto">
				<div className="mb-6">
					<Link to="/">
						<Button variant="ghost" className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							Back to People
						</Button>
					</Link>
				</div>

				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								{person.profilePhoto ? (
									<img
										src={person.profilePhoto}
										alt={`${person.firstName} ${person.lastName}`}
										className="h-16 w-16 rounded-full object-cover"
									/>
								) : (
									<div className="bg-muted p-3 rounded-full">
										<User className="h-8 w-8" />
									</div>
								)}
								<div>
									<CardTitle className="text-2xl">
										{person.firstName} {person.lastName}
									</CardTitle>
									<CardDescription>Person Record Details</CardDescription>
								</div>
							</div>
							<PersonStatusBadge status={person.status} />
						</div>
					</CardHeader>

					<CardContent className="space-y-6">
						{/* Personal Information */}
						<div>
							<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<User className="h-5 w-5" />
								Personal Information
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="p-4 rounded-lg border bg-muted/50">
									<div className="flex items-center gap-2 mb-1">
										<User className="h-4 w-4 text-muted-foreground" />
										<p className="text-sm text-muted-foreground">First Name</p>
									</div>
									<p className="font-medium">{person.firstName}</p>
								</div>

								<div className="p-4 rounded-lg border bg-muted/50">
									<div className="flex items-center gap-2 mb-1">
										<User className="h-4 w-4 text-muted-foreground" />
										<p className="text-sm text-muted-foreground">Last Name</p>
									</div>
									<p className="font-medium">{person.lastName}</p>
								</div>

								<div className="p-4 rounded-lg border bg-muted/50 md:col-span-2">
									<div className="flex items-center gap-2 mb-1">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<p className="text-sm text-muted-foreground">Birthdate</p>
									</div>
									<p className="font-medium">{formatDate(person.birthdate)}</p>
								</div>
							</div>
						</div>

						<Separator />

						{/* Contact Information */}
						<div>
							<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<Phone className="h-5 w-5" />
								Contact Information
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="p-4 rounded-lg border bg-muted/50">
									<div className="flex items-center gap-2 mb-1">
										<Phone className="h-4 w-4 text-muted-foreground" />
										<p className="text-sm text-muted-foreground">Phone Number</p>
									</div>
									<p className="font-medium">{person.phoneNumber}</p>
								</div>

								<div className="p-4 rounded-lg border bg-muted/50">
									<div className="flex items-center gap-2 mb-1">
										<MapPin className="h-4 w-4 text-muted-foreground" />
										<p className="text-sm text-muted-foreground">Barangay</p>
									</div>
									<p className="font-medium">{person.address.barangay}</p>
								</div>

								<div className="p-4 rounded-lg border bg-muted/50 md:col-span-2">
									<div className="flex items-center gap-2 mb-1">
										<MapPin className="h-4 w-4 text-muted-foreground" />
										<p className="text-sm text-muted-foreground">Street Address</p>
									</div>
									<p className="font-medium">{person.address.street}</p>
								</div>
							</div>
						</div>

						<Separator />

						{/* Metadata */}
						<div>
							<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<Clock className="h-5 w-5" />
								Metadata
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="p-4 rounded-lg border bg-muted/50">
									<div className="flex items-center gap-2 mb-1">
										<Hash className="h-4 w-4 text-muted-foreground" />
										<p className="text-sm text-muted-foreground">Record ID</p>
									</div>
									<p className="font-mono text-xs break-all">{person.id}</p>
								</div>

								<div className="p-4 rounded-lg border bg-muted/50">
									<div className="flex items-center gap-2 mb-1">
										<Clock className="h-4 w-4 text-muted-foreground" />
										<p className="text-sm text-muted-foreground">Status</p>
									</div>
									<PersonStatusBadge status={person.status} />
								</div>

								<div className="p-4 rounded-lg border bg-muted/50">
									<div className="flex items-center gap-2 mb-1">
										<Clock className="h-4 w-4 text-muted-foreground" />
										<p className="text-sm text-muted-foreground">Created At</p>
									</div>
									<p className="font-medium text-sm">
										{formatDateTime(person.createdAt)}
									</p>
								</div>

								<div className="p-4 rounded-lg border bg-muted/50">
									<div className="flex items-center gap-2 mb-1">
										<Clock className="h-4 w-4 text-muted-foreground" />
										<p className="text-sm text-muted-foreground">Last Updated</p>
									</div>
									<p className="font-medium text-sm">
										{formatDateTime(person.updatedAt)}
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
