import * as repository from "../repositories/song.repository.js";
import * as fileRepository from "../repositories/file.repository.js";
import * as tagRepository from "../repositories/tag.repository.js";
import { AppError } from "../utils/app-error.js";

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

export async function createSong(data) {
    const { tagIds, songTypes, ...songData } = data;
    await Promise.all([
        ensureUniqueSong(songData),
        ensureValidTags(tagIds)
    ]);
    return repository.createSong(songData, tagIds, songTypes);
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
