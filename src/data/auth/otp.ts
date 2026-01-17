import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { otpVerifications, sessions, users } from "@/db/schema";
import { getAppSession } from "@/lib/session";

const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 3;

// Normalize phone number to 639XXXXXXXXX format
export function normalizePhoneNumber(phone: string): string {
	// Remove all non-digit characters
	const digits = phone.replace(/\D/g, "");

	// Handle various formats
	if (digits.startsWith("639") && digits.length === 12) {
		return digits; // Already in correct format
	}
	if (digits.startsWith("09") && digits.length === 11) {
		return `63${digits.slice(1)}`; // Convert 09XX to 639XX
	}
	if (digits.startsWith("9") && digits.length === 10) {
		return `63${digits}`; // Convert 9XX to 639XX
	}
	if (digits.startsWith("63") && digits.length === 12) {
		return digits; // Already has country code
	}

	// Return as-is if format is unrecognized
	return digits;
}

interface SendOtpInput {
	phoneNumber: string;
}

interface SendOtpResult {
	success: boolean;
	error?: string;
}

export const sendOtp = createServerFn({ method: "POST" })
	.inputValidator((data: SendOtpInput) => data)
	.handler(async ({ data }): Promise<SendOtpResult> => {
		const normalizedPhone = normalizePhoneNumber(data.phoneNumber);

		// Check if user exists and is active
		const user = await db.query.users.findFirst({
			where: and(
				eq(users.phoneNumber, normalizedPhone),
				eq(users.isActive, true),
			),
		});

		if (!user) {
			return {
				success: false,
				error: "Phone number not registered or account is inactive",
			};
		}

		// In dev mode, skip SMS and use a fixed code
		if (import.meta.env.DEV) {
			const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
			await db.insert(otpVerifications).values({
				phoneNumber: normalizedPhone,
				code: "123456",
				expiresAt,
				attempts: 0,
				verified: false,
			});
			console.log(`[DEV] OTP for ${normalizedPhone}: 123456`);
			return { success: true };
		}

		// Call Semaphore API to send OTP
		const apiKey = process.env.SEMAPHORE_API_KEY;
		if (!apiKey) {
			console.error("SEMAPHORE_API_KEY not configured");
			return { success: false, error: "SMS service not configured" };
		}

		try {
			const response = await fetch("https://api.semaphore.co/api/v4/otp", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					apikey: apiKey,
					number: normalizedPhone,
					message: "Your Loreto Card code is {otp}. Valid for 5 minutes.",
				}),
			});

			const result = await response.json();

			// Semaphore returns an array with the OTP details
			const otpData = Array.isArray(result) ? result[0] : result;

			if (!response.ok || !otpData?.code) {
				console.error("Semaphore API error:", result);
				return { success: false, error: "Failed to send SMS" };
			}

			// Store OTP in database
			const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
			await db.insert(otpVerifications).values({
				phoneNumber: normalizedPhone,
				code: String(otpData.code),
				expiresAt,
				attempts: 0,
				verified: false,
			});

			return { success: true };
		} catch (error) {
			console.error("Error sending OTP:", error);
			return { success: false, error: "Failed to send SMS" };
		}
	});

interface VerifyOtpInput {
	phoneNumber: string;
	code: string;
}

interface VerifyOtpResult {
	success: boolean;
	error?: string;
}

export const verifyOtp = createServerFn({ method: "POST" })
	.inputValidator((data: VerifyOtpInput) => data)
	.handler(async ({ data }): Promise<VerifyOtpResult> => {
		const normalizedPhone = normalizePhoneNumber(data.phoneNumber);
		const now = new Date();

		// Find the most recent unexpired, unverified OTP for this phone
		const otpRecord = await db.query.otpVerifications.findFirst({
			where: and(
				eq(otpVerifications.phoneNumber, normalizedPhone),
				eq(otpVerifications.verified, false),
				gt(otpVerifications.expiresAt, now),
			),
			orderBy: [desc(otpVerifications.createdAt)],
		});

		if (!otpRecord) {
			return {
				success: false,
				error: "No valid OTP found. Please request a new code.",
			};
		}

		// Check attempt limit
		if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
			return {
				success: false,
				error: "Too many attempts. Please request a new code.",
			};
		}

		// Increment attempts
		await db
			.update(otpVerifications)
			.set({ attempts: otpRecord.attempts + 1 })
			.where(eq(otpVerifications.id, otpRecord.id));

		// Verify code (bypass in dev mode - any code works)
		if (!import.meta.env.DEV && otpRecord.code !== data.code) {
			return { success: false, error: "Invalid code" };
		}

		// Mark OTP as verified
		await db
			.update(otpVerifications)
			.set({ verified: true })
			.where(eq(otpVerifications.id, otpRecord.id));

		// Get user
		const user = await db.query.users.findFirst({
			where: eq(users.phoneNumber, normalizedPhone),
		});

		if (!user) {
			return { success: false, error: "User not found" };
		}

		// Create session in database
		const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
		await db.insert(sessions).values({
			userId: user.id,
			expiresAt: sessionExpiry,
		});

		// Set session cookie
		const session = await getAppSession();
		await session.update({
			userId: user.id,
			phoneNumber: user.phoneNumber,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role as "superuser" | "admin" | "user",
			departmentId: user.departmentId,
		});

		return { success: true };
	});
