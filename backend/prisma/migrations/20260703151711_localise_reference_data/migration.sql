-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "applicationName" TEXT NOT NULL DEFAULT 'Cantus',
    "logoPath" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#6558d3',
    "secondaryColor" TEXT NOT NULL DEFAULT '#171822',
    "churchName" TEXT,
    "churchAddress" TEXT,
    "churchEmail" TEXT,
    "churchPhone" TEXT,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'Português',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppSetting" ("applicationName", "churchAddress", "churchEmail", "churchName", "churchPhone", "defaultLanguage", "id", "logoPath", "primaryColor", "secondaryColor", "updatedAt") SELECT "applicationName", "churchAddress", "churchEmail", "churchName", "churchPhone", "defaultLanguage", "id", "logoPath", "primaryColor", "secondaryColor", "updatedAt" FROM "AppSetting";
DROP TABLE "AppSetting";
ALTER TABLE "new_AppSetting" RENAME TO "AppSetting";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

UPDATE "AppSetting"
SET "defaultLanguage" = 'Português'
WHERE "id" = 1;

UPDATE "LiturgicalSeason" SET "name" = 'Advento' WHERE "id" = 'season-advent';
UPDATE "LiturgicalSeason" SET "name" = 'Natal' WHERE "id" = 'season-christmas';
UPDATE "LiturgicalSeason" SET "name" = 'Quaresma' WHERE "id" = 'season-lent';
UPDATE "LiturgicalSeason" SET "name" = 'Páscoa' WHERE "id" = 'season-easter';
UPDATE "LiturgicalSeason" SET "name" = 'Tempo Comum' WHERE "id" = 'season-ordinary-time';

UPDATE "Celebration" SET "name" = 'Natal do Senhor' WHERE "id" = 'celebration-christmas';
UPDATE "Celebration" SET "name" = 'Epifania do Senhor' WHERE "id" = 'celebration-epiphany';
UPDATE "Celebration" SET "name" = 'Domingo de Páscoa' WHERE "id" = 'celebration-easter';
UPDATE "Celebration" SET "name" = 'Domingo de Pentecostes' WHERE "id" = 'celebration-pentecost';
UPDATE "Celebration" SET "name" = 'Todos os Santos' WHERE "id" = 'celebration-all-saints';
UPDATE "Celebration" SET "name" = 'Imaculada Conceição' WHERE "id" = 'celebration-immaculate-conception';
