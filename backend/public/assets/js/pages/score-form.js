import { getAllSongs } from "../api/songs.api.js";
import { createScore, getScore, updateScore } from "../api/scores.api.js";
import { inputField, textareaField } from "../components/form.js";
import { setFlash } from "../components/toast.js";
import { router } from "../router.js";
import { escapeHtml } from "../utils/format.js";
import { bindFileDrop } from "../utils/file-drop.js";
import { SCORE_CATEGORIES } from "../utils/scores.js";
import { canManageScoreForSong } from "../utils/permissions.js";

export function scoreFormPage(id = null) {
    const editing = Boolean(id);
    const requestedSongId = editing
        ? ""
        : new URLSearchParams(window.location.search).get("songId") ?? "";
    const requestedCategory = editing
        ? "CHOIR"
        : new URLSearchParams(window.location.search).get("category") ?? "CHOIR";
    const cancelHref = requestedSongId
        ? `/songs/${encodeURIComponent(requestedSongId)}`
        : editing
            ? `/scores/${encodeURIComponent(id)}`
            : "/scores";
    return {
        title: editing ? "Editar partitura" : "Nova partitura",
        render: () => `
            <section class="page-heading"><div><p class="eyebrow">Partituras</p><h2>${editing ? "Editar partitura" : "Adicionar partitura"}</h2><p class="page-description">${editing ? "Atualize os dados sem alterar o histórico de versões." : "Carregue a primeira versão PDF ou MusicXML."}</p></div><a href="${cancelHref}" class="btn btn-light" data-link><i class="bi bi-arrow-left"></i> Cancelar</a></section>
            <form id="score-form" class="card-surface form-card" novalidate>
                <div id="form-alert"></div><fieldset disabled>
                    <div class="form-section"><div><h3>Informação da partitura</h3><p>Associe o ficheiro ao respetivo cântico.</p></div><div class="form-grid">
                        <div class="form-field"><label class="form-label" for="songId">Cântico <span>*</span></label><select class="form-select" id="songId" name="songId" required></select><div class="invalid-feedback">O cântico é obrigatório.</div></div>
                        ${inputField({ name: "title", label: "Título", required: true })}
                        <div class="form-field"><label class="form-label" for="category">Tipo de partitura <span>*</span></label><select class="form-select" id="category" name="category" required>${SCORE_CATEGORIES.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></div>
                        ${textareaField({ name: "description", label: "Descrição", rows: 4 })}
                        <div class="form-check form-switch align-self-end mb-3"><input class="form-check-input" type="checkbox" id="active" name="active" checked><label for="active" class="form-check-label">Partitura ativa</label></div>
                    </div></div>
                    ${editing ? "" : `<div class="form-section"><div><h3>Primeira versão</h3><p>PDF, MusicXML ou MXL comprimido até 20 MB.</p></div><div class="form-field"><label class="file-drop" for="score-file"><i class="bi bi-file-earmark-arrow-up"></i><span>Arraste o ficheiro ou clique para escolher</span><small>PDF · MusicXML · MXL</small></label><input class="visually-hidden" id="score-file" name="file" type="file" accept=".pdf,.musicxml,.xml,.mxl" required><p id="score-file-name" class="selected-file"></p></div></div>`}
                    <div class="form-actions"><a href="${cancelHref}" class="btn btn-light" data-link>Cancelar</a><button class="btn btn-primary" type="submit"><span class="button-label">${editing ? "Guardar alterações" : "Carregar partitura"}</span><span class="spinner-border spinner-border-sm d-none"></span></button></div>
                </fieldset>
            </form>
        `,
        mount: () => mount(id, requestedSongId, requestedCategory)
    };
}

async function mount(id, requestedSongId, requestedCategory) {
    const form = document.querySelector("#score-form");
    const fieldset = form.querySelector("fieldset");
    try {
        const [allSongs, score] = await Promise.all([
            getAllSongs({ status: "active", sortBy: "title" }),
            id ? getScore(id) : Promise.resolve(null)
        ]);
        const songs = allSongs.filter(canManageScoreForSong);
        if (!score && songs.length === 0) {
            throw new Error("Não existem cânticos associados que possa gerir.");
        }
        form.elements.songId.innerHTML = `<option value="">Escolha um cântico</option>${songs.map((song) => `<option value="${escapeHtml(song.id)}">${escapeHtml(`${song.title} — ${song.composerName}`)}</option>`).join("")}`;
        if (score) {
            form.elements.songId.value = score.songId;
            form.elements.songId.disabled = true;
            form.elements.title.value = score.title;
            form.elements.category.value = score.category;
            form.elements.description.value = score.description ?? "";
            form.elements.active.checked = score.active;
        } else if (requestedSongId && songs.some(({ id: songId }) => (
            songId === requestedSongId
        ))) {
            form.elements.songId.value = requestedSongId;
        }
        if (!score && SCORE_CATEGORIES.some(([value]) => value === requestedCategory)) {
            form.elements.category.value = requestedCategory;
        }
        if (!score) {
            bindSuggestedTitle(form, songs);
        }
        fieldset.disabled = false;
        if (score) form.elements.songId.disabled = true;
    } catch (error) { showError(error.message); return; }

    form.elements.file?.addEventListener("change", () => {
        document.querySelector("#score-file-name").textContent = form.elements.file.files[0]?.name ?? "";
    });
    bindFileDrop({
        dropZone: form.querySelector(".file-drop"),
        input: form.elements.file
    });
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); form.classList.add("was-validated");
        if (!form.checkValidity()) return;
        const button = form.querySelector('button[type="submit"]'); toggle(button, true);
        try {
            const data = {
                ...(id ? {} : { songId: form.elements.songId.value }),
                title: form.elements.title.value,
                category: form.elements.category.value,
                description: form.elements.description.value,
                active: form.elements.active.checked
            };
            const score = id
                ? await updateScore(id, data)
                : await createScore(data, form.elements.file.files[0]);
            setFlash(`Partitura ${id ? "atualizada" : "carregada"} com sucesso.`);
            router.navigate(requestedSongId
                ? `/songs/${encodeURIComponent(requestedSongId)}`
                : `/scores/${encodeURIComponent(score.id)}`);
        } catch (error) { showError(error.message); toggle(button, false); }
    });
}

function bindSuggestedTitle(form, songs) {
    const titles = new Map(songs.map((song) => [song.id, song.title]));
    let suggestedTitle = "";
    const applySuggestion = () => {
        const currentTitle = form.elements.title.value.trim();
        const nextTitle = titles.get(form.elements.songId.value) ?? "";

        if (!currentTitle || currentTitle === suggestedTitle) {
            form.elements.title.value = nextTitle;
        }
        suggestedTitle = nextTitle;
    };

    form.elements.songId.addEventListener("change", applySuggestion);
    applySuggestion();
}

function showError(message) {
    const target = document.querySelector("#form-alert");
    target.innerHTML = '<div class="alert alert-danger" role="alert"></div>';
    target.firstElementChild.textContent = message;
}

function toggle(button, loading) {
    button.disabled = loading;
    button.querySelector(".button-label").classList.toggle("d-none", loading);
    button.querySelector(".spinner-border").classList.toggle("d-none", !loading);
}
