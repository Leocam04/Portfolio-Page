/* ==========================================================================
   PORTFOLIO EDITORIAL — INTERACTIVIDAD Y ANIMACIONES (main.js)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initHeaderScroll();
  initMobileMenu();
  initScrollReveal();
  initProjectsCursorPreview();
  initProposalGenerator();
});

/* --------------------------------------------------------------------------
   1. Cabecera dinámica al hacer scroll
   -------------------------------------------------------------------------- */
function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const updateHeader = () => {
    if (window.scrollY > 24) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

/* --------------------------------------------------------------------------
   2. Menú desplegable en dispositivos móviles
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  if (!toggleBtn || !mobileMenu) return;

  toggleBtn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("open");
    toggleBtn.textContent = isOpen ? "Cerrar" : "Menú";
    toggleBtn.setAttribute("aria-expanded", String(isOpen));
  });
}

/* --------------------------------------------------------------------------
   3. Aparición progresiva de secciones al hacer scroll (Reveal)
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.setAttribute("data-visible", "true");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elements.forEach((el) => observer.observe(el));
}

/* --------------------------------------------------------------------------
   4. Vista previa flotante de proyectos en escritorio (proyectos.html)
   -------------------------------------------------------------------------- */
function initProjectsCursorPreview() {
  const list = document.getElementById("projects-hover-list");
  const preview = document.getElementById("floating-preview");
  const previewImg = document.getElementById("floating-preview-img");
  if (!list || !preview || !previewImg) return;

  const rows = Array.from(list.querySelectorAll(".project-row"));

  list.addEventListener("mousemove", (e) => {
    preview.style.left = `${e.clientX}px`;
    preview.style.top = `${e.clientY}px`;
  });

  list.addEventListener("mouseenter", () => {
    preview.classList.add("visible");
  });

  list.addEventListener("mouseleave", () => {
    preview.classList.remove("visible");
    rows.forEach((r) => r.classList.remove("dimmed"));
  });

  rows.forEach((row) => {
    row.addEventListener("mouseenter", () => {
      const imgSrc = row.getAttribute("data-image");
      if (imgSrc) previewImg.setAttribute("src", imgSrc);

      rows.forEach((other) => {
        if (other !== row) {
          other.classList.add("dimmed");
        } else {
          other.classList.remove("dimmed");
        }
      });
    });
  });
}

/* --------------------------------------------------------------------------
   5. Generador interactivo de propuestas a medida (propuesta.html)
   -------------------------------------------------------------------------- */
function initProposalGenerator() {
  const form = document.getElementById("proposal-form");
  if (!form) return;

  const chipBtns = Array.from(document.querySelectorAll(".chip-btn"));
  const statusEl = document.getElementById("proposal-status");
  const yearEl = document.getElementById("proposal-year");
  const emptyState = document.getElementById("proposal-empty");
  const outputContainer = document.getElementById("proposal-output");
  const actionsContainer = document.getElementById("proposal-actions");
  const mailtoBtn = document.getElementById("proposal-mailto");
  const submitBtn = document.getElementById("proposal-submit");
  const stopBtn = document.getElementById("proposal-stop");
  const resultCol = document.getElementById("proposal-result-col");

  if (yearEl) {
    yearEl.textContent = `Propuesta Nº ${new Date().getFullYear()}-S`;
  }

  const selectedServices = new Set();

  chipBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const service = btn.getAttribute("data-service");
      if (!service) return;

      if (selectedServices.has(service)) {
        selectedServices.delete(service);
        btn.setAttribute("aria-pressed", "false");
      } else {
        selectedServices.add(service);
        btn.setAttribute("aria-pressed", "true");
      }
    });
  });

  let streamTimer = null;

  const stopGeneration = () => {
    if (streamTimer) {
      clearInterval(streamTimer);
      streamTimer = null;
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Generar propuesta ✳";
    }
    if (stopBtn) stopBtn.style.display = "none";
    if (statusEl) statusEl.textContent = "Lista";
  };

  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      stopGeneration();
      if (actionsContainer) actionsContainer.style.display = "flex";
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (streamTimer) clearInterval(streamTimer);

    const formData = new FormData(form);
    const nombre = (formData.get("nombre") || "").toString().trim();
    const marca = (formData.get("marca") || "").toString().trim();
    const objetivo = (formData.get("objetivo") || "").toString().trim();
    const presupuesto = (formData.get("presupuesto") || "").toString().trim();
    const servicios = Array.from(selectedServices);

    const markdownText = buildTailoredProposal({
      nombre,
      marca,
      objetivo,
      presupuesto,
      servicios,
    });

    if (resultCol) {
      setTimeout(() => {
        resultCol.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }

    if (emptyState) emptyState.style.display = "none";
    if (actionsContainer) actionsContainer.style.display = "none";
    if (outputContainer) {
      outputContainer.style.display = "block";
      outputContainer.innerHTML = "";
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Preparando…";
    }
    if (stopBtn) stopBtn.style.display = "inline-flex";
    if (statusEl) statusEl.textContent = "Escribiendo…";

    // Efecto de escritura progresiva tipo editorial
    let index = 0;
    const step = 12;

    streamTimer = setInterval(() => {
      index += step;
      const slice = markdownText.slice(0, index);
      if (outputContainer) {
        outputContainer.innerHTML = renderMarkdownToHtml(slice) + '<span class="caret"></span>';
      }

      if (index >= markdownText.length) {
        stopGeneration();
        if (outputContainer) {
          outputContainer.innerHTML = renderMarkdownToHtml(markdownText);
        }
        if (actionsContainer) {
          actionsContainer.style.display = "flex";
        }
        if (mailtoBtn) {
          const email = mailtoBtn.getAttribute("data-email") || "hola@*.studio";
          const subject = encodeURIComponent(`Propuesta para ${marca}`);
          const body = encodeURIComponent(
            `Hola *, esta es la propuesta que generé en tu web:\n\n${markdownText}`
          );
          mailtoBtn.setAttribute("href", `mailto:${email}?subject=${subject}&body=${body}`);
        }
      }
    }, 25);
  });
}

function buildTailoredProposal({ nombre, marca, objetivo, presupuesto, servicios }) {
  const saludo = nombre ? `Hola **${nombre}**, bienvenida` : "Bienvenida";
  const listaServicios = servicios.length
    ? servicios
    : ["Community management", "Marketing digital", "Producción audiovisual"];

  const entregables = [];
  if (listaServicios.includes("Community management")) {
    entregables.push(
      "- **Dirección y Gestión de Comunidad:** Calendario editorial mensual, dirección de tono de voz, copywriting de autor y cuidado diario de tu audiencia."
    );
  }
  if (listaServicios.includes("Marketing digital")) {
    entregables.push(
      "- **Estrategia y Posicionamiento:** Arquitectura de embudo de contenido, planificación de campaña de lanzamiento y optimización de conversión."
    );
  }
  if (listaServicios.includes("Producción audiovisual")) {
    entregables.push(
      "- **Producción Audiovisual Editorial:** Dirección de arte, rodaje de piezas verticales (Reels/TikTok) y fotografía con estética cinco estrellas."
    );
  }
  if (listaServicios.includes("Asesoría 1:1")) {
    entregables.push(
      "- **Sesión de Diagnóstico 1:1 (60-90 min):** Auditoría profunda de perfil, ordenamiento visual y hoja de ruta accionable."
    );
  }

  const textoInversion = presupuesto
    ? `Tomando como referencia tu presupuesto estimado (**${presupuesto}**), estructuraremos el alcance por fases para priorizar las acciones de mayor retorno desde el primer mes.`
    : `Para una intervención integral de este nivel, los planes mensuales suelen ubicarse entre **450 USD y 1.200 USD**, ajustando el alcance exacto durante nuestra primera llamada.`;

  return [
    "## Bienvenida",
    `${saludo} al estudio. He analizado lo que buscas para **${marca}** y diseñé esta hoja de ruta inicial para transformar tu presencia digital en una experiencia de marca memorable.`,
    "",
    "## Diagnóstico",
    `- **Objetivo principal:** ${objetivo}`,
    `- **Oportunidad de marca:** Consolidar una estética coherente y silenciosamente lujosa para que **${marca}** destaque sin ruido innecesario.`,
    `- **Enfoque clave:** Combinar narrativa visual y estrategia para atraer clientes que valoren el detalle.`,
    "",
    "## Propuesta",
    ...entregables,
    "",
    "## Cronograma",
    "- **Semana 1:** Check-in estratégico, auditoría visual y definición de pilares de comunicación.",
    "- **Semana 2:** Preproducción, guiones, dirección de arte y calendario editorial.",
    "- **Semana 3:** Producción audiovisual, edición y preparación de lanzamiento.",
    "- **Semana 4:** Publicación activa, gestión de comunidad y medición de resultados.",
    "",
    "## Inversión estimada",
    textoInversion,
    "",
    "## Siguiente paso",
    "Agendemos una reunión breve de 20 minutos para conocernos y afinar los detalles a la medida de tu proyecto.",
  ].join("\n");
}

function renderMarkdownToHtml(md) {
  const lines = md.split("\n");
  let html = "";
  let inList = false;

  const formatInline = (str) => {
    const escaped = str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  };

  lines.forEach((raw) => {
    const line = raw.trim();
    if (!line) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      return;
    }

    if (line.startsWith("#")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      const title = line.replace(/^#+\s*/, "");
      html += `<h3 class="display">${formatInline(title)}</h3>`;
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      const item = line.replace(/^[-*]\s+/, "");
      html += `<li><span class="label" style="padding-top:0.35rem">✳</span><span>${formatInline(item)}</span></li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<p>${formatInline(line)}</p>`;
    }
  });

  if (inList) html += "</ul>";
  return html;
}

