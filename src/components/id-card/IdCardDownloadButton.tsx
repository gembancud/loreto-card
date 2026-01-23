import JSZip from "jszip";
import { Download, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import type { Person } from "@/data/people";
import { captureElementAsPng, loadCaptureAssets } from "@/lib/id-card-capture";
import { IdCardBack, IdCardFront } from "@/lib/id-card-components";
import { defaultConfig } from "@/lib/id-card-config";

interface IdCardDownloadButtonProps {
	person: Person;
}

export function IdCardDownloadButton({ person }: IdCardDownloadButtonProps) {
	const [isGenerating, setIsGenerating] = useState(false);
	const frontRef = useRef<HTMLDivElement>(null);
	const backRef = useRef<HTMLDivElement>(null);
	const [renderData, setRenderData] = useState<{
		backgroundDataUrl: string;
		sealDataUrl: string;
		logoDataUrl: string;
		qrDataUrl: string;
		profilePhotoDataUrl: string | null;
		fontEmbedCSS: string;
	} | null>(null);

	const handleDownload = useCallback(async () => {
		setIsGenerating(true);
		try {
			// Load all assets as data URLs
			const assets = await loadCaptureAssets(person);

			// Trigger render by setting the data
			setRenderData(assets);

			// Wait for React to render the components
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Wait for refs to be available
			const waitForRefs = async (
				attempts = 0,
			): Promise<{ front: HTMLDivElement; back: HTMLDivElement }> => {
				if (frontRef.current && backRef.current) {
					return { front: frontRef.current, back: backRef.current };
				}
				if (attempts > 20) throw new Error("Render timeout");
				await new Promise((resolve) => setTimeout(resolve, 50));
				return waitForRefs(attempts + 1);
			};
			const { front, back } = await waitForRefs();

			// Capture both sides
			const [frontBlob, backBlob] = await Promise.all([
				captureElementAsPng(front, assets.fontEmbedCSS, defaultConfig),
				captureElementAsPng(back, assets.fontEmbedCSS, defaultConfig),
			]);

			// Create ZIP file
			const zip = new JSZip();
			zip.file("id-front.png", frontBlob);
			zip.file("id-back.png", backBlob);

			const zipBlob = await zip.generateAsync({ type: "blob" });

			// Create safe filename
			const safeName = `${person.firstName}-${person.lastName}`
				.replace(/[^a-zA-Z0-9-]/g, "")
				.toLowerCase();

			// Trigger download
			const url = URL.createObjectURL(zipBlob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `id-card-${safeName}.zip`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Failed to generate ID card:", error);
		} finally {
			setRenderData(null);
			setIsGenerating(false);
		}
	}, [person]);

	return (
		<>
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

			{/* Hidden container for rendering - uses portal to avoid layout issues */}
			{renderData &&
				createPortal(
					<div
						style={{
							position: "fixed",
							left: "-9999px",
							top: 0,
							zIndex: -1,
							pointerEvents: "none",
						}}
						aria-hidden="true"
					>
						{/* Front card */}
						<div ref={frontRef}>
							<IdCardFront
								person={person}
								qrDataUrl={renderData.qrDataUrl}
								profilePhotoDataUrl={renderData.profilePhotoDataUrl}
								config={defaultConfig}
								backgroundDataUrl={renderData.backgroundDataUrl}
								sealDataUrl={renderData.sealDataUrl}
								logoDataUrl={renderData.logoDataUrl}
							/>
						</div>

						{/* Back card */}
						<div ref={backRef}>
							<IdCardBack
								person={person}
								config={defaultConfig}
								backgroundDataUrl={renderData.backgroundDataUrl}
							/>
						</div>
					</div>,
					document.body,
				)}
		</>
	);
}
