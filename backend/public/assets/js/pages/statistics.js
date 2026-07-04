import { getStatistics } from "../api/statistics.api.js";
import { loadingState } from "../components/ui.js";
import { escapeHtml, formatDate, songTypeLabel, songTypesLabel } from "../utils/format.js";

const metrics = [
    ["songs", "Cânticos", "music-note-list", "purple"],
    ["contributors", "Contribuidores", "people", "blue"],
    ["scores", "Partituras", "file-earmark-music", "green"],
    ["masses", "Missas", "calendar3", "orange"],
    ["uploads", "Ficheiros", "cloud-arrow-up", "slate"],
    ["inactiveSongs", "Cânticos inativos", "archive", "slate"]
];

export function statisticsPage() {
    return {
        title: "Estatísticas",
        render: () => `<section class="page-heading"><div><p class="eyebrow">Indicadores</p><h2>Estatísticas</h2><p class="page-description">Uma visão clara do crescimento do repertório e do planeamento.</p></div></section><div id="statistics-content">${loadingState("A carregar estatísticas…")}</div>`,
        mount: async () => render(await getStatistics())
    };
}

function render(data) {
    document.querySelector("#statistics-content").innerHTML = `
        <div class="metric-grid statistics-metrics">${metrics.map(([key, label, icon, tone]) => `<article class="metric-card card-surface"><span class="metric-icon metric-icon-${tone}"><i class="bi bi-${icon}"></i></span><div><span class="metric-value">${data.overview[key]}</span><p>${label}</p></div></article>`).join("")}</div>
        <div class="statistics-grid">
            ${chartCard("Cânticos por tipo", data.charts.songsByType.map((item) => ({ ...item, label: songTypeLabel(item.label) })))}
            ${chartCard("Cânticos por tempo litúrgico", data.charts.songsByLiturgicalTime)}
            ${chartCard("Missas por mês", data.charts.massesPerMonth)}
            <section class="card-surface statistics-list"><div class="card-heading"><span class="card-heading-icon"><i class="bi bi-trophy"></i></span><div><h3>Cânticos mais utilizados</h3><p>Nos planeamentos de missas</p></div></div>${data.mostUsedSongs.length ? data.mostUsedSongs.map((song, index) => `<a href="/songs/${encodeURIComponent(song.id)}" class="ranking-row" data-link><span>${index + 1}</span><div><strong>${escapeHtml(song.title)}</strong><small>${escapeHtml(songTypesLabel(song.songTypes))}</small></div><b>${song.uses}</b></a>`).join("") : '<p class="attachment-empty">A utilização aparecerá após o planeamento de missas.</p>'}</section>
            <section class="card-surface statistics-list"><div class="card-heading"><span class="card-heading-icon"><i class="bi bi-stars"></i></span><div><h3>Adicionados recentemente</h3><p>Repertório mais recente</p></div></div>${data.recentlyAddedSongs.map((song) => `<a href="/songs/${encodeURIComponent(song.id)}" class="ranking-row" data-link><span><i class="bi bi-music-note"></i></span><div><strong>${escapeHtml(song.title)}</strong><small>${formatDate(song.createdAt)}</small></div></a>`).join("")}</section>
        </div>
    `;
}

function chartCard(title, values) {
    const maximum = Math.max(1, ...values.map(({ value }) => value));
    return `<section class="card-surface chart-card"><div class="card-heading"><span class="card-heading-icon"><i class="bi bi-bar-chart"></i></span><div><h3>${title}</h3><p>${values.reduce((total, item) => total + item.value, 0)} no total</p></div></div><div class="bar-chart">${values.length ? values.map((item) => `<div class="bar-row"><span>${escapeHtml(item.label || "Não especificado")}</span><div><i style="width:${Math.max(3, item.value / maximum * 100)}%"></i></div><b>${item.value}</b></div>`).join("") : '<p class="attachment-empty">Ainda não existem dados.</p>'}</div></section>`;
}
