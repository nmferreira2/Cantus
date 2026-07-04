export const MASS_SLOTS = Object.freeze([
    ["ENTRANCE", "Entrada"],
    ["PENITENTIAL", "Ato Penitencial"],
    ["ASPERSION", "Rito da Aspersão"],
    ["GLORIA", "Glória"],
    ["PSALM", "Salmo"],
    ["ALLELUIA", "Aleluia"],
    ["OFFERTORY", "Ofertório"],
    ["HOLY", "Santo"],
    ["LAMB_OF_GOD", "Cordeiro de Deus"],
    ["COMMUNION", "Comunhão"],
    ["THANKSGIVING", "Pós-Comunhão / Ação de Graças"],
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
