import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Pencil, Search, Users, X } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import { AddPersonDialog } from "@/components/people/AddPersonDialog";
import { BadgeFilterToggle } from "@/components/people/BadgeFilterToggle";
import { GovServiceBadges } from "@/components/people/GovServiceBadges";
import { PersonQuickViewPopover } from "@/components/people/PersonQuickViewPopover";
import { PersonStatusBadge } from "@/components/people/PersonStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "@/components/ui/popover";
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
import { getPeople, type Person } from "@/data/people";
import {
	type GovServiceKey,
	personMatchesBadgeFilter,
} from "@/lib/govServices";
import { calculateAge, formatFullName } from "@/lib/utils";

export const Route = createFileRoute("/")({
	component: PeopleList,
	loader: async () => await getPeople(),
});

function PeopleList() {
	const people = Route.useLoaderData();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [barangayFilter, setBarangayFilter] = useState("all");
	const [badgeFilter, setBadgeFilter] = useState<Set<GovServiceKey>>(
		new Set(),
	);
	const [badgeFilterMode, setBadgeFilterMode] = useState<"any" | "all">("any");
	const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
	const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
	const [popoverOpen, setPopoverOpen] = useState(false);

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

			// Filter by government services
			if (!personMatchesBadgeFilter(person, badgeFilter, badgeFilterMode)) {
				return false;
			}

			return true;
		});
	}, [people, searchQuery, barangayFilter, badgeFilter, badgeFilterMode]);

	const hasActiveFilters =
		searchQuery.trim() !== "" ||
		barangayFilter !== "all" ||
		badgeFilter.size > 0;

	const clearFilters = () => {
		setSearchQuery("");
		setBarangayFilter("all");
		setBadgeFilter(new Set());
		setBadgeFilterMode("any");
	};

	const handleToggleBadge = useCallback((key: GovServiceKey) => {
		setBadgeFilter((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(key)) {
				newSet.delete(key);
			} else {
				newSet.add(key);
			}
			return newSet;
		});
	}, []);

	const handleRowClick = useCallback(
		(e: React.MouseEvent<HTMLTableRowElement>, person: Person) => {
			// Ignore clicks on buttons or links
			const target = e.target as HTMLElement;
			if (target.closest("button") || target.closest("a")) {
				return;
			}

			// On mobile, navigate directly to edit page
			if (window.innerWidth < 768) {
				router.navigate({
					to: "/people/$personId",
					params: { personId: person.id },
				});
				return;
			}

			// Otherwise, open popover at click position
			setSelectedPerson(person);
			setPopoverPosition({ x: e.clientX, y: e.clientY });
			setPopoverOpen(true);
		},
		[router],
	);

	const handlePopoverClose = useCallback(() => {
		setPopoverOpen(false);
		setSelectedPerson(null);
	}, []);

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
					<div className="flex-shrink-0 pb-4 space-y-3">
						<div className="flex flex-wrap gap-3 items-center">
							<div className="relative w-64">
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
						<BadgeFilterToggle
							selectedBadges={badgeFilter}
							onToggleBadge={handleToggleBadge}
							filterMode={badgeFilterMode}
							onFilterModeChange={setBadgeFilterMode}
						/>
					</div>
					<div className="flex-1 overflow-auto min-h-0 rounded-md border">
						<Table>
							<TableHeader className="sticky top-0 bg-background z-10">
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Age</TableHead>
									<TableHead>Barangay</TableHead>
									<TableHead>Services</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Phone</TableHead>
									<TableHead className="w-[80px]">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredPeople.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={7}
											className="h-24 text-center text-muted-foreground"
										>
											No people found matching your filters
										</TableCell>
									</TableRow>
								) : (
									filteredPeople.map((person) => (
										<TableRow
											key={person.id}
											className="cursor-pointer hover:bg-muted/50"
											onClick={(e) => handleRowClick(e, person)}
											tabIndex={0}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													router.navigate({
														to: "/people/$personId",
														params: { personId: person.id },
													});
												}
											}}
										>
											<TableCell className="font-medium">
												{formatFullName(person)}
											</TableCell>
											<TableCell>{calculateAge(person.birthdate)}</TableCell>
											<TableCell>{person.address.barangay}</TableCell>
											<TableCell>
												<GovServiceBadges person={person} />
											</TableCell>
											<TableCell>
												<PersonStatusBadge status={person.status} />
											</TableCell>
											<TableCell>{person.phoneNumber}</TableCell>
											<TableCell>
												<Link
													to="/people/$personId"
													params={{ personId: person.id }}
												>
													<Button variant="ghost" size="icon">
														<Pencil className="h-4 w-4" />
														<span className="sr-only">Edit</span>
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

			{/* Popover positioned at click location */}
			<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
				<PopoverAnchor
					style={{
						position: "fixed",
						left: popoverPosition.x,
						top: popoverPosition.y,
						width: 0,
						height: 0,
					}}
				/>
				<PopoverContent
					side="bottom"
					align="start"
					sideOffset={8}
					collisionPadding={16}
					onEscapeKeyDown={handlePopoverClose}
					onPointerDownOutside={handlePopoverClose}
				>
					{selectedPerson && (
						<PersonQuickViewPopover
							person={selectedPerson}
							onClose={handlePopoverClose}
						/>
					)}
				</PopoverContent>
			</Popover>
		</div>
	);
}
