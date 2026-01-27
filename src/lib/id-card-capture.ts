// Client-side ID card capture utility
// Uses html-to-image to capture the actual browser-rendered components

import { toPng } from "html-to-image";
import QRCode from "qrcode";
import type { Person } from "@/data/people";
import { defaultConfig, type IdCardConfig } from "./id-card-config";

// Asset paths for client-side
const BACKGROUND_PATH = "/id-card/id-background.jpeg";
const SEAL_PATH = "/id-card/loreto-seal.png";
const LOGO_PATH = "/id-card/shine-loreto-logo.png";

// Font paths
const INTER_REGULAR_PATH = "/fonts/Inter-Regular.ttf";
const INTER_BOLD_PATH = "/fonts/Inter-Bold.ttf";

// Cache for embedded font CSS
let fontEmbedCSSCache: string | null = null;

export interface CaptureAssets {
	backgroundDataUrl: string;
	sealDataUrl: string;
	logoDataUrl: string;
	qrDataUrl: string;
	profilePhotoDataUrl: string | null;
	fontEmbedCSS: string;
}

/**
 * Load a file as base64 data URL
 */
async function loadAsDataUrl(url: string): Promise<string> {
	const response = await fetch(url);
	const blob = await response.blob();
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

/**
 * Generate CSS with embedded Inter fonts for html-to-image
 * Caches the result to avoid re-fetching fonts
 */
async function getFontEmbedCSS(): Promise<string> {
	if (fontEmbedCSSCache) return fontEmbedCSSCache;

	const [interRegularDataUrl, interBoldDataUrl] = await Promise.all([
		loadAsDataUrl(INTER_REGULAR_PATH),
		loadAsDataUrl(INTER_BOLD_PATH),
	]);

	fontEmbedCSSCache = `
@font-face {
  font-family: 'Inter';
  src: url('${interRegularDataUrl}') format('truetype');
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: 'Inter';
  src: url('${interBoldDataUrl}') format('truetype');
  font-weight: 700;
  font-style: normal;
}
`;

	return fontEmbedCSSCache;
}

/**
 * Load profile photo, converting to data URL if needed
 * Returns null if profile photo doesn't exist or fails to load
 */
async function loadProfilePhoto(
	profilePhoto: string | null | undefined,
): Promise<string | null> {
	if (!profilePhoto) return null;

	try {
		// Already a data URL
		if (profilePhoto.startsWith("data:")) {
			return profilePhoto;
		}

		// HTTP URL - fetch and convert
		if (
			profilePhoto.startsWith("http://") ||
			profilePhoto.startsWith("https://")
		) {
			return await loadAsDataUrl(profilePhoto);
		}

		// Relative path - prefix with origin
		if (profilePhoto.startsWith("/")) {
			return await loadAsDataUrl(profilePhoto);
		}

		return null;
	} catch (error) {
		console.warn("Could not load profile photo:", error);
		return null;
	}
}

/**
 * Load all assets needed for ID card rendering
 */
export async function loadCaptureAssets(
	person: Person,
): Promise<CaptureAssets> {
	const [
		backgroundDataUrl,
		sealDataUrl,
		logoDataUrl,
		qrDataUrl,
		profilePhotoDataUrl,
		fontEmbedCSS,
	] = await Promise.all([
		loadAsDataUrl(BACKGROUND_PATH),
		loadAsDataUrl(SEAL_PATH),
		loadAsDataUrl(LOGO_PATH),
		QRCode.toDataURL(person.id, {
			width: 300,
			margin: 1,
			errorCorrectionLevel: "M",
		}),
		loadProfilePhoto(person.profilePhoto),
		getFontEmbedCSS(),
	]);

	return {
		backgroundDataUrl,
		sealDataUrl,
		logoDataUrl,
		qrDataUrl,
		profilePhotoDataUrl,
		fontEmbedCSS,
	};
}

/**
 * Wait for all images in an element to finish loading
 */
async function waitForImages(element: HTMLElement): Promise<void> {
	const images = element.querySelectorAll("img");
	const promises = Array.from(images).map((img) => {
		if (img.complete) return Promise.resolve();
		return new Promise<void>((resolve) => {
			img.onload = () => resolve();
			img.onerror = () => resolve(); // Don't fail on image errors
		});
	});
	await Promise.all(promises);
}

/**
 * Capture an element as PNG using html-to-image
 */
export async function captureElementAsPng(
	element: HTMLElement,
	fontEmbedCSS: string,
	config: IdCardConfig = defaultConfig,
): Promise<Blob> {
	// Wait for images to load
	await waitForImages(element);

	// Small delay to ensure fonts are rendered
	await new Promise((resolve) => setTimeout(resolve, 100));

	const dataUrl = await toPng(element, {
		width: config.card.width,
		height: config.card.height,
		pixelRatio: 2, // 2x resolution for 600 DPI print quality
		fontEmbedCSS, // Embed Inter fonts for correct rendering
		style: {
			transform: "none", // Remove any scaling from preview
		},
	});

	// Convert data URL to Blob
	const response = await fetch(dataUrl);
	return response.blob();
}
