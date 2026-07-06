import { archiveScore, getScores, restoreScore } from "../api/scores.api.js";
import { dataTable } from "../components/data-table.js";
import { confirmDialog } from "../components/modal.js";
import { pagination } from "../components/pagination.js";
import { showFlash, showToast } from "../components/toast.js";
import { emptyState, loadingState, statusBadge } from "../components/ui.js";
import { escapeHtml, formatDate } from "../utils/format.js";
import {
    can,
    canManageScoreForSong,
    PERMISSIONS
} from "../utils/permissions.js";
import { SCORE_CATEGORIES, scoreCategoryLabel } from "../utils/scores.js";

const columns = [
    { key: "title", label: "Partitura", sortable: true },
    { key: "song", label: "Cântico" },
    { key: "category", label: "Tipo" },
    { key: "format", label: "Formato", sortable: true },
    { key: "versions", label: "Versões" },
    { key: "updatedAt", label: "Atualizada", sortable: true },
    { key: "status", label: "Estado" },
    { key: "actions", label: '<span class="visually-hidden">Ações</span>' }
];

export function scoresPage() {
    return {
        title: "Partituras",
        render: () => `
            <section class="page-heading"><div><p class="eyebrow">Biblioteca</p><h2>Partituras</h2><p class="page-description">Ficheiros PDF e MusicXML com versões associados ao repertório.</p></div>${can(PERMISSIONS.MANAGE_SCORES) ? '<a href="/scores/new" class="btn btn-primary" data-link><i class="bi bi-file-earmark-plus"></i> Adicionar partitura</a>' : ""}</section>
            <section class="card-surface">
                <form id="score-filters" class="toolbar song-toolbar">
                    <div class="search-control"><i class="bi bi-search"></i><input id="score-search" class="form-control" type="search" placeholder="Pesquisar partituras ou cânticos"></div>
                    <div class="filter-controls">
                        ${filter("score-format", [["", "Todos os formatos"], ["PDF", "PDF"], ["MUSICXML", "MusicXML"]])}
                        ${filter("score-category", [["", "Todos os tipos"], ...SCORE_CATEGORIES])}
                        ${filter("score-status", [["current", "Todas as atuais"], ["active", "Ativas"], ["inactive", "Inativas"], ...(can(PERMISSIONS.DELETE_SCORES) ? [["archived", "Arquivadas"]] : [])])}
                    </div>
                    <span id="score-count" class="result-count"></span>
                </form>
                <div id="scores-result">${loadingState("A carregar partituras…")}</div>
            </section>
        `,
        mount: mount
    };
}

async function mount() {
    const query = new URLSearchParams(window.location.search);
    const state = {
        search: query.get("search") ?? "",
        format: ["PDF", "MUSICXML"].includes(query.get("format")) ? query.get("format") : "",
        category: SCORE_CATEGORIES.some(([value]) => value === query.get("category")) ? query.get("category") : "",
        status: ["current", "active", "inactive", "archived"].includes(query.get("status")) ? query.get("status") : "current",
        page: 1, pageSize: 10, sortBy: "updatedAt", sortOrder: "desc"
    };
    const result = document.querySelector("#scores-result");
    const input = document.querySelector("#score-search");
    input.value = state.search;
    document.querySelector("#score-format").value = state.format;
    document.querySelector("#score-category").value = state.category;
    document.querySelector("#score-status").value = state.status;
    let timer;
    const load = async () => {
        result.innerHTML = loadingState("A carregar partituras…");
        try {
            const response = await getScores(state);
            state.page = response.pagination.page;
            render(response, state);
        } catch (error) {
            result.innerHTML = `<div class="inline-state text-danger">${escapeHtml(error.message)}</div>`;
        }
    };
    document.querySelector("#score-filters").addEventListener("submit", (event) => {
        event.preventDefault();
        state.search = input.value.trim();
        state.page = 1;
        load();
    });
    input.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => { state.search = input.value.trim(); state.page = 1; load(); }, 250);
    });
    document.querySelectorAll("#score-filters select").forEach((select) => select.addEventListener("change", () => {
        state.format = document.querySelector("#score-format").value;
        state.category = document.querySelector("#score-category").value;
        state.status = document.querySelector("#score-status").value;
        state.page = 1;
        load();
    }));
    result.addEventListener("click", async (event) => {
        const sort = event.target.closest("[data-sort]");
        const page = event.target.closest("[data-page]");
        const archive = event.target.closest("[data-archive-score]");
        const restore = event.target.closest("[data-restore-score]");
        if (sort) {
            state.sortOrder = state.sortBy === sort.dataset.sort && state.sortOrder === "asc" ? "desc" : "asc";
            state.sortBy = sort.dataset.sort; state.page = 1; await load();
        } else if (page && !page.disabled) {
            state.page = Number(page.dataset.page); await load();
        } else if (archive || restore) {
            await toggleArchive(archive || restore, Boolean(restore), load);
        }
    });
    showFlash();
    await load();
}

function render(response, state) {
    document.querySelector("#score-count").textContent = `${response.pagination.totalItems} ${response.pagination.totalItems === 1 ? "partitura" : "partituras"}`;
    document.querySelector("#scores-result").innerHTML = `
        ${dataTable({
            columns,
            rows: response.data.map(row),
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
            emptyContent: emptyState({ icon: "file-earmark-music", title: state.status === "archived" ? "Sem partituras arquivadas" : "Nenhuma partitura encontrada", description: "Carregue uma partitura PDF ou MusicXML.", action: state.status === "archived" || !can(PERMISSIONS.MANAGE_SCORES) ? "" : '<a href="/scores/new" class="btn btn-outline-primary" data-link>Adicionar partitura</a>' })
        })}
        ${pagination(response.pagination)}
    `;
}

function row(score) {
    const archived = Boolean(score.deletedAt);
    const id = encodeURIComponent(score.id);
    const title = escapeHtml(score.title);
    const authorship = [
        score.song.composerName,
        score.song.arrangerName ? `Arr.: ${score.song.arrangerName}` : "",
        score.song.harmonizerName ? `Harm.: ${score.song.harmonizerName}` : ""
    ].filter(Boolean).join(" · ");
    const canManage = canManageScoreForSong(score.song);
    const canDelete = can(PERMISSIONS.DELETE_SCORES) && canManage;
    return `<tr>
        <td>${archived ? `<span class="song-title">${title}</span>` : `<a href="/scores/${id}" class="song-title" data-link>${title}</a>`}<span class="song-subtitle">${escapeHtml(authorship)}</span><span class="song-subtitle">${escapeHtml(score.latestVersion?.originalName || "Sem ficheiro")}</span></td>
        <td>${escapeHtml(score.song.title)}</td><td><span class="type-badge">${scoreCategoryLabel(score.category)}</span></td><td><span class="type-badge">${score.format === "MUSICXML" ? "MusicXML" : "PDF"}</span></td>
        <td>${score.versionCount}</td><td>${formatDate(score.updatedAt)}</td><td>${statusBadge(score.active, archived)}</td>
        <td><div class="row-actions">${archived
            ? canManage ? `<button class="btn btn-sm btn-light" data-restore-score="${score.id}" data-title="${title}"><i class="bi bi-arrow-counterclockwise"></i> Restaurar</button>` : ""
            : `<a href="/scores/${id}" class="icon-button" data-link title="Ver"><i class="bi bi-eye"></i></a>${canManage ? `<a href="/scores/${id}/edit" class="icon-button" data-link title="Editar"><i class="bi bi-pencil"></i></a>` : ""}${canDelete ? `<button class="icon-button icon-button-danger" data-archive-score="${score.id}" data-title="${title}" title="Arquivar"><i class="bi bi-archive"></i></button>` : ""}`
        }</div></td>
    </tr>`;
}

async function toggleArchive(button, restoring, reload) {
    const confirmed = await confirmDialog({ title: `${restoring ? "Restaurar" : "Arquivar"} partitura?`, message: `${button.dataset.title} será ${restoring ? "restaurada" : "mantida no arquivo"}.`, confirmLabel: restoring ? "Restaurar" : "Arquivar", variant: restoring ? "primary" : "danger" });
    if (!confirmed) return;
    button.disabled = true;
    try {
        if (restoring) await restoreScore(button.dataset.restoreScore);
        else await archiveScore(button.dataset.archiveScore);
        showToast(`Partitura ${restoring ? "restaurada" : "arquivada"}.`);
        await reload();
    } catch (error) { showToast(error.message, "danger"); button.disabled = false; }
}

function filter(id, options) {
    return `<label class="filter-select"><select id="${id}" class="form-select form-select-sm">${options.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></label>`;
}
