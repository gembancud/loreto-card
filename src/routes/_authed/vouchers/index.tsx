import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle, Clock, Gift, Send, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { CarouselItem, MobileCarousel } from "@/components/MobileCarousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	cancelVoucher,
	getMyAssignedBenefits,
	getMyIssuedVouchers,
	getMyReleasedVouchers,
} from "@/data/vouchers";

export const Route = createFileRoute("/_authed/vouchers/")({
	component: VoucherDashboardPage,
	loader: async () => {
		const [assignedBenefits, myVouchers, myReleasedVouchers] =
			await Promise.all([
				getMyAssignedBenefits(),
				getMyIssuedVouchers(),
				getMyReleasedVouchers(),
			]);

		// Separate provider and releaser benefits
		const providerBenefits = assignedBenefits.filter(
			(b) => b.role === "provider",
		);
		const releaserBenefits = assignedBenefits.filter(
			(b) => b.role === "releaser",
		);

		return {
			providerBenefits,
			releaserBenefits,
			myVouchers,
			myReleasedVouchers,
		};
	},
});

const PAGE_SIZE = 10;

function VoucherDashboardPage() {
	const { providerBenefits, releaserBenefits, myVouchers, myReleasedVouchers } =
		Route.useLoaderData();
	const [vouchers, setVouchers] = useState(myVouchers);
	const [releasedVouchers, setReleasedVouchers] = useState(myReleasedVouchers);
	const [issuedPage, setIssuedPage] = useState(1);
	const [releasedPage, setReleasedPage] = useState(1);

	// Sync local state when loader data changes (e.g., after navigation with invalidation)
	useEffect(() => {
		setVouchers(myVouchers);
		setReleasedVouchers(myReleasedVouchers);
		setIssuedPage(1);
		setReleasedPage(1);
	}, [myVouchers, myReleasedVouchers]);

	// Derive paginated data
	const issuedTotalPages = Math.ceil(vouchers.length / PAGE_SIZE);
	const releasedTotalPages = Math.ceil(releasedVouchers.length / PAGE_SIZE);

	const paginatedIssuedVouchers = vouchers.slice(
		(issuedPage - 1) * PAGE_SIZE,
		issuedPage * PAGE_SIZE,
	);
	const paginatedReleasedVouchers = releasedVouchers.slice(
		(releasedPage - 1) * PAGE_SIZE,
		releasedPage * PAGE_SIZE,
	);

	const handleCancel = async (voucherId: string) => {
		if (!confirm("Are you sure you want to cancel this voucher?")) {
			return;
		}
		const result = await cancelVoucher({ data: voucherId });
		if (result.success) {
			setVouchers((prev) => {
				const updated = prev.map((v) =>
					v.id === voucherId ? { ...v, status: "cancelled" as const } : v,
				);
				// Adjust page if current page becomes empty after cancellation
				// (cancelled vouchers still show, so this handles future filtering scenarios)
				const newTotalPages = Math.ceil(updated.length / PAGE_SIZE);
				if (issuedPage > newTotalPages && newTotalPages > 0) {
					setIssuedPage(newTotalPages);
				}
				return updated;
			});
		} else {
			alert(result.error ?? "Failed to cancel voucher");
		}
	};

	const formatDate = (date: Date | null) => {
		if (!date) return "—";
		return new Date(date).toLocaleDateString("en-PH", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "pending":
				return (
					<Badge variant="outline" className="gap-1">
						<Clock className="h-3 w-3" />
						Pending
					</Badge>
				);
			case "released":
				return (
					<Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
						<CheckCircle className="h-3 w-3" />
						Released
					</Badge>
				);
			case "cancelled":
				return (
					<Badge variant="destructive" className="gap-1">
						<XCircle className="h-3 w-3" />
						Cancelled
					</Badge>
				);
			default:
				return <Badge>{status}</Badge>;
		}
	};

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="max-w-6xl mx-auto space-y-8">
				<h1 className="text-2xl font-semibold">Vouchers</h1>

				{/* Benefits I Can Provide */}
				{providerBenefits.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Gift className="h-5 w-5" />
								Benefits I Can Provide
							</CardTitle>
						</CardHeader>
						<CardContent>
							{/* Mobile carousel */}
							<div className="md:hidden">
								<MobileCarousel>
									{providerBenefits.map((benefit) => (
										<CarouselItem key={benefit.id}>
											<BenefitCard
												benefit={benefit}
												actionButton={
													<Link
														to="/vouchers/provide/$benefitId"
														params={{ benefitId: benefit.id }}
													>
														<Button className="w-full mt-2 gap-2">
															<Send className="h-4 w-4" />
															Issue Voucher
														</Button>
													</Link>
												}
											/>
										</CarouselItem>
									))}
								</MobileCarousel>
							</div>
							{/* Desktop grid */}
							<div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{providerBenefits.map((benefit) => (
									<BenefitCard
										key={benefit.id}
										benefit={benefit}
										actionButton={
											<Link
												to="/vouchers/provide/$benefitId"
												params={{ benefitId: benefit.id }}
											>
												<Button className="w-full mt-2 gap-2">
													<Send className="h-4 w-4" />
													Issue Voucher
												</Button>
											</Link>
										}
									/>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Benefits I Can Release */}
				{releaserBenefits.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CheckCircle className="h-5 w-5" />
								Benefits I Can Release
							</CardTitle>
						</CardHeader>
						<CardContent>
							{/* Mobile carousel */}
							<div className="md:hidden">
								<MobileCarousel>
									{releaserBenefits.map((benefit) => (
										<CarouselItem key={benefit.id}>
											<BenefitCard
												benefit={benefit}
												actionButton={
													<Link
														to="/vouchers/release/$benefitId"
														params={{ benefitId: benefit.id }}
													>
														<Button className="w-full mt-2 gap-2">
															<CheckCircle className="h-4 w-4" />
															Release Voucher
														</Button>
													</Link>
												}
											/>
										</CarouselItem>
									))}
								</MobileCarousel>
							</div>
							{/* Desktop grid */}
							<div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{releaserBenefits.map((benefit) => (
									<BenefitCard
										key={benefit.id}
										benefit={benefit}
										actionButton={
											<Link
												to="/vouchers/release/$benefitId"
												params={{ benefitId: benefit.id }}
											>
												<Button className="w-full mt-2 gap-2">
													<CheckCircle className="h-4 w-4" />
													Release Voucher
												</Button>
											</Link>
										}
									/>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Voucher History */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Gift className="h-5 w-5" />
							Voucher History
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="issued">
							<TabsList className="mb-4">
								<TabsTrigger value="issued" className="gap-2">
									<Send className="h-4 w-4" />
									Issued
									{vouchers.length > 0 && (
										<Badge variant="secondary" className="ml-1">
											{vouchers.length}
										</Badge>
									)}
								</TabsTrigger>
								<TabsTrigger value="released" className="gap-2">
									<CheckCircle className="h-4 w-4" />
									Released
									{releasedVouchers.length > 0 && (
										<Badge variant="secondary" className="ml-1">
											{releasedVouchers.length}
										</Badge>
									)}
								</TabsTrigger>
							</TabsList>

							<TabsContent value="issued">
								{vouchers.length === 0 ? (
									<p className="text-center text-muted-foreground py-8">
										You haven't issued any vouchers yet.
									</p>
								) : (
									<>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Benefit</TableHead>
													<TableHead>Person</TableHead>
													<TableHead>Status</TableHead>
													<TableHead>Issued</TableHead>
													<TableHead>Released By</TableHead>
													<TableHead>Actions</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{paginatedIssuedVouchers.map((voucher) => (
													<TableRow key={voucher.id}>
														<TableCell className="font-medium">
															{voucher.benefitName}
														</TableCell>
														<TableCell>{voucher.personName}</TableCell>
														<TableCell>
															{getStatusBadge(voucher.status)}
														</TableCell>
														<TableCell>
															{formatDate(voucher.providedAt)}
														</TableCell>
														<TableCell>
															{voucher.releasedByName ?? "—"}
															{voucher.releasedAt && (
																<div className="text-xs text-muted-foreground">
																	{formatDate(voucher.releasedAt)}
																</div>
															)}
														</TableCell>
														<TableCell>
															{voucher.status === "pending" && (
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => handleCancel(voucher.id)}
																	className="text-destructive"
																>
																	Cancel
																</Button>
															)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
										<Pagination
											currentPage={issuedPage}
											totalPages={issuedTotalPages}
											totalItems={vouchers.length}
											pageSize={PAGE_SIZE}
											onPageChange={setIssuedPage}
										/>
									</>
								)}
							</TabsContent>

							<TabsContent value="released">
								{releasedVouchers.length === 0 ? (
									<p className="text-center text-muted-foreground py-8">
										You haven't released any vouchers yet.
									</p>
								) : (
									<>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Benefit</TableHead>
													<TableHead>Person</TableHead>
													<TableHead>Provided By</TableHead>
													<TableHead>Released</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{paginatedReleasedVouchers.map((voucher) => (
													<TableRow key={voucher.id}>
														<TableCell className="font-medium">
															{voucher.benefitName}
														</TableCell>
														<TableCell>{voucher.personName}</TableCell>
														<TableCell>{voucher.providedByName}</TableCell>
														<TableCell>
															{formatDate(voucher.releasedAt)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
										<Pagination
											currentPage={releasedPage}
											totalPages={releasedTotalPages}
											totalItems={releasedVouchers.length}
											pageSize={PAGE_SIZE}
											onPageChange={setReleasedPage}
										/>
									</>
								)}
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>

				{/* Empty state if user has no assignments */}
				{providerBenefits.length === 0 &&
					releaserBenefits.length === 0 &&
					vouchers.length === 0 &&
					releasedVouchers.length === 0 && (
						<Card>
							<CardContent className="py-12 text-center text-muted-foreground">
								<Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>You don't have any benefit assignments yet.</p>
								<p className="text-sm">
									Contact your administrator to be assigned as a provider or
									releaser.
								</p>
							</CardContent>
						</Card>
					)}
			</div>
		</div>
	);
}

interface BenefitCardProps {
	benefit: {
		id: string;
		name: string;
		description: string | null;
		valuePesos: number | null;
		quantity: number | null;
	};
	actionButton: ReactNode;
}

function BenefitCard({ benefit, actionButton }: BenefitCardProps) {
	return (
		<Card className="relative h-full">
			<CardContent className="p-4">
				<div className="space-y-2">
					<h3 className="font-semibold">{benefit.name}</h3>
					{benefit.description && (
						<p className="text-sm text-muted-foreground">
							{benefit.description}
						</p>
					)}
					<div className="flex gap-2 text-sm text-muted-foreground">
						{benefit.valuePesos && (
							<span>₱{benefit.valuePesos.toLocaleString()}</span>
						)}
						{benefit.quantity && <span>{benefit.quantity} units</span>}
					</div>
					{actionButton}
				</div>
			</CardContent>
		</Card>
	);
}
