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

  // Тихая оригинальная мелодия. Генерируется локально, без загрузок и трекеров.
  const soundButton = byId('sound-toggle');
  let audioContext;
  let masterGain;
  let musicTimer;
  let playing = false;
  let starting = false;
  let chordIndex = 0;
  const chords = [
    [146.83, 220, 293.66, 369.99, 440],
    [130.81, 196, 261.63, 329.63, 392],
    [110, 164.81, 220, 293.66, 329.63],
    [98, 146.83, 196, 246.94, 293.66]
  ];

  function setSoundUI(enabled) {
    soundButton.setAttribute('aria-pressed', String(enabled));
    soundButton.setAttribute('aria-label', enabled ? 'Выключить музыку' : 'Включить музыку');
    byId('sound-label').textContent = enabled ? 'Музыка для нас' : 'Звук выключен';
  }

  function playPhrase() {
    if (!playing || audioContext.state !== 'running') return;
    const notes = chords[chordIndex % chords.length];
    chordIndex += 1;
    notes.forEach((frequency, index) => {
      const start = audioContext.currentTime + index * .44;
      const oscillator = audioContext.createOscillator();
      const envelope = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(.16, start + .035);
      envelope.gain.exponentialRampToValueAtTime(.001, start + 4.1);
      oscillator.connect(envelope);
      envelope.connect(masterGain);
      oscillator.start(start);
      oscillator.stop(start + 4.2);
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    });
  }

  async function stopMusic() {
    playing = false;
    clearInterval(musicTimer);
    setSoundUI(false);
    if (!audioContext) return;
    const oldContext = audioContext;
    audioContext = undefined;
    try { await oldContext.close(); } catch { /* Контекст мог уже закрыться. */ }
  }

  soundButton.addEventListener('click', async () => {
    if (starting) return;
    if (playing) { await stopMusic(); return; }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      byId('sound-status').textContent = 'Этот браузер не поддерживает музыку. Приглашение можно открыть без неё.';
      return;
    }
    starting = true;
    try {
      audioContext = new AudioContextClass();
      masterGain = audioContext.createGain();
      masterGain.gain.value = .22;
      masterGain.connect(audioContext.destination);
      await audioContext.resume();
      if (document.hidden || !audioContext || audioContext.state !== 'running') {
        await stopMusic();
        return;
      }
      playing = true;
      chordIndex = 0;
      setSoundUI(true);
      playPhrase();
      musicTimer = setInterval(playPhrase, 4800);
    } catch {
      await stopMusic();
      byId('sound-status').textContent = 'Музыка не включилась. Можно попробовать ещё раз или продолжить без звука.';
    } finally { starting = false; }
  });

  document.addEventListener('visibilitychange', () => { if (document.hidden) void stopMusic(); });
  window.addEventListener('pagehide', () => { void stopMusic(); });
})();
