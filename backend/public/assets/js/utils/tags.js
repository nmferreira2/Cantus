export const TAG_GROUP_LABELS = Object.freeze({
    LITURGICAL_SEASON: "Tempos litúrgicos",
    OCCASION: "Solenidades",
    CATEGORY: "Outras tags",
    "Tempo litúrgico": "Tempos litúrgicos",
    Solenidade: "Solenidades",
    Temática: "Temáticas",
    Contexto: "Contextos",
    Grupo: "Grupos"
});

export function groupTags(tags) {
    return tags.reduce((groups, tag) => {
        const group = tag.category || tag.group;
        groups[group] ??= [];
        groups[group].push(tag);
        return groups;
    }, {});
}
