export function groupTags(tags) {
    return tags.reduce((groups, tag) => {
        const group = tag.group?.name || "Outras tags";
        groups[group] ??= [];
        groups[group].push(tag);
        return groups;
    }, {});
}
