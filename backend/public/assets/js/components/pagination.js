export function pagination({ page, totalPages, totalItems, pageSize }) {
    if (totalItems === 0) {
        return "";
    }

    const firstItem = (page - 1) * pageSize + 1;
    const lastItem = Math.min(page * pageSize, totalItems);
    const pageNumbers = visiblePages(page, totalPages);

    return `
        <nav class="table-pagination" aria-label="Paginação">
            <span>A mostrar ${firstItem}–${lastItem} de ${totalItems}</span>
            <div class="pagination-controls">
                ${pageButton(page - 1, "chevron-left", "Página anterior", page === 1)}
                ${pageNumbers.map((number) => (
                    number === "…"
                        ? '<span class="pagination-ellipsis">…</span>'
                        : numberedButton(number, page)
                )).join("")}
                ${pageButton(
                    page + 1,
                    "chevron-right",
                    "Página seguinte",
                    page === totalPages
                )}
            </div>
        </nav>
    `;
}

function visiblePages(page, totalPages) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set([1, totalPages, page - 1, page, page + 1]);
    const sorted = [...pages]
        .filter((number) => number >= 1 && number <= totalPages)
        .sort((a, b) => a - b);
    const result = [];

    sorted.forEach((number, index) => {
        if (index > 0 && number - sorted[index - 1] > 1) {
            result.push("…");
        }
        result.push(number);
    });

    return result;
}

function numberedButton(number, currentPage) {
    return `
        <button
            class="pagination-button ${number === currentPage ? "active" : ""}"
            type="button"
            data-page="${number}"
            ${number === currentPage ? 'aria-current="page"' : ""}
        >${number}</button>
    `;
}

function pageButton(page, icon, label, disabled) {
    return `
        <button
            class="pagination-button"
            type="button"
            data-page="${page}"
            aria-label="${label}"
            ${disabled ? "disabled" : ""}
        ><i class="bi bi-${icon}"></i></button>
    `;
}
