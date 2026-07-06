PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "TagGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME
);

INSERT INTO "TagGroup" ("id", "name", "slug", "sortOrder") VALUES
    ('tag-group-liturgical-moment', 'Momento litúrgico', 'momento-liturgico', 10),
    ('tag-group-group', 'Grupo', 'grupo', 20),
    ('tag-group-song-type', 'Tipo de cântico', 'tipo-de-cantico', 30),
    ('tag-group-liturgical-season', 'Tempo litúrgico', 'tempo-liturgico', 40),
    ('tag-group-solemnity', 'Solenidade', 'solenidade', 50),
    ('tag-group-context', 'Contexto', 'contexto', 60),
    ('tag-group-theme', 'Temática', 'tematica', 70),
    ('tag-group-instrumentation', 'Instrumentação', 'instrumentacao', 80),
    ('tag-group-voices', 'Vozes', 'vozes', 90);

CREATE UNIQUE INDEX "TagGroup_slug_key" ON "TagGroup"("slug");
CREATE INDEX "TagGroup_deletedAt_sortOrder_name_idx"
    ON "TagGroup"("deletedAt", "sortOrder", "name");

CREATE TABLE "new_Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "Tag_groupId_fkey"
        FOREIGN KEY ("groupId")
        REFERENCES "TagGroup" ("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

INSERT INTO "new_Tag" (
    "id", "name", "slug", "groupId", "createdAt", "updatedAt"
)
SELECT
    "id",
    "name",
    "slug",
    CASE
        WHEN "category" = 'Momento litúrgico'
            THEN 'tag-group-liturgical-moment'
        WHEN "category" = 'Grupo'
            THEN 'tag-group-group'
        WHEN "category" = 'Tempo litúrgico'
            THEN 'tag-group-liturgical-season'
        WHEN "category" = 'Solenidade'
            THEN 'tag-group-solemnity'
        WHEN "category" = 'Contexto'
            THEN 'tag-group-context'
        WHEN "category" = 'Temática'
            THEN 'tag-group-theme'
        WHEN "group" = 'LITURGICAL_SEASON'
            THEN 'tag-group-liturgical-season'
        WHEN "group" = 'OCCASION'
            THEN 'tag-group-solemnity'
        ELSE 'tag-group-context'
    END,
    "createdAt",
    "updatedAt"
FROM "Tag";

DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";

CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
CREATE UNIQUE INDEX "Tag_groupId_name_key" ON "Tag"("groupId", "name");
CREATE INDEX "Tag_groupId_deletedAt_sortOrder_name_idx"
    ON "Tag"("groupId", "deletedAt", "sortOrder", "name");

INSERT INTO "Tag" (
    "id", "name", "slug", "groupId", "sortOrder"
) VALUES
    ('tag-instrument-organ', 'Órgão', 'orgao', 'tag-group-instrumentation', 10),
    ('tag-voices-satb', 'SATB', 'satb', 'tag-group-voices', 10);

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
