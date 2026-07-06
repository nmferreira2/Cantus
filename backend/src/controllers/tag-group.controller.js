import * as service from "../services/tag-group.service.js";

export async function getAllTagGroups(req, res) {
    return res.json(await service.getAllTagGroups({
        includeArchived: req.query.includeArchived === "true"
    }));
}

export async function createTagGroup(req, res) {
    return res.status(201).json(
        await service.createTagGroup(req.validatedBody)
    );
}

export async function updateTagGroup(req, res) {
    return res.json(
        await service.updateTagGroup(req.params.id, req.validatedBody)
    );
}

export async function deleteTagGroup(req, res) {
    await service.archiveTagGroup(req.params.id);
    return res.status(204).send();
}
