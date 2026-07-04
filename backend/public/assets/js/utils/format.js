const SONG_TYPE_LABELS = Object.freeze({
    ENTRANCE: "Entrada",
    PENITENTIAL_ACT: "Ato Penitencial",
    GLORIA: "Glória",
    RESPONSORIAL_PSALM: "Salmo Responsorial",
    GOSPEL_ACCLAMATION: "Aclamação ao Evangelho",
    CREED: "Credo",
    OFFERTORY: "Ofertório",
    HOLY: "Santo",
    LAMB_OF_GOD: "Cordeiro de Deus",
    COMMUNION: "Comunhão",
    THANKSGIVING: "Ação de Graças",
    FINAL: "Final",
    OTHER: "Outro"
});

export const SONG_TYPES = Object.entries(SONG_TYPE_LABELS);
const SONG_TYPE_ORDER = new Map(
    SONG_TYPES.map(([value], index) => [value, index])
);

export function songTypeLabel(value) {
    return SONG_TYPE_LABELS[value] ?? "Outro";
}

export function songTypesLabel(values = []) {
    return orderSongTypes(values).map(songTypeLabel).join(", ");
}

export function orderSongTypes(values = []) {
    return [...values].sort(
        (left, right) => (
            (SONG_TYPE_ORDER.get(left) ?? Number.MAX_SAFE_INTEGER)
            - (SONG_TYPE_ORDER.get(right) ?? Number.MAX_SAFE_INTEGER)
        )
    );
}

export function formatDate(value) {
    if (!value) {
        return "—";
    }

    return new Intl.DateTimeFormat("pt-PT", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(new Date(value));
}

export function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
