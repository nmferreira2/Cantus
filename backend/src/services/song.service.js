import * as repository from "../repositories/song.repository.js";
import * as fileRepository from "../repositories/file.repository.js";
import * as tagRepository from "../repositories/tag.repository.js";
import { AppError } from "../utils/app-error.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const SONG_TYPE_LABELS = Object.freeze({
    ENTRANCE: "Entrada",
    PENITENTIAL_ACT: "Ato Penitencial",
    GLORIA: "Glória",
    RESPONSORIAL_PSALM: "Salmo Responsorial",
    GOSPEL_ACCLAMATION: "Aclamação ao Evangelho",
    CREED: "Credo",
    OFFERTORY: "Ofertório",
    HOLY: "Santo",
    LAMB_OF_GOD: "Cordeiro de Deus",
    COMMUNION: "Comunhão",
    THANKSGIVING: "Ação de Graças",
    FINAL: "Final",
    OTHER: "Outro"
});

export async function getAllSongs(query) {
    const result = await repository.getAllSongs(query);
    const totalPages = Math.max(1, Math.ceil(result.total / query.pageSize));
    const page = Math.min(query.page, totalPages);

    if (page !== query.page && result.total > 0) {
        return getAllSongs({ ...query, page });
    }

    return {
        data: result.data,
        pagination: {
            page,
            pageSize: query.pageSize,
            totalItems: result.total,
            totalPages
        },
        sort: {
            by: query.sortBy,
            order: query.sortOrder
        },
        filters: {
            search: query.search,
            status: query.status,
            songType: query.songType,
            language: query.language,
            tagId: query.tagId
        }
    };
}

export async function generateSongListPdf(query) {
    const songs = await repository.getSongsForExport({
        ...query,
        status: query.status || "current"
    });
    const document = await PDFDocument.create();
    const font = await document.embedFont(StandardFonts.Helvetica);
    const bold = await document.embedFont(StandardFonts.HelveticaBold);
    let page;
    let y = 0;

    const newPage = () => {
        page = document.addPage([841.89, 595.28]);
        y = 535;
        page.drawText("Listagem de cânticos", {
            x: 40,
            y,
            size: 18,
            font: bold,
            color: rgb(0.12, 0.13, 0.16)
        });
        page.drawText(`${songs.length} ${songs.length === 1 ? "cântico" : "cânticos"}`, {
            x: 40,
            y: y - 20,
            size: 9,
            font,
            color: rgb(0.43, 0.45, 0.5)
        });
        y -= 48;
        drawHeader(page, bold, y);
        y -= 20;
    };

    newPage();

    songs.forEach((song, index) => {
        const titleLines = wrapText(song.title, 42);
        const composerLines = wrapText(contributorText(song), 34);
        const tagLines = wrapText(song.tags.map(({ name }) => name).join(", ") || "—", 56);
        const typeLines = wrapText(typeText(song.songTypes), 28);
        const lineCount = Math.max(
            titleLines.length,
            composerLines.length,
            tagLines.length,
            typeLines.length
        );
        const rowHeight = Math.max(30, lineCount * 12 + 12);

        if (y - rowHeight < 35) {
            newPage();
        }

        page.drawLine({
            start: { x: 40, y: y + 8 },
            end: { x: 802, y: y + 8 },
            thickness: 0.5,
            color: rgb(0.9, 0.91, 0.93)
        });
        drawLines(page, titleLines, 48, y, font, index + 1);
        drawLines(page, composerLines, 280, y, font);
        drawLines(page, typeLines, 460, y, font);
        drawLines(page, tagLines, 585, y, font);
        y -= rowHeight;
    });

    if (songs.length === 0) {
        page.drawText("Não foram encontrados cânticos para exportar.", {
            x: 40,
            y,
            size: 11,
            font,
            color: rgb(0.43, 0.45, 0.5)
        });
    }

    return {
        buffer: Buffer.from(await document.save()),
        filename: `canticos-${new Date().toISOString().slice(0, 10)}.pdf`
    };
}

export async function createSong(data) {
    const { tagIds, songTypes, ...songData } = data;
    await Promise.all([
        ensureUniqueSong(songData),
        ensureValidTags(tagIds)
    ]);
    return repository.createSong(songData, tagIds, songTypes);
}

function drawHeader(page, font, y) {
    [
        ["Cântico", 48],
        ["Compositor", 280],
        ["Tipos", 460],
        ["Tags", 585]
    ].forEach(([label, x]) => {
        page.drawText(label, {
            x,
            y,
            size: 8,
            font,
            color: rgb(0.4, 0.35, 0.77)
        });
    });
}

function drawLines(page, lines, x, y, font, number) {
    const prefix = number ? `${number}. ` : "";
    lines.forEach((line, index) => {
        page.drawText(pdfSafeText(`${index === 0 ? prefix : ""}${line}`), {
            x,
            y: y - (index * 12),
            size: 9,
            font,
            color: rgb(0.13, 0.15, 0.19)
        });
    });
}

function contributorText(song) {
    return [
        song.composerName,
        song.arrangerName ? `Arr.: ${song.arrangerName}` : "",
        song.harmonizerName ? `Harm.: ${song.harmonizerName}` : ""
    ].filter(Boolean).join(" · ");
}

function typeText(types = []) {
    return types.map((type) => SONG_TYPE_LABELS[type] ?? "Outro").join(", ") || "—";
}

function wrapText(value, maxLength) {
    const words = String(value || "—").split(/\s+/);
    const lines = [];
    let line = "";
    words.forEach((word) => {
        if (`${line} ${word}`.trim().length > maxLength && line) {
            lines.push(line);
            line = word;
            return;
        }
        line = `${line} ${word}`.trim();
    });
    if (line) {
        lines.push(line);
    }
    return lines.length ? lines : ["—"];
}

function pdfSafeText(value) {
    return String(value).replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, "-");
}

export async function getSongById(id) {
    const song = await repository.getSongById(id);

    if (!song) {
        throw new AppError(404, "Cântico não encontrado.");
    }

    return song;
}

export async function updateSong(id, data) {
    const { tagIds, songTypes, ...songData } = data;
    await getSongById(id);
    await Promise.all([
        ensureUniqueSong(songData, id),
        ensureValidTags(tagIds)
    ]);
    return repository.updateSong(id, songData, tagIds, songTypes);
}

export async function deleteSong(id) {
    await getSongById(id);
    return repository.softDeleteSong(id);
}

export async function permanentlyDeleteSong(id) {
    const song = await repository.getSongDeletionData(id);

    if (!song) {
        throw new AppError(404, "Cântico não encontrado.");
    }

    if (!song.deletedAt) {
        throw new AppError(
            409,
            "Arquive o cântico antes de o eliminar definitivamente."
        );
    }

    const filePaths = [
        ...song.attachments.map(({ relativePath }) => relativePath),
        ...song.scores.flatMap(({ versions }) => (
            versions.map(({ relativePath }) => relativePath)
        ))
    ];

    await repository.hardDeleteSong(id);

    const removals = await Promise.allSettled(
        filePaths.map((relativePath) => fileRepository.removeFile(relativePath))
    );
    removals.forEach((result, index) => {
        if (result.status === "rejected") {
            console.error(
                `Não foi possível remover o ficheiro órfão ${filePaths[index]}.`,
                result.reason
            );
        }
    });
}

export async function restoreSong(id) {
    const song = await repository.getSongIncludingArchived(id);

    if (!song) {
        throw new AppError(404, "Cântico não encontrado.");
    }

    if (!song.deletedAt) {
        throw new AppError(409, "O cântico não está arquivado.");
    }

    await ensureUniqueSong(song, id);
    return repository.restoreSong(id);
}

async function ensureUniqueSong(song, excludedId) {
    const duplicate = await repository.getSongByIdentity(
        song.title,
        song.composerName,
        song.arrangerName,
        excludedId
    );

    if (duplicate) {
        throw new AppError(
            409,
            "Já existe um cântico com o mesmo título, compositor e arranjo.",
            {
                title: "Altere o título, o compositor ou o arranjo."
            }
        );
    }
}

async function ensureValidTags(tagIds) {
    if (tagIds.length === 0) {
        return;
    }

    const count = await tagRepository.countTagsByIds(tagIds);
    if (count !== tagIds.length) {
        throw new AppError(422, "Uma ou mais tags selecionadas não existem.", {
            tagIds: "Selecione tags válidas."
        });
    }
}
