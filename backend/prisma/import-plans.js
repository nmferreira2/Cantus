import "dotenv/config";

import { createHash } from "node:crypto";

import prisma from "../src/config/prisma.js";
import plans, { songCorrections } from "./planning/legacy-2026.js";

const slotTypes = {
    ENTRANCE: "ENTRANCE",
    PENITENTIAL: "PENITENTIAL_ACT",
    ASPERSION: "PENITENTIAL_ACT",
    GLORIA: "GLORIA",
    PSALM: "RESPONSORIAL_PSALM",
    ALLELUIA: "GOSPEL_ACCLAMATION",
    OFFERTORY: "OFFERTORY",
    HOLY: "HOLY",
    LAMB_OF_GOD: "LAMB_OF_GOD",
    COMMUNION: "COMMUNION",
    THANKSGIVING: "THANKSGIVING",
    FINAL: "FINAL"
};

let matchedSongs = 0;
let createdSongs = 0;

try {
    await applySongCorrections();

    for (const plan of plans) {
        const songs = [];

        for (const [slot, reference] of Object.entries(plan.songs)) {
            songs.push({
                slot,
                songId: await resolveSong(reference, slotTypes[slot])
            });
        }

        const celebrationId = `legacy-celebration-${plan.date}`;
        await prisma.celebration.upsert({
            where: { id: celebrationId },
            update: {
                name: plan.name,
                seasonId: plan.seasonId,
                type: "HISTORICAL",
                month: Number(plan.date.slice(5, 7)),
                day: Number(plan.date.slice(8, 10))
            },
            create: {
                id: celebrationId,
                name: plan.name,
                seasonId: plan.seasonId,
                type: "HISTORICAL",
                month: Number(plan.date.slice(5, 7)),
                day: Number(plan.date.slice(8, 10))
            }
        });

        const data = {
            startsAt: new Date(`${plan.date}T12:00:00.000Z`),
            church: plan.church,
            celebrationId,
            seasonId: plan.seasonId,
            choir: plan.choir,
            comments: plan.comments,
            active: true
        };

        await prisma.mass.upsert({
            where: { id: plan.id },
            update: {
                ...data,
                songs: {
                    deleteMany: {},
                    create: songs
                }
            },
            create: {
                id: plan.id,
                ...data,
                songs: { create: songs }
            }
        });
    }

    console.log(
        `${plans.length} planeamentos importados; `
        + `${matchedSongs} referências existentes associadas; `
        + `${createdSongs} cânticos em falta criados.`
    );
} finally {
    await prisma.$disconnect();
}

async function applySongCorrections() {
    for (const correction of songCorrections) {
        await prisma.song.update({
            where: { id: correction.id },
            data: { composerName: correction.composerName }
        });
    }
}

async function resolveSong(reference, type) {
    if (reference.songId) {
        const song = await prisma.song.findUnique({
            where: { id: reference.songId },
            select: { id: true }
        });
        if (!song) {
            throw new Error(`Cântico referenciado não existe: ${reference.songId}`);
        }
        await ensureSongType(song.id, type);
        matchedSongs += 1;
        return song.id;
    }

    const id = `legacy-song-${createHash("sha256")
        .update(`${reference.title}|${reference.composerName}|${reference.arrangerName ?? ""}`)
        .digest("hex")
        .slice(0, 20)}`;
    const existing = await prisma.song.findUnique({
        where: { id },
        select: { id: true }
    });

    await prisma.song.upsert({
        where: { id },
        update: {
            title: reference.title,
            composerName: reference.composerName,
            arrangerName: reference.arrangerName ?? null,
            types: {
                connectOrCreate: {
                    where: {
                        songId_type: { songId: id, type }
                    },
                    create: { type }
                }
            }
        },
        create: {
            id,
            title: reference.title,
            composerName: reference.composerName,
            arrangerName: reference.arrangerName ?? null,
            active: true,
            types: { create: { type } }
        }
    });

    if (existing) {
        matchedSongs += 1;
    } else {
        createdSongs += 1;
    }
    return id;
}

function ensureSongType(songId, type) {
    return prisma.songTypeAssignment.upsert({
        where: {
            songId_type: { songId, type }
        },
        update: {},
        create: { songId, type }
    });
}
