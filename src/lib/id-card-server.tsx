import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import QRCode from "qrcode";
import type { ReactNode } from "react";
import satori from "satori";
import type { Person } from "@/data/people";
import { IdCardBack, IdCardFront } from "./id-card-components";
import { defaultConfig, type IdCardConfig } from "./id-card-config";

// Asset paths (relative to project root)
function getAssetPath(filename: string): string {
	return path.join(process.cwd(), "public", "id-card", filename);
}

function getFontPath(filename: string): string {
	return path.join(process.cwd(), "public", "fonts", filename);
}

// Load fonts at module init
const interRegular = fs.readFileSync(getFontPath("Inter-Regular.ttf"));
const interBold = fs.readFileSync(getFontPath("Inter-Bold.ttf"));

const fonts = [
	{ name: "Inter", data: interRegular, weight: 400 as const },
	{ name: "Inter", data: interBold, weight: 700 as const },
];

// Load images and convert to base64 data URLs
function loadImageAsDataUrl(filePath: string): string {
	const buffer = fs.readFileSync(filePath);
	const ext = path.extname(filePath).toLowerCase();
	const mimeType =
		ext === ".png"
			? "image/png"
			: ext === ".jpeg" || ext === ".jpg"
				? "image/jpeg"
				: "image/png";
	return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

// Pre-load static assets
const backgroundDataUrl = loadImageAsDataUrl(
	getAssetPath("id-background.jpeg"),
);
const sealDataUrl = loadImageAsDataUrl(getAssetPath("loreto-seal.png"));
const logoDataUrl = loadImageAsDataUrl(getAssetPath("shine-loreto-logo.png"));

async function renderToBuffer(
	element: ReactNode,
	config: IdCardConfig,
): Promise<Buffer> {
	const svg = await satori(element, {
		width: config.card.width,
		height: config.card.height,
		fonts,
	});

	const resvg = new Resvg(svg, {
		fitTo: {
			mode: "width",
			value: config.card.width,
		},
	});
	const pngData = resvg.render();
	return Buffer.from(pngData.asPng());
}

export async function generateIdCardFrontServer(
	person: Person,
	config: IdCardConfig = defaultConfig,
): Promise<Buffer> {
	const qrDataUrl = await QRCode.toDataURL(person.id, {
		width: 300,
		margin: 1,
		errorCorrectionLevel: "M",
	});

	let profilePhotoDataUrl: string | null = null;
	if (person.profilePhoto) {
		try {
			// Handle both URLs and file paths
			if (
				person.profilePhoto.startsWith("http://") ||
				person.profilePhoto.startsWith("https://")
			) {
				// For URLs, fetch and convert to data URL
				const response = await fetch(person.profilePhoto);
				const buffer = await response.arrayBuffer();
				const base64 = Buffer.from(buffer).toString("base64");
				const contentType =
					response.headers.get("content-type") || "image/jpeg";
				profilePhotoDataUrl = `data:${contentType};base64,${base64}`;
			} else if (person.profilePhoto.startsWith("data:")) {
				// Already a data URL
				profilePhotoDataUrl = person.profilePhoto;
			} else {
				// File path
				profilePhotoDataUrl = loadImageAsDataUrl(person.profilePhoto);
			}
		} catch {
			console.warn("Could not load profile photo");
		}
	}

	return renderToBuffer(
		<IdCardFront
			person={person}
			qrDataUrl={qrDataUrl}
			profilePhotoDataUrl={profilePhotoDataUrl}
			config={config}
			backgroundDataUrl={backgroundDataUrl}
			sealDataUrl={sealDataUrl}
			logoDataUrl={logoDataUrl}
		/>,
		config,
	);
}

export async function generateIdCardBackServer(
	person: Person,
	config: IdCardConfig = defaultConfig,
): Promise<Buffer> {
	return renderToBuffer(
		<IdCardBack
			person={person}
			config={config}
			backgroundDataUrl={backgroundDataUrl}
		/>,
		config,
	);
}

// Re-export for consumers
export { defaultConfig, type IdCardConfig, mockPerson } from "./id-card-config";
