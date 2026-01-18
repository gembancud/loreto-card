import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, Clock, Search, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { getBenefitById } from "@/data/benefits";
import { getVouchersForBenefit, type VoucherListItem } from "@/data/vouchers";

export const Route = createFileRoute("/_authed/benefits/$benefitId")({
	component: BenefitDetailPage,
	loader: async ({ params }) => {
		const [benefit, vouchers] = await Promise.all([
			getBenefitById({ data: params.benefitId }),
			getVouchersForBenefit({ data: params.benefitId }),
		]);

		if (!benefit) {
			throw new Error("Benefit not found");
		}

		return { benefit, vouchers };
	},
});

const PAGE_SIZE = 10;

function BenefitDetailPage() {
	const { benefit, vouchers } = Route.useLoaderData();
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);

	// Compute stats from full voucher list
	const stats = useMemo(() => {
		const pending = vouchers.filter((v) => v.status === "pending").length;
		const released = vouchers.filter((v) => v.status === "released").length;
		const cancelled = vouchers.filter((v) => v.status === "cancelled").length;
		return { total: vouchers.length, pending, released, cancelled };
	}, [vouchers]);

	// Filter vouchers by search + status
	const filteredVouchers = useMemo(() => {
		return vouchers.filter((v) => {
			// Filter by status tab
			if (activeTab !== "all" && v.status !== activeTab) {
				return false;
			}
			// Filter by search query
			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase();
				return v.personName.toLowerCase().includes(query);
			}
			return true;
		});
	}, [vouchers, activeTab, searchQuery]);

	// Reset page when filters change
	useEffect(() => {
		// Reference deps to satisfy exhaustive-deps (used as triggers)
		void activeTab;
		void searchQuery;
		setCurrentPage(1);
	}, [activeTab, searchQuery]);

	// Pagination
	const totalPages = Math.ceil(filteredVouchers.length / PAGE_SIZE);
	const paginatedVouchers = filteredVouchers.slice(
		(currentPage - 1) * PAGE_SIZE,
		currentPage * PAGE_SIZE,
	);

	const formatDate = (date: Date | null) => {
		if (!date) return "—";
		return new Date(date).toLocaleDateString("en-PH", {
			year: "numeric",
			month: "short",
			day: "numeric",
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

	const formatValue = () => {
		const parts: string[] = [];
		if (benefit.valuePesos) {
			parts.push(`₱${benefit.valuePesos.toLocaleString()}`);
		}
		if (benefit.quantity) {
			parts.push(`${benefit.quantity} units`);
		}
		return parts.length > 0 ? parts.join(" / ") : "—";
	};

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="max-w-6xl mx-auto space-y-6">
				{/* Back link */}
				<Link
					to="/benefits"
					className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Benefits
				</Link>

				{/* Benefit Details Card */}
				<Card>
					<CardHeader>
						<CardTitle>Benefit Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
							<div>
								<p className="text-sm text-muted-foreground">Name</p>
								<p className="font-medium">{benefit.name}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Value</p>
								<p className="font-medium">{formatValue()}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Department</p>
								<p className="font-medium">{benefit.departmentName ?? "—"}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Created By</p>
								<p className="font-medium">
									{benefit.createdByName ?? "Unknown"}
								</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Status</p>
								<span
									className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
										benefit.isActive
											? "bg-green-100 text-green-700"
											: "bg-red-100 text-red-700"
									}`}
								>
									{benefit.isActive ? "Active" : "Inactive"}
								</span>
							</div>
						</div>
						{benefit.description && (
							<div>
								<p className="text-sm text-muted-foreground">Description</p>
								<p>{benefit.description}</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Statistics Cards */}
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardContent className="pt-6">
							<div className="text-2xl font-bold">{stats.total}</div>
							<p className="text-sm text-muted-foreground">Total Vouchers</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6">
							<div className="text-2xl font-bold text-yellow-600">
								{stats.pending}
							</div>
							<p className="text-sm text-muted-foreground">Pending</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6">
							<div className="text-2xl font-bold text-green-600">
								{stats.released}
							</div>
							<p className="text-sm text-muted-foreground">Released</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6">
							<div className="text-2xl font-bold text-red-600">
								{stats.cancelled}
							</div>
							<p className="text-sm text-muted-foreground">Cancelled</p>
						</CardContent>
					</Card>
				</div>

				{/* Vouchers Card */}
				<Card>
					<CardHeader>
						<CardTitle>Vouchers</CardTitle>
					</CardHeader>
					<CardContent>
						{/* Search Input */}
						<div className="relative mb-4">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search by person name..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>

						{/* Status Tabs */}
						<Tabs value={activeTab} onValueChange={setActiveTab}>
							<TabsList className="mb-4">
								<TabsTrigger value="all">
									All
									<Badge variant="secondary" className="ml-2">
										{vouchers.length}
									</Badge>
								</TabsTrigger>
								<TabsTrigger value="pending">
									Pending
									<Badge variant="secondary" className="ml-2">
										{stats.pending}
									</Badge>
								</TabsTrigger>
								<TabsTrigger value="released">
									Released
									<Badge variant="secondary" className="ml-2">
										{stats.released}
									</Badge>
								</TabsTrigger>
								<TabsTrigger value="cancelled">
									Cancelled
									<Badge variant="secondary" className="ml-2">
										{stats.cancelled}
									</Badge>
								</TabsTrigger>
							</TabsList>

							<TabsContent value={activeTab} className="mt-0">
								<VouchersTable
									vouchers={paginatedVouchers}
									filteredCount={filteredVouchers.length}
									totalCount={vouchers.length}
									searchQuery={searchQuery}
									formatDate={formatDate}
									getStatusBadge={getStatusBadge}
									onRowClick={(personId) =>
										navigate({
											to: "/people/$personId",
											params: { personId },
										})
									}
								/>
								<Pagination
									currentPage={currentPage}
									totalPages={totalPages}
									totalItems={filteredVouchers.length}
									pageSize={PAGE_SIZE}
									onPageChange={setCurrentPage}
								/>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

interface VouchersTableProps {
	vouchers: VoucherListItem[];
	filteredCount: number;
	totalCount: number;
	searchQuery: string;
	formatDate: (date: Date | null) => string;
	getStatusBadge: (status: string) => React.ReactNode;
	onRowClick: (personId: string) => void;
}

function VouchersTable({
	vouchers,
	filteredCount,
	totalCount,
	searchQuery,
	formatDate,
	getStatusBadge,
	onRowClick,
}: VouchersTableProps) {
	if (totalCount === 0) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				No vouchers have been issued for this benefit.
			</div>
		);
	}

	if (filteredCount === 0) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				No vouchers match your {searchQuery.trim() ? "search" : "filter"}.
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Person</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Issued</TableHead>
					<TableHead>Provided By</TableHead>
					<TableHead>Released</TableHead>
					<TableHead>Released By</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{vouchers.map((voucher) => (
					<TableRow
						key={voucher.id}
						className="cursor-pointer hover:bg-muted/50"
						onClick={() => onRowClick(voucher.personId)}
					>
						<TableCell>
							<span className="font-medium">{voucher.personName}</span>
						</TableCell>
						<TableCell>{getStatusBadge(voucher.status)}</TableCell>
						<TableCell>{formatDate(voucher.providedAt)}</TableCell>
						<TableCell>{voucher.providedByName}</TableCell>
						<TableCell>{formatDate(voucher.releasedAt)}</TableCell>
						<TableCell>{voucher.releasedByName ?? "—"}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
