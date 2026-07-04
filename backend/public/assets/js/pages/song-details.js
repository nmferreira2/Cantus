import {
    deleteSong,
    getSong,
    importSongFile,
    songAttachmentUrl
} from "../api/songs.api.js";
import { scoreFileUrl } from "../api/scores.api.js";
import { confirmDialog } from "../components/modal.js";
import { setFlash, showFlash, showToast } from "../components/toast.js";
import { loadingState, statusBadge, typeBadges } from "../components/ui.js";
import { router } from "../router.js";
import { escapeHtml, formatDate, songTypesLabel } from "../utils/format.js";
import { bindFileDrop } from "../utils/file-drop.js";
import { massSlotLabel } from "../utils/masses.js";
import { groupTags, TAG_GROUP_LABELS } from "../utils/tags.js";

export function songDetailsPage(songId) {
    return {
        title: "Detalhes do cântico",
        render: () => `
            <div id="song-details">${loadingState("A carregar cântico…")}</div>
        `,
        mount: async () => {
            const song = await getSong(songId);
            renderSong(song);
            bindActions(song);
            showFlash();
        }
    };
}

function renderSong(song) {
    const target = document.querySelector("#song-details");
    const id = encodeURIComponent(song.id);

    target.innerHTML = `
        <section class="page-heading song-detail-heading">
            <div>
                <a href="/songs" class="back-link" data-link>
                    <i class="bi bi-arrow-left"></i> Cânticos
                </a>
                <div class="d-flex align-items-center gap-2 mt-3 mb-2">
                    ${typeBadges(song.songTypes)}
                    ${statusBadge(song.active)}
                </div>
                <h2>${escapeHtml(song.title)}</h2>
                <p class="page-description">${escapeHtml(song.subtitle || "Sem subtítulo")}</p>
            </div>
            <div class="d-flex gap-2">
                <a href="/songs/${id}/edit" class="btn btn-primary" data-link>
                    <i class="bi bi-pencil"></i> Editar
                </a>
                <button id="delete-song" class="btn btn-light text-danger" type="button">
                    <i class="bi bi-archive"></i> Arquivar
                </button>
            </div>
        </section>

        <div class="detail-grid">
            <div class="detail-stack">
                <details class="card-surface detail-card disclosure-card">
                    <summary class="card-heading">
                        <span class="card-heading-icon"><i class="bi bi-info-circle"></i></span>
                        <div><h3>Informação geral</h3><p>Dados principais do repertório</p></div>
                        <i class="bi bi-chevron-down disclosure-chevron ms-auto"></i>
                    </summary>
                    <div class="disclosure-content">
                        <dl class="info-list">
                            ${infoItem("Título", song.title)}
                            ${infoItem("Subtítulo", song.subtitle)}
                            ${infoItem("Compositor", song.composerName)}
                            ${infoItem("Arranjo", song.arrangerName)}
                            ${infoItem("Harmonização", song.harmonizerName)}
                            ${infoItem("Tonalidade original", song.originalKey)}
                            ${infoItem("Idioma", song.language)}
                            ${infoItem("Tipos de cântico", songTypesLabel(song.songTypes))}
                            ${infoItem("Estado", song.active ? "Ativo" : "Inativo")}
                            ${infoItem("Criado em", formatDate(song.createdAt))}
                            ${infoItem("Última atualização", formatDate(song.updatedAt))}
                        </dl>
                        ${longText("Observações", song.notes)}
                        ${longText("Letra", song.lyrics)}
                    </div>
                </details>

                ${scoresViewer(song)}

                <section class="card-surface detail-card">
                    <div class="card-heading">
                        <span class="card-heading-icon"><i class="bi bi-tags"></i></span>
                        <div><h3>Contexto litúrgico</h3><p>Tempos, momentos, solenidades e categorias</p></div>
                    </div>
                    ${tagContent(song.tags)}
                </section>
            </div>

            <div class="detail-stack">
                ${importCard(song)}
                ${attachmentsCard(song)}
                ${placeholderCard("Contribuidores", "people", "Autores, compositores e arranjadores associados aparecerão aqui.")}
            </div>
        </div>
        ${historyCard(song.history)}
    `;
}

function bindActions(song) {
    document.querySelector("#delete-song").addEventListener("click", async (event) => {
        const confirmed = await confirmDialog({
            title: "Arquivar cântico?",
            message: `“${song.title}” sairá do repertório atual, mas poderá ser restaurado mais tarde.`,
            confirmLabel: "Arquivar"
        });

        if (!confirmed) {
            return;
        }

        event.currentTarget.disabled = true;

        try {
            await deleteSong(song.id);
            setFlash(`“${song.title}” foi arquivado.`);
            router.navigate("/songs?status=archived");
        } catch (error) {
            showToast(error.message, "danger");
            event.currentTarget.disabled = false;
        }
    });

    document.querySelector("#song-import-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const file = form.elements.file.files[0];

        if (!file) {
            showToast("Escolha um ficheiro para importar.", "warning");
            return;
        }

        if (file.name.toLocaleLowerCase().endsWith(".txt") && song.lyrics) {
            const confirmed = await confirmDialog({
                title: "Substituir a letra existente?",
                message: "A importação deste ficheiro TXT substituirá a letra atualmente guardada.",
                confirmLabel: "Importar letra",
                variant: "primary"
            });
            if (!confirmed) {
                return;
            }
        }

        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        button.querySelector(".button-label").classList.add("d-none");
        button.querySelector(".spinner-border").classList.remove("d-none");

        try {
            await importSongFile(song.id, file);
            showToast(
                file.name.toLocaleLowerCase().endsWith(".txt")
                    ? "Letra importada com sucesso."
                    : "PDF importado com sucesso."
            );
            await router.render();
        } catch (error) {
            showToast(
                error.message,
                error.status === 501 ? "warning" : "danger"
            );
            button.disabled = false;
            button.querySelector(".button-label").classList.remove("d-none");
            button.querySelector(".spinner-border").classList.add("d-none");
        }
    });

    document.querySelector("#song-import-file").addEventListener("change", (event) => {
        const fileName = event.currentTarget.files[0]?.name ?? "";
        document.querySelector("#selected-file").textContent = fileName;
    });
    const importForm = document.querySelector("#song-import-form");
    bindFileDrop({
        dropZone: importForm.querySelector(".file-drop"),
        input: document.querySelector("#song-import-file"),
        onDrop: () => importForm.requestSubmit()
    });
    bindScoreViewer(song);
}

function importCard(song) {
    return `
        <section class="card-surface import-card">
            <div class="card-heading border-0 p-0">
                <span class="card-heading-icon"><i class="bi bi-cloud-arrow-up"></i></span>
                <div><h3>Importar</h3><p>Partitura PDF ou letra TXT em UTF-8</p></div>
            </div>
            <form id="song-import-form" class="import-form">
                <label class="file-drop" for="song-import-file">
                    <i class="bi bi-file-earmark-arrow-up"></i>
                    <span>Arraste o ficheiro ou clique para escolher</span>
                    <small>PDF ou TXT · até 10 MB</small>
                </label>
                <input
                    id="song-import-file"
                    name="file"
                    class="visually-hidden"
                    type="file"
                    accept=".pdf,.txt,.musicxml,.mxl,.xml,.cho,.chordpro"
                >
                <p id="selected-file" class="selected-file mb-0"></p>
                <button class="btn btn-primary w-100" type="submit">
                    <span class="button-label">Importar ficheiro</span>
                    <span class="spinner-border spinner-border-sm d-none" aria-hidden="true"></span>
                </button>
                <p class="import-note mb-0">
                    MusicXML e ChordPro estão preparados como formatos futuros.
                </p>
            </form>
        </section>
    `;
}

function attachmentsCard(song) {
    return `
        <section class="card-surface attachment-card">
            <div class="card-heading border-0 p-0">
                <span class="card-heading-icon"><i class="bi bi-paperclip"></i></span>
                <div>
                    <h3>Ficheiros importados</h3>
                    <p>${song.attachments.length} ${song.attachments.length === 1 ? "ficheiro" : "ficheiros"}</p>
                </div>
            </div>
            ${song.attachments.length === 0
                ? '<p class="attachment-empty mb-0">Ainda não existem ficheiros importados.</p>'
                : `<div class="attachment-list">
                    ${song.attachments.map((attachment) => `
                        <a
                            href="${songAttachmentUrl(song.id, attachment.id)}"
                            class="attachment-item"
                            download
                        >
                            <span class="attachment-icon">
                                <i class="bi bi-file-earmark-${attachment.type === "PDF" ? "pdf" : "text"}"></i>
                            </span>
                            <span>
                                <strong>${escapeHtml(attachment.originalName)}</strong>
                                <small>${formatFileSize(attachment.size)} · ${formatDate(attachment.createdAt)}</small>
                            </span>
                            <i class="bi bi-download ms-auto"></i>
                        </a>
                    `).join("")}
                </div>`
            }
        </section>
    `;
}

function scoresViewer(song) {
    const selected = song.scores[0] ?? null;
    return `
        <section class="card-surface detail-card song-score-viewer">
            <div class="card-heading">
                <span class="card-heading-icon">
                    <i class="bi bi-file-earmark-music"></i>
                </span>
                <div>
                    <h3>Partituras</h3>
                    <p>${song.scores.length} ${song.scores.length === 1 ? "partitura" : "partituras"}</p>
                </div>
                <a
                    href="/scores/new?songId=${encodeURIComponent(song.id)}"
                    class="btn btn-sm btn-light ms-auto"
                    data-link
                >
                    <i class="bi bi-plus-lg"></i> Adicionar
                </a>
            </div>
            ${song.scores.length === 0
                ? `<div class="score-viewer-empty">
                    <i class="bi bi-file-earmark-music"></i>
                    <p>Ainda não existem partituras associadas.</p>
                </div>`
                : `<div class="score-selector" role="tablist" aria-label="Partituras do cântico">
                    ${song.scores.map((score) => `
                        <button
                            class="btn btn-sm ${score.id === selected.id ? "btn-primary" : "btn-light"}"
                            type="button"
                            role="tab"
                            data-score-select="${escapeHtml(score.id)}"
                            aria-selected="${score.id === selected.id}"
                        >
                            ${escapeHtml(score.title)}
                        </button>
                    `).join("")}
                </div>
                <div id="song-score-preview">${scorePreview(selected)}</div>`
            }
        </section>
    `;
}

function bindScoreViewer(song) {
    const target = document.querySelector("#song-score-preview");
    if (!target) {
        return;
    }

    document.querySelectorAll("[data-score-select]").forEach((button) => {
        button.addEventListener("click", () => {
            const score = song.scores.find(({ id }) => (
                id === button.dataset.scoreSelect
            ));
            if (!score) {
                return;
            }

            document.querySelectorAll("[data-score-select]").forEach((item) => {
                const active = item === button;
                item.classList.toggle("btn-primary", active);
                item.classList.toggle("btn-light", !active);
                item.setAttribute("aria-selected", String(active));
            });
            target.innerHTML = scorePreview(score);
        });
    });
}

function scorePreview(score) {
    if (!score?.latestVersion) {
        return '<p class="attachment-empty score-viewer-empty">Esta partitura ainda não tem uma versão disponível.</p>';
    }

    const fileUrl = scoreFileUrl(score.id, score.latestVersion.id);
    const downloadUrl = scoreFileUrl(score.id, score.latestVersion.id, true);
    return `
        <div class="score-viewer-toolbar">
            <div>
                <strong>${escapeHtml(score.title)}</strong>
                <small>
                    ${score.format === "MUSICXML" ? "MusicXML" : "PDF"}
                    · ${score.versionCount}
                    ${score.versionCount === 1 ? "versão" : "versões"}
                </small>
            </div>
            <a href="/scores/${encodeURIComponent(score.id)}" class="btn btn-sm btn-light" data-link>
                Detalhes
            </a>
            <a href="${downloadUrl}" class="btn btn-sm btn-light">
                <i class="bi bi-download"></i> Descarregar
            </a>
        </div>
        ${score.format === "PDF"
            ? `<iframe
                src="${fileUrl}"
                title="Pré-visualização de ${escapeHtml(score.title)}"
            ></iframe>`
            : `<div class="musicxml-preview song-musicxml-preview">
                <i class="bi bi-filetype-xml"></i>
                <h3>Partitura MusicXML</h3>
                <p>${escapeHtml(score.latestVersion.originalName)}</p>
                <a href="${fileUrl}" target="_blank" class="btn btn-primary">
                    Abrir MusicXML
                </a>
            </div>`
        }
    `;
}

function tagContent(tags) {
    if (tags.length === 0) {
        return '<p class="attachment-empty mb-0">Não existem tags litúrgicas associadas.</p>';
    }

    const groups = groupTags(tags);

    return `
        <div class="detail-tag-groups">
            ${Object.entries(groups).map(([group, groupTags]) => `
                <div>
                    <h4>${TAG_GROUP_LABELS[group] ?? group}</h4>
                    <div class="tag-options">
                        ${groupTags.map((tag) => (
                            `<span class="tag-option static">${escapeHtml(tag.name)}</span>`
                        )).join("")}
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function historyCard(history = []) {
    return `
        <section class="card-surface detail-card song-history-card">
            <div class="card-heading">
                <span class="card-heading-icon"><i class="bi bi-clock-history"></i></span>
                <div>
                    <h3>Histórico de utilização</h3>
                    <p>${history.length} ${history.length === 1 ? "celebração" : "celebrações"}</p>
                </div>
            </div>
            ${history.length === 0
                ? '<p class="attachment-empty mb-0">Este cântico ainda não foi utilizado num planeamento.</p>'
                : `<div class="attachment-list">
                    ${history.map((use) => `
                        <a
                            href="/masses/${encodeURIComponent(use.massId)}"
                            class="attachment-item"
                            data-link
                        >
                            <span class="attachment-icon">
                                <i class="bi bi-calendar-event"></i>
                            </span>
                            <span>
                                <strong>${escapeHtml(use.celebration?.name || "Celebração")}</strong>
                                <small>
                                    ${formatDate(use.startsAt)}
                                    · ${escapeHtml(massSlotLabel(use.slot))}
                                    ${use.church ? ` · ${escapeHtml(use.church)}` : ""}
                                    ${use.season?.name ? ` · ${escapeHtml(use.season.name)}` : ""}
                                </small>
                            </span>
                            <i class="bi bi-chevron-right ms-auto"></i>
                        </a>
                    `).join("")}
                </div>`
            }
        </section>
    `;
}

function infoItem(label, value) {
    return `
        <div>
            <dt>${label}</dt>
            <dd>${escapeHtml(value || "—")}</dd>
        </div>
    `;
}

function longText(label, value) {
    if (!value) {
        return "";
    }

    return `
        <div class="long-text">
            <h4>${label}</h4>
            <p>${escapeHtml(value).replaceAll("\n", "<br>")}</p>
        </div>
    `;
}

function placeholderCard(title, icon, description) {
    return `
        <section class="card-surface placeholder-card">
            <span class="card-heading-icon"><i class="bi bi-${icon}"></i></span>
            <div>
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
            <span class="soon-badge">Brevemente</span>
        </section>
    `;
}

function formatFileSize(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
