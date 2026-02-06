import { useRouter } from "@tanstack/react-router";
import { Loader2, QrCode, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { QrScannerDialog } from "@/components/qr/QrScannerDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type Person, searchPeople } from "@/data/people";

export function DepartmentLanding() {
	const router = useRouter();
	const [qrScannerOpen, setQrScannerOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Person[]>([]);
	const [isSearching, setIsSearching] = useState(false);

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

	const navigateToPerson = (personId: string) => {
		router.navigate({
			to: "/people/$personId",
			params: { personId },
		});
	};

	return (
		<div className="h-full flex flex-col items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardContent className="pt-6 space-y-6">
					{/* QR Scanner - primary action */}
					<div className="flex flex-col items-center gap-3">
						<Button
							size="lg"
							className="w-full gap-3 h-14 text-base"
							onClick={() => setQrScannerOpen(true)}
						>
							<QrCode className="h-6 w-6" />
							Scan ID Card
						</Button>
					</div>

					{/* Divider */}
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-card px-2 text-muted-foreground">
								or search by name
							</span>
						</div>
					</div>

					{/* Person search */}
					<div className="space-y-2">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search by name or phone..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>

						{/* Search results */}
						{isSearching && (
							<div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								Searching...
							</div>
						)}

						{!isSearching &&
							searchQuery.trim() &&
							searchResults.length === 0 && (
								<div className="text-center py-4 text-sm text-muted-foreground">
									No people found
								</div>
							)}

						{!isSearching && searchResults.length > 0 && (
							<div className="max-h-64 overflow-auto rounded-md border divide-y">
								{searchResults.map((person) => (
									<button
										key={person.id}
										type="button"
										className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
										onClick={() => navigateToPerson(person.id)}
									>
										{person.profilePhoto ? (
											<img
												src={person.profilePhoto}
												alt=""
												className="h-10 w-10 rounded-full object-cover"
											/>
										) : (
											<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
												<User className="h-5 w-5 text-muted-foreground" />
											</div>
										)}
										<div className="flex flex-col min-w-0">
											<span className="font-medium truncate">
												{person.firstName} {person.lastName}
											</span>
											<span className="text-sm text-muted-foreground truncate">
												{person.address.barangay} &middot; {person.phoneNumber}
											</span>
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<QrScannerDialog
				open={qrScannerOpen}
				onOpenChange={setQrScannerOpen}
				onScan={(personId) => {
					setQrScannerOpen(false);
					navigateToPerson(personId);
				}}
				onError={(error) => {
					toast.error(error);
				}}
			/>
		</div>
	);
}
