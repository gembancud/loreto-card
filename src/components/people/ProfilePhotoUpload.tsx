import { Camera, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

interface ProfilePhotoUploadProps {
	value: string | null;
	onChange: (dataUrl: string | null) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ProfilePhotoUpload({
	value,
	onChange,
}: ProfilePhotoUploadProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

		// Convert to data URL
		const reader = new FileReader();
		reader.onload = (event) => {
			const dataUrl = event.target?.result as string;
			onChange(dataUrl);
		};
		reader.readAsDataURL(file);

		// Reset file input
		e.target.value = "";
	};

	const handleRemove = (e: React.MouseEvent) => {
		e.stopPropagation();
		onChange(null);
	};

	return (
		<div className="relative">
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileChange}
				className="hidden"
			/>
			<button
				type="button"
				onClick={handleClick}
				className="h-20 w-20 rounded-full border-2 border-dashed border-muted-foreground/50 bg-muted flex items-center justify-center overflow-hidden hover:border-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
			>
				{value ? (
					<img
						src={value}
						alt="Profile preview"
						className="h-full w-full object-cover"
					/>
				) : (
					<Camera className="h-8 w-8 text-muted-foreground" />
				)}
			</button>
			{value && (
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
		</div>
	);
}
