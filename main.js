(() => {
  const tiho = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = typeof window.gsap !== 'undefined' ? window.gsap : null;
  if (G && window.ScrollTrigger) G.registerPlugin(ScrollTrigger);
  const WA = '79060982693';

  /* Цены «Оскара» от Елизаветы: когда будут, вписать сюда, и расчёт сразу покажет сумму.
     { baza: цена за bazaChasov часов, bazaChasov: 4, chas: доплата за час сверх, brending: доплата за брендинг } */
  const CENY = null;

  /* ---------- вспышка при открытии: 3, 2, 1, вспышка ---------- */
  const vsp = document.querySelector('[data-vspyshka]');
  const geroyFoto = document.querySelector('.geroy__foto img');
  const geroyTekst = document.querySelectorAll('.geroy__tekst > *');
  let byla = false;
  try { byla = sessionStorage.getItem('oskar-vspyshka') === '1'; } catch (_) {}
  if (G && !tiho && !byla && vsp) {
    try { sessionStorage.setItem('oskar-vspyshka', '1'); } catch (_) {}
    vsp.classList.add('is-on');
    const cifra = vsp.querySelector('[data-otschet]');
    const svet = vsp.querySelector('.vspyshka__svet');
    G.set(geroyTekst, { opacity: 0, y: 24 });
    G.set(geroyFoto, { scale: 1.14, filter: 'brightness(1.8) saturate(.4)' });
    const tl = G.timeline();
    ['3', '2', '1'].forEach((c, i) => {
      tl.call(() => { cifra.textContent = c; })
        .fromTo(cifra, { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .16, ease: 'power2.out' }, i ? '>' : 0)
        .to(cifra, { opacity: 0, duration: .16, delay: .12 });
    });
    tl.set(vsp, { background: 'transparent' })
      .to(svet, { opacity: 1, duration: .06 })
      .to(svet, { opacity: 0, duration: .7, ease: 'power2.out' })
      .to(geroyFoto, { scale: 1, filter: 'brightness(.92) saturate(.92)', duration: 1.6, ease: 'power3.out' }, '<')
      .to(geroyTekst, { opacity: 1, y: 0, duration: .9, stagger: .08, ease: 'power3.out' }, '<.15')
      .set(vsp, { display: 'none' });
  } else if (G && !tiho && geroyFoto) {
    G.from(geroyFoto, { scale: 1.08, duration: 1.8, ease: 'power3.out' });
    G.from(geroyTekst, { opacity: 0, y: 20, duration: .9, stagger: .07, ease: 'power3.out' });
  }

  /* ---------- общее состояние: дата, часы, оформление ---------- */
  const daty = [...document.querySelectorAll('[data-data]')];
  const raschet = document.querySelector('[data-raschet]');
  const sost = () => {
    const d = new FormData(raschet);
    return { data: daty[0].value || daty[1].value, chasy: d.get('chasy') || '6', vid: d.get('vid') || 'классика' };
  };
  const segodnya = new Date(); segodnya.setMinutes(segodnya.getMinutes() - segodnya.getTimezoneOffset());
  const MES = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const pokazy = [...document.querySelectorAll('[data-pokaz]')];
  const pokazat = v => pokazy.forEach(p => {
    if (v) { const [g, m, d] = v.split('-'); p.textContent = `${+d} ${MES[+m - 1]} ${g}`; p.classList.remove('is-pusto'); }
    else { p.textContent = 'выберите день'; p.classList.add('is-pusto'); }
  });
  pokazat('');
  daty.forEach(inp => {
    inp.min = segodnya.toISOString().slice(0, 10);
    inp.addEventListener('click', () => { try { inp.showPicker && inp.showPicker(); } catch (_) {} });
    inp.addEventListener('change', () => {
      daty.forEach(o => { if (o !== inp) o.value = inp.value; });
      pokazat(inp.value);
      oshibka(false);
      obnovit(true);
    });
  });
  const dd_mm = iso => { const [g, m, d] = iso.split('-'); return { korotko: `${d}.${m}`, polno: `${d}.${m}.${g}` }; };

  function oshibka(on) {
    document.querySelector('[data-oshibka]')?.classList.toggle('is-on', on);
    daty.forEach(i => i.setAttribute('aria-invalid', on ? 'true' : 'false'));
    document.querySelectorAll('.data-bystro__pole, .data-ramka').forEach(r => r.classList.toggle('is-oshibka', on));
  }
  function otkrytKalendar(inp) {
    inp.focus({ preventScroll: true });
    try { inp.showPicker && inp.showPicker(); } catch (_) {}
  }
  function vWhatsApp() {
    const s = sost();
    const t = [
      `Здравствуйте! Свободна ли фотобудка «Оскар» ${dd_mm(s.data).polno}?`,
      `Нужна на ${s.chasy} ч., оформление: ${s.vid}.`,
      'Пришлите, пожалуйста, расчёт.'
    ].join('\n');
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  }

  /* ---------- 1. первый экран: дата и кнопка, два касания ---------- */
  document.querySelector('[data-bystro]')?.addEventListener('submit', e => {
    e.preventDefault();
    const inp = e.currentTarget.querySelector('[data-data]');
    if (!inp.value) { oshibka(true); otkrytKalendar(inp); return; }
    vWhatsApp();
  });

  /* ---------- 2. расчёт: лента в лотке печатает выбор ---------- */
  const lenta = document.querySelector('[data-lenta]');
  const lotokIn = lenta?.parentElement;
  const z = k => document.querySelector(`[data-z="${k}"]`);
  const itog = document.querySelector('[data-itog]');

  function pechat(bystro) {
    if (!lenta) return;
    const H = lotokIn.clientHeight, L = lenta.offsetHeight, S = lenta.offsetWidth;
    const vniz = Math.max(0, H - L - H * .035);
    if (!G || tiho) { lenta.style.transform = `translate(${S * .2}px, ${vniz}px) rotate(4deg)`; return; }
    G.killTweensOf(lenta);
    G.set(lenta, { x: 0, y: -L - 4, rotation: 0, transformOrigin: '50% 100%' });
    const tl = G.timeline({ delay: bystro ? .05 : .3 });
    for (let i = 1; i <= 4; i++) {
      tl.to(lenta, { y: -L + (L / 4) * i, duration: bystro ? .26 : .55, ease: 'power2.inOut' });
      if (i < 4) tl.to({}, { duration: bystro ? .05 : .18 });
    }
    tl.to(lenta, { y: vniz, duration: .4, ease: 'power2.in' })
      .to(lenta, { rotation: 4, x: S * .2, duration: .7, ease: 'back.out(2.2)' }, '-=.04');
  }

  const rub = n => n.toLocaleString('ru-RU') + ' ₽';
  function obnovit(novayaData) {
    const s = sost();
    z('data').textContent = s.data ? dd_mm(s.data).korotko : 'ваша дата';
    z('chasy').textContent = s.chasy;
    z('vid').textContent = s.vid === 'классика' ? 'классика' : 'ваш бренд';
    const admin = document.querySelector('[data-v-admin]');
    const vid = document.querySelector('[data-v-vid]');
    admin.textContent = `Администратор все ${s.chasy} ${+s.chasy < 5 ? 'часа' : 'часов'}`;
    vid.textContent = s.vid === 'классика' ? 'Классика: золото и красный бархат' : 'Короб, штора, экран и лента в вашем бренде';
    [admin, vid].forEach(li => { li.classList.remove('is-novoe'); void li.offsetWidth; li.classList.add('is-novoe'); });
    if (CENY) {
      const summa = CENY.baza + Math.max(0, s.chasy - CENY.bazaChasov) * CENY.chas + (s.vid === 'классика' ? 0 : CENY.brending);
      itog.innerHTML = `Ориентир по вашему выбору<b>${rub(summa)}</b>`;
    }
    if (novayaData) pechat(true);
  }
  raschet?.addEventListener('change', e => { if (!e.target.matches('[data-data]')) obnovit(false); });

  if (lotokIn && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { pechat(false); io.disconnect(); } }, { threshold: .45 });
    io.observe(lotokIn);
  } else pechat(false);

  document.querySelector('[data-otpravit]')?.addEventListener('click', () => {
    const inp = document.querySelector('#r-data');
    if (!sost().data) { oshibka(true); otkrytKalendar(inp); return; }
    vWhatsApp();
  });

  /* ---------- 3. бренд: надпись загорается на коробе ---------- */
  const korob = document.querySelector('[data-korob]');
  const korobT = document.querySelector('[data-korob-tekst]');
  const vvod = document.querySelector('[data-korob-vvod]');
  function nadpis(t) {
    const txt = (t || '').trim();
    if (!txt) { korobT.textContent = 'PHOTOAUTOMAT'; return; }
    korobT.textContent = txt;
    korob.classList.add('is-on');
    if (G && !tiho) G.fromTo(korob, { filter: 'brightness(1.6)' }, { filter: 'brightness(1)', duration: .5, ease: 'power2.out' });
  }
  vvod?.addEventListener('input', () => nadpis(vvod.value));
  document.querySelectorAll('[data-primer]').forEach(b => b.addEventListener('click', () => { vvod.value = b.dataset.primer; nadpis(b.dataset.primer); }));
  document.querySelector('[data-v-brend]')?.addEventListener('click', () => {
    const r = document.querySelector('[data-vid-brend]'); if (r) { r.checked = true; obnovit(false); }
  });

  /* ---------- 4. почему дороже: арка меняет фото ---------- */
  const prichiny = [...document.querySelectorAll('[data-prichina]')];
  const arka = [...document.querySelectorAll('[data-arka]')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const n = e.target.dataset.prichina;
      prichiny.forEach(p => p.classList.toggle('is-on', p === e.target));
      arka.forEach(a => a.classList.toggle('is-on', a.dataset.arka === n));
    }), { rootMargin: '-45% 0px -45% 0px' });
    prichiny.forEach(p => io.observe(p));
  }

  /* ---------- ролики играют, только когда видны ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; if (!tiho) v.play().catch(() => {}); }
      else v.pause();
    }), { threshold: .25 });
    document.querySelectorAll('video[data-vidno]').forEach(v => io.observe(v));
  }

  /* ---------- дорожка логотипов ---------- */
  const dor = document.querySelector('[data-dorozhka]');
  if (dor && !tiho) [...dor.children].forEach(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); dor.appendChild(k); });

  /* ---------- появление при прокрутке ---------- */
  if ('IntersectionObserver' in window && !tiho) {
    const els = document.querySelectorAll('.razdel h2, .polosa, .gost__kadr, .priglashenie, .cifry li, .brend__kadr');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
    els.forEach(el => { el.classList.add('zhdet'); io.observe(el); });
  }

  /* ---------- закреплённая кнопка на телефоне ---------- */
  const nizbar = document.querySelector('[data-nizbar]');
  if (nizbar && 'IntersectionObserver' in window) {
    let geroyViden = true, raschetViden = false;
    const o = () => nizbar.classList.toggle('is-on', !geroyViden && !raschetViden);
    new IntersectionObserver(([e]) => { geroyViden = e.isIntersecting; o(); }).observe(document.querySelector('[data-bystro]'));
    new IntersectionObserver(([e]) => { raschetViden = e.isIntersecting; o(); }, { threshold: .2 }).observe(document.querySelector('.raschet__setka'));
  }
  document.querySelector('[data-nizbar-data]')?.addEventListener('click', e => {
    e.preventDefault();
    const inp = document.querySelector('#r-data');
    document.querySelector('#raschet').scrollIntoView({ behavior: tiho ? 'auto' : 'smooth' });
    if (!inp.value) otkrytKalendar(inp);
  });
})();
