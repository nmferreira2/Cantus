import { getStatistics } from "../api/statistics.api.js";
import { formatDate, escapeHtml, songTypesLabel } from "../utils/format.js";
import { formatDateTime } from "../utils/masses.js";
import { can, PERMISSIONS } from "../utils/permissions.js";

const cards = [
    {
        key: "songs",
        label: "Cânticos",
        icon: "music-note-list",
        tone: "purple",
        href: "/songs"
    },
    {
        key: "contributors",
        label: "Compositores",
        icon: "people",
        tone: "blue",
        href: "/composers",
        permission: PERMISSIONS.MANAGE_CONTRIBUTORS
    },
    {
        key: "scores",
        label: "Partituras",
        icon: "file-earmark-music",
        tone: "green",
        href: "/scores"
    },
    {
        key: "masses",
        label: "Missas",
        icon: "calendar3",
        tone: "orange",
        href: "/masses",
        permission: PERMISSIONS.MANAGE_MASSES
    },
    {
        key: "uploads",
        label: "Ficheiros",
        icon: "cloud-arrow-up",
        tone: "blue",
        href: "/scores"
    },
    {
        key: "inactiveOrArchivedSongs",
        label: "Cânticos inativos/arquivados",
        icon: "archive",
        tone: "slate",
        href: "/songs?status=inactiveOrArchived",
        permission: PERMISSIONS.DELETE_SONGS
    }
];

export function dashboardPage() {
    const visibleCards = cards.filter(({ permission }) => (
        !permission || can(permission)
    ));
    return {
        title: "Painel",
        render: () => `
            <section class="welcome-panel dashboard-hero">
                <div>
                    <span class="welcome-icon"><i class="bi bi-music-note-beamed"></i></span>
                    <p class="eyebrow">Bem-vindo ao Cantus</p>
                    <h2>A música da sua comunidade, pronta para cada celebração.</h2>
                    <p>
                        Consulte o repertório, organize partituras e prepare a próxima
                        missa a partir de um só lugar.
                    </p>
                </div>
                ${can(PERMISSIONS.MANAGE_SONGS) ? `<a href="/songs/new" class="btn btn-light" data-link>
                    <i class="bi bi-plus-lg"></i>
                    Adicionar cântico
                </a>` : ""}
            </section>

            <section class="dashboard-section">
                <div class="section-heading">
                    <div>
                        <p class="eyebrow">Visão geral</p>
                        <h2>Resumo da biblioteca</h2>
                    </div>
                    <a href="/songs" data-link>Ver repertório <i class="bi bi-arrow-right"></i></a>
                </div>
                <div class="metric-grid dashboard-metric-grid">
                    ${visibleCards.map(metricCard).join("")}
                </div>
            </section>

            ${can(PERMISSIONS.MANAGE_MASSES) ? '<section id="dashboard-next-mass" class="dashboard-next-mass"></section>' : ""}

            <section class="dashboard-section">
                <div class="section-heading">
                    <div>
                        <p class="eyebrow">Repertório</p>
                        <h2>Atividade da biblioteca</h2>
                    </div>
                </div>
                <div id="dashboard-lists" class="dashboard-list-grid">
                    ${Array.from({ length: 3 }, () => '<section class="card-surface dashboard-list-card"><div class="loading-state"><span class="spinner-border spinner-border-sm"></span></div></section>').join("")}
                </div>
            </section>
        `,
        mount: mountDashboard
    };
}

async function mountDashboard() {
    const statistics = await getStatistics();

    for (const [key, value] of Object.entries(statistics.overview)) {
        const element = document.querySelector(`[data-metric="${key}"]`);
        if (element) {
            element.textContent = value;
        }
    }

    renderLists(statistics);
    if (can(PERMISSIONS.MANAGE_MASSES)) {
        renderNextMass(statistics.nextMass);
    }
}

function renderLists(statistics) {
    document.querySelector("#dashboard-lists").innerHTML = [
        listCard({
            icon: "clock-history",
            title: "Últimos cânticos adicionados",
            subtitle: "Entradas mais recentes",
            songs: statistics.recentlyAddedSongs,
            detail: (song) => formatDate(song.createdAt)
        }),
        listCard({
            icon: "trophy",
            title: "Cânticos mais usados",
            subtitle: "Nos planeamentos de missas",
            songs: statistics.mostUsedSongs,
            detail: (song) => `${song.uses} ${song.uses === 1 ? "utilização" : "utilizações"}`
        }),
        listCard({
            icon: "hourglass-split",
            title: "Não usados há mais tempo",
            subtitle: "Repertório a revisitar",
            songs: statistics.leastRecentlyUsedSongs,
            detail: (song) => song.lastUsedAt
                ? `Última utilização: ${formatDate(song.lastUsedAt)}`
                : "Ainda sem utilização"
        })
    ].join("");
}

function listCard({ icon, title, subtitle, songs, detail }) {
    return `
        <section class="card-surface dashboard-list-card">
            <div class="card-heading">
                <span class="card-heading-icon"><i class="bi bi-${icon}"></i></span>
                <div><h3>${title}</h3><p>${subtitle}</p></div>
            </div>
            <div class="dashboard-song-list">
                ${songs.length
                    ? songs.map((song) => `
                        <a href="/songs/${encodeURIComponent(song.id)}" class="dashboard-song-row" data-link>
                            <span>
                                <strong>${escapeHtml(song.title)}</strong>
                                <small>${escapeHtml(songTypesLabel(song.songTypes) || "Outro")}</small>
                            </span>
                            <em>${escapeHtml(detail(song))}</em>
                        </a>
                    `).join("")
                    : '<p class="tag-admin-empty">Ainda não existem dados para mostrar.</p>'}
            </div>
        </section>
    `;
}

function renderNextMass(mass) {
    const target = document.querySelector("#dashboard-next-mass");
    if (!mass) {
        target.innerHTML = `
            <section class="card-surface dashboard-next-card">
                <span class="next-step-icon"><i class="bi bi-calendar-plus"></i></span>
                <div><p class="eyebrow">Próxima missa</p><h3>Ainda não existe uma celebração futura planeada.</h3></div>
                <a href="/masses/new" class="btn btn-light" data-link>Planear missa</a>
            </section>
        `;
        return;
    }

    target.innerHTML = `
        <a href="/masses/${encodeURIComponent(mass.id)}" class="card-surface dashboard-next-card" data-link>
            <span class="next-step-icon"><i class="bi bi-calendar-event"></i></span>
            <div>
                <p class="eyebrow">Próxima missa</p>
                <h3>${escapeHtml(mass.celebration?.name || "Celebração")}</h3>
                <span>${formatDateTime(mass.startsAt)} · ${escapeHtml(mass.church)}</span>
            </div>
            <strong>${mass.songCount} ${mass.songCount === 1 ? "cântico" : "cânticos"}</strong>
            <i class="bi bi-arrow-right"></i>
        </a>
    `;
}

function metricCard(card) {
    return `
        <a href="${card.href}" class="metric-card card-surface metric-card-link" data-link>
            <span class="metric-icon metric-icon-${card.tone}">
                <i class="bi bi-${card.icon}"></i>
            </span>
            <div>
                <span class="metric-value" data-metric="${card.key}">—</span>
                <p>${card.label}</p>
            </div>
            <i class="bi bi-arrow-up-right metric-link-icon"></i>
        </a>
    `;
}
