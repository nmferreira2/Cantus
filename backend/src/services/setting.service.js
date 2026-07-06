import { randomUUID } from "node:crypto";

import * as fileRepository from "../repositories/file.repository.js";
import * as repository from "../repositories/setting.repository.js";
import { AppError } from "../utils/app-error.js";
import { validateImageUpload } from "../utils/image-upload.js";

export async function getSettings() {
    const settings = await repository.get();
    return present(settings);
}

export async function updateSettings(data) {
    return present(await repository.update(data));
}

export async function updateLogo(file) {
    const image = validateImageUpload(file, "imagem de logótipo");
    const storageName = `${randomUUID()}${image.extension}`;
    const relativePath = `settings/${storageName}`;
    await fileRepository.saveFile(relativePath, file.buffer);
    const previous = await repository.get();

    let settings;
    try {
        settings = await repository.updateLogo(relativePath);
    } catch (error) {
        await fileRepository.removeFile(relativePath);
        throw error;
    }

    if (previous?.logoPath) {
        await fileRepository.removeFile(previous.logoPath).catch(() => {});
    }

    return present(settings);
}

export async function getLogo() {
    const settings = await repository.get();
    if (!settings?.logoPath) {
        throw new AppError(404, "Logótipo da aplicação não encontrado.");
    }
    try {
        return await fileRepository.getExistingFilePath(settings.logoPath);
    } catch (error) {
        if (error.code === "ENOENT") {
            throw new AppError(404, "O ficheiro do logótipo está em falta.");
        }
        throw error;
    }
}

function present(settings) {
    return {
        ...settings,
        logoPath: undefined,
        logoUrl: settings?.logoPath ? "/api/settings/logo" : null
    };
}
