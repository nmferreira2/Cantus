export const CONTRIBUTOR_ROLES = Object.freeze([
    ["COMPOSER", "Compositor"],
    ["AUTHOR", "Autor"],
    ["ARRANGER", "Arranjador"],
    ["TRANSLATOR", "Tradutor"],
    ["MUSICIAN", "Músico"],
    ["CHOIR", "Coro"]
]);

export function contributorRoleLabel(role) {
    return CONTRIBUTOR_ROLES.find(([value]) => value === role)?.[1] ?? role;
}
