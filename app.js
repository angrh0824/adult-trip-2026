/* ═══════════════════════════════════════════════════════════════════
   大人の修学旅行 2026 — app.js
   ═══════════════════════════════════════════════════════════════════ */

const TRIP_DATE = new Date('2026-09-19T10:00:00+09:00').getTime();

/* ─── Global Configuration ─── */
// 発行したGASのウェブアプリURLをここに設定すると、すべての端末で共有されます
const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwqlvTGh9oJ7fUM7H32ibsutDHrN7kWfcHTPRXj5gEm6sIQyswKJtxXNY-tokosdnTO/exec';
// 幹事用パスコード（全端末で共通）
const DEFAULT_PIN = '2026';

/* ─── Selection State ─── */
let selectedVenueCard = null;
let selectedVenuePrice = null; // per-person midpoint
let selectedBusType = null;    // 'car' | 'bus' | null (auto)

function getGasUrl() {
  return localStorage.getItem('gas_url') || DEFAULT_GAS_URL;
}

/* ─── Demo Data ─── */
const DEMO = [
  { id:'d1', name:'山田 太郎', nickname:'やまちゃん (3-2)', contact:'yamada_line', attendance:'attending', drink:'beer', sauna:'hardcore', message:'楽しみ！車内ビール乾杯から参戦。', timestamp:'2026/08/01 10:30' },
  { id:'d2', name:'佐藤 美咲', nickname:'みさき (3-1)', contact:'090-1234-5678', attendance:'attending', drink:'sour', sauna:'beginner', message:'卒アル持っていくね！サウナ初挑戦。', timestamp:'2026/08/01 11:15' },
  { id:'d3', name:'田中 健一', nickname:'ケン坊 (3-2)', contact:'ken@example.com', attendance:'tentative', drink:'highball', sauna:'hardcore', message:'シフト調整中。確定次第連絡します。', timestamp:'2026/08/01 12:00' },
  { id:'d4', name:'鈴木 裕太', nickname:'すーさん (3-3)', contact:'suzu_line', attendance:'attending', drink:'beer', sauna:'hardcore', message:'BBQ肉焼き担当やります！', timestamp:'2026/08/01 14:45' },
  { id:'d5', name:'高橋 恵美', nickname:'えみちゃん (3-1)', contact:'emi_0909', attendance:'absent', drink:'non_alcohol', sauna:'spectator', message:'どうしても外せない用事が…写真共有してね。', timestamp:'2026/08/01 15:20' },
];

function getRSVPs() {
  const d = localStorage.getItem('adult_trip_rsvps');
  if (d === null) {
    if (!getGasUrl()) {
      localStorage.setItem('adult_trip_rsvps', JSON.stringify(DEMO));
      return [...DEMO];
    }
    return [];
  }
  try {
    return JSON.parse(d) || [];
  } catch {
    return [];
  }
}
function saveRSVPs(l) { localStorage.setItem('adult_trip_rsvps', JSON.stringify(l)); }

/* ─── Countdown ─── */
function tick() {
  const d = TRIP_DATE - Date.now();
  if (d <= 0) { ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => document.getElementById(id).textContent = '00'); return; }
  document.getElementById('cd-days').textContent  = String(Math.floor(d/864e5)).padStart(2,'0');
  document.getElementById('cd-hours').textContent = String(Math.floor(d%864e5/36e5)).padStart(2,'0');
  document.getElementById('cd-mins').textContent  = String(Math.floor(d%36e5/6e4)).padStart(2,'0');
  document.getElementById('cd-secs').textContent  = String(Math.floor(d%6e4/1e3)).padStart(2,'0');
}

/* ─── Day Tabs ─── */
function switchDay(n) {
  document.querySelectorAll('.day-tab').forEach((b,i) => b.classList.toggle('active', i===n-1));
  document.getElementById('timeline-day-1').style.display = n===1 ? 'flex' : 'none';
  document.getElementById('timeline-day-2').style.display = n===2 ? 'flex' : 'none';
}

/* ─── Group Size Tabs ─── */
function switchGroupSize(n) {
  document.querySelectorAll('.group-tab').forEach((b,i) => b.classList.toggle('active', i===n-1));
  document.querySelectorAll('.venue-panel').forEach((p,i) => {
    p.classList.toggle('active', i===n-1);
    if (i===n-1) {
      // Re-trigger reveal animations for newly shown cards
      p.querySelectorAll('.venue-card').forEach((card, ci) => {
        card.classList.remove('visible');
        setTimeout(() => card.classList.add('visible'), ci * 80);
      });
    }
  });
}

/* ─── Venue & Bus Selection ─── */
function selectVenue(card) {
  if (selectedVenueCard === card) {
    card.classList.remove('selected');
    selectedVenueCard = null;
    selectedVenuePrice = null;
  } else {
    document.querySelectorAll('.venue-card.selected').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedVenueCard = card;
    const priceEl = card.querySelector('.venue-card__price');
    if (priceEl) {
      const nums = priceEl.textContent.match(/\d{1,3}(?:,\d{3})+/g);
      if (nums) {
        const values = nums.map(n => parseInt(n.replace(/,/g, '')));
        selectedVenuePrice = Math.round(values.reduce((a,b) => a+b, 0) / values.length);
      }
    }
  }
  updateCalculator();
  updateSelectionDisplay();
}

function selectBus(box) {
  const type = box.dataset.busType;
  if (selectedBusType === type) {
    box.classList.remove('selected');
    selectedBusType = null;
  } else {
    document.querySelectorAll('.bus-box.selected').forEach(b => b.classList.remove('selected'));
    box.classList.add('selected');
    selectedBusType = type;
  }
  updateCalculator();
  updateSelectionDisplay();
}

function updateSelectionDisplay() {
  const infoEl = document.getElementById('calc-selected-info');
  if (!infoEl) return;
  let html = '';
  if (selectedVenueCard) {
    const title = selectedVenueCard.querySelector('.venue-card__title');
    html += `<span class="calc__selected-tag">🏠 ${title ? title.textContent : '施設'} (¥${selectedVenuePrice?.toLocaleString()}/人)</span>`;
  } else {
    html += '<span class="calc__selected-tag calc__selected-tag--empty">🏠 施設を選択してください</span>';
  }
  if (selectedBusType) {
    html += `<span class="calc__selected-tag">${selectedBusType === 'bus' ? '🚌 貸切バス' : '🚗 レンタカー'}</span>`;
  } else {
    html += '<span class="calc__selected-tag calc__selected-tag--empty">🚌 移動手段を選択（自動判定中）</span>';
  }
  infoEl.innerHTML = html;
}

/* ─── Calculator ─── */
function updateCalculator() {
  const c = +document.getElementById('headcount-slider').value;
  document.getElementById('headcount-display').textContent = c + ' 名';

  // 12人以下: バスなし・サウナ付きヴィラ（サウナ付きは最大12名程度）
  // 13人以上: バスあり・サウナなし大型ヴィラ
  const useBus = selectedBusType ? (selectedBusType === 'bus') : (c > 12);
  // レンタカー: 1台7人乗りで最大6名乗車 → 12人なら2台必要
  const rentalCars = useBus ? 0 : Math.ceil(c / 6);
  const busCost = useBus ? (c <= 20 ? 220000 : 280000) : rentalCars * 35000;
  const villaCost = selectedVenuePrice
    ? selectedVenuePrice * c
    : (useBus
      ? (c <= 16 ? 250000 : (c <= 24 ? 320000 : 400000))
      : (c <= 8 ? 150000 : 200000));
  const bbqCost = 6000 * c;
  const miscCost = 1000 * c;
  const insCost = 700 * c;

  const total = busCost + villaCost + bbqCost + miscCost + insCost;
  const pp = Math.ceil(total / c / 100) * 100;

  document.getElementById('total-budget-display').textContent = total.toLocaleString();
  document.getElementById('cost-per-person-display').innerHTML = pp.toLocaleString() + ' <small>円</small>';

  const elBus = document.getElementById('cost-bus-display');
  const elVilla = document.getElementById('cost-villa-display');
  const elBbq = document.getElementById('cost-bbq-display');
  const elMisc = document.getElementById('cost-misc-display');
  const elIns = document.getElementById('cost-ins-display');

  if (elBus) elBus.textContent = useBus ? busCost.toLocaleString() + ' 円' : busCost.toLocaleString() + ' 円';
  if (elVilla) elVilla.textContent = villaCost.toLocaleString() + ' 円';
  if (elBbq) elBbq.textContent = bbqCost.toLocaleString() + ' 円';
  if (elMisc) elMisc.textContent = miscCost.toLocaleString() + ' 円';
  if (elIns) elIns.textContent = insCost.toLocaleString() + ' 円';

  // ラベルを人数に応じて更新
  const elBusLabel = document.getElementById('cost-bus-label');
  const elVillaLabel = document.getElementById('cost-villa-label');
  const elNote = document.getElementById('calc-result-note');
  if (elBusLabel) elBusLabel.textContent = useBus ? '貸切バス (高速代・運転手宿泊費込)' : `レンタカー ${rentalCars}台 (ガソリン・高速代込)`;
  if (elVillaLabel) {
    if (selectedVenueCard) {
      const vTitle = selectedVenueCard.querySelector('.venue-card__title');
      elVillaLabel.textContent = (vTitle ? vTitle.textContent : '選択施設') + ' 宿泊代 (中央値)';
    } else {
      elVillaLabel.textContent = useBus ? '大型ロッジ・コテージ 宿泊代 (ハイシーズン相場)' : 'サウナ付き施設 宿泊代 (ハイシーズン相場)';
    }
  }
  if (elNote) elNote.textContent = useBus
    ? '貸切バス / 大型ロッジ・コテージ / 特選BBQ・生ビール / 保険含む'
    : 'レンタカー / サウナ付き施設 / 特選BBQ・生ビール / 保険含む';
}

/* ─── Segmented Radio ─── */
function selectRadio(el) {
  el.parentElement.querySelectorAll('.seg__item').forEach(s => s.classList.remove('seg__item--active'));
  el.classList.add('seg__item--active');
  el.querySelector('input').checked = true;
}

/* ─── RSVP Submission ─── */
async function submitRSVP(e) {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  btn.disabled = true; btn.textContent = '送信中…';

  const now = new Date();
  const ts = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const r = {
    id: 'r-' + Date.now(),
    name: document.getElementById('user-name').value.trim(),
    nickname: document.getElementById('user-nickname').value.trim(),
    contact: document.getElementById('user-contact').value.trim(),
    attendance: (document.querySelector('input[name=attendance]:checked') || {}).value || 'attending',
    drink: document.getElementById('drink-pref').value,
    sauna: document.getElementById('sauna-pref').value,
    message: document.getElementById('user-msg').value.trim(),
    timestamp: ts
  };

  const list = getRSVPs(); list.unshift(r); saveRSVPs(list);

  // GAS sync
  const gasUrl = getGasUrl();
  if (gasUrl) try { await fetch(gasUrl, { method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'}, body:JSON.stringify(r) }); } catch(err) { console.warn('GAS:', err); }

  if (typeof confetti === 'function') confetti({ particleCount:70, spread:55, origin:{y:.7}, colors:['#c8a44e','#fff','#dcc06c'] });
  toast('回答を送信しました。ありがとうございます！');
  document.getElementById('rsvp-form').reset();
  btn.disabled = false; btn.textContent = '送信する';
  updateAdmin();
}

/* ─── Toast ─── */
function toast(msg) {
  const t = document.getElementById('toast'); document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3500);
}

/* ─── PIN Passcode Security ─── */
function getPIN() {
  return localStorage.getItem('kanji_pin') || DEFAULT_PIN;
}

function openPINModal() {
  document.getElementById('pin-input').value = '';
  document.getElementById('pin-modal').classList.add('active');
  setTimeout(() => document.getElementById('pin-input').focus(), 200);
  // 他端末でPINが変更された可能性に備え、背景で最新PINを取得
  fetchGASRSVPs();
}

function closePINModal() {
  document.getElementById('pin-modal').classList.remove('active');
  const burger = document.getElementById('nav-burger');
  const menu = document.getElementById('fullscreen-menu');
  if (burger) burger.classList.remove('open');
  if (menu) menu.classList.remove('open');
  document.body.style.overflow = '';
}

function verifyPIN(e) {
  e.preventDefault();
  if (document.activeElement) document.activeElement.blur();
  const inputPin = document.getElementById('pin-input').value.trim();
  if (inputPin === getPIN()) {
    closePINModal();
    toast('幹事認証に成功しました。');
    setTimeout(() => {
      openAdminModal();
    }, 100);
  } else {
    toast('❌ パスコードが違います');
    document.getElementById('pin-input').value = '';
  }
}

/* ─── Admin Modal & Multi-device Sync ─── */
async function fetchGASRSVPs() {
  const url = getGasUrl();
  if (!url) return;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
    const fetchUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
    const res = await fetch(fetchUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('GAS response is not JSON (likely permission error):', text);
        toast('⚠️ GASへのアクセス権限エラー。「アクセスできるユーザー: 全員」に設定されているか確認してください。');
        return;
      }
      if (data && typeof data === 'object') {
        if (data.pin) {
          localStorage.setItem('kanji_pin', String(data.pin));
        }
        let list = null;
        if (Array.isArray(data.rsvps)) list = data.rsvps;
        else if (Array.isArray(data.data)) list = data.data;
        else if (Array.isArray(data.rows)) list = data.rows;
        else if (Array.isArray(data)) list = data;

        if (list) {
          saveRSVPs(list);
          if (list.length === 0) {
            toast('ℹ️ スプレッドシートの2行目以降にデータがありません（0件）。');
          } else {
            toast(`✅ ${list.length}件のデータを同期しました！`);
          }
        }
      }
    } else {
      toast(`⚠️ GAS同期失敗 (HTTP ${res.status})`);
    }
  } catch (err) {
    console.warn('Failed to sync from GAS:', err);
    toast('⚠️ 通信エラー: GASのURLまたは権限を確認してください。');
  }
}

async function manualSyncGAS() {
  toast('🔄 スプレッドシートから手動読み込み中…');
  await fetchGASRSVPs();
  updateAdmin();
}

function openAdminModal() {
  try {
    updateAdmin();
  } catch(err) {
    console.warn('updateAdmin error:', err);
  }
  const adminModal = document.getElementById('admin-modal');
  if (adminModal) {
    adminModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  fetchGASRSVPs().then(() => {
    try { updateAdmin(); } catch(e) {}
  });
}
function closeAdminModal() {
  const adminModal = document.getElementById('admin-modal');
  if (adminModal) adminModal.classList.remove('active');
  document.body.style.overflow = '';
}

const DRINK = { beer:'ビール', highball:'ハイボール', sour:'サワー', wine:'ワイン/日本酒', non_alcohol:'ノンアル' };
const SAUNA = { hardcore:'ガッツリ', beginner:'初心者', spectator:'見守り' };

function updateAdmin() {
  const list = getRSVPs(), tbody = document.getElementById('admin-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  let a=0, t=0, ab=0;
  list.forEach(r => {
    const att = (r.attendance || '').toLowerCase().trim();
    const isAbsent = att === 'absent' || att.includes('不参加') || att.includes('欠席') || att.includes('✕') || att.includes('×') || att === 'no' || att.includes('無理') || att.includes('不可');
    const isTentative = att === 'tentative' || att.includes('調整') || att.includes('保留') || att.includes('△') || att === 'maybe' || att.includes('未定');
    const isAttending = !isAbsent && !isTentative;

    if (isAttending) a++;
    else if (isTentative) t++;
    else if (isAbsent) ab++;

    const bc = isAttending ? 'badge--g' : (isTentative ? 'badge--y' : 'badge--r');
    const bl = isAttending ? '参加' : (isTentative ? '調整中' : '不参加');

    const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong>${esc(r.name)}</strong><br><small style="color:var(--c-txt3)">${esc(r.nickname||'')}</small></td><td><span class="badge ${bc}">${bl}</span></td><td>${esc(r.contact)}</td><td>${DRINK[r.drink]||esc(r.drink)||'-'}</td><td>${SAUNA[r.sauna]||esc(r.sauna)||'-'}</td><td style="max-width:160px;font-size:.78rem;color:var(--c-txt2)">${esc(r.message||'')}</td><td style="font-size:.72rem;color:var(--c-txt3)">${esc(r.timestamp||'')}</td>`;
    tbody.appendChild(tr);
  });
  const elAtt = document.getElementById('stat-attending');
  const elTen = document.getElementById('stat-tentative');
  const elAbs = document.getElementById('stat-absent');
  const elCol = document.getElementById('stat-collected');
  const elTot = document.getElementById('total-response-count');

  if (elAtt) elAtt.textContent = a + ' 名';
  if (elTen) elTen.textContent = t + ' 名';
  if (elAbs) elAbs.textContent = ab + ' 名';
  
  const slider = document.getElementById('headcount-slider');
  const sv = slider ? +slider.value : 18;
  const cpp = Math.ceil((345000 + 8400*sv)/sv/100)*100;
  if (elCol) elCol.textContent = (a*cpp).toLocaleString() + ' 円';
  if (elTot) elTot.textContent = list.length;
}

function esc(s) { return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

function exportCSV() {
  const list = getRSVPs();
  if (!list.length) return alert('データがありません。');
  const ST = { attending:'参加', tentative:'調整中', absent:'不参加' };
  let csv = '\uFEFF氏名,あだ名,連絡先,ステータス,お酒,サウナ,メッセージ,日時\n';
  list.forEach(r => {
    csv += [r.name,r.nickname,r.contact,ST[r.attendance]||'',r.drink,r.sauna,r.message,r.timestamp].map(v=>`"${(v||'').replace(/"/g,'""')}"`).join(',') + '\n';
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  a.download = `大人の修学旅行2026_回答_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// FULL RESET (Clears demo items completely)
function clearDataAll() {
  if (window.confirm && !window.confirm('全ての回答データを完全に消去しますか？（元に戻せません）')) return;
  saveRSVPs([]);
  updateAdmin();
  toast('データを全て消去しました（0件）。');
}

// RESTORE DEMO DATA
function restoreDemoData() {
  saveRSVPs([...DEMO]);
  updateAdmin();
  toast('サンプルデータを復元しました。');
}

/* ─── DB Settings ─── */
function openDBModal()  {
  document.getElementById('gas-url-input').value = getGasUrl();
  document.getElementById('new-pin-input').value = getPIN();
  document.getElementById('db-modal').classList.add('active');
}
function closeDBModal() { document.getElementById('db-modal').classList.remove('active'); }

async function saveDBSettings() {
  const g = document.getElementById('gas-url-input').value.trim();
  const np = document.getElementById('new-pin-input').value.trim();

  g ? localStorage.setItem('gas_url',g) : localStorage.removeItem('gas_url');
  if (np && np.length >= 4) {
    localStorage.setItem('kanji_pin', np);
    // GAS側へ新PINを共有・同期
    const gasUrl = getGasUrl();
    if (gasUrl) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_pin', pin: np })
        });
      } catch(err) {
        console.warn('PIN GAS sync error:', err);
      }
    }
  }

  toast('設定とパスコードを保存・全端末同期しました。');
  closeDBModal();
}

/* ─── Hamburger Nav ─── */
function initNav() {
  const burger = document.getElementById('nav-burger');
  const menu = document.getElementById('fullscreen-menu');
  if (!burger || !menu) return;
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    menu.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  });
  menu.querySelectorAll('[data-nav]').forEach(l => l.addEventListener('click', () => {
    burger.classList.remove('open');
    menu.classList.remove('open');
    document.body.style.overflow = '';
  }));
}

/* ─── Scroll Effects ─── */
function initScrollEffects() {
  // Nav background on scroll
  const nav = document.getElementById('main-nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Scroll reveal animation
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }
}

/* ─── Scroll Progress Bar ─── */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ─── Mouse Stalker ─── */
function initMouseStalker() {
  const stalker = document.getElementById('mouse-stalker');
  const dot = document.getElementById('mouse-stalker-dot');
  if (!stalker || !dot) return;
  if (window.matchMedia('(hover: none)').matches) return;

  let mx = innerWidth / 2, my = innerHeight / 2;
  let sx = mx, sy = my;
  let dx = mx, dy = my;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
  });

  // Smooth follow animation
  (function loop() {
    sx += (mx - sx) * 0.12;
    sy += (my - sy) * 0.12;
    dx += (mx - dx) * 0.35;
    dy += (my - dy) * 0.35;
    stalker.style.left = sx + 'px';
    stalker.style.top = sy + 'px';
    requestAnimationFrame(loop);
  })();

  // Hover detection on interactive elements
  const interactive = 'a, button, .btn, .card, .villa-card, .seg__item, .day-tab, input, select, textarea, summary';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactive)) {
      stalker.classList.add('hovering');
      dot.classList.add('hovering');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactive)) {
      stalker.classList.remove('hovering');
      dot.classList.remove('hovering');
    }
  });
}

/* ─── Hero Particle Canvas ─── */
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hero = document.getElementById('hero');
  if (!hero) return;

  let W, H, particles = [];
  const COUNT = 80;

  function resize() {
    W = canvas.width = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() {
      this.reset(true);
    }
    reset(init) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : -10;
      this.r = Math.random() * 2 + 0.5;
      this.speed = Math.random() * 0.6 + 0.2;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.drift = (Math.random() - 0.5) * 0.3;
      this.gold = Math.random() > 0.5;
    }
    update() {
      this.y -= this.speed;
      this.x += this.drift;
      if (this.y < -10) this.reset(false);
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.gold
        ? `rgba(212,175,94,${this.alpha})`
        : `rgba(255,255,255,${this.alpha * 0.6})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < COUNT; i++) particles.push(new Particle());

  (function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  })();
}

/* ─── 3D Tilt Cards ─── */
function initTiltCards() {
  const cards = document.querySelectorAll('.card, .villa-card');
  if (!cards.length || window.matchMedia('(hover: none)').matches) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rx = ((y - cy) / cy) * -8;
      const ry = ((x - cx) / cx) * 8;

      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ─── Villa Horizontal Scroll (PC: wheel + drag) ─── */
function initVillaScroll() {
  const scroller = document.querySelector('.villa-scroll');
  if (!scroller) return;

  // マウスホイールで横スクロール（PCのみ）
  scroller.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      scroller.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  // ドラッグで横スクロール
  let isDown = false;
  let startX = 0;
  let startScrollLeft = 0;
  let moved = false;

  scroller.addEventListener('mousedown', (e) => {
    // リンクやボタン上でのドラッグ開始は無視（クリックを妨げない）
    if (e.target.closest('a, button')) return;
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScrollLeft = scroller.scrollLeft;
    scroller.classList.add('dragging');
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const dx = e.pageX - startX;
    if (Math.abs(dx) > 5) moved = true;
    scroller.scrollLeft = startScrollLeft - dx;
  });

  document.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    scroller.classList.remove('dragging');
    // ドラッグ中にクリックが発生しないよう、移動した場合はクリックを抑止
    if (moved) {
      const suppress = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        document.removeEventListener('click', suppress, true);
      };
      document.addEventListener('click', suppress, true);
    }
  });

  // マウスがスクローラーから離れた場合もドラッグ解除
  scroller.addEventListener('mouseleave', () => {
    if (isDown) {
      isDown = false;
      scroller.classList.remove('dragging');
    }
  });
}

/* ─── Scroll Progress Ring ─── */
function initProgressRing() {
  const ring = document.getElementById('progress-ring');
  const fg = document.getElementById('progress-ring-fg');
  if (!ring || !fg) return;
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    fg.style.strokeDashoffset = 100 - pct;
    ring.classList.toggle('visible', h.scrollTop > 300);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ─── Parallax Layers ─── */
function initParallax() {
  const layers = document.querySelectorAll('.parallax-layer');
  if (!layers.length) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      layers.forEach(layer => {
        const speed = parseFloat(layer.dataset.speed || '0.2');
        layer.style.transform = `translateY(${y * speed}px)`;
      });
      ticking = false;
    });
  }, { passive: true });
}

/* ─── Magnetic Buttons ─── */
function initMagnetic() {
  const els = document.querySelectorAll('.magnetic');
  if (!els.length || window.matchMedia('(hover: none)').matches) return;
  els.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

/* ─── Cursor Trail Sparkles ─── */
function initSparkles() {
  if (window.matchMedia('(hover: none)').matches) return;
  let lastSparkle = 0;
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastSparkle < 80) return;
    lastSparkle = now;
    const s = document.createElement('div');
    s.className = 'sparkle';
    s.style.left = (e.clientX + (Math.random() - 0.5) * 20) + 'px';
    s.style.top = (e.clientY + (Math.random() - 0.5) * 20) + 'px';
    s.style.background = Math.random() > 0.5 ? 'var(--c-gold)' : 'rgba(255,255,255,.7)';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 600);
  });
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
  tick(); setInterval(tick, 1000);
  updateCalculator();
  initNav();
  initScrollEffects();
  initScrollProgress();
  initProgressRing();
  initParallax();
  initMagnetic();
  initSparkles();
  initMouseStalker();
  initParticles();
  initTiltCards();
  initVillaScroll();
  // Venue card selection (event delegation)
  document.querySelectorAll('.venue-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return; // Don't intercept link clicks
      selectVenue(card);
    });
  });
  // Bus box selection
  document.querySelectorAll('.bus-box').forEach(box => {
    box.addEventListener('click', () => selectBus(box));
  });
  updateSelectionDisplay();
  const pinBtn = document.getElementById('open-pin-btn');
  if (pinBtn) pinBtn.addEventListener('click', openPINModal);
});
