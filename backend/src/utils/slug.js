import { randomUUID } from "node:crypto";

export function uniqueSlug(value) {
    const base = value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "item";

    return `${base}-${randomUUID().slice(0, 8)}`;
}
