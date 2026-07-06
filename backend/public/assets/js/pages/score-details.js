import {
    addScoreVersion,
    archiveScore,
    archiveScoreVersion,
    getScore,
    scoreFileUrl
} from "../api/scores.api.js";
import { confirmDialog } from "../components/modal.js";
import { setFlash, showFlash, showToast } from "../components/toast.js";
import { loadingState, statusBadge } from "../components/ui.js";
import { router } from "../router.js";
import { escapeHtml, formatDate } from "../utils/format.js";
import { bindFileDrop } from "../utils/file-drop.js";
import {
    can,
    canManageScoreForSong,
    PERMISSIONS
} from "../utils/permissions.js";
import { scoreCategoryLabel } from "../utils/scores.js";

export function scoreDetailsPage(id) {
    return {
        title: "Detalhes da partitura",
        render: () => `<div id="score-detail">${loadingState("A carregar partitura…")}</div>`,
        mount: async () => { const score = await getScore(id); render(score); bind(score); showFlash(); }
    };
}

function render(score) {
    const latest = score.versions[0];
    const canManage = canManageScoreForSong(score.song);
    const canDelete = can(PERMISSIONS.DELETE_SCORES) && canManage;
    const authorship = [
        score.song.composerName,
        score.song.arrangerName ? `Arr.: ${score.song.arrangerName}` : "",
        score.song.harmonizerName ? `Harm.: ${score.song.harmonizerName}` : ""
    ].filter(Boolean).join(" · ");
    document.querySelector("#score-detail").innerHTML = `
        <section class="page-heading"><div><a href="/songs/${encodeURIComponent(score.song.id)}" class="back-link" data-link><i class="bi bi-arrow-left"></i> ${escapeHtml(score.song.title)}</a><div class="d-flex gap-2 mt-3 mb-2"><span class="type-badge">${scoreCategoryLabel(score.category)}</span><span class="type-badge">${score.format === "MUSICXML" ? "MusicXML" : "PDF"}</span>${statusBadge(score.active)}</div><h2>${escapeHtml(score.title)}</h2><p class="page-description">Para <a href="/songs/${encodeURIComponent(score.song.id)}" data-link>${escapeHtml(score.song.title)}</a><br>${escapeHtml(authorship)}</p></div><div class="d-flex gap-2">${canManage ? `<a href="/scores/${encodeURIComponent(score.id)}/edit" class="btn btn-primary" data-link><i class="bi bi-pencil"></i> Editar</a>` : ""}${canDelete ? `<button id="archive-score" class="btn btn-light text-danger"><i class="bi bi-archive"></i> Arquivar</button>` : ""}</div></section>
        <div class="score-detail-grid">
            <section class="card-surface score-preview">
                <div class="card-heading"><span class="card-heading-icon"><i class="bi bi-file-earmark-music"></i></span><div><h3>Versão mais recente</h3><p>Versão ${latest.versionNumber} · ${escapeHtml(latest.originalName)}</p></div><a href="${scoreFileUrl(score.id, latest.id, true)}" class="btn btn-sm btn-light ms-auto"><i class="bi bi-download"></i> Descarregar</a></div>
                ${score.format === "PDF"
                    ? `<iframe src="${scoreFileUrl(score.id, latest.id)}" title="Pré-visualização de ${escapeHtml(score.title)}"></iframe>`
                    : `<div class="musicxml-preview"><i class="bi bi-filetype-xml"></i><h3>Partitura MusicXML</h3><p>Abra ou descarregue o ficheiro estruturado.</p><a href="${scoreFileUrl(score.id, latest.id)}" target="_blank" class="btn btn-primary">Abrir MusicXML</a></div>`}
            </section>
            <div class="detail-stack">
                <section class="card-surface attachment-card">
                    <div class="card-heading border-0 p-0"><span class="card-heading-icon"><i class="bi bi-clock-history"></i></span><div><h3>Histórico de versões</h3><p>${score.versions.length} versões</p></div></div>
                    <div class="version-list">${score.versions.map((version) => `<div class="version-item"><span>v${version.versionNumber}</span><div><strong>${escapeHtml(version.originalName)}</strong><small>${formatDate(version.createdAt)}</small></div><a href="${scoreFileUrl(score.id, version.id, true)}" class="icon-button ms-auto" title="Descarregar"><i class="bi bi-download"></i></a>${canDelete ? `<button class="icon-button icon-button-danger" type="button" data-delete-version="${escapeHtml(version.id)}" title="Remover versão"><i class="bi bi-trash3"></i></button>` : ""}</div>`).join("")}</div>
                </section>
                ${canManage ? `<section class="card-surface import-card"><div class="card-heading border-0 p-0"><span class="card-heading-icon"><i class="bi bi-layers"></i></span><div><h3>Adicionar versão</h3><p>Deve utilizar o mesmo formato</p></div></div><form id="score-version-form" class="import-form"><label class="file-drop" for="version-file"><i class="bi bi-file-earmark-arrow-up"></i><span>Arraste o ficheiro ou clique para escolher</span><small>${score.format === "PDF" ? "PDF" : "MusicXML · MXL"}</small></label><input class="visually-hidden" id="version-file" type="file" accept="${score.format === "PDF" ? ".pdf" : ".musicxml,.xml,.mxl"}"><p id="version-file-name" class="selected-file"></p><button class="btn btn-primary" type="submit">Carregar versão</button></form></section>` : ""}
                <section class="card-surface detail-card"><h3 class="fs-6">Descrição</h3><p class="page-description mb-0">${escapeHtml(score.description || "Sem descrição.")}</p></section>
            </div>
        </div>
    `;
}

function bind(score) {
    document.querySelector("#archive-score")?.addEventListener("click", async (event) => {
        const confirmed = await confirmDialog({ title: "Arquivar partitura?", message: `${score.title} e o respetivo histórico permanecerão recuperáveis.`, confirmLabel: "Arquivar" });
        if (!confirmed) return; event.currentTarget.disabled = true;
        try { await archiveScore(score.id); setFlash("Partitura arquivada."); router.navigate(`/songs/${encodeURIComponent(score.song.id)}`); }
        catch (error) { showToast(error.message, "danger"); event.currentTarget.disabled = false; }
    });
    const input = document.querySelector("#version-file");
    const form = document.querySelector("#score-version-form");
    if (!input || !form) {
        bindVersionDeletion(score);
        return;
    }
    input.addEventListener("change", () => { document.querySelector("#version-file-name").textContent = input.files[0]?.name ?? ""; });
    bindFileDrop({
        dropZone: form.querySelector(".file-drop"),
        input,
        onDrop: () => form.requestSubmit()
    });
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!input.files[0]) { showToast("Escolha um ficheiro de partitura.", "warning"); return; }
        const button = event.currentTarget.querySelector("button"); button.disabled = true;
        try { await addScoreVersion(score.id, input.files[0]); setFlash("Versão da partitura adicionada."); await router.render(); }
        catch (error) { showToast(error.message, "danger"); button.disabled = false; }
    });
    bindVersionDeletion(score);
}

function bindVersionDeletion(score) {
    document.querySelectorAll("[data-delete-version]").forEach((button) => {
        button.addEventListener("click", async () => {
            const confirmed = await confirmDialog({
                title: "Remover versão da partitura?",
                message: "A versão deixará de aparecer, mas o ficheiro será preservado no arquivo.",
                confirmLabel: "Remover"
            });
            if (!confirmed) return;

            button.disabled = true;
            try {
                await archiveScoreVersion(score.id, button.dataset.deleteVersion);
                setFlash("Versão da partitura removida.");
                router.navigate(`/songs/${encodeURIComponent(score.song.id)}`);
            } catch (error) {
                showToast(error.message, "danger");
                button.disabled = false;
            }
        });
    });
}
