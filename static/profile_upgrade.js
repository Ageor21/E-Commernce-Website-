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
    hint.textContent = "Leave password fields blank unless you want to change it.";
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
