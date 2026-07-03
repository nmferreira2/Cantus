-- RedefineTables
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
    "songType" TEXT NOT NULL,
    "language" TEXT,
    "lyrics" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_Song" ("active", "arrangerName", "composerName", "createdAt", "deletedAt", "harmonizerName", "id", "language", "lyrics", "notes", "originalKey", "songType", "subtitle", "title", "updatedAt") SELECT "active", "arrangerName", "composerName", "createdAt", "deletedAt", "harmonizerName", "id", "language", "lyrics", "notes", "originalKey", "songType", "subtitle", "title", "updatedAt" FROM "Song";
DROP TABLE "Song";
ALTER TABLE "new_Song" RENAME TO "Song";
CREATE INDEX "Song_deletedAt_title_idx" ON "Song"("deletedAt", "title");
CREATE INDEX "Song_songType_idx" ON "Song"("songType");
CREATE INDEX "Song_language_idx" ON "Song"("language");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
