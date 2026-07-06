import * as repository from "../repositories/tag-group.repository.js";
import { AppError } from "../utils/app-error.js";
import { uniqueSlug } from "../utils/slug.js";

export function getAllTagGroups(filters) {
    return repository.getAllTagGroups(filters);
}

export async function createTagGroup(data) {
    await ensureUniqueName(data.name);
    try {
        return await repository.createTagGroup({
            ...data,
            slug: uniqueSlug(data.name)
        });
    } catch (error) {
        handleUniqueError(error);
        throw error;
    }
}

export async function updateTagGroup(id, data) {
    const group = await getTagGroup(id);
    if (data.name) {
        await ensureUniqueName(data.name, id);
    }

    try {
        return await repository.updateTagGroup(id, {
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

export async function archiveTagGroup(id) {
    const group = await getTagGroup(id);
    if (group.deletedAt) {
        throw new AppError(409, "O grupo de tags já está arquivado.");
    }
    return repository.archiveTagGroup(id);
}

async function getTagGroup(id) {
    const group = await repository.getTagGroupById(id);
    if (!group) {
        throw new AppError(404, "Grupo de tags não encontrado.");
    }
    return group;
}

async function ensureUniqueName(name, excludedId) {
    if (await repository.findTagGroupByName(name, excludedId)) {
        throw new AppError(409, "Já existe um grupo de tags com este nome.");
    }
}

function handleUniqueError(error) {
    if (error.code === "P2002") {
        throw new AppError(409, "Já existe um grupo de tags com este nome.");
    }
}
