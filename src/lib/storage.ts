import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Client() {
	const accessKeyId = process.env.S3_ACCESS_KEY_ID;
	const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

	if (!accessKeyId || !secretAccessKey) {
		throw new Error("S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be set");
	}

	return new S3Client({
		endpoint: process.env.S3_ENDPOINT,
		region: process.env.S3_REGION || "auto",
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
		forcePathStyle: true, // Required for S3-compatible services
	});
}

export async function uploadImage(
	buffer: Buffer,
	key: string,
	contentType: string,
): Promise<string> {
	const client = getS3Client();
	await client.send(
		new PutObjectCommand({
			Bucket: process.env.S3_BUCKET,
			Key: key,
			Body: buffer,
			ContentType: contentType,
		}),
	);
	// Return key instead of full URL - presigned URLs will be generated when loading
	return key;
}

export async function deleteImage(key: string): Promise<void> {
	const client = getS3Client();
	await client.send(
		new DeleteObjectCommand({
			Bucket: process.env.S3_BUCKET,
			Key: key,
		}),
	);
}

/**
 * Extract the S3 key from a full URL (including presigned URLs with query params)
 * e.g., "https://storage.railway.app/bucket/people/123/photo.jpg?X-Amz-Signature=..." -> "people/123/photo.jpg"
 */
export function extractKeyFromUrl(url: string): string | null {
	const bucket = process.env.S3_BUCKET;
	if (!bucket) return null;

	// Strip query parameters first (presigned URLs have signatures as query params)
	const urlWithoutQuery = url.split("?")[0];

	const regex = new RegExp(`/${bucket}/(.+)$`);
	const match = urlWithoutQuery.match(regex);
	return match ? match[1] : null;
}

/**
 * Generate a presigned URL for accessing an S3 object.
 * Handles both new uploads (keys) and existing data (full URLs) for backwards compatibility.
 * Base64 data URLs are passed through unchanged.
 */
export async function getPresignedUrl(keyOrUrl: string): Promise<string> {
	// Base64 data URLs pass through unchanged (for previews)
	if (keyOrUrl.startsWith("data:")) return keyOrUrl;

	// Extract key from full URL if needed (backwards compatibility)
	const key = keyOrUrl.includes("://") ? extractKeyFromUrl(keyOrUrl) : keyOrUrl;
	if (!key) return keyOrUrl;

	const client = getS3Client();
	const command = new GetObjectCommand({
		Bucket: process.env.S3_BUCKET,
		Key: key,
	});

	return getSignedUrl(client, command, { expiresIn: 3600 }); // 1 hour
}
