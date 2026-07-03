import {
    deleteSong,
    getSong,
    importSongFile,
    songAttachmentUrl
} from "../api/songs.api.js";
import { confirmDialog } from "../components/modal.js";
import { setFlash, showFlash, showToast } from "../components/toast.js";
import { loadingState, statusBadge, typeBadge } from "../components/ui.js";
import { router } from "../router.js";
import { escapeHtml, formatDate, songTypeLabel } from "../utils/format.js";
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
                    ${typeBadge(song.songType)}
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
                <section class="card-surface detail-card">
                    <div class="card-heading">
                        <span class="card-heading-icon"><i class="bi bi-info-circle"></i></span>
                        <div><h3>Informação geral</h3><p>Dados principais do repertório</p></div>
                    </div>
                    <dl class="info-list">
                        ${infoItem("Título", song.title)}
                        ${infoItem("Subtítulo", song.subtitle)}
                        ${infoItem("Compositor", song.composerName)}
                        ${infoItem("Arranjo", song.arrangerName)}
                        ${infoItem("Harmonização", song.harmonizerName)}
                        ${infoItem("Tonalidade original", song.originalKey)}
                        ${infoItem("Idioma", song.language)}
                        ${infoItem("Tipo de cântico", songTypeLabel(song.songType))}
                        ${infoItem("Estado", song.active ? "Ativo" : "Inativo")}
                        ${infoItem("Criado em", formatDate(song.createdAt))}
                        ${infoItem("Última atualização", formatDate(song.updatedAt))}
                    </dl>
                    ${longText("Observações", song.notes)}
                    ${longText("Letra", song.lyrics)}
                </section>

                <section class="card-surface detail-card">
                    <div class="card-heading">
                        <span class="card-heading-icon"><i class="bi bi-tags"></i></span>
                        <div><h3>Tags litúrgicas</h3><p>Tempos, solenidades e categorias</p></div>
                    </div>
                    ${tagContent(song.tags)}
                </section>
            </div>

            <div class="detail-stack">
                ${importCard(song)}
                ${attachmentsCard(song)}
                ${placeholderCard("Contribuidores", "people", "Autores, compositores e arranjadores associados aparecerão aqui.")}
                ${placeholderCard("Partituras", "file-earmark-music", "As partituras e respetivas versões aparecerão aqui.")}
                ${placeholderCard("Contextos", "bookmark", "Associe este cântico a celebrações e contextos de planeamento.")}
                ${placeholderCard("Histórico", "clock-history", "O histórico completo de alterações aparecerá aqui.")}
            </div>
        </div>
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
                    <span>Escolher ficheiro</span>
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
