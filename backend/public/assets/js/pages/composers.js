import {
    getComposers,
    mergeComposers
} from "../api/composers.api.js";
import { confirmDialog } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import { loadingState } from "../components/ui.js";
import { escapeHtml } from "../utils/format.js";

export function composersPage() {
    return {
        title: "Compositores",
        render: () => `
            <section class="page-heading">
                <div>
                    <p class="eyebrow">Área de trabalho</p>
                    <h2>Compositores</h2>
                    <p class="page-description">
                        Corrija nomes e junte variantes que pertencem ao mesmo compositor.
                    </p>
                </div>
            </section>
            <div class="composer-management-grid">
                <section class="card-surface composer-catalogue">
                    <div class="toolbar">
                        <div class="search-control">
                            <i class="bi bi-search"></i>
                            <input
                                id="composer-search"
                                class="form-control"
                                type="search"
                                placeholder="Pesquisar compositor"
                                autocomplete="off"
                            >
                        </div>
                        <span id="composer-count" class="result-count"></span>
                    </div>
                    <div id="composer-list">
                        ${loadingState("A carregar compositores…")}
                    </div>
                </section>
                <section class="card-surface detail-card composer-editor">
                    <div class="card-heading">
                        <span class="card-heading-icon"><i class="bi bi-person-check"></i></span>
                        <div>
                            <h3>Nome unificado</h3>
                            <p>Selecione um ou mais nomes na lista</p>
                        </div>
                    </div>
                    <form id="composer-form" novalidate>
                        <div id="composer-selection" class="selected-composers"></div>
                        <div class="form-field">
                            <label class="form-label" for="composer-name">
                                Nome final <span>*</span>
                            </label>
                            <input
                                id="composer-name"
                                name="name"
                                class="form-control"
                                type="text"
                                maxlength="200"
                                required
                                disabled
                            >
                            <div class="invalid-feedback">
                                O nome final do compositor é obrigatório.
                            </div>
                        </div>
                        <p class="tag-help">
                            Todos os cânticos associados aos nomes selecionados serão atualizados.
                        </p>
                        <button
                            id="merge-composers"
                            class="btn btn-primary w-100"
                            type="submit"
                            disabled
                        >
                            Renomear compositor
                        </button>
                    </form>
                </section>
            </div>
        `,
        mount: mountComposers
    };
}

async function mountComposers() {
    const list = document.querySelector("#composer-list");
    const search = document.querySelector("#composer-search");
    const form = document.querySelector("#composer-form");
    const nameInput = document.querySelector("#composer-name");
    const selected = new Set();
    let composers;

    try {
        composers = await getComposers();
    } catch (error) {
        list.innerHTML = `<div class="inline-state text-danger">${escapeHtml(error.message)}</div>`;
        return;
    }

    const renderList = () => {
        const query = search.value.trim().toLocaleLowerCase("pt-PT");
        const filtered = composers.filter(({ name }) => (
            name.toLocaleLowerCase("pt-PT").includes(query)
        ));
        document.querySelector("#composer-count").textContent =
            `${filtered.length} ${filtered.length === 1 ? "compositor" : "compositores"}`;
        list.innerHTML = filtered.length
            ? `<div class="composer-list">
                ${filtered.map((composer) => composerOption(
                    composer,
                    selected.has(composer.name)
                )).join("")}
            </div>`
            : '<p class="attachment-empty composer-empty">Nenhum compositor encontrado.</p>';
    };

    const renderSelection = () => {
        const names = [...selected];
        const target = document.querySelector("#composer-selection");
        const button = document.querySelector("#merge-composers");

        target.innerHTML = names.length
            ? names.map((name) => (
                `<span class="tag-option static">${escapeHtml(name)}</span>`
            )).join("")
            : '<p class="attachment-empty mb-0">Nenhum nome selecionado.</p>';
        nameInput.disabled = names.length === 0;
        button.disabled = names.length === 0;
        button.textContent = names.length > 1
            ? `Juntar ${names.length} compositores`
            : "Renomear compositor";
    };

    search.addEventListener("input", renderList);
    list.addEventListener("change", (event) => {
        const checkbox = event.target.closest("[data-composer-name]");
        if (!checkbox) {
            return;
        }

        const previousSize = selected.size;
        if (checkbox.checked) {
            selected.add(checkbox.dataset.composerName);
            if (previousSize === 0) {
                nameInput.value = checkbox.dataset.composerName;
            }
        } else {
            selected.delete(checkbox.dataset.composerName);
            if (selected.size === 1) {
                nameInput.value = [...selected][0];
            }
        }
        renderSelection();
    });
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        form.classList.add("was-validated");
        if (selected.size === 0 || !form.checkValidity()) {
            return;
        }

        const sources = [...selected];
        const name = nameInput.value.trim();
        const confirmed = await confirmDialog({
            title: sources.length > 1
                ? "Juntar compositores?"
                : "Renomear compositor?",
            message: sources.length > 1
                ? `Os cânticos de ${sources.length} nomes passarão a utilizar “${name}”.`
                : `“${sources[0]}” passará a chamar-se “${name}” em todos os cânticos.`,
            confirmLabel: sources.length > 1 ? "Juntar" : "Renomear",
            variant: "primary"
        });
        if (!confirmed) {
            return;
        }

        const button = document.querySelector("#merge-composers");
        button.disabled = true;
        try {
            const result = await mergeComposers(sources, name);
            showToast(
                `${result.updatedSongs} ${
                    result.updatedSongs === 1 ? "cântico atualizado" : "cânticos atualizados"
                }.`
            );
            composers = await getComposers();
            selected.clear();
            nameInput.value = "";
            form.classList.remove("was-validated");
            renderList();
            renderSelection();
        } catch (error) {
            showToast(error.message, "danger");
            button.disabled = false;
        }
    });

    renderList();
    renderSelection();
}

function composerOption(composer, selected) {
    return `
        <article class="composer-option">
            <input
                class="form-check-input composer-select"
                type="checkbox"
                data-composer-name="${escapeHtml(composer.name)}"
                aria-label="Selecionar ${escapeHtml(composer.name)}"
                ${selected ? "checked" : ""}
            >
            <a href="/composers/${encodeURIComponent(composer.name)}" class="composer-card-link" data-link>
                <span class="composer-avatar">
                    ${composer.photoUrl
                        ? `<img src="${escapeHtml(composer.photoUrl)}" alt="">`
                        : '<i class="bi bi-person"></i>'}
                </span>
                <span class="composer-card-copy">
                    <strong>${escapeHtml(composer.name)}</strong>
                    <small>
                        ${composer.songCount}
                        ${composer.songCount === 1 ? "cântico" : "cânticos"}
                    </small>
                    <small>${escapeHtml(roleSummary(composer.roleCounts))}</small>
                </span>
            </a>
        </article>
    `;
}

function roleSummary(roleCounts = {}) {
    return [
        roleCounts.COMPOSER ? `${roleCounts.COMPOSER} comp.` : null,
        roleCounts.ARRANGER ? `${roleCounts.ARRANGER} arr.` : null,
        roleCounts.HARMONIZER ? `${roleCounts.HARMONIZER} harm.` : null
    ].filter(Boolean).join(" · ");
}
