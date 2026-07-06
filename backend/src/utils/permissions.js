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

const ADMIN_PERMISSIONS = Object.freeze(Object.values(PERMISSIONS));

export function permissionsFor(user) {
    if (user.role === "ADMIN") {
        return ADMIN_PERMISSIONS;
    }

    return user.allowScoreManagement
        ? Object.freeze([
            PERMISSIONS.MANAGE_SCORES,
            PERMISSIONS.UPLOAD_FILES,
            PERMISSIONS.DELETE_SCORES
        ])
        : Object.freeze([]);
}

export function hasPermission(user, permission) {
    return user.permissions?.includes(permission) ?? false;
}

export function isContributorAssociatedWithSong(user, song) {
    if (user.role === "ADMIN") {
        return true;
    }
    if (!user.contributor) {
        return false;
    }

    const names = [
        user.contributor.displayName,
        [user.contributor.name, user.contributor.surname].filter(Boolean).join(" "),
        user.contributor.name
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
