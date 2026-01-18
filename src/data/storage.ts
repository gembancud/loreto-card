import { createServerFn } from "@tanstack/react-start";
import {
	deleteImage,
	extractKeyFromUrl,
	getPresignedUrl,
	uploadImage,
} from "@/lib/storage";

interface UploadProfilePhotoInput {
	personId: string;
	base64Data: string;
	contentType: string;
}

interface UploadProfilePhotoResult {
	success: boolean;
	url?: string;
	error?: string;
}

export const uploadProfilePhoto = createServerFn({ method: "POST" })
	.inputValidator((data: UploadProfilePhotoInput) => data)
	.handler(async ({ data }): Promise<UploadProfilePhotoResult> => {
		try {
			// Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
			const base64String = data.base64Data.replace(/^data:[^;]+;base64,/, "");

			// Convert base64 to buffer
			const buffer = Buffer.from(base64String, "base64");

			// Determine file extension from content type
			const extension = data.contentType.split("/")[1] || "jpg";

			// Generate unique key with timestamp to avoid caching issues
			const timestamp = Date.now();
			const key = `people/${data.personId}/photo-${timestamp}.${extension}`;

			// Upload to S3 (returns the key)
			const uploadedKey = await uploadImage(buffer, key, data.contentType);

			// Generate presigned URL for immediate display
			const presignedUrl = await getPresignedUrl(uploadedKey);

			return { success: true, url: presignedUrl };
		} catch (error) {
			console.error("Error uploading profile photo:", error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to upload photo",
			};
		}
	});

interface DeleteProfilePhotoInput {
	photoUrl: string;
}

interface DeleteProfilePhotoResult {
	success: boolean;
	error?: string;
}

export const deleteProfilePhoto = createServerFn({ method: "POST" })
	.inputValidator((data: DeleteProfilePhotoInput) => data)
	.handler(async ({ data }): Promise<DeleteProfilePhotoResult> => {
		try {
			// Extract key from URL
			const key = extractKeyFromUrl(data.photoUrl);

			if (!key) {
				// URL might be a data URL (legacy) or invalid - just return success
				return { success: true };
			}

			// Delete from S3
			await deleteImage(key);

			return { success: true };
		} catch (error) {
			console.error("Error deleting profile photo:", error);
			// Don't fail if delete fails - the photo might already be gone
			return { success: true };
		}
	});
