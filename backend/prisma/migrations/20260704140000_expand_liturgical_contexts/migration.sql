-- Normalize the existing liturgical-season labels.
UPDATE "Tag"
SET "name" = 'Tempo do Advento',
    "category" = 'Tempo litúrgico',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'tag-season-advent';

UPDATE "Tag"
SET "name" = 'Tempo do Natal',
    "category" = 'Tempo litúrgico',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'tag-season-christmas';

UPDATE "Tag"
SET "name" = 'Tempo da Quaresma',
    "category" = 'Tempo litúrgico',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'tag-season-lent';

UPDATE "Tag"
SET "name" = 'Tempo da Páscoa',
    "category" = 'Tempo litúrgico',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'tag-season-easter';

UPDATE "Tag"
SET "category" = 'Tempo litúrgico',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" IN ('tag-season-ordinary-time', 'tag-category-holy-week');

-- Complete the liturgical-time catalogue shown in the reference.
INSERT OR IGNORE INTO "Tag"
    ("id", "name", "slug", "group", "category", "createdAt", "updatedAt")
VALUES
    ('tag-season-various-circumstances', 'Missas para Diversas Circunstâncias', 'missas-para-diversas-circunstancias', 'LITURGICAL_SEASON', 'Tempo litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-season-ritual', 'Ritual', 'ritual', 'LITURGICAL_SEASON', 'Tempo litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-season-sanctoral', 'Santoral', 'santoral', 'LITURGICAL_SEASON', 'Tempo litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-season-solemnities-lord', 'Solenidades do Senhor', 'solenidades-do-senhor', 'LITURGICAL_SEASON', 'Tempo litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Complete the liturgical-moment catalogue shown in the reference.
INSERT OR IGNORE INTO "Tag"
    ("id", "name", "slug", "group", "category", "createdAt", "updatedAt")
VALUES
    ('tag-moment-gospel-acclamation', 'Aclamação ao Evangelho', 'momento-aclamacao-ao-evangelho', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-penitential', 'Acto Penitencial', 'momento-acto-penitencial', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-penitential-b', 'Acto Penitencial — Fórmula B', 'momento-acto-penitencial-formula-b', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-penitential-c', 'Acto Penitencial — Fórmula C (com tropos)', 'momento-acto-penitencial-formula-c', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-adoration-sacrament', 'Adoração ao Santíssimo Sacramento', 'momento-adoracao-santissimo-sacramento', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-adoration-cross', 'Adoração da Cruz', 'momento-adoracao-da-cruz', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-solemn-announcement', 'Anúncio Solene', 'momento-anuncio-solene', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-offertory', 'Apresentação dos dons', 'momento-apresentacao-dos-dons', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-aspersion', 'Aspersão', 'momento-aspersao', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-blessing-water', 'Bênção da Água', 'momento-bencao-da-agua', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-communion', 'Comunhão', 'momento-comunhao', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-marian-consecration', 'Consagração a Nossa Senhora', 'momento-consagracao-nossa-senhora', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-consent', 'Consentimento', 'momento-consentimento', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-lamb', 'Cordeiro de Deus', 'momento-cordeiro-de-deus', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-advent-wreath', 'Coroa do Advento', 'momento-coroa-do-advento', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-creed', 'Credo', 'momento-credo', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-entrance', 'Entrada', 'momento-entrada', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-gospel', 'Evangelho', 'momento-evangelho', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-final', 'Final', 'momento-final', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-gloria', 'Glória', 'momento-gloria', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-christ-king', 'Hino a Cristo Rei', 'momento-hino-cristo-rei', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-ashes', 'Imposição das Cinzas', 'momento-imposicao-das-cinzas', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-kyrie', 'Kyrie', 'momento-kyrie', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-litany', 'Ladainha', 'momento-ladainha', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-foot-washing', 'Lava-pés', 'momento-lava-pes', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-hours', 'Liturgia das Horas', 'momento-liturgia-das-horas', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-lucernarium', 'Lucernário', 'momento-lucernario', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-marian-prayer', 'Oração Mariana', 'momento-oracao-mariana', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-kiss-peace', 'Ósculo da Paz', 'momento-osculo-da-paz', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-thanksgiving', 'Pós-Comunhão', 'momento-pos-comunhao', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-cemetery-procession', 'Procissão para o cemitério', 'momento-procissao-cemiterio', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-palms', 'Ramos', 'momento-ramos', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-psalm', 'Salmo Responsorial', 'momento-salmo-responsorial', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-holy', 'Santo', 'momento-santo', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-holy-oils', 'Santos Óleos', 'momento-santos-oleos', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-sequence', 'Sequência', 'momento-sequencia', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-translation', 'Transladação do Santíssimo Sacramento', 'momento-transladacao-santissimo-sacramento', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-final-commendation', 'Última Encomendação e despedida', 'momento-ultima-encomendacao', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tag-moment-way-cross', 'Via-Sacra', 'momento-via-sacra', 'CATEGORY', 'Momento litúrgico', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Derive core liturgical moments from the existing multi-type assignments.
INSERT OR IGNORE INTO "SongTag" ("songId", "tagId")
SELECT "songId",
    CASE "type"
        WHEN 'ENTRANCE' THEN 'tag-moment-entrance'
        WHEN 'PENITENTIAL_ACT' THEN 'tag-moment-penitential'
        WHEN 'GLORIA' THEN 'tag-moment-gloria'
        WHEN 'RESPONSORIAL_PSALM' THEN 'tag-moment-psalm'
        WHEN 'GOSPEL_ACCLAMATION' THEN 'tag-moment-gospel-acclamation'
        WHEN 'CREED' THEN 'tag-moment-creed'
        WHEN 'OFFERTORY' THEN 'tag-moment-offertory'
        WHEN 'HOLY' THEN 'tag-moment-holy'
        WHEN 'LAMB_OF_GOD' THEN 'tag-moment-lamb'
        WHEN 'COMMUNION' THEN 'tag-moment-communion'
        WHEN 'THANKSGIVING' THEN 'tag-moment-thanksgiving'
        WHEN 'FINAL' THEN 'tag-moment-final'
    END
FROM "SongTypeAssignment"
WHERE "type" <> 'OTHER';

-- Include moments learned from historical mass-plan usage.
INSERT OR IGNORE INTO "SongTag" ("songId", "tagId")
SELECT "songId",
    CASE "slot"
        WHEN 'ENTRANCE' THEN 'tag-moment-entrance'
        WHEN 'PENITENTIAL' THEN 'tag-moment-penitential'
        WHEN 'ASPERSION' THEN 'tag-moment-aspersion'
        WHEN 'GLORIA' THEN 'tag-moment-gloria'
        WHEN 'PSALM' THEN 'tag-moment-psalm'
        WHEN 'ALLELUIA' THEN 'tag-moment-gospel-acclamation'
        WHEN 'OFFERTORY' THEN 'tag-moment-offertory'
        WHEN 'HOLY' THEN 'tag-moment-holy'
        WHEN 'LAMB_OF_GOD' THEN 'tag-moment-lamb'
        WHEN 'COMMUNION' THEN 'tag-moment-communion'
        WHEN 'THANKSGIVING' THEN 'tag-moment-thanksgiving'
        WHEN 'FINAL' THEN 'tag-moment-final'
    END
FROM "MassSong";
