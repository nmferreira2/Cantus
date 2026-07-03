-- CreateTable
CREATE TABLE "SongTag" (
    "songId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("songId", "tagId"),
    CONSTRAINT "SongTag_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SongTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Preserve every existing implicit many-to-many association.
INSERT INTO "SongTag" ("songId", "tagId")
SELECT "A", "B" FROM "_SongToTag";

DROP INDEX "_SongToTag_B_index";
DROP INDEX "_SongToTag_AB_unique";
DROP TABLE "_SongToTag";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Song" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "composerName" TEXT NOT NULL DEFAULT 'Compositor desconhecido',
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
INSERT INTO "new_Song" ("active", "createdAt", "deletedAt", "id", "language", "lyrics", "notes", "originalKey", "songType", "subtitle", "title", "updatedAt") SELECT "active", "createdAt", "deletedAt", "id", "language", "lyrics", "notes", "originalKey", "songType", "subtitle", "title", "updatedAt" FROM "Song";
DROP TABLE "Song";
ALTER TABLE "new_Song" RENAME TO "Song";
CREATE INDEX "Song_deletedAt_title_idx" ON "Song"("deletedAt", "title");
CREATE INDEX "Song_songType_idx" ON "Song"("songType");
CREATE INDEX "Song_language_idx" ON "Song"("language");
CREATE TABLE "new_Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'CATEGORY',
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Tag" ("createdAt", "updatedAt", "group", "id", "name", "slug")
SELECT "createdAt", "createdAt", "group", "id", "name", "slug" FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
CREATE INDEX "Tag_group_name_idx" ON "Tag"("group", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SongTag_tagId_idx" ON "SongTag"("tagId");

-- Localise and categorise the initial tag vocabulary.
UPDATE "Tag" SET "name" = 'Advento', "category" = 'Tempo litúrgico' WHERE "id" = 'tag-season-advent';
UPDATE "Tag" SET "name" = 'Natal', "category" = 'Tempo litúrgico' WHERE "id" = 'tag-season-christmas';
UPDATE "Tag" SET "name" = 'Quaresma', "category" = 'Tempo litúrgico' WHERE "id" = 'tag-season-lent';
UPDATE "Tag" SET "name" = 'Páscoa', "category" = 'Tempo litúrgico' WHERE "id" = 'tag-season-easter';
UPDATE "Tag" SET "name" = 'Tempo Comum', "category" = 'Tempo litúrgico' WHERE "id" = 'tag-season-ordinary-time';
UPDATE "Tag" SET "name" = 'Pentecostes', "category" = 'Solenidade' WHERE "id" = 'tag-occasion-feasts';
UPDATE "Tag" SET "name" = 'Corpus Christi', "category" = 'Solenidade' WHERE "id" = 'tag-occasion-saints';
UPDATE "Tag" SET "name" = 'Jovens', "category" = 'Grupo' WHERE "id" = 'tag-category-youth';
UPDATE "Tag" SET "name" = 'Coro', "category" = 'Grupo' WHERE "id" = 'tag-category-choir';
UPDATE "Tag" SET "name" = 'Assembleia', "category" = 'Grupo' WHERE "id" = 'tag-category-assembly';
UPDATE "Tag" SET "name" = 'Crianças', "category" = 'Grupo' WHERE "id" = 'tag-category-children';
UPDATE "Tag" SET "name" = 'Casamento', "category" = 'Contexto' WHERE "id" = 'tag-category-wedding';
UPDATE "Tag" SET "name" = 'Funeral', "category" = 'Contexto' WHERE "id" = 'tag-category-funeral';
UPDATE "Tag" SET "name" = 'Nossa Senhora', "category" = 'Temática' WHERE "id" = 'tag-category-marian';
UPDATE "Tag" SET "name" = 'Espírito Santo', "category" = 'Temática' WHERE "id" = 'tag-category-christmas';
UPDATE "Tag" SET "name" = 'Semana Santa', "category" = 'Tempo litúrgico' WHERE "id" = 'tag-category-holy-week';

INSERT INTO "Tag" ("id", "name", "slug", "group", "category", "createdAt", "updatedAt")
VALUES (
    'tag-context-baptism',
    'Batismo',
    'context-baptism',
    'CATEGORY',
    'Contexto',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

UPDATE "AppSetting"
SET "defaultLanguage" = 'Português'
WHERE "id" = 1 AND "defaultLanguage" = 'English';
