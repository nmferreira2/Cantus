export const SONG_TYPES = Object.freeze([
    "ENTRANCE",
    "PENITENTIAL_ACT",
    "GLORIA",
    "RESPONSORIAL_PSALM",
    "GOSPEL_ACCLAMATION",
    "CREED",
    "OFFERTORY",
    "HOLY",
    "LAMB_OF_GOD",
    "COMMUNION",
    "THANKSGIVING",
    "FINAL",
    "OTHER"
]);

export const SONG_FIELDS = Object.freeze([
    "title",
    "subtitle",
    "composerName",
    "arrangerName",
    "harmonizerName",
    "originalKey",
    "songTypes",
    "language",
    "lyrics",
    "notes",
    "active",
    "tagIds"
]);

export const SONG_SORT_FIELDS = Object.freeze([
    "title",
    "composerName",
    "language",
    "createdAt",
    "updatedAt"
]);

export const SONG_STATUSES = Object.freeze([
    "current",
    "active",
    "inactive",
    "archived"
]);
