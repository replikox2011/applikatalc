/* ============================================================
   Applikata Landing — admin.js
   Manages Admin Panel auth, real-time leads display, and actions.
   ============================================================ */

import { auth, db, firebaseInitPromise, adminEmail, adminPassword } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ---------- Credentials Configuration loaded from firebase-config.js ---------- */

/* ---------- i18n & Translations ---------- */
const SUPPORTED = ['uz', 'ru', 'en'];
let lang = localStorage.getItem('applikata_lang') || 'uz';
if (!SUPPORTED.includes(lang)) lang = 'uz';

const translations = {
  uz: {
    'admin.title': 'Applikata — Admin paneli',
    'admin.logout': 'Chiqish',
    'admin.login.eyebrow': 'Xavfsiz kirish',
    'admin.login.title': 'Tizimga kirish',
    'admin.login.subtitle': 'Admin panelga kirish uchun ma\'lumotlarni kiriting',
    'admin.login.email': 'Email',
    'admin.login.password': 'Parol',
    'admin.login.submit': 'Kirish',
    'admin.dashboard.title': 'Lending arizalari',
    'admin.dashboard.subtitle': 'Lending sahifasidan kelib tushgan arizalar ro\'yxati',
    'admin.filter.all': 'Barchasi',
    'admin.filter.new': 'Yangi',
    'admin.filter.contacted': 'Bog\'lanilgan',
    'admin.filter.enrolled': 'Qabul qilingan',
    'admin.filter.rejected': 'Rad etilgan',
    'admin.loading': 'Arizalar yuklanmoqda...',
    'admin.noLeads': 'Arizalar mavjud emas',
    'admin.accessDenied': 'Ruxsat etilmagan foydalanuvchi yoki noto\'g\'ri login/parol',
    'admin.errorGeneric': 'Xatolik yuz berdi. Qayta urinib ko\'ring.',
    'admin.confirmDelete': 'Haqiqatan ham ushbu arizani o\'chirib tashlamoqchimisiz?',
    'admin.stats': 'Jami: {total} | Yangi: {new} | Bog\'lanilgan: {contacted} | Qabul qilingan: {enrolled} | Rad etilgan: {rejected}',
    'admin.label.course': 'Kurs',
    'admin.label.language': 'Til',
    'admin.label.age': 'Yosh',
    'admin.label.date': 'Sana',
    'admin.label.comment': 'Izoh',
    'admin.action.contacted': 'Sog\'lanilgan',
    'admin.action.enrolled': 'Qabul qilish',
    'admin.action.rejected': 'Rad etish',
    'admin.action.delete': 'O\'chirish',
    'admin.yosh': 'yosh',
    'footer.rights': 'Barcha huquqlar himoyalangan.'
  },
  ru: {
    'admin.title': 'Applikata — Панель администратора',
    'admin.logout': 'Выйти',
    'admin.login.eyebrow': 'Безопасный вход',
    'admin.login.title': 'Вход в систему',
    'admin.login.subtitle': 'Введите данные для доступа к панели администратора',
    'admin.login.email': 'Email',
    'admin.login.password': 'Пароль',
    'admin.login.submit': 'Войти',
    'admin.dashboard.title': 'Заявки с лендинга',
    'admin.dashboard.subtitle': 'Список заявок, поступивших с посадочной страницы',
    'admin.filter.all': 'Все',
    'admin.filter.new': 'Новые',
    'admin.filter.contacted': 'Связались',
    'admin.filter.enrolled': 'Зачислены',
    'admin.filter.rejected': 'Отклонены',
    'admin.loading': 'Загрузка заявок...',
    'admin.noLeads': 'Заявок пока нет',
    'admin.accessDenied': 'Доступ запрещен или неверный логин/пароль',
    'admin.errorGeneric': 'Произошла ошибка. Пожалуйста, попробуйте еще раз.',
    'admin.confirmDelete': 'Вы уверены, что хотите удалить эту заявку?',
    'admin.stats': 'Всего: {total} | Новые: {new} | Связались: {contacted} | Зачислены: {enrolled} | Отклонены: {rejected}',
    'admin.label.course': 'Курс',
    'admin.label.language': 'Язык',
    'admin.label.age': 'Возраст',
    'admin.label.date': 'Дата',
    'admin.label.comment': 'Комментарий',
    'admin.action.contacted': 'Связались',
    'admin.action.enrolled': 'Зачислить',
    'admin.action.rejected': 'Отклонить',
    'admin.action.delete': 'Удалить',
    'admin.yosh': 'лет',
    'footer.rights': 'Все права защищены.'
  },
  en: {
    'admin.title': 'Applikata — Admin Panel',
    'admin.logout': 'Logout',
    'admin.login.eyebrow': 'Secure access',
    'admin.login.title': 'Sign In',
    'admin.login.subtitle': 'Enter credentials to access the admin panel',
    'admin.login.email': 'Email',
    'admin.login.password': 'Password',
    'admin.login.submit': 'Sign In',
    'admin.dashboard.title': 'Landing Leads',
    'admin.dashboard.subtitle': 'List of leads received from the landing page',
    'admin.filter.all': 'All',
    'admin.filter.new': 'New',
    'admin.filter.contacted': 'Contacted',
    'admin.filter.enrolled': 'Enrolled',
    'admin.filter.rejected': 'Rejected',
    'admin.loading': 'Loading leads...',
    'admin.noLeads': 'No leads available',
    'admin.accessDenied': 'Access denied or incorrect credentials',
    'admin.errorGeneric': 'An error occurred. Please try again.',
    'admin.confirmDelete': 'Are you sure you want to delete this lead?',
    'admin.stats': 'Total: {total} | New: {new} | Contacted: {contacted} | Enrolled: {enrolled} | Rejected: {rejected}',
    'admin.label.course': 'Course',
    'admin.label.language': 'Language',
    'admin.label.age': 'Age',
    'admin.label.date': 'Date',
    'admin.label.comment': 'Comment',
    'admin.action.contacted': 'Contacted',
    'admin.action.enrolled': 'Enroll',
    'admin.action.rejected': 'Reject',
    'admin.action.delete': 'Delete',
    'admin.yosh': 'years old',
    'footer.rights': 'All rights reserved.'
  }
};

function t(key) {
  return (translations[lang] && translations[lang][key]) || translations.uz[key] || key;
}

function applyTranslations() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  document.querySelectorAll('#langSwitch button').forEach((b) =>
    b.classList.toggle('active', b.dataset.lang === lang)
  );

  document.getElementById('year').textContent = new Date().getFullYear();
  renderLeads();
}

function setLang(next) {
  if (!SUPPORTED.includes(next)) return;
  lang = next;
  localStorage.setItem('applikata_lang', lang);
  applyTranslations();
}

/* ---------- State Variables ---------- */
let leadsData = [];
let activeFilter = 'all';
let leadsUnsubscribe = null;

// Normalize status values to support both string legacy data and numeric new data
function normalizeStatus(status) {
  if (status === 0 || status === 'new') return 0;
  if (status === 1 || status === 'contacted') return 1;
  if (status === 2 || status === 'enrolled') return 2;
  if (status === 3 || status === 'rejected') return 3;
  return 0; // Default fallback to 0 (new)
}

const STATUS_TONES = {
  0: 'badge-new',
  1: 'badge-contacted',
  2: 'badge-enrolled',
  3: 'badge-rejected'
};

const STATUS_KEYS = {
  0: 'new',
  1: 'contacted',
  2: 'enrolled',
  3: 'rejected'
};

const FILTER_MAPPING = {
  'new': 0,
  'contacted': 1,
  'enrolled': 2,
  'rejected': 3
};

/* ---------- DOM Elements ---------- */
const loginContainer = document.getElementById('loginContainer');
const dashboardContainer = document.getElementById('dashboardContainer');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const dashboardError = document.getElementById('dashboardError');
const loginSubmit = document.getElementById('loginSubmit');
const navLogout = document.getElementById('navLogout');
const profileName = document.getElementById('profileName');
const profileRole = document.getElementById('profileRole');
const filterPills = document.getElementById('filterPills');
const statsSummary = document.getElementById('statsSummary');
const leadsGrid = document.getElementById('leadsGrid');

/* ---------- Authentication Handlers ---------- */
function initAuthStateListener() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (user.email === adminEmail) {
        profileName.textContent = 'Applikata Admin';
        profileRole.textContent = 'Admin';
        showDashboard();
        subscribeToLeads();
      } else {
        showError(t('admin.accessDenied'), loginError);
        await signOut(auth);
      }
    } else {
      showLogin();
      unsubscribeFromLeads();
    }
  });
}

function showLogin() {
  loginContainer.style.display = 'block';
  dashboardContainer.style.display = 'none';
  navLogout.style.display = 'none';
}

function showDashboard() {
  loginContainer.style.display = 'none';
  dashboardContainer.style.display = 'block';
  navLogout.style.display = 'inline-flex';
}

function showError(msg, element) {
  element.textContent = msg;
  element.style.display = 'block';
  setTimeout(() => {
    element.style.display = 'none';
  }, 6000);
}

/* ---------- Form Submit ---------- */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = loginForm.elements.email.value.trim();
  const password = loginForm.elements.password.value;

  if (!email || !password) return;

  if (email !== adminEmail || password !== adminPassword) {
    showError(t('admin.accessDenied'), loginError);
    return;
  }

  const label = loginSubmit.querySelector('.btn-label');
  const spinner = loginSubmit.querySelector('.btn-spinner');

  loginSubmit.disabled = true;
  label.textContent = t('apply.sending');
  spinner.hidden = false;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error('Login failed:', err);
    showError(t('admin.accessDenied'), loginError);
  } finally {
    loginSubmit.disabled = false;
    label.textContent = t('admin.login.submit');
    spinner.hidden = true;
  }
});

navLogout.addEventListener('click', async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Signout error:', err);
  }
});

/* ---------- Leads Data Management ---------- */
function subscribeToLeads() {
  if (leadsUnsubscribe) return;

  const q = query(collection(db, 'newusers'), orderBy('createdAt', 'desc'));

  leadsUnsubscribe = onSnapshot(q, (snapshot) => {
    leadsData = [];
    snapshot.forEach((docSnap) => {
      leadsData.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderLeads();
  }, (err) => {
    console.error('Error fetching leads:', err);
    showError(t('admin.errorGeneric'), dashboardError);
  });
}

function unsubscribeFromLeads() {
  if (leadsUnsubscribe) {
    leadsUnsubscribe();
    leadsUnsubscribe = null;
  }
  leadsData = [];
  leadsGrid.innerHTML = '';
}

/* ---------- Render Functions ---------- */
function renderLeads() {
  if (!dashboardContainer.offsetParent && !loginContainer.offsetParent) {
    return;
  }

  // Count stats with normalized values
  const total = leadsData.length;
  const countNew = leadsData.filter(l => normalizeStatus(l.status) === 0).length;
  const countContacted = leadsData.filter(l => normalizeStatus(l.status) === 1).length;
  const countEnrolled = leadsData.filter(l => normalizeStatus(l.status) === 2).length;
  const countRejected = leadsData.filter(l => normalizeStatus(l.status) === 3).length;

  // Render stats summary
  statsSummary.textContent = t('admin.stats')
    .replace('{total}', total)
    .replace('{new}', countNew)
    .replace('{contacted}', countContacted)
    .replace('{enrolled}', countEnrolled)
    .replace('{rejected}', countRejected);

  // Filter leads
  const filtered = activeFilter === 'all'
    ? leadsData
    : leadsData.filter(l => normalizeStatus(l.status) === FILTER_MAPPING[activeFilter]);

  if (filtered.length === 0) {
    leadsGrid.innerHTML = `
      <div class="empty-state glass w-100" style="grid-column: 1 / -1;">
        <div class="empty-icon">📥</div>
        <h3>${t('admin.noLeads')}</h3>
      </div>
    `;
    return;
  }

  leadsGrid.innerHTML = filtered.map((l) => {
    const status = normalizeStatus(l.status);
    const statusText = t(`admin.filter.${STATUS_KEYS[status]}`);
    const toneClass = STATUS_TONES[status] || 'badge-new';

    // Format timestamp
    let dateStr = '';
    if (l.createdAt) {
      try {
        const d = l.createdAt.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
        dateStr = d.toLocaleString(lang === 'uz' ? 'uz-UZ' : lang === 'ru' ? 'ru-RU' : 'en-US');
      } catch (e) {
        dateStr = '';
      }
    }

    const formattedPhone = l.phone ? l.phone.replace(/[^\d+]/g, '') : '';
    const telegramUrl = l.telegram
      ? `https://t.me/${l.telegram.replace('@', '').trim()}`
      : '#';

    // Action buttons display logic based on numeric statuses (1=contacted, 2=enrolled, 3=rejected)
    let actionButtons = '';
    if (status === 0) {
      actionButtons += `
        <button class="btn-action btn-contacted" data-id="${l.id}" data-action="1">${t('admin.action.contacted')}</button>
        <button class="btn-action btn-enrolled" data-id="${l.id}" data-action="2">${t('admin.action.enrolled')}</button>
        <button class="btn-action btn-rejected" data-id="${l.id}" data-action="3">${t('admin.action.rejected')}</button>
      `;
    } else if (status === 1) {
      actionButtons += `
        <button class="btn-action btn-enrolled" data-id="${l.id}" data-action="2">${t('admin.action.enrolled')}</button>
        <button class="btn-action btn-rejected" data-id="${l.id}" data-action="3">${t('admin.action.rejected')}</button>
      `;
    }

    return `
      <div class="lead-card glass">
        <div class="lead-card-header">
          <div class="lead-client-name" title="${l.name}">${l.name}</div>
          <span class="badge ${toneClass}">${statusText}</span>
        </div>
        
        <div class="lead-time">${dateStr}</div>
        
        <div class="lead-details-list">
          <div class="lead-detail-item">
            <span class="lead-detail-label">${t('admin.label.course')}</span>
            <span class="lead-detail-value" title="${l.course}">${l.course}</span>
          </div>
          <div class="lead-detail-item">
            <span class="lead-detail-label">${t('admin.label.language')}</span>
            <span class="lead-detail-value">${l.language ? l.language.toUpperCase() : ''}</span>
          </div>
          <div class="lead-detail-item">
            <span class="lead-detail-label">${t('admin.login.email')}</span>
            <span class="lead-detail-value" title="${l.phone}">
              <a href="tel:${formattedPhone}" class="lead-detail-value link">${l.phone}</a>
            </span>
          </div>
          <div class="lead-detail-item">
            <span class="lead-detail-label">Telegram</span>
            <span class="lead-detail-value">
              ${l.telegram ? `<a href="${telegramUrl}" target="_blank" rel="noopener noreferrer" class="lead-detail-value link">${l.telegram}</a>` : '-'}
            </span>
          </div>
          ${l.age ? `
            <div class="lead-detail-item">
              <span class="lead-detail-label">${t('admin.label.age')}</span>
              <span class="lead-detail-value">${l.age} ${t('admin.yosh')}</span>
            </div>
          ` : ''}
        </div>
        
        ${l.comment ? `
          <div class="lead-comment-box">
            "${l.comment}"
          </div>
        ` : ''}
        
        <div class="lead-actions-row">
          ${actionButtons}
          <button class="btn-delete-icon" data-id="${l.id}" data-action="delete" title="${t('admin.action.delete')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* ---------- Event Listeners ---------- */

// Filter clicks
filterPills.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-pill');
  if (!btn) return;

  filterPills.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  activeFilter = btn.dataset.filter;
  renderLeads();
});

// Card Actions (status change or delete)
leadsGrid.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn-action, .btn-delete-icon');
  if (!btn) return;

  const leadId = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === 'delete') {
    if (confirm(t('admin.confirmDelete'))) {
      try {
        await deleteDoc(doc(db, 'newusers', leadId));
      } catch (err) {
        console.error('Failed to delete lead:', err);
        showError(t('admin.errorGeneric'), dashboardError);
      }
    }
  } else {
    try {
      await updateDoc(doc(db, 'newusers', leadId), { status: Number(action) });
    } catch (err) {
      console.error('Failed to update status:', err);
      showError(t('admin.errorGeneric'), dashboardError);
    }
  }
});

// Language switcher
document.getElementById('langSwitch').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-lang]');
  if (btn) setLang(btn.dataset.lang);
});

// Boot Setup
document.addEventListener('DOMContentLoaded', async () => {
  await firebaseInitPromise;
  applyTranslations();
  initAuthStateListener();
});
