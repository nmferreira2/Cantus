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
