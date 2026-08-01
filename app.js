/* ═══════════════════════════════════════════════════════════════════
   大人の修学旅行 2026 — app.js
   ═══════════════════════════════════════════════════════════════════ */

const TRIP_DATE = new Date('2026-09-19T10:00:00+09:00').getTime();

/* ─── Global Configuration ─── */
// 発行したGASのウェブアプリURLをここに設定すると、すべての端末で共有されます
const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwqlvTGh9oJ7fUM7H32ibsutDHrN7kWfcHTPRXj5gEm6sIQyswKJtxXNY-tokosdnTO/exec';
// 幹事用パスコード（全端末で共通）
const DEFAULT_PIN = '2026';

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

/* ─── Calculator ─── */
function updateCalculator() {
  const c = +document.getElementById('headcount-slider').value;
  document.getElementById('headcount-display').textContent = c + ' 名';

  const busCost = c < 20 ? 185000 : 235000;
  const villaCost = c <= 12 ? 140000 : (c <= 18 ? 175000 : 220000);
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

  if (elBus) elBus.textContent = busCost.toLocaleString() + ' 円';
  if (elVilla) elVilla.textContent = villaCost.toLocaleString() + ' 円';
  if (elBbq) elBbq.textContent = bbqCost.toLocaleString() + ' 円';
  if (elMisc) elMisc.textContent = miscCost.toLocaleString() + ' 円';
  if (elIns) elIns.textContent = insCost.toLocaleString() + ' 円';
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
}

function closePINModal() {
  document.getElementById('pin-modal').classList.remove('active');
}

function verifyPIN(e) {
  e.preventDefault();
  const inputPin = document.getElementById('pin-input').value.trim();
  if (inputPin === getPIN()) {
    closePINModal();
    openAdminModal();
    toast('幹事認証に成功しました。');
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
    const fetchUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
    const res = await fetch(fetchUrl);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        saveRSVPs(data);
      }
    }
  } catch (err) {
    console.warn('Failed to sync from GAS:', err);
  }
}

async function openAdminModal()  {
  toast('🔄 データベースを同期中…');
  await fetchGASRSVPs();
  updateAdmin();
  document.getElementById('admin-modal').classList.add('active');
}
function closeAdminModal() { document.getElementById('admin-modal').classList.remove('active'); }

const DRINK = { beer:'ビール', highball:'ハイボール', sour:'サワー', wine:'ワイン/日本酒', non_alcohol:'ノンアル' };
const SAUNA = { hardcore:'ガッツリ', beginner:'初心者', spectator:'見守り' };

function updateAdmin() {
  const list = getRSVPs(), tbody = document.getElementById('admin-table-body');
  tbody.innerHTML = '';
  let a=0, t=0, ab=0;
  list.forEach(r => {
    const att = (r.attendance || '').trim();
    const isAttending = att === 'attending' || att === '参加' || att === '参加する';
    const isTentative = att === 'tentative' || att === '調整中';
    const isAbsent = att === 'absent' || att === '不参加';

    if (isAttending) a++; else if (isTentative) t++; else ab++;
    const bc = isAttending ? 'badge--g' : (isTentative ? 'badge--y' : 'badge--r');
    const bl = isAttending ? '参加' : (isTentative ? '調整中' : '不参加');

    const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong>${esc(r.name)}</strong><br><small style="color:var(--c-txt3)">${esc(r.nickname||'')}</small></td><td><span class="badge ${bc}">${bl}</span></td><td>${esc(r.contact)}</td><td>${DRINK[r.drink]||esc(r.drink)||'-'}</td><td>${SAUNA[r.sauna]||esc(r.sauna)||'-'}</td><td style="max-width:160px;font-size:.78rem;color:var(--c-txt2)">${esc(r.message||'')}</td><td style="font-size:.72rem;color:var(--c-txt3)">${esc(r.timestamp||'')}</td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('stat-attending').textContent  = a + ' 名';
  document.getElementById('stat-tentative').textContent  = t + ' 名';
  document.getElementById('stat-absent').textContent     = ab + ' 名';
  const sv = +document.getElementById('headcount-slider').value;
  const cpp = Math.ceil((345000 + 8400*sv)/sv/100)*100;
  document.getElementById('stat-collected').textContent  = (a*cpp).toLocaleString() + ' 円';
  document.getElementById('total-response-count').textContent = list.length;
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

function saveDBSettings() {
  const g = document.getElementById('gas-url-input').value.trim();
  const np = document.getElementById('new-pin-input').value.trim();

  g ? localStorage.setItem('gas_url',g) : localStorage.removeItem('gas_url');
  if (np && np.length >= 4) {
    localStorage.setItem('kanji_pin', np);
  }

  toast('設定を保存しました。');
  closeDBModal();
}

/* ─── Hamburger Nav ─── */
function initNav() {
  const burger = document.getElementById('nav-burger');
  const menu = document.getElementById('nav-menu');
  if (!burger || !menu) return;
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    menu.classList.toggle('open');
  });
  menu.querySelectorAll('[data-nav]').forEach(l => l.addEventListener('click', () => {
    burger.classList.remove('open');
    menu.classList.remove('open');
  }));
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
  tick(); setInterval(tick, 1000);
  updateCalculator();
  initNav();
  document.getElementById('open-pin-btn').addEventListener('click', openPINModal);
});
