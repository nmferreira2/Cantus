import { navbar } from "./navbar.js";
import { sidebar } from "./sidebar.js";

export function layout(title, content, pathname) {
    return `
        <div class="app-shell">
            ${sidebar(pathname)}
            <div id="sidebar-backdrop" class="sidebar-backdrop"></div>
            <div class="app-main">
                ${navbar(title)}
                <main id="page-content" class="page-content">
                    ${content}
                </main>
            </div>
        </div>
    `;
}
