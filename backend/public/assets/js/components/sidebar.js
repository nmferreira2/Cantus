import { can, PERMISSIONS } from "../utils/permissions.js";

const navigation = [
    { href: "/", label: "Painel", icon: "grid-1x2" },
    { href: "/songs", label: "Cânticos", icon: "music-note-list" },
    {
        href: "/songs?status=archived",
        label: "Cânticos arquivados",
        icon: "archive",
        archivedSongs: true,
        permission: PERMISSIONS.DELETE_SONGS
    },
    {
        href: "/composers",
        label: "Compositores",
        icon: "person-check",
        permission: PERMISSIONS.MANAGE_CONTRIBUTORS
    },
    {
        href: "/contributors",
        label: "Contribuidores",
        icon: "people",
        permission: PERMISSIONS.MANAGE_CONTRIBUTORS
    },
    {
        href: "/masses",
        label: "Planeamento da missa",
        icon: "calendar3",
        permission: PERMISSIONS.MANAGE_MASSES
    },
    { href: "/statistics", label: "Estatísticas", icon: "bar-chart" }
];

export function sidebar(pathname) {
    const showingArchivedSongs = pathname === "/songs"
        && new URLSearchParams(window.location.search).get("status") === "archived";
    const links = navigation.filter((item) => (
        !item.permission || can(item.permission)
    )).map((item) => {
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
                ${administrationLinks(pathname)}
            </nav>
            <div class="sidebar-footer"><span class="status-dot"></span><span>Versão 1.0</span></div>
        </aside>
    `;
}

function administrationLinks(pathname) {
    const links = [
        {
            href: "/users",
            label: "Utilizadores",
            icon: "person-lock",
            permission: PERMISSIONS.MANAGE_USERS
        },
        {
            href: "/settings",
            label: "Definições",
            icon: "gear",
            permission: PERMISSIONS.MANAGE_SETTINGS
        }
    ].filter((item) => can(item.permission));

    if (links.length === 0) {
        return "";
    }
    return `
        <p class="sidebar-heading sidebar-heading-spaced">Administração</p>
        ${links.map((item) => {
            const active = pathname === item.href;
            return `
                <a href="${item.href}" class="sidebar-link ${active ? "active" : ""}"
                    ${active ? 'aria-current="page"' : ""} data-link>
                    <i class="bi bi-${item.icon}"></i><span>${item.label}</span>
                </a>
            `;
        }).join("")}
    `;
}
