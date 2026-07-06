import * as service from "../services/composer.service.js";

export async function getComposers(req, res) {
    return res.json(await service.getComposers());
}

export async function mergeComposers(req, res) {
    return res.json(await service.mergeComposers(req.validatedBody));
}

export async function getComposer(req, res) {
    return res.json(await service.getComposer(req.params.name));
}
