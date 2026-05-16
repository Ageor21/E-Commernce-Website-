(() => {
  "use strict";

  const STORAGE_KEYS = {
    theme: "aaronsTech.theme",
    pendingCartToast: "aaronsTech.pendingCartToast",
  };

  const SELECTORS = {
    productCard: ".product-card",
    productGrid: ".product-grid",
    flashMessage: ".flash-message",
    deleteButton: ".delete-button",
    submitButton: 'button[type="submit"], input[type="submit"]',
    searchInput: 'input[name="query"]',
  };

  const state = {
    confirmDialogOpen: false,
  };

  document.addEventListener("DOMContentLoaded", () => {
    injectDynamicStyles();
    setupThemeToggle();
    setupToastContainer();
    setupPendingCartToast();
    setupFlashMessages();
    setupFormValidation();
    setupQuantitySteppers();
    setupPasswordToggles();
    setupSearchEnhancements();
    setupProductCards();
    setupReviewEnhancements();
    setupTableSearch();
    setupImageFallbacks();
    setupRevealAnimations();
    setupBackToTop();
    setupKeyboardShortcuts();

    document.body.classList.add("js-ready");
  });

  /**
   * ---------- UI HELPERS ----------
   */

  function injectDynamicStyles() {
    const style = document.createElement("style");
    style.setAttribute("data-aarons-tech-js-styles", "true");
    style.textContent = `
      :root {
        --js-neon: #7c3aed;
        --js-neon-2: #06b6d4;
        --js-success: #22c55e;
        --js-warning: #f59e0b;
        --js-danger: #ef4444;
        --js-card-bg: rgba(15, 23, 42, 0.72);
        --js-border: rgba(148, 163, 184, 0.22);
        --js-text: #e5e7eb;
        --js-muted: #94a3b8;
      }

      html[data-theme="light"] body {
        background:
          radial-gradient(circle at top left, rgba(124, 58, 237, 0.14), transparent 32rem),
          radial-gradient(circle at top right, rgba(6, 182, 212, 0.14), transparent 30rem),
          #f8fafc !important;
        color: #0f172a !important;
      }

      html[data-theme="light"] header,
      html[data-theme="light"] .header-content {
        background: linear-gradient(135deg, #ffffff, #f1f5f9) !important;
        color: #0f172a !important;
        border-bottom: 1px solid rgba(15, 23, 42, 0.12);
      }

      html[data-theme="light"] header a {
        color: #0f172a !important;
      }

      html[data-theme="light"] .product-card,
      html[data-theme="light"] .product-detail,
      html[data-theme="light"] form,
      html[data-theme="light"] section,
      html[data-theme="light"] .order-details,
      html[data-theme="light"] .review,
      html[data-theme="light"] table {
        background: rgba(255, 255, 255, 0.82) !important;
        color: #0f172a !important;
        border-color: rgba(15, 23, 42, 0.12) !important;
      }

      .js-toast-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 9999;
        display: grid;
        gap: 0.75rem;
        width: min(24rem, calc(100vw - 2rem));
        pointer-events: none;
      }

      .js-toast {
        pointer-events: auto;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.75rem;
        padding: 0.9rem 1rem;
        border-radius: 1rem;
        color: #fff;
        background: rgba(15, 23, 42, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.16);
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.38);
        backdrop-filter: blur(18px);
        transform: translateX(110%);
        opacity: 0;
        transition: transform 220ms ease, opacity 220ms ease;
      }

      .js-toast.is-visible {
        transform: translateX(0);
        opacity: 1;
      }

      .js-toast.success { border-left: 4px solid var(--js-success); }
      .js-toast.warning { border-left: 4px solid var(--js-warning); }
      .js-toast.danger { border-left: 4px solid var(--js-danger); }
      .js-toast.info { border-left: 4px solid var(--js-neon-2); }

      .js-toast-icon {
        width: 2rem;
        height: 2rem;
        display: inline-grid;
        place-items: center;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.12);
      }

      .js-toast-close,
      .js-theme-toggle,
      .js-back-to-top,
      .js-clear-search,
      .js-password-toggle,
      .qty-btn,
      .confirm-btn {
        border: 0;
        cursor: pointer;
        font: inherit;
      }

      .js-toast-close {
        color: inherit;
        background: transparent;
        font-size: 1.15rem;
        opacity: 0.7;
      }

      .js-toast-close:hover {
        opacity: 1;
      }

      .field-error {
        display: block;
        margin-top: 0.38rem;
        color: #fca5a5;
        font-size: 0.84rem;
        line-height: 1.35;
      }

      .is-invalid {
        border-color: var(--js-danger) !important;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.16) !important;
      }

      .is-valid {
        border-color: var(--js-success) !important;
        box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12) !important;
      }

      .form-hint {
        display: block;
        margin-top: 0.35rem;
        color: var(--js-muted);
        font-size: 0.8rem;
      }

      .password-wrapper,
      .search-wrapper,
      .qty-wrapper {
        position: relative;
        display: flex;
        align-items: stretch;
        gap: 0.5rem;
        width: 100%;
      }

      .password-wrapper input,
      .search-wrapper input {
        flex: 1;
      }

      .js-password-toggle,
      .js-clear-search,
      .qty-btn {
        border-radius: 0.8rem;
        padding: 0.6rem 0.75rem;
        background: rgba(148, 163, 184, 0.14);
        color: inherit;
        border: 1px solid rgba(148, 163, 184, 0.22);
      }

      .js-password-toggle:hover,
      .js-clear-search:hover,
      .qty-btn:hover {
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.24), rgba(6, 182, 212, 0.18));
      }

      .password-strength {
        height: 0.45rem;
        border-radius: 999px;
        overflow: hidden;
        margin-top: 0.5rem;
        background: rgba(148, 163, 184, 0.22);
      }

      .password-strength span {
        display: block;
        height: 100%;
        width: 0;
        background: var(--js-danger);
        transition: width 180ms ease, background 180ms ease;
      }

      .password-strength[data-level="2"] span { background: var(--js-warning); }
      .password-strength[data-level="3"] span { background: var(--js-success); }

      .qty-wrapper {
        max-width: 13rem;
        margin: 0.25rem 0 0.75rem;
      }

      .qty-wrapper input[type="number"] {
        min-width: 4.5rem;
        text-align: center;
      }

      .product-card {
        transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        will-change: transform;
      }

      .product-card.js-card-glow {
        transform: perspective(900px) rotateX(var(--tilt-y, 0deg)) rotateY(var(--tilt-x, 0deg)) translateY(-4px);
        border-color: rgba(6, 182, 212, 0.42) !important;
        box-shadow: 0 24px 70px rgba(6, 182, 212, 0.18) !important;
      }

      .product-card.is-hidden-by-search {
        display: none !important;
      }

      .js-result-count {
        margin: 1rem 0;
        color: var(--js-muted);
        font-size: 0.95rem;
      }

      .char-counter {
        display: flex;
        justify-content: flex-end;
        margin-top: -0.5rem;
        margin-bottom: 0.8rem;
        color: var(--js-muted);
        font-size: 0.82rem;
      }

      .char-counter.warning { color: #fcd34d; }
      .char-counter.danger { color: #fca5a5; }

      .flash-message {
        position: relative;
        animation: js-slide-down 260ms ease both;
      }

      .flash-close {
        position: absolute;
        top: 0.45rem;
        right: 0.6rem;
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 1.1rem;
        opacity: 0.72;
      }

      .flash-close:hover {
        opacity: 1;
      }

      .confirm-overlay {
        position: fixed;
        inset: 0;
        z-index: 9998;
        display: grid;
        place-items: center;
        padding: 1rem;
        background: rgba(2, 6, 23, 0.72);
        backdrop-filter: blur(14px);
        animation: js-fade-in 160ms ease both;
      }

      .confirm-dialog {
        width: min(31rem, 100%);
        color: #e5e7eb;
        background:
          linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.92)),
          radial-gradient(circle at top right, rgba(124, 58, 237, 0.22), transparent 18rem);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 1.4rem;
        box-shadow: 0 32px 100px rgba(0, 0, 0, 0.55);
        padding: 1.35rem;
        animation: js-pop-in 180ms ease both;
      }

      .confirm-dialog h3 {
        margin: 0 0 0.4rem;
        font-size: 1.35rem;
      }

      .confirm-dialog p {
        margin: 0 0 1.2rem;
        color: #cbd5e1;
      }

      .confirm-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .confirm-btn {
        border-radius: 999px;
        padding: 0.72rem 1rem;
        font-weight: 800;
      }

      .confirm-btn.cancel {
        color: #e5e7eb;
        background: rgba(148, 163, 184, 0.14);
        border: 1px solid rgba(148, 163, 184, 0.22);
      }

      .confirm-btn.confirm {
        color: #fff;
        background: linear-gradient(135deg, var(--js-neon), var(--js-neon-2));
        box-shadow: 0 14px 35px rgba(6, 182, 212, 0.22);
      }

      .is-loading {
        position: relative;
        pointer-events: none;
        opacity: 0.78;
      }

      .is-loading::after {
        content: "";
        display: inline-block;
        width: 1rem;
        height: 1rem;
        margin-left: 0.5rem;
        border-radius: 999px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        vertical-align: -0.15rem;
        animation: js-spin 700ms linear infinite;
      }

      .js-theme-toggle {
        position: fixed;
        left: 1rem;
        bottom: 1rem;
        z-index: 9997;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        border-radius: 999px;
        padding: 0.72rem 0.95rem;
        color: #fff;
        background: rgba(15, 23, 42, 0.88);
        border: 1px solid rgba(255, 255, 255, 0.16);
        box-shadow: 0 18px 55px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(14px);
      }

      .js-back-to-top {
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        z-index: 9997;
        width: 3rem;
        height: 3rem;
        display: grid;
        place-items: center;
        border-radius: 999px;
        color: #fff;
        background: linear-gradient(135deg, var(--js-neon), var(--js-neon-2));
        box-shadow: 0 18px 55px rgba(6, 182, 212, 0.28);
        opacity: 0;
        transform: translateY(1rem);
        pointer-events: none;
        transition: opacity 180ms ease, transform 180ms ease;
      }

      .js-back-to-top.is-visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .js-table-search {
        width: min(28rem, 100%);
        margin: 0.5rem 0 1rem;
        padding: 0.8rem 1rem;
        border-radius: 999px;
        color: inherit;
        background: rgba(148, 163, 184, 0.10);
        border: 1px solid rgba(148, 163, 184, 0.22);
      }

      .reveal-in {
        opacity: 0;
        transform: translateY(18px);
        transition: opacity 420ms ease, transform 420ms ease;
      }

      .reveal-in.is-visible {
        opacity: 1;
        transform: translateY(0);
      }

      @keyframes js-spin {
        to { transform: rotate(360deg); }
      }

      @keyframes js-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes js-pop-in {
        from { opacity: 0; transform: translateY(10px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      @keyframes js-slide-down {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }


      .cart-product-cell {
        display: grid;
        gap: 0.22rem;
      }

      .cart-product-name {
        font-weight: 900;
        color: inherit;
      }

      .cart-product-meta {
        color: var(--js-muted);
        font-size: 0.82rem;
      }

      .cart-action-cell {
        width: 5.5rem;
        text-align: center;
      }

      .cart-remove-form {
        display: inline-flex !important;
        margin: 0 !important;
        padding: 0 !important;
        max-width: none !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      .cart-trash-button {
        position: relative;
        width: 2.75rem;
        height: 2.75rem;
        display: inline-grid;
        place-items: center;
        border: 1px solid rgba(239, 68, 68, 0.28);
        border-radius: 999px;
        color: #fecaca;
        background:
          radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.18), transparent 2rem),
          rgba(239, 68, 68, 0.12);
        cursor: pointer;
        transition:
          transform 160ms ease,
          border-color 160ms ease,
          background 160ms ease,
          box-shadow 160ms ease;
      }

      .cart-trash-button:hover {
        transform: translateY(-2px) scale(1.04);
        border-color: rgba(248, 113, 113, 0.65);
        background:
          radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.2), transparent 2rem),
          rgba(239, 68, 68, 0.22);
        box-shadow: 0 16px 38px rgba(239, 68, 68, 0.22);
      }

      .cart-trash-button:focus-visible {
        outline: 3px solid rgba(248, 113, 113, 0.38);
        outline-offset: 3px;
      }

      .trash-icon {
        width: 1.2rem;
        height: 1.2rem;
        pointer-events: none;
      }

      .confirm-dialog .danger-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        margin-bottom: 0.75rem;
        border-radius: 999px;
        padding: 0.35rem 0.65rem;
        color: #fecaca;
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.24);
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .js-toast.cart-success {
        position: fixed;
        top: 1rem;
        right: 1rem;
        border-left-color: var(--js-success);
      }


      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.001ms !important;
          transition-duration: 0.001ms !important;
          scroll-behavior: auto !important;
        }
      }

      @media (max-width: 700px) {
        .js-toast-container {
          top: auto;
          bottom: 5rem;
          right: 1rem;
          left: 1rem;
          width: auto;
        }

        .js-theme-toggle {
          bottom: 4.5rem;
        }

        .confirm-actions {
          display: grid;
        }

        .confirm-btn {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function setupToastContainer() {
    if (document.querySelector(".js-toast-container")) return;

    const container = document.createElement("div");
    container.className = "js-toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-relevant", "additions removals");
    document.body.appendChild(container);
  }

  function showToast(message, type = "info", timeout = 3600) {
    const container = document.querySelector(".js-toast-container");
    if (!container) return;

    const iconMap = {
      success: "✓",
      danger: "!",
      warning: "⚠",
      info: "i",
    };

    const toast = document.createElement("div");
    toast.className = `js-toast ${type}`;
    toast.innerHTML = `
      <span class="js-toast-icon" aria-hidden="true">${iconMap[type] || iconMap.info}</span>
      <span>${escapeHtml(message)}</span>
      <button class="js-toast-close" type="button" aria-label="Close notification">×</button>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("is-visible"));

    const close = () => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => toast.remove(), 220);
    };

    toast.querySelector(".js-toast-close").addEventListener("click", close);
    window.setTimeout(close, timeout);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function setupPendingCartToast() {
    const rawMessage = sessionStorage.getItem(STORAGE_KEYS.pendingCartToast);

    if (!rawMessage) return;

    sessionStorage.removeItem(STORAGE_KEYS.pendingCartToast);

    window.setTimeout(() => {
      showToast(rawMessage, "success", 5200);
    }, 250);
  }

  /**
   * ---------- VALIDATION ----------
   */

  function setupFormValidation() {
    const forms = document.querySelectorAll("form");

    forms.forEach((form) => {
      form.setAttribute("novalidate", "novalidate");

      const fields = getFormFields(form);

      fields.forEach((field) => {
        const eventName = field.matches("select, input[type='radio'], input[type='checkbox']")
          ? "change"
          : "input";

        field.addEventListener(eventName, () => validateField(field, form, false));
        field.addEventListener("blur", () => validateField(field, form, false));
      });

      form.addEventListener("submit", async (event) => {
        if (form.dataset.skipJsValidation === "true") return;

        const isValid = validateForm(form);

        if (!isValid) {
          event.preventDefault();
          showToast("Please fix the highlighted fields before continuing.", "danger");
          focusFirstInvalid(form);
          return;
        }

        const confirmation = getFormConfirmation(form);

        if (confirmation && form.dataset.confirmed !== "true") {
          event.preventDefault();

          const confirmed = await showConfirmDialog(confirmation);

          if (!confirmed) {
            showToast("Deletion cancelled.", "info");
            return;
          }

          if (form.classList.contains("cart-remove-form")) {
            const itemName = form.dataset.cartItemName || "Item";
            sessionStorage.setItem(
              STORAGE_KEYS.pendingCartToast,
              `${itemName} was successfully deleted from your cart.`
            );
          }

          form.dataset.confirmed = "true";
          addLoadingState(form, confirmation.loadingText);
          HTMLFormElement.prototype.submit.call(form);
          return;
        }

        addLoadingState(form);
      });
    });
  }

  function getFormFields(form) {
    return Array.from(
      form.querySelectorAll("input, textarea, select")
    ).filter((field) => {
      const type = (field.getAttribute("type") || "").toLowerCase();
      return !["hidden", "submit", "button", "reset"].includes(type);
    });
  }

  function validateForm(form) {
    let isValid = true;
    const fields = getFormFields(form);

    const radioNamesChecked = new Set();

    fields.forEach((field) => {
      if (field.type === "radio") {
        if (radioNamesChecked.has(field.name)) return;
        radioNamesChecked.add(field.name);
      }

      const fieldValid = validateField(field, form, true);
      if (!fieldValid) isValid = false;
    });

    return isValid;
  }

  function validateField(field, form, showSuccessState = false) {
    const value = (field.value || "").trim();
    const label = getFieldLabel(field, form);
    const type = (field.getAttribute("type") || "").toLowerCase();
    const name = (field.getAttribute("name") || "").toLowerCase();
    const id = (field.getAttribute("id") || "").toLowerCase();

    let error = "";

    if (field.type === "radio") {
      const radios = form.querySelectorAll(`input[type="radio"][name="${cssEscape(field.name)}"]`);
      const required = Array.from(radios).some((radio) => radio.required);

      if (required && !Array.from(radios).some((radio) => radio.checked)) {
        error = `Please select a ${label.toLowerCase()}.`;
        setFieldError(radios[0], error, form);
        return false;
      }

      clearFieldError(radios[0], form, showSuccessState);
      return true;
    }

    if (field.required && !value) {
      error = `${label} is required.`;
    }

    if (!error && type === "email" && value && !isValidEmail(value)) {
      error = "Please enter a valid email address.";
    }

    if (!error && type === "password" && value && value.length < 6) {
      error = "Password must be at least 6 characters long.";
    }

    if (!error && (name === "query" || id === "query") && value && value.length < 3) {
      error = "Search must be at least 3 characters long.";
    }

    if (!error && (name === "content" || id === "content") && value && value.length < 8) {
      error = "Review must be at least 8 characters long.";
    }

    if (!error && type === "number") {
      const numberValue = Number(value);
      const min = field.getAttribute("min");
      const max = field.getAttribute("max");

      if (Number.isNaN(numberValue)) {
        error = `${label} must be a valid number.`;
      } else if (min !== null && numberValue < Number(min)) {
        error = `${label} must be at least ${min}.`;
      } else if (max !== null && numberValue > Number(max)) {
        error = `${label} cannot be more than ${max}.`;
      } else if ((name.includes("stock") || id.includes("stock")) && !Number.isInteger(numberValue)) {
        error = "Stock must be a whole number.";
      } else if ((name.includes("price") || id.includes("price")) && numberValue <= 0) {
        error = "Price must be greater than 0.";
      }
    }

    if (error) {
      setFieldError(field, error, form);
      return false;
    }

    clearFieldError(field, form, showSuccessState);
    return true;
  }

  function setFieldError(field, message, form) {
    const errorId = getFieldErrorId(field);
    const target = getErrorPlacementTarget(field, form);

    clearFieldError(field, form, false);

    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", errorId);

    const error = document.createElement("small");
    error.className = "field-error";
    error.id = errorId;
    error.textContent = message;

    target.insertAdjacentElement("afterend", error);
  }

  function clearFieldError(field, form, showSuccessState = false) {
    const errorId = getFieldErrorId(field);
    const error = document.getElementById(errorId);

    if (error) error.remove();

    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");

    if (showSuccessState && field.value && field.type !== "radio") {
      field.classList.add("is-valid");
    } else {
      field.classList.remove("is-valid");
    }

    if (field.type === "radio" && field.name) {
      const radios = form.querySelectorAll(`input[type="radio"][name="${cssEscape(field.name)}"]`);
      radios.forEach((radio) => radio.classList.remove("is-invalid"));
    }
  }

  function getFieldErrorId(field) {
    const key = field.name || field.id || Math.random().toString(36).slice(2);
    return `error-${key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  }

  function getErrorPlacementTarget(field, form) {
    if (field.type === "radio" && field.name) {
      const radioGroup = form.querySelector(`input[type="radio"][name="${cssEscape(field.name)}"]`)?.closest(".star-rating");
      return radioGroup || field;
    }

    return field.closest(".password-wrapper, .search-wrapper, .qty-wrapper") || field;
  }

  function getFieldLabel(field, form) {
    const id = field.getAttribute("id");
    const name = field.getAttribute("name");

    if (id) {
      const label = form.querySelector(`label[for="${cssEscape(id)}"]`);
      if (label) return cleanLabel(label.textContent);
    }

    if (name) {
      const label = form.querySelector(`label[for="${cssEscape(name)}"]`);
      if (label) return cleanLabel(label.textContent);
    }

    if (field.placeholder) return cleanLabel(field.placeholder);

    return name ? toTitleCase(name.replaceAll("_", " ")) : "This field";
  }

  function cleanLabel(value) {
    return value.replace("*", "").replace(":", "").trim() || "This field";
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function focusFirstInvalid(form) {
    const invalid = form.querySelector(".is-invalid");
    if (!invalid) return;

    invalid.focus({ preventScroll: true });
    invalid.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }

    return String(value).replace(/["\\]/g, "\\$&");
  }

  function toTitleCase(value) {
    return String(value).replace(/\w\S*/g, (text) => {
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    });
  }

  function getFormConfirmation(form) {
    const action = (form.getAttribute("action") || "").toLowerCase();
    const text = form.textContent.toLowerCase();
    const submitButton = form.querySelector(SELECTORS.submitButton);
    const submitText = (submitButton?.textContent || "").trim().toLowerCase();

    if (form.classList.contains("cart-remove-form")) {
      const itemName = form.dataset.cartItemName || "this item";

      return {
        title: "Remove item from cart?",
        message: `You are about to delete ${itemName} from your cart. This cannot be undone from this screen.`,
        confirmText: "Yes, delete it",
        cancelText: "Keep item",
        loadingText: "Deleting...",
        danger: true,
      };
    }

    if (
      action.includes("delete") ||
      action.includes("remove") ||
      submitText.includes("delete") ||
      submitText.includes("remove") ||
      form.querySelector(SELECTORS.deleteButton)
    ) {
      return {
        title: "Confirm removal",
        message: "This action will remove this item. Are you sure you want to continue?",
        confirmText: "Yes, remove it",
        cancelText: "Keep it",
        loadingText: "Removing...",
        danger: true,
      };
    }

    if (
      action.includes("place_order") ||
      submitText.includes("place order") ||
      text.includes("place order")
    ) {
      return {
        title: "Place your order?",
        message: "Please confirm that you are ready to submit this order.",
        confirmText: "Place order",
        cancelText: "Review again",
        loadingText: "Placing order...",
      };
    }

    return null;
  }

  function addLoadingState(form, customText) {
    const submitButtons = form.querySelectorAll(SELECTORS.submitButton);
    const isGetSearch = (form.getAttribute("method") || "").toLowerCase() === "get";

    submitButtons.forEach((button) => {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent || button.value || "Submit";
      }

      button.disabled = true;
      button.classList.add("is-loading");

      if (button.tagName === "INPUT") {
        button.value = customText || (isGetSearch ? "Searching..." : "Processing...");
      } else {
        button.textContent = customText || (isGetSearch ? "Searching..." : "Processing...");
      }
    });
  }

  function showConfirmDialog({
    title = "Are you sure?",
    message = "Please confirm this action.",
    confirmText = "Confirm",
    cancelText = "Cancel",
  } = {}) {
    return new Promise((resolve) => {
      if (state.confirmDialogOpen) return resolve(false);

      state.confirmDialogOpen = true;

      const overlay = document.createElement("div");
      overlay.className = "confirm-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.innerHTML = `
        <div class="confirm-dialog" role="document">
          ${arguments[0]?.danger ? '<span class="danger-badge">⚠ Cart deletion</span>' : ''}
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(message)}</p>
          <div class="confirm-actions">
            <button type="button" class="confirm-btn cancel">${escapeHtml(cancelText)}</button>
            <button type="button" class="confirm-btn confirm">${escapeHtml(confirmText)}</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const cancelButton = overlay.querySelector(".confirm-btn.cancel");
      const confirmButton = overlay.querySelector(".confirm-btn.confirm");

      const cleanup = (answer) => {
        overlay.remove();
        state.confirmDialogOpen = false;
        document.removeEventListener("keydown", onKeyDown);
        resolve(answer);
      };

      const onKeyDown = (event) => {
        if (event.key === "Escape") cleanup(false);
      };

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) cleanup(false);
      });

      cancelButton.addEventListener("click", () => cleanup(false));
      confirmButton.addEventListener("click", () => cleanup(true));
      document.addEventListener("keydown", onKeyDown);

      confirmButton.focus();
    });
  }

  /**
   * ---------- CREATIVE / DYNAMIC FEATURES ----------
   */

  function setupQuantitySteppers() {
    const quantityInputs = document.querySelectorAll('input[type="number"][name="quantity"]');

    quantityInputs.forEach((input) => {
      if (input.closest(".qty-wrapper")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "qty-wrapper";

      const minus = document.createElement("button");
      minus.type = "button";
      minus.className = "qty-btn";
      minus.textContent = "−";
      minus.setAttribute("aria-label", "Decrease quantity");

      const plus = document.createElement("button");
      plus.type = "button";
      plus.className = "qty-btn";
      plus.textContent = "+";
      plus.setAttribute("aria-label", "Increase quantity");

      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(minus);
      wrapper.appendChild(input);
      wrapper.appendChild(plus);

      const step = Number(input.step || 1);
      const min = Number(input.min || 1);
      const max = input.max ? Number(input.max) : Infinity;

      const update = (direction) => {
        const current = Number(input.value || min);
        let next = current + direction * step;

        if (next < min) {
          next = min;
          showToast(`Quantity cannot be less than ${min}.`, "warning");
        }

        if (next > max) {
          next = max;
          showToast(`Only ${max} item${max === 1 ? "" : "s"} available.`, "warning");
        }

        input.value = String(next);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      };

      minus.addEventListener("click", () => update(-1));
      plus.addEventListener("click", () => update(1));
    });
  }

  function setupPasswordToggles() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    passwordInputs.forEach((input) => {
      if (input.closest(".password-wrapper")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "password-wrapper";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "js-password-toggle";
      toggle.textContent = "Show";
      toggle.setAttribute("aria-label", "Show password");

      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
      wrapper.appendChild(toggle);

      toggle.addEventListener("click", () => {
        const shouldShow = input.type === "password";
        input.type = shouldShow ? "text" : "password";
        toggle.textContent = shouldShow ? "Hide" : "Show";
        toggle.setAttribute("aria-label", shouldShow ? "Hide password" : "Show password");
      });

      const strength = document.createElement("div");
      strength.className = "password-strength";
      strength.innerHTML = "<span></span>";
      wrapper.insertAdjacentElement("afterend", strength);

      input.addEventListener("input", () => {
        const score = getPasswordScore(input.value);
        const bar = strength.querySelector("span");

        strength.dataset.level = String(score.level);
        bar.style.width = `${score.percent}%`;
      });
    });
  }

  function getPasswordScore(password) {
    let score = 0;

    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (!password) return { level: 0, percent: 0 };
    if (score <= 2) return { level: 1, percent: 35 };
    if (score <= 4) return { level: 2, percent: 68 };
    return { level: 3, percent: 100 };
  }

  function setupSearchEnhancements() {
    const searchInputs = document.querySelectorAll(SELECTORS.searchInput);

    searchInputs.forEach((input) => {
      if (!input.closest(".search-wrapper")) {
        const wrapper = document.createElement("div");
        wrapper.className = "search-wrapper";

        const clear = document.createElement("button");
        clear.type = "button";
        clear.className = "js-clear-search";
        clear.textContent = "Clear";
        clear.setAttribute("aria-label", "Clear search");

        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        wrapper.appendChild(clear);

        clear.addEventListener("click", () => {
          input.value = "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.focus();
        });
      }

      input.addEventListener("input", () => filterProducts(input.value));
    });

    const grid = document.querySelector(SELECTORS.productGrid);
    if (grid && document.querySelectorAll(SELECTORS.productCard).length) {
      const count = document.createElement("p");
      count.className = "js-result-count";
      count.setAttribute("aria-live", "polite");
      grid.insertAdjacentElement("beforebegin", count);
      updateProductCount();
    }
  }

  function filterProducts(rawQuery) {
    const query = rawQuery.trim().toLowerCase();
    const cards = document.querySelectorAll(SELECTORS.productCard);

    if (!cards.length) return;

    cards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      const matches = !query || text.includes(query);
      card.classList.toggle("is-hidden-by-search", !matches);
    });

    updateProductCount();
  }

  function updateProductCount() {
    const count = document.querySelector(".js-result-count");
    const cards = Array.from(document.querySelectorAll(SELECTORS.productCard));
    if (!count || !cards.length) return;

    const visible = cards.filter((card) => !card.classList.contains("is-hidden-by-search")).length;
    count.textContent = `${visible} product${visible === 1 ? "" : "s"} showing`;
  }

  function setupProductCards() {
    const cards = document.querySelectorAll(SELECTORS.productCard);

    cards.forEach((card) => {
      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const tiltX = ((x / rect.width) - 0.5) * 5;
        const tiltY = ((y / rect.height) - 0.5) * -5;

        card.style.setProperty("--tilt-x", `${tiltX}deg`);
        card.style.setProperty("--tilt-y", `${tiltY}deg`);
        card.classList.add("js-card-glow");
      });

      card.addEventListener("mouseleave", () => {
        card.style.removeProperty("--tilt-x");
        card.style.removeProperty("--tilt-y");
        card.classList.remove("js-card-glow");
      });
    });
  }

  function setupReviewEnhancements() {
    const reviewTextareas = document.querySelectorAll('textarea[name="content"], textarea#content');

    reviewTextareas.forEach((textarea) => {
      if (textarea.dataset.counterAttached === "true") return;

      const counter = document.createElement("div");
      counter.className = "char-counter";
      textarea.insertAdjacentElement("afterend", counter);
      textarea.dataset.counterAttached = "true";

      const update = () => {
        const length = textarea.value.trim().length;
        counter.textContent = `${length} characters`;

        counter.classList.toggle("warning", length > 0 && length < 8);
        counter.classList.toggle("danger", length > 0 && length < 4);
      };

      textarea.addEventListener("input", update);
      update();
    });

    const starRatings = document.querySelectorAll(".star-rating");

    starRatings.forEach((rating) => {
      if (rating.dataset.enhanced === "true") return;
      rating.dataset.enhanced = "true";

      const hint = document.createElement("span");
      hint.className = "form-hint";
      hint.textContent = "Choose your rating";
      rating.insertAdjacentElement("afterend", hint);

      rating.querySelectorAll("input[type='radio']").forEach((radio) => {
        radio.addEventListener("change", () => {
          hint.textContent = `${radio.value} out of 5 stars selected`;
          showToast(`Rating selected: ${radio.value}/5`, "success", 1800);
        });
      });
    });
  }

  function setupFlashMessages() {
    const flashes = document.querySelectorAll(SELECTORS.flashMessage);

    flashes.forEach((flash) => {
      if (!flash.querySelector(".flash-close")) {
        const close = document.createElement("button");
        close.type = "button";
        close.className = "flash-close";
        close.innerHTML = "×";
        close.setAttribute("aria-label", "Dismiss message");
        flash.appendChild(close);

        close.addEventListener("click", () => dismissElement(flash));
      }

      const type = getFlashType(flash);
      const text = flash.textContent.replace("×", "").trim();

      if (text) {
        showToast(text, type, 4200);
      }

      window.setTimeout(() => dismissElement(flash), 6500);
    });
  }

  function getFlashType(flash) {
    if (flash.classList.contains("success")) return "success";
    if (flash.classList.contains("danger")) return "danger";
    if (flash.classList.contains("warning")) return "warning";
    return "info";
  }

  function dismissElement(element) {
    element.style.transition = "opacity 180ms ease, transform 180ms ease";
    element.style.opacity = "0";
    element.style.transform = "translateY(-8px)";
    window.setTimeout(() => element.remove(), 190);
  }

  function setupTableSearch() {
    const tables = document.querySelectorAll("table");

    tables.forEach((table, index) => {
      if (table.dataset.searchAttached === "true") return;

      const rows = Array.from(table.querySelectorAll("tbody tr"));
      if (rows.length < 4) return;

      const input = document.createElement("input");
      input.type = "search";
      input.className = "js-table-search";
      input.placeholder = "Filter this table...";
      input.setAttribute("aria-label", "Filter table");
      input.dataset.tableIndex = String(index);

      table.insertAdjacentElement("beforebegin", input);
      table.dataset.searchAttached = "true";

      input.addEventListener("input", () => {
        const query = input.value.trim().toLowerCase();

        rows.forEach((row) => {
          row.hidden = query && !row.textContent.toLowerCase().includes(query);
        });
      });
    });
  }

  function setupImageFallbacks() {
    const images = document.querySelectorAll("img");

    images.forEach((img) => {
      const applyFallback = () => {
        img.src = createPlaceholderImage(img.alt || "Product image");
        img.classList.add("image-fallback");
      };

      if (!img.getAttribute("src")) {
        applyFallback();
      }

      img.addEventListener("error", applyFallback, { once: true });
    });
  }

  function createPlaceholderImage(label) {
    const safeLabel = escapeHtml(label).slice(0, 32);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="900" height="650" viewBox="0 0 900 650">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#7c3aed"/>
            <stop offset="100%" stop-color="#06b6d4"/>
          </linearGradient>
          <filter id="blur">
            <feGaussianBlur stdDeviation="45"/>
          </filter>
        </defs>
        <rect width="900" height="650" fill="#0f172a"/>
        <circle cx="210" cy="150" r="150" fill="#7c3aed" opacity="0.35" filter="url(#blur)"/>
        <circle cx="680" cy="490" r="190" fill="#06b6d4" opacity="0.28" filter="url(#blur)"/>
        <rect x="120" y="110" width="660" height="430" rx="42" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.22)" />
        <text x="450" y="310" text-anchor="middle" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="42" font-weight="700">Aaron's Tech</text>
        <text x="450" y="365" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="24">${safeLabel}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function setupRevealAnimations() {
    const elements = document.querySelectorAll(
      ".product-card, .product-detail, .reviews, section, table, form, .order-details, .next-steps"
    );

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    elements.forEach((element) => {
      element.classList.add("reveal-in");
      observer.observe(element);
    });
  }

  function setupBackToTop() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "js-back-to-top";
    button.innerHTML = "↑";
    button.setAttribute("aria-label", "Back to top");
    document.body.appendChild(button);

    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", () => {
      button.classList.toggle("is-visible", window.scrollY > 420);
    }, { passive: true });
  }

  function setupThemeToggle() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const initialTheme = savedTheme || (prefersLight ? "light" : "dark");

    document.documentElement.dataset.theme = initialTheme;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "js-theme-toggle";
    button.setAttribute("aria-label", "Toggle color theme");

    const render = () => {
      const current = document.documentElement.dataset.theme || "dark";
      button.textContent = current === "dark" ? "☀ Light" : "🌙 Dark";
    };

    render();

    button.addEventListener("click", () => {
      const current = document.documentElement.dataset.theme || "dark";
      const next = current === "dark" ? "light" : "dark";

      document.documentElement.dataset.theme = next;
      localStorage.setItem(STORAGE_KEYS.theme, next);
      render();

      showToast(`${toTitleCase(next)} mode enabled.`, "success", 1800);
    });

    document.body.appendChild(button);
  }

  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (event) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = ["input", "textarea", "select"].includes(activeTag);

      if (event.key === "/" && !isTyping) {
        const search = document.querySelector(SELECTORS.searchInput);
        if (!search) return;

        event.preventDefault();
        search.focus();
        showToast("Search focused. Start typing to filter products.", "info", 1800);
      }
    });
  }
  // Star Rating
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".star-rating").forEach((group) => {
    const labels = Array.from(group.querySelectorAll('label[for^="star-"]'));
    const inputs = Array.from(group.querySelectorAll('input[type="radio"][name="rating"]'));

    if (!labels.length || !inputs.length) return;

    labels.forEach((label) => {
      const input = document.getElementById(label.getAttribute("for"));
      if (!input) return;

      label.dataset.ratingValue = input.value;

      label.addEventListener("mouseenter", () => {
        paintStars(group, Number(input.value), "is-preview");
      });

      label.addEventListener("click", () => {
        input.checked = true;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        paintStars(group, Number(input.value), "is-active");
      });
    });

    group.addEventListener("mouseleave", () => {
      clearStarClass(group, "is-preview");
      const checked = group.querySelector('input[type="radio"][name="rating"]:checked');
      paintStars(group, checked ? Number(checked.value) : 0, "is-active");
    });

    inputs.forEach((input) => {
      input.addEventListener("change", () => {
        paintStars(group, Number(input.value), "is-active");
      });
    });
  });
});

function paintStars(group, selectedValue, className) {
  if (className === "is-active") {
    clearStarClass(group, "is-active");
  }

  if (className === "is-preview") {
    clearStarClass(group, "is-preview");
  }

  group.querySelectorAll('label[for^="star-"]').forEach((label) => {
    const value = Number(label.dataset.ratingValue || 0);

    if (value <= selectedValue) {
      label.classList.add(className);
    }
  });
}

function clearStarClass(group, className) {
  group.querySelectorAll(`.${className}`).forEach((label) => {
    label.classList.remove(className);
  });
}

//profile logic
(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    setupProfileCompletion();
    setupPasswordMatch();
    setupProfileReset();
    setupCopyEmail();
    setupOrderFilter();
  });

  function setupProfileCompletion() {
    const card = document.querySelector("[data-profile-completion-card]");
    if (!card) return;

    const name = document.querySelector("#name")?.value.trim();
    const email = document.querySelector("#email")?.value.trim();
    const orderCards = document.querySelectorAll("[data-order-card]");
    const scoreEl = document.querySelector("[data-profile-score]");
    const progressEl = document.querySelector("[data-profile-progress]");
    const tipEl = document.querySelector("[data-profile-tip]");

    let score = 25;

    if (name) score += 25;
    if (email && email.includes("@")) score += 25;
    if (orderCards.length > 0) score += 25;

    score = Math.min(score, 100);

    if (scoreEl) scoreEl.textContent = `${score}%`;
    if (progressEl) progressEl.style.width = `${score}%`;

    if (tipEl) {
      if (score === 100) {
        tipEl.textContent = "Your profile is looking sharp.";
      } else if (orderCards.length === 0) {
        tipEl.textContent = "Place your first order to complete your account story.";
      } else {
        tipEl.textContent = "Keep your details updated for a stronger profile.";
      }
    }
  }

  function setupPasswordMatch() {
    const password = document.querySelector("#password");
    const confirmPassword = document.querySelector("#confirm_password");

    if (!password || !confirmPassword) return;

    const hint = document.createElement("small");
    hint.className = "profile-match-hint";
    confirmPassword.insertAdjacentElement("afterend", hint);

    const update = () => {
      const first = password.value;
      const second = confirmPassword.value;

      hint.classList.remove("good", "bad");

      if (!first && !second) {
        hint.textContent = "Leave password fields blank unless you want to change it.";
        return;
      }

      if (first.length > 0 && first.length < 6) {
        hint.textContent = "New password must be at least 6 characters.";
        hint.classList.add("bad");
        return;
      }

      if (first && !second) {
        hint.textContent = "Confirm your new password.";
        hint.classList.add("bad");
        return;
      }

      if (first !== second) {
        hint.textContent = "Passwords do not match yet.";
        hint.classList.add("bad");
        return;
      }

      hint.textContent = "Passwords match.";
      hint.classList.add("good");
    };

    password.addEventListener("input", update);
    confirmPassword.addEventListener("input", update);
  }

  function setupProfileReset() {
    const form = document.querySelector("[data-profile-form]");
    const resetButton = document.querySelector("[data-reset-profile-form]");

    if (!form || !resetButton) return;

    const original = new FormData(form);

    resetButton.addEventListener("click", () => {
      for (const [name, value] of original.entries()) {
        const field = form.querySelector(`[name="${CSS.escape(name)}"]`);
        if (field) field.value = value;
      }

      form.querySelectorAll("#current_password, #password, #confirm_password").forEach((field) => {
        field.value = "";
        field.dispatchEvent(new Event("input", { bubbles: true }));
      });

      showMiniNotice("Profile form reset.", "info");
    });
  }

  function setupCopyEmail() {
    document.querySelectorAll("[data-copy-email]").forEach((button) => {
      button.addEventListener("click", async () => {
        const email = button.dataset.copyEmail;

        try {
          await navigator.clipboard.writeText(email);
          showMiniNotice("Email copied to clipboard.", "success");
        } catch {
          showMiniNotice("Could not copy email from this browser.", "warning");
        }
      });
    });
  }

  function setupOrderFilter() {
    const search = document.querySelector("[data-order-search]");
    const cards = Array.from(document.querySelectorAll("[data-order-card]"));

    if (!search || !cards.length) return;

    search.addEventListener("input", () => {
      const query = search.value.trim().toLowerCase();

      cards.forEach((card) => {
        card.classList.toggle("is-hidden", query && !card.textContent.toLowerCase().includes(query));
      });
    });
  }

  function showMiniNotice(message, type = "info") {
    if (typeof window.showToast === "function") {
      window.showToast(message, type);
      return;
    }

    const notice = document.createElement("div");
    notice.textContent = message;
    notice.style.position = "fixed";
    notice.style.right = "1rem";
    notice.style.bottom = "1rem";
    notice.style.zIndex = "9999";
    notice.style.padding = "0.85rem 1rem";
    notice.style.borderRadius = "999px";
    notice.style.color = "#fff";
    notice.style.background = type === "success"
      ? "linear-gradient(135deg, #22c55e, #06b6d4)"
      : "linear-gradient(135deg, #7c3aed, #06b6d4)";
    notice.style.boxShadow = "0 18px 50px rgba(0,0,0,.35)";
    document.body.appendChild(notice);

    window.setTimeout(() => notice.remove(), 2400);
  }
})();

// Cursor logic
(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

  if (prefersReducedMotion || isTouchDevice || window.innerWidth <= 768) return;

  const colors = ["#7c3aed", "#06b6d4", "#facc15"];
  const interactiveSelector = "a, button, input, textarea, select, .product-card, .profile-tool-card, .cart-trash-button, .button";

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let dotX = mouseX;
  let dotY = mouseY;
  let glowX = mouseX;
  let glowY = mouseY;
  let lastParticleTime = 0;
  let isVisible = false;

  document.addEventListener("DOMContentLoaded", () => {
    const dot = document.createElement("div");
    const glow = document.createElement("div");

    dot.className = "cursor-trail-dot";
    glow.className = "cursor-trail-glow";

    document.body.appendChild(glow);
    document.body.appendChild(dot);
    document.body.classList.add("cursor-trail-active");

    document.addEventListener("mousemove", (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;

      if (!isVisible) {
        isVisible = true;
        dot.style.opacity = "1";
        glow.style.opacity = "1";
      }

      const now = performance.now();

      if (now - lastParticleTime > 28) {
        createParticle(mouseX, mouseY);
        lastParticleTime = now;
      }
    }, { passive: true });

    document.addEventListener("mouseleave", () => {
      isVisible = false;
      dot.style.opacity = "0";
      glow.style.opacity = "0";
    });

    document.addEventListener("mouseenter", () => {
      isVisible = true;
      dot.style.opacity = "1";
      glow.style.opacity = "1";
    });

    document.addEventListener("mouseover", (event) => {
      if (event.target.closest(interactiveSelector)) {
        document.body.classList.add("cursor-trail-hovering");
      }
    });

    document.addEventListener("mouseout", (event) => {
      if (event.target.closest(interactiveSelector)) {
        document.body.classList.remove("cursor-trail-hovering");
      }
    });

    document.addEventListener("click", (event) => {
      createClickBurst(event.clientX, event.clientY);
    });

    function animate() {
      dotX += (mouseX - dotX) * 0.42;
      dotY += (mouseY - dotY) * 0.42;

      glowX += (mouseX - glowX) * 0.16;
      glowY += (mouseY - glowY) * 0.16;

      dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
      glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;

      requestAnimationFrame(animate);
    }

    animate();
  });

  function createParticle(x, y) {
    const particle = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = 18 + Math.random() * 30;
    const size = 4 + Math.random() * 6;
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.className = "cursor-trail-particle";
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.setProperty("--particle-x", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--particle-y", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--particle-size", `${size}px`);
    particle.style.setProperty("--particle-color", color);

    document.body.appendChild(particle);
    window.setTimeout(() => particle.remove(), 720);
  }

  function createClickBurst(x, y) {
    const burst = document.createElement("span");
    burst.className = "cursor-trail-click-burst";
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;

    document.body.appendChild(burst);
    window.setTimeout(() => burst.remove(), 560);
  }
})();

})();


/* =========================================================
   Timed Order Tracker Polling
   Works with the backend route:
   /order/<order_id>/status

   What this does:
   - Finds order cards with data-order-id
   - Checks the backend every 15 seconds
   - Updates the status pill text/color
   - Updates profile mini tracker progress bars
   - Updates order confirmation full tracker
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setupTimedOrderTrackerPolling();
});

function setupTimedOrderTrackerPolling() {
  const orderCards = Array.from(
    document.querySelectorAll("[data-order-card][data-order-id]")
  );

  if (!orderCards.length) return;

  const orderIds = [
    ...new Set(
      orderCards
        .map((card) => card.dataset.orderId)
        .filter(Boolean)
    ),
  ];

  orderIds.forEach((orderId) => {
    updateOrderTracker(orderId, { showNotice: false });
  });

  window.setInterval(() => {
    orderIds.forEach((orderId) => {
      updateOrderTracker(orderId, { showNotice: true });
    });
  }, 15000);
}

async function updateOrderTracker(orderId, options = {}) {
  try {
    const response = await fetch(`/order/${orderId}/status`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) return;

    const data = await response.json();

    const previousStatus = getCurrentOrderStatus(orderId);

    updateOrderStatusText(orderId, data.status, data.status_slug);
    updateMiniOrderTracker(orderId, data.status, data.progress, data.is_cancelled);
    updateFullOrderTracker(orderId, data.status, data.progress, data.is_cancelled);

    if (
      options.showNotice &&
      previousStatus &&
      data.status &&
      previousStatus.toLowerCase() !== data.status.toLowerCase()
    ) {
      showOrderTrackerNotice(`Order #${orderId} updated to ${data.status}.`);
    }
  } catch (error) {
    console.warn("Order tracker update failed:", error);
  }
}

function getCurrentOrderStatus(orderId) {
  const statusElement = document.querySelector(
    `[data-order-card][data-order-id="${orderId}"] [data-order-status]`
  );

  return statusElement ? statusElement.textContent.trim() : "";
}

function updateOrderStatusText(orderId, status, statusSlug) {
  const safeStatus = status || "Pending";
  const safeSlug = statusSlug || safeStatus.toLowerCase().replace(/\s+/g, "-");

  document
    .querySelectorAll(`[data-order-card][data-order-id="${orderId}"] [data-order-status]`)
    .forEach((element) => {
      element.textContent = safeStatus;

      Array.from(element.classList).forEach((className) => {
        if (className.startsWith("status-")) {
          element.classList.remove(className);
        }
      });

      element.classList.add(`status-${safeSlug}`);
    });

  document
    .querySelectorAll(`[data-order-tracker][data-order-id="${orderId}"]`)
    .forEach((tracker) => {
      Array.from(tracker.classList).forEach((className) => {
        if (className.startsWith("status-")) {
          tracker.classList.remove(className);
        }
      });

      tracker.classList.add(`status-${safeSlug}`);
    });
}

function updateMiniOrderTracker(orderId, status, progress, isCancelled) {
  const trackers = document.querySelectorAll(
    `.mini-order-tracker[data-order-id="${orderId}"]`
  );

  trackers.forEach((tracker) => {
    if (isCancelled) {
      tracker.classList.add("mini-order-tracker-cancelled");

      if (!tracker.querySelector(".mini-tracker-cancelled-message")) {
        tracker.innerHTML = `
          <div class="mini-tracker-cancelled-message">
            This order has been cancelled.
          </div>
        `;
      }

      return;
    }

    const bar = tracker.querySelector("[data-order-progress-bar]");

    if (bar) {
      bar.style.width = `${Number(progress) || 0}%`;
    }

    updateTrackerSteps(tracker, status);
  });
}

function updateFullOrderTracker(orderId, status, progress, isCancelled) {
  const trackers = document.querySelectorAll(
    `.order-progress-card[data-order-id="${orderId}"]`
  );

  trackers.forEach((tracker) => {
    const progressValue = Number(progress) || 0;

    tracker.style.setProperty("--progress", `${progressValue}%`);

    const track = tracker.querySelector(".order-progress-track");

    if (track) {
      track.style.setProperty("--progress", `${progressValue}%`);
    }

    if (isCancelled) {
      tracker.classList.add("status-cancelled");
      return;
    }

    updateTrackerSteps(tracker, status);
  });
}

function updateTrackerSteps(tracker, rawStatus) {
  const status = String(rawStatus || "Pending").toLowerCase();
  const normalizedStatus = status === "confirmed" ? "processing" : status;

  const activeStepsByStatus = {
    pending: ["pending"],
    processing: ["pending", "processing"],
    shipped: ["pending", "processing", "shipped"],
    completed: ["pending", "processing", "shipped", "completed"],
  };

  const activeSteps = activeStepsByStatus[normalizedStatus] || ["pending"];

  tracker.querySelectorAll("[data-step]").forEach((step) => {
    const stepName = step.dataset.step;
    const isActive = activeSteps.includes(stepName);
    const isCurrent = stepName === normalizedStatus;
    const isComplete = isActive && !isCurrent;

    step.classList.toggle("active", isActive);
    step.classList.toggle("is-active", isActive);
    step.classList.toggle("current", isCurrent);
    step.classList.toggle("is-current", isCurrent);
    step.classList.toggle("is-complete", isComplete);
  });
}

function showOrderTrackerNotice(message) {
  const notice = document.createElement("div");

  notice.textContent = message;
  notice.style.position = "fixed";
  notice.style.right = "1rem";
  notice.style.bottom = "5.25rem";
  notice.style.zIndex = "9999";
  notice.style.maxWidth = "min(24rem, calc(100vw - 2rem))";
  notice.style.padding = "0.85rem 1rem";
  notice.style.borderRadius = "999px";
  notice.style.color = "#07101d";
  notice.style.fontWeight = "900";
  notice.style.background = "linear-gradient(135deg, #00e5ff, #ffcf5a)";
  notice.style.boxShadow = "0 18px 50px rgba(0, 0, 0, 0.35)";
  notice.style.transform = "translateY(12px)";
  notice.style.opacity = "0";
  notice.style.transition = "opacity 180ms ease, transform 180ms ease";

  document.body.appendChild(notice);

  requestAnimationFrame(() => {
    notice.style.opacity = "1";
    notice.style.transform = "translateY(0)";
  });

  window.setTimeout(() => {
    notice.style.opacity = "0";
    notice.style.transform = "translateY(12px)";
    window.setTimeout(() => notice.remove(), 220);
  }, 3200);
}

// Set initial order tracker progress without inline Jinja CSS
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".mini-tracker-bar[data-initial-progress]").forEach((tracker) => {
    const progress = Number(tracker.dataset.initialProgress) || 0;
    const bar = tracker.querySelector("[data-order-progress-bar]");

    if (bar) {
      bar.style.width = `${progress}%`;
    }
  });
});