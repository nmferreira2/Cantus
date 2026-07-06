import {
    archiveUser,
    createUser,
    getUsers,
    updateUser
} from "../api/users.api.js";
import { getContributors } from "../api/contributors.api.js";
import { confirmDialog } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import { loadingState } from "../components/ui.js";
import { escapeHtml } from "../utils/format.js";

export function usersPage() {
    return {
        title: "Utilizadores",
        render: () => `
            <section class="page-heading">
                <div>
                    <p class="eyebrow">Administração</p>
                    <h2>Utilizadores e permissões</h2>
                    <p class="page-description">
                        Crie acessos restritos e associe-os aos respetivos contribuidores.
                    </p>
                </div>
            </section>
            <div class="composer-management-grid">
                <section class="card-surface detail-card">
                    <div class="card-heading">
                        <span class="card-heading-icon"><i class="bi bi-people"></i></span>
                        <div><h3>Utilizadores</h3><p>Contas adicionais do Cantus</p></div>
                    </div>
                    <div id="users-list">${loadingState("A carregar utilizadores…")}</div>
                </section>
                <section class="card-surface detail-card composer-editor">
                    <div class="card-heading">
                        <span class="card-heading-icon"><i class="bi bi-person-plus"></i></span>
                        <div><h3 id="user-form-title">Adicionar utilizador</h3><p>Função e permissões</p></div>
                    </div>
                    <form id="user-form" class="import-form" novalidate>
                        <div id="user-form-alert"></div>
                        <div class="form-field">
                            <label class="form-label" for="username">Utilizador <span>*</span></label>
                            <input id="username" name="username" class="form-control" maxlength="100" required>
                        </div>
                        <div class="form-field">
                            <label class="form-label" for="password">Palavra-passe <span id="password-required">*</span></label>
                            <input id="password" name="password" class="form-control" type="password" minlength="8" maxlength="200">
                            <small class="tag-help">Mínimo de 8 caracteres. Ao editar, deixe vazio para manter.</small>
                        </div>
                        <div class="form-field">
                            <label class="form-label" for="role">Função</label>
                            <select id="role" name="role" class="form-select">
                                <option value="CONTRIBUTOR">Contribuidor</option>
                                <option value="ADMIN">Administrador</option>
                            </select>
                        </div>
                        <div class="form-field" id="contributor-field">
                            <label class="form-label" for="contributorId">Contribuidor associado <span>*</span></label>
                            <select id="contributorId" name="contributorId" class="form-select"></select>
                        </div>
                        <div class="form-check form-switch" id="score-permission-field">
                            <input id="allowScoreManagement" name="allowScoreManagement" class="form-check-input" type="checkbox">
                            <label for="allowScoreManagement" class="form-check-label">
                                Permitir gerir e remover partituras próprias
                            </label>
                        </div>
                        <div class="form-check form-switch">
                            <input id="user-active" name="active" class="form-check-input" type="checkbox" checked>
                            <label for="user-active" class="form-check-label">Utilizador ativo</label>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-primary flex-grow-1" type="submit">
                                Guardar utilizador
                            </button>
                            <button id="cancel-user-edit" class="btn btn-light d-none" type="button">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        `,
        mount: mountUsers
    };
}

async function mountUsers() {
    const form = document.querySelector("#user-form");
    let editingId = null;
    let users;
    let contributors;

    try {
        [users, contributors] = await Promise.all([
            getUsers(),
            getContributors({ pageSize: 100, sortBy: "displayName" })
        ]);
    } catch (error) {
        showFormError(error.message);
        return;
    }

    form.elements.contributorId.innerHTML =
        `<option value="">Escolha um contribuidor</option>${contributors.data.map((item) => (
            `<option value="${escapeHtml(item.id)}">${escapeHtml(item.displayName)}</option>`
        )).join("")}`;

    const renderUsers = () => {
        document.querySelector("#users-list").innerHTML = users.length
            ? `<div class="attachment-list">${users.map((user) => `
                <div class="attachment-item">
                    <span class="attachment-icon"><i class="bi bi-person"></i></span>
                    <span>
                        <strong>${escapeHtml(user.username)}</strong>
                        <small>
                            ${user.role === "ADMIN" ? "Administrador" : "Contribuidor"}
                            ${user.contributor ? ` · ${escapeHtml(user.contributor.displayName)}` : ""}
                            ${user.allowScoreManagement ? " · Gestão de partituras" : ""}
                        </small>
                    </span>
                    <button class="icon-button ms-auto" type="button" data-edit-user="${escapeHtml(user.id)}" title="Editar"><i class="bi bi-pencil"></i></button>
                    <button class="icon-button icon-button-danger" type="button" data-archive-user="${escapeHtml(user.id)}" title="Arquivar"><i class="bi bi-archive"></i></button>
                </div>
            `).join("")}</div>`
            : '<p class="attachment-empty">Ainda não existem contas adicionais.</p>';
    };

    const resetForm = () => {
        editingId = null;
        form.reset();
        form.elements.active.checked = true;
        document.querySelector("#user-form-title").textContent = "Adicionar utilizador";
        document.querySelector("#password-required").classList.remove("d-none");
        document.querySelector("#cancel-user-edit").classList.add("d-none");
        updateRoleFields(form);
        clearFormError();
    };

    document.querySelector("#users-list").addEventListener("click", async (event) => {
        const edit = event.target.closest("[data-edit-user]");
        const archive = event.target.closest("[data-archive-user]");
        if (edit) {
            const user = users.find(({ id }) => id === edit.dataset.editUser);
            if (!user) return;
            editingId = user.id;
            form.elements.username.value = user.username;
            form.elements.password.value = "";
            form.elements.role.value = user.role;
            form.elements.contributorId.value = user.contributorId ?? "";
            form.elements.allowScoreManagement.checked = user.allowScoreManagement;
            form.elements.active.checked = user.active;
            document.querySelector("#user-form-title").textContent = "Editar utilizador";
            document.querySelector("#password-required").classList.add("d-none");
            document.querySelector("#cancel-user-edit").classList.remove("d-none");
            updateRoleFields(form);
            return;
        }
        if (archive) {
            const confirmed = await confirmDialog({
                title: "Arquivar utilizador?",
                message: "O utilizador deixará de poder iniciar sessão.",
                confirmLabel: "Arquivar"
            });
            if (!confirmed) return;
            try {
                await archiveUser(archive.dataset.archiveUser);
                users = users.filter(({ id }) => id !== archive.dataset.archiveUser);
                renderUsers();
                showToast("Utilizador arquivado.");
            } catch (error) {
                showToast(error.message, "danger");
            }
        }
    });
    form.elements.role.addEventListener("change", () => updateRoleFields(form));
    document.querySelector("#cancel-user-edit").addEventListener("click", resetForm);
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearFormError();
        const data = {
            username: form.elements.username.value,
            role: form.elements.role.value,
            contributorId: form.elements.role.value === "CONTRIBUTOR"
                ? form.elements.contributorId.value
                : null,
            allowScoreManagement: form.elements.role.value === "CONTRIBUTOR"
                && form.elements.allowScoreManagement.checked,
            active: form.elements.active.checked,
            ...(form.elements.password.value
                ? { password: form.elements.password.value }
                : {})
        };
        try {
            const wasEditing = Boolean(editingId);
            const saved = editingId
                ? await updateUser(editingId, data)
                : await createUser(data);
            users = editingId
                ? users.map((user) => user.id === saved.id ? saved : user)
                : [...users, saved].sort((a, b) => a.username.localeCompare(b.username, "pt"));
            renderUsers();
            resetForm();
            showToast(`Utilizador ${wasEditing ? "atualizado" : "criado"} com sucesso.`);
        } catch (error) {
            showFormError(error.message);
        }
    });

    renderUsers();
    resetForm();
}

function updateRoleFields(form) {
    const contributor = form.elements.role.value === "CONTRIBUTOR";
    document.querySelector("#contributor-field").classList.toggle("d-none", !contributor);
    document.querySelector("#score-permission-field").classList.toggle("d-none", !contributor);
    form.elements.contributorId.required = contributor;
}

function showFormError(message) {
    const target = document.querySelector("#user-form-alert");
    target.innerHTML = '<div class="alert alert-danger"></div>';
    target.firstElementChild.textContent = message;
}

function clearFormError() {
    document.querySelector("#user-form-alert").innerHTML = "";
}
