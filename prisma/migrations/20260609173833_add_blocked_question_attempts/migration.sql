-- CreateTable
CREATE TABLE "blocked_question_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_question_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blocked_question_attempts_user_id_idx" ON "blocked_question_attempts"("user_id");

-- AddForeignKey
ALTER TABLE "blocked_question_attempts" ADD CONSTRAINT "blocked_question_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
