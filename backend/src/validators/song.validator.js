import { AppError } from "../utils/app-error.js";
import { SONG_FIELDS, SONG_TYPES } from "../utils/song.constants.js";

const TEXT_LIMITS = Object.freeze({
    title: 200,
    subtitle: 200,
    composerName: 200,
    arrangerName: 200,
    harmonizerName: 200,
    originalKey: 20,
    language: 80,
    lyrics: 100_000,
    notes: 20_000
});

export function validateSong(req, res, next) {
    try {
        req.validatedBody = parseSong(req.body);
        return next();
    } catch (error) {
        return next(error);
    }
}

export function parseSong(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new AppError(400, "O corpo do pedido deve ser um objeto JSON.");
    }

    const unknownFields = Object.keys(payload).filter(
        (field) => !SONG_FIELDS.includes(field)
    );

    if (unknownFields.length > 0) {
        throw new AppError(400, "O pedido contém campos não suportados.", {
            fields: unknownFields
        });
    }

    const errors = {};
    const song = {};

    song.title = parseRequiredText(payload.title, "title", TEXT_LIMITS.title, errors);
    song.composerName = parseRequiredText(
        payload.composerName,
        "composerName",
        TEXT_LIMITS.composerName,
        errors
    );

    for (const field of [
        "subtitle",
        "arrangerName",
        "harmonizerName",
        "originalKey",
        "language",
        "lyrics",
        "notes"
    ]) {
        song[field] = parseOptionalText(
            payload[field],
            field,
            TEXT_LIMITS[field],
            errors
        );
    }

    song.songType = payload.songType ?? "OTHER";
    if (typeof song.songType !== "string" || !SONG_TYPES.includes(song.songType)) {
        errors.songType = "O tipo de cântico é inválido.";
    }

    song.active = payload.active ?? true;
    if (typeof song.active !== "boolean") {
        errors.active = "O estado ativo deve ser verdadeiro ou falso.";
    }

    song.tagIds = parseTagIds(payload.tagIds, errors);

    if (Object.keys(errors).length > 0) {
        throw new AppError(422, "Não foi possível validar o cântico.", errors);
    }

    return song;
}

function parseTagIds(value, errors) {
    if (value === undefined) {
        return [];
    }

    if (!Array.isArray(value) || value.some((id) => typeof id !== "string")) {
        errors.tagIds = "As tags devem ser uma lista de identificadores.";
        return [];
    }

    const tagIds = [...new Set(value.map((id) => id.trim()).filter(Boolean))];

    if (tagIds.length > 50) {
        errors.tagIds = "Um cântico não pode ter mais de 50 tags.";
    }

    return tagIds;
}

function parseRequiredText(value, field, maxLength, errors) {
    if (typeof value !== "string" || value.trim() === "") {
        errors[field] = field === "composerName"
            ? "O compositor é obrigatório."
            : "O título é obrigatório.";
        return "";
    }

    return parseText(value, field, maxLength, errors);
}

function parseOptionalText(value, field, maxLength, errors) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    if (typeof value !== "string") {
        errors[field] = `${toLabel(field)} deve ser texto.`;
        return null;
    }

    return parseText(value, field, maxLength, errors);
}

function parseText(value, field, maxLength, errors) {
    const normalized = value.trim();

    if (normalized.length > maxLength) {
        errors[field] = `${toLabel(field)} deve ter no máximo ${maxLength} caracteres.`;
    }

    return normalized;
}

function toLabel(field) {
    const labels = {
        title: "O título",
        composerName: "O compositor",
        arrangerName: "O arranjo",
        harmonizerName: "A harmonização",
        originalKey: "A tonalidade original",
        language: "O idioma",
        lyrics: "A letra",
        notes: "As observações"
    };
    return labels[field] ?? field;
}
