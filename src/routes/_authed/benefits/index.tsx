import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/data/auth/session";
import { LORETO_BARANGAYS, type LoretoBarangay } from "@/data/barangays";
import {
	type BenefitListItem,
	createBenefit,
	deactivateBenefit,
	getBenefits,
	getDepartmentUsersForAssignment,
	updateBenefit,
} from "@/data/benefits";
import type { BenefitEligibility, IdentificationType } from "@/db/schema";

export const Route = createFileRoute("/_authed/benefits/")({
	component: BenefitsPage,
	loader: async () => {
		const [benefits, currentUser] = await Promise.all([
			getBenefits(),
			getCurrentUser(),
		]);
		// Only fetch department users for admins/superusers (needed for management UI)
		const canManage =
			currentUser?.role === "admin" || currentUser?.role === "superuser";
		const departmentUsers = canManage
			? await getDepartmentUsersForAssignment({ data: undefined })
			: [];
		return { benefits, currentUser, departmentUsers, canManage };
	},
});

function BenefitsPage() {
	const {
		benefits: initialBenefits,
		departmentUsers,
		canManage,
	} = Route.useLoaderData();
	const navigate = useNavigate();
	const [benefits, setBenefits] = useState(initialBenefits);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [editingBenefit, setEditingBenefit] = useState<BenefitListItem | null>(
		null,
	);

	const handleBenefitCreated = (newBenefit: BenefitListItem) => {
		setBenefits((prev) => [...prev, newBenefit]);
		setIsAddDialogOpen(false);
	};

	const handleBenefitUpdated = (updatedBenefit: BenefitListItem) => {
		setBenefits((prev) =>
			prev.map((b) => (b.id === updatedBenefit.id ? updatedBenefit : b)),
		);
		setEditingBenefit(null);
	};

	const handleToggleActive = async (benefit: BenefitListItem) => {
		if (benefit.isActive) {
			const result = await deactivateBenefit({ data: benefit.id });
			if (result.success) {
				setBenefits((prev) =>
					prev.map((b) =>
						b.id === benefit.id ? { ...b, isActive: false } : b,
					),
				);
			}
		} else {
			const result = await updateBenefit({
				data: {
					benefitId: benefit.id,
					updates: { isActive: true },
				},
			});
			if (result.success) {
				setBenefits((prev) =>
					prev.map((b) => (b.id === benefit.id ? { ...b, isActive: true } : b)),
				);
			}
		}
	};

	const formatValue = (benefit: BenefitListItem) => {
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
			<div className="max-w-6xl mx-auto">
				<div className="mb-6 flex items-center justify-between">
					<h1 className="text-2xl font-semibold">
						{canManage ? "Benefits Management" : "Benefits"}
					</h1>

					{canManage && (
						<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
							<DialogTrigger asChild>
								<Button className="gap-2">
									<Plus className="h-4 w-4" />
									Add Benefit
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-2xl">
								<BenefitForm
									departmentUsers={departmentUsers}
									onSuccess={handleBenefitCreated}
									onCancel={() => setIsAddDialogOpen(false)}
								/>
							</DialogContent>
						</Dialog>
					)}
				</div>

				<Card>
					<CardContent className="pt-6">
						{/* Mobile card view */}
						<div className="md:hidden space-y-3">
							{benefits.length === 0 ? (
								<div className="text-center text-muted-foreground py-8">
									{canManage
										? "No benefits found. Create your first benefit to get started."
										: "No benefits available for your department."}
								</div>
							) : (
								benefits.map((benefit) => {
									const cardContent = (
										<>
											{/* Header: Name + Status */}
											<div className="flex items-start justify-between gap-2">
												<div className="font-medium">{benefit.name}</div>
												<span
													className={`shrink-0 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
														benefit.isActive
															? "bg-green-100 text-green-700"
															: "bg-red-100 text-red-700"
													}`}
												>
													{benefit.isActive ? "Active" : "Inactive"}
												</span>
											</div>

											{/* Description + Value */}
											{benefit.description && (
												<div className="text-sm text-muted-foreground">
													{benefit.description}
												</div>
											)}
											<div className="text-sm font-medium">
												{formatValue(benefit)}
											</div>

											{/* Providers */}
											<div className="pt-2 border-t">
												<div className="text-xs text-muted-foreground mb-1">
													Providers
												</div>
												<div className="flex flex-wrap gap-1">
													{benefit.providers.length === 0 ? (
														<span className="text-muted-foreground text-sm">
															—
														</span>
													) : (
														benefit.providers.map((p) => (
															<Badge key={p.id} variant="secondary">
																{p.userName}
															</Badge>
														))
													)}
												</div>
											</div>

											{/* Releasers */}
											<div>
												<div className="text-xs text-muted-foreground mb-1">
													Releasers
												</div>
												<div className="flex flex-wrap gap-1">
													{benefit.releasers.length === 0 ? (
														<span className="text-muted-foreground text-sm">
															—
														</span>
													) : (
														benefit.releasers.map((r) => (
															<Badge key={r.id} variant="outline">
																{r.userName}
															</Badge>
														))
													)}
												</div>
											</div>

											{/* Footer: Created by + Actions (managers only) */}
											{canManage && (
												<div className="pt-2 border-t flex items-center justify-between">
													<div className="text-sm text-muted-foreground">
														Created by: {benefit.createdByName ?? "Unknown"}
													</div>
													<div className="flex items-center gap-2">
														<Dialog
															open={editingBenefit?.id === benefit.id}
															onOpenChange={(open) =>
																setEditingBenefit(open ? benefit : null)
															}
														>
															<DialogTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={(e) => e.stopPropagation()}
																>
																	<Pencil className="h-4 w-4" />
																</Button>
															</DialogTrigger>
															<DialogContent className="max-w-2xl">
																<BenefitForm
																	benefit={benefit}
																	departmentUsers={departmentUsers}
																	onSuccess={handleBenefitUpdated}
																	onCancel={() => setEditingBenefit(null)}
																/>
															</DialogContent>
														</Dialog>
														<Switch
															checked={benefit.isActive}
															onCheckedChange={() =>
																handleToggleActive(benefit)
															}
															onClick={(e) => e.stopPropagation()}
															aria-label={
																benefit.isActive
																	? "Deactivate benefit"
																	: "Activate benefit"
															}
														/>
													</div>
												</div>
											)}
										</>
									);

									return canManage ? (
										<button
											key={benefit.id}
											type="button"
											className="w-full text-left rounded-lg border bg-card p-4 space-y-2 hover:bg-muted/50 transition-colors"
											onClick={() =>
												navigate({
													to: "/benefits/$benefitId",
													params: { benefitId: benefit.id },
												})
											}
										>
											{cardContent}
										</button>
									) : (
										<div
											key={benefit.id}
											className="rounded-lg border bg-card p-4 space-y-2"
										>
											{cardContent}
										</div>
									);
								})
							)}
						</div>

						{/* Desktop table view */}
						<div className="hidden md:block">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Value</TableHead>
										<TableHead>Providers</TableHead>
										<TableHead>Releasers</TableHead>
										<TableHead>Created By</TableHead>
										<TableHead>Status</TableHead>
										{canManage && <TableHead>Actions</TableHead>}
									</TableRow>
								</TableHeader>
								<TableBody>
									{benefits.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={canManage ? 7 : 6}
												className="text-center text-muted-foreground py-8"
											>
												{canManage
													? "No benefits found. Create your first benefit to get started."
													: "No benefits available for your department."}
											</TableCell>
										</TableRow>
									) : (
										benefits.map((benefit) => (
											<TableRow
												key={benefit.id}
												className={
													canManage ? "cursor-pointer hover:bg-muted/50" : ""
												}
												onClick={
													canManage
														? () =>
																navigate({
																	to: "/benefits/$benefitId",
																	params: { benefitId: benefit.id },
																})
														: undefined
												}
											>
												<TableCell>
													<div>
														<span className="font-medium">{benefit.name}</span>
														{benefit.description && (
															<div className="text-sm text-muted-foreground">
																{benefit.description}
															</div>
														)}
													</div>
												</TableCell>
												<TableCell>{formatValue(benefit)}</TableCell>
												<TableCell>
													<div className="flex flex-wrap gap-1">
														{benefit.providers.length === 0 ? (
															<span className="text-muted-foreground">—</span>
														) : (
															benefit.providers.map((p) => (
																<Badge key={p.id} variant="secondary">
																	{p.userName}
																</Badge>
															))
														)}
													</div>
												</TableCell>
												<TableCell>
													<div className="flex flex-wrap gap-1">
														{benefit.releasers.length === 0 ? (
															<span className="text-muted-foreground">—</span>
														) : (
															benefit.releasers.map((r) => (
																<Badge key={r.id} variant="outline">
																	{r.userName}
																</Badge>
															))
														)}
													</div>
												</TableCell>
												<TableCell>
													{benefit.createdByName ?? (
														<span className="text-muted-foreground">
															Unknown
														</span>
													)}
												</TableCell>
												<TableCell>
													<span
														className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
															benefit.isActive
																? "bg-green-100 text-green-700"
																: "bg-red-100 text-red-700"
														}`}
													>
														{benefit.isActive ? "Active" : "Inactive"}
													</span>
												</TableCell>
												{canManage && (
													<TableCell onClick={(e) => e.stopPropagation()}>
														<div className="flex items-center gap-2">
															<Dialog
																open={editingBenefit?.id === benefit.id}
																onOpenChange={(open) =>
																	setEditingBenefit(open ? benefit : null)
																}
															>
																<DialogTrigger asChild>
																	<Button variant="ghost" size="icon">
																		<Pencil className="h-4 w-4" />
																	</Button>
																</DialogTrigger>
																<DialogContent className="max-w-2xl">
																	<BenefitForm
																		benefit={benefit}
																		departmentUsers={departmentUsers}
																		onSuccess={handleBenefitUpdated}
																		onCancel={() => setEditingBenefit(null)}
																	/>
																</DialogContent>
															</Dialog>
															<Switch
																checked={benefit.isActive}
																onCheckedChange={() =>
																	handleToggleActive(benefit)
																}
																aria-label={
																	benefit.isActive
																		? "Deactivate benefit"
																		: "Activate benefit"
																}
															/>
														</div>
													</TableCell>
												)}
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

interface BenefitFormProps {
	benefit?: BenefitListItem;
	departmentUsers: Array<{ id: string; name: string }>;
	onSuccess: (benefit: BenefitListItem) => void;
	onCancel: () => void;
}

// Category labels for display
const CATEGORY_LABELS: Record<IdentificationType, string> = {
	voter: "Voter",
	philhealth: "PhilHealth",
	sss: "SSS",
	fourPs: "4Ps",
	pwd: "PWD",
	soloParent: "Solo Parent",
	pagibig: "Pag-IBIG",
	tin: "TIN",
	barangayClearance: "Barangay Clearance",
};

// Category types that are commonly used for eligibility (subset of all ID types)
const ELIGIBILITY_CATEGORIES: IdentificationType[] = [
	"fourPs",
	"pwd",
	"soloParent",
];

function BenefitForm({
	benefit,
	departmentUsers,
	onSuccess,
	onCancel,
}: BenefitFormProps) {
	const formId = useId();
	const isEditing = !!benefit;

	const [name, setName] = useState(benefit?.name ?? "");
	const [description, setDescription] = useState(benefit?.description ?? "");
	const [valuePesos, setValuePesos] = useState(
		benefit?.valuePesos?.toString() ?? "",
	);
	const [quantity, setQuantity] = useState(benefit?.quantity?.toString() ?? "");
	const [providerIds, setProviderIds] = useState<string[]>(
		benefit?.providers.map((p) => p.userId) ?? [],
	);
	const [releaserIds, setReleaserIds] = useState<string[]>(
		benefit?.releasers.map((r) => r.userId) ?? [],
	);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Eligibility state
	const [hasEligibility, setHasEligibility] = useState(
		benefit?.eligibility !== null && benefit?.eligibility !== undefined,
	);
	const [selectedBarangays, setSelectedBarangays] = useState<LoretoBarangay[]>(
		benefit?.eligibility?.barangays ?? [],
	);
	const [maxMonthlyIncome, setMaxMonthlyIncome] = useState(
		benefit?.eligibility?.maxMonthlyIncome?.toString() ?? "",
	);
	const [minAge, setMinAge] = useState(
		benefit?.eligibility?.minAge?.toString() ?? "",
	);
	const [maxAge, setMaxAge] = useState(
		benefit?.eligibility?.maxAge?.toString() ?? "",
	);
	const [gender, setGender] = useState<"Male" | "Female" | null>(
		benefit?.eligibility?.gender ?? null,
	);
	const [residencyStatus, setResidencyStatus] = useState<
		"resident" | "nonResident" | null
	>(benefit?.eligibility?.residencyStatus ?? null);
	const [requiredCategories, setRequiredCategories] = useState<
		IdentificationType[]
	>(benefit?.eligibility?.requiredCategories ?? []);
	const [categoryMode, setCategoryMode] = useState<"any" | "all">(
		benefit?.eligibility?.categoryMode ?? "any",
	);

	// Detect users assigned to both provider AND releaser roles
	const duplicateUserIds = providerIds.filter((pid) =>
		releaserIds.includes(pid),
	);
	const hasDuplicates = duplicateUserIds.length > 0;
	const duplicateUserNames = duplicateUserIds
		.map((pid) => departmentUsers.find((u) => u.id === pid)?.name)
		.filter(Boolean)
		.join(", ");

	const handleProviderToggle = (userId: string) => {
		setProviderIds((prev) =>
			prev.includes(userId)
				? prev.filter((pid) => pid !== userId)
				: [...prev, userId],
		);
	};

	const handleReleaserToggle = (userId: string) => {
		setReleaserIds((prev) =>
			prev.includes(userId)
				? prev.filter((pid) => pid !== userId)
				: [...prev, userId],
		);
	};

	const handleBarangayToggle = (barangay: LoretoBarangay) => {
		setSelectedBarangays((prev) =>
			prev.includes(barangay)
				? prev.filter((b) => b !== barangay)
				: [...prev, barangay],
		);
	};

	const handleCategoryToggle = (category: IdentificationType) => {
		setRequiredCategories((prev) =>
			prev.includes(category)
				? prev.filter((c) => c !== category)
				: [...prev, category],
		);
	};

	// Build eligibility object from form state
	const buildEligibility = (): BenefitEligibility | null => {
		if (!hasEligibility) return null;

		// Check if any criteria is set
		const hasCriteria =
			selectedBarangays.length > 0 ||
			maxMonthlyIncome !== "" ||
			minAge !== "" ||
			maxAge !== "" ||
			gender !== null ||
			residencyStatus !== null ||
			requiredCategories.length > 0;

		if (!hasCriteria) return null;

		return {
			barangays: selectedBarangays.length > 0 ? selectedBarangays : null,
			maxMonthlyIncome: maxMonthlyIncome
				? Number.parseInt(maxMonthlyIncome, 10)
				: null,
			minAge: minAge ? Number.parseInt(minAge, 10) : null,
			maxAge: maxAge ? Number.parseInt(maxAge, 10) : null,
			gender,
			residencyStatus,
			requiredCategories,
			categoryMode,
		};
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		const eligibility = buildEligibility();

		try {
			if (isEditing) {
				const result = await updateBenefit({
					data: {
						benefitId: benefit.id,
						updates: {
							name,
							description: description || null,
							valuePesos: valuePesos ? Number.parseInt(valuePesos, 10) : null,
							quantity: quantity ? Number.parseInt(quantity, 10) : null,
							eligibility,
						},
						providerIds,
						releaserIds,
					},
				});
				if (result.success) {
					onSuccess({
						...benefit,
						name,
						description: description || null,
						valuePesos: valuePesos ? Number.parseInt(valuePesos, 10) : null,
						quantity: quantity ? Number.parseInt(quantity, 10) : null,
						eligibility,
						providers: providerIds.map((userId) => {
							const user = departmentUsers.find((u) => u.id === userId);
							return {
								id: `${benefit.id}-${userId}`,
								userId,
								userName: user?.name ?? "",
								role: "provider" as const,
							};
						}),
						releasers: releaserIds.map((userId) => {
							const user = departmentUsers.find((u) => u.id === userId);
							return {
								id: `${benefit.id}-${userId}`,
								userId,
								userName: user?.name ?? "",
								role: "releaser" as const,
							};
						}),
					});
				} else {
					setError(result.error ?? "Failed to update benefit");
				}
			} else {
				const result = await createBenefit({
					data: {
						name,
						description: description || undefined,
						valuePesos: valuePesos
							? Number.parseInt(valuePesos, 10)
							: undefined,
						quantity: quantity ? Number.parseInt(quantity, 10) : undefined,
						eligibility,
						providerIds,
						releaserIds,
					},
				});
				if (result.success && result.benefit) {
					onSuccess(result.benefit);
				} else {
					setError(result.error ?? "Failed to create benefit");
				}
			}
		} catch (err) {
			setError("An unexpected error occurred");
			console.error(err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<DialogHeader>
				<DialogTitle>
					{isEditing ? "Edit Benefit" : "Add New Benefit"}
				</DialogTitle>
				<DialogDescription>
					{isEditing
						? "Update benefit information and assignments."
						: "Create a new benefit type for your department."}
				</DialogDescription>
			</DialogHeader>
			<div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
				<div className="grid gap-2">
					<Label htmlFor={`${formId}-name`}>Name</Label>
					<Input
						id={`${formId}-name`}
						placeholder="e.g., Senior Citizen Cash Aid"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor={`${formId}-description`}>
						Description (optional)
					</Label>
					<Input
						id={`${formId}-description`}
						placeholder="Brief description of the benefit"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="grid gap-2">
						<Label htmlFor={`${formId}-valuePesos`}>
							Value in Pesos (optional)
						</Label>
						<Input
							id={`${formId}-valuePesos`}
							type="number"
							placeholder="e.g., 5000"
							value={valuePesos}
							onChange={(e) => setValuePesos(e.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor={`${formId}-quantity`}>Quantity (optional)</Label>
						<Input
							id={`${formId}-quantity`}
							type="number"
							placeholder="e.g., 10"
							value={quantity}
							onChange={(e) => setQuantity(e.target.value)}
						/>
					</div>
				</div>

				{/* Eligibility Section */}
				<div className="border-t pt-4 mt-2">
					<div className="flex items-center justify-between mb-4">
						<div>
							<Label className="text-base">Eligibility Restrictions</Label>
							<p className="text-sm text-muted-foreground">
								Limit who can receive this benefit
							</p>
						</div>
						<Switch
							checked={hasEligibility}
							onCheckedChange={setHasEligibility}
						/>
					</div>

					{hasEligibility && (
						<div className="space-y-4 pl-1">
							{/* Barangay Restriction */}
							<div className="grid gap-2">
								<Label>Barangays (leave empty for all)</Label>
								<div className="border rounded-md p-3 max-h-32 overflow-y-auto grid grid-cols-2 gap-1">
									{LORETO_BARANGAYS.map((barangay) => (
										<div key={barangay} className="flex items-center space-x-2">
											<Checkbox
												id={`${formId}-barangay-${barangay}`}
												checked={selectedBarangays.includes(barangay)}
												onCheckedChange={() => handleBarangayToggle(barangay)}
											/>
											<Label
												htmlFor={`${formId}-barangay-${barangay}`}
												className="text-xs font-normal cursor-pointer"
											>
												{barangay}
											</Label>
										</div>
									))}
								</div>
							</div>

							{/* Income, Age, Gender, Residency */}
							<div className="grid grid-cols-2 gap-4">
								<div className="grid gap-2">
									<Label htmlFor={`${formId}-maxIncome`}>
										Max Monthly Income (₱)
									</Label>
									<Input
										id={`${formId}-maxIncome`}
										type="number"
										placeholder="e.g., 15000"
										value={maxMonthlyIncome}
										onChange={(e) => setMaxMonthlyIncome(e.target.value)}
									/>
								</div>
								<div className="grid gap-2">
									<Label>Gender</Label>
									<Select
										value={gender ?? "any"}
										onValueChange={(v) =>
											setGender(v === "any" ? null : (v as "Male" | "Female"))
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Any" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="any">Any</SelectItem>
											<SelectItem value="Male">Male</SelectItem>
											<SelectItem value="Female">Female</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-3 gap-4">
								<div className="grid gap-2">
									<Label htmlFor={`${formId}-minAge`}>Min Age</Label>
									<Input
										id={`${formId}-minAge`}
										type="number"
										placeholder="e.g., 60"
										value={minAge}
										onChange={(e) => setMinAge(e.target.value)}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={`${formId}-maxAge`}>Max Age</Label>
									<Input
										id={`${formId}-maxAge`}
										type="number"
										placeholder="e.g., 65"
										value={maxAge}
										onChange={(e) => setMaxAge(e.target.value)}
									/>
								</div>
								<div className="grid gap-2">
									<Label>Residency</Label>
									<Select
										value={residencyStatus ?? "any"}
										onValueChange={(v) =>
											setResidencyStatus(
												v === "any" ? null : (v as "resident" | "nonResident"),
											)
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Any" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="any">Any</SelectItem>
											<SelectItem value="resident">Resident</SelectItem>
											<SelectItem value="nonResident">Non-Resident</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Required Categories */}
							<div className="grid gap-2">
								<div className="flex items-center justify-between">
									<Label>Required Categories</Label>
									{requiredCategories.length > 1 && (
										<Select
											value={categoryMode}
											onValueChange={(v) => setCategoryMode(v as "any" | "all")}
										>
											<SelectTrigger className="w-32 h-8">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="any">Must have any</SelectItem>
												<SelectItem value="all">Must have all</SelectItem>
											</SelectContent>
										</Select>
									)}
								</div>
								<div className="flex flex-wrap gap-2">
									{ELIGIBILITY_CATEGORIES.map((category) => (
										<button
											key={category}
											type="button"
											onClick={() => handleCategoryToggle(category)}
											className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors text-sm ${
												requiredCategories.includes(category)
													? "bg-primary text-primary-foreground border-primary"
													: "bg-background hover:bg-muted"
											}`}
										>
											{CATEGORY_LABELS[category]}
										</button>
									))}
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Provider/Releaser Section */}
				<div className="border-t pt-4 mt-2">
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label>Providers (can issue vouchers)</Label>
							<div className="border rounded-md p-3 max-h-36 overflow-y-auto space-y-2">
								{departmentUsers.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No users available in department
									</p>
								) : (
									departmentUsers.map((user) => (
										<div key={user.id} className="flex items-center space-x-2">
											<Checkbox
												id={`${formId}-provider-${user.id}`}
												checked={providerIds.includes(user.id)}
												onCheckedChange={() => handleProviderToggle(user.id)}
											/>
											<Label
												htmlFor={`${formId}-provider-${user.id}`}
												className="text-sm font-normal cursor-pointer"
											>
												{user.name}
											</Label>
										</div>
									))
								)}
							</div>
						</div>
						<div className="grid gap-2">
							<Label>Releasers (can release vouchers)</Label>
							<div className="border rounded-md p-3 max-h-36 overflow-y-auto space-y-2">
								{departmentUsers.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No users available in department
									</p>
								) : (
									departmentUsers.map((user) => (
										<div key={user.id} className="flex items-center space-x-2">
											<Checkbox
												id={`${formId}-releaser-${user.id}`}
												checked={releaserIds.includes(user.id)}
												onCheckedChange={() => handleReleaserToggle(user.id)}
											/>
											<Label
												htmlFor={`${formId}-releaser-${user.id}`}
												className="text-sm font-normal cursor-pointer"
											>
												{user.name}
											</Label>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				</div>

				{hasDuplicates && (
					<p className="text-sm text-destructive">
						A user cannot be both provider and releaser: {duplicateUserNames}
					</p>
				)}
				{error && <p className="text-sm text-destructive">{error}</p>}
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting || hasDuplicates}>
					{isSubmitting
						? isEditing
							? "Saving..."
							: "Creating..."
						: isEditing
							? "Save Changes"
							: "Create Benefit"}
				</Button>
			</DialogFooter>
		</form>
	);
}
