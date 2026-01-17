import QRCode from "qrcode";

export async function generatePersonQrDataUrl(
	personId: string,
): Promise<string> {
	return QRCode.toDataURL(personId, {
		width: 300,
		margin: 2,
		errorCorrectionLevel: "M",
	});
}
