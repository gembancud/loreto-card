import { createFileRoute, Link } from "@tanstack/react-router";
import { getPeople } from "@/data/people";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PersonStatusBadge } from "@/components/people/PersonStatusBadge";
import { AddPersonDialog } from "@/components/people/AddPersonDialog";
import { Eye, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
	component: PeopleList,
	loader: async () => await getPeople(),
});

function PeopleList() {
	const people = Route.useLoaderData();

	return (
		<div className="container mx-auto py-8 px-4">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Users className="h-6 w-6" />
							<CardTitle className="text-2xl">People Records</CardTitle>
						</div>
						<AddPersonDialog />
					</div>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Phone</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{people.map((person) => (
								<TableRow key={person.id}>
									<TableCell className="font-medium">
										{person.firstName} {person.lastName}
									</TableCell>
									<TableCell>
										<PersonStatusBadge status={person.status} />
									</TableCell>
									<TableCell>{person.phoneNumber}</TableCell>
									<TableCell className="text-right">
										<Link to="/people/$personId" params={{ personId: person.id }}>
											<Button variant="ghost" size="sm" className="gap-2">
												<Eye className="h-4 w-4" />
												View
											</Button>
										</Link>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					<div className="mt-4 text-sm text-muted-foreground text-center">
						Total Records: {people.length}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
