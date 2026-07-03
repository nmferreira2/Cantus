import * as repository from "../repositories/tag.repository.js";
import { AppError } from "../utils/app-error.js";

export function getAllTags() {
    return repository.getAllTags();
}

export async function createTag(data) {
    const existing = await repository.findByName(data.name);
    if (existing) {
        throw new AppError(409, "Já existe uma tag com este nome.");
    }

    let slug = slugify(data.name);
    if (!slug) {
        slug = `tag-${Date.now()}`;
    }

    try {
        return await repository.createTag({
            name: data.name,
            category: data.category,
            group: "CATEGORY",
            slug: `${slug}-${Math.random().toString(36).slice(2, 8)}`
        });
    } catch (error) {
        if (error.code === "P2002") {
            throw new AppError(409, "Já existe uma tag com este nome.");
        }
        throw error;
    }
}

function slugify(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}
