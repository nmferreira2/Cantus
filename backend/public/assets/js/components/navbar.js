export function navbar(title) {
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
                <div class="avatar" aria-label="Área de trabalho Cantus">C</div>
            </div>
        </header>
    `;
}
