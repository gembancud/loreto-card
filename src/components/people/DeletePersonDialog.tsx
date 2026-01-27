import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeletePersonDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	personFullName: string;
	onConfirm: () => Promise<void>;
}

export function DeletePersonDialog({
	open,
	onOpenChange,
	personFullName,
	onConfirm,
}: DeletePersonDialogProps) {
	const id = useId();
	const [confirmName, setConfirmName] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);
	const inputId = `${id}-confirm-name`;

	const isNameMatch = confirmName === personFullName;

	const handleConfirm = async () => {
		if (!isNameMatch) return;
		setIsDeleting(true);
		try {
			await onConfirm();
			onOpenChange(false);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			setConfirmName("");
		}
		onOpenChange(newOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Person</DialogTitle>
					<DialogDescription>
						This will archive the person and hide them from the system. Their
						data and voucher history will be preserved.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<p className="text-sm text-muted-foreground">
						To confirm, type{" "}
						<span className="font-semibold text-foreground">
							{personFullName}
						</span>{" "}
						below:
					</p>
					<div className="grid gap-2">
						<Label htmlFor={inputId} className="sr-only">
							Confirm name
						</Label>
						<Input
							id={inputId}
							value={confirmName}
							onChange={(e) => setConfirmName(e.target.value)}
							placeholder="Type the person's full name"
							autoComplete="off"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleConfirm}
						disabled={!isNameMatch || isDeleting}
					>
						{isDeleting ? "Deleting..." : "Delete Person"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
