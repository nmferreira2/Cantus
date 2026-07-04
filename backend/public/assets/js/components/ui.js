import {
    escapeHtml,
    orderSongTypes,
    songTypeLabel
} from "../utils/format.js";

export function loadingState(message = "A carregar…") {
    return `
        <div class="inline-state">
            <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
            ${escapeHtml(message)}
        </div>
    `;
}

export function emptyState({
    icon = "inbox",
    title,
    description,
    action = ""
}) {
    return `
        <div class="empty-state">
            <i class="bi bi-${icon}"></i>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(description)}</p>
            ${action}
        </div>
    `;
}

export function statusBadge(active, archived = false) {
    const status = archived ? "Arquivado" : (active ? "Ativo" : "Inativo");
    const className = archived ? "archived" : (active ? "active" : "inactive");
    return `<span class="status-badge ${className}">${status}</span>`;
}

export function typeBadge(type) {
    return `<span class="type-badge">${songTypeLabel(type)}</span>`;
}

export function typeBadges(types = []) {
    return orderSongTypes(types).map(typeBadge).join("");
}
