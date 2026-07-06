ALTER TABLE "Score" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'CHOIR';

ALTER TABLE "ScoreVersion" ADD COLUMN "deletedAt" DATETIME;

CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CONTRIBUTOR',
    "contributorId" TEXT,
    "allowScoreManagement" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "User_contributorId_fkey"
        FOREIGN KEY ("contributorId")
        REFERENCES "Contributor" ("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_role_deletedAt_idx" ON "User"("role", "deletedAt");
CREATE INDEX "User_contributorId_idx" ON "User"("contributorId");
CREATE INDEX "Score_category_idx" ON "Score"("category");
CREATE INDEX "ScoreVersion_scoreId_deletedAt_idx"
    ON "ScoreVersion"("scoreId", "deletedAt");
