(() => {
  'use strict';

  const menuButton = document.getElementById('siteMenuToggle');
  const nav = document.getElementById('siteNav');
  const toastRegion = document.getElementById('siteToast');

  function toast(message) {
    if (!toastRegion) return;
    const item = document.createElement('div');
    item.className = 'site-toast';
    item.innerHTML = '<svg class="site-icon" aria-hidden="true"><use href="#s-check"></use></svg><span></span>';
    item.querySelector('span').textContent = message;
    toastRegion.appendChild(item);
    window.setTimeout(() => item.remove(), 3600);
  }

  function closeMenu() {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    menuButton.innerHTML = '<svg class="site-icon" aria-hidden="true"><use href="#s-menu"></use></svg>';
    nav.classList.remove('open');
  }

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menuButton.innerHTML = `<svg class="site-icon" aria-hidden="true"><use href="#s-${open ? 'close' : 'menu'}"></use></svg>`;
    nav?.classList.toggle('open', open);
  });

  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.querySelectorAll('[data-demo-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.demoAction || 'This action';
      toast(`${action} is part of the product preview. No account or application was created.`);
    });
  });

  document.querySelectorAll('[data-service]').forEach((card) => {
    card.addEventListener('click', () => {
      const need = document.getElementById('quickNeed');
      if (need) {
        need.value = card.dataset.service || '';
        need.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });

  document.getElementById('coverageForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const area = document.getElementById('coverageArea')?.value || 'your area';
    const need = document.getElementById('quickNeed')?.value.trim();
    const areaNote = area === 'Other'
      ? 'That area is not represented in this sample coverage yet.'
      : `The preview is set to ${area}.`;
    const needNote = need ? ` “${need.slice(0, 70)}” was not sent or saved.` : 'No request details were sent or saved.';
    toast(`${areaNote} This demo does not check live availability or place orders.${needNote}`);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  const year = document.getElementById('footerYear');
  if (year) year.textContent = String(new Date().getUTCFullYear());
})();
