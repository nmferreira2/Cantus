import prisma from "../config/prisma.js";

export async function getOverviewCounts() {
    const [
        songs,
        contributors,
        scores,
        masses,
        songUploads,
        scoreUploads,
        inactiveSongs
    ] = await prisma.$transaction([
        prisma.song.count({ where: { deletedAt: null } }),
        prisma.contributor.count({ where: { deletedAt: null } }),
        prisma.score.count({ where: { deletedAt: null } }),
        prisma.mass.count({ where: { deletedAt: null } }),
        prisma.songAttachment.count({ where: { deletedAt: null } }),
        prisma.scoreVersion.count(),
        prisma.song.count({ where: { deletedAt: null, active: false } })
    ]);

    return {
        songs,
        contributors,
        scores,
        masses,
        uploads: songUploads + scoreUploads,
        inactiveSongs
    };
}

export function getSongsByType() {
    return prisma.song.groupBy({
        by: ["songType"],
        where: { deletedAt: null },
        _count: { songType: true },
        orderBy: { _count: { songType: "desc" } }
    });
}

export function getSongsByLanguage() {
    return prisma.song.groupBy({
        by: ["language"],
        where: { deletedAt: null, language: { not: null } },
        _count: { language: true },
        orderBy: { _count: { language: "desc" } }
    });
}

export function getMassDates(from) {
    return prisma.mass.findMany({
        where: {
            deletedAt: null,
            startsAt: { gte: from }
        },
        select: { startsAt: true }
    });
}

export async function getMostUsedSongs(limit = 5) {
    const usage = await prisma.massSong.groupBy({
        by: ["songId"],
        _count: { songId: true },
        orderBy: { _count: { songId: "desc" } },
        take: limit
    });
    const songs = await prisma.song.findMany({
        where: {
            id: { in: usage.map(({ songId }) => songId) },
            deletedAt: null
        },
        select: { id: true, title: true, songType: true }
    });
    const byId = new Map(songs.map((song) => [song.id, song]));

    return usage
        .filter(({ songId }) => byId.has(songId))
        .map(({ songId, _count }) => ({
            ...byId.get(songId),
            uses: _count.songId
        }));
}

export function getRecentlyAddedSongs(limit = 5) {
    return prisma.song.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
            id: true,
            title: true,
            songType: true,
            createdAt: true
        }
    });
}
