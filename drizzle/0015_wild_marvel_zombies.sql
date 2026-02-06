-- Rename role values: admin -> department_admin, user -> department_user
UPDATE "users" SET "role" = 'department_admin' WHERE "role" = 'admin';
UPDATE "users" SET "role" = 'department_user' WHERE "role" = 'user';
-- Also update historical audit log role references
UPDATE "audit_logs" SET "actor_role" = 'department_admin' WHERE "actor_role" = 'admin';
UPDATE "audit_logs" SET "actor_role" = 'department_user' WHERE "actor_role" = 'user';
-- Update default
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'department_user';