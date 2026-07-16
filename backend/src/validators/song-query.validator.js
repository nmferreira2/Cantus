import { AppError } from "../utils/app-error.js";
import {
    SONG_SORT_FIELDS,
    SONG_STATUSES,
    SONG_TYPES
} from "../utils/song.constants.js";

export function validateSongQuery(req, res, next) {
    try {
        req.validatedQuery = parseSongQuery(req.query);
        return next();
    } catch (error) {
        return next(error);
    }
}

export function parseSongQuery(query = {}) {
    const errors = {};
    const parsed = {
        search: parseText(query.search, 100, "search", errors),
        page: parseInteger(query.page, 1, 1, Number.MAX_SAFE_INTEGER, "page", errors),
        pageSize: parseInteger(query.pageSize, 10000, 1, 10000, "pageSize", errors),
        sortBy: query.sortBy ?? "title",
        sortOrder: query.sortOrder ?? "asc",
        status: query.status ?? "current",
        songType: parseText(query.songType, 50, "songType", errors),
        language: parseText(query.language, 80, "language", errors),
        tagId: parseText(query.tagId, 100, "tagId", errors)
    };

    if (!SONG_SORT_FIELDS.includes(parsed.sortBy)) {
        errors.sortBy = "O campo de ordenação é inválido.";
    }

    if (!["asc", "desc"].includes(parsed.sortOrder)) {
        errors.sortOrder = "A ordem deve ser asc ou desc.";
    }

    if (!SONG_STATUSES.includes(parsed.status)) {
        errors.status = "O filtro de estado é inválido.";
    }

    if (parsed.songType && !SONG_TYPES.includes(parsed.songType)) {
        errors.songType = "O filtro de tipo de cântico é inválido.";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "A pesquisa de cânticos é inválida.", errors);
    }

    return parsed;
}

function parseText(value, maxLength, field, errors) {
    if (value === undefined || value === "") {
        return "";
    }

    if (typeof value !== "string") {
        errors[field] = `${field} deve ser texto.`;
        return "";
    }

    const normalized = value.trim();
    if (normalized.length > maxLength) {
        errors[field] = `${field} deve ter no máximo ${maxLength} caracteres.`;
    }

    return normalized;
}

function parseInteger(value, fallback, minimum, maximum, field, errors) {
    if (value === undefined || value === "") {
        return fallback;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
        errors[field] = `${field} deve ser um número inteiro entre ${minimum} e ${maximum}.`;
        return fallback;
    }

    return parsed;
}
