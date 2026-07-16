import prisma from "../config/prisma.js";

export async function getOverviewCounts() {
    const [
        songs,
        contributors,
        scores,
        masses,
        songUploads,
        scoreUploads,
        inactiveSongs,
        archivedSongs
    ] = await prisma.$transaction([
        prisma.song.count({ where: { deletedAt: null } }),
        prisma.song.groupBy({
            by: ["composerName"],
            where: { deletedAt: null }
        }),
        prisma.score.count({ where: { deletedAt: null } }),
        prisma.mass.count({ where: { deletedAt: null } }),
        prisma.songAttachment.count({ where: { deletedAt: null } }),
        prisma.scoreVersion.count({ where: { deletedAt: null } }),
        prisma.song.count({ where: { deletedAt: null, active: false } }),
        prisma.song.count({ where: { deletedAt: { not: null } } })
    ]);

    return {
        songs,
        contributors: contributors.length,
        scores,
        masses,
        uploads: songUploads + scoreUploads,
        inactiveSongs,
        archivedSongs,
        inactiveOrArchivedSongs: inactiveSongs + archivedSongs
    };
}

export function getSongsByType() {
    return prisma.songTypeAssignment.groupBy({
        by: ["type"],
        where: { song: { deletedAt: null } },
        _count: { type: true },
        orderBy: { _count: { type: "desc" } }
    });
}

export async function getSongsByLiturgicalTime() {
    const tags = await prisma.tag.findMany({
        where: {
            groupId: "tag-group-liturgical-season",
            active: true,
            deletedAt: null,
            group: { active: true, deletedAt: null }
        },
        select: {
            name: true,
            songLinks: {
                where: { song: { deletedAt: null } },
                select: { songId: true }
            }
        }
    });

    return tags
        .map(({ name, songLinks }) => ({
            label: name,
            value: songLinks.length
        }))
        .sort((first, second) => (
            second.value - first.value
            || first.label.localeCompare(second.label, "pt")
        ));
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
        where: { mass: { deletedAt: null } },
        _count: { songId: true },
        orderBy: { _count: { songId: "desc" } },
        take: limit
    });
    const songs = await prisma.song.findMany({
        where: {
            id: { in: usage.map(({ songId }) => songId) },
            deletedAt: null
        },
        select: {
            id: true,
            title: true,
            types: { select: { type: true } }
        }
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
            types: { select: { type: true } },
            createdAt: true
        }
    });
}

export function getRecentlyUpdatedSongs(limit = 5) {
    return prisma.song.findMany({
        where: { deletedAt: null },
        orderBy: [
            { updatedAt: "desc" },
            { title: "asc" }
        ],
        take: limit,
        select: {
            id: true,
            title: true,
            types: { select: { type: true } },
            updatedAt: true
        }
    });
}

export async function getLeastRecentlyUsedSongs(limit = 5) {
    const songs = await prisma.song.findMany({
        where: {
            deletedAt: null,
            active: true
        },
        select: {
            id: true,
            title: true,
            types: { select: { type: true } },
            massSongs: {
                where: { mass: { deletedAt: null } },
                orderBy: { mass: { startsAt: "desc" } },
                take: 1,
                select: {
                    mass: { select: { startsAt: true } }
                }
            }
        }
    });

    return songs
        .map(({ massSongs, ...song }) => ({
            ...song,
            lastUsedAt: massSongs[0]?.mass.startsAt ?? null
        }))
        .sort((first, second) => {
            if (!first.lastUsedAt && !second.lastUsedAt) {
                return first.title.localeCompare(second.title, "pt");
            }
            if (!first.lastUsedAt) return -1;
            if (!second.lastUsedAt) return 1;
            return first.lastUsedAt - second.lastUsedAt;
        })
        .slice(0, limit);
}

export function getNextMass() {
    return prisma.mass.findFirst({
        where: {
            deletedAt: null,
            active: true,
            startsAt: { gte: new Date() }
        },
        orderBy: { startsAt: "asc" },
        select: {
            id: true,
            startsAt: true,
            church: true,
            celebration: { select: { name: true } },
            season: { select: { name: true } },
            _count: { select: { songs: true } }
        }
    });
}
