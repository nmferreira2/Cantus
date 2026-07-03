export function inputField({
    name,
    label,
    required = false,
    placeholder = "",
    type = "text",
    requiredFeedback = `${label} é obrigatório.`
}) {
    return `
        <div class="form-field">
            <label class="form-label" for="${name}">
                ${label}${required ? ' <span aria-hidden="true">*</span>' : ""}
            </label>
            <input
                class="form-control"
                id="${name}"
                name="${name}"
                type="${type}"
                ${required ? "required" : ""}
                placeholder="${placeholder}"
            >
            <div class="invalid-feedback">${required ? requiredFeedback : ""}</div>
        </div>
    `;
}

export function textareaField({ name, label, rows = 6 }) {
    return `
        <div class="form-field">
            <label class="form-label" for="${name}">${label}</label>
            <textarea
                class="form-control"
                id="${name}"
                name="${name}"
                rows="${rows}"
            ></textarea>
            <div class="invalid-feedback"></div>
        </div>
    `;
}

export function selectField({ name, label, options }) {
    return `
        <div class="form-field">
            <label class="form-label" for="${name}">${label}</label>
            <select class="form-select" id="${name}" name="${name}">
                ${options.map(({ value, label: optionLabel }) => (
                    `<option value="${value}">${optionLabel}</option>`
                )).join("")}
            </select>
            <div class="invalid-feedback"></div>
        </div>
    `;
}
