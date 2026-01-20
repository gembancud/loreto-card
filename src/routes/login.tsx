import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendOtp, verifyOtp } from "@/data/auth/otp";
import { getSessionData } from "@/data/auth/session";

export const Route = createFileRoute("/login")({
	component: LoginPage,
	beforeLoad: async () => {
		// Redirect to home if already logged in
		const session = await getSessionData();
		if (session?.userId) {
			throw redirect({ to: "/" });
		}
	},
});

type LoginStep = "phone" | "otp";

function LoginPage() {
	const router = useRouter();
	const id = useId();
	const [step, setStep] = useState<LoginStep>("phone");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [otpCode, setOtpCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSendOtp = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			const result = await sendOtp({ data: { phoneNumber } });
			if (result.success) {
				setStep("otp");
			} else {
				setError(result.error ?? "Failed to send OTP");
			}
		} catch (err) {
			setError("An unexpected error occurred");
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerifyOtp = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			const result = await verifyOtp({ data: { phoneNumber, code: otpCode } });
			if (result.success) {
				// Invalidate router to refresh all loaders/data, then redirect
				await router.invalidate();
				router.navigate({ to: "/" });
			} else {
				setError(result.error ?? "Verification failed");
			}
		} catch (err) {
			setError("An unexpected error occurred");
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleBackToPhone = () => {
		setStep("phone");
		setOtpCode("");
		setError(null);
	};

	return (
		<div className="h-full flex items-center justify-center p-4 bg-muted/30">
			<Card className="flex flex-col lg:flex-row max-w-4xl w-full overflow-hidden p-0">
				{/* Image half - flush with card edges (hidden on mobile) */}
				<div className="hidden lg:block lg:w-1/2">
					<img
						src="/cover-photo.webp"
						alt="LoreCard - Empowering Loretohanons"
						className="w-full h-full object-contain"
					/>
				</div>

				{/* Login form half - vertically centered */}
				<div className="w-full lg:w-1/2 flex flex-col justify-center p-6">
					{/* Header */}
					<div className="text-center mb-6">
						<img src="/favicon.png" alt="" className="h-12 w-12 mx-auto mb-2" />
						<h1 className="text-2xl font-semibold">LoreCard</h1>
						<p className="text-muted-foreground">
							{step === "phone"
								? "Enter your phone number to sign in"
								: "Enter the code sent to your phone"}
						</p>
					</div>

					{/* Form */}
					{step === "phone" ? (
						<form onSubmit={handleSendOtp} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor={`${id}-phone`}>Phone Number</Label>
								<Input
									id={`${id}-phone`}
									type="tel"
									placeholder="09171234567"
									value={phoneNumber}
									onChange={(e) => setPhoneNumber(e.target.value)}
									required
									autoFocus
								/>
								<p className="text-xs text-muted-foreground">
									Enter your registered Philippine mobile number
								</p>
							</div>
							{error && <p className="text-sm text-destructive">{error}</p>}
							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? "Sending..." : "Send Code"}
							</Button>
						</form>
					) : (
						<form onSubmit={handleVerifyOtp} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor={`${id}-otp`}>Verification Code</Label>
								<Input
									id={`${id}-otp`}
									type="text"
									inputMode="numeric"
									pattern="[0-9]*"
									maxLength={6}
									placeholder="123456"
									value={otpCode}
									onChange={(e) =>
										setOtpCode(e.target.value.replace(/\D/g, ""))
									}
									required
									autoFocus
								/>
								<p className="text-xs text-muted-foreground">
									Code sent to {phoneNumber}
								</p>
							</div>
							{error && <p className="text-sm text-destructive">{error}</p>}
							<div className="space-y-2">
								<Button type="submit" className="w-full" disabled={isLoading}>
									{isLoading ? "Verifying..." : "Verify"}
								</Button>
								<Button
									type="button"
									variant="ghost"
									className="w-full"
									onClick={handleBackToPhone}
									disabled={isLoading}
								>
									Use a different number
								</Button>
							</div>
						</form>
					)}
				</div>
			</Card>
		</div>
	);
}
