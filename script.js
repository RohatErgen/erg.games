/* ERG.GAMES — etkileşim katmanı
   1 yardımcılar · 2 dil · 3 nav · 4 mod anahtarı · 5 ses · 6 başarımlar
   7 dişli takımı · 8 patlatılmış kumanda · 9 yetenek ağacı · 10 konsol · 11 artı imleç */

/* ---------- 1. Yardımcılar ---------- */
const root = document.documentElement;
const $ = (s) => document.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const motion = matchMedia('(prefers-reduced-motion: no-preference)').matches;
const isEn = () => root.classList.contains('en');
const t = (tr, en) => (isEn() ? en : tr);
const load = (k) => { try { const v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : []; } catch { return []; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const SECTIONS = ['games', 'portfolio', 'lessons', 'about', 'contact'];

/* ---------- 2. Dil ---------- */
function setLang(l) {
  if (l === root.lang) return;
  root.classList.toggle('en', l === 'en');
  root.lang = l;
  localStorage.setItem('lang', l);
  unlock('polyglot');
  requestAnimationFrame(refresh); // etiket genişlikleri değişti, vurguları yeniden konumla
}
$('#lang').onclick = () => setLang(isEn() ? 'tr' : 'en');

/* ---------- 3. Nav: çekmece, saat, kayan seçim vurgusu, aktif bölüm ---------- */
const drawer = $('#drawer');
const burger = $('#burger');
const menu = $('#menu');
const setDrawer = (open) => { drawer.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); };
burger.onclick = () => setDrawer(!drawer.classList.contains('open'));
menu.onclick = (e) => { if (e.target.closest('a')) setDrawer(false); };

$$('.year').forEach((el) => { el.textContent = new Date().getFullYear(); });

const clock = $('#clock');
const tickClock = () => { clock.textContent = new Date().toLocaleTimeString('tr-TR', { hour12: false }); };
tickClock();
setInterval(tickClock, 1000);

// Kayan seçim vurgusu (gamepad menüsü gibi): sel öğesini seçili bağlantının üstüne taşır
function moveSel(sel, a) {
  if (!a || !a.offsetWidth) return sel.classList.remove('show');
  sel.style.width = a.offsetWidth + 'px';
  sel.style.height = a.offsetHeight + 'px';
  sel.style.transform = `translate(${a.offsetLeft}px, ${a.offsetTop}px)`;
  sel.classList.add('show');
}

// Kahraman ana menüsü: fare / odak / ok tuşları
const mm = $('.mainmenu');
const mmSel = mm.querySelector('.mm-sel');
const mmLinks = $$('a', mm);
const pick = (a) => { mmLinks.forEach((x) => x.classList.toggle('on', x === a)); moveSel(mmSel, a); };
mmLinks.forEach((a) => { a.onmouseenter = a.onfocus = () => pick(a); });
mm.onkeydown = (e) => {
  const d = { ArrowDown: 1, ArrowUp: -1 }[e.key];
  if (!d) return;
  e.preventDefault();
  const i = mmLinks.indexOf(document.activeElement);
  mmLinks[(i + d + mmLinks.length) % mmLinks.length].focus();
};

// Üst menü: aktif bölüm + hover vurgusu; gezilen bölümler "Kaşif" başarımını besler
const navSel = menu.querySelector('.nav-sel');
const navLinks = $$('a', menu);
const current = () => navLinks.find((a) => a.hasAttribute('aria-current'));
navLinks.forEach((a) => { a.onmouseenter = a.onfocus = () => moveSel(navSel, a); });
menu.onmouseleave = () => moveSel(navSel, current());

const visited = new Set(load('visited'));
const spy = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const id = en.target.id;
    navLinks.forEach((a) => (a.hash === '#' + id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    if (!menu.matches(':hover')) moveSel(navSel, current());
    if (SECTIONS.includes(id) && !visited.has(id)) {
      visited.add(id);
      save('visited', [...visited]);
      if (SECTIONS.every((s) => visited.has(s))) unlock('explorer');
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main > section[id]').forEach((s) => spy.observe(s));

function refresh() {
  pick(mm.querySelector('a.on') || mmLinks[0]);
  moveSel(navSel, current());
}
addEventListener('resize', refresh);
document.fonts && document.fonts.ready.then(refresh);
refresh();

/* ---------- 4. Oyun ⇄ Mühendis modu ---------- */
const modeBtn = $('#mode');
const wipe = $('#wipe');
const bp = $('#bp');
const syncMode = () => modeBtn.setAttribute('aria-checked', root.dataset.mode === 'engineer');
syncMode();

function setMode(m) {
  if (m === root.dataset.mode) return;
  localStorage.setItem('mode', m);
  unlock('shift');
  const swap = () => {
    root.dataset.mode = m;
    syncMode();
    bp.classList.remove('anim'); // çizim kendini yeniden çizsin
    bp.getBoundingClientRect();
    bp.classList.add('anim');
    requestAnimationFrame(refresh);
    document.fonts && document.fonts.ready.then(refresh);
  };
  if (!motion) return swap();
  wipe.className = 'wipe run to-' + m; // perde ekranı kapladığı anda (~%42) mod değişir
  setTimeout(swap, 340);
  setTimeout(() => { wipe.className = 'wipe'; }, 820);
}
modeBtn.onclick = () => setMode(root.dataset.mode === 'engineer' ? 'game' : 'engineer');

/* ---------- 5. Arayüz sesleri (WebAudio, varsayılan kapalı) ---------- */
const sndBtn = $('#snd');
let soundOn = localStorage.getItem('sound') === 'on';
let actx = null;
sndBtn.setAttribute('aria-pressed', soundOn);
sndBtn.onclick = () => {
  soundOn = !soundOn;
  localStorage.setItem('sound', soundOn ? 'on' : 'off');
  sndBtn.setAttribute('aria-pressed', soundOn);
};

function blip(freq, dur = 0.05, delay = 0) {
  if (!soundOn) return;
  actx ||= new AudioContext();
  if (actx.state === 'suspended') actx.resume();
  const t0 = actx.currentTime + delay;
  const osc = actx.createOscillator();
  const gain = actx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.04, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(actx.destination);
  osc.start(t0);
  osc.stop(t0 + dur);
}
const UI = 'a, button, [tabindex="0"]';
let lastHover = null;
const hoverBlip = (e) => {
  const el = e.target.closest && e.target.closest(UI);
  if (el && el !== lastHover) blip(1400, 0.025);
  lastHover = el;
};
document.addEventListener('pointerover', hoverBlip);
document.addEventListener('focusin', hoverBlip);
document.addEventListener('click', (e) => { if (e.target.closest(UI)) blip(620, 0.07); });

/* ---------- 6. Başarımlar ---------- */
const ACH = [
  { id: 'explorer', ico: '⌖', tr: ['Kaşif', 'Tüm bölümleri gez.'], en: ['Explorer', 'Visit every section.'] },
  { id: 'shift', ico: '⇄', tr: ['Çift Sınıf', 'Oyun ve mühendis modu arasında geçiş yap.'], en: ['Dual Class', 'Switch between game and engineer mode.'] },
  { id: 'overdrive', ico: '⚙', tr: ['Aşırı Devir', 'Dişlileri 120 rpm üstünde döndür.'], en: ['Overdrive', 'Spin the gears above 120 rpm.'] },
  { id: 'teardown', ico: '✥', tr: ['Söküm Ustası', 'Kumandayı parçalarına ayır.'], en: ['Teardown', 'Explode the controller.'] },
  { id: 'skill', ico: '◆', tr: ['Yetenek Puanı', 'Yetenek ağacında bir düğüm incele.'], en: ['Skill Point', 'Inspect a node in the skill tree.'] },
  { id: 'console', ico: '&gt;_', tr: ['Hacker', 'Konsolu aç.'], en: ['Hacker', 'Open the console.'] },
  { id: 'polyglot', ico: 'Aa', tr: ['Çok Dilli', 'Dili değiştir.'], en: ['Polyglot', 'Switch the language.'] },
  { id: 'secret', ico: '∞', secret: true, tr: ['Tanrı Modu', 'Konsolda gizli bir komut bul.'], en: ['God Mode', 'Find a hidden console command.'] },
];
const got = new Set(load('ach'));
const achDlg = $('#ach-dlg');
const achList = $('#ach-list');
const toasts = $('#toasts');
const both = (a, i) => `<span class="tr">${a.tr[i]}</span><span class="en">${a.en[i]}</span>`;
const shown = (a) => got.has(a.id) || !a.secret; // gizli başarımın adı açılana kadar ???

function renderAch() {
  const n = `${got.size}/${ACH.length}`;
  $('#ach-count').textContent = n;
  $('#ach-count2').textContent = n;
  achList.innerHTML = ACH.map((a) => {
    const on = got.has(a.id);
    return `<li class="${on ? 'got' : ''}"><span class="a-ico" aria-hidden="true">${shown(a) ? a.ico : '?'}</span>
      <div><b>${shown(a) ? both(a, 0) : '???'}</b><small>${both(a, 1)}</small></div>
      <span class="a-st">${on ? '<span class="tr">Açıldı</span><span class="en">Unlocked</span>' : '<span class="tr">Kilitli</span><span class="en">Locked</span>'}</span></li>`;
  }).join('');
}
renderAch();

function unlock(id) {
  if (got.has(id)) return;
  const a = ACH.find((x) => x.id === id);
  got.add(id);
  save('ach', [...got]);
  renderAch();
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="toast-ico" aria-hidden="true">${a.ico}</span><div><b><span class="tr">Başarım açıldı!</span><span class="en">Achievement unlocked!</span></b>${both(a, 0)}</div>`;
  toasts.append(el);
  [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.12, i * 0.08));
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), motion ? 350 : 0); }, 4200);
}

$('#trophy').onclick = () => { setDrawer(false); renderAch(); achDlg.showModal(); };
$('#ach-x').onclick = () => achDlg.close();
achDlg.onclick = (e) => { if (e.target === achDlg) achDlg.close(); }; // arka plana tıklayınca kapan

/* ---------- 7. Dişli takımı: sürükle / fırlat (momentum + sürtünme) / ok tuşları ---------- */
const gearsEl = $('#gears');
const rpmEl = $('#rpm');
const MODULE = 11; // diş modülü, SVG birimi

function gearShape(z, r) {
  const ra = r + MODULE, rf = r - 1.25 * MODULE, p = (2 * Math.PI) / z;
  const pt = (rad, a) => `${(rad * Math.cos(a)).toFixed(2)},${(rad * Math.sin(a)).toFixed(2)}`;
  let d = `M${pt(rf, -0.3 * p)}`;
  for (let i = 0; i < z; i++) { // her diş: kök → uç yayı → kök yayı
    const a = i * p;
    d += `L${pt(ra, a - 0.16 * p)}A${ra},${ra} 0 0 1 ${pt(ra, a + 0.16 * p)}L${pt(rf, a + 0.3 * p)}A${rf},${rf} 0 0 1 ${pt(rf, a + 0.7 * p)}`;
  }
  const hub = Math.max(10, r * 0.24), bore = hub * 0.45, n = z >= 16 ? 6 : z >= 12 ? 5 : 4;
  const ring = (rf + hub) / 2, hr = Math.min((rf - hub) * 0.3, ring * Math.sin(Math.PI / n) * 0.6);
  let s = `<path class="d s1" pathLength="1" d="${d}Z"/>`
    + `<circle class="d s2" pathLength="1" r="${hub.toFixed(1)}"/>`
    + `<circle class="d s3" pathLength="1" r="${bore.toFixed(1)}"/>`
    + `<path class="d s3" pathLength="1" d="M-3,${(-bore + 0.6).toFixed(1)}V${(-bore - 4).toFixed(1)}H3V${(-bore + 0.6).toFixed(1)}"/>`;
  for (let j = 0; j < n; j++) { // hafifletme delikleri: dönüşü gözle görünür kılar
    const a = (j * 2 * Math.PI) / n;
    s += `<circle class="d s3" pathLength="1" cx="${(ring * Math.cos(a)).toFixed(1)}" cy="${(ring * Math.sin(a)).toFixed(1)}" r="${hr.toFixed(1)}"/>`;
  }
  return { svg: s, ra };
}

const gears = $$('.gear', gearsEl).map((el) => {
  const z = +el.dataset.z, x = +el.dataset.x, y = +el.dataset.y, r = (MODULE * z) / 2;
  const shape = gearShape(z, r);
  el.setAttribute('transform', `translate(${x} ${y})`);
  el.innerHTML = `<circle class="hit" r="${shape.ra}"/><circle class="pc" r="${r}"/><g>${shape.svg}</g>`;
  return { el, z, x, y, p: (2 * Math.PI) / z, rot: el.lastElementChild, phi: 0, k: 1 };
});
// k = bu dişlinin 1. dişliye göre açısal oranı (zincir: her geçişte işaret değişir, oran z_önceki / z)
for (let i = 1; i < gears.length; i++) gears[i].k = (-gears[i - 1].k * gears[i - 1].z) / gears[i].z;

let phi = 0;      // 1. dişlinin açısı (rad)
let w = 0;        // 1. dişlinin açısal hızı (rad/ms)
let drag = null;
let coasting = false;
const W_MAX = 0.08;
const clampW = (v) => Math.max(-W_MAX, Math.min(W_MAX, v));

// Kavrama koşulu: temas doğrultusunda A'nın diş fazı + B'nin diş fazı = 0.5 (diş boşluğa girer)
function solve() {
  gears[0].phi = phi;
  for (let i = 1; i < gears.length; i++) {
    const A = gears[i - 1], B = gears[i], th = Math.atan2(B.y - A.y, B.x - A.x);
    B.phi = th + Math.PI - B.p * (0.5 - (th - A.phi) / A.p);
  }
  gears.forEach((g) => g.rot.setAttribute('transform', `rotate(${((g.phi * 180) / Math.PI % 360).toFixed(2)})`));
  const rpm = Math.round(Math.abs(w) * 9549.3); // rad/ms → dev/dk
  rpmEl.textContent = `n₁ = ${rpm} rpm`;
  if (rpm >= 120) unlock('overdrive');
}
function syncAria() {
  const deg = Math.round((((phi * 180) / Math.PI) % 360 + 360) % 360);
  gearsEl.setAttribute('aria-valuenow', deg);
  gearsEl.setAttribute('aria-valuetext', `${deg}°`);
}

// Döngü yalnızca dişliler dönerken çalışır (setTimeout; boşta hiçbir şey çalışmaz)
function coast() {
  if (coasting) return;
  coasting = true;
  let last = performance.now();
  const step = () => {
    const now = performance.now(), dt = Math.min(now - last, 64);
    last = now;
    if (drag) { coasting = false; return; }
    w *= Math.pow(0.5, dt / 700); // sürtünme: hız ~0,7 sn'de yarıya iner
    phi += w * dt;
    if (Math.abs(w) < 2e-4) { w = 0; coasting = false; solve(); syncAria(); return; }
    solve();
    setTimeout(step, 16);
  };
  setTimeout(step, 16);
}

const angleAt = (e, g) => {
  const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(bp.getScreenCTM().inverse());
  return Math.atan2(pt.y - g.y, pt.x - g.x);
};
gearsEl.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('.gear');
  if (!el) return;
  const g = gears.find((x) => x.el === el);
  drag = { g, a: angleAt(e, g), t: performance.now() };
  w = 0;
  gearsEl.setPointerCapture(e.pointerId);
  gearsEl.classList.add('dragging');
  e.preventDefault();
});
gearsEl.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const a = angleAt(e, drag.g), now = performance.now();
  const d = Math.atan2(Math.sin(a - drag.a), Math.cos(a - drag.a)); // ±π aralığına sar
  const dphi = d / drag.g.k;
  phi += dphi;
  w = clampW(0.7 * w + 0.3 * (dphi / Math.max(now - drag.t, 1)));
  drag.a = a;
  drag.t = now;
  solve();
});
const endDrag = () => {
  if (!drag) return;
  if (performance.now() - drag.t > 80) w = 0; // bırakmadan önce durduysa fırlatma yok
  drag = null;
  gearsEl.classList.remove('dragging');
  if (motion) coast(); else { w = 0; solve(); syncAria(); }
};
gearsEl.addEventListener('pointerup', endDrag);
gearsEl.addEventListener('pointercancel', endDrag);
gearsEl.addEventListener('keydown', (e) => {
  const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
  if (!dir) return;
  e.preventDefault();
  if (motion) { w = clampW(w + dir * 0.004); coast(); } // basılı tutunca hızlanır
  else { phi += (dir * Math.PI) / 12; solve(); syncAria(); }
});
solve();
if (motion) setTimeout(() => { if (!drag && !w) { w = 0.008; coast(); } }, 2200); // "dönebilirim" ipucu

/* ---------- 8. Patlatılmış kumanda: fareyle üstüne gel, dokun/tıkla/Enter ile sabitle ---------- */
const rig = $('#rig');
const padRig = $('#pad-rig');
let padHover = false;
let padPinned = false;
function setPad() {
  const on = padHover || padPinned;
  padRig.classList.toggle('open', on);
  rig.classList.toggle('exploded', on);
  padRig.setAttribute('aria-pressed', on);
  if (on) unlock('teardown');
}
padRig.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { padHover = true; setPad(); } });
padRig.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { padHover = false; setPad(); } });
padRig.addEventListener('click', () => { padPinned = !padPinned; setPad(); });
padRig.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  padPinned = !padPinned;
  setPad();
});

/* ---------- 9. Yetenek ağacı ---------- */
const nodes = $$('.node');
const infos = $$('.sk-info');
function pickSkill(btn) {
  nodes.forEach((n) => n.setAttribute('aria-pressed', n === btn));
  infos.forEach((i) => { i.hidden = i.dataset.skill !== btn.dataset.skill; });
  unlock('skill');
}
nodes.forEach((n) => { n.onclick = n.onfocus = () => pickSkill(n); });

/* ---------- 10. Konsol: ` / ~ ile aç-kapa, Esc ile kapat ---------- */
const con = $('#console');
const conLog = $('#con-log');
const conIn = $('#con-in');
const cmdHist = [];
let histI = 0;
let conOpener = null;

function say(text, cls) {
  const p = document.createElement('p');
  p.textContent = text;
  if (cls) p.className = cls;
  conLog.append(p);
  conLog.scrollTop = conLog.scrollHeight;
}
function openConsole() {
  if (con.open) return;
  conOpener = document.activeElement;
  setDrawer(false);
  con.show();
  conIn.focus();
  if (!conLog.childElementCount) say(t("ERG.GAMES konsolu — komutlar için 'help' yazın.", "ERG.GAMES console — type 'help' for commands."), 'ok');
  unlock('console');
}
const closeConsole = () => { if (con.open) con.close(); };
con.addEventListener('close', () => { if (conOpener && conOpener.focus) conOpener.focus({ preventScroll: true }); });
$('#con-btn').onclick = () => (con.open ? closeConsole() : openConsole());
$('#con-x').onclick = closeConsole;

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === '`' || e.key === '~' || e.code === 'Backquote') {
    const typing = e.target !== conIn && e.target.matches?.('input, textarea, select, [contenteditable="true"]');
    if (typing || achDlg.open) return;
    e.preventDefault();
    con.open ? closeConsole() : openConsole();
  } else if (e.key === 'Escape') {
    if (con.open) { e.preventDefault(); closeConsole(); }
    else if (drawer.classList.contains('open')) { setDrawer(false); burger.focus(); }
  }
});

$('#con-form').onsubmit = (e) => {
  e.preventDefault();
  const raw = conIn.value.trim();
  conIn.value = '';
  if (raw) { cmdHist.push(raw); histI = cmdHist.length; }
  run(raw);
};
conIn.addEventListener('keydown', (e) => { // ↑/↓ komut geçmişi
  if ((e.key !== 'ArrowUp' && e.key !== 'ArrowDown') || !cmdHist.length) return;
  e.preventDefault();
  histI = Math.max(0, Math.min(cmdHist.length, histI + (e.key === 'ArrowUp' ? -1 : 1)));
  conIn.value = cmdHist[histI] || '';
});

const HELP = [
  ['help', 'bu liste', 'this list'],
  ['games | portfolio | lessons | about | contact', 'bölüme git', 'jump to a section'],
  ['mode game|engineer', 'görünümü değiştir', 'switch the skin'],
  ['lang tr|en', 'dili değiştir', 'switch language'],
  ['achievements', 'başarımları listele', 'list achievements'],
  ['clear', 'ekranı temizle', 'clear the screen'],
];
function run(raw) {
  say('> ' + raw, 'cmd');
  const [cmd = '', arg = ''] = raw.toLowerCase().split(/\s+/);
  if (!cmd) return;
  if (SECTIONS.includes(cmd)) {
    closeConsole();
    document.getElementById(cmd).scrollIntoView({ behavior: motion ? 'smooth' : 'auto' });
    return;
  }
  switch (cmd) {
    case 'help':
      HELP.forEach(([c, tr, en]) => say(`  ${c}  —  ${t(tr, en)}`));
      say(t('  …ve birkaç gizli komut.', '  …and a few hidden ones.'), 'ok');
      break;
    case 'mode':
      if (arg === 'game' || arg === 'engineer') { setMode(arg); say(t(`Mod: ${arg}`, `Mode: ${arg}`), 'ok'); }
      else say(t(`Şu anki mod: ${root.dataset.mode}. Kullanım: mode game|engineer`, `Current mode: ${root.dataset.mode}. Usage: mode game|engineer`));
      break;
    case 'lang':
      if (arg === 'tr' || arg === 'en') { setLang(arg); say(t('Dil: Türkçe', 'Language: English'), 'ok'); }
      else say(t('Kullanım: lang tr|en', 'Usage: lang tr|en'));
      break;
    case 'achievements':
      ACH.forEach((a) => {
        const on = got.has(a.id), L = isEn() ? a.en : a.tr;
        say(`${on ? '[x]' : '[ ]'} ${shown(a) ? L[0] : '???'} — ${L[1]}`, on ? 'ok' : '');
      });
      say(`${got.size}/${ACH.length}`);
      break;
    case 'clear':
      conLog.textContent = '';
      break;
    case 'iddqd': // gizli: Doom'un tanrı modu
      say(t('TANRI MODU AÇIK. Artık hasar almıyorsun… bu bir web sitesi olsa da.', 'GOD MODE ON. You take no damage… even though this is a website.'), 'ok');
      document.body.classList.add('god');
      setTimeout(() => document.body.classList.remove('god'), 2600);
      unlock('secret');
      break;
    case 'sudo': // gizli
      say(t('Kullanıcı sudoers dosyasında değil. Bu olay rapor edilecek.', 'User is not in the sudoers file. This incident will be reported.'), 'err');
      break;
    default:
      say(t(`Komut bulunamadı: ${cmd} — 'help' yazın.`, `Unknown command: ${cmd} — type 'help'.`), 'err');
  }
}

/* ---------- 11. Mühendis modu: artı imleç + koordinat okuması ---------- */
const xh = $('.xh-h');
const xv = $('.xh-v');
const cx = $('#cx');
const cy = $('#cy');
const pad4 = (n) => String(Math.round(n)).padStart(4, '0');
addEventListener('pointermove', (e) => {
  if (root.dataset.mode !== 'engineer' || e.pointerType !== 'mouse') return;
  document.body.classList.add('ptr');
  xh.style.transform = `translateY(${e.clientY}px)`;
  xv.style.transform = `translateX(${e.clientX}px)`;
  cx.textContent = pad4(e.clientX + scrollX);
  cy.textContent = pad4(e.clientY + scrollY);
}, { passive: true });
document.addEventListener('mouseleave', () => document.body.classList.remove('ptr'));
