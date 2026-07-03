export function showToast(message, variant = "success") {
    const region = document.querySelector("#toast-region");
    const toast = document.createElement("div");
    const icons = {
        success: "check-circle-fill",
        warning: "exclamation-triangle-fill",
        danger: "exclamation-circle-fill"
    };
    const icon = icons[variant] ?? icons.success;

    toast.className = `cantus-toast cantus-toast-${variant}`;
    toast.setAttribute("role", "status");
    toast.innerHTML = `
        <i class="bi bi-${icon}"></i>
        <span></span>
        <button type="button" aria-label="Fechar">&times;</button>
    `;
    toast.querySelector("span").textContent = message;
    toast.querySelector("button").addEventListener("click", () => toast.remove());
    region.append(toast);

    window.setTimeout(() => toast.remove(), 4000);
}

export function setFlash(message) {
    window.sessionStorage.setItem("cantus.flash", message);
}

export function showFlash() {
    const message = window.sessionStorage.getItem("cantus.flash");

    if (message) {
        window.sessionStorage.removeItem("cantus.flash");
        showToast(message);
    }
}
