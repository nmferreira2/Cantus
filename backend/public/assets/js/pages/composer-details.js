import { getComposer } from "../api/composers.api.js";
import { loadingState, statusBadge } from "../components/ui.js";
import { escapeHtml } from "../utils/format.js";

export function composerDetailsPage(name) {
    return {
        title: "Detalhes do compositor",
        render: () => `<div id="composer-detail">${loadingState("A carregar compositor…")}</div>`,
        mount: async () => render(await getComposer(name))
    };
}

function render(composer) {
    const metadata = composer.contributor;
    document.querySelector("#composer-detail").innerHTML = `
        <section class="page-heading">
            <div>
                <a href="/composers" class="back-link" data-link>
                    <i class="bi bi-arrow-left"></i> Compositores
                </a>
                <div class="d-flex gap-2 mt-3 mb-2">
                    <span class="type-badge">Compositor</span>
                    ${metadata ? statusBadge(metadata.active) : ""}
                </div>
                <h2>${escapeHtml(composer.name)}</h2>
                <p class="page-description">
                    ${metadata
                        ? escapeHtml(metadata.email || "Metadados do contribuidor")
                        : "Compositor identificado através do repertório"}
                </p>
            </div>
        </section>
        <div class="detail-grid">
            <section class="card-surface detail-card">
                <div class="card-heading">
                    <span class="card-heading-icon"><i class="bi bi-person"></i></span>
                    <div><h3>Informação do compositor</h3><p>Notas e metadados</p></div>
                </div>
                <dl class="info-list">
                    ${info("Nome", composer.name)}
                    ${info("Email", metadata?.email)}
                    ${info("Telefone", metadata?.phone)}
                    ${info("Função", metadata ? "Compositor" : null)}
                </dl>
                ${metadata?.notes
                    ? `<div class="long-text"><h4>Observações</h4><p>${escapeHtml(metadata.notes).replaceAll("\n", "<br>")}</p></div>`
                    : '<p class="attachment-empty">Não existem observações registadas.</p>'}
            </section>
            <section class="card-surface detail-card">
                <div class="card-heading">
                    <span class="card-heading-icon"><i class="bi bi-music-note-list"></i></span>
                    <div><h3>Cânticos associados</h3><p>${composer.songs.length} no repertório</p></div>
                </div>
                ${composer.songs.length
                    ? `<div class="attachment-list">${composer.songs.map((song) => `
                        <a href="/songs/${encodeURIComponent(song.id)}" class="attachment-item" data-link>
                            <span class="attachment-icon"><i class="bi bi-music-note"></i></span>
                            <span>
                                <strong>${escapeHtml(song.title)}</strong>
                                <small>${song.roles.map(roleLabel).join(" · ")}</small>
                            </span>
                            <i class="bi bi-chevron-right ms-auto"></i>
                        </a>
                    `).join("")}</div>`
                    : '<p class="attachment-empty">Não existem cânticos associados.</p>'}
            </section>
        </div>
    `;
}

function info(label, value) {
    return `<div><dt>${label}</dt><dd>${escapeHtml(value || "—")}</dd></div>`;
}

function roleLabel(role) {
    return {
        COMPOSER: "Compositor",
        ARRANGER: "Arranjo",
        HARMONIZER: "Harmonização"
    }[role] ?? role;
}
