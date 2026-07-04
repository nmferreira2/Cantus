import { getCurrentUser, logout } from "./api/auth.api.js";
import { getSettings } from "./api/settings.api.js";
import { ApiError } from "./api/client.js";
import { renderLogin } from "./pages/login.js";
import { router } from "./router.js";
import { applyApplicationSettings } from "./utils/settings.js";

window.addEventListener("cantus:unauthorized", showLogin);
document.addEventListener("click", async (event) => {
    if (!event.target.closest("#logout-button")) {
        return;
    }

    try {
        await logout();
    } finally {
        showLogin();
    }
});

bootstrap();

async function bootstrap() {
    try {
        await startAuthenticatedApplication(await getCurrentUser());
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            showLogin();
            return;
        }
        showLogin();
    }
}

async function startAuthenticatedApplication(user) {
    window.cantusUser = user;

    try {
        const settings = await getSettings();
        window.cantusSettings = settings;
        applyApplicationSettings(settings);
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            showLogin();
            return;
        }
    }

    document.body.classList.remove("auth-page");
    router.start();
}

function showLogin() {
    if (document.querySelector("#login-form")) {
        return;
    }

    window.cantusUser = null;
    renderLogin(startAuthenticatedApplication);
}
