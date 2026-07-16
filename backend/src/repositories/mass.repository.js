import prisma from "../config/prisma.js";

const massInclude = {
    season: true,
    celebration: true,
    songs: {
        orderBy: { slot: "asc" },
        include: {
            song: {
                select: {
                    id: true,
                    title: true,
                    composerName: true,
                    arrangerName: true,
                    harmonizerName: true,
                }
            }
        }
    }
};

export async function findAll(query) {
    const where = massWhere(query);
    const [data, total] = await prisma.$transaction([
        prisma.mass.findMany({
            where,
            orderBy: massOrderBy(query),
            skip: (query.page - 1) * query.pageSize,
            take: query.pageSize,
            include: massInclude
        }),
        prisma.mass.count({ where })
    ]);
    return { data, total };
}

function massOrderBy(query) {
    const direction = query.sortOrder;
    const primary = {
        date: { startsAt: direction },
        celebration: { celebration: { name: direction } },
        church: { church: direction },
        season: { season: { name: direction } },
        songs: { songs: { _count: direction } },
        status: { active: direction }
    }[query.sortBy] ?? { startsAt: direction };

    return [
        primary,
        ...(query.sortBy === "date" ? [] : [{ startsAt: "asc" }])
    ];
}

export function findCalendar(from, to) {
    return prisma.mass.findMany({
        where: {
            deletedAt: null,
            startsAt: { gte: from, lt: to }
        },
        orderBy: { startsAt: "asc" },
        include: massInclude
    });
}

export function findById(id, includeArchived = false) {
    return prisma.mass.findFirst({
        where: {
            id,
            ...(includeArchived ? {} : { deletedAt: null })
        },
        include: massInclude
    });
}

export function findForCelebrationPdf(id) {
    return prisma.mass.findFirst({
        where: { id, deletedAt: null },
        select: {
            id: true,
            startsAt: true,
            church: true,
            celebration: { select: { name: true } },
            songs: {
                select: {
                    slot: true,
                    song: {
                        select: {
                            id: true,
                            title: true,
                            scores: {
                                where: {
                                    deletedAt: null,
                                    active: true,
                                    format: "PDF",
                                    versions: { some: { deletedAt: null } }
                                },
                                orderBy: { updatedAt: "desc" },
                                select: {
                                    id: true,
                                    category: true,
                                    versions: {
                                        where: { deletedAt: null },
                                        orderBy: { versionNumber: "desc" },
                                        take: 1,
                                        select: {
                                            id: true,
                                            relativePath: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
}

export function getReferences() {
    return prisma.$transaction([
        prisma.liturgicalSeason.findMany({ orderBy: { sortOrder: "asc" } }),
        prisma.celebration.findMany({
            orderBy: { name: "asc" },
            include: { season: true }
        })
    ]);
}

export function countSongs(ids) {
    return prisma.song.count({
        where: {
            id: { in: ids },
            deletedAt: null
        }
    });
}

export function countSeason(id) {
    return prisma.liturgicalSeason.count({ where: { id } });
}

export function findCelebration(id) {
    return prisma.celebration.findUnique({ where: { id } });
}

export async function findCelebrationByName(name) {
    const candidates = await prisma.celebration.findMany({
        where: { name: { contains: name } }
    });
    const normalized = name.toLocaleLowerCase("pt-PT");
    return candidates.find(
        (celebration) => celebration.name.toLocaleLowerCase("pt-PT") === normalized
    ) ?? null;
}

export function createCelebration(name, seasonId) {
    return prisma.celebration.create({
        data: {
            name,
            seasonId: seasonId || null
        }
    });
}

export function create(data, songs) {
    return prisma.mass.create({
        data: {
            ...data,
            songs: { create: songs }
        },
        include: massInclude
    });
}

export function update(id, data, songs) {
    return prisma.mass.update({
        where: { id },
        data: {
            ...data,
            songs: {
                deleteMany: {},
                create: songs
            }
        },
        include: massInclude
    });
}

export function archive(id) {
    return prisma.mass.update({
        where: { id },
        data: { active: false, deletedAt: new Date() }
    });
}

export function restore(id) {
    return prisma.mass.update({
        where: { id },
        data: { active: true, deletedAt: null },
        include: massInclude
    });
}

function massWhere(query) {
    const now = new Date();
    const archived = query.status === "archived";
    return {
        deletedAt: archived ? { not: null } : null,
        ...(query.status === "upcoming" ? { startsAt: { gte: now } } : {}),
        ...(query.status === "past" ? { startsAt: { lt: now } } : {}),
        ...(query.seasonId ? { seasonId: query.seasonId } : {}),
        ...(query.search
            ? {
                OR: [
                    { church: { contains: query.search } },
                    { presider: { contains: query.search } },
                    { choir: { contains: query.search } },
                    { celebration: { name: { contains: query.search } } }
                ]
            }
            : {})
    };
}
