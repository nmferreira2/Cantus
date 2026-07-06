import {
    archiveTag,
    createTag,
    updateTag
} from "../api/tags.api.js";
import {
    archiveTagGroup,
    createTagGroup,
    getTagGroups,
    updateTagGroup
} from "../api/tag-groups.api.js";
import { confirmDialog } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import { loadingState } from "../components/ui.js";
import { escapeHtml } from "../utils/format.js";

let groups = [];

export function tagManagementPage() {
    return {
        title: "Gestão de tags",
        render: () => `
            <section class="page-heading">
                <div>
                    <p class="eyebrow">Administração</p>
                    <h2>Gestão de tags</h2>
                    <p class="page-description">
                        Organize as tags por grupos sem alterar as associações já existentes.
                    </p>
                </div>
                <div class="d-flex gap-2 flex-wrap">
                    <button id="new-group" class="btn btn-light" type="button">
                        <i class="bi bi-folder-plus"></i> Novo grupo
                    </button>
                    <button id="new-tag" class="btn btn-primary" type="button">
                        <i class="bi bi-plus-lg"></i> Nova tag
                    </button>
                </div>
            </section>
            <section class="tag-admin-toolbar card-surface">
                <div>
                    <strong>Grupos e tags</strong>
                    <p>Use as setas para ordenar e o seletor para mover uma tag.</p>
                </div>
                <label class="form-check form-switch mb-0">
                    <input id="show-archived-tags" class="form-check-input" type="checkbox">
                    <span class="form-check-label">Mostrar arquivados</span>
                </label>
            </section>
            <section id="tag-admin-content" class="tag-admin-groups">
                ${loadingState("A carregar grupos de tags…")}
            </section>
        `,
        mount
    };
}

async function mount() {
    document.querySelector("#new-group").addEventListener("click", () => (
        editGroup()
    ));
    document.querySelector("#new-tag").addEventListener("click", () => (
        editTag()
    ));
    document.querySelector("#show-archived-tags").addEventListener(
        "change",
        refresh
    );
    await refresh();
}

async function refresh() {
    const target = document.querySelector("#tag-admin-content");
    target.innerHTML = loadingState("A carregar grupos de tags…");
    try {
        groups = await getTagGroups({
            includeArchived: document.querySelector("#show-archived-tags").checked
        });
        target.innerHTML = groups.length
            ? groups.map(groupCard).join("")
            : '<div class="empty-state card-surface"><i class="bi bi-tags"></i><h2>Sem grupos de tags</h2><p>Crie o primeiro grupo para começar.</p></div>';
        bindActions();
    } catch (error) {
        target.innerHTML = `<div class="alert alert-danger">${escapeHtml(error.message)}</div>`;
    }
}

function groupCard(group) {
    const archived = Boolean(group.deletedAt) || !group.active;
    return `
        <article class="card-surface tag-admin-group ${archived ? "is-archived" : ""}">
            <header class="tag-admin-group-header">
                <div>
                    <div class="d-flex align-items-center gap-2">
                        <h3>${escapeHtml(group.name)}</h3>
                        ${archived ? '<span class="status-badge archived">Arquivado</span>' : ""}
                    </div>
                    <p>${group._count.tags} ${group._count.tags === 1 ? "tag" : "tags"}</p>
                </div>
                <div class="row-actions">
                    <button class="icon-button" data-edit-group="${group.id}" title="Editar grupo">
                        <i class="bi bi-pencil"></i>
                    </button>
                    ${archived
                        ? `<button class="icon-button text-success" data-restore-group="${group.id}" title="Restaurar grupo"><i class="bi bi-arrow-counterclockwise"></i></button>`
                        : `<button class="icon-button text-danger" data-archive-group="${group.id}" title="Arquivar grupo"><i class="bi bi-archive"></i></button>`}
                </div>
            </header>
            <div class="tag-admin-list">
                ${group.tags.length
                    ? group.tags.map((tag, index) => tagRow(tag, group, index)).join("")
                    : '<p class="tag-admin-empty">Este grupo ainda não tem tags.</p>'}
            </div>
            ${!archived
                ? `<button class="tag-admin-add" data-add-tag="${group.id}" type="button"><i class="bi bi-plus-lg"></i> Adicionar tag neste grupo</button>`
                : ""}
        </article>
    `;
}

function tagRow(tag, group, index) {
    const archived = Boolean(tag.deletedAt) || !tag.active;
    const activeGroups = groups.filter((item) => item.active && !item.deletedAt);
    return `
        <div class="tag-admin-row ${archived ? "is-archived" : ""}">
            <div class="tag-order-actions">
                <button class="icon-button" data-move-up="${tag.id}" ${index === 0 || archived ? "disabled" : ""} title="Subir"><i class="bi bi-chevron-up"></i></button>
                <button class="icon-button" data-move-down="${tag.id}" ${index === group.tags.length - 1 || archived ? "disabled" : ""} title="Descer"><i class="bi bi-chevron-down"></i></button>
            </div>
            <div class="tag-admin-name">
                <strong>${escapeHtml(tag.name)}</strong>
                ${archived ? '<small>Arquivada</small>' : ""}
            </div>
            <label class="tag-admin-move">
                <span class="visually-hidden">Mover ${escapeHtml(tag.name)} para outro grupo</span>
                <select class="form-select form-select-sm" data-tag-group="${tag.id}" ${archived ? "disabled" : ""}>
                    ${activeGroups.map((item) => `<option value="${item.id}" ${item.id === group.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
                </select>
            </label>
            <div class="row-actions">
                <button class="icon-button" data-edit-tag="${tag.id}" title="Editar tag"><i class="bi bi-pencil"></i></button>
                ${archived
                    ? `<button class="icon-button text-success" data-restore-tag="${tag.id}" title="Restaurar tag"><i class="bi bi-arrow-counterclockwise"></i></button>`
                    : `<button class="icon-button text-danger" data-archive-tag="${tag.id}" title="Arquivar tag"><i class="bi bi-archive"></i></button>`}
            </div>
        </div>
    `;
}

function bindActions() {
    document.querySelectorAll("[data-edit-group]").forEach((button) => {
        button.addEventListener("click", () => editGroup(findGroup(button.dataset.editGroup)));
    });
    document.querySelectorAll("[data-add-tag]").forEach((button) => {
        button.addEventListener("click", () => editTag(null, button.dataset.addTag));
    });
    document.querySelectorAll("[data-edit-tag]").forEach((button) => {
        button.addEventListener("click", () => editTag(findTag(button.dataset.editTag)));
    });
    document.querySelectorAll("[data-archive-group]").forEach((button) => {
        button.addEventListener("click", () => archiveGroup(button.dataset.archiveGroup));
    });
    document.querySelectorAll("[data-restore-group]").forEach((button) => {
        button.addEventListener("click", () => restoreGroup(button.dataset.restoreGroup));
    });
    document.querySelectorAll("[data-archive-tag]").forEach((button) => {
        button.addEventListener("click", () => archiveOneTag(button.dataset.archiveTag));
    });
    document.querySelectorAll("[data-restore-tag]").forEach((button) => {
        button.addEventListener("click", () => restoreTag(button.dataset.restoreTag));
    });
    document.querySelectorAll("[data-tag-group]").forEach((select) => {
        select.addEventListener("change", () => moveTag(select.dataset.tagGroup, select.value));
    });
    document.querySelectorAll("[data-move-up]").forEach((button) => {
        button.addEventListener("click", () => reorderTag(button.dataset.moveUp, -1));
    });
    document.querySelectorAll("[data-move-down]").forEach((button) => {
        button.addEventListener("click", () => reorderTag(button.dataset.moveDown, 1));
    });
}

async function editGroup(group = null) {
    const values = await entityDialog({
        title: group ? "Editar grupo de tags" : "Novo grupo de tags",
        fields: [
            {
                name: "name",
                label: "Nome do grupo",
                value: group?.name ?? "",
                required: true
            }
        ],
        submitLabel: group ? "Guardar alterações" : "Criar grupo"
    });
    if (!values) return;

    try {
        if (group) {
            await updateTagGroup(group.id, { name: values.name });
            showToast("Grupo de tags atualizado.");
        } else {
            await createTagGroup({ name: values.name, sortOrder: groups.length * 10 });
            showToast("Grupo de tags criado.");
        }
        await refresh();
    } catch (error) {
        showToast(error.message, "danger");
    }
}

async function editTag(tag = null, requestedGroupId = null) {
    const selectableGroups = groups.filter((group) => (
        (group.active && !group.deletedAt) || group.id === tag?.groupId
    ));
    if (selectableGroups.length === 0) {
        showToast("Crie ou restaure um grupo antes de adicionar tags.", "warning");
        return;
    }
    const values = await entityDialog({
        title: tag ? "Editar tag" : "Nova tag",
        fields: [
            {
                name: "name",
                label: "Nome da tag",
                value: tag?.name ?? "",
                required: true
            },
            {
                name: "groupId",
                label: "Grupo",
                type: "select",
                value: tag?.groupId ?? requestedGroupId ?? selectableGroups[0].id,
                options: selectableGroups.map((group) => [
                    group.id,
                    `${group.name}${group.deletedAt ? " (arquivado)" : ""}`
                ]),
                required: true
            }
        ],
        submitLabel: tag ? "Guardar alterações" : "Criar tag"
    });
    if (!values) return;

    try {
        if (tag) {
            await updateTag(tag.id, {
                name: values.name,
                ...(values.groupId !== tag.groupId
                    ? { groupId: values.groupId }
                    : {})
            });
            showToast("Tag atualizada.");
        } else {
            const group = findGroup(values.groupId);
            await createTag({
                ...values,
                sortOrder: (group?.tags.length ?? 0) * 10
            });
            showToast("Tag criada.");
        }
        await refresh();
    } catch (error) {
        showToast(error.message, "danger");
    }
}

async function archiveGroup(id) {
    const group = findGroup(id);
    const confirmed = await confirmDialog({
        title: "Arquivar grupo de tags?",
        message: `O grupo “${group.name}” deixará de aparecer na seleção. As associações existentes aos cânticos serão preservadas.`,
        confirmLabel: "Arquivar grupo"
    });
    if (!confirmed) return;
    try {
        await archiveTagGroup(id);
        showToast("Grupo arquivado.");
        await refresh();
    } catch (error) {
        showToast(error.message, "danger");
    }
}

async function archiveOneTag(id) {
    const tag = findTag(id);
    const confirmed = await confirmDialog({
        title: "Arquivar tag?",
        message: `A tag “${tag.name}” deixará de aparecer na seleção. As associações existentes aos cânticos serão preservadas.`,
        confirmLabel: "Arquivar tag"
    });
    if (!confirmed) return;
    try {
        await archiveTag(id);
        showToast("Tag arquivada.");
        await refresh();
    } catch (error) {
        showToast(error.message, "danger");
    }
}

async function restoreGroup(id) {
    try {
        await updateTagGroup(id, { active: true });
        showToast("Grupo restaurado.");
        await refresh();
    } catch (error) {
        showToast(error.message, "danger");
    }
}

async function restoreTag(id) {
    const tag = findTag(id);
    const group = groups.find((item) => item.tags.some(({ id: tagId }) => tagId === id));
    if (!group || group.deletedAt || !group.active) {
        showToast("Restaure primeiro o grupo desta tag.", "warning");
        return;
    }
    try {
        await updateTag(id, { active: true });
        showToast("Tag restaurada.");
        await refresh();
    } catch (error) {
        showToast(error.message, "danger");
    }
}

async function moveTag(id, groupId) {
    try {
        const target = findGroup(groupId);
        await updateTag(id, {
            groupId,
            sortOrder: (target?.tags.length ?? 0) * 10
        });
        showToast("Tag movida para outro grupo.");
        await refresh();
    } catch (error) {
        showToast(error.message, "danger");
        await refresh();
    }
}

async function reorderTag(id, direction) {
    const group = groups.find((item) => item.tags.some((tag) => tag.id === id));
    const index = group.tags.findIndex((tag) => tag.id === id);
    const targetIndex = index + direction;
    if (!group.tags[targetIndex]) return;
    const ordered = [...group.tags];
    [ordered[index], ordered[targetIndex]] = [ordered[targetIndex], ordered[index]];

    try {
        await Promise.all(ordered.map((tag, position) => (
            updateTag(tag.id, { sortOrder: position * 10 })
        )));
        await refresh();
    } catch (error) {
        showToast(error.message, "danger");
    }
}

function findGroup(id) {
    return groups.find((group) => group.id === id);
}

function findTag(id) {
    for (const group of groups) {
        const tag = group.tags.find((item) => item.id === id);
        if (tag) return tag;
    }
    return null;
}

function entityDialog({ title, fields, submitLabel }) {
    return new Promise((resolve) => {
        const element = document.createElement("div");
        element.className = "modal fade";
        element.tabIndex = -1;
        element.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <form class="modal-content cantus-modal">
                    <div class="modal-header">
                        <h2 class="modal-title fs-5">${escapeHtml(title)}</h2>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                    </div>
                    <div class="modal-body">
                        ${fields.map(dialogField).join("")}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">${escapeHtml(submitLabel)}</button>
                    </div>
                </form>
            </div>
        `;
        document.body.append(element);
        const modal = new window.bootstrap.Modal(element);
        let result = null;
        element.querySelector("form").addEventListener("submit", (event) => {
            event.preventDefault();
            if (!event.currentTarget.checkValidity()) {
                event.currentTarget.classList.add("was-validated");
                return;
            }
            result = Object.fromEntries(new FormData(event.currentTarget));
            modal.hide();
        });
        element.addEventListener("hidden.bs.modal", () => {
            modal.dispose();
            element.remove();
            resolve(result);
        }, { once: true });
        modal.show();
        element.querySelector("input, select")?.focus();
    });
}

function dialogField(field) {
    const id = `dialog-${field.name}`;
    const control = field.type === "select"
        ? `<select id="${id}" name="${field.name}" class="form-select" ${field.required ? "required" : ""}>${field.options.map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === field.value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}</select>`
        : `<input id="${id}" name="${field.name}" class="form-control" maxlength="100" value="${escapeHtml(field.value)}" ${field.required ? "required" : ""}>`;
    return `<div class="form-field mb-3"><label class="form-label" for="${id}">${escapeHtml(field.label)}</label>${control}<div class="invalid-feedback">Este campo é obrigatório.</div></div>`;
}
