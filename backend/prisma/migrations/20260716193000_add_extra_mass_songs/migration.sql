PRAGMA foreign_keys=OFF;

CREATE TABLE "new_MassSong" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "massId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "label" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MassSong_massId_fkey" FOREIGN KEY ("massId") REFERENCES "Mass" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MassSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_MassSong" ("id", "massId", "songId", "slot", "position")
SELECT "id", "massId", "songId", "slot", 0
FROM "MassSong";

DROP TABLE "MassSong";
ALTER TABLE "new_MassSong" RENAME TO "MassSong";

CREATE UNIQUE INDEX "MassSong_massId_slot_position_key" ON "MassSong"("massId", "slot", "position");
CREATE INDEX "MassSong_massId_slot_position_idx" ON "MassSong"("massId", "slot", "position");
CREATE INDEX "MassSong_songId_idx" ON "MassSong"("songId");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
