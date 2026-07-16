import prisma from "../config/prisma.js";

const tagLinks = {
    orderBy: { tag: { name: "asc" } },
    include: {
        tag: {
            include: {
                group: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        sortOrder: true,
                        active: true,
                        deletedAt: true
                    }
                }
            }
        }
    }
};

const typeAssignments = {
    orderBy: { type: "asc" },
    select: { type: true }
};

const listSelection = {
    id: true,
    title: true,
    subtitle: true,
    composerName: true,
    arrangerName: true,
    harmonizerName: true,
    originalKey: true,
    language: true,
    lyrics: true,
    notes: true,
    active: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    tagLinks,
    types: typeAssignments,
    _count: {
        select: {
            attachments: {
                where: { deletedAt: null }
            }
        }
    }
};

const detailRelations = {
    tagLinks,
    types: typeAssignments,
    attachments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" }
    },
    scores: {
        where: {
            deletedAt: null,
            versions: { some: { deletedAt: null } }
        },
        orderBy: { updatedAt: "desc" },
        select: {
            id: true,
            title: true,
            format: true,
            category: true,
            updatedAt: true,
            versions: {
                where: { deletedAt: null },
                orderBy: { versionNumber: "desc" },
                take: 1,
                select: {
                    id: true,
                    versionNumber: true,
                    originalName: true
                }
            },
            _count: {
                select: {
                    versions: { where: { deletedAt: null } }
                }
            }
        }
    },
    massSongs: {
        where: {
            mass: { deletedAt: null }
        },
        include: {
            mass: {
                select: {
                    id: true,
                    startsAt: true,
                    church: true,
                    celebration: {
                        select: { name: true }
                    },
                    season: {
                        select: { name: true }
                    }
                }
            }
        }
    }
};

export async function getAllSongs(query) {
    const where = buildSongWhere(query);
    const orderBy = [
        { [query.sortBy]: query.sortOrder },
        ...(query.sortBy === "title" ? [] : [{ title: "asc" }])
    ];

    const [songs, total] = await prisma.$transaction([
        prisma.song.findMany({
            where,
            orderBy,
            skip: (query.page - 1) * query.pageSize,
            take: query.pageSize,
            select: listSelection
        }),
        prisma.song.count({ where })
    ]);

    return {
        data: songs.map(({ _count, tagLinks: links, types, ...song }) => ({
            ...song,
            songTypes: types.map(({ type }) => type),
            tags: links.map(({ tag }) => tag),
            attachmentCount: _count.attachments
        })),
        total
    };
}

export async function getSongsForExport(query) {
    const where = buildSongWhere(query);
    const orderBy = [
        { [query.sortBy]: query.sortOrder },
        ...(query.sortBy === "title" ? [] : [{ title: "asc" }])
    ];

    const songs = await prisma.song.findMany({
        where,
        orderBy,
        select: listSelection
    });

    return songs.map(({ _count, tagLinks: links, types, ...song }) => ({
        ...song,
        songTypes: types.map(({ type }) => type),
        tags: links.map(({ tag }) => tag),
        attachmentCount: _count.attachments
    }));
}

export async function getSongById(id) {
    const song = await prisma.song.findFirst({
        where: { id, deletedAt: null },
        include: detailRelations
    });
    return presentSong(song);
}

export async function getSongIncludingArchived(id) {
    const song = await prisma.song.findUnique({
        where: { id },
        include: detailRelations
    });
    return presentSong(song);
}

export function getSongDeletionData(id) {
    return prisma.song.findUnique({
        where: { id },
        select: {
            id: true,
            deletedAt: true,
            attachments: {
                select: { relativePath: true }
            },
            scores: {
                select: {
                    versions: {
                        select: { relativePath: true }
                    }
                }
            }
        }
    });
}

export async function getSongByIdentity(
    title,
    composerName,
    arrangerName,
    excludedId
) {
    const candidates = await prisma.song.findMany({
        where: {
            deletedAt: null,
            title: { contains: title },
            ...(excludedId ? { id: { not: excludedId } } : {})
        },
        select: {
            id: true,
            title: true,
            composerName: true,
            arrangerName: true
        }
    });
    const normalizedTitle = title.toLocaleLowerCase();
    const normalizedComposer = composerName.toLocaleLowerCase();
    const normalizedArranger = (arrangerName ?? "").toLocaleLowerCase();
    return candidates.find(
        (song) => (
            song.title.toLocaleLowerCase() === normalizedTitle
            && song.composerName.toLocaleLowerCase() === normalizedComposer
            && (song.arrangerName ?? "").toLocaleLowerCase() === normalizedArranger
        )
    ) ?? null;
}

export async function createSong(data, tagIds, songTypes) {
    const song = await prisma.song.create({
        data: {
            ...data,
            tagLinks: {
                create: tagIds.map((tagId) => ({ tagId }))
            },
            types: {
                create: songTypes.map((type) => ({ type }))
            }
        },
        include: detailRelations
    });
    return presentSong(song);
}

export async function updateSong(id, data, tagIds, songTypes) {
    const song = await prisma.song.update({
        where: { id },
        data: {
            ...data,
            tagLinks: {
                deleteMany: {},
                create: tagIds.map((tagId) => ({ tagId }))
            },
            types: {
                deleteMany: {},
                create: songTypes.map((type) => ({ type }))
            }
        },
        include: detailRelations
    });
    return presentSong(song);
}

export function softDeleteSong(id) {
    return prisma.song.update({
        where: { id },
        data: { active: false, deletedAt: new Date() }
    });
}

export async function restoreSong(id) {
    const song = await prisma.song.update({
        where: { id },
        data: { active: true, deletedAt: null },
        include: detailRelations
    });
    return presentSong(song);
}

export function hardDeleteSong(id) {
    return prisma.$transaction([
        prisma.massSong.deleteMany({ where: { songId: id } }),
        prisma.score.deleteMany({ where: { songId: id } }),
        prisma.song.delete({ where: { id } })
    ]);
}

function buildSongWhere(query) {
    const archived = query.status === "archived";
    if (query.status === "all") {
        return withSongFilters({}, query);
    }
    if (query.status === "inactiveOrArchived") {
        return withSongFilters({
            OR: [
                { deletedAt: { not: null } },
                { deletedAt: null, active: false }
            ]
        }, query);
    }
    return withSongFilters({
        deletedAt: archived ? { not: null } : null,
        ...(query.status === "active" ? { active: true } : {}),
        ...(query.status === "inactive" ? { active: false } : {})
    }, query);
}

function withSongFilters(base, query) {
    return {
        ...base,
        ...(query.songType ? { types: { some: { type: query.songType } } } : {}),
        ...(query.language ? { language: query.language } : {}),
        ...(query.tagId ? { tagLinks: { some: { tagId: query.tagId } } } : {}),
        ...(query.search
            ? {
                OR: [
                    { title: { contains: query.search } },
                    { subtitle: { contains: query.search } },
                    { composerName: { contains: query.search } },
                    { arrangerName: { contains: query.search } },
                    { harmonizerName: { contains: query.search } },
                    { language: { contains: query.search } },
                    { notes: { contains: query.search } }
                ]
            }
            : {})
    };
}

function presentSong(song) {
    if (!song) {
        return null;
    }
    const {
        tagLinks: links,
        types,
        massSongs = [],
        scores = [],
        ...data
    } = song;
    return {
        ...data,
        songTypes: types.map(({ type }) => type),
        tags: links.map(({ tag }) => tag),
        scores: scores.map(({ _count, versions, ...score }) => ({
            ...score,
            versionCount: _count.versions,
            latestVersion: versions[0] ?? null
        })),
        history: massSongs
            .map(({ slot, mass }) => ({
                massId: mass.id,
                slot,
                startsAt: mass.startsAt,
                church: mass.church,
                celebration: mass.celebration,
                season: mass.season
            }))
            .sort((first, second) => (
                new Date(second.startsAt) - new Date(first.startsAt)
            ))
    };
}
