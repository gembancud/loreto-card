import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { AlertCircle, Camera, Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
	extractPersonIdFromQr,
	getQrErrorMessage,
	type QrScanError,
} from "@/lib/qr-utils";

interface QrScannerProps {
	onScan: (personId: string) => void;
	onError?: (error: QrScanError) => void;
}

export function QrScanner({ onScan, onError }: QrScannerProps) {
	const scannerId = useId();
	const [isStarting, setIsStarting] = useState(true);
	const [error, setError] = useState<QrScanError | null>(null);
	const scannerRef = useRef<Html5Qrcode | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const hasScannedRef = useRef(false);

	const handleError = useCallback(
		(err: QrScanError) => {
			setError(err);
			onError?.(err);
		},
		[onError],
	);

	const handleScanSuccess = useCallback(
		(decodedText: string) => {
			// Prevent multiple scans
			if (hasScannedRef.current) return;

			const personId = extractPersonIdFromQr(decodedText);
			if (personId) {
				hasScannedRef.current = true;
				onScan(personId);
			} else {
				handleError("invalid_qr");
			}
		},
		[onScan, handleError],
	);

	useEffect(() => {
		let scanner: Html5Qrcode | null = null;

		const startScanner = async () => {
			try {
				scanner = new Html5Qrcode(scannerId);
				scannerRef.current = scanner;

				// Try to use the rear camera (environment-facing) first
				await scanner.start(
					{ facingMode: "environment" },
					{
						fps: 10,
						qrbox: { width: 250, height: 250 },
						aspectRatio: 1,
					},
					handleScanSuccess,
					() => {
						// QR decode failure - ignore, keep scanning
					},
				);
				setIsStarting(false);
			} catch (err) {
				console.error("QR Scanner error:", err);
				const errorMessage = String(err);

				if (
					errorMessage.includes("Permission") ||
					errorMessage.includes("NotAllowedError")
				) {
					handleError("permission_denied");
				} else if (
					errorMessage.includes("NotFoundError") ||
					errorMessage.includes("No camera")
				) {
					handleError("no_camera");
				} else {
					handleError("camera_error");
				}
				setIsStarting(false);
			}
		};

		startScanner();

		return () => {
			if (scanner && scanner.getState() === Html5QrcodeScannerState.SCANNING) {
				scanner.stop().catch(console.error);
			}
		};
	}, [scannerId, handleScanSuccess, handleError]);

	// Reset scanned state when error is cleared
	useEffect(() => {
		if (error === "invalid_qr") {
			const timer = setTimeout(() => {
				setError(null);
				hasScannedRef.current = false;
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [error]);

	if (error && error !== "invalid_qr") {
		return (
			<div className="flex flex-col items-center justify-center p-8 text-center">
				<AlertCircle className="h-12 w-12 text-destructive mb-4" />
				<p className="text-destructive font-medium mb-2">
					{getQrErrorMessage(error)}
				</p>
				<p className="text-sm text-muted-foreground">
					Please use the manual search instead.
				</p>
			</div>
		);
	}

	return (
		<div className="relative" ref={containerRef}>
			{isStarting && (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
					<p className="text-sm text-muted-foreground">Starting camera...</p>
				</div>
			)}
			<div
				id={scannerId}
				className="w-full aspect-square bg-black rounded-lg overflow-hidden"
			/>
			{error === "invalid_qr" && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
					<div className="text-center p-4">
						<AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
						<p className="text-white text-sm">{getQrErrorMessage(error)}</p>
					</div>
				</div>
			)}
			<div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
				<Camera className="h-4 w-4" />
				<span>Point camera at QR code on ID card</span>
			</div>
		</div>
	);
}
