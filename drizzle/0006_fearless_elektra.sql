ALTER TABLE "otp_verifications" RENAME COLUMN "phone_number" TO "identifier";--> statement-breakpoint
ALTER TABLE "otp_verifications" ADD COLUMN "type" text;--> statement-breakpoint
UPDATE "otp_verifications" SET "type" = 'phone' WHERE "type" IS NULL;--> statement-breakpoint
ALTER TABLE "otp_verifications" ALTER COLUMN "type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");