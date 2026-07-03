import { globalSearch } from "../api/search.api.js";
import { loadingState } from "../components/ui.js";
import { contributorRoleLabel } from "../utils/contributors.js";
import { escapeHtml, songTypeLabel } from "../utils/format.js";
import { formatDateTime } from "../utils/masses.js";

export function searchPage() {
    const query = new URLSearchParams(window.location.search).get("q")?.trim() ?? "";
    return {
        title: "Pesquisa",
        render: () => `
            <section class="page-heading"><div><p class="eyebrow">Área de trabalho</p><h2>Pesquisa global</h2><p class="page-description">Pesquise cânticos, contribuidores, partituras e missas num só local.</p></div></section>
            <form id="search-page-form" class="card-surface global-search-form"><div class="search-control"><i class="bi bi-search"></i><input id="search-page-input" class="form-control" value="${escapeHtml(query)}" placeholder="Introduza pelo menos 2 caracteres" autofocus></div><button class="btn btn-primary">Pesquisar</button></form>
            <div id="search-results">${query.length >= 2 ? loadingState("A pesquisar…") : ""}</div>
        `,
        mount: () => mount(query)
    };
}

async function mount(initialQuery) {
    const form = document.querySelector("#search-page-form");
    const input = document.querySelector("#search-page-input");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const query = input.value.trim();
        if (query.length < 2) return;
        window.history.replaceState({}, "", `/search?q=${encodeURIComponent(query)}`);
        await load(query);
    });
    if (initialQuery.length >= 2) await load(initialQuery);
}

async function load(query) {
    const target = document.querySelector("#search-results");
    target.innerHTML = loadingState("A pesquisar…");
    try {
        const { results } = await globalSearch(query);
        const total = Object.values(results).reduce((sum, items) => sum + items.length, 0);
        target.innerHTML = total === 0
            ? '<div class="empty-state card-surface"><i class="bi bi-search"></i><h3>Nenhum resultado encontrado</h3><p>Experimente uma expressão mais abrangente.</p></div>'
            : `<div class="search-groups">
                ${group("Cânticos", "music-note-list", results.songs, (item) => ({ href: `/songs/${item.id}`, title: item.title, subtitle: [item.composerName, songTypeLabel(item.songType)].filter(Boolean).join(" · ") }))}
                ${group("Contribuidores", "people", results.contributors, (item) => ({ href: `/contributors/${item.id}`, title: item.displayName, subtitle: contributorRoleLabel(item.role) }))}
                ${group("Partituras", "file-earmark-music", results.scores, (item) => ({ href: `/scores/${item.id}`, title: item.title, subtitle: `${item.format} · ${item.song.title}` }))}
                ${group("Missas", "calendar3", results.masses, (item) => ({ href: `/masses/${item.id}`, title: item.celebration?.name || item.church, subtitle: `${formatDateTime(item.startsAt)} · ${item.church}` }))}
            </div>`;
    } catch (error) {
        target.innerHTML = `<div class="inline-state text-danger">${escapeHtml(error.message)}</div>`;
    }
}

function group(title, icon, items, map) {
    if (!items.length) return "";
    return `<section class="card-surface search-group"><div class="card-heading"><span class="card-heading-icon"><i class="bi bi-${icon}"></i></span><div><h3>${title}</h3><p>${items.length} resultados</p></div></div><div>${items.map((item) => { const result = map(item); return `<a href="${result.href}" class="search-result" data-link><span><strong>${escapeHtml(result.title)}</strong><small>${escapeHtml(result.subtitle)}</small></span><i class="bi bi-arrow-right"></i></a>`; }).join("")}</div></section>`;
}
