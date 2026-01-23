import JSZip from "jszip";
import QRCode from "qrcode";
import type { Person } from "@/data/people";

// Card dimensions - CR80 standard at 300 DPI
const CARD_WIDTH = 1013;
const CARD_HEIGHT = 638;

// Colors
const BLUE_BAR_COLOR = "#1e3a8a";
const TEXT_DARK = "#1a1a1a";
const TEXT_LIGHT = "#4a4a4a";
const TEXT_WHITE = "#ffffff";

// Asset paths
const BACKGROUND_PATH = "/id-card/id-background.jpeg";
const SEAL_PATH = "/id-card/loreto-seal.png";
const LOGO_PATH = "/id-card/shine-loreto-logo.png";

interface IdCardData {
	person: Person;
	qrDataUrl: string;
	backgroundImg: HTMLImageElement;
	sealImg: HTMLImageElement;
	logoImg: HTMLImageElement;
	profileImg: HTMLImageElement | null;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-PH", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
	});
}

function formatDateMMYY(dateStr: string): string {
	const date = new Date(dateStr);
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = String(date.getFullYear()).slice(-2);
	return `${month}/${year}`;
}

function getFullName(person: Person): string {
	const parts = [person.lastName];
	parts.push(",");
	parts.push(person.firstName);
	if (person.middleName) {
		parts.push(person.middleName);
	}
	if (person.suffix) {
		parts.push(person.suffix);
	}
	return parts.join(" ").replace(" ,", ",");
}

function getFullAddress(person: Person): string {
	const parts: string[] = [];
	if (person.address.purok) {
		parts.push(`PUROK ${person.address.purok}`);
	}
	parts.push(person.address.barangay.toUpperCase());
	parts.push("LORETO");
	parts.push("AGUSAN DEL SUR");
	return parts.join(", ");
}

function drawTextWithShadow(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	shadowColor = "rgba(255,255,255,0.5)",
	shadowBlur = 2,
) {
	ctx.save();
	ctx.shadowColor = shadowColor;
	ctx.shadowBlur = shadowBlur;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;
	ctx.fillText(text, x, y);
	ctx.restore();
}

async function generateIdCardFrontCanvas(data: IdCardData): Promise<Blob> {
	const canvas = document.createElement("canvas");
	canvas.width = CARD_WIDTH;
	canvas.height = CARD_HEIGHT;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Could not get canvas context");

	const { person, qrDataUrl, backgroundImg, sealImg, logoImg, profileImg } =
		data;

	// Draw background
	ctx.drawImage(backgroundImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);

	// Draw seal (top-left)
	const sealSize = 95;
	const sealX = 25;
	const sealY = 15;
	ctx.drawImage(sealImg, sealX, sealY, sealSize, sealSize);

	// Draw SHINE logo (top-right)
	const logoHeight = 75;
	const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
	const logoX = CARD_WIDTH - logoWidth - 25;
	const logoY = 25;
	ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

	// Header text
	ctx.textAlign = "center";
	ctx.fillStyle = TEXT_DARK;

	// "PROVINCE OF AGUSAN DEL SUR"
	ctx.font = "bold 18px Arial";
	drawTextWithShadow(ctx, "PROVINCE OF AGUSAN DEL SUR", CARD_WIDTH / 2, 35);

	// "MUNICIPALITY OF LORETO"
	ctx.font = "bold italic 22px Arial";
	drawTextWithShadow(ctx, "MUNICIPALITY OF LORETO", CARD_WIDTH / 2, 58);

	// "LORECARD"
	ctx.font = "bold 48px Arial";
	ctx.fillStyle = BLUE_BAR_COLOR;
	drawTextWithShadow(ctx, "LORECARD", CARD_WIDTH / 2, 100);

	// "LORETO RESIDENTIAL CARD"
	ctx.font = "14px Arial";
	ctx.fillStyle = "#dc2626";
	ctx.letterSpacing = "3px";
	drawTextWithShadow(
		ctx,
		"L O R E T O   R E S I D E N T I A L   C A R D",
		CARD_WIDTH / 2,
		118,
	);

	// Blue "RESIDENT" bar
	ctx.fillStyle = BLUE_BAR_COLOR;
	ctx.fillRect(0, 135, 160, 30);
	ctx.fillStyle = TEXT_WHITE;
	ctx.font = "bold 16px Arial";
	ctx.textAlign = "left";
	ctx.fillText("RESIDENT", 15, 156);

	// Profile photo placeholder (left side)
	const photoX = 30;
	const photoY = 185;
	const photoWidth = 150;
	const photoHeight = 180;

	// Draw photo or placeholder
	if (profileImg) {
		// Draw with rounded corners
		ctx.save();
		ctx.beginPath();
		ctx.roundRect(photoX, photoY, photoWidth, photoHeight, 8);
		ctx.clip();
		// Scale and center the image
		const imgRatio = profileImg.width / profileImg.height;
		const targetRatio = photoWidth / photoHeight;
		let sx = 0,
			sy = 0,
			sw = profileImg.width,
			sh = profileImg.height;
		if (imgRatio > targetRatio) {
			sw = profileImg.height * targetRatio;
			sx = (profileImg.width - sw) / 2;
		} else {
			sh = profileImg.width / targetRatio;
			sy = (profileImg.height - sh) / 2;
		}
		ctx.drawImage(
			profileImg,
			sx,
			sy,
			sw,
			sh,
			photoX,
			photoY,
			photoWidth,
			photoHeight,
		);
		ctx.restore();
	} else {
		// Draw placeholder
		ctx.fillStyle = "#e5e7eb";
		ctx.beginPath();
		ctx.roundRect(photoX, photoY, photoWidth, photoHeight, 8);
		ctx.fill();
		// Silhouette
		ctx.fillStyle = "#9ca3af";
		ctx.beginPath();
		ctx.arc(photoX + photoWidth / 2, photoY + 55, 35, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.ellipse(
			photoX + photoWidth / 2,
			photoY + photoHeight - 20,
			50,
			40,
			0,
			Math.PI,
			0,
		);
		ctx.fill();
	}

	// Person details (right of photo)
	const detailsX = 200;
	let currentY = 190;

	// Name label
	ctx.fillStyle = TEXT_LIGHT;
	ctx.font = "12px Arial";
	ctx.textAlign = "left";
	ctx.fillText("Last Name, First Name, Middle Name", detailsX, currentY);

	// Name value
	currentY += 25;
	ctx.fillStyle = TEXT_DARK;
	ctx.font = "bold 24px Arial";
	const fullName = getFullName(person);
	// Truncate if too long
	const maxNameWidth = 400;
	let displayName = fullName;
	while (
		ctx.measureText(displayName).width > maxNameWidth &&
		displayName.length > 10
	) {
		displayName = displayName.slice(0, -1);
	}
	if (displayName !== fullName) displayName += "...";
	ctx.fillText(displayName.toUpperCase(), detailsX, currentY);

	// Civil Status and DOB row
	currentY += 35;
	ctx.fillStyle = TEXT_LIGHT;
	ctx.font = "12px Arial";
	ctx.fillText("Civil Status", detailsX, currentY);
	ctx.fillText("Date of Birth", detailsX + 150, currentY);

	currentY += 20;
	ctx.fillStyle = TEXT_DARK;
	ctx.font = "bold 18px Arial";
	ctx.fillText(person.civilStatus?.toUpperCase() || "—", detailsX, currentY);
	ctx.fillText(formatDate(person.birthdate), detailsX + 150, currentY);

	// Date Issued and Valid Until row
	currentY += 35;
	ctx.fillStyle = TEXT_LIGHT;
	ctx.font = "12px Arial";
	ctx.fillText("Date Issued", detailsX, currentY);
	ctx.fillText("Valid Until", detailsX + 150, currentY);

	currentY += 20;
	ctx.fillStyle = TEXT_DARK;
	ctx.font = "bold 18px Arial";
	const today = new Date();
	const validUntil = new Date(today);
	validUntil.setFullYear(validUntil.getFullYear() + 1);
	ctx.fillText(formatDate(today.toISOString()), detailsX, currentY);
	ctx.fillText(
		formatDateMMYY(validUntil.toISOString()),
		detailsX + 150,
		currentY,
	);

	// QR Code (right side)
	const qrSize = 150;
	const qrX = CARD_WIDTH - qrSize - 40;
	const qrY = 185;
	const qrImg = await loadImage(qrDataUrl);
	ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

	// Address bar (bottom)
	const addressBarY = CARD_HEIGHT - 60;
	ctx.fillStyle = "rgba(255,255,255,0.85)";
	ctx.fillRect(0, addressBarY, CARD_WIDTH, 60);

	ctx.fillStyle = TEXT_LIGHT;
	ctx.font = "12px Arial";
	ctx.textAlign = "left";
	ctx.fillText("Address", 25, addressBarY + 20);

	ctx.fillStyle = TEXT_DARK;
	ctx.font = "bold 16px Arial";
	const address = getFullAddress(person);
	ctx.fillText(address, 25, addressBarY + 45);

	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) resolve(blob);
			else reject(new Error("Failed to create blob"));
		}, "image/png");
	});
}

async function generateIdCardBackCanvas(data: IdCardData): Promise<Blob> {
	const canvas = document.createElement("canvas");
	canvas.width = CARD_WIDTH;
	canvas.height = CARD_HEIGHT;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Could not get canvas context");

	const { person, backgroundImg } = data;

	// Draw background
	ctx.drawImage(backgroundImg, 0, 0, CARD_WIDTH, CARD_HEIGHT);

	// Semi-transparent overlay for better readability
	ctx.fillStyle = "rgba(255,255,255,0.7)";
	ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

	// Left column
	let leftY = 40;
	const leftX = 40;

	// Blood Type
	ctx.fillStyle = TEXT_LIGHT;
	ctx.font = "12px Arial";
	ctx.textAlign = "left";
	ctx.fillText("Blood Type", leftX, leftY);
	leftY += 22;
	ctx.fillStyle = TEXT_DARK;
	ctx.font = "bold 24px Arial";
	ctx.fillText(person.bloodType || "—", leftX, leftY);

	// Gender
	leftY += 40;
	ctx.fillStyle = TEXT_LIGHT;
	ctx.font = "12px Arial";
	ctx.fillText("Gender", leftX, leftY);
	leftY += 22;
	ctx.fillStyle = TEXT_DARK;
	ctx.font = "bold 20px Arial";
	ctx.fillText(person.gender?.toUpperCase() || "—", leftX, leftY);

	// Contact Number
	leftY += 40;
	ctx.fillStyle = TEXT_LIGHT;
	ctx.font = "12px Arial";
	ctx.fillText("Contact Number", leftX, leftY);
	leftY += 22;
	ctx.fillStyle = TEXT_DARK;
	ctx.font = "bold 20px Arial";
	const phoneDisplay = person.phoneNumber.startsWith("63")
		? `+${person.phoneNumber}`
		: person.phoneNumber;
	ctx.fillText(phoneDisplay, leftX, leftY);

	// Place of Birth
	leftY += 40;
	ctx.fillStyle = TEXT_LIGHT;
	ctx.font = "12px Arial";
	ctx.fillText("Place of Birth", leftX, leftY);
	leftY += 22;
	ctx.fillStyle = TEXT_DARK;
	ctx.font = "bold 16px Arial";
	const pob = person.placeOfBirth?.toUpperCase() || "—";
	// Wrap text if too long
	const maxPobWidth = 280;
	if (ctx.measureText(pob).width > maxPobWidth) {
		const words = pob.split(" ");
		let line = "";
		for (const word of words) {
			const testLine = line ? `${line} ${word}` : word;
			if (ctx.measureText(testLine).width > maxPobWidth) {
				ctx.fillText(line, leftX, leftY);
				leftY += 20;
				line = word;
			} else {
				line = testLine;
			}
		}
		if (line) ctx.fillText(line, leftX, leftY);
	} else {
		ctx.fillText(pob, leftX, leftY);
	}

	// PhilHealth ID
	leftY += 40;
	ctx.fillStyle = TEXT_LIGHT;
	ctx.font = "12px Arial";
	ctx.fillText("PhilHealth ID", leftX, leftY);
	leftY += 22;
	ctx.fillStyle = TEXT_DARK;
	ctx.font = "bold 18px Arial";
	ctx.fillText(person.philhealth.idNumber || "—", leftX, leftY);

	// Emergency Contact (bottom left)
	const emergencyY = CARD_HEIGHT - 100;
	ctx.fillStyle = TEXT_LIGHT;
	ctx.font = "12px Arial";
	ctx.fillText("Emergency Contact", leftX, emergencyY);

	ctx.fillStyle = TEXT_DARK;
	ctx.font = "bold 18px Arial";
	const ecName = person.emergencyContactName?.toUpperCase() || "—";
	ctx.fillText(ecName, leftX, emergencyY + 25);

	ctx.font = "bold 16px Arial";
	const ecPhone = person.emergencyContactPhone
		? person.emergencyContactPhone.startsWith("63")
			? `+${person.emergencyContactPhone}`
			: person.emergencyContactPhone
		: "";
	ctx.fillText(ecPhone, leftX, emergencyY + 50);

	// Right side - Issuing Authority
	const rightX = 500;
	let rightY = 40;

	ctx.fillStyle = TEXT_LIGHT;
	ctx.font = "12px Arial";
	ctx.textAlign = "left";
	ctx.fillText("Issuing Authority", rightX, rightY);

	rightY += 30;
	ctx.fillStyle = TEXT_DARK;
	ctx.font = "bold 18px Arial";
	ctx.fillText("(SGD) ALVIN ANGCHANGCO OTAZA, RCE", rightX, rightY);

	rightY += 22;
	ctx.fillStyle = TEXT_LIGHT;
	ctx.font = "14px Arial";
	ctx.fillText("Municipal Mayor", rightX, rightY);

	rightY += 22;
	ctx.fillStyle = TEXT_DARK;
	ctx.font = "bold 14px Arial";
	ctx.fillText("LOCAL GOVERNMENT UNIT OF LORETO", rightX, rightY);

	// General Terms and Conditions (bottom right)
	const termsX = rightX;
	const termsY = CARD_HEIGHT - 230;
	const termsWidth = 470;
	const termsLineHeight = 15;

	ctx.fillStyle = TEXT_DARK;
	ctx.font = "bold 14px Arial";
	ctx.fillText("GENERAL TERMS AND CONDITION", termsX, termsY);

	ctx.fillStyle = TEXT_LIGHT;
	ctx.font = "11px Arial";
	const termsText =
		"By signing or using this card, the cardholder agrees to be bound by the LORECARD Terms and Conditions. Please present this card when availing of any services from the Local Government Unit of Loreto, Agusan del Sur or partner establishments. Tampering invalidates this card. A card is deemed tampered when there are alterations or erasures apparent on the card itself. If you find a lost card, please return to the Municipal Information Office located at the Municipal Hall, Zone 8, Poblacion, Loreto, Agusan del Sur.";

	// Word wrap the terms text
	const words = termsText.split(" ");
	let line = "";
	let termsCurrentY = termsY + 20;

	for (const word of words) {
		const testLine = line ? `${line} ${word}` : word;
		if (ctx.measureText(testLine).width > termsWidth) {
			ctx.fillText(line, termsX, termsCurrentY);
			line = word;
			termsCurrentY += termsLineHeight;
		} else {
			line = testLine;
		}
	}
	if (line) {
		ctx.fillText(line, termsX, termsCurrentY);
	}

	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) resolve(blob);
			else reject(new Error("Failed to create blob"));
		}, "image/png");
	});
}

export async function generateIdCardFront(person: Person): Promise<Blob> {
	const [backgroundImg, sealImg, logoImg, qrDataUrl] = await Promise.all([
		loadImage(BACKGROUND_PATH),
		loadImage(SEAL_PATH),
		loadImage(LOGO_PATH),
		QRCode.toDataURL(person.id, {
			width: 300,
			margin: 1,
			errorCorrectionLevel: "M",
		}),
	]);

	let profileImg: HTMLImageElement | null = null;
	if (person.profilePhoto) {
		try {
			profileImg = await loadImage(person.profilePhoto);
		} catch {
			console.warn("Could not load profile photo");
		}
	}

	return generateIdCardFrontCanvas({
		person,
		qrDataUrl,
		backgroundImg,
		sealImg,
		logoImg,
		profileImg,
	});
}

export async function generateIdCardBack(person: Person): Promise<Blob> {
	const [backgroundImg, sealImg, logoImg] = await Promise.all([
		loadImage(BACKGROUND_PATH),
		loadImage(SEAL_PATH),
		loadImage(LOGO_PATH),
	]);

	return generateIdCardBackCanvas({
		person,
		qrDataUrl: "",
		backgroundImg,
		sealImg,
		logoImg,
		profileImg: null,
	});
}

export async function downloadIdCardZip(person: Person): Promise<void> {
	const [frontBlob, backBlob] = await Promise.all([
		generateIdCardFront(person),
		generateIdCardBack(person),
	]);

	const zip = new JSZip();
	zip.file("id-front.png", frontBlob);
	zip.file("id-back.png", backBlob);

	const zipBlob = await zip.generateAsync({ type: "blob" });

	// Create download link
	const link = document.createElement("a");
	link.href = URL.createObjectURL(zipBlob);
	const safeName = `${person.firstName}-${person.lastName}`
		.replace(/[^a-zA-Z0-9-]/g, "")
		.toLowerCase();
	link.download = `id-card-${safeName}.zip`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(link.href);
}
