import { randomUUID } from "node:crypto";
import path from "node:path";

import * as fileRepository from "../repositories/file.repository.js";
import * as repository from "../repositories/setting.repository.js";
import { AppError } from "../utils/app-error.js";

export async function getSettings() {
    const settings = await repository.get();
    return present(settings);
}

export async function updateSettings(data) {
    return present(await repository.update(data));
}

export async function updateLogo(file) {
    const image = validateLogo(file);
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

function validateLogo(file) {
    if (!file?.buffer || file.size === 0) {
        throw new AppError(400, "Escolha uma imagem de logótipo não vazia.");
    }
    const extension = path.extname(file.originalname).toLocaleLowerCase();
    const signatures = {
        ".png": file.buffer.subarray(0, 8).equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        ),
        ".jpg": file.buffer[0] === 0xff && file.buffer[1] === 0xd8,
        ".jpeg": file.buffer[0] === 0xff && file.buffer[1] === 0xd8,
        ".webp": file.buffer.subarray(0, 4).toString("ascii") === "RIFF"
            && file.buffer.subarray(8, 12).toString("ascii") === "WEBP"
    };
    if (!signatures[extension]) {
        throw new AppError(415, "O logótipo deve ser uma imagem PNG, JPEG ou WebP válida.");
    }
    return { extension };
}
