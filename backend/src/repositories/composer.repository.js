import prisma from "../config/prisma.js";

export async function findAll() {
    const [composers, contributors] = await prisma.$transaction([
        prisma.song.groupBy({
            by: ["composerName"],
            where: { deletedAt: null },
            _count: { composerName: true },
            orderBy: { composerName: "asc" }
        }),
        prisma.contributor.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" }
        })
    ]);
    const profiles = new Map();
    contributors.forEach((contributor) => {
        for (const name of [contributor.displayName, contributor.name]) {
            const key = normalize(name);
            if (key && !profiles.has(key)) profiles.set(key, contributor);
        }
    });

    return composers.map(({ composerName, _count }) => ({
        name: composerName,
        songCount: _count.composerName,
        contributor: profiles.get(normalize(composerName)) ?? null
    }));
}

export function findNames(names) {
    return prisma.song.findMany({
        where: { composerName: { in: names } },
        distinct: ["composerName"],
        select: { composerName: true }
    });
}

export function mergeNames(sources, name) {
    return prisma.$transaction(async (transaction) => {
        const result = await transaction.song.updateMany({
            where: { composerName: { in: sources } },
            data: { composerName: name }
        });
        const contributors = await transaction.contributor.findMany({
            where: {
                deletedAt: null,
                OR: [
                    { displayName: { in: sources } },
                    { name: { in: sources } }
                ]
            },
            orderBy: { createdAt: "asc" }
        });
        if (contributors.length === 0) {
            return result;
        }

        const target = contributors.find((contributor) => (
            contributor.displayName === name || contributor.name === name
        )) ?? contributors[0];
        const duplicateIds = contributors
            .filter(({ id }) => id !== target.id)
            .map(({ id }) => id);
        const notes = mergeText(contributors.map(({ notes }) => notes));
        const biography = mergeText(
            contributors.map(({ biography }) => biography)
        );
        const photoPath = target.photoPath
            ?? contributors.find(({ photoPath: value }) => value)?.photoPath
            ?? null;

        if (duplicateIds.length > 0) {
            await transaction.user.updateMany({
                where: { contributorId: { in: duplicateIds } },
                data: { contributorId: target.id }
            });
            await transaction.contributor.updateMany({
                where: { id: { in: duplicateIds } },
                data: { active: false, deletedAt: new Date() }
            });
        }
        await transaction.contributor.update({
            where: { id: target.id },
            data: {
                name,
                surname: null,
                displayName: name,
                notes,
                biography,
                photoPath
            }
        });
        return result;
    });
}

export function findContributorByName(name) {
    return prisma.contributor.findFirst({
        where: {
            deletedAt: null,
            OR: [
                { displayName: name },
                { name }
            ]
        }
    });
}

export function createComposerProfile(name, biography = null) {
    return prisma.contributor.create({
        data: {
            name,
            displayName: name,
            role: "COMPOSER",
            biography,
            active: true
        }
    });
}

export function updateComposerProfile(id, data) {
    return prisma.contributor.update({
        where: { id },
        data
    });
}

export function findSongsByName(name) {
    return prisma.song.findMany({
        where: {
            deletedAt: null,
            OR: [
                { composerName: name },
                { arrangerName: name },
                { harmonizerName: name }
            ]
        },
        orderBy: { title: "asc" },
        select: {
            id: true,
            title: true,
            subtitle: true,
            composerName: true,
            arrangerName: true,
            harmonizerName: true,
            active: true
        }
    });
}

function mergeText(values) {
    return [...new Set(values.map((value) => value?.trim()).filter(Boolean))]
        .join("\n\n") || null;
}

function normalize(value) {
    return (value ?? "").trim().toLocaleLowerCase("pt-PT");
}
