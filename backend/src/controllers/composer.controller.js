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

export async function updateComposerProfile(req, res) {
    return res.json(await service.updateComposerProfile(
        req.params.name,
        req.validatedBody
    ));
}

export async function updateComposerPhoto(req, res) {
    return res.json(await service.updateComposerPhoto(req.params.name, req.file));
}

export async function serveComposerPhoto(req, res, next) {
    const photoPath = await service.getComposerPhoto(req.params.name);
    return res.sendFile(photoPath, (error) => {
        if (error) next(error);
    });
}
