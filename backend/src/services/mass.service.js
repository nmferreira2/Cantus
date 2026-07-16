import * as repository from "../repositories/mass.repository.js";
import * as fileRepository from "../repositories/file.repository.js";
import { AppError } from "../utils/app-error.js";
import { paginatedResponse } from "../utils/pagination.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
    CELEBRATION_PDF_SLOTS,
    MASS_SONG_SLOTS
} from "../utils/mass.constants.js";

export async function getMasses(query) {
    const result = await repository.findAll(query);
    const response = paginatedResponse(result.data, result.total, query);
    if (response.pagination.page !== query.page && result.total > 0) {
        return getMasses({ ...query, page: response.pagination.page });
    }
    return {
        ...response,
        sort: {
            by: query.sortBy,
            order: query.sortOrder
        }
    };
}

export function getCalendar(query) {
    return repository.findCalendar(query.from, query.to);
}

export async function getMass(id) {
    const mass = await repository.findById(id);
    if (!mass) {
        throw new AppError(404, "Missa não encontrada.");
    }
    return mass;
}

export async function getReferences() {
    const [seasons, celebrations] = await repository.getReferences();
    return { seasons, celebrations };
}

export async function createMass(payload) {
    const { songs, ...data } = await validateReferences(payload);
    return repository.create(data, songs);
}

export async function updateMass(id, payload) {
    await getMass(id);
    const { songs, ...data } = await validateReferences(payload);
    return repository.update(id, data, songs);
}

export async function archiveMass(id) {
    await getMass(id);
    return repository.archive(id);
}

export async function restoreMass(id) {
    const mass = await repository.findById(id, true);
    if (!mass) {
        throw new AppError(404, "Missa não encontrada.");
    }
    if (!mass.deletedAt) {
        throw new AppError(409, "A missa não está arquivada.");
    }
    return repository.restore(id);
}

export async function generateCelebrationPdf(id) {
    const mass = await repository.findForCelebrationPdf(id);
    if (!mass) {
        throw new AppError(404, "Missa não encontrada.");
    }

    const bySlot = new Map(mass.songs.map((item) => [item.slot, item.song]));
    const output = await PDFDocument.create();

    for (const slot of CELEBRATION_PDF_SLOTS) {
        const song = bySlot.get(slot);
        if (!song) {
            continue;
        }

        const score = selectCelebrationScore(song.scores);
        const version = score?.versions[0];
        if (!version) {
            await addMissingScorePage(output, slot, song.title);
            continue;
        }

        try {
            const source = await PDFDocument.load(
                await fileRepository.readStoredFile(version.relativePath)
            );
            const pages = await output.copyPages(source, source.getPageIndices());
            pages.forEach((page) => output.addPage(page));
        } catch {
            throw new AppError(
                422,
                `Não foi possível incorporar a partitura PDF de “${song.title}”.`
            );
        }
    }

    if (output.getPageCount() === 0) {
        throw new AppError(
            422,
            "O planeamento não contém cânticos com partituras disponíveis."
        );
    }

    return {
        buffer: Buffer.from(await output.save()),
        filename: celebrationFilename(mass)
    };
}

export async function generateCelebrationText(id) {
    const mass = await getMass(id);
    const bySlot = new Map(mass.songs.map((item) => [item.slot, item.song]));
    const lines = [
        mass.celebration?.name || "Missa",
        formatTextDate(mass.startsAt),
        mass.church ? `Igreja: ${mass.church}` : "",
        mass.season?.name ? `Tempo litúrgico: ${mass.season.name}` : "",
        mass.presider ? `Presidente: ${mass.presider}` : "",
        mass.choir ? `Coro: ${mass.choir}` : "",
        "",
        "Plano musical"
    ].filter((line) => line !== "");

    MASS_SONG_SLOTS.forEach((slot) => {
        const song = bySlot.get(slot);
        lines.push(`${slotLabel(slot)} - ${song ? songText(song) : "Sem cântico selecionado"}`);
    });

    if (mass.comments) {
        lines.push("", "Observações", mass.comments);
    }

    return {
        content: `${lines.join("\n")}\n`,
        filename: celebrationFilename(mass).replace(/\.pdf$/i, ".txt")
    };
}

function selectCelebrationScore(scores) {
    return scores.find(({ category }) => category === "CHOIR") ?? scores[0] ?? null;
}

async function addMissingScorePage(document, slot, title) {
    const page = document.addPage([595.28, 841.89]);
    const font = await document.embedFont(StandardFonts.Helvetica);
    const bold = await document.embedFont(StandardFonts.HelveticaBold);
    page.drawText(slotLabel(slot), {
        x: 56,
        y: 760,
        size: 14,
        font,
        color: rgb(0.4, 0.4, 0.45)
    });
    page.drawText(pdfSafeText(title), {
        x: 56,
        y: 720,
        size: 22,
        font: bold,
        color: rgb(0.12, 0.13, 0.16),
        maxWidth: 480
    });
    page.drawText("Sem partitura PDF disponível.", {
        x: 56,
        y: 675,
        size: 12,
        font,
        color: rgb(0.45, 0.47, 0.52)
    });
}

function pdfSafeText(value) {
    return value.replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, "?");
}

function celebrationFilename(mass) {
    const date = mass.startsAt.toISOString().slice(0, 10);
    const name = (mass.celebration?.name || "celebracao")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .toLocaleLowerCase();
    return `${date}-${name || "celebracao"}.pdf`;
}

function slotLabel(slot) {
    return {
        ENTRANCE: "Entrada",
        PENITENTIAL: "Ato Penitencial",
        ASPERSION: "Rito da Aspersão",
        GLORIA: "Glória",
        PSALM: "Salmo",
        ALLELUIA: "Aleluia",
        OFFERTORY: "Ofertório",
        HOLY: "Santo",
        LAMB_OF_GOD: "Cordeiro de Deus",
        COMMUNION: "Comunhão",
        THANKSGIVING: "Ação de Graças",
        FINAL: "Final"
    }[slot] ?? slot;
}

function songText(song) {
    const extras = [
        song.arrangerName ? `Arr.: ${song.arrangerName}` : "",
        song.harmonizerName ? `Harm.: ${song.harmonizerName}` : ""
    ].filter(Boolean);
    return `${song.title} [${song.composerName}${extras.length ? `; ${extras.join("; ")}` : ""}]`;
}

function formatTextDate(value) {
    return new Intl.DateTimeFormat("pt-PT", {
        dateStyle: "full",
        timeStyle: "short"
    }).format(new Date(value));
}

async function validateReferences(payload) {
    const songIds = [...new Set(payload.songs.map(({ songId }) => songId))];
    const [songCount, seasonCount] = await Promise.all([
        songIds.length ? repository.countSongs(songIds) : Promise.resolve(0),
        payload.seasonId ? repository.countSeason(payload.seasonId) : Promise.resolve(1)
    ]);

    if (songCount !== songIds.length) {
        throw new AppError(422, "Um ou mais cânticos selecionados não existem.");
    }
    if (seasonCount !== 1) {
        throw new AppError(422, "O tempo litúrgico selecionado não existe.");
    }
    let celebration = payload.celebrationName
        ? await repository.findCelebrationByName(payload.celebrationName)
        : null;
    if (!celebration && payload.celebrationId) {
        celebration = await repository.findCelebration(payload.celebrationId);
    }
    if (payload.celebrationId && !payload.celebrationName && !celebration) {
        throw new AppError(422, "A celebração selecionada não existe.");
    }
    if (!celebration && payload.celebrationName) {
        celebration = await repository.createCelebration(
            payload.celebrationName,
            payload.seasonId
        );
    }

    const { celebrationName, ...data } = payload;
    return {
        ...data,
        celebrationId: celebration?.id || null,
        seasonId: payload.seasonId || celebration?.seasonId || null
    };
}
