-- CreateTable
CREATE TABLE "SongTypeAssignment" (
    "songId" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    PRIMARY KEY ("songId", "type"),
    CONSTRAINT "SongTypeAssignment_songId_fkey"
        FOREIGN KEY ("songId") REFERENCES "Song" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Preserve the existing type of every song.
INSERT INTO "SongTypeAssignment" ("songId", "type")
SELECT "id", "songType" FROM "Song";

-- RedefineTable
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Song" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "composerName" TEXT NOT NULL,
    "arrangerName" TEXT,
    "harmonizerName" TEXT,
    "originalKey" TEXT,
    "language" TEXT,
    "lyrics" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_Song" (
    "active",
    "arrangerName",
    "composerName",
    "createdAt",
    "deletedAt",
    "harmonizerName",
    "id",
    "language",
    "lyrics",
    "notes",
    "originalKey",
    "subtitle",
    "title",
    "updatedAt"
)
SELECT
    "active",
    "arrangerName",
    "composerName",
    "createdAt",
    "deletedAt",
    "harmonizerName",
    "id",
    "language",
    "lyrics",
    "notes",
    "originalKey",
    "subtitle",
    "title",
    "updatedAt"
FROM "Song";
DROP TABLE "Song";
ALTER TABLE "new_Song" RENAME TO "Song";
CREATE INDEX "Song_deletedAt_title_idx" ON "Song"("deletedAt", "title");
CREATE INDEX "Song_language_idx" ON "Song"("language");
CREATE INDEX "SongTypeAssignment_type_idx" ON "SongTypeAssignment"("type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
