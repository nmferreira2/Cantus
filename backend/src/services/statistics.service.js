import * as repository from "../repositories/statistics.repository.js";

export async function getStatistics() {
    const from = new Date();
    from.setUTCMonth(from.getUTCMonth() - 11, 1);
    from.setUTCHours(0, 0, 0, 0);

    const [
        overview,
        byType,
        byLiturgicalTime,
        massDates,
        mostUsed,
        recent,
        recentlyUpdated,
        leastRecentlyUsed,
        nextMass
    ] = await Promise.all([
        repository.getOverviewCounts(),
        repository.getSongsByType(),
        repository.getSongsByLiturgicalTime(),
        repository.getMassDates(from),
        repository.getMostUsedSongs(),
        repository.getRecentlyAddedSongs(),
        repository.getRecentlyUpdatedSongs(),
        repository.getLeastRecentlyUsedSongs(),
        repository.getNextMass()
    ]);

    return {
        overview,
        charts: {
            songsByType: byType.map((entry) => ({
                label: entry.type,
                value: entry._count.type
            })),
            songsByLiturgicalTime: byLiturgicalTime,
            massesPerMonth: massesPerMonth(massDates, from)
        },
        mostUsedSongs: mostUsed.map(presentSongTypes),
        recentlyAddedSongs: recent.map(presentSongTypes),
        recentlyUpdatedSongs: recentlyUpdated.map(presentSongTypes),
        leastRecentlyUsedSongs: leastRecentlyUsed.map(presentSongTypes),
        nextMass: nextMass
            ? {
                id: nextMass.id,
                startsAt: nextMass.startsAt,
                church: nextMass.church,
                celebration: nextMass.celebration,
                season: nextMass.season,
                songCount: nextMass._count.songs
            }
            : null
    };
}

function presentSongTypes(song) {
    const { types, ...data } = song;
    return {
        ...data,
        songTypes: types.map(({ type }) => type)
    };
}

function massesPerMonth(masses, start) {
    const counts = new Map();
    masses.forEach(({ startsAt }) => {
        const key = `${startsAt.getUTCFullYear()}-${String(
            startsAt.getUTCMonth() + 1
        ).padStart(2, "0")}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return Array.from({ length: 12 }, (_, index) => {
        const date = new Date(Date.UTC(
            start.getUTCFullYear(),
            start.getUTCMonth() + index,
            1
        ));
        const key = `${date.getUTCFullYear()}-${String(
            date.getUTCMonth() + 1
        ).padStart(2, "0")}`;
        return {
            key,
            label: new Intl.DateTimeFormat("pt-PT", {
                month: "short",
                year: "2-digit",
                timeZone: "UTC"
            }).format(date),
            value: counts.get(key) ?? 0
        };
    });
}
