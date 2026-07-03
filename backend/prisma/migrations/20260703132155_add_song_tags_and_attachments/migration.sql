-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SongAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "songId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageName" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "SongAttachment_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_SongToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_SongToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SongToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_group_name_idx" ON "Tag"("group", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SongAttachment_storageName_key" ON "SongAttachment"("storageName");

-- CreateIndex
CREATE INDEX "SongAttachment_songId_deletedAt_idx" ON "SongAttachment"("songId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "_SongToTag_AB_unique" ON "_SongToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_SongToTag_B_index" ON "_SongToTag"("B");

-- CreateIndex
CREATE INDEX "Song_deletedAt_title_idx" ON "Song"("deletedAt", "title");

-- CreateIndex
CREATE INDEX "Song_songType_idx" ON "Song"("songType");

-- CreateIndex
CREATE INDEX "Song_language_idx" ON "Song"("language");
