import prisma from "../config/prisma.js";

const tagLinks = {
    orderBy: { tag: { name: "asc" } },
    include: { tag: true }
};

const listSelection = {
    id: true,
    title: true,
    subtitle: true,
    composerName: true,
    arrangerName: true,
    harmonizerName: true,
    originalKey: true,
    songType: true,
    language: true,
    active: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    tagLinks,
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
    attachments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" }
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
        data: songs.map(({ _count, tagLinks: links, ...song }) => ({
            ...song,
            tags: links.map(({ tag }) => tag),
            attachmentCount: _count.attachments
        })),
        total
    };
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

export async function getSongByTitle(title, excludedId) {
    const candidates = await prisma.song.findMany({
        where: {
            deletedAt: null,
            title: { contains: title },
            ...(excludedId ? { id: { not: excludedId } } : {})
        },
        select: { id: true, title: true }
    });
    const normalizedTitle = title.toLocaleLowerCase();
    return candidates.find(
        (song) => song.title.toLocaleLowerCase() === normalizedTitle
    ) ?? null;
}

export async function createSong(data, tagIds) {
    const song = await prisma.song.create({
        data: {
            ...data,
            tagLinks: {
                create: tagIds.map((tagId) => ({ tagId }))
            }
        },
        include: detailRelations
    });
    return presentSong(song);
}

export async function updateSong(id, data, tagIds) {
    const song = await prisma.song.update({
        where: { id },
        data: {
            ...data,
            tagLinks: {
                deleteMany: {},
                create: tagIds.map((tagId) => ({ tagId }))
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

export async function getSongFacets() {
    const languages = await prisma.song.findMany({
        where: { deletedAt: null, language: { not: null } },
        distinct: ["language"],
        select: { language: true },
        orderBy: { language: "asc" }
    });
    return { languages: languages.map(({ language }) => language).filter(Boolean) };
}

function buildSongWhere(query) {
    const archived = query.status === "archived";
    return {
        deletedAt: archived ? { not: null } : null,
        ...(query.status === "active" ? { active: true } : {}),
        ...(query.status === "inactive" ? { active: false } : {}),
        ...(query.songType ? { songType: query.songType } : {}),
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
    const { tagLinks: links, ...data } = song;
    return {
        ...data,
        tags: links.map(({ tag }) => tag)
    };
}
