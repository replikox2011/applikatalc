/* ============================================================
   Applikata Landing — main.js
   Orchestrates i18n, dynamic rendering, animations & the form.
   ============================================================ */

import { translations, content } from './i18n.js?v=2';
import { saveApplication } from './firebase-config.js';

const SUPPORTED = ['uz', 'ru', 'en'];
let lang = localStorage.getItem('applikata_lang') || 'uz';
if (!SUPPORTED.includes(lang)) lang = 'uz';

/* ---------- i18n ---------- */
function t(key) {
  return (translations[lang] && translations[lang][key]) || translations.uz[key] || key;
}

function applyTranslations() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const raw = t(el.getAttribute('data-i18n'));
    // @@...@@ marks a gradient-highlighted span
    if (raw.includes('@@')) {
      el.innerHTML = raw.replace(/@@(.+?)@@/g, '<span class="grad-text">$1</span>');
    } else {
      el.textContent = raw;
    }
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
  });
  document.querySelectorAll('#langSwitch button').forEach((b) =>
    b.classList.toggle('active', b.dataset.lang === lang)
  );
}

function setLang(next) {
  if (!SUPPORTED.includes(next)) return;
  lang = next;
  localStorage.setItem('applikata_lang', lang);
  applyTranslations();
  renderDynamic();
  initReveal(); // re-observe new nodes
}

/* ---------- Dynamic rendering ---------- */
function renderDynamic() {
  const c = content[lang] || content.uz;

  // Advantages
  const advGrid = document.getElementById('advGrid');
  advGrid.innerHTML = c.advantages
    .map(
      (a) => `
      <div class="adv-card reveal">
        <div class="adv-icon">${a.icon}</div>
        <h3>${a.title}</h3>
        <p>${a.text}</p>
      </div>`
    )
    .join('');

  // Courses
  const coursesGrid = document.getElementById('coursesGrid');
  coursesGrid.innerHTML = c.courses
    .map(
      (course) => `
      <div class="course-card reveal">
        <span class="course-emoji">${course.emoji}</span>
        <h3>${course.name}</h3>
        <p>${course.desc}</p>
        <div class="course-meta">
          <span class="course-level">${course.level}</span>
          <a href="#apply" class="course-arrow" aria-label="Apply">→</a>
        </div>
      </div>`
    )
    .join('');

  // Teachers
  const teachersGrid = document.getElementById('teachersGrid');
  teachersGrid.innerHTML = c.teachers
    .map(
      (tch) => `
      <div class="teacher-card reveal">
        <div class="teacher-avatar">${tch.initials}</div>
        <h3>${tch.name}</h3>
        <div class="teacher-role">${tch.role}</div>
        <p>${tch.bio}</p>
      </div>`
    )
    .join('');

  // Reviews
  const reviewsGrid = document.getElementById('reviewsGrid');
  reviewsGrid.innerHTML = c.reviews
    .map(
      (r) => `
      <div class="review-card reveal">
        <div class="review-stars">${'★'.repeat(r.stars)}</div>
        <p class="review-text">"${r.text}"</p>
        <div class="review-author">
          <div class="ra-avatar">${r.name.charAt(0)}</div>
          <div><strong>${r.name}</strong><span>${r.meta}</span></div>
        </div>
      </div>`
    )
    .join('');

  // FAQ
  const faqList = document.getElementById('faqList');
  faqList.innerHTML = c.faq
    .map(
      (f) => `
      <div class="faq-item reveal">
        <button class="faq-q" type="button">
          <span>${f.q}</span><span class="faq-icon">+</span>
        </button>
        <div class="faq-a"><div class="faq-a-inner">${f.a}</div></div>
      </div>`
    )
    .join('');
  bindFaq();

  // Apply course <select>
  const courseSelect = document.getElementById('applyCourse');
  const prev = courseSelect.value;
  courseSelect.innerHTML = c.courses.map((co) => `<option value="${co.name}">${co.name}</option>`).join('');
  if (prev) courseSelect.value = prev;
}

/* ---------- FAQ accordion ---------- */
function bindFaq() {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach((i) => {
        i.classList.remove('open');
        i.querySelector('.faq-a').style.maxHeight = null;
      });
      if (!open) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });
}

/* ---------- Reveal on scroll ---------- */
let observer;
function initReveal() {
  if (observer) observer.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal:not(.in)').forEach((el) => observer.observe(el));
}

/* ---------- Animated counters ---------- */
function animateCounters() {
  const counters = document.querySelectorAll('[data-count]');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const dur = 1400;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((c) => io.observe(c));
}

/* ---------- Navbar / mobile menu ---------- */
function initNav() {
  const navbar = document.getElementById('navbar');
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');

  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      navLinks.classList.remove('open');
    })
  );
}

/* ---------- Apply form ---------- */
function initForm() {
  const form = document.getElementById('applyForm');
  const successBox = document.getElementById('applySuccess');
  const submitBtn = document.getElementById('applySubmit');
  const label = submitBtn.querySelector('.btn-label');
  const spinner = submitBtn.querySelector('.btn-spinner');
  const resetBtn = document.getElementById('applyReset');

  resetBtn.addEventListener('click', () => {
    successBox.hidden = true;
    form.hidden = false;
    form.reset();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Basic validation
    let valid = true;
    ['name', 'phone', 'course'].forEach((n) => {
      const field = form.elements[n];
      if (!field.value.trim()) {
        field.classList.add('invalid');
        valid = false;
      } else {
        field.classList.remove('invalid');
      }
    });
    if (!valid) return;

    submitBtn.disabled = true;
    label.textContent = t('apply.sending');
    spinner.hidden = false;

    const data = {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      telegram: form.elements.telegram.value.trim(),
      age: form.elements.age.value ? Number(form.elements.age.value) : null,
      course: form.elements.course.value,
      comment: form.elements.comment.value.trim(),
      language: form.elements.language.value,
    };

    try {
      await saveApplication(data);
      form.hidden = true;
      successBox.hidden = false;
      successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      console.error('Application submit failed:', err);
      alert(t('apply.error'));
    } finally {
      submitBtn.disabled = false;
      label.textContent = t('apply.submit');
      spinner.hidden = true;
    }
  });

  // remove invalid state on input
  form.querySelectorAll('input, select').forEach((el) =>
    el.addEventListener('input', () => el.classList.remove('invalid'))
  );
}

/* ---------- Lang switch ---------- */
function initLangSwitch() {
  document.getElementById('langSwitch').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-lang]');
    if (btn) setLang(btn.dataset.lang);
  });
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  applyTranslations();
  renderDynamic();
  initNav();
  initLangSwitch();
  initForm();
  initReveal();
  animateCounters();
});
