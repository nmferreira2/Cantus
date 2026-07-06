import {
    getComposer,
    updateComposerProfile,
    uploadComposerPhoto
} from "../api/composers.api.js";
import { showToast } from "../components/toast.js";
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
        <section class="page-heading composer-profile-heading">
            <div class="composer-profile-title">
                <span class="composer-profile-photo">
                    ${metadata?.photoUrl
                        ? `<img src="${escapeHtml(metadata.photoUrl)}" alt="Fotografia de ${escapeHtml(composer.name)}">`
                        : '<i class="bi bi-person"></i>'}
                </span>
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
                        ${metadata?.biography
                            ? escapeHtml(metadata.biography)
                            : "Compositor identificado através do repertório"}
                    </p>
                </div>
            </div>
            <div>
                <label class="btn btn-light" for="composer-photo">
                    <i class="bi bi-camera"></i>
                    ${metadata?.photoUrl ? "Alterar fotografia" : "Adicionar fotografia"}
                </label>
                <input
                    id="composer-photo"
                    class="visually-hidden"
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                >
            </div>
        </section>
        <div class="detail-grid">
            <section class="card-surface detail-card">
                <div class="card-heading">
                    <span class="card-heading-icon"><i class="bi bi-person"></i></span>
                    <div><h3>Perfil do compositor</h3><p>Biografia e metadados</p></div>
                </div>
                <form id="composer-profile-form">
                    <div class="form-field">
                        <label class="form-label" for="composer-biography">Pequena biografia</label>
                        <textarea
                            id="composer-biography"
                            name="biography"
                            class="form-control"
                            rows="7"
                            maxlength="20000"
                            placeholder="Escreva uma breve apresentação do compositor…"
                        >${escapeHtml(metadata?.biography || "")}</textarea>
                    </div>
                    <button class="btn btn-primary mt-3" type="submit">
                        <i class="bi bi-check-lg"></i> Guardar biografia
                    </button>
                </form>
                ${metadata ? `
                    <dl class="info-list mt-4">
                        ${info("Nome", composer.name)}
                        ${info("Email", metadata.email)}
                        ${info("Telefone", metadata.phone)}
                        ${info("Função", "Compositor")}
                    </dl>
                    ${metadata.notes
                        ? `<div class="long-text"><h4>Observações</h4><p>${escapeHtml(metadata.notes).replaceAll("\n", "<br>")}</p></div>`
                        : ""}
                ` : ""}
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
    bindProfile(composer);
}

function bindProfile(composer) {
    const form = document.querySelector("#composer-profile-form");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        try {
            const updated = await updateComposerProfile(composer.name, {
                biography: form.elements.biography.value
            });
            showToast("Biografia guardada.");
            render(updated);
        } catch (error) {
            showToast(error.message, "danger");
            button.disabled = false;
        }
    });

    document.querySelector("#composer-photo").addEventListener(
        "change",
        async (event) => {
            const file = event.currentTarget.files[0];
            if (!file) return;
            try {
                const updated = await uploadComposerPhoto(composer.name, file);
                if (updated.contributor?.photoUrl) {
                    updated.contributor.photoUrl += `?v=${Date.now()}`;
                }
                showToast("Fotografia atualizada.");
                render(updated);
            } catch (error) {
                showToast(error.message, "danger");
                event.currentTarget.value = "";
            }
        }
    );
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
