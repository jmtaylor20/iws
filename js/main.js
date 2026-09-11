/* Interior Woodwork Specialist — site behaviour (no dependencies) */
(function () {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');

  // Header turns solid once the page scrolls past the hero top
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile navigation
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('.nav a').forEach((a) =>
      a.addEventListener('click', () => document.body.classList.remove('nav-open'))
    );
  }

  // Signature wordmark: fall back to styled text if the logo file is missing
  document.querySelectorAll('.sig-wordmark img').forEach((img) => {
    const fail = () => img.parentElement.classList.add('no-img');
    if (img.complete && img.naturalWidth === 0) fail();
    img.addEventListener('error', fail);
  });

  // Reveal on scroll
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // Work page filters
  const filters = document.querySelectorAll('.filters button');
  const items = document.querySelectorAll('.masonry .item');
  filters.forEach((btn) =>
    btn.addEventListener('click', () => {
      filters.forEach((b) => b.classList.toggle('is-active', b === btn));
      const f = btn.dataset.filter;
      items.forEach((it) => it.classList.toggle('is-hidden', f !== 'all' && it.dataset.cat !== f));
    })
  );

  // Lightbox for any element with [data-full]
  const lb = document.querySelector('.lightbox');
  if (lb) {
    const img = lb.querySelector('img');
    const cap = lb.querySelector('.lb-cap');
    let list = [];
    let idx = 0;
    const visible = () => Array.from(document.querySelectorAll('[data-full]')).filter((el) => !el.classList.contains('is-hidden'));
    const show = (i) => {
      list = visible();
      idx = (i + list.length) % list.length;
      const el = list[idx];
      img.src = el.dataset.full;
      img.alt = el.dataset.caption || '';
      cap.textContent = el.dataset.caption || '';
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };
    const close = () => { lb.classList.remove('is-open'); document.body.style.overflow = ''; };
    document.querySelectorAll('[data-full]').forEach((el) =>
      el.addEventListener('click', (ev) => { ev.preventDefault(); show(visible().indexOf(el)); })
    );
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', () => show(idx - 1));
    lb.querySelector('.lb-next').addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  // Footer year
  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
})();
