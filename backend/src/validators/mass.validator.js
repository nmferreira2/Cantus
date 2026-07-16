import { AppError } from "../utils/app-error.js";
import { MASS_FIELDS, MASS_SONG_SLOTS } from "../utils/mass.constants.js";

export function validateMass(req, res, next) {
    try {
        req.validatedBody = parseMass(req.body);
        return next();
    } catch (error) {
        return next(error);
    }
}

export function validateMassQuery(req, res, next) {
    try {
        req.validatedQuery = parseMassQuery(req.query);
        return next();
    } catch (error) {
        return next(error);
    }
}

export function validateCalendarQuery(req, res, next) {
    try {
        req.validatedQuery = parseCalendarQuery(req.query);
        return next();
    } catch (error) {
        return next(error);
    }
}

export function parseMass(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new AppError(400, "O corpo do pedido deve ser um objeto.");
    }
    const unsupported = Object.keys(payload).filter(
        (field) => !MASS_FIELDS.includes(field)
    );
    if (unsupported.length > 0) {
        throw new AppError(400, "O pedido contém campos não suportados.", {
            fields: unsupported
        });
    }

    const errors = {};
    const startsAt = new Date(payload.startsAt);
    if (!payload.startsAt || Number.isNaN(startsAt.getTime())) {
        errors.startsAt = "É necessária uma data e hora válidas.";
    }
    const church = optionalText(payload.church, "church", 200, errors)
        ?? "S. Salvador de Fornelos";
    const active = payload.active ?? true;
    if (typeof active !== "boolean") {
        errors.active = "O estado ativo deve ser verdadeiro ou falso.";
    }
    const songs = [
        ...parseSongs(payload.songs, errors),
        ...parseExtraSongs(payload.extraSongs, errors)
    ];

    const data = {
        startsAt,
        church,
        celebrationId: optionalText(payload.celebrationId, "celebrationId", 100, errors),
        celebrationName: optionalText(
            payload.celebrationName,
            "celebrationName",
            200,
            errors
        ),
        seasonId: optionalText(payload.seasonId, "seasonId", 100, errors),
        presider: optionalText(payload.presider, "presider", 200, errors),
        choir: optionalText(payload.choir, "choir", 200, errors),
        comments: optionalText(payload.comments, "comments", 20_000, errors),
        active,
        songs
    };

    if (Object.keys(errors).length > 0) {
        throw new AppError(422, "Não foi possível validar a missa.", errors);
    }
    return data;
}

export function parseMassQuery(query = {}) {
    const errors = {};
    const parsed = {
        search: typeof query.search === "string" ? query.search.trim().slice(0, 100) : "",
        page: integer(query.page, 1, 1, Number.MAX_SAFE_INTEGER, "page", errors),
        pageSize: integer(query.pageSize, 10, 1, 100, "pageSize", errors),
        sortBy: query.sortBy ?? "date",
        sortOrder: query.sortOrder ?? "desc",
        status: query.status ?? "current",
        seasonId: typeof query.seasonId === "string" ? query.seasonId : ""
    };
    if (!["date", "celebration", "church", "season", "songs", "status"].includes(parsed.sortBy)) {
        errors.sortBy = "O campo de ordenação é inválido.";
    }
    if (!["asc", "desc"].includes(parsed.sortOrder)) {
        errors.sortOrder = "A ordem é inválida.";
    }
    if (!["current", "upcoming", "past", "archived"].includes(parsed.status)) {
        errors.status = "O filtro de estado é inválido.";
    }
    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "A pesquisa de missas é inválida.", errors);
    }
    return parsed;
}

export function parseCalendarQuery(query = {}) {
    const now = new Date();
    const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const from = query.from ? new Date(query.from) : defaultFrom;
    const to = query.to ? new Date(query.to) : defaultTo;

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
        throw new AppError(400, "O intervalo de datas do calendário é inválido.");
    }
    const maximumRange = 366 * 24 * 60 * 60 * 1000;
    if (to - from > maximumRange) {
        throw new AppError(400, "O intervalo do calendário não pode exceder um ano.");
    }
    return { from, to };
}

function parseSongs(value, errors) {
    if (value === undefined || value === null) {
        return [];
    }
    if (typeof value !== "object" || Array.isArray(value)) {
        errors.songs = "Os cânticos devem estar associados a momentos da missa.";
        return [];
    }
    const invalidSlots = Object.keys(value).filter(
        (slot) => !MASS_SONG_SLOTS.includes(slot)
    );
    if (invalidSlots.length > 0) {
        errors.songs = "Um ou mais momentos musicais da missa são inválidos.";
    }
    return Object.entries(value)
        .filter(([, songId]) => songId)
        .map(([slot, songId]) => {
            if (typeof songId !== "string") {
                errors.songs = "Os identificadores dos cânticos devem ser texto.";
            }
            return { slot, songId, position: 0, label: null };
        });
}

function parseExtraSongs(value, errors) {
    if (value === undefined || value === null) {
        return [];
    }
    if (!Array.isArray(value)) {
        errors.extraSongs = "Os cânticos extra devem estar numa lista.";
        return [];
    }
    if (value.length > 20) {
        errors.extraSongs = "Não pode adicionar mais de 20 cânticos extra.";
    }

    return value
        .map((item, index) => {
            if (!item || typeof item !== "object" || Array.isArray(item)) {
                errors.extraSongs = "Cada cântico extra deve ter dados válidos.";
                return null;
            }
            const songId = optionalText(
                item.songId,
                `extraSongs.${index}.songId`,
                100,
                errors
            );
            const label = optionalText(
                item.label,
                `extraSongs.${index}.label`,
                100,
                errors
            );
            return songId
                ? { slot: "EXTRA", songId, label, position: index }
                : null;
        })
        .filter(Boolean);
}

function optionalText(value, field, maximum, errors) {
    if (value === undefined || value === null || value === "") {
        return null;
    }
    if (typeof value !== "string") {
        errors[field] = `${fieldLabel(field)} deve ser texto.`;
        return null;
    }
    const normalized = value.trim();
    if (normalized.length > maximum) {
        errors[field] = `${fieldLabel(field)} deve ter no máximo ${maximum} caracteres.`;
    }
    return normalized || null;
}

function integer(value, fallback, minimum, maximum, field, errors) {
    if (value === undefined || value === "") {
        return fallback;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
        errors[field] = `${field} é inválido.`;
        return fallback;
    }
    return parsed;
}

function fieldLabel(field) {
    return {
        church: "A igreja",
        celebrationId: "A celebração",
        celebrationName: "A celebração",
        seasonId: "O tempo litúrgico",
        presider: "O presidente",
        choir: "O coro",
        comments: "As observações"
    }[field] ?? field;
}
