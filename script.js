// Mobile navigation
const menuToggle = document.querySelector(".menu-toggle");
const primaryNavigation = document.querySelector(".primary-nav");

function closeMenu() {
  if (!menuToggle || !primaryNavigation) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menú de navegación");
  primaryNavigation.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

if (menuToggle && primaryNavigation) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Abrir menú de navegación" : "Cerrar menú de navegación");
    primaryNavigation.classList.toggle("is-open", !isExpanded);
    document.body.classList.toggle("menu-open", !isExpanded);
  });

  primaryNavigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) closeMenu();
  });
}

// Accessible tabs for the three strategic pillars
const strategyTabs = Array.from(document.querySelectorAll(".strategy-tab"));
const strategyPanels = Array.from(document.querySelectorAll(".strategy-panel"));

function activateStrategyTab(selectedTab, moveFocus) {
  strategyTabs.forEach((tab) => {
    const isSelected = tab === selectedTab;
    tab.classList.toggle("is-active", isSelected);
    tab.setAttribute("aria-selected", String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;

    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    if (panel) {
      panel.hidden = !isSelected;
      panel.classList.toggle("is-active", isSelected);
    }
  });

  if (moveFocus) selectedTab.focus();
}

strategyTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateStrategyTab(tab, false));

  tab.addEventListener("keydown", (event) => {
    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % strategyTabs.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + strategyTabs.length) % strategyTabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = strategyTabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    activateStrategyTab(strategyTabs[nextIndex], true);
  });
});

// Count-up values and progress bars animate when the dashboard enters view.
const dashboard = document.querySelector("#hallazgos");
const countElements = document.querySelectorAll(".count-up");
const progressElements = document.querySelectorAll(".progress-fill");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function showDashboardMetrics() {
  countElements.forEach((element) => {
    const target = Number(element.dataset.count);
    if (!Number.isFinite(target)) return;

    if (prefersReducedMotion) {
      element.textContent = target.toFixed(1);
      return;
    }

    const duration = 1100;
    const startTime = performance.now();

    function updateCount(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      element.textContent = (target * easedProgress).toFixed(1);
      if (progress < 1) requestAnimationFrame(updateCount);
    }

    requestAnimationFrame(updateCount);
  });

  progressElements.forEach((element) => {
    const value = Number(element.dataset.progress);
    if (Number.isFinite(value)) element.style.width = `${Math.max(0, Math.min(value, 100))}%`;
  });
}

if (dashboard && "IntersectionObserver" in window) {
  const dashboardObserver = new IntersectionObserver((entries, observer) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      showDashboardMetrics();
      observer.disconnect();
    }
  }, { threshold: 0.2 });

  dashboardObserver.observe(dashboard);
} else if (dashboard) {
  showDashboardMetrics();
}

// Prepare a draft email only after the visitor reviews the collected answers.
const feedbackForm = document.querySelector("#feedback-form");
const feedbackStatus = document.querySelector("#form-status");

if (feedbackForm && feedbackStatus) {
  feedbackForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!feedbackForm.reportValidity()) return;

    const recipient = feedbackForm.dataset.recipient;
    if (!recipient) {
      feedbackStatus.textContent = "No se ha configurado el correo receptor. No se preparó ningún envío.";
      feedbackStatus.hidden = false;
      return;
    }

    const formData = new FormData(feedbackForm);
    const getAnswer = (name) => String(formData.get(name) || "No indicado").trim();
    const subject = "Comentarios sobre Tienda D1 El Bosque";
    const body = [
      "Formulario de comentarios y recolección de datos",
      "Tienda D1 · El Bosque (Cl. 47 Nte. #6 A N 58)",
      `Fecha: ${new Date().toLocaleString("es-CO")}`,
      "",
      `Motivo de visita: ${getAnswer("visit-reason")}`,
      `Calificación de experiencia: ${getAnswer("rating")} / 5`,
      `Encontró lo que buscaba: ${getAnswer("found-items")}`,
      `Producto o categoría de interés: ${getAnswer("product-interest")}`,
      "",
      "Comentario:",
      getAnswer("visitor-comment"),
      "",
      `Nombre: ${getAnswer("visitor-name")}`,
      `Correo de contacto: ${getAnswer("visitor-email")}`,
      `Consentimiento para uso académico: ${getAnswer("consent")}`
    ].join("\n");
    const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const mailLink = document.createElement("a");
    mailLink.className = "button button-primary feedback-mail-link";
    mailLink.href = mailto;
    mailLink.textContent = "Abrir borrador de correo";

    feedbackStatus.replaceChildren(
      document.createTextNode("Tus respuestas están listas. Abre el borrador y presiona Enviar en tu aplicación de correo para completar el envío."),
      document.createElement("br"),
      mailLink
    );
    feedbackStatus.hidden = false;
  });
}
