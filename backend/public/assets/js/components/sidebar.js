const navigation = [
    { href: "/", label: "Painel", icon: "grid-1x2" },
    { href: "/songs", label: "Cânticos", icon: "music-note-list" },
    {
        href: "/songs?status=archived",
        label: "Cânticos arquivados",
        icon: "archive",
        archivedSongs: true
    },
    { href: "/composers", label: "Compositores", icon: "person-check" },
    { href: "/contributors", label: "Contribuidores", icon: "people" },
    { href: "/masses", label: "Planeamento da missa", icon: "calendar3" },
    { href: "/statistics", label: "Estatísticas", icon: "bar-chart" }
];

export function sidebar(pathname) {
    const showingArchivedSongs = pathname === "/songs"
        && new URLSearchParams(window.location.search).get("status") === "archived";
    const links = navigation.map((item) => {
        const active = item.archivedSongs
            ? showingArchivedSongs
            : item.href === "/songs"
                ? pathname.startsWith("/songs") && !showingArchivedSongs
                : item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return `
            <a href="${item.href}" class="sidebar-link ${active ? "active" : ""}" ${active ? 'aria-current="page"' : ""} data-link>
                <i class="bi bi-${item.icon}"></i><span>${item.label}</span>
            </a>
        `;
    }).join("");

    return `
        <aside id="sidebar" class="sidebar">
            <a href="/" class="brand" data-link aria-label="Painel do Cantus">
                <span class="brand-mark"><i class="bi bi-music-note-beamed"></i></span>
                <span><strong>Cantus</strong><small>Biblioteca litúrgica</small></span>
            </a>
            <nav class="sidebar-nav" aria-label="Navegação principal">
                <p class="sidebar-heading">Área de trabalho</p>${links}
                <p class="sidebar-heading sidebar-heading-spaced">Administração</p>
                <a href="/settings" class="sidebar-link ${pathname === "/settings" ? "active" : ""}" ${pathname === "/settings" ? 'aria-current="page"' : ""} data-link>
                    <i class="bi bi-gear"></i><span>Definições</span>
                </a>
            </nav>
            <div class="sidebar-footer"><span class="status-dot"></span><span>Versão 1.0</span></div>
        </aside>
    `;
}
