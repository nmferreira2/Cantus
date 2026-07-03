import * as service from "../services/setting.service.js";

export async function getSettings(req, res) {
    return res.json(await service.getSettings());
}

export async function updateSettings(req, res) {
    return res.json(await service.updateSettings(req.validatedBody));
}

export async function updateLogo(req, res) {
    return res.json(await service.updateLogo(req.file));
}

export async function serveLogo(req, res, next) {
    const logoPath = await service.getLogo();
    return res.sendFile(logoPath, (error) => {
        if (error) next(error);
    });
}
