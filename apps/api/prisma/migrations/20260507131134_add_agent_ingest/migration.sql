-- CreateEnum
CREATE TYPE "TaskSuggestionStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "invitations" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "memberships" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notification_preferences" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "task_activities" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "meta" SET DEFAULT '{}'::jsonb;

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workspaces" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "agent_ingest_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "label" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "agent_ingest_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_suggestions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "TaskSuggestionStatus" NOT NULL DEFAULT 'pending',
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "source" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "dedupe_key" VARCHAR(255) NOT NULL,
    "proposed_workspace_id" UUID,
    "proposed_assignee_user_id" UUID,
    "proposed_priority" "TaskPriority",
    "proposed_due_at" TIMESTAMPTZ(6),
    "routing_notes" VARCHAR(500),
    "routing_confidence" DOUBLE PRECISION,
    "resolved_task_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "task_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_ingest_tokens_token_hash_key" ON "agent_ingest_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "agent_ingest_tokens_user_id_revoked_at_idx" ON "agent_ingest_tokens"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "task_suggestions_user_id_status_created_at_idx" ON "task_suggestions"("user_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "task_suggestions_user_id_dedupe_key_key" ON "task_suggestions"("user_id", "dedupe_key");

-- AddForeignKey
ALTER TABLE "agent_ingest_tokens" ADD CONSTRAINT "agent_ingest_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_suggestions" ADD CONSTRAINT "task_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
