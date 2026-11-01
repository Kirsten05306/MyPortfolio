/* =========================
   MOBILE NAVIGATION
========================= */

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("show");

        const isOpen = navLinks.classList.contains("show");

        menuToggle.setAttribute("aria-expanded", isOpen);
        menuToggle.textContent = isOpen ? "✕" : "☰";
    });

    // Close the menu after clicking a navigation link
    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("show");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.textContent = "☰";
        });
    });
}

/* =========================
   PROJECT SEARCH AND FILTER
========================= */

const projectSearch = document.querySelector("#project-search");
const filterSelects = {
    category: document.querySelector("#project-category"),
    year: document.querySelector("#project-year"),
    tech: document.querySelector("#project-tech"),
    type: document.querySelector("#project-type"),
};
const projectRows = document.querySelectorAll(".proj-row");
const noResults = document.querySelector("#no-results");

function filterProjects() {
    const term = projectSearch ? projectSearch.value.toLowerCase().trim() : "";
    let visible = 0;

    projectRows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        let ok = text.includes(term);

        Object.entries(filterSelects).forEach(([key, select]) => {
            if (!select || select.value === "all") return;
            const value = select.value.toLowerCase();
            const haystack = (row.dataset[key] || "").toLowerCase();
            if (!haystack.includes(value)) ok = false;
        });

        row.style.display = ok ? "" : "none";
        if (ok) visible++;
    });

    if (noResults) noResults.hidden = visible !== 0;
}

if (projectSearch) projectSearch.addEventListener("input", filterProjects);
Object.values(filterSelects).forEach((s) => s && s.addEventListener("change", filterProjects));

/* =========================
   CONTACT FORM
   Sends the message to Kirsten's email through FormSubmit.
   The first message ever sent triggers an activation email
   to the inbox below: click the link in it once to activate.
   If sending fails, it falls back to the visitor's email app.
========================= */

const CONTACT_EMAIL = "kirstenelsenique06@gmail.com";
const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");

function showStatus(message, ok) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = "form-status " + (ok ? "ok" : "error");
}

if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const data = new FormData(contactForm);
        const name = (data.get("name") || "").trim();
        const email = (data.get("email") || "").trim();
        const subject = (data.get("subject") || "").trim();
        const message = (data.get("message") || "").trim();

        if (!name || !email || !subject || !message) {
            showStatus("Please complete all required fields.", false);
            return;
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            showStatus("Please enter a valid email address.", false);
            return;
        }
        if (data.get("_honey")) return; // spam trap

        const button = contactForm.querySelector("button[type=submit]");
        button.disabled = true;
        showStatus("Sending...", true);

        try {
            const response = await fetch(
                "https://formsubmit.co/ajax/" + CONTACT_EMAIL,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({
                        name, email, message,
                        _subject: "Portfolio message: " + subject,
                        _replyto: email,
                        _template: "table",
                        _captcha: "false",
                    }),
                }
            );
            const result = await response.json();
            if (!response.ok || String(result.success) === "false") throw new Error("send failed");

            showStatus("Thank you! Your message has been sent.", true);
            contactForm.reset();
        } catch (error) {
            showStatus("Couldn't send automatically. Opening your email app instead...", false);
            const body = encodeURIComponent(message + "\n\n- " + name + " (" + email + ")");
            window.location.href =
                "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + body;
        } finally {
            button.disabled = false;
        }
    });
}


/* =========================
   IMAGE VIEWER (LIGHTBOX)
   Click any project image to view it full size.
========================= */

(function () {
    const zoomables = Array.from(document.querySelectorAll("img.zoom"));
    if (!zoomables.length) return;

    const overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Image viewer");
    overlay.innerHTML =
        '<button class="lb-close" type="button" aria-label="Close">&times;</button>' +
        '<button class="lb-nav lb-prev" type="button" aria-label="Previous image">&#10094;</button>' +
        '<figure><img alt=""><figcaption></figcaption></figure>' +
        '<button class="lb-nav lb-next" type="button" aria-label="Next image">&#10095;</button>';
    document.body.appendChild(overlay);

    const lbImg = overlay.querySelector("img");
    const lbCap = overlay.querySelector("figcaption");
    const prev = overlay.querySelector(".lb-prev");
    const next = overlay.querySelector(".lb-next");
    let index = 0;

    function show(i) {
        index = (i + zoomables.length) % zoomables.length;
        const el = zoomables[index];
        lbImg.src = el.currentSrc || el.src;
        lbImg.alt = el.alt;
        const caption = el.closest("figure")?.querySelector("figcaption");
        lbCap.textContent = caption ? caption.textContent : el.alt;
        const single = zoomables.length < 2;
        prev.hidden = next.hidden = single;
    }

    function open(i) {
        show(i);
        overlay.hidden = false;
        document.body.classList.add("lb-open");
        overlay.querySelector(".lb-close").focus();
    }

    function close() {
        overlay.hidden = true;
        document.body.classList.remove("lb-open");
    }

    zoomables.forEach((el, i) => {
        el.tabIndex = 0;
        el.setAttribute("role", "button");
        el.addEventListener("click", () => open(i));
        el.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); }
        });
    });

    prev.addEventListener("click", (e) => { e.stopPropagation(); show(index - 1); });
    next.addEventListener("click", (e) => { e.stopPropagation(); show(index + 1); });
    overlay.querySelector(".lb-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay || e.target.tagName === "FIGURE") close(); });
    document.addEventListener("keydown", (e) => {
        if (overlay.hidden) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") show(index - 1);
        if (e.key === "ArrowRight") show(index + 1);
    });
})();


/* =========================
   DARK MODE TOGGLE
   Remembers the choice; otherwise follows the device setting.
========================= */

(function () {
    const toggle = document.querySelector(".theme-toggle");
    if (!toggle) return;
    const root = document.documentElement;

    function isDark() {
        return root.getAttribute("data-theme") === "dark";
    }
    function sync() {
        toggle.setAttribute("aria-pressed", isDark());
        toggle.setAttribute("aria-label", isDark() ? "Switch to light mode" : "Switch to dark mode");
    }
    sync();

    toggle.addEventListener("click", () => {
        const next = isDark() ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("theme", next); } catch (e) {}
        sync();
    });
})();
