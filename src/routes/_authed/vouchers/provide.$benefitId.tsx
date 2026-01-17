import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Gift, Send } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function ProvideVoucherPage() {
	const { benefit } = Route.useLoaderData();
	const navigate = useNavigate();
	const id = useId();
	const [personId, setPersonId] = useState("");
	const [notes, setNotes] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const result = await createVoucher({
				data: {
					benefitId: benefit.id,
					personId: personId.trim(),
					notes: notes.trim() || undefined,
				},
			});

			if (result.success) {
				navigate({ to: "/vouchers" });
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
								<Label htmlFor={`${id}-personId`}>Person ID / Reference</Label>
								<Input
									id={`${id}-personId`}
									placeholder="Enter person ID or reference number"
									value={personId}
									onChange={(e) => setPersonId(e.target.value)}
									required
								/>
								<p className="text-xs text-muted-foreground">
									Enter the unique identifier for the beneficiary (e.g., citizen
									ID, senior citizen number, etc.)
								</p>
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
									onClick={() => navigate({ to: "/vouchers" })}
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
			</div>
		</div>
	);
}
