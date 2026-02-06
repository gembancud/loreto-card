import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	ChevronDown,
	ChevronRight,
	Clock,
	Edit,
	Filter,
	Gift,
	Plus,
	Ticket,
	Trash2,
	User,
	Users,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
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
import {
	type AuditLogListItem,
	type ChangesRecord,
	getAuditLogs,
} from "@/data/audit";
import { getCurrentUser, isBarangayStaff } from "@/data/auth/session";
import type { AuditAction, AuditEntityType } from "@/db/schema";

export const Route = createFileRoute("/_authed/activity")({
	component: ActivityPage,
	beforeLoad: async () => {
		const user = await getCurrentUser();
		if (isBarangayStaff(user)) {
			throw redirect({ to: "/" });
		}
	},
	loaderDeps: ({ search }) => ({
		entityType: (search as { entityType?: AuditEntityType }).entityType,
		startDate: (search as { startDate?: string }).startDate,
		endDate: (search as { endDate?: string }).endDate,
		page: (search as { page?: number }).page ?? 1,
	}),
	loader: async ({ deps }) => {
		return getAuditLogs({
			data: {
				entityType: deps.entityType,
				startDate: deps.startDate,
				endDate: deps.endDate,
				page: deps.page,
				pageSize: 20,
			},
		});
	},
});

const ACTION_LABELS: Record<AuditAction, string> = {
	create: "Created",
	update: "Updated",
	delete: "Deleted",
	deactivate: "Deactivated",
	release: "Released",
	cancel: "Cancelled",
};

const ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
	person: "Person",
	benefit: "Benefit",
	voucher: "Voucher",
	user: "User",
	department: "Department",
};

function getActionIcon(action: AuditAction) {
	switch (action) {
		case "create":
			return <Plus className="h-4 w-4 text-green-600" />;
		case "update":
			return <Edit className="h-4 w-4 text-blue-600" />;
		case "delete":
		case "deactivate":
			return <Trash2 className="h-4 w-4 text-red-600" />;
		case "release":
			return <Ticket className="h-4 w-4 text-purple-600" />;
		case "cancel":
			return <Trash2 className="h-4 w-4 text-orange-600" />;
	}
}

function getEntityIcon(entityType: AuditEntityType) {
	switch (entityType) {
		case "person":
			return <User className="h-4 w-4" />;
		case "benefit":
			return <Gift className="h-4 w-4" />;
		case "voucher":
			return <Ticket className="h-4 w-4" />;
		case "user":
			return <Users className="h-4 w-4" />;
		case "department":
			return <Clock className="h-4 w-4" />;
	}
}

function formatDateTime(date: Date): string {
	return new Date(date).toLocaleString("en-PH", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

interface ChangesDisplayProps {
	changes: ChangesRecord;
}

function ChangesDisplay({ changes }: ChangesDisplayProps) {
	const entries = Object.entries(changes);
	if (entries.length === 0) return null;

	return (
		<div className="mt-2 space-y-1 text-sm">
			{entries.map(([field, { old, new: newVal }]) => (
				<div key={field} className="flex gap-2 text-muted-foreground">
					<span className="font-medium">{field}:</span>
					<span className="line-through text-red-600/70">
						{old === null ? "null" : String(old)}
					</span>
					<span className="text-green-600">
						{newVal === null ? "null" : String(newVal)}
					</span>
				</div>
			))}
		</div>
	);
}

interface ActivityRowProps {
	log: AuditLogListItem;
	expanded: boolean;
	onToggle: () => void;
}

function ActivityRow({ log, expanded, onToggle }: ActivityRowProps) {
	const hasChanges = log.changes && Object.keys(log.changes).length > 0;

	return (
		<>
			<TableRow
				className={hasChanges ? "cursor-pointer hover:bg-muted/50" : ""}
				onClick={hasChanges ? onToggle : undefined}
			>
				<TableCell className="whitespace-nowrap">
					{formatDateTime(log.createdAt)}
				</TableCell>
				<TableCell>
					<div className="flex items-center gap-2">
						<span>{log.actorName}</span>
						{log.actorDepartmentName && (
							<Badge variant="outline" className="text-xs">
								{log.actorDepartmentName}
							</Badge>
						)}
					</div>
				</TableCell>
				<TableCell>
					<div className="flex items-center gap-2">
						{getActionIcon(log.action)}
						<span>{ACTION_LABELS[log.action]}</span>
					</div>
				</TableCell>
				<TableCell>
					<div className="flex items-center gap-2">
						{getEntityIcon(log.entityType)}
						<span>{ENTITY_TYPE_LABELS[log.entityType]}</span>
					</div>
				</TableCell>
				<TableCell>
					{log.entityType === "person" && log.entityId ? (
						<Link
							to="/people/$personId"
							params={{ personId: log.entityId }}
							className="text-primary hover:underline"
							onClick={(e) => e.stopPropagation()}
						>
							{log.entityName}
						</Link>
					) : (
						(log.entityName ?? "—")
					)}
				</TableCell>
				<TableCell className="w-8">
					{hasChanges && (
						<Button variant="ghost" size="sm" className="h-6 w-6 p-0">
							{expanded ? (
								<ChevronDown className="h-4 w-4" />
							) : (
								<ChevronRight className="h-4 w-4" />
							)}
						</Button>
					)}
				</TableCell>
			</TableRow>
			{expanded && hasChanges && log.changes && (
				<TableRow className="bg-muted/30">
					<TableCell colSpan={6} className="py-3">
						<div className="pl-4">
							<p className="text-xs font-medium text-muted-foreground mb-2">
								Changes:
							</p>
							<ChangesDisplay changes={log.changes} />
						</div>
					</TableCell>
				</TableRow>
			)}
		</>
	);
}

function ActivityPage() {
	const data = Route.useLoaderData();
	const { entityType, startDate, endDate } = Route.useLoaderDeps();
	const navigate = Route.useNavigate();

	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
	const [filterEntityType, setFilterEntityType] = useState<
		AuditEntityType | "all"
	>(entityType ?? "all");
	const [filterStartDate, setFilterStartDate] = useState(startDate ?? "");
	const [filterEndDate, setFilterEndDate] = useState(endDate ?? "");

	const toggleRow = (id: string) => {
		setExpandedRows((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const handleApplyFilters = () => {
		navigate({
			search: {
				entityType: filterEntityType === "all" ? undefined : filterEntityType,
				startDate: filterStartDate || undefined,
				endDate: filterEndDate || undefined,
				page: 1,
			},
		});
	};

	const handleClearFilters = () => {
		setFilterEntityType("all");
		setFilterStartDate("");
		setFilterEndDate("");
		navigate({ search: {} });
	};

	const handlePageChange = (newPage: number) => {
		navigate({
			search: {
				entityType: entityType,
				startDate: startDate,
				endDate: endDate,
				page: newPage,
			},
		});
	};

	const hasActiveFilters = entityType || startDate || endDate;

	return (
		<div className="container mx-auto py-8 px-4">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5" />
						Activity Log
					</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Filters */}
					<div className="mb-6 flex flex-wrap gap-4 items-end">
						<div className="grid gap-2">
							<Label className="text-sm">Entity Type</Label>
							<Select
								value={filterEntityType}
								onValueChange={(v) =>
									setFilterEntityType(v as AuditEntityType | "all")
								}
							>
								<SelectTrigger className="w-[150px]">
									<SelectValue placeholder="All types" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All types</SelectItem>
									<SelectItem value="person">Person</SelectItem>
									<SelectItem value="benefit">Benefit</SelectItem>
									<SelectItem value="voucher">Voucher</SelectItem>
									<SelectItem value="user">User</SelectItem>
									<SelectItem value="department">Department</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label className="text-sm">From Date</Label>
							<Input
								type="date"
								value={filterStartDate}
								onChange={(e) => setFilterStartDate(e.target.value)}
								className="w-[150px]"
							/>
						</div>

						<div className="grid gap-2">
							<Label className="text-sm">To Date</Label>
							<Input
								type="date"
								value={filterEndDate}
								onChange={(e) => setFilterEndDate(e.target.value)}
								className="w-[150px]"
							/>
						</div>

						<Button onClick={handleApplyFilters} className="gap-2">
							<Filter className="h-4 w-4" />
							Apply Filters
						</Button>

						{hasActiveFilters && (
							<Button variant="outline" onClick={handleClearFilters}>
								Clear Filters
							</Button>
						)}
					</div>

					{/* Table */}
					{data.logs.length === 0 ? (
						<p className="text-center text-muted-foreground py-12">
							No activity logs found.
						</p>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[180px]">Date/Time</TableHead>
										<TableHead>Actor</TableHead>
										<TableHead className="w-[120px]">Action</TableHead>
										<TableHead className="w-[120px]">Entity Type</TableHead>
										<TableHead>Entity</TableHead>
										<TableHead className="w-8" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.logs.map((log) => (
										<ActivityRow
											key={log.id}
											log={log}
											expanded={expandedRows.has(log.id)}
											onToggle={() => toggleRow(log.id)}
										/>
									))}
								</TableBody>
							</Table>

							<div className="mt-4">
								<Pagination
									currentPage={data.page}
									totalPages={data.totalPages}
									totalItems={data.total}
									pageSize={data.pageSize}
									onPageChange={handlePageChange}
								/>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
