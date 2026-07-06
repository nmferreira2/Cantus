import * as repository from "../repositories/tag.repository.js";
import * as groupRepository from "../repositories/tag-group.repository.js";
import { AppError } from "../utils/app-error.js";
import { uniqueSlug } from "../utils/slug.js";

export function getAllTags(filters) {
    return repository.getAllTags(filters);
}

export async function createTag(data) {
    await ensureGroupExists(data.groupId);
    await ensureUniqueName(data.name, data.groupId);

    try {
        return await repository.createTag({
            name: data.name,
            groupId: data.groupId,
            sortOrder: data.sortOrder,
            slug: uniqueSlug(data.name)
        });
    } catch (error) {
        handleUniqueError(error);
        throw error;
    }
}

export async function updateTag(id, data) {
    const tag = await getTag(id);
    const groupId = data.groupId ?? tag.groupId;
    const name = data.name ?? tag.name;

    if (data.groupId) {
        await ensureGroupExists(data.groupId);
    }
    await ensureUniqueName(name, groupId, id);

    try {
        return await repository.updateTag(id, {
            ...data,
            ...(data.name ? { slug: uniqueSlug(data.name) } : {}),
            ...(data.active === true ? { deletedAt: null } : {}),
            ...(data.active === false ? { deletedAt: new Date() } : {})
        });
    } catch (error) {
        handleUniqueError(error);
        throw error;
    }
}

export async function archiveTag(id) {
    const tag = await getTag(id);
    if (tag.deletedAt) {
        throw new AppError(409, "A tag já está arquivada.");
    }
    return repository.archiveTag(id);
}

async function getTag(id) {
    const tag = await repository.getTagById(id);
    if (!tag) {
        throw new AppError(404, "Tag não encontrada.");
    }
    return tag;
}

async function ensureGroupExists(id) {
    const group = await groupRepository.getTagGroupById(id);
    if (!group || group.deletedAt || !group.active) {
        throw new AppError(422, "O grupo de tags selecionado não está disponível.", {
            groupId: "Selecione um grupo ativo."
        });
    }
}

async function ensureUniqueName(name, groupId, excludedId) {
    if (await repository.findByName(name, groupId, excludedId)) {
        throw new AppError(409, "Já existe uma tag com este nome no grupo.");
    }
}

function handleUniqueError(error) {
    if (error.code === "P2002") {
        throw new AppError(409, "Já existe uma tag com este nome no grupo.");
    }
}
