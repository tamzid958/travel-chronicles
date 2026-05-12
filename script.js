'use strict';

/* ── Activity types ────────────────────────────────────────── */
const ACT = {
  flight:    { bg: 'var(--c-flight-bg)',    color: 'var(--c-flight)',    icon: 'plane'        },
  transport: { bg: 'var(--c-transport-bg)', color: 'var(--c-transport)', icon: 'bus'          },
  activity:  { bg: 'var(--c-activity-bg)',  color: 'var(--c-activity)',  icon: 'star'         },
  food:      { bg: 'var(--c-food-bg)',      color: 'var(--c-food)',      icon: 'tools-kitchen' },
  night:     { bg: 'var(--c-night-bg)',     color: 'var(--c-night)',     icon: 'glass'        },
  sleep:     { bg: 'var(--c-sleep-bg)',     color: 'var(--c-sleep)',     icon: 'bed'          },
};

/* ── Shared utils ──────────────────────────────────────────── */
function getStatus(startDate, endDate) {
  const now   = new Date();
  const start = new Date(startDate + 'T00:00:00');
  const end   = new Date(endDate   + 'T00:00:00');
  if (now < start) return { label: 'Upcoming',   cls: 'badge-upcoming'  };
  if (now > end)   return { label: 'Completed',  cls: 'badge-completed' };
  return               { label: 'In Progress', cls: 'badge-active'    };
}

let _activeTab = null, _activePanel = null;
function switchTab(tab) {
  _activeTab?.classList.remove('active');
  _activePanel?.classList.add('fh-hidden');
  _activeTab   = document.querySelector(`.fh-tab[data-tab="${tab}"]`);
  _activePanel = document.getElementById('fh-' + tab);
  _activeTab?.classList.add('active');
  _activePanel?.classList.remove('fh-hidden');
}

function toggleCollapsible(id) {
  const body = document.getElementById(id);
  const btn  = body.previousElementSibling;
  const open = body.classList.toggle('open');
  btn.classList.toggle('open', open);
}

/* ── INDEX PAGE ────────────────────────────────────────────── */
async function initIndex() {
  const files  = await fetch('data/tours.json').then(r => r.json());
  const tours  = await Promise.all(files.map(f => fetch('data/' + f).then(r => r.json())));
  renderStats(tours);
  renderCards(tours);
}

function renderStats(tours) {
  const countries = new Set(tours.map(t => t.meta.title)).size;
  const days      = tours.reduce((s, t) => s + (t.meta.durationDays || 0), 0);
  animateCounter('stat-countries', countries);
  animateCounter('stat-days', days);
  animateCounter('stat-trips', tours.length);
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let n = 0;
  const step = Math.max(1, Math.ceil(target / 40));
  const tick = () => {
    n = Math.min(n + step, target);
    el.textContent = n;
    if (n < target) requestAnimationFrame(tick);
  };
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { obs.disconnect(); tick(); }
  });
  obs.observe(el);
}

function renderCards(tours) {
  const grid = document.getElementById('cards-grid');
  grid.innerHTML = tours.map(cardHTML).join('');
}

function cardHTML(t) {
  const m      = t.meta;
  const status = getStatus(m.startDate, m.endDate);
  const budget = t.budget?.find(b => b.isTotal) || {};
  const bs     = m.budgetSummary || {};
  const accent = m.accentColor || '#d4714d';
  const id     = m.id;

  const highlights = (m.highlights || []).map(h =>
    `<span class="highlight-tag">${h}</span>`
  ).join('');

  const chips = [m.tripType, `${m.durationDays} days`, `${m.travelers} travelers`]
    .filter(Boolean).map(c => `<span class="chip">${c}</span>`).join('');

  return `
<a href="tour.html?tour=${id}.json" class="card" style="text-decoration:none">
  <div class="card-image-wrap">
    <div class="card-image-placeholder">${m.flag || '✈️'}</div>
    <div class="card-accent" style="background:${accent}"></div>
  </div>
  <div class="card-head">
    <div class="card-flag-row">
      <div>
        <div class="card-country">${m.title}</div>
        <div class="card-dest">${m.destination || m.subtitle || ''}</div>
      </div>
      <span class="badge ${status.cls}"><span class="badge-dot"></span>${status.label}</span>
    </div>
    <div class="card-chips">${chips}</div>
  </div>
  <div class="card-divider"></div>
  <div class="card-body">
    <div class="card-meta-row"><i class="ti ti-calendar"></i>${m.dateLabel || ''}</div>
    <div class="card-meta-row">
      <i class="ti ti-coin"></i>
      <span class="card-budget">${bs.total || budget.lkr || '—'} ${bs.currency || 'LKR'}</span>
      ${bs.usdEquiv ? `<span class="card-budget-note">${bs.usdEquiv}</span>` : ''}
    </div>
    <div class="card-highlights">${highlights}</div>
  </div>
  <div class="card-footer">
    <span class="card-cta">View Itinerary <i class="ti ti-arrow-right"></i></span>
  </div>
</a>`;
}

/* ── TOUR PAGE ─────────────────────────────────────────────── */
async function initTour() {
  const param = new URLSearchParams(location.search).get('tour');
  if (!param) { showTourError('No tour specified.'); return; }

  const file = param.endsWith('.json') ? param : param + '.json';
  try {
    const data = await fetch('data/' + file).then(r => {
      if (!r.ok) throw new Error('Not found');
      return r.json();
    });
    renderTour(data);
  } catch {
    showTourError('Tour not found: ' + file);
  }
}

function renderTour(data) {
  const m = data.meta;
  document.title = m.title + ' — Travel Chronicles';

  const navName = document.getElementById('nav-tour-name');
  if (navName) navName.textContent = m.title + ' · ' + (m.dateLabel || '');

  if (m.accentColor) {
    document.documentElement.style.setProperty('--accent-tour', m.accentColor);
  }

  renderTourHeader(m);
  renderRoute(data.route || [], data.hotels || []);
  renderFlights(data.flights);
  renderHotels(data.hotels || []);
  renderDayNav(data.days || []);
  renderDays(data.days || []);
  renderBudget(data.budget || []);
  renderNotes(data.notes || []);
  activateDay(0);
  _activeTab   = document.querySelector('.fh-tab[data-tab="flights"]');
  _activePanel = document.getElementById('fh-flights');
}

function renderTourHeader(m) {
  const el = document.getElementById('tour-header');
  if (!el) return;
  const status = getStatus(m.startDate, m.endDate);
  const bs = m.budgetSummary || {};
  el.innerHTML = `
    <div class="t-hero-inner">
      <div class="t-hero-flag">${m.flag || ''}</div>
      <div class="t-hero-body">
        <div class="t-hero-eyebrow">
          <span class="badge ${status.cls}"><span class="badge-dot"></span>${status.label}</span>
          ${m.tripType ? `<span class="chip">${m.tripType}</span>` : ''}
        </div>
        <h1 class="t-hero-title">${m.title}</h1>
        <p class="t-hero-sub">${m.subtitle || ''}</p>
        <div class="t-hero-stats">
          ${m.dateLabel    ? `<div class="t-hero-stat"><i class="ti ti-calendar"></i>${m.dateLabel}</div>` : ''}
          ${m.durationDays ? `<div class="t-hero-stat"><i class="ti ti-clock"></i>${m.durationDays} days</div>` : ''}
          ${m.travelers    ? `<div class="t-hero-stat"><i class="ti ti-users"></i>${m.travelers} travelers</div>` : ''}
          ${bs.total       ? `<div class="t-hero-stat"><i class="ti ti-coin"></i>${bs.total} ${bs.currency || 'LKR'} ${bs.usdEquiv ? '· ' + bs.usdEquiv : ''}</div>` : ''}
        </div>
      </div>
    </div>`;
}

function renderRoute(route, hotels) {
  const el = document.getElementById('route-path');
  if (!el || !route.length) return;

  const hotelMap = {};
  hotels.forEach(h => { hotelMap[h.location.toLowerCase()] = h; });

  const rows = [];
  route.forEach((stop, i) => {
    const isFirst   = i === 0;
    const isLast    = i === route.length - 1;
    const isAirport = stop.via == null;
    const via       = stop.via || '';
    const cityKey   = stop.city.toLowerCase();

    let type = 'stopover', sub = '';
    if (isAirport) {
      type = 'airport';
      sub = isFirst ? 'Arrival' : 'Departure';
    } else if (via.includes('day trip')) {
      type = 'daytrip'; sub = 'Day trip';
    } else if (via.includes('stop')) {
      type = 'stopover'; sub = 'Stopover';
    } else if (hotelMap[cityKey]) {
      const h = hotelMap[cityKey];
      type = 'hotel'; sub = `${h.nights} nights`;
    }

    let transport = '';
    if (!isLast && !isAirport) {
      const nextVia = route[i + 1].via || '';
      if (nextVia.includes('train'))         transport = 'Train';
      else if (nextVia.includes('day trip')) transport = 'Day trip';
      else                                   transport = 'Bus';
    }

    rows.push(`<tr class="rs-row rs-type-${type}">
  <td class="rs-td-city">${stop.city}</td>
  <td class="rs-td-sub">${sub}</td>
  <td class="rs-td-transport">${transport ? `<span class="rs-transport">${transport}</span>` : ''}</td>
</tr>`);
  });

  el.innerHTML = `<table class="rs-table"><tbody>${rows.join('')}</tbody></table>`;
}

function renderFlights(flights) {
  const el = document.getElementById('flights-grid');
  if (!el || !flights) return;
  const rows = [flights.outbound, flights.return].filter(Boolean);
  el.innerHTML = rows.map(f => `
<div class="flight-row">
  <div class="flight-label">${f.label || ''}</div>
  <div class="flight-route">${f.route}</div>
  <div class="flight-detail">${f.detail}</div>
</div>`).join('');
}

function renderHotels(hotels) {
  const el = document.getElementById('hotels-list');
  if (!el) return;
  el.innerHTML = hotels.map(h => `
<div class="hotel-row">
  <div class="hotel-nights-badge">${h.nights}N</div>
  <div class="hotel-info">
    <div class="hotel-name">${h.name}</div>
    <div class="hotel-loc">${h.location} · ${h.dateRange}</div>
    ${h.priceNote ? `<div class="hotel-price">${h.priceNote}</div>` : ''}
  </div>
</div>`).join('');
}

function renderDayNav(days) {
  const el = document.getElementById('day-nav-inner');
  if (!el) return;
  el.innerHTML = days.map((d, i) => `
<button class="day-btn" data-i="${i}" onclick="activateDay(${i})">
  Day ${d.n}
</button>`).join('');
}

function activateDay(i) {
  document.querySelectorAll('.day-btn').forEach((b, j) => {
    b.classList.toggle('active', j === i);
  });
  document.querySelectorAll('.day-section').forEach((s, j) => {
    s.classList.toggle('visible', j === i);
  });
}

function renderDays(days) {
  const el = document.getElementById('days-container');
  if (!el) return;
  el.innerHTML = days.map((d, i) => `
<section class="day-section" id="day-${i}">
  <div class="day-heading">
    <div class="day-num">Day ${d.n}</div>
    <div class="day-title">${d.lbl}</div>
    <div class="day-date">${d.date}</div>
  </div>
  <div class="activities">${(d.acts || []).map(actHTML).join('')}</div>
</section>`).join('');
}

function actHTML(a) {
  const tp  = ACT[a.tp] || ACT.activity;
  const ico = a.ic ? a.ic.replace(/^ti-/, '') : tp.icon;
  return `
<div class="activity">
  <div class="act-time">${a.t || ''}</div>
  <div class="act-dot-col">
    <div class="act-dot" style="background:${tp.color}">
      <i class="ti ti-${ico}" style="color:#fff"></i>
    </div>
    <div class="act-line"></div>
  </div>
  <div class="act-body">
    <span class="act-label" style="color:${tp.color}">${a.tp}</span>
    <span class="act-tx">${a.tx || a.nm || ''}</span>
  </div>
</div>`;
}

function renderBudget(budget) {
  const el = document.getElementById('budget-body');
  if (!el) return;

  const rows = budget.map(b => `
<tr class="${b.isTotal ? 'budget-total-row' : ''}">
  <td class="budget-td-cat">
    ${b.cat}
    ${b.note ? `<div class="budget-note">${b.note}</div>` : ''}
  </td>
  <td class="budget-td-val">${b.lkr}</td>
</tr>`).join('');

  const inner = el.querySelector('.budget-inner');
  if (inner) inner.innerHTML = `<table class="budget-table"><tbody>${rows}</tbody></table>`;
}

function renderNotes(notes) {
  const el = document.getElementById('notes-body');
  if (!el) return;
  const inner = el.querySelector('.notes-inner');
  if (inner) inner.innerHTML = notes.map(n => `
<div class="note-item">
  <div class="note-title">${n.title || 'Note'}</div>
  <div class="note-text">${n.text || n}</div>
</div>`).join('');
}

function showTourError(msg) {
  const main = document.getElementById('main-content');
  if (main) main.innerHTML = `
<div style="padding:48px 24px;text-align:center">
  <div style="font-size:48px;margin-bottom:16px">🗺️</div>
  <h2 style="font-family:'Lora',serif;font-size:24px;margin-bottom:8px">Tour not found</h2>
  <p style="color:var(--t2);font-size:14px;margin-bottom:24px">${msg}</p>
  <a href="index.html" style="font-size:14px;font-weight:600;color:var(--accent-prime);text-decoration:underline">← Back to all tours</a>
</div>`;
}
