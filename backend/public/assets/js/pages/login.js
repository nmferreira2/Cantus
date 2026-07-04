import { login } from "../api/auth.api.js";
import { escapeHtml } from "../utils/format.js";

export function renderLogin(onSuccess) {
    const app = document.querySelector("#app");
    document.title = "Iniciar sessão · Cantus";
    document.body.classList.add("auth-page");
    app.innerHTML = `
        <main class="auth-shell">
            <section class="auth-card card-surface">
                <div class="auth-brand">
                    <span class="brand-mark"><i class="bi bi-music-note-beamed"></i></span>
                    <div><strong>Cantus</strong><small>Gestão de repertório litúrgico</small></div>
                </div>
                <div class="auth-heading">
                    <p class="eyebrow">Área reservada</p>
                    <h1>Iniciar sessão</h1>
                    <p>Introduza as suas credenciais para aceder ao Cantus.</p>
                </div>
                <div id="login-alert" aria-live="polite"></div>
                <form id="login-form">
                    <div class="form-field">
                        <label class="form-label" for="login-username">Utilizador</label>
                        <input
                            class="form-control"
                            id="login-username"
                            name="username"
                            type="text"
                            autocomplete="username"
                            required
                            autofocus
                        >
                    </div>
                    <div class="form-field">
                        <label class="form-label" for="login-password">Palavra-passe</label>
                        <input
                            class="form-control"
                            id="login-password"
                            name="password"
                            type="password"
                            autocomplete="current-password"
                            required
                        >
                    </div>
                    <button class="btn btn-primary auth-submit" type="submit">
                        <span class="button-label">Entrar</span>
                        <span class="spinner-border spinner-border-sm d-none" aria-hidden="true"></span>
                    </button>
                </form>
            </section>
        </main>
    `;

    const form = document.querySelector("#login-form");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        setSubmitting(button, true);
        showError("");

        try {
            const user = await login(
                form.elements.username.value.trim(),
                form.elements.password.value
            );
            document.body.classList.remove("auth-page");
            await onSuccess(user);
        } catch (error) {
            showError(error.message);
            form.elements.password.select();
        } finally {
            setSubmitting(button, false);
        }
    });
}

function showError(message) {
    const target = document.querySelector("#login-alert");
    target.innerHTML = message
        ? `<div class="alert alert-danger">${escapeHtml(message)}</div>`
        : "";
}

function setSubmitting(button, submitting) {
    button.disabled = submitting;
    button.querySelector(".button-label").classList.toggle("d-none", submitting);
    button.querySelector(".spinner-border").classList.toggle("d-none", !submitting);
}
