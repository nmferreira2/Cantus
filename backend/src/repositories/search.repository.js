import prisma from "../config/prisma.js";

export async function globalSearch(query, limit = 5, includeAdministration = true) {
    const [songs, contributors, scores, masses] = await Promise.all([
        prisma.song.findMany({
            where: {
                deletedAt: null,
                OR: [
                    { title: { contains: query } },
                    { subtitle: { contains: query } },
                    { composerName: { contains: query } },
                    { arrangerName: { contains: query } },
                    { harmonizerName: { contains: query } },
                    { lyrics: { contains: query } },
                    { notes: { contains: query } },
                    { tagLinks: { some: { tag: { name: { contains: query } } } } }
                ]
            },
            orderBy: { title: "asc" },
            take: limit,
            select: {
                id: true,
                title: true,
                subtitle: true,
                composerName: true,
                types: { select: { type: true } }
            }
        }),
        includeAdministration ? prisma.contributor.findMany({
            where: {
                deletedAt: null,
                OR: [
                    { displayName: { contains: query } },
                    { email: { contains: query } }
                ]
            },
            orderBy: { displayName: "asc" },
            take: limit,
            select: {
                id: true,
                displayName: true,
                role: true,
                email: true
            }
        }) : Promise.resolve([]),
        prisma.score.findMany({
            where: {
                deletedAt: null,
                OR: [
                    { title: { contains: query } },
                    { song: { title: { contains: query } } }
                ]
            },
            orderBy: { title: "asc" },
            take: limit,
            select: {
                id: true,
                title: true,
                format: true,
                song: { select: { title: true } }
            }
        }),
        includeAdministration ? prisma.mass.findMany({
            where: {
                deletedAt: null,
                OR: [
                    { church: { contains: query } },
                    { choir: { contains: query } },
                    { presider: { contains: query } },
                    { celebration: { name: { contains: query } } }
                ]
            },
            orderBy: { startsAt: "desc" },
            take: limit,
            select: {
                id: true,
                startsAt: true,
                church: true,
                celebration: { select: { name: true } }
            }
        }) : Promise.resolve([])
    ]);

    return {
        songs: songs.map(({ types, ...song }) => ({
            ...song,
            songTypes: types.map(({ type }) => type)
        })),
        contributors,
        scores,
        masses
    };
}
