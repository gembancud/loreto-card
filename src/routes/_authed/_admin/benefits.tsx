import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	Gift,
	Pencil,
	Plus,
	ToggleLeft,
	ToggleRight,
} from "lucide-react";
import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/data/auth/session";
import {
	createBenefit,
	deactivateBenefit,
	type BenefitListItem,
	getBenefits,
	getDepartmentUsersForAssignment,
	updateBenefit,
} from "@/data/benefits";

export const Route = createFileRoute("/_authed/_admin/benefits")({
	component: BenefitsPage,
	loader: async () => {
		const [benefits, currentUser, departmentUsers] = await Promise.all([
			getBenefits(),
			getCurrentUser(),
			getDepartmentUsersForAssignment({ data: undefined }),
		]);
		return { benefits, currentUser, departmentUsers };
	},
});

function BenefitsPage() {
	const { benefits: initialBenefits, departmentUsers } = Route.useLoaderData();
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
					prev.map((b) => (b.id === benefit.id ? { ...b, isActive: false } : b)),
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
					<Link to="/">
						<Button variant="ghost" className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							Back
						</Button>
					</Link>

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
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Gift className="h-5 w-5" />
							Benefits Management
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Value</TableHead>
									<TableHead>Providers</TableHead>
									<TableHead>Releasers</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{benefits.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={6}
											className="text-center text-muted-foreground py-8"
										>
											No benefits found. Create your first benefit to get
											started.
										</TableCell>
									</TableRow>
								) : (
									benefits.map((benefit) => (
										<TableRow key={benefit.id}>
											<TableCell>
												<div>
													<div className="font-medium">{benefit.name}</div>
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
											<TableCell>
												<div className="flex gap-2">
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
													<Button
														variant="ghost"
														size="icon"
														onClick={() => handleToggleActive(benefit)}
														title={
															benefit.isActive
																? "Deactivate benefit"
																: "Activate benefit"
														}
													>
														{benefit.isActive ? (
															<ToggleRight className="h-4 w-4 text-green-500" />
														) : (
															<ToggleLeft className="h-4 w-4 text-red-500" />
														)}
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
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

function BenefitForm({
	benefit,
	departmentUsers,
	onSuccess,
	onCancel,
}: BenefitFormProps) {
	const id = useId();
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

	const handleProviderToggle = (userId: string) => {
		setProviderIds((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	};

	const handleReleaserToggle = (userId: string) => {
		setReleaserIds((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

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
						valuePesos: valuePesos ? Number.parseInt(valuePesos, 10) : undefined,
						quantity: quantity ? Number.parseInt(quantity, 10) : undefined,
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
				<DialogTitle>{isEditing ? "Edit Benefit" : "Add New Benefit"}</DialogTitle>
				<DialogDescription>
					{isEditing
						? "Update benefit information and assignments."
						: "Create a new benefit type for your department."}
				</DialogDescription>
			</DialogHeader>
			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor={`${id}-name`}>Name</Label>
					<Input
						id={`${id}-name`}
						placeholder="e.g., Senior Citizen Cash Aid"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor={`${id}-description`}>Description (optional)</Label>
					<Input
						id={`${id}-description`}
						placeholder="Brief description of the benefit"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="grid gap-2">
						<Label htmlFor={`${id}-valuePesos`}>Value in Pesos (optional)</Label>
						<Input
							id={`${id}-valuePesos`}
							type="number"
							placeholder="e.g., 5000"
							value={valuePesos}
							onChange={(e) => setValuePesos(e.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor={`${id}-quantity`}>Quantity (optional)</Label>
						<Input
							id={`${id}-quantity`}
							type="number"
							placeholder="e.g., 10"
							value={quantity}
							onChange={(e) => setQuantity(e.target.value)}
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="grid gap-2">
						<Label>Providers (can issue vouchers)</Label>
						<div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
							{departmentUsers.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No users available in department
								</p>
							) : (
								departmentUsers.map((user) => (
									<div key={user.id} className="flex items-center space-x-2">
										<Checkbox
											id={`${id}-provider-${user.id}`}
											checked={providerIds.includes(user.id)}
											onCheckedChange={() => handleProviderToggle(user.id)}
										/>
										<Label
											htmlFor={`${id}-provider-${user.id}`}
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
						<div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
							{departmentUsers.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No users available in department
								</p>
							) : (
								departmentUsers.map((user) => (
									<div key={user.id} className="flex items-center space-x-2">
										<Checkbox
											id={`${id}-releaser-${user.id}`}
											checked={releaserIds.includes(user.id)}
											onCheckedChange={() => handleReleaserToggle(user.id)}
										/>
										<Label
											htmlFor={`${id}-releaser-${user.id}`}
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

				{error && <p className="text-sm text-destructive">{error}</p>}
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
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
