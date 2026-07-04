import { escapeHtml } from "../utils/format.js";

export function navbar(title) {
    const username = window.cantusUser?.username || "Utilizador";
    const initial = username.slice(0, 1).toLocaleUpperCase("pt-PT");
    const safeUsername = escapeHtml(username);
    return `
        <header class="topbar">
            <div class="d-flex align-items-center gap-3">
                <button
                    id="sidebar-toggle"
                    class="icon-button d-lg-none"
                    type="button"
                    aria-label="Abrir navegação"
                >
                    <i class="bi bi-list"></i>
                </button>
                <div>
                    <p class="eyebrow mb-0">Gestão de repertório</p>
                    <h1 class="topbar-title">${title}</h1>
                </div>
            </div>
            <div class="topbar-actions">
                <form id="global-search" class="topbar-search" role="search">
                    <i class="bi bi-search"></i>
                    <input name="q" type="search" placeholder="Pesquisar no Cantus" aria-label="Pesquisa global">
                </form>
                <div class="user-menu">
                    <div class="avatar" aria-label="Sessão de ${safeUsername}">${escapeHtml(initial)}</div>
                    <span class="user-name">${safeUsername}</span>
                    <button
                        id="logout-button"
                        class="icon-button"
                        type="button"
                        title="Terminar sessão"
                        aria-label="Terminar sessão"
                    ><i class="bi bi-box-arrow-right"></i></button>
                </div>
            </div>
        </header>
    `;
}
