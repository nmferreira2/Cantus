export const SCORE_CATEGORIES = Object.freeze([
    ["CHOIR", "Coro"],
    ["ORGAN", "Órgão"],
    ["PIANO", "Piano"],
    ["GUITAR", "Guitarra"],
    ["OTHER", "Outra"]
]);

export function scoreCategoryLabel(category) {
    return SCORE_CATEGORIES.find(([value]) => value === category)?.[1]
        ?? category;
}
