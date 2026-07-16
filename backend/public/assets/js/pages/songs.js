import {
    deleteSong,
    getSongListPdf,
    getSongs,
    permanentlyDeleteSong,
    restoreSong
} from "../api/songs.api.js";
import { getTags } from "../api/tags.api.js";
import { confirmDialog } from "../components/modal.js";
import { pagination } from "../components/pagination.js";
import { showFlash, showToast } from "../components/toast.js";
import {
    emptyState,
    loadingState,
    typeBadges
} from "../components/ui.js";
import {
    escapeHtml,
    formatDate,
    songTypesLabel,
    SONG_TYPES
} from "../utils/format.js";
import { groupTags } from "../utils/tags.js";
import { can, PERMISSIONS } from "../utils/permissions.js";

export function songsPage() {
    return {
        title: "Cânticos",
        render: () => `
            <section class="page-heading">
                <div>
                    <p class="eyebrow">Biblioteca</p>
                    <h2>O seu repertório</h2>
                    <p class="page-description">
                        Consulte, mantenha e desenvolva a música utilizada pela sua comunidade.
                    </p>
                </div>
                <div class="d-flex flex-wrap gap-2">
                    <button id="export-song-list" class="btn btn-light" type="button">
                        <i class="bi bi-file-earmark-pdf"></i>
                        Exportar listagem
                    </button>
                    ${can(PERMISSIONS.MANAGE_SONGS)
                        ? `<a href="/songs/new" class="btn btn-primary" data-link>
                            <i class="bi bi-plus-lg"></i>
                            Adicionar cântico
                        </a>`
                        : ""}
                </div>
            </section>

            <section class="card-surface">
                <form id="song-search" class="toolbar song-toolbar" role="search">
                    <div class="search-control">
                        <i class="bi bi-search"></i>
                        <input
                            id="search-input"
                            class="form-control"
                            type="search"
                            placeholder="Pesquisar título, compositor, arranjo ou observações"
                            autocomplete="off"
                            aria-label="Pesquisar cânticos"
                        >
                    </div>
                    <div class="filter-controls">
                        ${filterSelect("status-filter", "Estado", [
                            ...(can(PERMISSIONS.DELETE_SONGS)
                                ? [["all", "Todos os cânticos"]]
                                : []),
                            ["current", "Todos os atuais"],
                            ["active", "Ativos"],
                            ["inactive", "Inativos"],
                            ...(can(PERMISSIONS.DELETE_SONGS)
                                ? [
                                    ["inactiveOrArchived", "Inativos e arquivados"],
                                    ["archived", "Arquivados"]
                                ]
                                : [])
                        ])}
                        ${filterSelect("type-filter", "Tipo", [
                            ["", "Todos os tipos"],
                            ...SONG_TYPES
                        ])}
                        ${filterSelect("tag-filter", "Contexto", [["", "Todos os contextos"]])}
                        ${filterSelect("page-size-filter", "Por página", [
                            ["10000", "Todos"],
                            ["10", "10 por página"],
                            ["25", "25 por página"],
                            ["50", "50 por página"],
                            ["100", "100 por página"]
                        ])}
                    </div>
                    <span id="song-count" class="result-count"></span>
                </form>
                <div id="songs-result" aria-live="polite">
                    ${loadingState("A carregar cânticos…")}
                </div>
            </section>
        `,
        mount: mountSongsPage
    };
}

async function mountSongsPage() {
    const state = readState();
    const form = document.querySelector("#song-search");
    const input = document.querySelector("#search-input");
    const result = document.querySelector("#songs-result");
    let requestSequence = 0;
    let debounceTimer;

    input.value = state.search;
    document.querySelector("#status-filter").value = state.status;
    document.querySelector("#type-filter").value = state.songType;
    document.querySelector("#page-size-filter").value = String(state.pageSize);

    const tags = await getTags();
    populateTagSelect(document.querySelector("#tag-filter"), tags, state.tagId);

    document.querySelector("#export-song-list").addEventListener("click", async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        try {
            const pdf = await getSongListPdf(state);
            downloadBlob(pdf.blob, pdf.filename);
            showToast("Listagem de cânticos exportada.");
        } catch (error) {
            showToast(error.message, "danger");
        } finally {
            button.disabled = false;
        }
    });

    const load = async () => {
        const sequence = ++requestSequence;
        result.innerHTML = loadingState("A carregar cânticos…");
        syncUrl(state);

        try {
            const response = await getSongs(state);

            if (sequence === requestSequence) {
                state.page = response.pagination.page;
                renderSongs(response, state);
                syncUrl(state);
            }
        } catch (error) {
            if (sequence === requestSequence) {
                result.innerHTML = `
                    <div class="inline-state text-danger">
                        <i class="bi bi-exclamation-circle"></i>
                        ${escapeHtml(error.message)}
                    </div>
                `;
            }
        }
    };

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        state.search = input.value.trim();
        state.page = 1;
        load();
    });
    input.addEventListener("input", () => {
        window.clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => {
            state.search = input.value.trim();
            state.page = 1;
            load();
        }, 250);
    });
    form.querySelectorAll("select").forEach((select) => {
        select.addEventListener("change", () => {
            state.status = document.querySelector("#status-filter").value;
            state.songType = document.querySelector("#type-filter").value;
            state.tagId = document.querySelector("#tag-filter").value;
            state.pageSize = Number(document.querySelector("#page-size-filter").value);
            state.page = 1;
            load();
        });
    });
    result.addEventListener("click", async (event) => {
        const sortButton = event.target.closest("[data-sort]");
        const pageButton = event.target.closest("[data-page]");
        const deleteButton = event.target.closest("[data-delete-song]");
        const permanentDeleteButton = event.target.closest("[data-permanent-delete-song]");
        const restoreButton = event.target.closest("[data-restore-song]");

        if (sortButton) {
            const sortBy = sortButton.dataset.sort;
            state.sortOrder = state.sortBy === sortBy && state.sortOrder === "asc"
                ? "desc"
                : "asc";
            state.sortBy = sortBy;
            state.page = 1;
            await load();
            return;
        }

        if (pageButton && !pageButton.disabled) {
            state.page = Number(pageButton.dataset.page);
            await load();
            document.querySelector(".card-surface")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
            return;
        }

        if (deleteButton) {
            await archiveSong(deleteButton, load);
            return;
        }

        if (restoreButton) {
            await restoreArchivedSong(restoreButton, load);
            return;
        }

        if (permanentDeleteButton) {
            await removeArchivedSong(permanentDeleteButton, load);
        }
    });

    showFlash();
    await load();
}

function renderSongs(response, state) {
    const result = document.querySelector("#songs-result");
    const count = document.querySelector("#song-count");
    const { data: songs } = response;

    count.textContent = `${response.pagination.totalItems} ${
        response.pagination.totalItems === 1 ? "cântico" : "cânticos"
    }`;

    const emptyContent = emptyState({
        icon: state.status === "archived" ? "archive" : "music-note",
        title: state.status === "archived" ? "Sem cânticos arquivados" : "Nenhum cântico encontrado",
        description: state.status === "archived"
            ? "Os cânticos arquivados continuarão disponíveis para restauro."
            : "Experimente outro filtro ou adicione o primeiro cântico.",
        action: state.status === "archived"
            ? ""
            : can(PERMISSIONS.MANAGE_SONGS)
                ? '<a href="/songs/new" class="btn btn-outline-primary" data-link>Adicionar cântico</a>'
                : ""
    });

    result.innerHTML = `
        ${songs.length
            ? `<div class="song-card-sort">
                <span>Ordenar por</span>
                ${sortButton("title", "Título", response.sort)}
                ${sortButton("composerName", "Compositor", response.sort)}
                ${sortButton("updatedAt", "Atualização", response.sort)}
            </div>
            <div class="song-card-list">
                ${songs.map(songCard).join("")}
            </div>`
            : emptyContent}
        ${pagination(response.pagination)}
    `;
}

function songCard(song) {
    const encodedId = encodeURIComponent(song.id);
    const safeTitle = escapeHtml(song.title);
    const archived = Boolean(song.deletedAt);
    const title = archived
        ? `<span class="song-card-title">${safeTitle}</span>`
        : `<a href="/songs/${encodedId}" class="song-card-title" data-link>${safeTitle}</a>`;
    const times = song.tags.filter(({ group }) => (
        group?.id === "tag-group-liturgical-season"
    ));
    const tagChips = song.tags
        .filter(({ group }) => group?.id !== "tag-group-liturgical-season")
        .slice(0, 8);
    const secondaryCredits = [
        song.arrangerName ? `Arr.: ${song.arrangerName}` : "",
        song.harmonizerName ? `Harm.: ${song.harmonizerName}` : ""
    ].filter(Boolean).join(" · ");
    const excerpt = songExcerpt(song);

    return `
        <article class="song-card-item">
            <div class="song-card-main">
                <div class="song-card-title-row">
                    ${title}
                </div>
                <div class="song-card-author">
                    ${escapeHtml(song.composerName)}
                    ${secondaryCredits ? `<small>${escapeHtml(secondaryCredits)}</small>` : ""}
                </div>
                ${times.length
                    ? `<div class="song-liturgical-times">${times.map((tag) => (
                        tagLink(tag, "type-badge")
                    )).join("")}</div>`
                    : ""}
                ${song.subtitle
                    ? `<span class="song-subtitle">${escapeHtml(song.subtitle)}</span>`
                    : ""}
                <p class="song-card-type-line">${escapeHtml(songTypesLabel(song.songTypes) || "Outro")}</p>
                ${excerpt ? `<p class="song-card-excerpt">${escapeHtml(excerpt)}</p>` : ""}
                ${tagChips.length
                    ? `<div class="song-card-tags">${tagChips.map((tag) => (
                        tagLink(tag)
                    )).join("")}</div>`
                    : ""}
            </div>
            <div class="song-card-meta">
                <div class="song-card-type-badges">${typeBadges(song.songTypes)}</div>
                <small>${song.originalKey ? `Tonalidade: ${escapeHtml(song.originalKey)}` : formatDate(song.updatedAt)}</small>
            </div>
            <div class="song-card-actions">
                <div class="row-actions">
                    ${archived ? restoreAction(song, safeTitle) : currentActions(song, encodedId, safeTitle)}
                </div>
            </div>
        </article>
    `;
}

function songExcerpt(song) {
    const source = song.lyrics || song.notes || song.subtitle || "";
    return source
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180);
}

function tagLink(tag, className = "") {
    return `
        <a
            href="/songs?tagId=${encodeURIComponent(tag.id)}"
            class="${className}"
            data-link
            title="Ver cânticos com a tag ${escapeHtml(tag.name)}"
        >${escapeHtml(tag.name)}</a>
    `;
}

function sortButton(key, label, sort) {
    const active = sort.by === key;
    const icon = active && sort.order === "asc" ? "arrow-up" : "arrow-down";
    return `
        <button
            class="table-sort ${active ? "active" : ""}"
            type="button"
            data-sort="${key}"
        >${label} ${active ? `<i class="bi bi-${icon}"></i>` : ""}</button>
    `;
}

function currentActions(song, encodedId, safeTitle) {
    return `
        <a
            href="/songs/${encodedId}"
            class="icon-button"
            aria-label="Ver ${safeTitle}"
            title="Ver"
            data-link
        ><i class="bi bi-eye"></i></a>
        ${can(PERMISSIONS.MANAGE_SONGS) ? `<a
            href="/songs/${encodedId}/edit"
            class="icon-button"
            aria-label="Editar ${safeTitle}"
            title="Editar"
            data-link
        ><i class="bi bi-pencil"></i></a>` : ""}
        ${can(PERMISSIONS.DELETE_SONGS) ? `<button
            class="icon-button icon-button-danger"
            type="button"
            data-delete-song="${escapeHtml(song.id)}"
            data-song-title="${safeTitle}"
            aria-label="Arquivar ${safeTitle}"
            title="Arquivar"
        ><i class="bi bi-archive"></i></button>` : ""}
    `;
}

function restoreAction(song, safeTitle) {
    if (!can(PERMISSIONS.DELETE_SONGS)) {
        return "";
    }
    return `
        <button
            class="btn btn-sm btn-light"
            type="button"
            data-restore-song="${escapeHtml(song.id)}"
            data-song-title="${safeTitle}"
        ><i class="bi bi-arrow-counterclockwise"></i> Restaurar</button>
        <button
            class="btn btn-sm btn-light text-danger"
            type="button"
            data-permanent-delete-song="${escapeHtml(song.id)}"
            data-song-title="${safeTitle}"
        ><i class="bi bi-trash3"></i> Eliminar</button>
    `;
}

async function archiveSong(button, reload) {
    const title = button.dataset.songTitle;
    const confirmed = await confirmDialog({
        title: "Arquivar cântico?",
        message: `“${title}” sairá do repertório atual, mas poderá ser restaurado mais tarde.`,
        confirmLabel: "Arquivar"
    });

    if (!confirmed) {
        return;
    }

    button.disabled = true;
    try {
        await deleteSong(button.dataset.deleteSong);
        showToast(`“${title}” foi arquivado.`);
        await reload();
    } catch (error) {
        showToast(error.message, "danger");
        button.disabled = false;
    }
}

async function restoreArchivedSong(button, reload) {
    const title = button.dataset.songTitle;
    const confirmed = await confirmDialog({
        title: "Restaurar cântico?",
        message: `“${title}” regressará ao repertório ativo.`,
        confirmLabel: "Restaurar",
        variant: "primary"
    });

    if (!confirmed) {
        return;
    }

    button.disabled = true;
    try {
        await restoreSong(button.dataset.restoreSong);
        showToast(`“${title}” foi restaurado.`);
        await reload();
    } catch (error) {
        showToast(error.message, "danger");
        button.disabled = false;
    }
}

async function removeArchivedSong(button, reload) {
    const title = button.dataset.songTitle;
    const confirmed = await confirmDialog({
        title: "Eliminar cântico definitivamente?",
        message: `“${title}” e os respetivos ficheiros serão eliminados. O cântico também será removido dos planeamentos de missas. Esta ação não pode ser anulada.`,
        confirmLabel: "Eliminar definitivamente"
    });

    if (!confirmed) {
        return;
    }

    button.disabled = true;
    try {
        await permanentlyDeleteSong(button.dataset.permanentDeleteSong);
        showToast(`“${title}” foi eliminado definitivamente.`);
        await reload();
    } catch (error) {
        showToast(error.message, "danger");
        button.disabled = false;
    }
}

function readState() {
    const query = new URLSearchParams(window.location.search);
    const defaultStatus = can(PERMISSIONS.DELETE_SONGS) ? "all" : "current";
    const page = Number(query.get("page"));
    const pageSize = Number(query.get("pageSize"));
    const sortBy = query.get("sortBy");
    const sortOrder = query.get("sortOrder");
    const status = query.get("status");
    const songType = query.get("songType");

    return {
        search: query.get("search") ?? "",
        page: Number.isInteger(page) && page > 0 ? page : 1,
        pageSize: [10, 25, 50, 100, 10000].includes(pageSize) ? pageSize : 10000,
        sortBy: ["title", "composerName", "createdAt", "updatedAt"].includes(sortBy)
            ? sortBy
            : "title",
        sortOrder: ["asc", "desc"].includes(sortOrder) ? sortOrder : "asc",
        status: ["all", "current", "active", "inactive", "inactiveOrArchived", "archived"].includes(status)
            && (status !== "all" || can(PERMISSIONS.DELETE_SONGS))
            ? status
            : defaultStatus,
        songType: SONG_TYPES.some(([value]) => value === songType) ? songType : "",
        tagId: query.get("tagId") ?? ""
    };
}

function syncUrl(state) {
    const query = new URLSearchParams();
    const defaults = {
        page: 1,
        pageSize: 10000,
        sortBy: "title",
        sortOrder: "asc",
        status: can(PERMISSIONS.DELETE_SONGS) ? "all" : "current"
    };

    Object.entries(state).forEach(([key, value]) => {
        if (value !== "" && value !== defaults[key]) {
            query.set(key, value);
        }
    });

    const suffix = query.size > 0 ? `?${query}` : "";
    window.history.replaceState({}, "", `/songs${suffix}`);
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function filterSelect(id, label, options) {
    return `
        <label class="filter-select">
            <span class="visually-hidden">${label}</span>
            <select id="${id}" class="form-select form-select-sm" aria-label="${label}">
                ${options.map(([value, optionLabel]) => (
                    `<option value="${value}">${optionLabel}</option>`
                )).join("")}
            </select>
        </label>
    `;
}

function populateTagSelect(select, tags, selectedValue) {
    const groups = groupTags(tags);

    select.insertAdjacentHTML(
        "beforeend",
        Object.entries(groups).map(([group, groupTags]) => `
            <optgroup label="${escapeHtml(group)}">
                ${groupTags.map((tag) => (
                    `<option value="${escapeHtml(tag.id)}">${escapeHtml(tag.name)}</option>`
                )).join("")}
            </optgroup>
        `).join("")
    );
    select.value = selectedValue;
}
