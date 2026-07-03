-- CreateTable
CREATE TABLE "Contributor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "surname" TEXT,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "songId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "format" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Score_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScoreVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoreId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageName" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScoreVersion_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "Score" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LiturgicalSeason" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Celebration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "seasonId" TEXT,
    "type" TEXT,
    "month" INTEGER,
    "day" INTEGER,
    "description" TEXT,
    CONSTRAINT "Celebration_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "LiturgicalSeason" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startsAt" DATETIME NOT NULL,
    "church" TEXT NOT NULL,
    "celebrationId" TEXT,
    "seasonId" TEXT,
    "presider" TEXT,
    "choir" TEXT,
    "comments" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Mass_celebrationId_fkey" FOREIGN KEY ("celebrationId") REFERENCES "Celebration" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Mass_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "LiturgicalSeason" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MassSong" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "massId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    CONSTRAINT "MassSong_massId_fkey" FOREIGN KEY ("massId") REFERENCES "Mass" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MassSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "applicationName" TEXT NOT NULL DEFAULT 'Cantus',
    "logoPath" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#6558d3',
    "secondaryColor" TEXT NOT NULL DEFAULT '#171822',
    "churchName" TEXT,
    "churchAddress" TEXT,
    "churchEmail" TEXT,
    "churchPhone" TEXT,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'English',
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Contributor_deletedAt_displayName_idx" ON "Contributor"("deletedAt", "displayName");

-- CreateIndex
CREATE INDEX "Contributor_role_idx" ON "Contributor"("role");

-- CreateIndex
CREATE INDEX "Score_songId_deletedAt_idx" ON "Score"("songId", "deletedAt");

-- CreateIndex
CREATE INDEX "Score_format_idx" ON "Score"("format");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreVersion_storageName_key" ON "ScoreVersion"("storageName");

-- CreateIndex
CREATE INDEX "ScoreVersion_scoreId_createdAt_idx" ON "ScoreVersion"("scoreId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreVersion_scoreId_versionNumber_key" ON "ScoreVersion"("scoreId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LiturgicalSeason_slug_key" ON "LiturgicalSeason"("slug");

-- CreateIndex
CREATE INDEX "Celebration_seasonId_name_idx" ON "Celebration"("seasonId", "name");

-- CreateIndex
CREATE INDEX "Celebration_month_day_idx" ON "Celebration"("month", "day");

-- CreateIndex
CREATE INDEX "Mass_startsAt_deletedAt_idx" ON "Mass"("startsAt", "deletedAt");

-- CreateIndex
CREATE INDEX "Mass_seasonId_idx" ON "Mass"("seasonId");

-- CreateIndex
CREATE INDEX "Mass_celebrationId_idx" ON "Mass"("celebrationId");

-- CreateIndex
CREATE INDEX "MassSong_songId_idx" ON "MassSong"("songId");

-- CreateIndex
CREATE UNIQUE INDEX "MassSong_massId_slot_key" ON "MassSong"("massId", "slot");
