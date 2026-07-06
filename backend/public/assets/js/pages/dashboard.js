import { getStatistics } from "../api/statistics.api.js";
import { can, PERMISSIONS } from "../utils/permissions.js";

const cards = [
    { key: "songs", label: "Cânticos", icon: "music-note-list", tone: "purple" },
    { key: "contributors", label: "Contribuidores", icon: "people", tone: "blue" },
    { key: "scores", label: "Partituras", icon: "file-earmark-music", tone: "green" },
    { key: "masses", label: "Missas", icon: "calendar3", tone: "orange" },
    { key: "uploads", label: "Ficheiros", icon: "cloud-arrow-up", tone: "blue" },
    { key: "unused", label: "Cânticos inativos", icon: "archive", tone: "slate" }
];

export function dashboardPage() {
    return {
        title: "Painel",
        render: () => `
            <section class="welcome-panel">
                <div>
                    <span class="welcome-icon"><i class="bi bi-music-note-beamed"></i></span>
                    <p class="eyebrow">Bem-vindo ao Cantus</p>
                    <h2>O seu repertório litúrgico, cuidadosamente organizado.</h2>
                    <p>
                        Cânticos, contribuidores, partituras e planeamento reunidos
                        numa única aplicação.
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
                <div class="metric-grid">
                    ${cards.map(metricCard).join("")}
                </div>
            </section>

            <section class="card-surface next-step-card">
                <span class="next-step-icon"><i class="bi bi-stars"></i></span>
                <div>
                    <h3>Uma base sólida</h3>
                    <p class="mb-0">
                        A gestão litúrgica está organizada e pronta para acompanhar
                        o trabalho da sua comunidade.
                    </p>
                </div>
            </section>
        `,
        mount: mountDashboard
    };
}

async function mountDashboard() {
    const statistics = await getStatistics();
    const values = {
        ...statistics.overview,
        unused: statistics.overview.inactiveSongs
    };

    for (const [key, value] of Object.entries(values)) {
        const element = document.querySelector(`[data-metric="${key}"]`);
        if (element) {
            element.textContent = value;
        }
    }
}

function metricCard(card) {
    return `
        <article class="metric-card card-surface">
            <span class="metric-icon metric-icon-${card.tone}">
                <i class="bi bi-${card.icon}"></i>
            </span>
            <div>
                <span class="metric-value" data-metric="${card.key}">—</span>
                <p>${card.label}</p>
            </div>
        </article>
    `;
}
