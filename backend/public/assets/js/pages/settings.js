import { getSettings, updateSettings, uploadLogo } from "../api/settings.api.js";
import { inputField, textareaField } from "../components/form.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/format.js";
import { applyApplicationSettings } from "../utils/settings.js";

export function settingsPage() {
    return {
        title: "Definições",
        render: () => `
            <section class="page-heading"><div><p class="eyebrow">Administração</p><h2>Definições</h2><p class="page-description">Identidade da aplicação, informação da igreja e valores predefinidos.</p></div></section>
            <form id="settings-form" class="card-surface form-card"><div id="form-alert"></div><fieldset disabled>
                <div class="form-section"><div><h3>Identidade da aplicação</h3><p>Personalize a identidade mantendo o estilo visual do Cantus.</p></div><div class="form-grid">
                    ${inputField({ name: "applicationName", label: "Nome da aplicação", required: true })}
                    ${inputField({ name: "defaultLanguage", label: "Idioma predefinido", required: true })}
                    ${inputField({ name: "primaryColor", label: "Cor principal", type: "color" })}
                    ${inputField({ name: "secondaryColor", label: "Cor secundária", type: "color" })}
                    <div class="form-field settings-logo-field"><label class="form-label">Logótipo</label><div class="settings-logo-preview" id="settings-logo-preview"><i class="bi bi-music-note-beamed"></i></div><label class="btn btn-light" for="settings-logo"><i class="bi bi-upload"></i> Carregar logótipo</label><input class="visually-hidden" id="settings-logo" type="file" accept=".png,.jpg,.jpeg,.webp"><small>PNG, JPEG ou WebP · máximo de 2 MB</small></div>
                </div></div>
                <div class="form-section"><div><h3>Informação da igreja</h3><p>Dados da paróquia utilizados no planeamento.</p></div><div class="form-grid">
                    ${inputField({ name: "churchName", label: "Nome da igreja" })}
                    ${inputField({ name: "churchEmail", label: "Email da igreja", type: "email" })}
                    ${inputField({ name: "churchPhone", label: "Telefone da igreja", type: "tel" })}
                    ${textareaField({ name: "churchAddress", label: "Morada da igreja", rows: 4 })}
                </div></div>
                <div class="form-actions"><button class="btn btn-primary" type="submit"><span class="button-label">Guardar definições</span><span class="spinner-border spinner-border-sm d-none"></span></button></div>
            </fieldset></form>
        `,
        mount
    };
}

async function mount() {
    const form = document.querySelector("#settings-form");
    try {
        const settings = await getSettings();
        Object.entries(settings).forEach(([key, value]) => {
            if (form.elements.namedItem(key)) form.elements[key].value = value ?? "";
        });
        renderLogo(settings.logoUrl);
        form.querySelector("fieldset").disabled = false;
    } catch (error) { showError(error.message); return; }

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); const button = form.querySelector('button[type="submit"]'); toggle(button, true);
        try {
            const data = Object.fromEntries(new FormData(form));
            const settings = await updateSettings(data);
            window.cantusSettings = settings;
            applyApplicationSettings(settings);
            showToast("Definições guardadas.");
        } catch (error) { showError(error.message); }
        finally { toggle(button, false); }
    });
    form.querySelector("#settings-logo").addEventListener("change", async (event) => {
        const file = event.currentTarget.files[0]; if (!file) return;
        try {
            const settings = await uploadLogo(file);
            const versioned = { ...settings, logoUrl: `${settings.logoUrl}?v=${Date.now()}` };
            window.cantusSettings = versioned;
            renderLogo(versioned.logoUrl);
            applyApplicationSettings(versioned);
            showToast("Logótipo atualizado.");
        }
        catch (error) { showToast(error.message, "danger"); }
    });
}

function renderLogo(url) {
    const target = document.querySelector("#settings-logo-preview");
    target.innerHTML = url ? `<img src="${escapeHtml(url)}" alt="Application logo">` : '<i class="bi bi-music-note-beamed"></i>';
}
function showError(message) { const target = document.querySelector("#form-alert"); target.innerHTML = '<div class="alert alert-danger"></div>'; target.firstElementChild.textContent = message; }
function toggle(button, loading) { button.disabled = loading; button.querySelector(".button-label").classList.toggle("d-none", loading); button.querySelector(".spinner-border").classList.toggle("d-none", !loading); }
