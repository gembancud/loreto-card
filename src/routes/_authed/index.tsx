import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Pencil,
	QrCode,
	Search,
	Users,
	X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { AddPersonDialog } from "@/components/people/AddPersonDialog";
import { BadgeFilterToggle } from "@/components/people/BadgeFilterToggle";
import { GovServiceBadges } from "@/components/people/GovServiceBadges";
import { PersonQuickViewPopover } from "@/components/people/PersonQuickViewPopover";
import { PersonStatusBadge } from "@/components/people/PersonStatusBadge";
import { ResidencyBadge } from "@/components/people/ResidencyBadge";
import { QrScannerDialog } from "@/components/qr/QrScannerDialog";
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
import { getSessionData } from "@/data/auth/session";
import { LORETO_BARANGAYS } from "@/data/barangays";
import { getPeople, type Person, type ResidencyStatus } from "@/data/people";
import {
	type GovServiceKey,
	personMatchesBadgeFilter,
} from "@/lib/govServices";
import { calculateAge, formatNameWithInitial } from "@/lib/utils";

type SortField = "name" | "barangay" | "createdAt" | "updatedAt";
type SortDirection = "asc" | "desc";

function formatDate(isoString: string): string {
	return new Date(isoString).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function SortableTableHead({
	label,
	field,
	currentField,
	direction,
	onSort,
	className,
}: {
	label: string;
	field: SortField;
	currentField: SortField;
	direction: SortDirection;
	onSort: (field: SortField) => void;
	className?: string;
}) {
	const isActive = currentField === field;
	return (
		<TableHead className={className}>
			<button
				type="button"
				onClick={() => onSort(field)}
				className="flex items-center gap-1 hover:text-foreground transition-colors -ml-1 px-1 py-0.5 rounded"
			>
				{label}
				{isActive ? (
					direction === "asc" ? (
						<ArrowUp className="h-4 w-4" />
					) : (
						<ArrowDown className="h-4 w-4" />
					)
				) : (
					<ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
				)}
			</button>
		</TableHead>
	);
}

export const Route = createFileRoute("/_authed/")({
	component: PeopleList,
	loader: async () => {
		const [people, session] = await Promise.all([
			getPeople(),
			getSessionData(),
		]);
		return { people, session };
	},
});

function PeopleList() {
	const { people, session } = Route.useLoaderData();
	const router = useRouter();
	const isBarangay =
		session?.role === "barangay_admin" || session?.role === "barangay_user";
	const [searchQuery, setSearchQuery] = useState("");
	const [barangayFilter, setBarangayFilter] = useState("all");
	const [residencyFilter, setResidencyFilter] = useState<
		"all" | ResidencyStatus
	>("all");
	const [badgeFilter, setBadgeFilter] = useState<Set<GovServiceKey>>(new Set());
	const [badgeFilterMode, setBadgeFilterMode] = useState<"any" | "all">("any");
	const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
	const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
	const [popoverOpen, setPopoverOpen] = useState(false);
	const [qrScannerOpen, setQrScannerOpen] = useState(false);
	const [sortField, setSortField] = useState<SortField>("name");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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

			// Filter by residency status
			if (
				residencyFilter !== "all" &&
				person.residencyStatus !== residencyFilter
			) {
				return false;
			}

			// Filter by government services
			if (!personMatchesBadgeFilter(person, badgeFilter, badgeFilterMode)) {
				return false;
			}

			return true;
		});
	}, [
		people,
		searchQuery,
		barangayFilter,
		residencyFilter,
		badgeFilter,
		badgeFilterMode,
	]);

	const sortedPeople = useMemo(() => {
		return [...filteredPeople].sort((a, b) => {
			const multiplier = sortDirection === "asc" ? 1 : -1;
			switch (sortField) {
				case "name": {
					const lastCmp = a.lastName.localeCompare(b.lastName);
					return (
						(lastCmp !== 0 ? lastCmp : a.firstName.localeCompare(b.firstName)) *
						multiplier
					);
				}
				case "barangay":
					return (
						a.address.barangay.localeCompare(b.address.barangay) * multiplier
					);
				case "createdAt":
					return (
						(new Date(a.createdAt).getTime() -
							new Date(b.createdAt).getTime()) *
						multiplier
					);
				case "updatedAt":
					return (
						(new Date(a.updatedAt).getTime() -
							new Date(b.updatedAt).getTime()) *
						multiplier
					);
				default:
					return 0;
			}
		});
	}, [filteredPeople, sortField, sortDirection]);

	const handleSort = useCallback(
		(field: SortField) => {
			if (sortField === field) {
				setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
			} else {
				setSortField(field);
				setSortDirection("asc");
			}
		},
		[sortField],
	);

	const hasActiveFilters =
		searchQuery.trim() !== "" ||
		barangayFilter !== "all" ||
		residencyFilter !== "all" ||
		badgeFilter.size > 0;

	const clearFilters = () => {
		setSearchQuery("");
		setBarangayFilter("all");
		setResidencyFilter("all");
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
						{!isBarangay && <AddPersonDialog />}
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
							<Button
								variant="outline"
								size="icon"
								onClick={() => setQrScannerOpen(true)}
								title="Scan QR Code"
							>
								<QrCode className="h-4 w-4" />
							</Button>
							{!isBarangay && (
								<Select
									value={barangayFilter}
									onValueChange={setBarangayFilter}
								>
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
							)}
							<Select
								value={residencyFilter}
								onValueChange={(value) =>
									setResidencyFilter(value as "all" | ResidencyStatus)
								}
							>
								<SelectTrigger className="w-[160px]">
									<SelectValue placeholder="Residency" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Residency</SelectItem>
									<SelectItem value="resident">Resident</SelectItem>
									<SelectItem value="nonResident">Non-Resident</SelectItem>
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
					{/* Mobile Sort Dropdown */}
					<div className="md:hidden flex-shrink-0 pb-3">
						<Select
							value={`${sortField}-${sortDirection}`}
							onValueChange={(value) => {
								const [field, dir] = value.split("-") as [
									SortField,
									SortDirection,
								];
								setSortField(field);
								setSortDirection(dir);
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Sort by..." />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="name-asc">Name (A-Z)</SelectItem>
								<SelectItem value="name-desc">Name (Z-A)</SelectItem>
								<SelectItem value="barangay-asc">Barangay (A-Z)</SelectItem>
								<SelectItem value="barangay-desc">Barangay (Z-A)</SelectItem>
								<SelectItem value="createdAt-desc">Newest First</SelectItem>
								<SelectItem value="createdAt-asc">Oldest First</SelectItem>
								<SelectItem value="updatedAt-desc">Recently Updated</SelectItem>
								<SelectItem value="updatedAt-asc">
									Least Recently Updated
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Mobile Card View */}
					<div className="md:hidden flex-1 overflow-auto min-h-0 space-y-3">
						{sortedPeople.length === 0 ? (
							<div className="text-center text-muted-foreground py-8">
								No people found matching your filters
							</div>
						) : (
							sortedPeople.map((person) => (
								<button
									type="button"
									key={person.id}
									className="relative overflow-hidden w-full text-left rounded-lg border bg-card p-4 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
									onClick={() =>
										router.navigate({
											to: "/people/$personId",
											params: { personId: person.id },
										})
									}
								>
									<div className="flex items-start justify-between gap-2 mb-2">
										<span className="font-medium">
											{formatNameWithInitial(person)}
										</span>
										<PersonStatusBadge status={person.status} />
									</div>
									<div className="text-sm text-muted-foreground mb-1">
										{calculateAge(person.birthdate)} yrs old •{" "}
										{person.address.barangay} •{" "}
										{person.residencyStatus === "resident"
											? "Resident"
											: "Non-Resident"}
									</div>
									<div className="text-xs text-muted-foreground mb-2">
										Created: {formatDate(person.createdAt)} • Updated:{" "}
										{formatDate(person.updatedAt)}
									</div>
									<GovServiceBadges person={person} />
								</button>
							))
						)}
					</div>

					{/* Desktop Table View */}
					<div className="hidden md:block flex-1 overflow-auto min-h-0 rounded-md border">
						<Table className="table-fixed">
							<TableHeader className="sticky top-0 bg-background z-10">
								<TableRow>
									<SortableTableHead
										label="Name"
										field="name"
										currentField={sortField}
										direction={sortDirection}
										onSort={handleSort}
										className="w-[20%]"
									/>
									{!isBarangay && (
										<TableHead className="w-[80px]">Actions</TableHead>
									)}
									<TableHead className="w-[60px]">Age</TableHead>
									<SortableTableHead
										label="Barangay"
										field="barangay"
										currentField={sortField}
										direction={sortDirection}
										onSort={handleSort}
										className="w-[15%]"
									/>
									<TableHead className="w-[60px]">Purok</TableHead>
									<TableHead className="w-[100px]">Residency</TableHead>
									<TableHead>Services</TableHead>
									<TableHead className="w-[100px]">Status</TableHead>
									<SortableTableHead
										label="Created"
										field="createdAt"
										currentField={sortField}
										direction={sortDirection}
										onSort={handleSort}
										className="w-[100px]"
									/>
									<SortableTableHead
										label="Updated"
										field="updatedAt"
										currentField={sortField}
										direction={sortDirection}
										onSort={handleSort}
										className="w-[100px]"
									/>
								</TableRow>
							</TableHeader>
							<TableBody>
								{sortedPeople.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={10}
											className="h-24 text-center text-muted-foreground"
										>
											No people found matching your filters
										</TableCell>
									</TableRow>
								) : (
									sortedPeople.map((person) => (
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
												{formatNameWithInitial(person)}
											</TableCell>
											{!isBarangay && (
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
											)}
											<TableCell>{calculateAge(person.birthdate)}</TableCell>
											<TableCell>{person.address.barangay}</TableCell>
											<TableCell>{person.address.purok || "-"}</TableCell>
											<TableCell>
												<ResidencyBadge status={person.residencyStatus} />
											</TableCell>
											<TableCell className="overflow-hidden">
												<GovServiceBadges person={person} />
											</TableCell>
											<TableCell>
												<PersonStatusBadge status={person.status} />
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{formatDate(person.createdAt)}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{formatDate(person.updatedAt)}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
					<div className="flex-shrink-0 pt-4 text-sm text-muted-foreground text-center">
						{hasActiveFilters
							? `Showing ${sortedPeople.length} of ${people.length} records`
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

			<QrScannerDialog
				open={qrScannerOpen}
				onOpenChange={setQrScannerOpen}
				onScan={(personId) => {
					setQrScannerOpen(false);
					router.navigate({ to: "/people/$personId", params: { personId } });
				}}
				onError={(error) => {
					toast.error(error);
				}}
			/>
		</div>
	);
}
