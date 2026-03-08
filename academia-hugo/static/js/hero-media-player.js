(function () {
  'use strict';

  var OPEN_CLASS = 'hero-media-modal-open';

  function parseNumber(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function formatSeconds(value) {
    var total = Math.max(0, Math.floor(value));
    var minutes = Math.floor(total / 60);
    var seconds = total % 60;
    return minutes + ':' + String(seconds).padStart(2, '0');
  }

  function syncToggleLabel(toggleBtn, audio) {
    if (!toggleBtn) return;
    var isPlaying = !!audio && !audio.paused;
    toggleBtn.textContent = isPlaying ? 'Pause Music' : 'Play Music';
    toggleBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
  }

  function initHeroMedia(trigger) {
    var targetId = trigger.getAttribute('data-hero-media-target');
    if (!targetId) return;

    var modal = document.getElementById(targetId);
    if (!modal) return;
    if (modal.parentElement !== document.body) {
      document.body.appendChild(modal);
    }

    var dialog = modal.querySelector('.hero-media-modal__dialog');
    var closeButtons = modal.querySelectorAll('[data-hero-media-close]');
    var toggleButton = modal.querySelector('[data-hero-media-toggle]');
    var statusEl = modal.querySelector('[data-hero-media-status]');
    var audio = modal.querySelector('[data-hero-media-audio]');

    if (!dialog) return;

    var loopStart = parseNumber(modal.getAttribute('data-loop-start'), 16);
    var loopEnd = parseNumber(modal.getAttribute('data-loop-end'), 42);
    if (loopEnd <= loopStart) loopEnd = loopStart + 26;

    if (statusEl) {
      statusEl.textContent = 'Looping ' + formatSeconds(loopStart) + '-' + formatSeconds(loopEnd);
    }

    var lastFocused = null;

    function setStatus(text) {
      if (statusEl) statusEl.textContent = text;
    }

    function resetAudio() {
      if (!audio) return;
      audio.pause();
      if (audio.readyState > 0) {
        audio.currentTime = loopStart;
      }
      syncToggleLabel(toggleButton, audio);
    }

    function ensureAudioStartPosition() {
      if (!audio) return;
      if (audio.readyState > 0) {
        audio.currentTime = loopStart;
        return;
      }
      var onMeta = function () {
        audio.currentTime = loopStart;
        audio.removeEventListener('loadedmetadata', onMeta);
      };
      audio.addEventListener('loadedmetadata', onMeta);
    }

    function playSegment() {
      if (!audio || !audio.getAttribute('src')) {
        if (toggleButton) toggleButton.disabled = true;
        setStatus('No audio source configured');
        return;
      }

      function startPlayback() {
        if (audio.currentTime < loopStart || audio.currentTime >= loopEnd) {
          audio.currentTime = loopStart;
        }

        var playAttempt = audio.play();
        if (playAttempt && typeof playAttempt.catch === 'function') {
          playAttempt.catch(function () {
            syncToggleLabel(toggleButton, audio);
            setStatus('Tap Play Music to start audio');
          });
        }
      }

      if (audio.readyState === 0) {
        var onMeta = function () {
          audio.currentTime = loopStart;
          startPlayback();
          audio.removeEventListener('loadedmetadata', onMeta);
        };
        audio.addEventListener('loadedmetadata', onMeta);
        audio.load();
      } else {
        startPlayback();
      }

      syncToggleLabel(toggleButton, audio);
      setStatus('Looping ' + formatSeconds(loopStart) + '-' + formatSeconds(loopEnd));
    }

    function openModal() {
      lastFocused = document.activeElement;
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add(OPEN_CLASS);

      requestAnimationFrame(function () {
        modal.classList.add('is-open');
      });

      ensureAudioStartPosition();
      playSegment();

      if (toggleButton) {
        toggleButton.focus();
      } else {
        var closeButton = modal.querySelector('.hero-media-modal__close');
        if (closeButton) closeButton.focus();
      }
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove(OPEN_CLASS);
      resetAudio();
      setTimeout(function () {
        modal.hidden = true;
      }, 180);
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    trigger.addEventListener('click', function () {
      openModal();
    });

    closeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeModal();
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) {
        closeModal();
      }
    });

    if (audio) {
      audio.addEventListener('timeupdate', function () {
        if (audio.currentTime >= loopEnd) {
          audio.currentTime = loopStart;
          if (audio.paused) return;
          var resume = audio.play();
          if (resume && typeof resume.catch === 'function') {
            resume.catch(function () {
              syncToggleLabel(toggleButton, audio);
            });
          }
        }
      });

      audio.addEventListener('play', function () {
        syncToggleLabel(toggleButton, audio);
      });

      audio.addEventListener('pause', function () {
        syncToggleLabel(toggleButton, audio);
      });

      audio.addEventListener('ended', function () {
        audio.currentTime = loopStart;
        var replay = audio.play();
        if (replay && typeof replay.catch === 'function') {
          replay.catch(function () {
            syncToggleLabel(toggleButton, audio);
          });
        }
      });
    }

    if (toggleButton) {
      toggleButton.addEventListener('click', function () {
        if (!audio || !audio.getAttribute('src')) return;
        if (audio.paused) {
          playSegment();
        } else {
          audio.pause();
          setStatus('Music paused');
        }
      });
    }
  }

  function init() {
    var triggers = document.querySelectorAll('[data-hero-media-trigger]');
    if (!triggers.length) return;
    triggers.forEach(initHeroMedia);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
