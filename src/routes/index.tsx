import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Search, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AddPersonDialog } from "@/components/people/AddPersonDialog";
import { PersonStatusBadge } from "@/components/people/PersonStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { LORETO_BARANGAYS } from "@/data/barangays";
import { getPeople } from "@/data/people";

export const Route = createFileRoute("/")({
	component: PeopleList,
	loader: async () => await getPeople(),
});

function PeopleList() {
	const people = Route.useLoaderData();
	const [searchQuery, setSearchQuery] = useState("");
	const [barangayFilter, setBarangayFilter] = useState("all");

	const filteredPeople = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		return people.filter((person) => {
			// Filter by name
			if (query) {
				const firstName = person.firstName.toLowerCase();
				const lastName = person.lastName.toLowerCase();
				const fullName = `${firstName} ${lastName}`;
				const nameMatches =
					firstName.includes(query) ||
					lastName.includes(query) ||
					fullName.includes(query);
				if (!nameMatches) return false;
			}

			// Filter by barangay
			if (
				barangayFilter !== "all" &&
				person.address.barangay !== barangayFilter
			) {
				return false;
			}

			return true;
		});
	}, [people, searchQuery, barangayFilter]);

	const hasActiveFilters =
		searchQuery.trim() !== "" || barangayFilter !== "all";

	const clearFilters = () => {
		setSearchQuery("");
		setBarangayFilter("all");
	};

	return (
		<div className="h-full flex flex-col p-4">
			<Card className="flex-1 flex flex-col min-h-0">
				<CardHeader className="flex-shrink-0">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Users className="h-6 w-6" />
							<CardTitle className="text-2xl">People Records</CardTitle>
						</div>
						<AddPersonDialog />
					</div>
				</CardHeader>
				<CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
					<div className="flex-shrink-0 pb-4 flex flex-wrap gap-3 items-center">
						<div className="relative flex-1 min-w-[200px]">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search by name..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
						<Select value={barangayFilter} onValueChange={setBarangayFilter}>
							<SelectTrigger className="w-[200px]">
								<SelectValue placeholder="Filter by barangay" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Barangays</SelectItem>
								{LORETO_BARANGAYS.map((barangay) => (
									<SelectItem key={barangay} value={barangay}>
										{barangay}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{hasActiveFilters && (
							<Button
								variant="ghost"
								size="sm"
								onClick={clearFilters}
								className="gap-1"
							>
								<X className="h-4 w-4" />
								Clear filters
							</Button>
						)}
					</div>
					<div className="flex-1 overflow-auto min-h-0 rounded-md border">
						<Table>
							<TableHeader className="sticky top-0 bg-background z-10">
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Barangay</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Phone</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredPeople.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={5}
											className="h-24 text-center text-muted-foreground"
										>
											No people found matching your filters
										</TableCell>
									</TableRow>
								) : (
									filteredPeople.map((person) => (
										<TableRow key={person.id}>
											<TableCell className="font-medium">
												{person.firstName} {person.lastName}
											</TableCell>
											<TableCell>{person.address.barangay}</TableCell>
											<TableCell>
												<PersonStatusBadge status={person.status} />
											</TableCell>
											<TableCell>{person.phoneNumber}</TableCell>
											<TableCell className="text-right">
												<Link
													to="/people/$personId"
													params={{ personId: person.id }}
												>
													<Button variant="ghost" size="sm" className="gap-2">
														<Eye className="h-4 w-4" />
														View
													</Button>
												</Link>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
					<div className="flex-shrink-0 pt-4 text-sm text-muted-foreground text-center">
						{hasActiveFilters
							? `Showing ${filteredPeople.length} of ${people.length} records`
							: `Total Records: ${people.length}`}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
