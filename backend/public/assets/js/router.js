import { layout } from "./components/layout.js";
import { composersPage } from "./pages/composers.js";
import { contributorDetailsPage } from "./pages/contributor-details.js";
import { contributorFormPage } from "./pages/contributor-form.js";
import { contributorsPage } from "./pages/contributors.js";
import { dashboardPage } from "./pages/dashboard.js";
import { massDetailsPage } from "./pages/mass-details.js";
import { massFormPage } from "./pages/mass-form.js";
import { massesPage } from "./pages/masses.js";
import { notFoundPage } from "./pages/not-found.js";
import { scoreDetailsPage } from "./pages/score-details.js";
import { scoreFormPage } from "./pages/score-form.js";
import { scoresPage } from "./pages/scores.js";
import { searchPage } from "./pages/search.js";
import { settingsPage } from "./pages/settings.js";
import { songDetailsPage } from "./pages/song-details.js";
import { songFormPage } from "./pages/song-form.js";
import { songsPage } from "./pages/songs.js";
import { statisticsPage } from "./pages/statistics.js";
import { applyApplicationSettings } from "./utils/settings.js";

const routes = [
    { pattern: /^\/$/, page: dashboardPage },
    { pattern: /^\/songs$/, page: songsPage },
    { pattern: /^\/songs\/new$/, page: () => songFormPage() },
    {
        pattern: /^\/songs\/([^/]+)\/edit$/,
        page: ([id]) => songFormPage(decodeURIComponent(id))
    },
    {
        pattern: /^\/songs\/([^/]+)$/,
        page: ([id]) => songDetailsPage(decodeURIComponent(id))
    },
    { pattern: /^\/composers$/, page: composersPage },
    { pattern: /^\/contributors$/, page: contributorsPage },
    { pattern: /^\/contributors\/new$/, page: () => contributorFormPage() },
    {
        pattern: /^\/contributors\/([^/]+)\/edit$/,
        page: ([id]) => contributorFormPage(decodeURIComponent(id))
    },
    {
        pattern: /^\/contributors\/([^/]+)$/,
        page: ([id]) => contributorDetailsPage(decodeURIComponent(id))
    },
    { pattern: /^\/scores$/, page: scoresPage },
    { pattern: /^\/scores\/new$/, page: () => scoreFormPage() },
    {
        pattern: /^\/scores\/([^/]+)\/edit$/,
        page: ([id]) => scoreFormPage(decodeURIComponent(id))
    },
    {
        pattern: /^\/scores\/([^/]+)$/,
        page: ([id]) => scoreDetailsPage(decodeURIComponent(id))
    },
    { pattern: /^\/masses$/, page: massesPage },
    { pattern: /^\/masses\/new$/, page: () => massFormPage() },
    {
        pattern: /^\/masses\/([^/]+)\/edit$/,
        page: ([id]) => massFormPage(decodeURIComponent(id))
    },
    {
        pattern: /^\/masses\/([^/]+)$/,
        page: ([id]) => massDetailsPage(decodeURIComponent(id))
    },
    { pattern: /^\/statistics$/, page: statisticsPage },
    { pattern: /^\/search$/, page: searchPage },
    { pattern: /^\/settings$/, page: settingsPage }
];

class Router {
    start() {
        if (this.started) {
            this.render();
            return;
        }

        this.started = true;
        window.addEventListener("popstate", () => this.render());
        document.addEventListener("click", (event) => {
            const link = event.target.closest("a[data-link]");

            if (!link || event.defaultPrevented || event.button !== 0) {
                return;
            }

            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }

            event.preventDefault();
            this.navigate(`${link.pathname}${link.search}`);
        });

        this.render();
    }

    navigate(path) {
        if (`${window.location.pathname}${window.location.search}` !== path) {
            window.history.pushState({}, "", path);
        }

        window.scrollTo({ top: 0, behavior: "instant" });
        this.render();
    }

    async render() {
        if (!window.cantusUser) {
            return;
        }

        const pathname = normalizePath(window.location.pathname);
        const matchedRoute = routes.find((route) => route.pattern.test(pathname));
        const matches = matchedRoute?.pattern.exec(pathname)?.slice(1) ?? [];
        const page = matchedRoute ? matchedRoute.page(matches) : notFoundPage();
        const app = document.querySelector("#app");

        document.title = `${page.title} · Cantus`;
        app.innerHTML = layout(page.title, page.render(), pathname);
        applyApplicationSettings(window.cantusSettings);
        bindLayoutEvents(this);

        try {
            await page.mount?.();
        } catch (error) {
            console.error(error);
            const content = document.querySelector("#page-content");

            if (content) {
                content.innerHTML = `
                    <div class="empty-state card-surface">
                        <i class="bi bi-exclamation-circle"></i>
                        <h2>Ocorreu um erro</h2>
                        <p>${escapeHtml(error.message || "Não foi possível carregar a página.")}</p>
                        <button class="btn btn-primary" id="retry-page">Tentar novamente</button>
                    </div>
                `;
                document.querySelector("#retry-page")?.addEventListener(
                    "click",
                    () => this.render()
                );
            }
        }
    }
}

function bindLayoutEvents(activeRouter) {
    const sidebar = document.querySelector("#sidebar");
    const backdrop = document.querySelector("#sidebar-backdrop");
    const closeSidebar = () => document.body.classList.remove("sidebar-open");

    document.querySelector("#sidebar-toggle")?.addEventListener("click", () => {
        document.body.classList.toggle("sidebar-open");
    });
    backdrop?.addEventListener("click", closeSidebar);
    sidebar?.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeSidebar);
    });
    document.querySelector("#global-search")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const query = event.currentTarget.elements.q.value.trim();
        if (query.length >= 2) {
            activeRouter.navigate(`/search?q=${encodeURIComponent(query)}`);
        }
    });
}

function normalizePath(pathname) {
    if (pathname === "/") {
        return pathname;
    }

    return pathname.replace(/\/+$/, "");
}

function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = value;
    return element.innerHTML;
}

export const router = new Router();
