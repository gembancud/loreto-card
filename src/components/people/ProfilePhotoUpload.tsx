import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { deleteProfilePhoto, uploadProfilePhoto } from "@/data/storage";
import { CameraDialog } from "./CameraDialog";

interface ProfilePhotoUploadProps {
	value: string | null;
	onChange: (url: string | null) => void;
	/** When provided, uploads directly to S3. Otherwise uses base64 data URL. */
	personId?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ProfilePhotoUpload({
	value,
	onChange,
	personId,
}: ProfilePhotoUploadProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const cameraInputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);

	const handleUploadClick = () => {
		setIsPopoverOpen(false);
		fileInputRef.current?.click();
	};

	const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

	const handleCameraClick = () => {
		setIsPopoverOpen(false);
		if (isMobile) {
			// On mobile, use native camera input
			cameraInputRef.current?.click();
		} else {
			// On desktop, open webcam dialog
			setIsCameraDialogOpen(true);
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			alert("Please select an image file.");
			return;
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			alert("File size must be less than 5MB.");
			return;
		}

		// Convert to data URL first (for base64 fallback or preview)
		const reader = new FileReader();
		reader.onload = async (event) => {
			const dataUrl = event.target?.result as string;

			// If we have a personId, upload to S3
			if (personId) {
				setIsUploading(true);
				try {
					// Delete old photo if it exists and is an S3 URL (not base64)
					if (value && !value.startsWith("data:")) {
						await deleteProfilePhoto({ data: { photoUrl: value } });
					}

					// Upload new photo
					const result = await uploadProfilePhoto({
						data: {
							personId,
							base64Data: dataUrl,
							contentType: file.type,
						},
					});

					if (result.success && result.url) {
						onChange(result.url);
					} else {
						alert(result.error || "Failed to upload photo");
					}
				} catch (error) {
					console.error("Upload error:", error);
					alert("Failed to upload photo");
				} finally {
					setIsUploading(false);
				}
			} else {
				// No personId - use base64 data URL (for new person forms)
				onChange(dataUrl);
			}
		};
		reader.readAsDataURL(file);

		// Reset file input
		e.target.value = "";
	};

	const handleRemove = async (e: React.MouseEvent) => {
		e.stopPropagation();

		// If the current value is an S3 URL (not base64), delete it
		if (value && !value.startsWith("data:") && personId) {
			setIsUploading(true);
			try {
				await deleteProfilePhoto({ data: { photoUrl: value } });
			} catch (error) {
				console.error("Delete error:", error);
				// Continue anyway - the file might already be gone
			} finally {
				setIsUploading(false);
			}
		}

		onChange(null);
	};

	const handleCameraCapture = async (dataUrl: string) => {
		// If we have a personId, upload to S3
		if (personId) {
			setIsUploading(true);
			try {
				// Delete old photo if it exists and is an S3 URL (not base64)
				if (value && !value.startsWith("data:")) {
					await deleteProfilePhoto({ data: { photoUrl: value } });
				}

				// Upload new photo
				const result = await uploadProfilePhoto({
					data: {
						personId,
						base64Data: dataUrl,
						contentType: "image/jpeg",
					},
				});

				if (result.success && result.url) {
					onChange(result.url);
				} else {
					alert(result.error || "Failed to upload photo");
				}
			} catch (error) {
				console.error("Upload error:", error);
				alert("Failed to upload photo");
			} finally {
				setIsUploading(false);
			}
		} else {
			// No personId - use base64 data URL (for new person forms)
			onChange(dataUrl);
		}
	};

	return (
		<div className="relative">
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileChange}
				className="hidden"
				disabled={isUploading}
			/>
			<input
				ref={cameraInputRef}
				type="file"
				accept="image/*"
				capture="environment"
				onChange={handleFileChange}
				className="hidden"
				disabled={isUploading}
			/>
			<Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
				<PopoverTrigger asChild>
					<button
						type="button"
						disabled={isUploading}
						className="h-20 w-20 rounded-full border-2 border-dashed border-muted-foreground/50 bg-muted flex items-center justify-center overflow-hidden hover:border-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isUploading ? (
							<Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
						) : value ? (
							<img
								src={value}
								alt="Profile preview"
								className="h-full w-full object-cover"
							/>
						) : (
							<Camera className="h-8 w-8 text-muted-foreground" />
						)}
					</button>
				</PopoverTrigger>
				<PopoverContent className="w-48 p-2">
					<div className="grid gap-1">
						<button
							type="button"
							onClick={handleUploadClick}
							className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
						>
							<ImagePlus className="h-4 w-4" />
							Upload photo
						</button>
						<button
							type="button"
							onClick={handleCameraClick}
							className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
						>
							<Camera className="h-4 w-4" />
							Take photo
						</button>
					</div>
				</PopoverContent>
			</Popover>
			{value && !isUploading && (
				<Button
					type="button"
					variant="destructive"
					size="icon"
					className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
					onClick={handleRemove}
				>
					<X className="h-3 w-3" />
				</Button>
			)}
			<CameraDialog
				open={isCameraDialogOpen}
				onOpenChange={setIsCameraDialogOpen}
				onCapture={handleCameraCapture}
			/>
		</div>
	);
}
