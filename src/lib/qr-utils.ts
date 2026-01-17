/**
 * Utility functions for QR code scanning
 */

// UUID regex pattern (any version)
const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID
 */
export function isValidUuid(value: string): boolean {
	return UUID_REGEX.test(value.trim());
}

/**
 * Extracts and validates a person ID from scanned QR content
 * Returns the UUID if valid, null otherwise
 */
export function extractPersonIdFromQr(content: string): string | null {
	const trimmed = content.trim();
	if (isValidUuid(trimmed)) {
		return trimmed.toLowerCase();
	}
	return null;
}

export type QrScanError =
	| "permission_denied"
	| "no_camera"
	| "invalid_qr"
	| "camera_error";

export function getQrErrorMessage(error: QrScanError): string {
	switch (error) {
		case "permission_denied":
			return "Camera access was denied. Please allow camera access to scan QR codes.";
		case "no_camera":
			return "No camera found on this device.";
		case "invalid_qr":
			return "Invalid QR code. Please scan a valid beneficiary ID card.";
		case "camera_error":
			return "Failed to access camera. Please try again.";
	}
}
