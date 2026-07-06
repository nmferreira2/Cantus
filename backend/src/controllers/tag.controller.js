import * as service from "../services/tag.service.js";

export async function getAllTags(req, res) {
    return res.json(await service.getAllTags({
        groupId: req.query.groupId || undefined,
        includeArchived: req.query.includeArchived === "true"
    }));
}

export async function createTag(req, res) {
    return res.status(201).json(await service.createTag(req.validatedBody));
}

export async function updateTag(req, res) {
    return res.json(await service.updateTag(req.params.id, req.validatedBody));
}

export async function deleteTag(req, res) {
    await service.archiveTag(req.params.id);
    return res.status(204).send();
}
