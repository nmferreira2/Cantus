export function paginatedResponse(data, totalItems, query) {
    const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));

    return {
        data,
        pagination: {
            page: Math.min(query.page, totalPages),
            pageSize: query.pageSize,
            totalItems,
            totalPages
        }
    };
}
