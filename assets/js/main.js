/* =========================================================
   Turin Turan Barber — Burgos
   Interacciones + reserva en modo demostración
   ---------------------------------------------------------
   CONFIGURACIÓN: todo lo que hay que cambiar para pasar a
   reservas reales está en el objeto BUSINESS de abajo.
   Los datos de contacto están verificados en fuentes
   públicas (ver BUSINESS_RESEARCH.md). El horario es
   provisional y la reserva NO guarda citas reales.
   ========================================================= */

const BUSINESS = {
  name: "Turin Turan Barber",
  address: "Av. del Cid Campeador, 58 · 09005 Burgos",
  phone: "+34 614 28 02 64",
  phoneRaw: "+34614280264",
  whatsapp: "34614280264",
  instagram: "https://www.instagram.com/turinturanbarber/",
  mapsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=Turin+Turan%2C+Av.+del+Cid+Campeador+58%2C+09005+Burgos",
  timezone: "Europe/Madrid",

  // Horario publicado en el sitio de referencia. PENDIENTE de confirmar.
  hoursProvisional: true,

  booking: {
    mode: "demo", // "demo" no envía nada. Para producción: conectar API/agenda.
    daysAhead: 12,
    openTime: "10:00",
    closeTime: "20:30",
    slotMinutes: 30,
    closedWeekdays: [], // 0 = domingo … 6 = sábado (ninguno cerrado según el horario provisional)
    occupiedRatio: 7, // cada N franjas se marca como ocupada (solo demo)
  },

  // Servicios confirmados en el perfil público de Fresha y en el sitio de referencia.
  // Las duraciones son de DEMOSTRACIÓN: no están publicadas por la barbería.
  services: [
    { id: "corte", name: "Corte clásico", duration: 40 },
    { id: "fade", name: "Degradado / Fade", duration: 40 },
    { id: "barba", name: "Arreglo y diseño de barba", duration: 25 },
    { id: "afeitado", name: "Afeitado tradicional", duration: 30 },
    { id: "combo", name: "Corte + barba", duration: 60 },
  ],
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = String(new Date().getFullYear());

  initNav();
  initStickyHeader();
  initReveal();
  initBooking();
});

/* ---------------- Navegación ---------------- */
function initNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");
  if (!toggle || !nav) return;

  const close = () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    nav.style.removeProperty("top");
  };

  const positionNav = () => {
    const header = document.querySelector(".site-header");
    if (!header) return;
    nav.style.top = `${Math.max(0, header.getBoundingClientRect().bottom)}px`;
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    if (open) {
      close();
    } else {
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Cerrar menú");
      positionNav();
      nav.classList.add("is-open");
      document.body.classList.add("nav-open");
    }
  });

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) {
      close();
    } else if (nav.classList.contains("is-open")) {
      positionNav();
    }
  });
}

/* ---------------- Header sticky ---------------- */
function initStickyHeader() {
  const header = document.getElementById("siteHeader");
  if (!header) return;
  const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------------- Aparición al hacer scroll ---------------- */
function initReveal() {
  const items = [...document.querySelectorAll(".reveal")];
  if (!items.length) return;

  const reveal = (el) => el.classList.add("is-visible");

  if (!("IntersectionObserver" in window)) {
    items.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((el) => observer.observe(el));

  // Respaldo: si el observador no dispara, el scroll revela igualmente el contenido.
  const check = () => {
    items.forEach((el) => {
      if (el.classList.contains("is-visible")) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) reveal(el);
    });
  };
  window.addEventListener("scroll", check, { passive: true });
  window.addEventListener("resize", check);
  check();
}

/* ---------------- Reserva demo ---------------- */
function initBooking() {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  const panels = [...form.querySelectorAll(".panel")];
  const stepEls = [...document.querySelectorAll("#steps .step")];
  const actions = document.getElementById("bookingActions");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const errorEl = document.getElementById("formError");

  const state = {
    step: 1,
    serviceId: null,
    date: null,
    time: null,
  };
  const totalSteps = 4;

  renderServices();
  renderDates();

  form.addEventListener("submit", (event) => event.preventDefault());

  nextBtn.addEventListener("click", () => {
    if (state.step === totalSteps) {
      submitBooking();
      return;
    }
    if (!validateStep(state.step)) return;
    goToStep(state.step + 1);
  });

  prevBtn.addEventListener("click", () => {
    if (state.step > 1) goToStep(state.step - 1);
  });

  form.addEventListener("change", (event) => {
    const target = event.target;
    if (target.name === "service") {
      state.serviceId = target.value;
      state.time = null;
      renderTimes();
    }
    if (target.name === "date") {
      state.date = target.value;
      state.time = null;
      renderTimes();
    }
    if (target.name === "time") {
      state.time = target.value;
    }
    hideError();
  });

  document.getElementById("restartBooking").addEventListener("click", () => {
    form.reset();
    state.serviceId = null;
    state.date = null;
    state.time = null;
    hideError();
    renderDates();
    goToStep(1);
  });

  function goToStep(step) {
    state.step = step;
    panels.forEach((panel) => {
      const isActive = Number(panel.dataset.panel) === step;
      panel.classList.toggle("is-active", isActive);
      if (isActive) panel.removeAttribute("hidden");
    });

    stepEls.forEach((el) => {
      const n = Number(el.dataset.step);
      el.classList.toggle("is-active", n === step);
      el.classList.toggle("is-done", n < step);
    });

    // La confirmación (panel 5) no muestra los pasos ni los botones.
    const confirming = step > totalSteps;
    document.getElementById("steps").hidden = confirming;
    actions.hidden = confirming;

    prevBtn.hidden = step <= 1;
    if (step === totalSteps) {
      nextBtn.textContent = "Confirmar turno";
    } else {
      nextBtn.textContent = "Continuar";
    }

    hideError();
    const active = panels.find((p) => p.classList.contains("is-active"));
    if (active) {
      const title = active.querySelector(".panel-title");
      if (title) {
        title.setAttribute("tabindex", "-1");
        title.focus({ preventScroll: true });
      }
    }
  }

  function validateStep(step) {
    if (step === 1 && !state.serviceId) {
      showError("Elige un servicio para continuar.");
      return false;
    }
    if (step === 2 && !state.date) {
      showError("Elige un día para continuar.");
      return false;
    }
    if (step === 3 && !state.time) {
      showError("Elige una hora para continuar.");
      return false;
    }
    return true;
  }

  function submitBooking() {
    const name = document.getElementById("bkName");
    const phone = document.getElementById("bkPhone");
    const email = document.getElementById("bkEmail");
    const consent = document.getElementById("bkConsent");

    [name, phone, email].forEach((input) => input.removeAttribute("aria-invalid"));
    hideError();

    const nameValue = name.value.trim();
    const phoneValue = phone.value.trim();
    const emailValue = email.value.trim();
    const phoneDigits = phoneValue.replace(/[^\d]/g, "");

    let message = "";
    if (nameValue.length < 2) {
      message = "Escribe tu nombre para continuar.";
      name.setAttribute("aria-invalid", "true");
    } else if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      message = "Revisa el teléfono: introduce entre 9 y 15 dígitos.";
      phone.setAttribute("aria-invalid", "true");
    } else if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailValue)) {
      message = "El email no parece válido. Puedes dejarlo vacío.";
      email.setAttribute("aria-invalid", "true");
    } else if (!consent.checked) {
      message = "Acepta el uso de tus datos para preparar la reserva de demostración.";
    }

    if (message) {
      showError(message);
      return;
    }

    const service = BUSINESS.services.find((s) => s.id === state.serviceId);
    const summary = document.getElementById("confirmSummary");
    const rows = [
      ["Servicio", service ? service.name : "—"],
      ["Día", formatLongDate(state.date)],
      ["Hora", state.time || "—"],
      ["Duración", service ? `${service.duration} min (demo)` : "—"],
      ["Nombre", nameValue],
      ["Teléfono", phoneValue],
    ];

    summary.innerHTML = rows
      .map(
        ([label, value]) =>
          `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
      )
      .join("");

    document.getElementById("confirmRef").textContent =
      "Referencia demo: TT-" + Math.random().toString(36).slice(2, 6).toUpperCase();

    goToStep(totalSteps + 1);
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function hideError() {
    errorEl.hidden = true;
  }

  function renderServices() {
    const wrap = document.getElementById("serviceOptions");
    wrap.innerHTML = BUSINESS.services
      .map(
        (service) => `
        <label class="service-option">
          <input type="radio" name="service" value="${escapeHtml(service.id)}">
          <span class="so-dot" aria-hidden="true"></span>
          <span class="so-name">${escapeHtml(service.name)}</span>
          <span class="so-meta">${service.duration} min</span>
        </label>`
      )
      .join("");
  }

  function renderDates() {
    const wrap = document.getElementById("dateOptions");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const options = [];
    for (let i = 0; i < BUSINESS.booking.daysAhead; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (BUSINESS.booking.closedWeekdays.includes(date.getDay())) continue;

      const iso = toISODate(date);
      const dow = new Intl.DateTimeFormat("es-ES", { weekday: "short" })
        .format(date)
        .replace(".", "");
      const mon = new Intl.DateTimeFormat("es-ES", { month: "short" })
        .format(date)
        .replace(".", "");

      options.push(`
        <label class="date-option">
          <input type="radio" name="date" value="${iso}">
          <span class="dow">${escapeHtml(dow)}</span>
          <span class="dom">${date.getDate()}</span>
          <span class="mon">${escapeHtml(mon)}</span>
        </label>`);
    }
    wrap.innerHTML = options.join("");
  }

  function renderTimes() {
    const wrap = document.getElementById("timeOptions");
    if (!state.date) {
      wrap.innerHTML = '<p class="panel-hint">Elige antes un día para ver las horas disponibles.</p>';
      return;
    }

    const slots = buildSlots(state.date);
    wrap.innerHTML = slots
      .map(
        (slot) => `
        <label class="time-option">
          <input type="radio" name="time" value="${slot}">
          <span>${slot}</span>
        </label>`
      )
      .join("");
  }

  function buildSlots(dateISO) {
    const [openH, openM] = BUSINESS.booking.openTime.split(":").map(Number);
    const [closeH, closeM] = BUSINESS.booking.closeTime.split(":").map(Number);
    const start = openH * 60 + openM;
    const end = closeH * 60 + closeM;
    const step = BUSINESS.booking.slotMinutes;

    const slots = [];
    for (let minutes = start; minutes <= end; minutes += step) {
      const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
      const mm = String(minutes % 60).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }

    // Disponibilidad simulada y estable por día (solo demostración).
    return slots.filter((slot, index) => {
      const seed = hashCode(dateISO + slot);
      return (seed + index) % BUSINESS.booking.occupiedRatio !== 0;
    });
  }

  function formatLongDate(iso) {
    if (!iso) return "—";
    const date = new Date(iso + "T12:00:00");
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date);
  }

  // Estado inicial
  goToStep(1);
  document.getElementById("steps").hidden = false;
}

/* ---------------- Utilidades ---------------- */
function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function hashCode(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
