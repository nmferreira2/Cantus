import { archiveContributor, getContributor } from "../api/contributors.api.js";
import { confirmDialog } from "../components/modal.js";
import { setFlash, showFlash, showToast } from "../components/toast.js";
import { loadingState, statusBadge } from "../components/ui.js";
import { router } from "../router.js";
import { contributorRoleLabel } from "../utils/contributors.js";
import { escapeHtml, formatDate } from "../utils/format.js";

export function contributorDetailsPage(id) {
    return {
        title: "Detalhes do contribuidor",
        render: () => `<div id="contributor-detail">${loadingState("A carregar contribuidor…")}</div>`,
        mount: async () => {
            const contributor = await getContributor(id);
            render(contributor);
            bind(contributor);
            showFlash();
        }
    };
}

function render(item) {
    document.querySelector("#contributor-detail").innerHTML = `
        <section class="page-heading">
            <div><a href="/contributors" class="back-link" data-link><i class="bi bi-arrow-left"></i> Contribuidores</a><div class="d-flex gap-2 mt-3 mb-2"><span class="type-badge">${contributorRoleLabel(item.role)}</span>${statusBadge(item.active)}</div><h2>${escapeHtml(item.displayName)}</h2><p class="page-description">${escapeHtml([item.name, item.surname].filter(Boolean).join(" "))}</p></div>
            <div class="d-flex gap-2"><a href="/contributors/${encodeURIComponent(item.id)}/edit" class="btn btn-primary" data-link><i class="bi bi-pencil"></i> Editar</a><button id="archive-contributor" class="btn btn-light text-danger"><i class="bi bi-archive"></i> Arquivar</button></div>
        </section>
        <section class="card-surface detail-card">
            <div class="card-heading"><span class="card-heading-icon"><i class="bi bi-person"></i></span><div><h3>Informação do contribuidor</h3><p>Identidade, contacto e metadados</p></div></div>
            <dl class="info-list">
                ${itemInfo("Nome de apresentação", item.displayName)}
                ${itemInfo("Função", contributorRoleLabel(item.role))}
                ${itemInfo("Email", item.email)}
                ${itemInfo("Telefone", item.phone)}
                ${itemInfo("Criado em", formatDate(item.createdAt))}
                ${itemInfo("Atualizado em", formatDate(item.updatedAt))}
            </dl>
            ${item.notes ? `<div class="long-text"><h4>Observações</h4><p>${escapeHtml(item.notes).replaceAll("\n", "<br>")}</p></div>` : ""}
        </section>
    `;
}

function bind(item) {
    document.querySelector("#archive-contributor").addEventListener("click", async (event) => {
        const confirmed = await confirmDialog({ title: "Arquivar contribuidor?", message: `${item.displayName} poderá ser restaurado mais tarde.`, confirmLabel: "Arquivar" });
        if (!confirmed) return;
        event.currentTarget.disabled = true;
        try {
            await archiveContributor(item.id);
            setFlash("Contribuidor arquivado.");
            router.navigate("/contributors?status=archived");
        } catch (error) {
            showToast(error.message, "danger");
            event.currentTarget.disabled = false;
        }
    });
}

function itemInfo(label, value) {
    return `<div><dt>${label}</dt><dd>${escapeHtml(value || "—")}</dd></div>`;
}
