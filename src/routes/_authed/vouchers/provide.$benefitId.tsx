import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
	AlertTriangle,
	ArrowLeft,
	CheckCircle,
	ChevronsUpDown,
	Gift,
	ScanLine,
	Send,
	User,
	X,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { QrScannerDialog } from "@/components/qr/QrScannerDialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
	checkPersonEligibility,
	createVoucher,
	type EligibilityResult,
	getMyAssignedBenefits,
} from "@/data/vouchers";

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
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// Person search state
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Person[]>([]);
	const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
	const [isSearching, setIsSearching] = useState(false);

	// QR scanner state
	const [scannerOpen, setScannerOpen] = useState(false);
	const [isLoadingPerson, setIsLoadingPerson] = useState(false);

	// Eligibility state
	const [eligibilityResult, setEligibilityResult] =
		useState<EligibilityResult | null>(null);
	const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
	const [overrideConfirmed, setOverrideConfirmed] = useState(false);

	// Check eligibility when person is selected
	useEffect(() => {
		if (!selectedPerson) {
			setEligibilityResult(null);
			setOverrideConfirmed(false);
			return;
		}

		const checkEligibility = async () => {
			setIsCheckingEligibility(true);
			setOverrideConfirmed(false);
			try {
				const result = await checkPersonEligibility({
					data: {
						benefitId: benefit.id,
						personId: selectedPerson.id,
					},
				});
				if (result.success && result.result) {
					setEligibilityResult(result.result);
				} else {
					setEligibilityResult(null);
				}
			} catch (err) {
				console.error("Eligibility check failed:", err);
				setEligibilityResult(null);
			} finally {
				setIsCheckingEligibility(false);
			}
		};

		checkEligibility();
	}, [selectedPerson, benefit.id]);

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

	// Determine if form can be submitted
	const isEligible = eligibilityResult?.eligible ?? true;
	const canSubmit =
		selectedPerson &&
		!isCheckingEligibility &&
		(isEligible || overrideConfirmed);

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
					overrideEligibility: !isEligible && overrideConfirmed,
				},
			});

			if (result.success) {
				const personName = buildPersonName(selectedPerson);
				// Reset form for next person
				setSelectedPerson(null);
				setSearchQuery("");
				setNotes("");
				setEligibilityResult(null);
				setOverrideConfirmed(false);
				setSuccessMessage(`Voucher issued for ${personName}`);
				setTimeout(() => setSuccessMessage(null), 4000);
				await router.invalidate();
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

						{successMessage && (
							<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center gap-2">
								<CheckCircle className="h-5 w-5 flex-shrink-0" />
								<span>{successMessage}</span>
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label>Person *</Label>
								{isLoadingPerson ? (
									<div className="flex items-center justify-center rounded-md border p-3 text-muted-foreground">
										Loading person...
									</div>
								) : selectedPerson ? (
									<div className="flex items-center justify-between rounded-md border p-3">
										<div className="flex items-center gap-3">
											{selectedPerson.profilePhoto ? (
												<img
													src={selectedPerson.profilePhoto}
													alt=""
													className="h-14 w-14 rounded-full object-cover"
												/>
											) : (
												<div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
													<User className="h-7 w-7 text-muted-foreground" />
												</div>
											)}
											<div>
												<p className="font-medium">
													{buildPersonName(selectedPerson)}
												</p>
												<p className="text-sm text-muted-foreground">
													{selectedPerson.phoneNumber}
												</p>
											</div>
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
																		<div className="flex items-center gap-3">
																			{person.profilePhoto ? (
																				<img
																					src={person.profilePhoto}
																					alt=""
																					className="h-8 w-8 rounded-full object-cover"
																				/>
																			) : (
																				<div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
																					<User className="h-4 w-4 text-muted-foreground" />
																				</div>
																			)}
																			<div className="flex flex-col">
																				<span>{buildPersonName(person)}</span>
																				<span className="text-sm text-muted-foreground">
																					{person.phoneNumber}
																				</span>
																			</div>
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

							{/* Eligibility Status */}
							{selectedPerson && isCheckingEligibility && (
								<div className="text-sm text-muted-foreground">
									Checking eligibility...
								</div>
							)}

							{selectedPerson &&
								!isCheckingEligibility &&
								eligibilityResult &&
								eligibilityResult.eligible && (
									<div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-start gap-2">
										<CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
										<div>
											<p className="font-medium">Eligible</p>
											<p className="text-sm text-green-700">
												This person meets all eligibility criteria.
											</p>
										</div>
									</div>
								)}

							{selectedPerson &&
								!isCheckingEligibility &&
								eligibilityResult &&
								!eligibilityResult.eligible && (
									<div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
										<div className="flex items-start gap-2">
											<AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
											<div className="flex-1">
												<p className="font-medium">Eligibility Issues</p>
												<ul className="text-sm text-amber-700 list-disc list-inside mt-1 space-y-0.5">
													{eligibilityResult.reasons.map((reason) => (
														<li key={reason}>{reason}</li>
													))}
												</ul>
											</div>
										</div>
										<div className="mt-3 pt-3 border-t border-amber-200 flex items-start gap-2">
											<Checkbox
												id={`${id}-override`}
												checked={overrideConfirmed}
												onCheckedChange={(checked) =>
													setOverrideConfirmed(checked === true)
												}
												className="mt-0.5"
											/>
											<Label
												htmlFor={`${id}-override`}
												className="text-sm font-normal cursor-pointer"
											>
												I confirm that I want to issue this voucher despite the
												eligibility issues
											</Label>
										</div>
									</div>
								)}

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
									disabled={isSubmitting || !canSubmit}
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
