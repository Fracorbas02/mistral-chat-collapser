/*
 * Replie les messages trop longs sur chat.mistral.ai derrhère un bouton
 * « Afficher plus » / « Afficher moins ».
 *
 * Sélecteurs DOM (Le Chat, sept. 2026) :
 *   - conteneur de message : [data-message-author-role] (+ data-message-id)
 *   - contenu du message utilisateur : .select-text
 * Si l'UI de Mistral change, ajuster MESSAGE_SELECTOR / CONTENT_SELECTOR ci-dessous.
 */
(() => {
  'use strict';

  if (window.__mbxCollapserLoaded) return;
  window.__mbxCollapserLoaded = true;

  const MESSAGE_SELECTOR_ALL = '[data-message-author-role]';
  const MESSAGE_SELECTOR_USER = '[data-message-author-role="user"]';
  const CONTENT_SELECTOR = '.select-text';

  const DEFAULT_SETTINGS = {
    enabled: true,
    maxHeight: 300, // hauteur (px) au-delà de laquelle un message est replié
    collapseAssistant: false,
  };

  const CLASS_HOST = 'mbx-host';
  const CLASS_CLAMPED = 'mbx-clamped';
  const CLASS_TOGGLE = 'mbx-toggle';
  const LABEL_MORE = 'Afficher plus';
  const LABEL_LESS = 'Afficher moins';
  const HYSTERESIS_PX = 40; // évite le clignotement autour du seuil
  const MAX_REMEMBERED_IDS = 1000;

  const api = typeof browser !== 'undefined' ? browser : chrome;

  let settings = { ...DEFAULT_SETTINGS };
  const expandedIds = new Set(); // messages que l'utilisateur a ouverts
  let scanTimer = null;
  let warnedOnce = false;

  function applyMaxHeightVar() {
    document.documentElement.style.setProperty('--mbx-max', `${settings.maxHeight}px`);
  }

  async function loadSettings() {
    try {
      const stored = await api.storage.local.get(DEFAULT_SETTINGS);
      settings = { ...DEFAULT_SETTINGS, ...stored };
    } catch (e) {
      // stockage inisponible (ex. chargement sans permission) : on garde les défauts
    }
    applyMaxHeightVar();
    scheduleScan();
  }

  function messageSelector() {
    return settings.collapseAssistant ? MESSAGE_SELECTOR_ALL : MESSAGE_SELECTOR_USER;
  }

  function isEditing(container) {
    return Boolean(container.querySelector('textarea, [contenteditable="true"]'));
  }

  function contentElementOf(container) {
    return container.querySelector(CONTENT_SELECTOR) || container;
  }

  function findToggle(container) {
    return container.querySelector(`:scope > .${CLASS_TOGGLE}`);
  }

  function rememberExpanded(id) {
    expandedIds.add(id);
    if (expandedIds.size > MAX_REMEMBERED_IDS) {
      expandedIds.delete(expandedIds.values().next().value);
    }
  }

  function forgetExpanded(id) {
    expandedIds.delete(id);
  }

  function unclamp(container, contentEl) {
    contentEl.classList.remove(CLASS_CLAMPED);
    container.classList.remove(CLASS_HOST);
    const btn = findToggle(container);
    if (btn) btn.remove();
  }

  function clamp(container, contentEl) {
    container.classList.add(CLASS_HOST);
    contentEl.classList.add(CLASS_CLAMPED);

    let btn = findToggle(container);
    if (btn) return; // déjà en place

    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = CLASS_TOGGLE;
    btn.textContent = LABEL_MORE;
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const id = container.getAttribute('data-message-id');
      if (contentEl.classList.contains(CLASS_CLAMPED)) {
        contentEl.classList.remove(CLASS_CLAMPED);
        btn.textContent = LABEL_LESS;
        btn.setAttribute('aria-expanded', 'true');
        if (id) rememberExpanded(id);
      } else {
        contentEl.classList.add(CLASS_CLAMPED);
        btn.textContent = LABEL_MORE;
        btn.setAttribute('aria-expanded', 'false');
        if (id) forgetExpanded(id);
      }
    });
    container.appendChild(btn);
  }

  function processContainer(container) {
    if (!container.isConnected) return;
    const contentEl = contentElementOf(container);
    if (!(contentEl instanceof HTMLElement)) return;

    if (!settings.enabled || isEditing(container)) {
      unclamp(container, contentEl);
      return;
    }

    const id = container.getAttribute('data-message-id');
    // scrollHeight renvoie la hauteur compléte du contenu, même sous max-height
    const isTooTall = contentEl.scrollHeight > settings.maxHeight + HYSTERESIS_PX;

    if (!isTooTall) {
      unclamp(container, contentEl);
      return;
    }
    if (id && expandedIds.has(id)) {
      // l'utilisateur a déjà ouvert ce message : on le laisse dépljé
      contentEl.classList.remove(CLASS_CLAMPED);
      return;
    }
    clamp(container, contentEl);
  }

  function scan() {
    const containers = document.querySelectorAll(messageSelector());
    if (containers.length === 0) warnOnceIfEmpty();
    containers.forEach(processContainer);
  }

  function warnOnceIfEmpty() {
    if (warnedOnce) return;
    warnedOnce = true;
    setTimeout(() => {
      if (document.querySelectorAll(MESSAGE_SELECTOR_ALL).length === 0) {
        console.warn(
          '[MistralCollapser] Aucun message détecté. Le DOM de chat.mistral.ai ' +
            'a peut-mêtre changé : mettez à jour les sélecteurs dans content.js.'
        );
      }
    }, 15000);
  }

  function scheduleScan() {
    if (scanTimer !== null) return;
    scanTimer = setTimeout(() => {
      scanTimer = null;
      scan();
    }, 150);
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('resize', scheduleScan);

  // filet de sécurité : images qui chargent, rendus tardifs, streaming
  setInterval(() => {
    if (!document.hidden) scan();
  }, 2000);

  if (api.storage && api.storage.onChanged) {
    api.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      for (const [key, { newValue }] of Object.entries(changes)) {
        settings[key] = newValue;
      }
      applyMaxHeightVar();
      scheduleScan();
    });
  }

  loadSettings();
})();
