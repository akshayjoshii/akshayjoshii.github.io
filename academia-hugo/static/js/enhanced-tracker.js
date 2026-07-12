(function () {
  'use strict';

  var config = window.akjoAnalyticsConfig || {};
  var endpoint = config.endpoint || '/analytics/v1/events';
  var sessionKey = 'akjo_instagram_analytics_session';
  var eventName = /^[a-z][a-z0-9_]{0,63}$/;

  function privacyOptOutEnabled() {
    return navigator.globalPrivacyControl === true ||
      navigator.doNotTrack === '1' ||
      window.doNotTrack === '1';
  }

  function isInstagramVisit() {
    var userAgent = navigator.userAgent || '';
    if (/Instagram/i.test(userAgent)) return true;

    var params = new URLSearchParams(window.location.search);
    var source = (params.get('utm_source') || '').toLowerCase();
    if (source === 'instagram' || source === 'ig') return true;

    return (document.referrer || '').toLowerCase().indexOf('instagram.com') !== -1;
  }

  function getSessionId() {
    try {
      var existing = sessionStorage.getItem(sessionKey);
      if (existing) return existing;

      var id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'xxxx-xxxx-4xxx-yxxx-xxxxxxxx'.replace(/[xy]/g, function (character) {
          var value = Math.floor(Math.random() * 16);
          return (character === 'x' ? value : (value & 0x3) | 0x8).toString(16);
        });
      sessionStorage.setItem(sessionKey, id);
      return id;
    } catch (error) {
      return null;
    }
  }

  function cleanCampaignValue(value) {
    if (typeof value !== 'string') return null;
    var cleaned = value.trim().slice(0, 80);
    return cleaned || null;
  }

  function campaignFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var campaign = {};
    ['source', 'medium', 'campaign', 'content'].forEach(function (field) {
      var value = cleanCampaignValue(params.get('utm_' + field));
      if (value) campaign[field] = value;
    });
    return Object.keys(campaign).length ? campaign : undefined;
  }

  function send(event) {
    var body = JSON.stringify(event);
    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        if (navigator.sendBeacon(endpoint, blob)) return;
      }
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true,
        credentials: 'omit'
      }).catch(function () {});
    } catch (error) {
      // Analytics must never interfere with page behavior.
    }
  }

  function track(name) {
    if (!eventName.test(name || '')) return;
    var sessionId = getSessionId();
    if (!sessionId) return;

    send({
      schemaVersion: 1,
      source: 'instagram',
      event: name,
      sessionId: sessionId,
      occurredAt: new Date().toISOString(),
      page: { path: window.location.pathname || '/' },
      campaign: campaignFromUrl()
    });
  }

  window.akjoAnalytics = Object.freeze({ track: track });

  if (!privacyOptOutEnabled() && isInstagramVisit()) {
    track('page_view');
  }
})();
