import prisma from "../config/prisma.js";

export async function findAll() {
    const [songs, contributors] = await prisma.$transaction([
        prisma.song.findMany({
            where: { deletedAt: null },
            orderBy: { title: "asc" },
            select: {
                id: true,
                composerName: true,
                arrangerName: true,
                harmonizerName: true
            }
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
    const people = new Map();
    songs.forEach((song) => {
        addPerson(people, song.composerName, "COMPOSER", song.id);
        addPerson(people, song.arrangerName, "ARRANGER", song.id);
        addPerson(people, song.harmonizerName, "HARMONIZER", song.id);
    });

    return [...people.values()]
        .map(({ name, songIds, roleCounts }) => ({
            name,
            songCount: songIds.size,
            roleCounts,
            contributor: profiles.get(normalize(name)) ?? null
        }))
        .sort((first, second) => first.name.localeCompare(second.name, "pt"));
}

export async function findNames(names) {
    const songs = await prisma.song.findMany({
        where: {
            deletedAt: null,
            OR: [
                { composerName: { in: names } },
                { arrangerName: { in: names } },
                { harmonizerName: { in: names } }
            ]
        },
        select: {
            composerName: true,
            arrangerName: true,
            harmonizerName: true
        }
    });
    const requested = new Set(names);
    const existing = new Map();
    songs.forEach((song) => {
        for (const value of [
            song.composerName,
            song.arrangerName,
            song.harmonizerName
        ]) {
            if (requested.has(value) && !existing.has(value)) {
                existing.set(value, { name: value });
            }
        }
    });
    return [...existing.values()];
}

export function mergeNames(sources, name) {
    return prisma.$transaction(async (transaction) => {
        const [composerResult, arrangerResult, harmonizerResult] = await Promise.all([
            transaction.song.updateMany({
                where: { composerName: { in: sources } },
                data: { composerName: name }
            }),
            transaction.song.updateMany({
                where: { arrangerName: { in: sources } },
                data: { arrangerName: name }
            }),
            transaction.song.updateMany({
                where: { harmonizerName: { in: sources } },
                data: { harmonizerName: name }
            })
        ]);
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
        const result = {
            count: composerResult.count
                + arrangerResult.count
                + harmonizerResult.count
        };
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

function addPerson(people, value, role, songId) {
    const name = value?.trim();
    if (!name) {
        return;
    }

    const key = normalize(name);
    if (!people.has(key)) {
        people.set(key, {
            name,
            songIds: new Set(),
            roleCounts: {
                COMPOSER: 0,
                ARRANGER: 0,
                HARMONIZER: 0
            }
        });
    }

    const person = people.get(key);
    person.songIds.add(songId);
    person.roleCounts[role] += 1;
}

function normalize(value) {
    return (value ?? "").trim().toLocaleLowerCase("pt-PT");
}
