import {
    createContributor,
    getContributor,
    updateContributor
} from "../api/contributors.api.js";
import { ApiError } from "../api/client.js";
import { inputField, selectField, textareaField } from "../components/form.js";
import { setFlash } from "../components/toast.js";
import { router } from "../router.js";
import { CONTRIBUTOR_ROLES } from "../utils/contributors.js";

export function contributorFormPage(id = null) {
    const editing = Boolean(id);
    return {
        title: editing ? "Editar contribuidor" : "Novo contribuidor",
        render: () => `
            <section class="page-heading">
                <div><p class="eyebrow">Contribuidores</p><h2>${editing ? "Editar contribuidor" : "Adicionar contribuidor"}</h2><p class="page-description">Reúna a identidade, a função e os contactos.</p></div>
                <a href="${editing ? `/contributors/${encodeURIComponent(id)}` : "/contributors"}" class="btn btn-light" data-link><i class="bi bi-arrow-left"></i> Cancelar</a>
            </section>
            <form id="contributor-form" class="card-surface form-card" novalidate>
                <div id="form-alert"></div>
                <fieldset ${editing ? "disabled" : ""}>
                    <div class="form-section">
                        <div><h3>Identidade</h3><p>O nome público e a função do contribuidor.</p></div>
                        <div class="form-grid">
                            ${inputField({ name: "name", label: "Nome", required: true })}
                            ${inputField({ name: "surname", label: "Apelido" })}
                            ${inputField({ name: "displayName", label: "Nome de apresentação", required: true })}
                            ${selectField({ name: "role", label: "Função", options: CONTRIBUTOR_ROLES.map(([value, label]) => ({ value, label })) })}
                        </div>
                    </div>
                    <div class="form-section">
                        <div><h3>Contacto e observações</h3><p>Dados de contacto internos opcionais.</p></div>
                        <div class="form-grid">
                            ${inputField({ name: "email", label: "Email", type: "email" })}
                            ${inputField({ name: "phone", label: "Telefone", type: "tel" })}
                            ${textareaField({ name: "notes", label: "Observações" })}
                            <div class="form-check form-switch align-self-end mb-3"><input class="form-check-input" type="checkbox" id="active" name="active" checked><label class="form-check-label" for="active">Contribuidor ativo</label></div>
                        </div>
                    </div>
                    <div class="form-actions"><a href="/contributors" class="btn btn-light" data-link>Cancelar</a><button class="btn btn-primary" type="submit"><span class="button-label">${editing ? "Guardar alterações" : "Guardar contribuidor"}</span><span class="spinner-border spinner-border-sm d-none"></span></button></div>
                </fieldset>
            </form>
        `,
        mount: () => mount(id)
    };
}

async function mount(id) {
    const form = document.querySelector("#contributor-form");
    const fieldset = form.querySelector("fieldset");
    if (id) {
        try {
            fill(form, await getContributor(id));
            fieldset.disabled = false;
        } catch (error) {
            alertError(error.message);
            return;
        }
    }
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        form.classList.add("was-validated");
        if (!form.checkValidity()) return;
        const button = form.querySelector('button[type="submit"]');
        toggle(button, true);
        try {
            const data = Object.fromEntries(new FormData(form));
            data.active = form.elements.active.checked;
            const contributor = id
                ? await updateContributor(id, data)
                : await createContributor(data);
            setFlash(`Contribuidor ${id ? "atualizado" : "criado"} com sucesso.`);
            router.navigate(`/contributors/${encodeURIComponent(contributor.id)}`);
        } catch (error) {
            if (error instanceof ApiError) markErrors(form, error.details);
            alertError(error.message);
            toggle(button, false);
        }
    });
}

function fill(form, data) {
    Object.entries(data).forEach(([key, value]) => {
        const control = form.elements.namedItem(key);
        if (!control) return;
        if (control.type === "checkbox") control.checked = Boolean(value);
        else control.value = value ?? "";
    });
}

function markErrors(form, errors = {}) {
    Object.entries(errors).forEach(([name, message]) => {
        const field = form.elements.namedItem(name);
        if (!field?.classList) return;
        field.classList.add("is-invalid");
        const feedback = field.closest(".form-field")?.querySelector(".invalid-feedback");
        if (feedback) feedback.textContent = message;
    });
}

function alertError(message) {
    const target = document.querySelector("#form-alert");
    target.innerHTML = `<div class="alert alert-danger" role="alert"></div>`;
    target.firstElementChild.textContent = message;
}

function toggle(button, loading) {
    button.disabled = loading;
    button.querySelector(".button-label").classList.toggle("d-none", loading);
    button.querySelector(".spinner-border").classList.toggle("d-none", !loading);
}
