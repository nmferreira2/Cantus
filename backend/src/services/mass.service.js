import * as repository from "../repositories/mass.repository.js";
import { AppError } from "../utils/app-error.js";
import { paginatedResponse } from "../utils/pagination.js";

export async function getMasses(query) {
    const result = await repository.findAll(query);
    const response = paginatedResponse(result.data, result.total, query);
    if (response.pagination.page !== query.page && result.total > 0) {
        return getMasses({ ...query, page: response.pagination.page });
    }
    return response;
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

async function validateReferences(payload) {
    const songIds = [...new Set(payload.songs.map(({ songId }) => songId))];
    const [songCount, seasonCount, celebration] = await Promise.all([
        songIds.length ? repository.countSongs(songIds) : Promise.resolve(0),
        payload.seasonId ? repository.countSeason(payload.seasonId) : Promise.resolve(1),
        payload.celebrationId
            ? repository.findCelebration(payload.celebrationId)
            : Promise.resolve(null)
    ]);

    if (songCount !== songIds.length) {
        throw new AppError(422, "Um ou mais cânticos selecionados não existem.");
    }
    if (seasonCount !== 1) {
        throw new AppError(422, "O tempo litúrgico selecionado não existe.");
    }
    if (payload.celebrationId && !celebration) {
        throw new AppError(422, "A celebração selecionada não existe.");
    }

    return {
        ...payload,
        seasonId: payload.seasonId || celebration?.seasonId || null
    };
}
