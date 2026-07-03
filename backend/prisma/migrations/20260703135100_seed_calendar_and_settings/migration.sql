INSERT INTO "LiturgicalSeason" ("id", "name", "slug", "color", "sortOrder") VALUES
    ('season-advent', 'Advent', 'advent', '#6f42c1', 1),
    ('season-christmas', 'Christmas', 'christmas', '#d4a72c', 2),
    ('season-lent', 'Lent', 'lent', '#7048a8', 3),
    ('season-easter', 'Easter', 'easter', '#e0a800', 4),
    ('season-ordinary-time', 'Ordinary Time', 'ordinary-time', '#2f8b5b', 5);

INSERT INTO "Celebration" ("id", "name", "seasonId", "type", "month", "day") VALUES
    ('celebration-christmas', 'Nativity of the Lord', 'season-christmas', 'SOLEMNITY', 12, 25),
    ('celebration-epiphany', 'Epiphany of the Lord', 'season-christmas', 'SOLEMNITY', 1, 6),
    ('celebration-easter', 'Easter Sunday', 'season-easter', 'SOLEMNITY', NULL, NULL),
    ('celebration-pentecost', 'Pentecost Sunday', 'season-easter', 'SOLEMNITY', NULL, NULL),
    ('celebration-all-saints', 'All Saints', 'season-ordinary-time', 'SOLEMNITY', 11, 1),
    ('celebration-immaculate-conception', 'Immaculate Conception', 'season-advent', 'SOLEMNITY', 12, 8);

INSERT INTO "AppSetting" (
    "id",
    "applicationName",
    "primaryColor",
    "secondaryColor",
    "defaultLanguage",
    "updatedAt"
) VALUES (
    1,
    'Cantus',
    '#6558d3',
    '#171822',
    'English',
    CURRENT_TIMESTAMP
);
