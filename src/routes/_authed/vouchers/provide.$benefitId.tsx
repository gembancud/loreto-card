import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ChevronsUpDown, Gift, ScanLine, Send, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { QrScannerDialog } from "@/components/qr/QrScannerDialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { getPersonById, type Person, searchPeople } from "@/data/people";
import { createVoucher, getMyAssignedBenefits } from "@/data/vouchers";

export const Route = createFileRoute("/_authed/vouchers/provide/$benefitId")({
	component: ProvideVoucherPage,
	loader: async ({ params }) => {
		const benefits = await getMyAssignedBenefits();
		const benefit = benefits.find(
			(b) => b.id === params.benefitId && b.role === "provider",
		);
		if (!benefit) {
			throw new Error(
				"Benefit not found or you are not authorized to provide it",
			);
		}
		return { benefit };
	},
});

function buildPersonName(person: Person): string {
	const parts = [person.firstName];
	if (person.middleName) parts.push(person.middleName);
	parts.push(person.lastName);
	if (person.suffix) parts.push(person.suffix);
	return parts.join(" ");
}

function ProvideVoucherPage() {
	const { benefit } = Route.useLoaderData();
	const router = useRouter();
	const id = useId();
	const [notes, setNotes] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Person search state
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Person[]>([]);
	const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
	const [isSearching, setIsSearching] = useState(false);

	// QR scanner state
	const [scannerOpen, setScannerOpen] = useState(false);
	const [isLoadingPerson, setIsLoadingPerson] = useState(false);

	// Debounced search
	useEffect(() => {
		if (!searchQuery.trim()) {
			setSearchResults([]);
			return;
		}

		const timer = setTimeout(async () => {
			setIsSearching(true);
			try {
				const results = await searchPeople({ data: searchQuery.trim() });
				setSearchResults(results);
			} catch (err) {
				console.error("Search failed:", err);
				setSearchResults([]);
			} finally {
				setIsSearching(false);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	const handleQrScan = async (personId: string) => {
		setIsLoadingPerson(true);
		setError(null);
		try {
			const person = await getPersonById({ data: personId });
			setSelectedPerson(person);
		} catch (err) {
			console.error("Failed to load person:", err);
			setError("Person not found. Please try manual search.");
		} finally {
			setIsLoadingPerson(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!selectedPerson) {
			setError("Please select a person");
			return;
		}

		setIsSubmitting(true);

		try {
			const result = await createVoucher({
				data: {
					benefitId: benefit.id,
					personId: selectedPerson.id,
					notes: notes.trim() || undefined,
				},
			});

			if (result.success) {
				await router.invalidate();
				router.navigate({ to: "/vouchers" });
			} else {
				setError(result.error ?? "Failed to create voucher");
			}
		} catch (err) {
			setError("An unexpected error occurred");
			console.error(err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="max-w-xl mx-auto">
				<div className="mb-6">
					<Link to="/vouchers">
						<Button variant="ghost" className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							Back to Vouchers
						</Button>
					</Link>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Gift className="h-5 w-5" />
							Issue Voucher
						</CardTitle>
						<CardDescription>
							Issue a voucher for <strong>{benefit.name}</strong>
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="mb-6 p-4 bg-muted rounded-lg">
							<h3 className="font-medium mb-2">Benefit Details</h3>
							<dl className="text-sm space-y-1">
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Name:</dt>
									<dd>{benefit.name}</dd>
								</div>
								{benefit.description && (
									<div className="flex justify-between">
										<dt className="text-muted-foreground">Description:</dt>
										<dd>{benefit.description}</dd>
									</div>
								)}
								{benefit.valuePesos && (
									<div className="flex justify-between">
										<dt className="text-muted-foreground">Value:</dt>
										<dd>₱{benefit.valuePesos.toLocaleString()}</dd>
									</div>
								)}
								{benefit.quantity && (
									<div className="flex justify-between">
										<dt className="text-muted-foreground">Quantity:</dt>
										<dd>{benefit.quantity} units</dd>
									</div>
								)}
								{benefit.departmentName && (
									<div className="flex justify-between">
										<dt className="text-muted-foreground">Department:</dt>
										<dd>{benefit.departmentName}</dd>
									</div>
								)}
							</dl>
						</div>

						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label>Person *</Label>
								{isLoadingPerson ? (
									<div className="flex items-center justify-center rounded-md border p-3 text-muted-foreground">
										Loading person...
									</div>
								) : selectedPerson ? (
									<div className="flex items-center justify-between rounded-md border p-3">
										<div>
											<p className="font-medium">
												{buildPersonName(selectedPerson)}
											</p>
											<p className="text-sm text-muted-foreground">
												{selectedPerson.phoneNumber}
											</p>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => {
												setSelectedPerson(null);
												setSearchQuery("");
											}}
										>
											<X className="h-4 w-4" />
											<span className="sr-only">Clear selection</span>
										</Button>
									</div>
								) : (
									<div className="flex gap-2">
										<Popover open={open} onOpenChange={setOpen}>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													role="combobox"
													aria-expanded={open}
													className="flex-1 justify-between"
												>
													Search by name or phone...
													<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-[400px] p-0" align="start">
												<Command shouldFilter={false}>
													<CommandInput
														placeholder="Search by name or phone..."
														value={searchQuery}
														onValueChange={setSearchQuery}
													/>
													<CommandList>
														{isSearching && (
															<div className="py-6 text-center text-sm text-muted-foreground">
																Searching...
															</div>
														)}
														{!isSearching &&
															searchQuery &&
															searchResults.length === 0 && (
																<CommandEmpty>No people found.</CommandEmpty>
															)}
														{!isSearching && searchResults.length > 0 && (
															<CommandGroup>
																{searchResults.map((person) => (
																	<CommandItem
																		key={person.id}
																		value={person.id}
																		onSelect={() => {
																			setSelectedPerson(person);
																			setOpen(false);
																			setSearchQuery("");
																		}}
																	>
																		<div className="flex flex-col">
																			<span>{buildPersonName(person)}</span>
																			<span className="text-sm text-muted-foreground">
																				{person.phoneNumber}
																			</span>
																		</div>
																	</CommandItem>
																))}
															</CommandGroup>
														)}
													</CommandList>
												</Command>
											</PopoverContent>
										</Popover>
										<Button
											type="button"
											variant="outline"
											size="icon"
											onClick={() => setScannerOpen(true)}
											title="Scan QR Code"
										>
											<ScanLine className="h-4 w-4" />
											<span className="sr-only">Scan QR Code</span>
										</Button>
									</div>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor={`${id}-notes`}>Notes (optional)</Label>
								<Input
									id={`${id}-notes`}
									placeholder="Any additional notes"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
								/>
							</div>

							{error && (
								<p className="text-sm text-destructive bg-destructive/10 p-3 rounded">
									{error}
								</p>
							)}

							<div className="flex gap-2 pt-4">
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									onClick={() => router.navigate({ to: "/vouchers" })}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									className="flex-1 gap-2"
									disabled={isSubmitting}
								>
									<Send className="h-4 w-4" />
									{isSubmitting ? "Issuing..." : "Issue Voucher"}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>

				<QrScannerDialog
					open={scannerOpen}
					onOpenChange={setScannerOpen}
					onScan={handleQrScan}
				/>
			</div>
		</div>
	);
}
