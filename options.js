(() => {
  'use strict';

  const api = typeof browser !== 'undefined' ? browser : chrome;

  const DEFAULTS = {
    enabled: true,
    maxHeight: 300,
    collapseAssistant: false,
  };

  const $enabled = document.getElementById('enabled');
  const $maxHeight = document.getElementById('maxHeight');
  const $collapseAssistant = document.getElementById('collapseAssistant');
  const $status = document.getElementById('status');

  async function load() {
    const stored = await api.storage.local.get(DEFAULTS);
    $enabled.checked = Boolean(stored.enabled);
    $maxHeight.value = String(stored.maxHeight);
    $collapseAssistant.checked = Boolean(stored.collapseAssistant);
  }

  document.getElementById('options').addEventListener('submit', async (event) => {
    event.preventDefault();
    const maxHeight = Math.min(3000, Math.max(80, Number($maxHeight.value) || 300));
    await api.storage.local.set({
      enabled: $enabled.checked,
      maxHeight,
      collapseAssistant: $collapseAssistant.checked,
    });
    $maxHeight.value = String(maxHeight);
    $status.textContent = 'Enregistré';
    setTimeout(() => { $status.textContent = ''; }, 1500);
  });

  load();
})();
