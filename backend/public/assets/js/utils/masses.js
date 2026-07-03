export const MASS_SLOTS = Object.freeze([
    ["ENTRANCE", "Entrada"],
    ["PENITENTIAL", "Ato Penitencial"],
    ["GLORIA", "Glória"],
    ["PSALM", "Salmo"],
    ["ALLELUIA", "Aleluia"],
    ["OFFERTORY", "Ofertório"],
    ["HOLY", "Santo"],
    ["LAMB_OF_GOD", "Cordeiro de Deus"],
    ["COMMUNION", "Comunhão"],
    ["FINAL", "Final"]
]);

export function massSlotLabel(slot) {
    return MASS_SLOTS.find(([value]) => value === slot)?.[1] ?? slot;
}

export function formatDateTime(value) {
    return new Intl.DateTimeFormat("pt-PT", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(value));
}
