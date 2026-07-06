import * as repository from "../repositories/composer.repository.js";
import { AppError } from "../utils/app-error.js";

export function getComposers() {
    return repository.findAll();
}

export async function mergeComposers({ sources, name }) {
    const existing = await repository.findNames(sources);
    const existingNames = new Set(existing.map(({ composerName }) => composerName));
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

    const normalizedName = name.trim().toLocaleLowerCase("pt-PT");
    return {
        name,
        contributor,
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

function normalize(value) {
    return (value ?? "").trim().toLocaleLowerCase("pt-PT");
}
