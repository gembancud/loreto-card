DROP TABLE "person_emergency_contacts" CASCADE;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "emergency_contact_name" text;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "emergency_contact_phone" text;