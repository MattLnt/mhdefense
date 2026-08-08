-- CreateTable
CREATE TABLE "PendingSignup" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "participantsCount" INTEGER NOT NULL DEFAULT 1,
    "engagementMonths" INTEGER NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubId" TEXT NOT NULL,
    "preferredSlot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingSignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingSignup_stripeSubId_key" ON "PendingSignup"("stripeSubId");

-- CreateIndex
CREATE INDEX "PendingSignup_email_idx" ON "PendingSignup"("email");

-- CreateIndex
CREATE INDEX "PendingSignup_createdAt_idx" ON "PendingSignup"("createdAt");
