export function notFoundPage() {
    return {
        title: "Página não encontrada",
        render: () => `
            <div class="empty-state card-surface">
                <i class="bi bi-compass"></i>
                <h2>Esta página não faz parte do repertório</h2>
                <p>O endereço pode ter mudado ou a página não existe.</p>
                <a href="/" class="btn btn-primary" data-link>Voltar ao painel</a>
            </div>
        `
    };
}
