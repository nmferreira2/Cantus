import { randomUUID } from "node:crypto";
import path from "node:path";

import * as fileRepository from "../repositories/file.repository.js";
import * as repository from "../repositories/score.repository.js";
import { AppError } from "../utils/app-error.js";
import { paginatedResponse } from "../utils/pagination.js";
import { getSongById } from "./song.service.js";

export async function getScores(query) {
    const result = await repository.findAll(query);
    const response = paginatedResponse(result.data, result.total, query);
    if (response.pagination.page !== query.page && result.total > 0) {
        return getScores({ ...query, page: response.pagination.page });
    }
    return response;
}

export async function getScore(id) {
    const score = await repository.findById(id);
    if (!score) {
        throw new AppError(404, "Partitura não encontrada.");
    }
    return score;
}

export async function createScore(data, file) {
    await getSongById(data.songId);
    const document = validateScoreFile(file);
    const stored = await storeDocument(file, document.extension);

    try {
        return await repository.createWithVersion({
            ...data,
            format: document.format
        }, {
            originalName: path.basename(file.originalname),
            ...stored,
            mimeType: document.mimeType,
            size: file.size
        });
    } catch (error) {
        await fileRepository.removeFile(stored.relativePath);
        throw error;
    }
}

export async function updateScore(id, data) {
    await getScore(id);
    return repository.update(id, data);
}

export async function addScoreVersion(id, file) {
    const score = await getScore(id);
    const document = validateScoreFile(file);
    if (document.format !== score.format) {
        throw new AppError(
            422,
            `Esta partitura utiliza ${score.format}; as novas versões devem utilizar o mesmo formato.`
        );
    }
    const stored = await storeDocument(file, document.extension);

    try {
        return await repository.addVersion(id, {
            originalName: path.basename(file.originalname),
            ...stored,
            mimeType: document.mimeType,
            size: file.size
        });
    } catch (error) {
        await fileRepository.removeFile(stored.relativePath);
        throw error;
    }
}

export async function getScoreVersionFile(scoreId, versionId) {
    await getScore(scoreId);
    const version = await repository.findVersion(scoreId, versionId);
    if (!version) {
        throw new AppError(404, "Versão da partitura não encontrada.");
    }
    try {
        return {
            ...version,
            absolutePath: await fileRepository.getExistingFilePath(version.relativePath)
        };
    } catch (error) {
        if (error.code === "ENOENT") {
            throw new AppError(404, "O ficheiro da partitura está em falta.");
        }
        throw error;
    }
}

export async function archiveScore(id) {
    await getScore(id);
    return repository.archive(id);
}

export async function restoreScore(id) {
    const score = await repository.findById(id, true);
    if (!score) {
        throw new AppError(404, "Partitura não encontrada.");
    }
    if (!score.deletedAt) {
        throw new AppError(409, "A partitura não está arquivada.");
    }
    return repository.restore(id);
}

function validateScoreFile(file) {
    if (!file?.buffer || file.size === 0) {
        throw new AppError(400, "Escolha um ficheiro de partitura não vazio.");
    }
    const extension = path.extname(file.originalname).toLocaleLowerCase();
    if (extension === ".pdf") {
        if (file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
            throw new AppError(415, "O ficheiro selecionado não é um PDF válido.");
        }
        return { format: "PDF", extension, mimeType: "application/pdf" };
    }
    if ([".musicxml", ".xml"].includes(extension)) {
        const text = file.buffer.toString("utf8", 0, Math.min(file.size, 4096));
        if (!/<score-(partwise|timewise)[\s>]/i.test(text)) {
            throw new AppError(415, "O ficheiro selecionado não é um MusicXML válido.");
        }
        return {
            format: "MUSICXML",
            extension,
            mimeType: "application/vnd.recordare.musicxml+xml"
        };
    }
    if (extension === ".mxl") {
        if (file.buffer.subarray(0, 2).toString("ascii") !== "PK") {
            throw new AppError(415, "O ficheiro selecionado não é um MusicXML comprimido válido.");
        }
        return {
            format: "MUSICXML",
            extension,
            mimeType: "application/vnd.recordare.musicxml"
        };
    }
    throw new AppError(415, "As partituras devem ser ficheiros PDF, MusicXML ou MXL.");
}

async function storeDocument(file, extension) {
    const storageName = `${randomUUID()}${extension}`;
    const relativePath = `scores/${storageName}`;
    await fileRepository.saveFile(relativePath, file.buffer);
    return { storageName, relativePath };
}
