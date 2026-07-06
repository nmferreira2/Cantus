import {
    createSong,
    getSong,
    updateSong
} from "../api/songs.api.js";
import { ApiError } from "../api/client.js";
import { createTag, getTags } from "../api/tags.api.js";
import { getTagGroups } from "../api/tag-groups.api.js";
import {
    inputField,
    textareaField
} from "../components/form.js";
import { setFlash, showToast } from "../components/toast.js";
import { loadingState } from "../components/ui.js";
import { router } from "../router.js";
import { escapeHtml, SONG_TYPES } from "../utils/format.js";
import { groupTags } from "../utils/tags.js";

export function songFormPage(songId = null) {
    const editing = Boolean(songId);

    return {
        title: editing ? "Editar cântico" : "Novo cântico",
        render: () => `
            <section class="page-heading">
                <div>
                    <p class="eyebrow">Cânticos</p>
                    <h2>${editing ? "Editar cântico" : "Adicionar cântico"}</h2>
                    <p class="page-description">
                        Reúna a informação do repertório, o contexto litúrgico e as notas de trabalho.
                    </p>
                </div>
                <a
                    href="${editing ? `/songs/${encodeURIComponent(songId)}` : "/songs"}"
                    class="btn btn-light"
                    data-link
                >
                    <i class="bi bi-arrow-left"></i>
                    Cancelar
                </a>
            </section>

            <form id="song-form" class="card-surface form-card" novalidate>
                <div id="form-alert"></div>
                <fieldset ${editing ? "disabled" : ""}>
                    <div class="form-section">
                        <div>
                            <h3>Informação geral</h3>
                            <p>Os dados utilizados para identificar este cântico.</p>
                        </div>
                        <div class="form-grid">
                            ${inputField({ name: "title", label: "Título", required: true, requiredFeedback: "O título é obrigatório." })}
                            ${inputField({ name: "subtitle", label: "Subtítulo" })}
                            ${inputField({ name: "composerName", label: "Compositor", required: true, requiredFeedback: "O compositor é obrigatório." })}
                            ${inputField({ name: "arrangerName", label: "Arranjo" })}
                            ${inputField({ name: "harmonizerName", label: "Harmonização" })}
                            ${inputField({
                                name: "originalKey",
                                label: "Tonalidade original",
                                placeholder: "Ex.: Sol maior"
                            })}
                            <div class="form-field song-type-field">
                                <label class="form-label">
                                    Tipos de cântico <span>*</span>
                                </label>
                                <div id="song-type-options" class="tag-options">
                                    ${songTypeOptions()}
                                </div>
                                <div id="song-types-feedback" class="invalid-feedback">
                                    Selecione pelo menos um tipo de cântico.
                                </div>
                                <p class="tag-help">
                                    Pode selecionar vários tipos para o mesmo cântico.
                                </p>
                            </div>
                            ${inputField({
                                name: "language",
                                label: "Idioma",
                                placeholder: "Ex.: Português"
                            })}
                            <div class="form-check form-switch align-self-end mb-3">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="active"
                                    name="active"
                                    checked
                                >
                                <label class="form-check-label" for="active">Repertório ativo</label>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <div>
                            <h3>Tags litúrgicas</h3>
                            <p>Selecione ou remova tags e crie novas quando necessário.</p>
                        </div>
                        <div>
                            <div id="tag-options" class="tag-groups">
                                ${loadingState("A carregar tags…")}
                            </div>
                            <div id="tag-feedback" class="invalid-feedback"></div>
                            <p class="tag-help">Clique numa tag selecionada para a remover.</p>
                            <div class="new-tag-control">
                                <input
                                    id="new-tag-name"
                                    class="form-control"
                                    type="text"
                                    maxlength="100"
                                    placeholder="Nome da nova tag"
                                    aria-label="Nome da nova tag"
                                >
                                <select
                                    id="new-tag-group"
                                    class="form-select"
                                    aria-label="Grupo da nova tag"
                                ></select>
                                <button id="add-new-tag" class="btn btn-light" type="button">
                                    <i class="bi bi-plus-lg"></i> Adicionar nova tag
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <div>
                            <h3>Notas de trabalho</h3>
                            <p>Material opcional para ensaios e catalogação.</p>
                        </div>
                        <div class="form-grid">
                            ${textareaField({ name: "lyrics", label: "Letra" })}
                            ${textareaField({ name: "notes", label: "Observações" })}
                        </div>
                    </div>

                    <div class="form-actions">
                        <a href="/songs" class="btn btn-light" data-link>Cancelar</a>
                        <button class="btn btn-primary" type="submit">
                            <span class="button-label">${editing ? "Guardar alterações" : "Guardar cântico"}</span>
                            <span
                                class="spinner-border spinner-border-sm d-none"
                                aria-hidden="true"
                            ></span>
                        </button>
                    </div>
                </fieldset>
            </form>
        `,
        mount: () => mountSongForm(songId)
    };
}

async function mountSongForm(songId) {
    const form = document.querySelector("#song-form");
    const fieldset = form.querySelector("fieldset");

    try {
        const [tags, tagGroups, song] = await Promise.all([
            getTags(),
            getTagGroups(),
            songId ? getSong(songId) : Promise.resolve(null)
        ]);
        renderTags(tags, song?.tags.map((tag) => tag.id) ?? []);
        bindTagCreation(tags, tagGroups);

        if (song) {
            populateForm(form, song);
        }

        fieldset.disabled = false;
    } catch (error) {
        showFormAlert(error.message);
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearValidation(form);

        const validSongTypes = validateSongTypes(form);
        if (!form.checkValidity() || !validSongTypes) {
            form.classList.add("was-validated");
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        setSubmitting(submitButton, true);

        try {
            const data = serializeForm(form);
            const song = songId
                ? await updateSong(songId, data)
                : await createSong(data);

            setFlash(songId ? "Cântico atualizado com sucesso." : "Cântico adicionado com sucesso.");
            router.navigate(songId ? `/songs/${encodeURIComponent(song.id)}` : "/songs");
        } catch (error) {
            if (error instanceof ApiError) {
                showValidationErrors(form, error.details);
            }
            showFormAlert(error.message);
            setSubmitting(submitButton, false);
        }
    });
}

function songTypeOptions() {
    return SONG_TYPES.map(([value, label]) => {
        const id = `song-type-${value.toLocaleLowerCase()}`;
        return `
            <input
                class="btn-check"
                type="checkbox"
                id="${id}"
                name="songTypes"
                value="${value}"
                ${value === "OTHER" ? "checked" : ""}
            >
            <label class="tag-option" for="${id}">${label}</label>
        `;
    }).join("");
}

function bindTagCreation(initialTags, tagGroups) {
    const tags = [...initialTags];
    const input = document.querySelector("#new-tag-name");
    const groupSelect = document.querySelector("#new-tag-group");
    const button = document.querySelector("#add-new-tag");
    groupSelect.innerHTML = tagGroups.map((group) => `
        <option value="${escapeHtml(group.id)}">
            ${escapeHtml(group.name)}
        </option>
    `).join("");

    button.addEventListener("click", async () => {
        const name = input.value.trim();
        if (!name) {
            showToast("Introduza o nome da nova tag.", "warning");
            input.focus();
            return;
        }

        const selectedIds = [...document.querySelectorAll('input[name="tagIds"]')]
            .filter((element) => element.type === "hidden" || element.checked)
            .map((element) => element.value);
        button.disabled = true;

        try {
            const tag = await createTag({
                name,
                groupId: groupSelect.value,
                sortOrder: tags.filter(({ groupId }) => (
                    groupId === groupSelect.value
                )).length * 10
            });
            tags.push(tag);
            selectedIds.push(tag.id);
            renderTags(tags, selectedIds);
            input.value = "";
            showToast("Tag adicionada e selecionada.");
        } catch (error) {
            showToast(error.message, "danger");
        } finally {
            button.disabled = false;
        }
    });

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            button.click();
        }
    });
}

function renderTags(tags, selectedIds) {
    const target = document.querySelector("#tag-options");
    const groups = groupTags(tags);
    const availableIds = new Set(tags.map(({ id }) => id));
    const preservedIds = selectedIds.filter((id) => !availableIds.has(id));

    target.innerHTML = Object.entries(groups).map(([group, groupTags]) => `
        <fieldset class="tag-group">
            <legend>${escapeHtml(group)}</legend>
            <div class="tag-options">
                ${groupTags.map((tag) => {
                    const id = `tag-${tag.id}`;
                    return `
                        <input
                            class="btn-check"
                            type="checkbox"
                            id="${escapeHtml(id)}"
                            name="tagIds"
                            value="${escapeHtml(tag.id)}"
                            ${selectedIds.includes(tag.id) ? "checked" : ""}
                        >
                        <label class="tag-option" for="${escapeHtml(id)}">
                            ${escapeHtml(tag.name)}
                        </label>
                    `;
                }).join("")}
            </div>
        </fieldset>
    `).join("") + preservedIds.map((id) => `
        <input type="hidden" name="tagIds" value="${escapeHtml(id)}">
    `).join("");
}

function populateForm(form, song) {
    for (const [field, value] of Object.entries(song)) {
        const control = form.elements.namedItem(field);

        if (!control || field === "tags" || field === "songTypes") {
            continue;
        }

        if (control.type === "checkbox") {
            control.checked = Boolean(value);
        } else {
            control.value = value ?? "";
        }
    }

    form.querySelectorAll('input[name="songTypes"]').forEach((control) => {
        control.checked = song.songTypes.includes(control.value);
    });
}

function serializeForm(form) {
    const data = new FormData(form);
    return {
        title: data.get("title"),
        subtitle: data.get("subtitle"),
        composerName: data.get("composerName"),
        arrangerName: data.get("arrangerName"),
        harmonizerName: data.get("harmonizerName"),
        originalKey: data.get("originalKey"),
        songTypes: data.getAll("songTypes"),
        language: data.get("language"),
        lyrics: data.get("lyrics"),
        notes: data.get("notes"),
        active: form.elements.active.checked,
        tagIds: data.getAll("tagIds")
    };
}

function showValidationErrors(form, details = {}) {
    for (const [field, message] of Object.entries(details)) {
        if (field === "songTypes") {
            const feedback = document.querySelector("#song-types-feedback");
            feedback.textContent = message;
            feedback.style.display = "block";
            continue;
        }

        if (field === "tagIds") {
            const feedback = document.querySelector("#tag-feedback");
            feedback.textContent = message;
            feedback.style.display = "block";
            continue;
        }

        const control = form.elements.namedItem(field);

        if (!control || !control.classList) {
            continue;
        }

        control.classList.add("is-invalid");
        const feedback = control.closest(".form-field")?.querySelector(".invalid-feedback");
        if (feedback) {
            feedback.textContent = message;
        }
    }
}

function clearValidation(form) {
    form.classList.remove("was-validated");
    form.querySelectorAll(".is-invalid").forEach((field) => {
        field.classList.remove("is-invalid");
    });
    const tagFeedback = document.querySelector("#tag-feedback");
    tagFeedback.textContent = "";
    tagFeedback.style.display = "";
    const songTypesFeedback = document.querySelector("#song-types-feedback");
    songTypesFeedback.textContent = "Selecione pelo menos um tipo de cântico.";
    songTypesFeedback.style.display = "";
    document.querySelector("#form-alert").innerHTML = "";
}

function validateSongTypes(form) {
    const valid = form.querySelectorAll('input[name="songTypes"]:checked').length > 0;
    document.querySelector("#song-types-feedback").style.display = valid ? "" : "block";
    return valid;
}

function showFormAlert(message) {
    const alert = document.querySelector("#form-alert");
    alert.innerHTML = "";

    const element = document.createElement("div");
    element.className = "alert alert-danger";
    element.setAttribute("role", "alert");
    element.textContent = message;
    alert.append(element);
}

function setSubmitting(button, submitting) {
    button.disabled = submitting;
    button.querySelector(".button-label").classList.toggle("d-none", submitting);
    button.querySelector(".spinner-border").classList.toggle("d-none", !submitting);
}
