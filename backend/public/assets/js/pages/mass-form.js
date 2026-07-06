import {
    createMass,
    getMass,
    getMassReferences,
    updateMass
} from "../api/masses.api.js";
import { getAllSongs } from "../api/songs.api.js";
import { inputField, textareaField } from "../components/form.js";
import { setFlash } from "../components/toast.js";
import { router } from "../router.js";
import { escapeHtml } from "../utils/format.js";
import { MASS_SLOTS } from "../utils/masses.js";

export function massFormPage(id = null) {
    const editing = Boolean(id);
    return {
        title: editing ? "Editar missa" : "Planear missa",
        render: () => `
            <section class="page-heading"><div><p class="eyebrow">Planeamento da missa</p><h2>${editing ? "Editar missa" : "Planear missa"}</h2><p class="page-description">Defina a celebração e escolha os cânticos do repertório.</p></div><a href="${editing ? `/masses/${encodeURIComponent(id)}` : "/masses"}" class="btn btn-light" data-link><i class="bi bi-arrow-left"></i> Cancelar</a></section>
            <form id="mass-form" class="card-surface form-card" novalidate><div id="form-alert"></div><fieldset disabled>
                <div class="form-section"><div><h3>Celebração</h3><p>Data, local e contexto litúrgico.</p></div><div class="form-grid">
                    ${inputField({ name: "startsAt", label: "Data e hora", type: "datetime-local", required: true })}
                    ${inputField({ name: "church", label: "Igreja", placeholder: "S. Salvador de Fornelos" })}
                    ${inputField({ name: "celebrationName", label: "Celebração", placeholder: "Ex.: Domingo VII do Tempo Comum" })}
                    <div class="form-field"><label class="form-label" for="seasonId">Tempo litúrgico</label><select id="seasonId" name="seasonId" class="form-select"></select></div>
                    ${inputField({ name: "presider", label: "Presidente" })}
                    ${inputField({ name: "choir", label: "Coro" })}
                    ${textareaField({ name: "comments", label: "Observações", rows: 4 })}
                    <div class="form-check form-switch align-self-end mb-3"><input id="active" name="active" class="form-check-input" type="checkbox" checked><label for="active" class="form-check-label">Planeamento ativo</label></div>
                </div></div>
                <div class="form-section"><div><h3>Plano musical</h3><p>Escolha um cântico para cada momento litúrgico.</p></div><div class="mass-slot-grid" id="mass-slots"></div></div>
                <div class="form-actions"><a href="/masses" class="btn btn-light" data-link>Cancelar</a><button class="btn btn-primary" type="submit"><span class="button-label">${editing ? "Guardar alterações" : "Criar planeamento"}</span><span class="spinner-border spinner-border-sm d-none"></span></button></div>
            </fieldset></form>
        `,
        mount: () => mount(id)
    };
}

async function mount(id) {
    const form = document.querySelector("#mass-form");
    try {
        const [references, songs, mass] = await Promise.all([
            getMassReferences(),
            getAllSongs({ status: "active", sortBy: "title" }),
            id ? getMass(id) : Promise.resolve(null)
        ]);
        fillOptions(form, references, songs);
        if (mass) {
            fillMass(form, mass);
        } else {
            form.elements.church.value = "S. Salvador de Fornelos";
        }
        form.querySelector("fieldset").disabled = false;
    } catch (error) { showError(error.message); return; }
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); form.classList.add("was-validated"); if (!form.checkValidity()) return;
        const button = form.querySelector('button[type="submit"]'); toggle(button, true);
        try {
            const songs = Object.fromEntries(MASS_SLOTS.map(([slot]) => [slot, form.elements[`slot-${slot}`].value]).filter(([, songId]) => songId));
            const data = {
                startsAt: new Date(form.elements.startsAt.value).toISOString(),
                church: form.elements.church.value,
                celebrationName: form.elements.celebrationName.value,
                seasonId: form.elements.seasonId.value,
                presider: form.elements.presider.value,
                choir: form.elements.choir.value,
                comments: form.elements.comments.value,
                active: form.elements.active.checked,
                songs
            };
            const mass = id ? await updateMass(id, data) : await createMass(data);
            setFlash(`Missa ${id ? "atualizada" : "planeada"} com sucesso.`);
            router.navigate(`/masses/${encodeURIComponent(mass.id)}`);
        } catch (error) { showError(error.message); toggle(button, false); }
    });
}

function fillOptions(form, references, songs) {
    form.elements.seasonId.innerHTML = `<option value="">Escolha o tempo</option>${references.seasons.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("")}`;
    const songOptions = `<option value="">Sem cântico selecionado</option>${songs.map((song) => {
        const credits = [
            song.arrangerName ? `Arr.: ${song.arrangerName}` : "",
            song.harmonizerName ? `Harm.: ${song.harmonizerName}` : ""
        ].filter(Boolean).join(" · ");
        return `<option value="${escapeHtml(song.id)}">${escapeHtml(
            `${song.title} — ${song.composerName}${credits ? ` [${credits}]` : ""}`
        )}</option>`;
    }).join("")}`;
    document.querySelector("#mass-slots").innerHTML = MASS_SLOTS.map(([slot, label]) => `<div class="form-field"><label class="form-label" for="slot-${slot}">${label}</label><select id="slot-${slot}" name="slot-${slot}" class="form-select">${songOptions}</select></div>`).join("");
}

function fillMass(form, mass) {
    const local = new Date(new Date(mass.startsAt).getTime() - new Date(mass.startsAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    form.elements.startsAt.value = local;
    ["church", "seasonId", "presider", "choir", "comments"].forEach((field) => { form.elements[field].value = mass[field] ?? ""; });
    form.elements.celebrationName.value = mass.celebration?.name ?? "";
    form.elements.active.checked = mass.active;
    mass.songs.forEach(({ slot, songId }) => { form.elements[`slot-${slot}`].value = songId; });
}

function showError(message) { const target = document.querySelector("#form-alert"); target.innerHTML = '<div class="alert alert-danger"></div>'; target.firstElementChild.textContent = message; }
function toggle(button, loading) { button.disabled = loading; button.querySelector(".button-label").classList.toggle("d-none", loading); button.querySelector(".spinner-border").classList.toggle("d-none", !loading); }
