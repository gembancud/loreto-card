CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"suffix" text,
	"birthdate" date NOT NULL,
	"street" text NOT NULL,
	"purok" text,
	"barangay" text NOT NULL,
	"phone_number" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"profile_photo" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "person_identifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"type" text NOT NULL,
	"id_number" text,
	"issue_date" date,
	"expiry_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "person_identifications_person_id_type_unique" UNIQUE("person_id","type")
);
--> statement-breakpoint
-- First drop the FK constraint if it was partially applied, and any existing vouchers
-- with non-uuid person_id values (they reference the old mock data)
DELETE FROM "vouchers" WHERE "person_id" IS NOT NULL;
ALTER TABLE "vouchers" ALTER COLUMN "person_id" SET DATA TYPE uuid USING "person_id"::uuid;--> statement-breakpoint
ALTER TABLE "person_identifications" ADD CONSTRAINT "person_identifications_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;