import {
    archiveMass,
    getCelebrationPdf,
    getCelebrationText,
    getMass
} from "../api/masses.api.js";
import { confirmDialog } from "../components/modal.js";
import { setFlash, showFlash, showToast } from "../components/toast.js";
import { loadingState, statusBadge } from "../components/ui.js";
import { router } from "../router.js";
import { escapeHtml, formatDate } from "../utils/format.js";
import { formatDateTime, MASS_SLOTS, massSlotLabel } from "../utils/masses.js";
import { can, PERMISSIONS } from "../utils/permissions.js";

export function massDetailsPage(id) {
    return { title: "Detalhes da missa", render: () => `<div id="mass-detail">${loadingState("A carregar missa…")}</div>`, mount: async () => { const mass = await getMass(id); render(mass); bind(mass); showFlash(); } };
}

function render(mass) {
    const bySlot = new Map(
        mass.songs
            .filter(({ slot }) => slot !== "EXTRA")
            .map((item) => [item.slot, item.song])
    );
    const extraSongs = mass.songs
        .filter(({ slot }) => slot === "EXTRA")
        .sort((first, second) => first.position - second.position);
    const planRows = [
        ...MASS_SLOTS.map(([slot]) => planRow(slot, bySlot.get(slot))),
        ...extraSongs.map((item, index) => extraPlanRow(item, index))
    ].join("");
    document.querySelector("#mass-detail").innerHTML = `
        <section class="page-heading"><div><a href="/masses" class="back-link" data-link><i class="bi bi-arrow-left"></i> Missas</a><div class="d-flex gap-2 mt-3 mb-2">${mass.season ? `<span class="type-badge">${escapeHtml(mass.season.name)}</span>` : ""}${statusBadge(mass.active)}</div><h2>${escapeHtml(mass.celebration?.name || "Missa")}</h2><p class="page-description">${formatDateTime(mass.startsAt)} · ${escapeHtml(mass.church)}</p></div><div class="d-flex gap-2"><button id="celebration-text" class="btn btn-light" type="button"><i class="bi bi-file-earmark-text"></i> Exportar texto</button><button id="celebration-pdf" class="btn btn-light" type="button"><i class="bi bi-file-earmark-pdf"></i> Gerar PDF da celebração</button>${can(PERMISSIONS.MANAGE_MASSES) ? `<a href="/masses/${encodeURIComponent(mass.id)}/edit" class="btn btn-primary" data-link><i class="bi bi-pencil"></i> Editar plano</a><button id="delete-mass" class="btn btn-light text-danger" type="button"><i class="bi bi-trash3"></i> Eliminar</button>` : ""}</div></section>
        <div class="detail-grid"><section class="card-surface detail-card"><div class="card-heading"><span class="card-heading-icon"><i class="bi bi-music-note-list"></i></span><div><h3>Plano musical</h3><p>${mass.songs.length} cânticos selecionados</p></div></div><div class="mass-plan-list">${planRows}</div></section>
        <div class="detail-stack"><section class="card-surface detail-card"><div class="card-heading"><span class="card-heading-icon"><i class="bi bi-calendar-event"></i></span><div><h3>Detalhes da celebração</h3><p>Dados do planeamento</p></div></div><dl class="info-list single-column">${info("Data e hora", formatDateTime(mass.startsAt))}${info("Igreja", mass.church)}${info("Presidente", mass.presider)}${info("Coro", mass.choir)}${info("Criada em", formatDate(mass.createdAt))}</dl>${mass.comments ? `<div class="long-text"><h4>Observações</h4><p>${escapeHtml(mass.comments).replaceAll("\n", "<br>")}</p></div>` : ""}</section></div></div>
    `;
}

function planRow(slot, song) {
    if (!song) {
        return `<div class="mass-plan-row"><span>${massSlotLabel(slot)}</span><em>Sem cântico selecionado</em></div>`;
    }

    const credits = [
        song.arrangerName ? `Arr.: ${song.arrangerName}` : "",
        song.harmonizerName ? `Harm.: ${song.harmonizerName}` : ""
    ].filter(Boolean).join(" · ");
    const label = `${song.title} — ${song.composerName}`;

    return `
        <div class="mass-plan-row">
            <span>${massSlotLabel(slot)}</span>
            <a href="/songs/${encodeURIComponent(song.id)}" data-link>
                <strong>${escapeHtml(label)}</strong>
                ${credits ? `<small>${escapeHtml(credits)}</small>` : ""}
            </a>
        </div>
    `;
}

function extraPlanRow(item, index) {
    const song = item.song;
    const label = item.label || `Extra ${index + 1}`;
    const credits = [
        song.arrangerName ? `Arr.: ${song.arrangerName}` : "",
        song.harmonizerName ? `Harm.: ${song.harmonizerName}` : ""
    ].filter(Boolean).join(" · ");
    const title = `${song.title} — ${song.composerName}`;

    return `
        <div class="mass-plan-row mass-plan-row-extra">
            <span>${escapeHtml(label)}</span>
            <a href="/songs/${encodeURIComponent(song.id)}" data-link>
                <strong>${escapeHtml(title)}</strong>
                ${credits ? `<small>${escapeHtml(credits)}</small>` : ""}
            </a>
        </div>
    `;
}

function bind(mass) {
    document.querySelector("#delete-mass")?.addEventListener("click", async (event) => {
        const confirmed = await confirmDialog({ title: "Eliminar planeamento?", message: "O planeamento será removido da lista de missas.", confirmLabel: "Eliminar" });
        if (!confirmed) return; event.currentTarget.disabled = true;
        try { await archiveMass(mass.id); setFlash("Planeamento eliminado."); router.navigate("/masses"); }
        catch (error) { showToast(error.message, "danger"); event.currentTarget.disabled = false; }
    });
    document.querySelector("#celebration-text").addEventListener("click", async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        try {
            const text = await getCelebrationText(mass.id);
            downloadBlob(text.blob, text.filename);
            showToast("Planeamento exportado em texto.");
        } catch (error) {
            showToast(error.message, "danger");
        } finally {
            button.disabled = false;
        }
    });
    document.querySelector("#celebration-pdf").addEventListener("click", async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        try {
            const pdf = await getCelebrationPdf(mass.id);
            downloadBlob(pdf.blob, pdf.filename);
            showToast("PDF da celebração gerado com sucesso.");
        } catch (error) {
            showToast(error.message, "danger");
        } finally {
            button.disabled = false;
        }
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function info(label, value) { return `<div><dt>${label}</dt><dd>${escapeHtml(value || "—")}</dd></div>`; }
