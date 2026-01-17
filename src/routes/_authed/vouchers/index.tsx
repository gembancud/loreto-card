import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	CheckCircle,
	Clock,
	Gift,
	Send,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	cancelVoucher,
	getMyAssignedBenefits,
	getMyIssuedVouchers,
} from "@/data/vouchers";

export const Route = createFileRoute("/_authed/vouchers/")({
	component: VoucherDashboardPage,
	loader: async () => {
		const [assignedBenefits, myVouchers] = await Promise.all([
			getMyAssignedBenefits(),
			getMyIssuedVouchers(),
		]);

		// Separate provider and releaser benefits
		const providerBenefits = assignedBenefits.filter(
			(b) => b.role === "provider",
		);
		const releaserBenefits = assignedBenefits.filter(
			(b) => b.role === "releaser",
		);

		return { providerBenefits, releaserBenefits, myVouchers };
	},
});

function VoucherDashboardPage() {
	const { providerBenefits, releaserBenefits, myVouchers } =
		Route.useLoaderData();
	const [vouchers, setVouchers] = useState(myVouchers);

	// Sync local state when loader data changes (e.g., after navigation with invalidation)
	useEffect(() => {
		setVouchers(myVouchers);
	}, [myVouchers]);

	const handleCancel = async (voucherId: string) => {
		if (!confirm("Are you sure you want to cancel this voucher?")) {
			return;
		}
		const result = await cancelVoucher({ data: voucherId });
		if (result.success) {
			setVouchers((prev) =>
				prev.map((v) =>
					v.id === voucherId ? { ...v, status: "cancelled" as const } : v,
				),
			);
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
				<div className="flex items-center justify-between">
					<Link to="/">
						<Button variant="ghost" className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							Back
						</Button>
					</Link>
				</div>

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
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{providerBenefits.map((benefit) => (
									<Card key={benefit.id} className="relative">
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
													{benefit.quantity && (
														<span>{benefit.quantity} units</span>
													)}
												</div>
												<Link
													to="/vouchers/provide/$benefitId"
													params={{ benefitId: benefit.id }}
												>
													<Button className="w-full mt-2 gap-2">
														<Send className="h-4 w-4" />
														Issue Voucher
													</Button>
												</Link>
											</div>
										</CardContent>
									</Card>
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
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{releaserBenefits.map((benefit) => (
									<Card key={benefit.id} className="relative">
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
													{benefit.quantity && (
														<span>{benefit.quantity} units</span>
													)}
												</div>
												<Link
													to="/vouchers/release/$benefitId"
													params={{ benefitId: benefit.id }}
												>
													<Button className="w-full mt-2 gap-2">
														<CheckCircle className="h-4 w-4" />
														Release Voucher
													</Button>
												</Link>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* My Issued Vouchers History */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Send className="h-5 w-5" />
							My Issued Vouchers
						</CardTitle>
					</CardHeader>
					<CardContent>
						{vouchers.length === 0 ? (
							<p className="text-center text-muted-foreground py-8">
								You haven't issued any vouchers yet.
							</p>
						) : (
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
									{vouchers.map((voucher) => (
										<TableRow key={voucher.id}>
											<TableCell className="font-medium">
												{voucher.benefitName}
											</TableCell>
											<TableCell>{voucher.personName}</TableCell>
											<TableCell>{getStatusBadge(voucher.status)}</TableCell>
											<TableCell>{formatDate(voucher.providedAt)}</TableCell>
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
						)}
					</CardContent>
				</Card>

				{/* Empty state if user has no assignments */}
				{providerBenefits.length === 0 &&
					releaserBenefits.length === 0 &&
					vouchers.length === 0 && (
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
