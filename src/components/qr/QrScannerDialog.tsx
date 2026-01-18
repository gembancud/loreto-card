import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { QrScanError } from "@/lib/qr-utils";
import { QrScanner } from "./QrScanner";

interface QrScannerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onScan: (personId: string) => void;
	onError?: (error: QrScanError) => void;
}

export function QrScannerDialog({
	open,
	onOpenChange,
	onScan,
	onError,
}: QrScannerDialogProps) {
	const handleScan = (personId: string) => {
		onScan(personId);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Scan QR Code</DialogTitle>
					<DialogDescription>
						Scan the QR code on the beneficiary's ID card
					</DialogDescription>
				</DialogHeader>
				{open && <QrScanner onScan={handleScan} onError={onError} />}
			</DialogContent>
		</Dialog>
	);
}
