import * as service from "../services/tag.service.js";

export async function getAllTags(req, res) {
    return res.json(await service.getAllTags());
}

export async function createTag(req, res) {
    return res.status(201).json(await service.createTag(req.validatedBody));
}
