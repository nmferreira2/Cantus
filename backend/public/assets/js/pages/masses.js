import {
    archiveMass,
    getMassCalendar,
    getMasses,
    getMassReferences,
    restoreMass
} from "../api/masses.api.js";
import { confirmDialog } from "../components/modal.js";
import { pagination } from "../components/pagination.js";
import { showFlash, showToast } from "../components/toast.js";
import { emptyState, loadingState, statusBadge } from "../components/ui.js";
import { escapeHtml } from "../utils/format.js";
import { formatDateTime } from "../utils/masses.js";

export function massesPage() {
    return {
        title: "Planeamento da missa",
        render: () => `
            <section class="page-heading"><div><p class="eyebrow">Planeamento</p><h2>Missas</h2><p class="page-description">Planeie celebrações e associe cada momento litúrgico ao repertório.</p></div><a href="/masses/new" class="btn btn-primary" data-link><i class="bi bi-calendar-plus"></i> Planear missa</a></section>
            <div class="view-switch mb-3"><button class="btn btn-light active" data-mass-view="list"><i class="bi bi-list-ul"></i> Lista</button><button class="btn btn-light" data-mass-view="calendar"><i class="bi bi-calendar3"></i> Calendário</button></div>
            <section id="mass-list-panel" class="card-surface">
                <form id="mass-filters" class="toolbar song-toolbar"><div class="search-control"><i class="bi bi-search"></i><input id="mass-search" class="form-control" type="search" placeholder="Pesquisar igreja, celebração ou coro"></div><div class="filter-controls"><label class="filter-select"><select id="mass-status" class="form-select form-select-sm"><option value="current">Todas as atuais</option><option value="upcoming">Próximas</option><option value="past">Passadas</option><option value="archived">Arquivadas</option></select></label><label class="filter-select"><select id="mass-season" class="form-select form-select-sm"><option value="">Todos os tempos</option></select></label></div><span id="mass-count" class="result-count"></span></form>
                <div id="masses-result">${loadingState("A carregar missas…")}</div>
            </section>
            <section id="mass-calendar-panel" class="card-surface d-none"><div class="calendar-toolbar"><button class="icon-button" data-calendar-previous><i class="bi bi-chevron-left"></i></button><h3 id="calendar-month"></h3><button class="icon-button" data-calendar-next><i class="bi bi-chevron-right"></i></button></div><div id="mass-calendar">${loadingState("A carregar calendário…")}</div></section>
        `,
        mount
    };
}

async function mount() {
    const query = new URLSearchParams(window.location.search);
    const state = {
        search: query.get("search") ?? "",
        status: ["current", "upcoming", "past", "archived"].includes(query.get("status")) ? query.get("status") : "current",
        seasonId: query.get("seasonId") ?? "",
        page: positiveInteger(query.get("page"), 1),
        pageSize: 10,
        sortBy: ["date", "celebration", "church", "season", "songs", "status"].includes(query.get("sortBy")) ? query.get("sortBy") : "date",
        sortOrder: ["asc", "desc"].includes(query.get("sortOrder")) ? query.get("sortOrder") : "desc"
    };
    const references = await getMassReferences();
    document.querySelector("#mass-season").insertAdjacentHTML("beforeend", references.seasons.map((season) => `<option value="${escapeHtml(season.id)}">${escapeHtml(season.name)}</option>`).join(""));
    document.querySelector("#mass-search").value = state.search;
    document.querySelector("#mass-status").value = state.status;
    document.querySelector("#mass-season").value = state.seasonId;
    let month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
    let timer;
    const loadList = async () => {
        const target = document.querySelector("#masses-result"); target.innerHTML = loadingState("A carregar missas…");
        syncUrl(state);
        try { const response = await getMasses(state); state.page = response.pagination.page; renderList(response); syncUrl(state); }
        catch (error) { target.innerHTML = `<div class="inline-state text-danger">${escapeHtml(error.message)}</div>`; }
    };
    const loadCalendar = async () => {
        const from = new Date(month.getFullYear(), month.getMonth(), 1);
        const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);
        document.querySelector("#calendar-month").textContent = new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" }).format(month);
        document.querySelector("#mass-calendar").innerHTML = loadingState("A carregar calendário…");
        const masses = await getMassCalendar(from.toISOString(), to.toISOString());
        renderCalendar(month, masses);
    };
    document.querySelectorAll("[data-mass-view]").forEach((button) => button.addEventListener("click", async () => {
        document.querySelectorAll("[data-mass-view]").forEach((item) => item.classList.toggle("active", item === button));
        const calendar = button.dataset.massView === "calendar";
        document.querySelector("#mass-list-panel").classList.toggle("d-none", calendar);
        document.querySelector("#mass-calendar-panel").classList.toggle("d-none", !calendar);
        if (calendar) await loadCalendar();
    }));
    document.querySelector("#mass-search").addEventListener("input", (event) => {
        clearTimeout(timer); timer = setTimeout(() => { state.search = event.target.value.trim(); state.page = 1; loadList(); }, 250);
    });
    document.querySelector("#mass-filters").addEventListener("submit", (event) => {
        event.preventDefault();
        state.search = document.querySelector("#mass-search").value.trim();
        state.page = 1;
        loadList();
    });
    document.querySelectorAll("#mass-filters select").forEach((select) => select.addEventListener("change", () => {
        state.status = document.querySelector("#mass-status").value; state.seasonId = document.querySelector("#mass-season").value; state.page = 1; loadList();
    }));
    document.querySelector("#masses-result").addEventListener("click", async (event) => {
        const sort = event.target.closest("[data-sort]");
        const page = event.target.closest("[data-page]");
        const archive = event.target.closest("[data-archive-mass]");
        const restore = event.target.closest("[data-restore-mass]");
        if (sort) {
            const sortBy = sort.dataset.sort;
            state.sortOrder = state.sortBy === sortBy && state.sortOrder === "asc" ? "desc" : "asc";
            state.sortBy = sortBy;
            state.page = 1;
            await loadList();
        }
        else if (page && !page.disabled) { state.page = Number(page.dataset.page); await loadList(); }
        else if (archive || restore) await toggleArchive(archive || restore, Boolean(restore), loadList);
    });
    document.querySelector("[data-calendar-previous]").addEventListener("click", async () => { month = new Date(month.getFullYear(), month.getMonth() - 1, 1); await loadCalendar(); });
    document.querySelector("[data-calendar-next]").addEventListener("click", async () => { month = new Date(month.getFullYear(), month.getMonth() + 1, 1); await loadCalendar(); });
    showFlash(); await loadList();
}

function renderList(response) {
    document.querySelector("#mass-count").textContent = `${response.pagination.totalItems} ${response.pagination.totalItems === 1 ? "missa" : "missas"}`;
    const emptyContent = emptyState({
        icon: "calendar3",
        title: "Nenhuma missa encontrada",
        description: "Planeie a próxima celebração.",
        action: '<a href="/masses/new" class="btn btn-outline-primary" data-link>Planear missa</a>'
    });

    document.querySelector("#masses-result").innerHTML = `
        ${response.data.length
            ? `<div class="song-card-sort">
                <span>Ordenar por</span>
                ${sortButton("date", "Data e hora", response.sort)}
                ${sortButton("celebration", "Celebração", response.sort)}
                ${sortButton("church", "Igreja", response.sort)}
                ${sortButton("season", "Tempo litúrgico", response.sort)}
                ${sortButton("songs", "Cânticos", response.sort)}
                ${sortButton("status", "Estado", response.sort)}
            </div>
            <div class="song-card-list mass-card-list">
                ${response.data.map(massCard).join("")}
            </div>`
            : emptyContent}
        ${pagination(response.pagination)}
    `;
}

function massCard(mass) {
    const archived = Boolean(mass.deletedAt);
    const id = encodeURIComponent(mass.id);
    const rawLabel = mass.celebration?.name || "Missa";
    const label = escapeHtml(rawLabel);
    const title = archived
        ? `<span class="song-card-title">${label}</span>`
        : `<a href="/masses/${id}" class="song-card-title" data-link>${label}</a>`;
    const songsCount = mass.songs.length;
    const church = mass.church || "S. Salvador de Fornelos";
    const season = mass.season?.name || "Sem tempo litúrgico";
    const choir = mass.choir ? `<span><i class="bi bi-people"></i> ${escapeHtml(mass.choir)}</span>` : "";

    return `
        <article class="song-card-item mass-card-item">
            <div class="song-card-main">
                <div class="song-card-title-row">${title}</div>
                <div class="mass-card-date"><i class="bi bi-calendar-event"></i> ${formatDateTime(mass.startsAt)}</div>
                <div class="mass-card-context">
                    <span><i class="bi bi-geo-alt"></i> ${escapeHtml(church)}</span>
                    <span><i class="bi bi-calendar3"></i> ${escapeHtml(season)}</span>
                    ${choir}
                </div>
                <p class="song-card-type-line">${songsCount} ${songsCount === 1 ? "cântico selecionado" : "cânticos selecionados"}</p>
            </div>
            <div class="song-card-meta">
                <small>${statusBadge(mass.active, archived)}</small>
            </div>
            <div class="song-card-actions">
                <div class="row-actions">
                    ${archived
                        ? `<button class="btn btn-sm btn-light" data-restore-mass="${mass.id}" data-label="${label}"><i class="bi bi-arrow-counterclockwise"></i> Restaurar</button>`
                        : `<a href="/masses/${id}" class="icon-button" data-link title="Ver"><i class="bi bi-eye"></i></a><a href="/masses/${id}/edit" class="icon-button" data-link title="Editar"><i class="bi bi-pencil"></i></a><button class="icon-button icon-button-danger" data-archive-mass="${mass.id}" data-label="${label}" title="Eliminar"><i class="bi bi-trash3"></i></button>`}
                </div>
            </div>
        </article>
    `;
}

function sortButton(key, label, sort = {}) {
    const active = sort.by === key;
    const icon = active && sort.order === "asc" ? "arrow-up" : "arrow-down";
    return `
        <button
            class="table-sort ${active ? "active" : ""}"
            type="button"
            data-sort="${key}"
        >${escapeHtml(label)} <i class="bi bi-${icon}"></i></button>
    `;
}

function renderCalendar(month, masses) {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells = Array.from({ length: offset }, () => '<div class="calendar-day outside"></div>');
    for (let day = 1; day <= days; day += 1) {
        const events = masses.filter((mass) => {
            const date = new Date(mass.startsAt);
            return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth() && date.getDate() === day;
        });
        cells.push(`<div class="calendar-day"><span class="calendar-date">${day}</span>${events.map((mass) => `<a href="/masses/${encodeURIComponent(mass.id)}" class="calendar-event" data-link><strong>${new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" }).format(new Date(mass.startsAt))}</strong><span>${escapeHtml(mass.celebration?.name || mass.church)}</span></a>`).join("")}</div>`);
    }
    document.querySelector("#mass-calendar").innerHTML = `<div class="calendar-weekdays">${["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => `<span>${day}</span>`).join("")}</div><div class="calendar-grid">${cells.join("")}</div>`;
}

function syncUrl(state) {
    const query = new URLSearchParams();
    const defaults = {
        page: 1,
        sortBy: "date",
        sortOrder: "desc",
        status: "current"
    };

    Object.entries(state).forEach(([key, value]) => {
        if (key === "pageSize") {
            return;
        }
        if (value !== "" && value !== defaults[key]) {
            query.set(key, value);
        }
    });

    window.history.replaceState(
        {},
        "",
        `/masses${query.size ? `?${query}` : ""}`
    );
}

function positiveInteger(value, fallback) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function toggleArchive(button, restoring, reload) {
    const confirmed = await confirmDialog({
        title: restoring ? "Restaurar missa?" : "Eliminar planeamento?",
        message: restoring
            ? `${button.dataset.label} será restaurada.`
            : `${button.dataset.label} será removida da lista de missas.`,
        confirmLabel: restoring ? "Restaurar" : "Eliminar",
        variant: restoring ? "primary" : "danger"
    });
    if (!confirmed) return; button.disabled = true;
    try { if (restoring) await restoreMass(button.dataset.restoreMass); else await archiveMass(button.dataset.archiveMass); showToast(`Planeamento ${restoring ? "restaurado" : "eliminado"}.`); await reload(); }
    catch (error) { showToast(error.message, "danger"); button.disabled = false; }
}
