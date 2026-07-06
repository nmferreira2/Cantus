import * as service from "../services/user.service.js";

export async function getUsers(req, res) {
    return res.json(await service.getUsers());
}

export async function createUser(req, res) {
    return res.status(201).json(await service.createUser(req.validatedBody));
}

export async function updateUser(req, res) {
    return res.json(
        await service.updateUser(req.params.id, req.validatedBody)
    );
}

export async function archiveUser(req, res) {
    await service.archiveUser(req.params.id, req.user);
    return res.status(204).send();
}
