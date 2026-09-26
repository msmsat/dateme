(() => {
  'use strict';

  const settings = window.DATE_INVITATION || {};
  const byId = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  for (const [id, value] of [
    ['date-value', settings.date],
    ['place-value', settings.place],
    ['dress-value', settings.dressCode]
  ]) {
    if (typeof value === 'string' && value.trim()) byId(id).textContent = value;
  }

  const secretButton = byId('moon-secret');
  secretButton.addEventListener('click', () => {
    const isOpen = secretButton.getAttribute('aria-expanded') === 'true';
    secretButton.setAttribute('aria-expanded', String(!isOpen));
    byId('moon-whisper').hidden = isOpen;
  });

  const dialog = byId('response-dialog');
  const copyButton = byId('copy-response');
  let reply = '';
  let trigger = null;
  let responseVersion = 0;
  let celebrationTimer;

  function celebrate() {
    if (reduceMotion.matches) return;
    const layer = byId('celebration');
    dialog.append(layer);
    layer.replaceChildren();
    clearTimeout(celebrationTimer);
    for (let i = 0; i < 24; i += 1) {
      const spark = document.createElement('span');
      const angle = (Math.PI * 2 * i) / 24;
      const distance = 100 + Math.random() * 170;
      spark.textContent = i % 3 === 0 ? '♥' : '♡';
      spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      spark.style.setProperty('--dy', `${Math.sin(angle) * distance - 40}px`);
      spark.style.setProperty('--rotation', `${Math.random() * 140 - 70}deg`);
      spark.style.animationDelay = `${Math.random() * .16}s`;
      spark.style.color = i % 2 ? '#c98694' : '#a13e54';
      layer.append(spark);
    }
    celebrationTimer = setTimeout(() => layer.replaceChildren(), 2300);
  }

  function openResponse(accepted, button) {
    closeMusicPanel(false);
    trigger = button;
    responseVersion += 1;
    reply = accepted
      ? settings.yesReply || 'Да, любимый, в понедельник в 19:30 я иду с тобой на свидание в Sumi Garden на Hybernská 17 ❤️'
      : settings.messageReply || 'Любимый, хочу тебе кое-что сказать ❤️';
    byId('response-kicker').textContent = accepted ? 'Это моё любимое «да».' : 'Всё, что у тебя на сердце.';
    byId('response-title').textContent = accepted ? 'Тогда это свидание, Лерусь.' : 'Я тебя слушаю, любимая.';
    byId('response-description').textContent = accepted
      ? 'Ты, я и столько объятий, сколько захочешь. А когда — маленький сюрприз.'
      : 'Напиши мне всё, что хочешь. Мне важно тебя слышать.';
    byId('reply-preview').textContent = accepted ? 'День и время нашей встречи спрятаны в ответе ♡' : reply;
    byId('reply-help').textContent = accepted
      ? 'И вставь в наш чат!!! И отправь мне!!!'
      : 'Отправь его мне в Telegram и допиши то, что у тебя на сердце.';
    byId('copy-status').textContent = '';
    copyButton.disabled = false;
    copyButton.querySelector('span').textContent = 'Скопируй ответ!!!';
    dialog.showModal();
    if (accepted) celebrate();
  }

  byId('accept-button').addEventListener('click', (event) => openResponse(true, event.currentTarget));
  byId('alternative-button').addEventListener('click', (event) => openResponse(false, event.currentTarget));
  byId('dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    responseVersion += 1;
    clearTimeout(celebrationTimer);
    byId('celebration').replaceChildren();
    trigger?.focus({ preventScroll: true });
  });

  copyButton.addEventListener('click', async () => {
    const activeVersion = responseVersion;
    const activeReply = reply;
    copyButton.disabled = true;
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(activeReply);
        copied = true;
      }
    } catch {
      // Некоторые встроенные браузеры не разрешают доступ к буферу.
    }
    if (activeVersion !== responseVersion || !dialog.open) return;
    if (!copied) {
      const field = document.createElement('textarea');
      field.value = activeReply;
      field.setAttribute('aria-hidden', 'true');
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;font-size:16px;';
      dialog.append(field);
      field.focus();
      field.select();
      field.setSelectionRange(0, field.value.length);
      try { copied = document.execCommand('copy'); } catch { copied = false; }
      field.remove();
    }
    byId('copy-status').textContent = copied
      ? 'Скопировано!!! Теперь вставь в наш чат и отправь мне ♡'
      : 'Браузер не разрешил копирование. Открой сайт в Safari или Chrome и попробуй ещё раз.';
    copyButton.querySelector('span').textContent = copied ? 'Ответ скопирован' : 'Попробовать ещё раз';
    copyButton.disabled = false;
    copyButton.focus({ preventScroll: true });
  });

  // Пытаемся запустить песню автоматически; браузер может потребовать нажатие Play.
  const soundButton = byId('sound-toggle');
  const musicPanel = byId('music-panel');
  const musicPlayer = byId('music-player');

  function closeMusicPanel(restoreFocus = true) {
    musicPlayer.replaceChildren();
    musicPanel.hidden = true;
    soundButton.setAttribute('aria-expanded', 'false');
    soundButton.setAttribute('aria-label', 'Открыть нашу песню');
    byId('sound-label').textContent = 'Наша песня';
    if (restoreFocus) soundButton.focus({ preventScroll: true });
  }

  function openMusicPanel(moveFocus = false) {
    const frame = document.createElement('iframe');
    frame.title = 'Miyagi & Andy Panda — По уши в тебя влюблён';
    frame.src = 'https://www.youtube-nocookie.com/embed/Wwg4JRZrVcs?autoplay=1&playsinline=1&rel=0';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allowFullscreen = true;
    musicPlayer.replaceChildren(frame);
    musicPanel.hidden = false;
    soundButton.setAttribute('aria-expanded', 'true');
    soundButton.setAttribute('aria-label', 'Закрыть нашу песню');
    byId('sound-label').textContent = 'Закрыть плеер';
    if (moveFocus) byId('music-close').focus({ preventScroll: true });
  }

  soundButton.addEventListener('click', () => {
    if (!musicPanel.hidden) closeMusicPanel();
    else openMusicPanel(true);
  });

  byId('music-close').addEventListener('click', () => closeMusicPanel());
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !musicPanel.hidden) closeMusicPanel();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) closeMusicPanel(false);
  });
  window.addEventListener('pagehide', () => closeMusicPanel(false));
  openMusicPanel();
})();
