import { createFileRoute } from "@tanstack/react-router";
import QRCode from "qrcode";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { IdCardBack, IdCardFront } from "@/lib/id-card-components";
import {
	defaultConfig,
	type IdCardConfig,
	mockPerson,
} from "@/lib/id-card-config";

export const Route = createFileRoute("/dev/id-card-editor")({
	component: IdCardEditor,
});

// Asset paths for client-side preview
const BACKGROUND_PATH = "/id-card/id-background.jpeg";
const SEAL_PATH = "/id-card/loreto-seal.png";
const LOGO_PATH = "/id-card/shine-loreto-logo.png";

// Deep clone helper
function deepClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

// Slider component
function ConfigSlider({
	label,
	value,
	onChange,
	min,
	max,
	step = 1,
}: {
	label: string;
	value: number;
	onChange: (v: number) => void;
	min: number;
	max: number;
	step?: number;
}) {
	const id = `slider-${label.replace(/\s+/g, "-").toLowerCase()}`;
	return (
		<div className="flex items-center gap-2">
			<label htmlFor={id} className="text-sm text-gray-600 w-32 shrink-0">
				{label}
			</label>
			<input
				id={id}
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="flex-1"
			/>
			<input
				type="number"
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-16 px-2 py-1 text-sm border rounded"
				aria-label={`${label} value`}
			/>
		</div>
	);
}

// Collapsible section
function Section({
	title,
	children,
	defaultOpen = false,
}: {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
}) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<div className="border-b">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full px-3 py-2 text-left text-sm font-medium bg-gray-50 hover:bg-gray-100 flex items-center gap-2"
			>
				<span className={`transition-transform ${isOpen ? "rotate-90" : ""}`}>
					&#9654;
				</span>
				{title}
			</button>
			{isOpen && <div className="p-3 space-y-2">{children}</div>}
		</div>
	);
}

function IdCardEditor() {
	const [config, setConfig] = useState<IdCardConfig>(deepClone(defaultConfig));
	const [activeTab, setActiveTab] = useState<"front" | "back">("front");
	const [qrDataUrl, setQrDataUrl] = useState<string>("");
	const [scale, setScale] = useState(0.5);
	const [overlayVisible, setOverlayVisible] = useState(false);
	const [overlayOpacity, setOverlayOpacity] = useState(50);
	const overlayToggleId = useId();

	// Generate QR code on mount
	useEffect(() => {
		QRCode.toDataURL(mockPerson.id, {
			width: 300,
			margin: 1,
			errorCorrectionLevel: "M",
		}).then(setQrDataUrl);
	}, []);

	// Helper to update nested config values
	const updateConfig = useCallback((path: string[], value: number | string) => {
		setConfig((prev) => {
			const newConfig = deepClone(prev);
			type ConfigObj = { [key: string]: unknown };
			let obj = newConfig as unknown as ConfigObj;
			for (let i = 0; i < path.length - 1; i++) {
				obj = obj[path[i]] as ConfigObj;
			}
			obj[path[path.length - 1]] = value;
			return newConfig;
		});
	}, []);

	// Copy config to clipboard
	const copyConfig = useCallback(() => {
		const formatted = JSON.stringify(config, null, 2);
		navigator.clipboard.writeText(formatted);
		alert("Config copied to clipboard!");
	}, [config]);

	// Reset to default
	const resetConfig = useCallback(() => {
		setConfig(deepClone(defaultConfig));
	}, []);

	// Memoize the preview component to avoid re-renders
	const preview = useMemo(() => {
		if (!qrDataUrl) return null;

		const style = {
			transform: `scale(${scale})`,
			transformOrigin: "top left",
		};

		if (activeTab === "front") {
			return (
				<div style={style}>
					<IdCardFront
						person={mockPerson}
						qrDataUrl={qrDataUrl}
						profilePhotoDataUrl={null}
						config={config}
						backgroundDataUrl={BACKGROUND_PATH}
						sealDataUrl={SEAL_PATH}
						logoDataUrl={LOGO_PATH}
					/>
				</div>
			);
		}
		return (
			<div style={style}>
				<IdCardBack
					person={mockPerson}
					config={config}
					backgroundDataUrl={BACKGROUND_PATH}
				/>
			</div>
		);
	}, [activeTab, config, qrDataUrl, scale]);

	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white">
				<h1 className="text-lg font-bold">ID Card Editor (Dev Tool)</h1>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={resetConfig}
						className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded"
					>
						Reset
					</button>
					<button
						type="button"
						onClick={copyConfig}
						className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 rounded"
					>
						Copy Config
					</button>
				</div>
			</div>

			<div className="flex-1 flex overflow-hidden">
				{/* Controls panel */}
				<div className="w-80 border-r overflow-y-auto bg-white">
					{/* Tab toggle */}
					<div className="flex border-b">
						<button
							type="button"
							onClick={() => setActiveTab("front")}
							className={`flex-1 py-2 text-sm font-medium ${activeTab === "front" ? "bg-blue-100 text-blue-700" : "bg-gray-50"}`}
						>
							Front
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("back")}
							className={`flex-1 py-2 text-sm font-medium ${activeTab === "back" ? "bg-blue-100 text-blue-700" : "bg-gray-50"}`}
						>
							Back
						</button>
					</div>

					{/* Zoom control */}
					<div className="p-3 border-b">
						<ConfigSlider
							label="Preview Zoom"
							value={scale * 100}
							onChange={(v) => setScale(v / 100)}
							min={25}
							max={100}
							step={5}
						/>
					</div>

					{/* Reference overlay control */}
					<div className="p-3 border-b space-y-2">
						<div className="flex items-center gap-2">
							<input
								id={overlayToggleId}
								type="checkbox"
								checked={overlayVisible}
								onChange={(e) => setOverlayVisible(e.target.checked)}
								className="w-4 h-4"
							/>
							<label
								htmlFor={overlayToggleId}
								className="text-sm text-gray-700"
							>
								Show Reference Overlay
							</label>
						</div>
						{overlayVisible && (
							<ConfigSlider
								label="Overlay Opacity"
								value={overlayOpacity}
								onChange={setOverlayOpacity}
								min={0}
								max={100}
								step={5}
							/>
						)}
					</div>

					{activeTab === "front" ? (
						<>
							{/* Front card controls */}
							<Section title="Header" defaultOpen>
								<ConfigSlider
									label="Height"
									value={config.front.header.height}
									onChange={(v) =>
										updateConfig(["front", "header", "height"], v)
									}
									min={100}
									max={180}
								/>
								<ConfigSlider
									label="Padding Top"
									value={config.front.header.paddingTop}
									onChange={(v) =>
										updateConfig(["front", "header", "paddingTop"], v)
									}
									min={0}
									max={100}
								/>
								<ConfigSlider
									label="Province Size"
									value={config.front.header.province.fontSize}
									onChange={(v) =>
										updateConfig(["front", "header", "province", "fontSize"], v)
									}
									min={12}
									max={32}
								/>
								<ConfigSlider
									label="Municipality Size"
									value={config.front.header.municipality.fontSize}
									onChange={(v) =>
										updateConfig(
											["front", "header", "municipality", "fontSize"],
											v,
										)
									}
									min={16}
									max={40}
								/>
								<ConfigSlider
									label="Municipality Gap"
									value={config.front.header.municipality.marginTop}
									onChange={(v) =>
										updateConfig(
											["front", "header", "municipality", "marginTop"],
											v,
										)
									}
									min={-40}
									max={20}
								/>
								<ConfigSlider
									label="LORECARD Size"
									value={config.front.header.lorecard.fontSize}
									onChange={(v) =>
										updateConfig(["front", "header", "lorecard", "fontSize"], v)
									}
									min={32}
									max={100}
								/>
								<ConfigSlider
									label="LORECARD Gap"
									value={config.front.header.lorecard.marginTop}
									onChange={(v) =>
										updateConfig(
											["front", "header", "lorecard", "marginTop"],
											v,
										)
									}
									min={-40}
									max={20}
								/>
								<ConfigSlider
									label="LORECARD Spacing"
									value={config.front.header.lorecard.letterSpacing}
									onChange={(v) =>
										updateConfig(
											["front", "header", "lorecard", "letterSpacing"],
											v,
										)
									}
									min={0}
									max={20}
								/>
								<ConfigSlider
									label="Subtitle Size"
									value={config.front.header.subtitle.fontSize}
									onChange={(v) =>
										updateConfig(["front", "header", "subtitle", "fontSize"], v)
									}
									min={10}
									max={24}
								/>
								<ConfigSlider
									label="Subtitle Gap"
									value={config.front.header.subtitle.marginTop}
									onChange={(v) =>
										updateConfig(
											["front", "header", "subtitle", "marginTop"],
											v,
										)
									}
									min={-40}
									max={20}
								/>
								<ConfigSlider
									label="Subtitle Spacing"
									value={config.front.header.subtitle.letterSpacing}
									onChange={(v) =>
										updateConfig(
											["front", "header", "subtitle", "letterSpacing"],
											v,
										)
									}
									min={0}
									max={20}
								/>
							</Section>

							<Section title="Seal (Logo Left)">
								<ConfigSlider
									label="X"
									value={config.front.seal.x}
									onChange={(v) => updateConfig(["front", "seal", "x"], v)}
									min={0}
									max={100}
								/>
								<ConfigSlider
									label="Y"
									value={config.front.seal.y}
									onChange={(v) => updateConfig(["front", "seal", "y"], v)}
									min={0}
									max={100}
								/>
								<ConfigSlider
									label="Size"
									value={config.front.seal.size}
									onChange={(v) => updateConfig(["front", "seal", "size"], v)}
									min={50}
									max={150}
								/>
							</Section>

							<Section title="Logo (Right)">
								<ConfigSlider
									label="Right Offset"
									value={config.front.logo.rightOffset}
									onChange={(v) =>
										updateConfig(["front", "logo", "rightOffset"], v)
									}
									min={0}
									max={100}
								/>
								<ConfigSlider
									label="Y"
									value={config.front.logo.y}
									onChange={(v) => updateConfig(["front", "logo", "y"], v)}
									min={0}
									max={100}
								/>
								<ConfigSlider
									label="Height"
									value={config.front.logo.height}
									onChange={(v) => updateConfig(["front", "logo", "height"], v)}
									min={40}
									max={120}
								/>
							</Section>

							<Section title="Resident Bar">
								<ConfigSlider
									label="Y"
									value={config.front.residentBar.y}
									onChange={(v) =>
										updateConfig(["front", "residentBar", "y"], v)
									}
									min={100}
									max={350}
								/>
								<ConfigSlider
									label="Height"
									value={config.front.residentBar.height}
									onChange={(v) =>
										updateConfig(["front", "residentBar", "height"], v)
									}
									min={20}
									max={50}
								/>
								<ConfigSlider
									label="Padding Left"
									value={config.front.residentBar.paddingLeft}
									onChange={(v) =>
										updateConfig(["front", "residentBar", "paddingLeft"], v)
									}
									min={10}
									max={100}
								/>
								<ConfigSlider
									label="Font Size"
									value={config.front.residentBar.fontSize}
									onChange={(v) =>
										updateConfig(["front", "residentBar", "fontSize"], v)
									}
									min={10}
									max={24}
								/>
							</Section>

							<Section title="Photo">
								<ConfigSlider
									label="X"
									value={config.front.photo.x}
									onChange={(v) => updateConfig(["front", "photo", "x"], v)}
									min={0}
									max={300}
								/>
								<ConfigSlider
									label="Y"
									value={config.front.photo.y}
									onChange={(v) => updateConfig(["front", "photo", "y"], v)}
									min={100}
									max={400}
								/>
								<ConfigSlider
									label="Width"
									value={config.front.photo.width}
									onChange={(v) => updateConfig(["front", "photo", "width"], v)}
									min={100}
									max={350}
								/>
								<ConfigSlider
									label="Height"
									value={config.front.photo.height}
									onChange={(v) =>
										updateConfig(["front", "photo", "height"], v)
									}
									min={120}
									max={240}
								/>
								<ConfigSlider
									label="Border Radius"
									value={config.front.photo.borderRadius}
									onChange={(v) =>
										updateConfig(["front", "photo", "borderRadius"], v)
									}
									min={0}
									max={20}
								/>
							</Section>

							<Section title="Details Section">
								<ConfigSlider
									label="X Position"
									value={config.front.details.x}
									onChange={(v) => updateConfig(["front", "details", "x"], v)}
									min={150}
									max={300}
								/>
								<ConfigSlider
									label="Y Position"
									value={config.front.details.y}
									onChange={(v) => updateConfig(["front", "details", "y"], v)}
									min={200}
									max={350}
								/>
								<ConfigSlider
									label="Name Label Size"
									value={config.front.details.nameLabel.fontSize}
									onChange={(v) =>
										updateConfig(
											["front", "details", "nameLabel", "fontSize"],
											v,
										)
									}
									min={10}
									max={20}
								/>
								<ConfigSlider
									label="Name Value Size"
									value={config.front.details.nameValue.fontSize}
									onChange={(v) =>
										updateConfig(
											["front", "details", "nameValue", "fontSize"],
											v,
										)
									}
									min={20}
									max={48}
								/>
								<ConfigSlider
									label="Field Label Size"
									value={config.front.details.fieldLabel.fontSize}
									onChange={(v) =>
										updateConfig(
											["front", "details", "fieldLabel", "fontSize"],
											v,
										)
									}
									min={10}
									max={20}
								/>
								<ConfigSlider
									label="Field Value Size"
									value={config.front.details.fieldValue.fontSize}
									onChange={(v) =>
										updateConfig(
											["front", "details", "fieldValue", "fontSize"],
											v,
										)
									}
									min={14}
									max={32}
								/>
								<ConfigSlider
									label="Name Value Gap"
									value={config.front.details.nameValue.marginTop}
									onChange={(v) =>
										updateConfig(
											["front", "details", "nameValue", "marginTop"],
											v,
										)
									}
									min={-20}
									max={20}
								/>
								<ConfigSlider
									label="Field Value Gap"
									value={config.front.details.fieldValue.marginTop}
									onChange={(v) =>
										updateConfig(
											["front", "details", "fieldValue", "marginTop"],
											v,
										)
									}
									min={-20}
									max={20}
								/>
								<ConfigSlider
									label="Name to Fields Gap"
									value={config.front.details.nameGap}
									onChange={(v) =>
										updateConfig(["front", "details", "nameGap"], v)
									}
									min={-20}
									max={40}
								/>
								<ConfigSlider
									label="Row Gap"
									value={config.front.details.rowGap}
									onChange={(v) =>
										updateConfig(["front", "details", "rowGap"], v)
									}
									min={-30}
									max={40}
								/>
								<ConfigSlider
									label="Column Gap"
									value={config.front.details.columnGap}
									onChange={(v) =>
										updateConfig(["front", "details", "columnGap"], v)
									}
									min={0}
									max={150}
								/>
								<ConfigSlider
									label="First Column Width"
									value={config.front.details.firstColumnWidth}
									onChange={(v) =>
										updateConfig(["front", "details", "firstColumnWidth"], v)
									}
									min={80}
									max={200}
								/>
							</Section>

							<Section title="QR Code">
								<ConfigSlider
									label="Size"
									value={config.front.qrCode.size}
									onChange={(v) => updateConfig(["front", "qrCode", "size"], v)}
									min={80}
									max={250}
								/>
								<ConfigSlider
									label="Right Offset"
									value={config.front.qrCode.rightOffset}
									onChange={(v) =>
										updateConfig(["front", "qrCode", "rightOffset"], v)
									}
									min={10}
									max={150}
								/>
								<ConfigSlider
									label="Y Position"
									value={config.front.qrCode.y}
									onChange={(v) => updateConfig(["front", "qrCode", "y"], v)}
									min={200}
									max={450}
								/>
							</Section>

							<Section title="Address Bar">
								<ConfigSlider
									label="Height"
									value={config.front.addressBar.height}
									onChange={(v) =>
										updateConfig(["front", "addressBar", "height"], v)
									}
									min={50}
									max={150}
								/>
								<ConfigSlider
									label="Padding Left"
									value={config.front.addressBar.paddingLeft}
									onChange={(v) =>
										updateConfig(["front", "addressBar", "paddingLeft"], v)
									}
									min={10}
									max={350}
								/>
								<ConfigSlider
									label="Label Size"
									value={config.front.addressBar.labelSize}
									onChange={(v) =>
										updateConfig(["front", "addressBar", "labelSize"], v)
									}
									min={10}
									max={20}
								/>
								<ConfigSlider
									label="Value Size"
									value={config.front.addressBar.valueSize}
									onChange={(v) =>
										updateConfig(["front", "addressBar", "valueSize"], v)
									}
									min={14}
									max={28}
								/>
								<ConfigSlider
									label="Value Gap"
									value={config.front.addressBar.valueGap}
									onChange={(v) =>
										updateConfig(["front", "addressBar", "valueGap"], v)
									}
									min={-10}
									max={20}
								/>
							</Section>
						</>
					) : (
						<>
							{/* Back card controls */}
							<Section title="Left Column" defaultOpen>
								<ConfigSlider
									label="X"
									value={config.back.leftColumn.x}
									onChange={(v) => updateConfig(["back", "leftColumn", "x"], v)}
									min={10}
									max={100}
								/>
								<ConfigSlider
									label="Y"
									value={config.back.leftColumn.y}
									onChange={(v) => updateConfig(["back", "leftColumn", "y"], v)}
									min={10}
									max={80}
								/>
								<ConfigSlider
									label="Column Width"
									value={config.back.leftColumn.width}
									onChange={(v) =>
										updateConfig(["back", "leftColumn", "width"], v)
									}
									min={200}
									max={900}
								/>
								<ConfigSlider
									label="Label Size"
									value={config.back.leftColumn.labelSize}
									onChange={(v) =>
										updateConfig(["back", "leftColumn", "labelSize"], v)
									}
									min={10}
									max={20}
								/>
								<ConfigSlider
									label="Field Gap"
									value={config.back.leftColumn.fieldGap}
									onChange={(v) =>
										updateConfig(["back", "leftColumn", "fieldGap"], v)
									}
									min={8}
									max={32}
								/>
								<ConfigSlider
									label="Blood Type Size"
									value={config.back.leftColumn.bloodType.valueSize}
									onChange={(v) =>
										updateConfig(
											["back", "leftColumn", "bloodType", "valueSize"],
											v,
										)
									}
									min={20}
									max={48}
								/>
								<ConfigSlider
									label="Blood Type Gap"
									value={config.back.leftColumn.bloodType.marginTop}
									onChange={(v) =>
										updateConfig(
											["back", "leftColumn", "bloodType", "marginTop"],
											v,
										)
									}
									min={-10}
									max={20}
								/>
								<ConfigSlider
									label="Gender Size"
									value={config.back.leftColumn.gender.valueSize}
									onChange={(v) =>
										updateConfig(
											["back", "leftColumn", "gender", "valueSize"],
											v,
										)
									}
									min={16}
									max={36}
								/>
								<ConfigSlider
									label="Gender Gap"
									value={config.back.leftColumn.gender.marginTop}
									onChange={(v) =>
										updateConfig(
											["back", "leftColumn", "gender", "marginTop"],
											v,
										)
									}
									min={-10}
									max={20}
								/>
								<ConfigSlider
									label="Contact Size"
									value={config.back.leftColumn.contact.valueSize}
									onChange={(v) =>
										updateConfig(
											["back", "leftColumn", "contact", "valueSize"],
											v,
										)
									}
									min={16}
									max={36}
								/>
								<ConfigSlider
									label="Contact Gap"
									value={config.back.leftColumn.contact.marginTop}
									onChange={(v) =>
										updateConfig(
											["back", "leftColumn", "contact", "marginTop"],
											v,
										)
									}
									min={-10}
									max={20}
								/>
								<ConfigSlider
									label="POB Size"
									value={config.back.leftColumn.pob.valueSize}
									onChange={(v) =>
										updateConfig(["back", "leftColumn", "pob", "valueSize"], v)
									}
									min={14}
									max={28}
								/>
								<ConfigSlider
									label="POB Gap"
									value={config.back.leftColumn.pob.marginTop}
									onChange={(v) =>
										updateConfig(["back", "leftColumn", "pob", "marginTop"], v)
									}
									min={-10}
									max={20}
								/>
								<ConfigSlider
									label="POB Width"
									value={config.back.leftColumn.pob.maxWidth}
									onChange={(v) =>
										updateConfig(["back", "leftColumn", "pob", "maxWidth"], v)
									}
									min={200}
									max={1013}
								/>
								<ConfigSlider
									label="PhilHealth Size"
									value={config.back.leftColumn.philhealth.valueSize}
									onChange={(v) =>
										updateConfig(
											["back", "leftColumn", "philhealth", "valueSize"],
											v,
										)
									}
									min={16}
									max={32}
								/>
								<ConfigSlider
									label="PhilHealth Gap"
									value={config.back.leftColumn.philhealth.marginTop}
									onChange={(v) =>
										updateConfig(
											["back", "leftColumn", "philhealth", "marginTop"],
											v,
										)
									}
									min={-10}
									max={20}
								/>
							</Section>

							<Section title="Emergency Contact">
								<ConfigSlider
									label="X"
									value={config.back.emergency.x}
									onChange={(v) => updateConfig(["back", "emergency", "x"], v)}
									min={10}
									max={100}
								/>
								<ConfigSlider
									label="Bottom Offset"
									value={config.back.emergency.bottomOffset}
									onChange={(v) =>
										updateConfig(["back", "emergency", "bottomOffset"], v)
									}
									min={20}
									max={300}
								/>
								<ConfigSlider
									label="Label Size"
									value={config.back.emergency.labelSize}
									onChange={(v) =>
										updateConfig(["back", "emergency", "labelSize"], v)
									}
									min={10}
									max={20}
								/>
								<ConfigSlider
									label="Name Size"
									value={config.back.emergency.nameSize}
									onChange={(v) =>
										updateConfig(["back", "emergency", "nameSize"], v)
									}
									min={16}
									max={32}
								/>
								<ConfigSlider
									label="Phone Size"
									value={config.back.emergency.phoneSize}
									onChange={(v) =>
										updateConfig(["back", "emergency", "phoneSize"], v)
									}
									min={14}
									max={28}
								/>
								<ConfigSlider
									label="Name Gap"
									value={config.back.emergency.nameGap}
									onChange={(v) =>
										updateConfig(["back", "emergency", "nameGap"], v)
									}
									min={-10}
									max={20}
								/>
								<ConfigSlider
									label="Phone Gap"
									value={config.back.emergency.phoneGap}
									onChange={(v) =>
										updateConfig(["back", "emergency", "phoneGap"], v)
									}
									min={-10}
									max={20}
								/>
							</Section>

							<Section title="Issuing Authority">
								<ConfigSlider
									label="X"
									value={config.back.authority.x}
									onChange={(v) => updateConfig(["back", "authority", "x"], v)}
									min={300}
									max={600}
								/>
								<ConfigSlider
									label="Y"
									value={config.back.authority.y}
									onChange={(v) => updateConfig(["back", "authority", "y"], v)}
									min={10}
									max={80}
								/>
								<ConfigSlider
									label="Width"
									value={config.back.authority.width}
									onChange={(v) =>
										updateConfig(["back", "authority", "width"], v)
									}
									min={200}
									max={600}
								/>
								<ConfigSlider
									label="Label Size"
									value={config.back.authority.labelSize}
									onChange={(v) =>
										updateConfig(["back", "authority", "labelSize"], v)
									}
									min={10}
									max={20}
								/>
								<ConfigSlider
									label="Name Size"
									value={config.back.authority.nameSize}
									onChange={(v) =>
										updateConfig(["back", "authority", "nameSize"], v)
									}
									min={14}
									max={28}
								/>
								<ConfigSlider
									label="Title Size"
									value={config.back.authority.titleSize}
									onChange={(v) =>
										updateConfig(["back", "authority", "titleSize"], v)
									}
									min={12}
									max={24}
								/>
								<ConfigSlider
									label="Dept Size"
									value={config.back.authority.deptSize}
									onChange={(v) =>
										updateConfig(["back", "authority", "deptSize"], v)
									}
									min={12}
									max={24}
								/>
								<ConfigSlider
									label="Gap After Label"
									value={config.back.authority.gaps.afterLabel}
									onChange={(v) =>
										updateConfig(["back", "authority", "gaps", "afterLabel"], v)
									}
									min={-10}
									max={20}
								/>
								<ConfigSlider
									label="Gap After Name"
									value={config.back.authority.gaps.afterName}
									onChange={(v) =>
										updateConfig(["back", "authority", "gaps", "afterName"], v)
									}
									min={-10}
									max={20}
								/>
								<ConfigSlider
									label="Gap After Title"
									value={config.back.authority.gaps.afterTitle}
									onChange={(v) =>
										updateConfig(["back", "authority", "gaps", "afterTitle"], v)
									}
									min={-10}
									max={20}
								/>
							</Section>

							<Section title="Terms & Conditions">
								<ConfigSlider
									label="X"
									value={config.back.terms.x}
									onChange={(v) => updateConfig(["back", "terms", "x"], v)}
									min={300}
									max={600}
								/>
								<ConfigSlider
									label="Bottom Offset"
									value={config.back.terms.bottomOffset}
									onChange={(v) =>
										updateConfig(["back", "terms", "bottomOffset"], v)
									}
									min={20}
									max={100}
								/>
								<ConfigSlider
									label="Width"
									value={config.back.terms.width}
									onChange={(v) => updateConfig(["back", "terms", "width"], v)}
									min={300}
									max={550}
								/>
								<ConfigSlider
									label="Heading Size"
									value={config.back.terms.headingSize}
									onChange={(v) =>
										updateConfig(["back", "terms", "headingSize"], v)
									}
									min={12}
									max={24}
								/>
								<ConfigSlider
									label="Body Size"
									value={config.back.terms.bodySize}
									onChange={(v) =>
										updateConfig(["back", "terms", "bodySize"], v)
									}
									min={8}
									max={16}
								/>
								<ConfigSlider
									label="Line Height"
									value={config.back.terms.lineHeight * 10}
									onChange={(v) =>
										updateConfig(["back", "terms", "lineHeight"], v / 10)
									}
									min={10}
									max={25}
								/>
								<ConfigSlider
									label="Gap"
									value={config.back.terms.gap}
									onChange={(v) => updateConfig(["back", "terms", "gap"], v)}
									min={-10}
									max={20}
								/>
							</Section>
						</>
					)}
				</div>

				{/* Preview area */}
				<div className="flex-1 bg-gray-200 overflow-auto p-4">
					<div
						className="bg-white shadow-lg inline-block relative"
						style={{
							width: config.card.width * scale,
							height: config.card.height * scale,
						}}
					>
						{preview}
						{overlayVisible && (
							<img
								src={
									activeTab === "front"
										? "/id-card/reference-front.jpg"
										: "/id-card/reference-back.jpg"
								}
								alt="Reference overlay"
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: config.card.width * scale,
									height: config.card.height * scale,
									opacity: overlayOpacity / 100,
									pointerEvents: "none",
								}}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
