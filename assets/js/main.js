(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAIL = 'moritz.kottmus1234@gmail.com';
  const PHONE_HTML = '<a href="tel:+4917624217499">0176 24217499</a>';

  /* Header beim Scrollen */
  const hdr = $('.hdr');
  const onScroll = () => hdr && hdr.classList.toggle('scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile-Menü */
  const burger = $('.burger');
  const nav = $('#nav');
  if (hdr && burger && nav) {
    const setOpen = (open) => {
      hdr.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    };
    burger.addEventListener('click', () => setOpen(!hdr.classList.contains('open')));
    $$('a', nav).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 960) setOpen(false); });
  }

  /* Einblenden beim Scrollen */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* Aktiven Menüpunkt markieren */
  const links = $$('.nav a[href^="#"]:not(.btn)');
  if ('IntersectionObserver' in window && links.length) {
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((l) => l.classList.remove('active'));
        const link = byId.get(en.target.id);
        if (link) link.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => spy.observe(s));
  }

  /* Workflow-Animation im Hero */
  const flow = $('.flow-steps');
  if (flow) {
    const steps = [...flow.children];
    if (reduce) {
      steps.forEach((s) => s.classList.add('on'));
      flow.style.setProperty('--s', steps.length - 1);
    } else {
      let i = 0;
      const tick = () => {
        if (i < steps.length) {
          flow.style.setProperty('--s', i);
          steps[i].classList.add('on');
          i += 1;
          setTimeout(tick, 1100);
        } else {
          setTimeout(() => {
            flow.classList.add('reset');
            steps.forEach((s) => s.classList.remove('on'));
            flow.style.setProperty('--s', 0);
            requestAnimationFrame(() => requestAnimationFrame(() => flow.classList.remove('reset')));
            i = 0;
            setTimeout(tick, 600);
          }, 2000);
        }
      };
      setTimeout(tick, 700);
    }
  }

  /* Zeitersparnis-Rechner */
  const rc = $('#r-count');
  const rm = $('#r-min');
  const rp = $('#r-pct');
  if (rc && rm && rp) {
    const fmt = (n) => n.toLocaleString('de-DE', { maximumFractionDigits: n < 10 ? 1 : 0 });
    const paint = (r) => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min)) * 100 + '%');
    const calc = () => {
      [rc, rm, rp].forEach(paint);
      $('#o-count').textContent = rc.value;
      $('#o-min').textContent = rm.value;
      $('#o-pct').textContent = rp.value + ' %';
      const hours = (Number(rc.value) * Number(rm.value) * (Number(rp.value) / 100) * 52) / 12 / 60;
      $('#o-hours').textContent = fmt(hours);
      $('#o-days').textContent = fmt((hours * 12) / 8);
    };
    [rc, rm, rp].forEach((r) => r.addEventListener('input', calc));
    calc();
  }

  /* Kontaktformular (FormSubmit, Ersatzweg: E-Mail-Programm) */
  const form = $('#contact-form');
  if (form) {
    const status = $('.form-status', form);
    const btn = $('button[type="submit"]', form);
    const openMail = (d) => {
      const body = [
        `Name: ${d.name}`,
        `E-Mail: ${d.email}`,
        `Telefon: ${d.telefon || '-'}`,
        `Unternehmen: ${d.unternehmen || '-'}`,
        `Interesse: ${d.interesse || '-'}`,
        '',
        d.nachricht,
      ].join('\n');
      window.location.href = `mailto:${MAIL}?subject=${encodeURIComponent('Anfrage über die Website – ' + d.name)}&body=${encodeURIComponent(body)}`;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const d = Object.fromEntries(new FormData(form).entries());
      if (d._honey) return;

      btn.disabled = true;
      status.className = 'form-status';
      status.textContent = 'Wird gesendet …';
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${MAIL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            Name: d.name,
            email: d.email,
            Telefon: d.telefon || '-',
            Unternehmen: d.unternehmen || '-',
            Interesse: d.interesse || '-',
            Nachricht: d.nachricht,
            _subject: `Neue Anfrage über die Website – ${d.name}`,
            _template: 'table',
            _captcha: 'false',
          }),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || String(out.success) !== 'true') throw new Error(out.message || 'Versand fehlgeschlagen');
        form.reset();
        status.className = 'form-status ok';
        status.textContent = 'Vielen Dank! Ihre Anfrage ist angekommen – wir melden uns schnellstmöglich bei Ihnen.';
      } catch (err) {
        status.className = 'form-status err';
        status.innerHTML = `Der direkte Versand hat gerade nicht geklappt. Ihr E-Mail-Programm öffnet sich mit Ihrer Nachricht – oder rufen Sie einfach an: ${PHONE_HTML}.`;
        openMail(d);
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* Jahreszahl im Footer */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
