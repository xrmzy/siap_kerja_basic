"use strict";

const SiapKerja = {
  selectors: {
    revealItems: ".reveal",
    navLinks: '.navbar .nav-link[href^="#"]',
    sections: "main section[id]",
    hotspots: ".hotspot",
    salaryForm: "#salaryForm",
    salaryResult: "#salaryResult",
    quizForm: "#quizForm",
    quizResult: "#quizResult",
    feedbackForm: "#feedbackForm",
    feedbackMessage: "#feedbackMsg",
    infoModal: "#infoModal",
    infoTitle: "#infoTitle",
    infoCopy: "#infoCopy",
  },

  init() {
    this.initRevealAnimation();
    this.initActiveNavigation();
    this.initContractModal();
    this.initSalarySimulator();
    this.initQuiz();
    this.initFeedbackForm();
  },

  initRevealAnimation() {
    const elements = document.querySelectorAll(this.selectors.revealItems);

    if (!elements.length) return;

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("visible");
          currentObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    elements.forEach((element) => observer.observe(element));
  },

  initActiveNavigation() {
    const navLinks = [...document.querySelectorAll(this.selectors.navLinks)];
    const sections = [...document.querySelectorAll(this.selectors.sections)];

    if (!navLinks.length || !sections.length || !("IntersectionObserver" in window)) {
      return;
    }

    const linkById = new Map(
      navLinks.map((link) => [link.getAttribute("href").slice(1), link]),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          navLinks.forEach((link) => link.classList.remove("active"));
          const activeLink = linkById.get(entry.target.id);

          if (activeLink) {
            activeLink.classList.add("active");
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: "-25% 0px -55% 0px",
      },
    );

    sections.forEach((section) => observer.observe(section));
  },

  initContractModal() {
    const modalElement = document.querySelector(this.selectors.infoModal);
    const titleElement = document.querySelector(this.selectors.infoTitle);
    const copyElement = document.querySelector(this.selectors.infoCopy);
    const buttons = document.querySelectorAll(this.selectors.hotspots);

    if (!modalElement || !titleElement || !copyElement || !buttons.length) return;
    if (typeof window.bootstrap === "undefined") return;

    const modal = new window.bootstrap.Modal(modalElement);

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        titleElement.textContent = button.dataset.title || "Informasi kontrak";
        copyElement.textContent = button.dataset.copy || "";
        modal.show();
      });
    });
  },

  initSalarySimulator() {
    const form = document.querySelector(this.selectors.salaryForm);
    const result = document.querySelector(this.selectors.salaryResult);

    if (!form || !result) return;

    const rupiah = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    });

    const readMoney = (id) => {
      const input = document.getElementById(id);
      return Math.max(0, Number(input?.value) || 0);
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const gross = readMoney("gross");
      const allowance = readMoney("allowance");
      const deduction = readMoney("deduction");
      const takeHomePay = gross + allowance - deduction;

      result.replaceChildren();

      const label = document.createElement("small");
      label.className = "text-soft";
      label.textContent = "SIMULASI TAKE-HOME";

      const amount = document.createElement("h3");
      amount.className = "mt-1";
      amount.textContent = rupiah.format(takeHomePay);

      const formula = document.createElement("p");
      formula.className = "mb-0 text-soft";
      formula.textContent = `${rupiah.format(gross)} + ${rupiah.format(allowance)} - ${rupiah.format(deduction)}`;

      result.append(label, amount, formula);
    });
  },

  initQuiz() {
    const form = document.querySelector(this.selectors.quizForm);
    const result = document.querySelector(this.selectors.quizResult);

    if (!form || !result) return;

    const answerKeys = ["q1", "q2", "q3"];

    const showPreviousScore = () => {
      const savedScore = Number(localStorage.getItem("siapKerjaScore"));

      if (!Number.isInteger(savedScore) || savedScore < 0 || savedScore > 3) return;

      result.innerHTML = `
        <p class="micro mb-0">
          Nilai terakhir tersimpan: <strong>${savedScore}/3</strong>. Kerjakan lagi untuk memperbarui nilai.
        </p>
      `;
    };

    showPreviousScore();

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const answers = answerKeys.map((name) =>
        form.querySelector(`input[name="${name}"]:checked`),
      );

      const unanswered = answers.filter((answer) => !answer).length;

      if (unanswered > 0) {
        result.innerHTML = `
          <div class="quiz-warning" role="alert">
            Jawab semua pertanyaan terlebih dahulu. Masih ada ${unanswered} soal yang belum dijawab.
          </div>
        `;
        return;
      }

      const score = answers.reduce(
        (total, answer) => total + Number(answer.value),
        0,
      );
      const percentage = Math.round((score / answerKeys.length) * 100);

      let label = "Keep Learning 📚";
      let message = "Ulangi materi kontrak, komunikasi, dan keamanan data sebelum mencoba lagi.";

      if (percentage === 100) {
        label = "Ready Rookie 🚀";
        message = "Mantap. Kamu sudah memahami poin dasar sebelum memasuki hari pertama kerja.";
      } else if (percentage >= 67) {
        label = "Almost Ready 💼";
        message = "Dasarnya sudah bagus. Tinggal perkuat bagian yang masih terlewat.";
      }

      result.innerHTML = `
        <div class="score-box">
          <small>YOUR SCORE</small>
          <h3 class="display-6">${score}/${answerKeys.length} — ${percentage}%</h3>
          <p class="fw-bold mb-1">${label}</p>
          <p class="mb-0 text-soft">${message}</p>
        </div>
      `;

      localStorage.setItem("siapKerjaScore", String(score));
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  },

  initFeedbackForm() {
    const form = document.querySelector(this.selectors.feedbackForm);
    const message = document.querySelector(this.selectors.feedbackMessage);

    if (!form || !message) return;

    let clearTimer;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      window.clearTimeout(clearTimer);
      message.className = "ms-3 feedback-success";
      message.textContent = "✓ Terima kasih!";
      form.reset();

      clearTimer = window.setTimeout(() => {
        message.textContent = "";
      }, 3500);
    });
  },
};

document.addEventListener("DOMContentLoaded", () => {
  SiapKerja.init();
});
