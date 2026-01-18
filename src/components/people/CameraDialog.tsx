import { Camera, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface CameraDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCapture: (dataUrl: string) => void;
}

type CameraState = "initializing" | "ready" | "error";

export function CameraDialog({
	open,
	onOpenChange,
	onCapture,
}: CameraDialogProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [cameraState, setCameraState] = useState<CameraState>("initializing");
	const [errorMessage, setErrorMessage] = useState<string>("");

	const stopCamera = useCallback(() => {
		if (streamRef.current) {
			for (const track of streamRef.current.getTracks()) {
				track.stop();
			}
			streamRef.current = null;
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}
	}, []);

	const startCamera = useCallback(async () => {
		setCameraState("initializing");
		setErrorMessage("");

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: "user",
					width: { ideal: 640 },
					height: { ideal: 480 },
				},
				audio: false,
			});

			streamRef.current = stream;

			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play();
				setCameraState("ready");
			}
		} catch (error) {
			console.error("Camera access error:", error);
			setCameraState("error");

			if (error instanceof DOMException) {
				if (
					error.name === "NotAllowedError" ||
					error.name === "PermissionDeniedError"
				) {
					setErrorMessage(
						"Camera access denied. Please allow camera access in your browser settings.",
					);
				} else if (
					error.name === "NotFoundError" ||
					error.name === "DevicesNotFoundError"
				) {
					setErrorMessage(
						"No camera found. Please connect a camera and try again.",
					);
				} else if (
					error.name === "NotReadableError" ||
					error.name === "TrackStartError"
				) {
					setErrorMessage(
						"Camera is in use by another application. Please close other apps using the camera.",
					);
				} else {
					setErrorMessage(`Camera error: ${error.message}`);
				}
			} else {
				setErrorMessage("Failed to access camera. Please try again.");
			}
		}
	}, []);

	useEffect(() => {
		if (open) {
			startCamera();
		} else {
			stopCamera();
			setCameraState("initializing");
		}

		return () => {
			stopCamera();
		};
	}, [open, startCamera, stopCamera]);

	const handleCapture = () => {
		const video = videoRef.current;
		const canvas = canvasRef.current;

		if (!video || !canvas || cameraState !== "ready") return;

		// Set canvas size to match video
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		// Draw video frame to canvas
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.drawImage(video, 0, 0);

		// Convert to data URL (JPEG for smaller size)
		const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

		// Stop camera and close dialog
		stopCamera();
		onCapture(dataUrl);
		onOpenChange(false);
	};

	const handleClose = () => {
		stopCamera();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Camera className="h-5 w-5" />
						Take Photo
					</DialogTitle>
				</DialogHeader>

				<div className="relative">
					{/* Hidden canvas for capturing */}
					<canvas ref={canvasRef} className="hidden" />

					{/* Video preview container */}
					<div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
						{cameraState === "initializing" && (
							<div className="absolute inset-0 flex items-center justify-center">
								<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							</div>
						)}

						{cameraState === "error" && (
							<div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
								<X className="h-8 w-8 text-destructive mb-2" />
								<p className="text-sm text-muted-foreground">{errorMessage}</p>
								<Button
									variant="outline"
									size="sm"
									onClick={startCamera}
									className="mt-3"
								>
									Try Again
								</Button>
							</div>
						)}

						<video
							ref={videoRef}
							autoPlay
							playsInline
							muted
							className={`h-full w-full object-cover ${cameraState !== "ready" ? "invisible" : ""}`}
						/>
					</div>

					{/* Action buttons */}
					<div className="flex gap-2 mt-4">
						<Button variant="outline" onClick={handleClose} className="flex-1">
							Cancel
						</Button>
						<Button
							onClick={handleCapture}
							disabled={cameraState !== "ready"}
							className="flex-1"
						>
							<Camera className="h-4 w-4 mr-2" />
							Capture
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
