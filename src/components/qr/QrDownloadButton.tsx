import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generatePersonQrDataUrl } from "@/lib/qr-generate";

interface QrDownloadButtonProps {
	personId: string;
	personName: string;
}

export function QrDownloadButton({
	personId,
	personName,
}: QrDownloadButtonProps) {
	const [isGenerating, setIsGenerating] = useState(false);

	const handleDownload = async () => {
		setIsGenerating(true);
		try {
			const dataUrl = await generatePersonQrDataUrl(personId);

			// Create download link
			const link = document.createElement("a");
			link.href = dataUrl;
			// Sanitize name for filename
			const safeName = personName.replace(/[^a-zA-Z0-9\s-]/g, "").trim();
			link.download = `qr-${safeName}.png`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			console.error("Failed to generate QR code:", error);
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<Button
			type="button"
			variant="outline"
			onClick={handleDownload}
			disabled={isGenerating}
			className="gap-2"
		>
			{isGenerating ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : (
				<Download className="h-4 w-4" />
			)}
			{isGenerating ? "Generating..." : "Download QR"}
		</Button>
	);
}
