import {
    archiveContributor,
    getContributors,
    restoreContributor
} from "../api/contributors.api.js";
import { dataTable } from "../components/data-table.js";
import { confirmDialog } from "../components/modal.js";
import { pagination } from "../components/pagination.js";
import { showFlash, showToast } from "../components/toast.js";
import { emptyState, loadingState, statusBadge } from "../components/ui.js";
import { contributorRoleLabel, CONTRIBUTOR_ROLES } from "../utils/contributors.js";
import { escapeHtml, formatDate } from "../utils/format.js";

const columns = [
    { key: "displayName", label: "Contribuidor", sortable: true },
    { key: "role", label: "Função", sortable: true },
    { key: "contact", label: "Contacto" },
    { key: "updatedAt", label: "Atualizado", sortable: true },
    { key: "status", label: "Estado" },
    { key: "actions", label: '<span class="visually-hidden">Ações</span>' }
];

export function contributorsPage() {
    return {
        title: "Contribuidores",
        render: () => `
            <section class="page-heading">
                <div>
                    <p class="eyebrow">Pessoas</p>
                    <h2>Contribuidores</h2>
                    <p class="page-description">Compositores, autores, arranjadores e todos os que constroem o repertório.</p>
                </div>
                <a href="/contributors/new" class="btn btn-primary" data-link>
                    <i class="bi bi-person-plus"></i> Adicionar contribuidor
                </a>
            </section>
            <section class="card-surface">
                <form id="contributor-filters" class="toolbar song-toolbar">
                    <div class="search-control">
                        <i class="bi bi-search"></i>
                        <input id="contributor-search" class="form-control" type="search" placeholder="Pesquisar contribuidores" aria-label="Pesquisar contribuidores">
                    </div>
                    <div class="filter-controls">
                        ${select("contributor-role", "Função", [["", "Todas as funções"], ...CONTRIBUTOR_ROLES])}
                        ${select("contributor-status", "Estado", [
                            ["current", "Todos os atuais"], ["active", "Ativos"],
                            ["inactive", "Inativos"], ["archived", "Arquivados"]
                        ])}
                    </div>
                    <span id="contributor-count" class="result-count"></span>
                </form>
                <div id="contributors-result">${loadingState("A carregar contribuidores…")}</div>
            </section>
        `,
        mount: mountContributors
    };
}

async function mountContributors() {
    const query = new URLSearchParams(window.location.search);
    const state = {
        search: query.get("search") ?? "",
        role: CONTRIBUTOR_ROLES.some(([value]) => value === query.get("role")) ? query.get("role") : "",
        status: ["current", "active", "inactive", "archived"].includes(query.get("status")) ? query.get("status") : "current",
        page: 1, pageSize: 10,
        sortBy: "displayName", sortOrder: "asc"
    };
    const result = document.querySelector("#contributors-result");
    const search = document.querySelector("#contributor-search");
    search.value = state.search;
    document.querySelector("#contributor-role").value = state.role;
    document.querySelector("#contributor-status").value = state.status;
    let timer;

    const load = async () => {
        result.innerHTML = loadingState("A carregar contribuidores…");
        try {
            const response = await getContributors(state);
            state.page = response.pagination.page;
            render(response, state);
        } catch (error) {
            result.innerHTML = errorState(error.message);
        }
    };

    document.querySelector("#contributor-filters").addEventListener("submit", (event) => {
        event.preventDefault();
        state.search = search.value.trim();
        state.page = 1;
        load();
    });
    search.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            state.search = search.value.trim();
            state.page = 1;
            load();
        }, 250);
    });
    document.querySelectorAll("#contributor-filters select").forEach((element) => {
        element.addEventListener("change", () => {
            state.role = document.querySelector("#contributor-role").value;
            state.status = document.querySelector("#contributor-status").value;
            state.page = 1;
            load();
        });
    });
    result.addEventListener("click", async (event) => {
        const sort = event.target.closest("[data-sort]");
        const page = event.target.closest("[data-page]");
        const archive = event.target.closest("[data-archive-contributor]");
        const restore = event.target.closest("[data-restore-contributor]");
        if (sort) {
            state.sortOrder = state.sortBy === sort.dataset.sort && state.sortOrder === "asc" ? "desc" : "asc";
            state.sortBy = sort.dataset.sort;
            state.page = 1;
            await load();
        } else if (page && !page.disabled) {
            state.page = Number(page.dataset.page);
            await load();
        } else if (archive) {
            await changeArchiveState(archive, false, load);
        } else if (restore) {
            await changeArchiveState(restore, true, load);
        }
    });
    showFlash();
    await load();
}

function render(response, state) {
    document.querySelector("#contributor-count").textContent =
        `${response.pagination.totalItems} ${response.pagination.totalItems === 1 ? "contribuidor" : "contribuidores"}`;
    const rows = response.data.map((item) => contributorRow(item));
    document.querySelector("#contributors-result").innerHTML = `
        ${dataTable({
            columns,
            rows,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
            emptyContent: emptyState({
                icon: "people",
                title: state.status === "archived" ? "Sem contribuidores arquivados" : "Nenhum contribuidor encontrado",
                description: "Ajuste os filtros ou adicione um contribuidor.",
                action: state.status === "archived" ? "" : '<a href="/contributors/new" class="btn btn-outline-primary" data-link>Adicionar contribuidor</a>'
            })
        })}
        ${pagination(response.pagination)}
    `;
}

function contributorRow(item) {
    const archived = Boolean(item.deletedAt);
    const id = encodeURIComponent(item.id);
    const name = escapeHtml(item.displayName);
    return `
        <tr>
            <td>
                ${archived ? `<span class="song-title">${name}</span>` : `<a href="/contributors/${id}" class="song-title" data-link>${name}</a>`}
                <span class="song-subtitle">${escapeHtml([item.name, item.surname].filter(Boolean).join(" "))}</span>
            </td>
            <td><span class="type-badge">${contributorRoleLabel(item.role)}</span></td>
            <td>${escapeHtml(item.email || item.phone || "—")}</td>
            <td>${formatDate(item.updatedAt)}</td>
            <td>${statusBadge(item.active, archived)}</td>
            <td><div class="row-actions">
                ${archived
                    ? `<button class="btn btn-sm btn-light" data-restore-contributor="${item.id}" data-name="${name}"><i class="bi bi-arrow-counterclockwise"></i> Restaurar</button>`
                    : `
                        <a href="/contributors/${id}" class="icon-button" title="Ver" data-link><i class="bi bi-eye"></i></a>
                        <a href="/contributors/${id}/edit" class="icon-button" title="Editar" data-link><i class="bi bi-pencil"></i></a>
                        <button class="icon-button icon-button-danger" data-archive-contributor="${item.id}" data-name="${name}" title="Arquivar"><i class="bi bi-archive"></i></button>
                    `}
            </div></td>
        </tr>
    `;
}

async function changeArchiveState(button, restoring, reload) {
    const confirmed = await confirmDialog({
        title: restoring ? "Restaurar contribuidor?" : "Arquivar contribuidor?",
        message: `${button.dataset.name} será ${restoring ? "devolvido ao diretório ativo" : "mantido no arquivo"}.`,
        confirmLabel: restoring ? "Restaurar" : "Arquivar",
        variant: restoring ? "primary" : "danger"
    });
    if (!confirmed) return;
    button.disabled = true;
    try {
        if (restoring) await restoreContributor(button.dataset.restoreContributor);
        else await archiveContributor(button.dataset.archiveContributor);
        showToast(`Contribuidor ${restoring ? "restaurado" : "arquivado"}.`);
        await reload();
    } catch (error) {
        showToast(error.message, "danger");
        button.disabled = false;
    }
}

function select(id, label, options) {
    return `<label class="filter-select"><span class="visually-hidden">${label}</span><select id="${id}" class="form-select form-select-sm">${options.map(([value, text]) => `<option value="${value}">${text}</option>`).join("")}</select></label>`;
}

function errorState(message) {
    return `<div class="inline-state text-danger"><i class="bi bi-exclamation-circle"></i>${escapeHtml(message)}</div>`;
}
