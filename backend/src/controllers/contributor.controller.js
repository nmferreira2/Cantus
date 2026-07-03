import * as service from "../services/contributor.service.js";

export async function getContributors(req, res) {
    return res.json(await service.getContributors(req.validatedQuery));
}

export async function getContributor(req, res) {
    return res.json(await service.getContributor(req.params.id));
}

export async function createContributor(req, res) {
    return res.status(201).json(await service.createContributor(req.validatedBody));
}

export async function updateContributor(req, res) {
    return res.json(
        await service.updateContributor(req.params.id, req.validatedBody)
    );
}

export async function archiveContributor(req, res) {
    await service.archiveContributor(req.params.id);
    return res.status(204).send();
}

export async function restoreContributor(req, res) {
    return res.json(await service.restoreContributor(req.params.id));
}
