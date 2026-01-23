import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Person } from "@/data/people";
import { downloadIdCardZip } from "@/lib/id-card-generate";

interface IdCardDownloadButtonProps {
	person: Person;
}

export function IdCardDownloadButton({ person }: IdCardDownloadButtonProps) {
	const [isGenerating, setIsGenerating] = useState(false);

	const handleDownload = async () => {
		setIsGenerating(true);
		try {
			await downloadIdCardZip(person);
		} catch (error) {
			console.error("Failed to generate ID card:", error);
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
			{isGenerating ? "Generating..." : "Download ID Card"}
		</Button>
	);
}
