import { randomUUID } from "node:crypto";

import * as repository from "../repositories/composer.repository.js";
import * as fileRepository from "../repositories/file.repository.js";
import { AppError } from "../utils/app-error.js";
import { validateImageUpload } from "../utils/image-upload.js";

export async function getComposers() {
    return (await repository.findAll()).map(({ contributor, ...composer }) => ({
        ...composer,
        biography: contributor?.biography ?? null,
        photoUrl: contributor?.photoPath
            ? composerPhotoUrl(composer.name)
            : null
    }));
}

export async function mergeComposers({ sources, name }) {
    const existing = await repository.findNames(sources);
    const existingNames = new Set(existing.map(({ name: existingName }) => existingName));
    const missing = sources.filter((source) => !existingNames.has(source));

    if (missing.length > 0) {
        throw new AppError(
            409,
            "Um ou mais nomes de compositor já não existem.",
            { sources: missing }
        );
    }

    const result = await repository.mergeNames(sources, name);
    return {
        name,
        mergedNames: sources.filter((source) => source !== name),
        updatedSongs: result.count
    };
}

export async function getComposer(name) {
    const [contributor, songs] = await Promise.all([
        repository.findContributorByName(name),
        repository.findSongsByName(name)
    ]);
    if (!contributor && songs.length === 0) {
        throw new AppError(404, "Compositor não encontrado.");
    }

    const normalizedName = normalize(name);
    return {
        name,
        contributor: contributor
            ? {
                ...contributor,
                photoPath: undefined,
                photoUrl: contributor.photoPath ? composerPhotoUrl(name) : null
            }
            : null,
        songs: songs.map((song) => ({
            ...song,
            roles: [
                normalize(song.composerName) === normalizedName ? "COMPOSER" : null,
                normalize(song.arrangerName) === normalizedName ? "ARRANGER" : null,
                normalize(song.harmonizerName) === normalizedName ? "HARMONIZER" : null
            ].filter(Boolean)
        }))
    };
}

export async function updateComposerProfile(name, data) {
    await ensureComposerExists(name);
    const profile = await ensureProfile(name);
    await repository.updateComposerProfile(profile.id, data);
    return getComposer(name);
}

export async function updateComposerPhoto(name, file) {
    await ensureComposerExists(name);
    const image = validateImageUpload(file, "fotografia");
    const profile = await ensureProfile(name);
    const relativePath = `contributors/${randomUUID()}${image.extension}`;
    await fileRepository.saveFile(relativePath, file.buffer);

    try {
        await repository.updateComposerProfile(profile.id, {
            photoPath: relativePath
        });
    } catch (error) {
        await fileRepository.removeFile(relativePath);
        throw error;
    }

    if (profile.photoPath) {
        await fileRepository.removeFile(profile.photoPath).catch(() => {});
    }
    return getComposer(name);
}

export async function getComposerPhoto(name) {
    const contributor = await repository.findContributorByName(name);
    if (!contributor?.photoPath) {
        throw new AppError(404, "Fotografia do compositor não encontrada.");
    }
    try {
        return await fileRepository.getExistingFilePath(contributor.photoPath);
    } catch (error) {
        if (error.code === "ENOENT") {
            throw new AppError(404, "O ficheiro da fotografia está em falta.");
        }
        throw error;
    }
}

async function ensureComposerExists(name) {
    if ((await repository.findSongsByName(name)).length === 0) {
        throw new AppError(404, "Compositor não encontrado.");
    }
}

async function ensureProfile(name) {
    return await repository.findContributorByName(name)
        ?? repository.createComposerProfile(name);
}

function composerPhotoUrl(name) {
    return `/api/composers/${encodeURIComponent(name)}/photo`;
}

function normalize(value) {
    return (value ?? "").trim().toLocaleLowerCase("pt-PT");
}
