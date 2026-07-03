export function dataTable({
    columns,
    rows,
    sortBy = "",
    sortOrder = "asc",
    emptyContent = ""
}) {
    if (rows.length === 0) {
        return emptyContent;
    }

    return `
        <div class="table-responsive">
            <table class="table cantus-table align-middle mb-0">
                <thead>
                    <tr>
                        ${columns.map((column) => tableHeading(
                            column,
                            sortBy,
                            sortOrder
                        )).join("")}
                    </tr>
                </thead>
                <tbody>${rows.join("")}</tbody>
            </table>
        </div>
    `;
}

function tableHeading(column, sortBy, sortOrder) {
    const className = column.className ? ` class="${column.className}"` : "";

    if (!column.sortable) {
        return `<th${className}>${column.label}</th>`;
    }

    const active = sortBy === column.key;
    const icon = active
        ? (sortOrder === "asc" ? "arrow-up" : "arrow-down")
        : "arrow-down-up";

    return `
        <th${className}>
            <button
                class="table-sort ${active ? "active" : ""}"
                type="button"
                data-sort="${column.key}"
                aria-label="Ordenar por ${column.label}"
            >
                ${column.label}
                <i class="bi bi-${icon}"></i>
            </button>
        </th>
    `;
}
