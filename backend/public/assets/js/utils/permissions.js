export const PERMISSIONS = Object.freeze({
    MANAGE_SONGS: "MANAGE_SONGS",
    MANAGE_SCORES: "MANAGE_SCORES",
    MANAGE_CONTRIBUTORS: "MANAGE_CONTRIBUTORS",
    MANAGE_MASSES: "MANAGE_MASSES",
    MANAGE_SETTINGS: "MANAGE_SETTINGS",
    MANAGE_USERS: "MANAGE_USERS",
    UPLOAD_FILES: "UPLOAD_FILES",
    MERGE_CONTRIBUTORS: "MERGE_CONTRIBUTORS",
    DELETE_SONGS: "DELETE_SONGS",
    DELETE_SCORES: "DELETE_SCORES"
});

export function can(permission) {
    return window.cantusUser?.permissions?.includes(permission) ?? false;
}

export function isAdmin() {
    return window.cantusUser?.role === "ADMIN";
}

export function canManageScoreForSong(song) {
    if (!can(PERMISSIONS.MANAGE_SCORES)) {
        return false;
    }
    if (isAdmin()) {
        return true;
    }

    const contributor = window.cantusUser?.contributor;
    if (!contributor) {
        return false;
    }
    const names = [
        contributor.displayName,
        [contributor.name, contributor.surname].filter(Boolean).join(" "),
        contributor.name
    ].filter(Boolean).map(normalize);
    const credits = [
        song.composerName,
        song.arrangerName,
        song.harmonizerName
    ].filter(Boolean).map(normalize);
    return names.some((name) => credits.includes(name));
}

function normalize(value) {
    return value.trim().toLocaleLowerCase("pt-PT");
}
