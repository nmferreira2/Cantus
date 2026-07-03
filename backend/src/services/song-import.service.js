import { randomUUID } from "node:crypto";
import path from "node:path";

import * as attachmentRepository from "../repositories/attachment.repository.js";
import * as fileRepository from "../repositories/file.repository.js";
import { AppError } from "../utils/app-error.js";
import { getSongById } from "./song.service.js";

const PLACEHOLDER_EXTENSIONS = new Map([
    [".musicxml", "MusicXML"],
    [".mxl", "MusicXML"],
    [".xml", "MusicXML"],
    [".cho", "ChordPro"],
    [".chordpro", "ChordPro"]
]);

export async function importSongFile(songId, file) {
    await getSongById(songId);
    const importedFile = validateImport(file);
    const storageName = `${randomUUID()}${importedFile.extension}`;
    const relativePath = `song-imports/${storageName}`;

    await fileRepository.saveFile(relativePath, file.buffer);

    try {
        return await attachmentRepository.createAttachment({
            songId,
            originalName: path.basename(file.originalname),
            storageName,
            relativePath,
            mimeType: importedFile.mimeType,
            type: importedFile.type,
            size: file.size
        }, importedFile.lyrics);
    } catch (error) {
        await fileRepository.removeFile(relativePath);
        throw error;
    }
}

export async function getSongAttachment(songId, attachmentId) {
    await getSongById(songId);
    const attachment = await attachmentRepository.getAttachment(songId, attachmentId);

    if (!attachment) {
        throw new AppError(404, "Anexo não encontrado.");
    }

    try {
        const absolutePath = await fileRepository.getExistingFilePath(
            attachment.relativePath
        );
        return { ...attachment, absolutePath };
    } catch (error) {
        if (error.code === "ENOENT") {
            throw new AppError(404, "O ficheiro do anexo está em falta.");
        }
        throw error;
    }
}

function validateImport(file) {
    if (!file || !file.buffer || file.size === 0) {
        throw new AppError(400, "Escolha um ficheiro não vazio para importar.");
    }

    const extension = path.extname(file.originalname).toLocaleLowerCase();
    const placeholder = PLACEHOLDER_EXTENSIONS.get(extension);

    if (placeholder) {
        throw new AppError(501, `A importação ${placeholder} está preparada como formato futuro.`);
    }

    if (extension === ".pdf") {
        if (file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
            throw new AppError(415, "O ficheiro selecionado não é um PDF válido.");
        }

        return {
            extension,
            type: "PDF",
            mimeType: "application/pdf",
            lyrics: null
        };
    }

    if (extension === ".txt") {
        if (file.buffer.includes(0)) {
            throw new AppError(415, "O ficheiro TXT selecionado contém dados binários.");
        }

        let lyrics;
        try {
            lyrics = new TextDecoder("utf-8", { fatal: true }).decode(file.buffer).trim();
        } catch {
            throw new AppError(415, "A letra em TXT deve utilizar codificação UTF-8.");
        }

        if (!lyrics) {
            throw new AppError(422, "O ficheiro TXT da letra está vazio.");
        }

        return {
            extension,
            type: "TEXT",
            mimeType: "text/plain; charset=utf-8",
            lyrics
        };
    }

    throw new AppError(415, "Neste momento apenas podem ser importados ficheiros PDF e TXT.");
}
