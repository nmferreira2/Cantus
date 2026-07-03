export function confirmDialog({
    title,
    message,
    confirmLabel = "Confirmar",
    variant = "danger"
}) {
    return new Promise((resolve) => {
        const element = document.createElement("div");
        element.className = "modal fade";
        element.tabIndex = -1;
        element.setAttribute("aria-hidden", "true");
        element.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content cantus-modal">
                    <div class="modal-header">
                        <h2 class="modal-title fs-5"></h2>
                        <button
                            type="button"
                            class="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Fechar"
                        ></button>
                    </div>
                    <div class="modal-body"><p class="mb-0"></p></div>
                    <div class="modal-footer">
                        <button
                            type="button"
                            class="btn btn-light"
                            data-bs-dismiss="modal"
                        >Cancelar</button>
                        <button
                            type="button"
                            class="btn btn-${variant}"
                            data-confirm
                        ></button>
                    </div>
                </div>
            </div>
        `;
        element.querySelector(".modal-title").textContent = title;
        element.querySelector(".modal-body p").textContent = message;
        element.querySelector("[data-confirm]").textContent = confirmLabel;
        document.body.append(element);

        const modal = new window.bootstrap.Modal(element);
        let confirmed = false;

        element.querySelector("[data-confirm]").addEventListener("click", () => {
            confirmed = true;
            modal.hide();
        });
        element.addEventListener("hidden.bs.modal", () => {
            modal.dispose();
            element.remove();
            resolve(confirmed);
        }, { once: true });
        modal.show();
    });
}
