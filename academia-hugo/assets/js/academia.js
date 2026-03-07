/*************************************************
 *  academia
 *  https://github.com/gcushen/hugo-academia
 *
 *  Core JS functions and initialization.
 **************************************************/

(function ($) {

  /* ---------------------------------------------------------------------------
   * Responsive scrolling for URL hashes.
   * --------------------------------------------------------------------------- */

  // Dynamically get responsive navigation bar offset.
  let $navbar = $('.navbar');
  let navbar_offset = $navbar.innerHeight();
  const assetConfig = window.academiaAssetConfig || {};
  const mobileConfig = window.academiaMobileConfig || {};
  const mapConfig = window.academiaMapConfig || {};
  const mobilePanelQuery = window.matchMedia('(max-width: 1024px)');
  let mapInitPromise = null;
  let mapInitialized = false;
  let fancyboxInitPromise = null;

  function updateNavbarOffset() {
    navbar_offset = $navbar.innerHeight();
  }

  function markOverflowingElements() {
    let debugParam = mobileConfig.overflowDebugParam || 'debugOverflow';
    let params = new URLSearchParams(window.location.search);
    if (!params.has(debugParam)) {
      return;
    }
    document.documentElement.classList.add('debug-overflow');
    document.querySelectorAll('.overflow-debug-target').forEach(function (el) {
      el.classList.remove('overflow-debug-target');
    });
    document.querySelectorAll('body *').forEach(function (el) {
      if ((el.scrollWidth - el.clientWidth) > 1) {
        el.classList.add('overflow-debug-target');
      }
    });
  }

  /**
   * Responsive hash scrolling.
   * Check for a URL hash as an anchor.
   * If it exists on current page, scroll to it responsively.
   * If `target` argument omitted (e.g. after event), assume it's the window's hash.
   */
  function scrollToAnchor(target) {
    // If `target` is undefined or HashChangeEvent object, set it to window's hash.
    target = (typeof target === 'undefined' || typeof target === 'object') ? window.location.hash : target;
    // Escape colons from IDs, such as those found in Markdown footnote links.
    target = target.replace(/:/g, '\\:');

    // If target element exists, scroll to it taking into account fixed navigation bar offset.
    if ($(target).length) {
      $('body').addClass('scrolling');
      $('html, body').animate({
        scrollTop: $(target).offset().top - navbar_offset
      }, 600, function () {
        $('body').removeClass('scrolling');
      });
    }
  }

  // Make Scrollspy responsive.
  function fixScrollspy() {
    let $body = $('body');
    let data = $body.data('bs.scrollspy');
    if (data) {
      data._config.offset = navbar_offset;
      $body.data('bs.scrollspy', data);
      $body.scrollspy('refresh');
    }
  }

  function removeQueryParamsFromUrl() {
    if (window.history.pushState) {
      let urlWithoutSearchParams = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash;
      window.history.pushState({
        path: urlWithoutSearchParams
      }, '', urlWithoutSearchParams);
    }
  }

  // Check for hash change event and fix responsive offset for hash links (e.g. Markdown footnotes).
  window.addEventListener("hashchange", scrollToAnchor);

  /* ---------------------------------------------------------------------------
   * Add smooth scrolling to all links inside the main navbar.
   * --------------------------------------------------------------------------- */


  // animation scroll js
  var html_body = $('html, body');
  $('nav a, .page-scroll').on('click', function () { //use page-scroll class in any HTML tag for scrolling
    if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name="' + this.hash.slice(1) + '"]');
      if (target.length) {
        html_body.animate({
          scrollTop: target.offset().top - navbar_offset
        }, 1500, 'easeInOutExpo');
        return false;
      }
    }
  });

  // easeInOutExpo Declaration
  jQuery.extend(jQuery.easing, {
    easeInOutExpo: function (x, t, b, c, d) {
      if (t === 0) {
        return b;
      }
      if (t === d) {
        return b + c;
      }
      if ((t /= d / 2) < 1) {
        return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
      }
      return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
    }
  });

  /* ---------------------------------------------------------------------------
   * Hide mobile collapsable menu on clicking a link.
   * --------------------------------------------------------------------------- */

  function isMobilePanelActive() {
    return mobilePanelQuery.matches;
  }

  function setNavMenuState(isOpen) {
    if (!isMobilePanelActive()) {
      $('body').removeClass('nav-menu-open');
      return;
    }
    $('body').toggleClass('nav-menu-open', isOpen);
    $('#navbar').attr('aria-hidden', (!isOpen).toString());
    $('.js-navbar-toggler').attr('aria-expanded', isOpen.toString());
    $('.js-navbar-close').attr('aria-expanded', isOpen.toString());
  }

  $(document).on('click', '.navbar-collapse.show', function (e) {
    let targetElement = $(e.target).is('a') ? $(e.target) : $(e.target).closest('a');
    if (targetElement.length && !targetElement.hasClass('dropdown-toggle')) {
      $(this).collapse('hide');
    }
  });

  $('#navbar').on('show.bs.collapse', function () {
    setNavMenuState(true);
  });

  $('#navbar').on('hidden.bs.collapse', function () {
    setNavMenuState(false);
  });

  $(document).on('click', function (e) {
    if (!isMobilePanelActive()) {
      return;
    }
    let $menu = $('#navbar');
    let $toggler = $('.js-navbar-toggler');
    if ($menu.hasClass('show') && !$menu.is(e.target) && $menu.has(e.target).length === 0 && !$toggler.is(e.target) && $toggler.has(e.target).length === 0) {
      $menu.collapse('hide');
    }
  });

  /* ---------------------------------------------------------------------------
   * Filter publications.
   * --------------------------------------------------------------------------- */

  // Active publication filters.
  let pubFilters = {};

  // Search term.
  let searchRegex;

  // Filter values (concatenated).
  let filterValues;

  // Publication container.
  let $grid_pubs = $('#container-publications');

  if ($grid_pubs.length) {
    // Initialise Isotope.
    $grid_pubs.isotope({
      itemSelector: '.isotope-item',
      percentPosition: true,
      masonry: {
        // Use Bootstrap compatible grid layout.
        columnWidth: '.grid-sizer'
      },
      filter: function () {
        let $this = $(this);
        let searchResults = searchRegex ? $this.text().match(searchRegex) : true;
        let filterResults = filterValues ? $this.is(filterValues) : true;
        return searchResults && filterResults;
      }
    });

    // Filter by search term.
    let $quickSearch = $('.filter-search').keyup(debounce(function () {
      searchRegex = new RegExp($quickSearch.val(), 'gi');
      $grid_pubs.isotope();
    }));
  }

  // Debounce input to prevent spamming filter requests.
  function debounce(fn, threshold) {
    let timeout;
    threshold = threshold || 100;
    return function debounced() {
      clearTimeout(timeout);
      let args = arguments;
      let _this = this;

      function delayed() {
        fn.apply(_this, args);
      }
      timeout = setTimeout(delayed, threshold);
    };
  }

  // Flatten object by concatenating values.
  function concatValues(obj) {
    let value = '';
    for (let prop in obj) {
      value += obj[prop];
    }
    return value;
  }

  $('.pub-filters').on('change', function () {
    if (!$grid_pubs.length) {
      return;
    }
    let $this = $(this);

    // Get group key.
    let filterGroup = $this[0].getAttribute('data-filter-group');

    // Set filter for group.
    pubFilters[filterGroup] = this.value;

    // Combine filters.
    filterValues = concatValues(pubFilters);

    // Activate filters.
    $grid_pubs.isotope();

    // If filtering by publication type, update the URL hash to enable direct linking to results.
    if (filterGroup == "pubtype") {
      // Set hash URL to current filter.
      let url = $(this).val();
      if (url.substr(0, 9) == '.pubtype-') {
        window.location.hash = url.substr(9);
      } else {
        window.location.hash = '';
      }
    }
  });

  // Filter publications according to hash in URL.
  function filter_publications() {
    if (!$grid_pubs.length) {
      return;
    }
    let urlHash = window.location.hash.replace('#', '');
    let filterValue = '*';

    // Check if hash is numeric.
    if (urlHash != '' && !isNaN(urlHash)) {
      filterValue = '.pubtype-' + urlHash;
    }

    // Set filter.
    let filterGroup = 'pubtype';
    pubFilters[filterGroup] = filterValue;
    filterValues = concatValues(pubFilters);

    // Activate filters.
    $grid_pubs.isotope();

    // Set selected option.
    $('.pubtype-select').val(filterValue);
  }

  /* ---------------------------------------------------------------------------
   * Google Maps or OpenStreetMap via Leaflet.
   * --------------------------------------------------------------------------- */

  function loadExternalScript(url, integrity) {
    return new Promise(function (resolve, reject) {
      if (!url) {
        resolve();
        return;
      }
      let existing = document.querySelector('script[src="' + url + '"]');
      if (existing) {
        if (existing.dataset.loaded === 'true') {
          resolve();
          return;
        }
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      let script = document.createElement('script');
      script.src = url;
      script.async = true;
      if (integrity) {
        script.integrity = integrity;
        script.crossOrigin = 'anonymous';
      }
      script.addEventListener('load', function () {
        script.dataset.loaded = 'true';
        resolve();
      }, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.body.appendChild(script);
    });
  }

  function loadExternalStylesheet(url, integrity) {
    return new Promise(function (resolve, reject) {
      if (!url) {
        resolve();
        return;
      }
      let existing = document.querySelector('link[rel="stylesheet"][href="' + url + '"], link[rel="preload"][as="style"][href="' + url + '"]');
      if (existing) {
        if (existing.dataset.loaded === 'true' || existing.rel === 'stylesheet') {
          resolve();
          return;
        }
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      let link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      if (integrity) {
        link.integrity = integrity;
        link.crossOrigin = 'anonymous';
      }
      link.addEventListener('load', function () {
        link.dataset.loaded = 'true';
        resolve();
      }, { once: true });
      link.addEventListener('error', reject, { once: true });
      document.head.appendChild(link);
    });
  }

  function ensureMapScriptsLoaded() {
    let provider = parseInt(mapConfig.provider || 0);
    if (!provider) {
      return Promise.resolve();
    }
    let loaders = [];
    if (provider === 1) {
      loaders.push(loadExternalScript(mapConfig.gmapsApiUrl));
      if (mapConfig.useCdn) {
        loaders.push(loadExternalScript(mapConfig.gmapsLibUrl, mapConfig.gmapsLibIntegrity));
      }
    } else if (mapConfig.useCdn && (provider === 2 || provider === 3)) {
      loaders.push(loadExternalStylesheet(mapConfig.leafletCssUrl, mapConfig.leafletCssIntegrity));
      loaders.push(loadExternalScript(mapConfig.leafletUrl, mapConfig.leafletIntegrity));
    }
    return Promise.all(loaders);
  }

  function initializeMap() {
    if (!$('#map').length || mapInitialized) {
      return;
    }
    let map_provider = $('#map-provider').val();
    let lat = $('#map-lat').val();
    let lng = $('#map-lng').val();
    let zoom = parseInt($('#map-zoom').val());
    let address = $('#map-dir').val();
    let api_key = $('#map-api-key').val();

    if (map_provider == 1 && typeof GMaps !== 'undefined') {
      let map = new GMaps({
        div: '#map',
        lat: lat,
        lng: lng,
        zoom: zoom,
        zoomControl: true,
        zoomControlOpt: {
          style: 'SMALL',
          position: 'TOP_LEFT'
        },
        panControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        overviewMapControl: false,
        scrollwheel: true,
        draggable: true
      });

      map.addMarker({
        lat: lat,
        lng: lng,
        click: function () {
          let url = 'https://www.google.com/maps/place/' + encodeURIComponent(address) + '/@' + lat + ',' + lng + '/';
          window.open(url, '_blank');
        },
        title: address
      });
    } else if (typeof L !== 'undefined') {
      let map = new L.map('map').setView([lat, lng], zoom);
      if (map_provider == 3 && api_key.length) {
        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
          attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
          maxZoom: 18,
          id: 'mapbox.streets',
          accessToken: api_key
        }).addTo(map);
      } else {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
      }
      let marker = L.marker([lat, lng]).addTo(map);
      let url = lat + ',' + lng + '#map=' + zoom + '/' + lat + '/' + lng + '&layers=N';
      marker.bindPopup(address + '<p><a href="https://www.openstreetmap.org/directions?engine=osrm_car&route=' + url + '">Routing via OpenStreetMap</a></p>');
    }
    mapInitialized = true;
    $('.map-shell').addClass('is-map-ready');
    $('[data-map-placeholder]').attr('hidden', true);
  }

  function initMapWhenNeeded() {
    if (mapInitialized) {
      return Promise.resolve();
    }
    if (!mapInitPromise) {
      mapInitPromise = ensureMapScriptsLoaded().then(function () {
        initializeMap();
      }).catch(function (error) {
        console.error('Map initialization failed:', error);
      });
    }
    return mapInitPromise;
  }

  function setupMapLoader() {
    if (!$('#map').length) {
      return;
    }
    let mapLazyAttr = String($('#map').data('map-lazy')).toLowerCase();
    let mapIsLazy = mapLazyAttr === 'true';
    if (!mapIsLazy) {
      initMapWhenNeeded();
      return;
    }

    let triggered = false;
    function triggerMapLoad() {
      if (triggered) {
        return;
      }
      triggered = true;
      initMapWhenNeeded();
    }

    $('[data-map-load]').on('click keydown', function (e) {
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') {
        return;
      }
      e.preventDefault();
      triggerMapLoad();
    });

    $('#map').one('click', triggerMapLoad);

    if (mapConfig.trigger !== 'interaction' && 'IntersectionObserver' in window) {
      let observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            triggerMapLoad();
            observer.disconnect();
          }
        });
      }, {
        rootMargin: mapConfig.rootMargin || '240px'
      });
      observer.observe(document.getElementById('map'));
    }
  }

  function initFancyboxWhenNeeded() {
    if (typeof $.fancybox !== 'undefined') {
      return Promise.resolve();
    }
    if (fancyboxInitPromise) {
      return fancyboxInitPromise;
    }
    let loaders = [];
    loaders.push(loadExternalStylesheet(assetConfig.fancyboxCssUrl, assetConfig.fancyboxCssIntegrity));
    loaders.push(loadExternalScript(assetConfig.fancyboxJsUrl, assetConfig.fancyboxJsIntegrity));
    fancyboxInitPromise = Promise.all(loaders).catch(function (error) {
      console.error('Fancybox initialization failed:', error);
    });
    return fancyboxInitPromise;
  }

  function setupFancyboxLoader() {
    if (!assetConfig.lazyFancybox || !$('[data-fancybox]').length || typeof $.fancybox !== 'undefined') {
      return;
    }

    let triggered = false;
    function triggerFancyboxLoad() {
      if (triggered) {
        return;
      }
      triggered = true;
      initFancyboxWhenNeeded();
    }

    window.addEventListener('scroll', triggerFancyboxLoad, { passive: true, once: true });
    window.addEventListener('touchstart', triggerFancyboxLoad, { passive: true, once: true });
    window.addEventListener('keydown', triggerFancyboxLoad, { once: true });
    if ('requestIdleCallback' in window) {
      requestIdleCallback(triggerFancyboxLoad, { timeout: 2000 });
    } else {
      setTimeout(triggerFancyboxLoad, 1200);
    }
  }

  function relayoutProjectContainers(scopeElement) {
    $(scopeElement).find('.projects-container').each(function (_, grid) {
      let $grid = $(grid);
      if (typeof $grid.isotope === 'function' && $grid.data('isotope')) {
        $grid.isotope('layout');
      }
    });
  }

  function initMobileDisclosures() {
    let isPhoneViewport = window.matchMedia('(max-width: 767.98px)');

    function applyDisclosureState(container) {
      let collapseOnPhone = container.dataset.collapseOnPhone !== 'false';
      let previewCount = parseInt(container.dataset.previewCount || '0', 10);
      if (Number.isNaN(previewCount) || previewCount < 0) {
        previewCount = 0;
      }
      let toggleButton = container.querySelector('[data-mobile-disclosure-toggle]');
      let items = Array.from(container.querySelectorAll('[data-disclosure-item]'));
      let hasOverflowItems = items.length > previewCount;
      let isExpanded = container.dataset.expanded === 'true';
      let shouldCollapse = collapseOnPhone && isPhoneViewport.matches && hasOverflowItems;

      items.forEach(function (item, idx) {
        let hideItem = shouldCollapse && !isExpanded && idx >= previewCount;
        item.classList.toggle('is-mobile-hidden', hideItem);
        item.setAttribute('aria-hidden', hideItem ? 'true' : 'false');
      });

      if (toggleButton) {
        if (!shouldCollapse) {
          toggleButton.hidden = true;
          toggleButton.setAttribute('aria-expanded', 'false');
        } else {
          let labelMore = container.dataset.toggleMore || 'Show more';
          let labelLess = container.dataset.toggleLess || 'Show less';
          toggleButton.hidden = false;
          toggleButton.textContent = isExpanded ? labelLess : labelMore;
          toggleButton.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        }
      }

      relayoutProjectContainers(container);
    }

    function syncAllDisclosures() {
      document.querySelectorAll('[data-mobile-disclosure]').forEach(function (container) {
        applyDisclosureState(container);
      });
    }

    $(document).on('click keydown', '[data-mobile-disclosure-toggle]', function (e) {
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') {
        return;
      }
      e.preventDefault();
      let container = e.currentTarget.closest('[data-mobile-disclosure]');
      if (!container) {
        return;
      }
      container.dataset.expanded = container.dataset.expanded === 'true' ? 'false' : 'true';
      applyDisclosureState(container);
    });

    if (typeof isPhoneViewport.addEventListener === 'function') {
      isPhoneViewport.addEventListener('change', syncAllDisclosures);
    } else if (typeof isPhoneViewport.addListener === 'function') {
      isPhoneViewport.addListener(syncAllDisclosures);
    }

    syncAllDisclosures();
  }

  /* ---------------------------------------------------------------------------
   * GitHub API.
   * --------------------------------------------------------------------------- */

  function printLatestRelease(selector, repo) {
    $.getJSON('https://api.github.com/repos/' + repo + '/tags').done(function (json) {
      let release = json[0];
      $(selector).append(' ' + release.name);
    }).fail(function (jqxhr, textStatus, error) {
      let err = textStatus + ", " + error;
      console.log("Request Failed: " + err);
    });
  }

  /* ---------------------------------------------------------------------------
   * Toggle search dialog.
   * --------------------------------------------------------------------------- */

  function toggleSearchDialog() {
    if ($('body').hasClass('searching')) {
      $('[id=search-query]').blur();
      $('body').removeClass('searching');
      removeQueryParamsFromUrl();
    } else {
      $('body').addClass('searching');
      $('.search-results').css({
        opacity: 0,
        visibility: 'visible'
      }).animate({
        opacity: 1
      }, 200);
      $('#search-query').focus();
    }
  }

  /* ---------------------------------------------------------------------------
   * Toggle day/night mode.
   * --------------------------------------------------------------------------- */

  function toggleDarkMode(codeHlEnabled, codeHlLight, codeHlDark, diagramEnabled) {
    if ($('body').hasClass('dark')) {
      $('body').css({
        opacity: 0,
        visibility: 'visible'
      }).animate({
        opacity: 1
      }, 500);
      $('body').removeClass('dark');
      if (codeHlEnabled) {
        codeHlLight.disabled = false;
        codeHlDark.disabled = true;
      }
      $('.js-dark-toggle i').removeClass('fa-sun').addClass('fa-moon');
      localStorage.setItem('dark_mode', '0');
      if (diagramEnabled) {
        // TODO: Investigate Mermaid.js approach to re-render diagrams with new theme without reloading.
        location.reload();
      }
    } else {
      $('body').css({
        opacity: 0,
        visibility: 'visible'
      }).animate({
        opacity: 1
      }, 500);
      $('body').addClass('dark');
      if (codeHlEnabled) {
        codeHlLight.disabled = true;
        codeHlDark.disabled = false;
      }
      $('.js-dark-toggle i').removeClass('fa-moon').addClass('fa-sun');
      localStorage.setItem('dark_mode', '1');
      if (diagramEnabled) {
        // TODO: Investigate Mermaid.js approach to re-render diagrams with new theme without reloading.
        location.reload();
      }
    }
  }

  /* ---------------------------------------------------------------------------
   * Normalize Bootstrap Carousel Slide Heights.
   * --------------------------------------------------------------------------- */

  function normalizeCarouselSlideHeights() {
    $('.carousel').each(function () {
      // Get carousel slides.
      let items = $('.carousel-item', this);
      // Reset all slide heights.
      items.css('min-height', 0);
      // Normalize all slide heights.
      let maxHeight = Math.max.apply(null, items.map(function () {
        return $(this).outerHeight()
      }).get());
      items.css('min-height', maxHeight + 'px');
    })
  }

  /* ---------------------------------------------------------------------------
   * On document ready.
   * --------------------------------------------------------------------------- */

  $(document).ready(function () {
    updateNavbarOffset();

    // Fix Hugo's auto-generated Table of Contents.
    //   Must be performed prior to initializing ScrollSpy.
    $('#TableOfContents > ul > li > ul').unwrap().unwrap();
    $('#TableOfContents').addClass('nav flex-column');
    $('#TableOfContents li').addClass('nav-item');
    $('#TableOfContents li a').addClass('nav-link');

    // Set dark mode if user chose it.
    let default_mode = 0;
    if ($('body').hasClass('dark')) {
      default_mode = 1;
    }
    let dark_mode = parseInt(localStorage.getItem('dark_mode') || default_mode);

    // Is code highlighting enabled in site config?
    const codeHlEnabled = $('link[title=hl-light]').length > 0;
    const codeHlLight = $('link[title=hl-light]')[0];
    const codeHlDark = $('link[title=hl-dark]')[0];
    const diagramEnabled = $('script[title=mermaid]').length > 0;

    if (dark_mode) {
      $('body').addClass('dark');
      if (codeHlEnabled) {
        codeHlLight.disabled = true;
        codeHlDark.disabled = false;
      }
      if (diagramEnabled) {
        mermaid.initialize({
          theme: 'dark'
        });
      }
      $('.js-dark-toggle i').removeClass('fa-moon').addClass('fa-sun');
    } else {
      $('body').removeClass('dark');
      if (codeHlEnabled) {
        codeHlLight.disabled = false;
        codeHlDark.disabled = true;
      }
      if (diagramEnabled) {
        mermaid.initialize({
          theme: 'default'
        });
      }
      $('.js-dark-toggle i').removeClass('fa-sun').addClass('fa-moon');
    }

    // Toggle day/night mode.
    $('.js-dark-toggle').click(function (e) {
      e.preventDefault();
      toggleDarkMode(codeHlEnabled, codeHlLight, codeHlDark, diagramEnabled);
    });

    setNavMenuState(false);
    if (typeof mobilePanelQuery.addEventListener === 'function') {
      mobilePanelQuery.addEventListener('change', function (event) {
        if (!event.matches) {
          $('#navbar').collapse('hide');
          setNavMenuState(false);
        }
      });
    } else if (typeof mobilePanelQuery.addListener === 'function') {
      mobilePanelQuery.addListener(function (event) {
        if (!event.matches) {
          $('#navbar').collapse('hide');
          setNavMenuState(false);
        }
      });
    }

    initMobileDisclosures();
    markOverflowingElements();
  });

  /* ---------------------------------------------------------------------------
   * On window loaded.
   * --------------------------------------------------------------------------- */

  $(window).on('load', function () {
    if (window.location.hash) {
      // When accessing homepage from another page and `#top` hash is set, show top of page (no hash).
      if (window.location.hash == "#top") {
        window.location.hash = ""
      } else if (!$('.projects-container').length) {
        // If URL contains a hash and there are no dynamically loaded images on the page,
        // immediately scroll to target ID taking into account responsive offset.
        // Otherwise, wait for `imagesLoaded()` to complete before scrolling to hash to prevent scrolling to wrong
        // location.
        scrollToAnchor();
      }
    }

    // Initialize Scrollspy.
    let $body = $('body');
    $body.scrollspy({
      offset: navbar_offset
    });

    // Call `fixScrollspy` when window is resized.
    let resizeTimer;
    $(window).resize(function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        updateNavbarOffset();
        fixScrollspy();
        markOverflowingElements();
      }, 200);
    });

    // Filter projects.
    $('.projects-container').each(function (index, container) {
      let $container = $(container);
      let $section = $container.closest('section');
      let layout;
      if ($section.find('.isotope').hasClass('js-layout-row')) {
        layout = 'fitRows';
      } else {
        layout = 'masonry';
      }

      $container.imagesLoaded(function () {
        // Initialize Isotope after all images have loaded.
        $container.isotope({
          itemSelector: '.isotope-item',
          layoutMode: layout,
          masonry: {
            gutter: 20
          },
          filter: $section.find('.default-project-filter').text()
        });

        // Filter items when filter link is clicked.
        $section.find('.project-filters a').click(function () {
          let selector = $(this).attr('data-filter');
          $container.isotope({
            filter: selector
          });
          $(this).removeClass('active').addClass('active').siblings().removeClass('active all');
          return false;
        });

        // If window hash is set, scroll to hash.
        // Placing this within `imagesLoaded` prevents scrolling to the wrong location due to dynamic image loading
        // affecting page layout and position of the target anchor ID.
        // Note: If there are multiple project widgets on a page, ideally only perform this once after images
        // from *all* project widgets have finished loading.
        if (window.location.hash) {
          scrollToAnchor();
        }
      });
    });

    // Enable publication filter for publication index page.
    if ($('.pub-filters-select').length) {
      filter_publications();
      // Useful for changing hash manually (e.g. in development):
      // window.addEventListener('hashchange', filter_publications, false);
    }

    // Load citation modal on 'Cite' click.
    $('.js-cite-modal').click(function (e) {
      e.preventDefault();
      let filename = $(this).attr('data-filename');
      let modal = $('#modal');
      modal.find('.modal-body code').load(filename, function (response, status, xhr) {
        if (status == 'error') {
          let msg = "Error: ";
          $('#modal-error').html(msg + xhr.status + " " + xhr.statusText);
        } else {
          $('.js-download-cite').attr('href', filename);
        }
      });
      modal.modal('show');
    });

    // Copy citation text on 'Copy' click.
    $('.js-copy-cite').click(function (e) {
      e.preventDefault();
      // Get selection.
      let range = document.createRange();
      let code_node = document.querySelector('#modal .modal-body');
      range.selectNode(code_node);
      window.getSelection().addRange(range);
      try {
        // Execute the copy command.
        document.execCommand('copy');
      } catch (e) {
        console.log('Error: citation copy failed.');
      }
      // Remove selection.
      window.getSelection().removeRange(range);
    });

    // Initialise Google Maps if necessary.
    setupMapLoader();
    setupFancyboxLoader();

    // Print latest version of GitHub projects.
    let githubReleaseSelector = '.js-github-release';
    if ($(githubReleaseSelector).length > 0)
      printLatestRelease(githubReleaseSelector, $(githubReleaseSelector).data('repo'));

    // On search icon click toggle search dialog.
    $('.js-search').click(function (e) {
      e.preventDefault();
      toggleSearchDialog();
    });
    $(document).on('keydown', function (e) {
      if (e.which == 27) {
        // `Esc` key pressed.
        if (isMobilePanelActive() && $('#navbar').hasClass('show')) {
          $('#navbar').collapse('hide');
        }
        if ($('body').hasClass('searching')) {
          toggleSearchDialog();
        }
      } else if (e.which == 191 && e.shiftKey == false && !$('input,textarea').is(':focus')) {
        // `/` key pressed outside of text input.
        e.preventDefault();
        toggleSearchDialog();
      }
    });

    markOverflowingElements();

  });

  // Normalize Bootstrap carousel slide heights.
  $(window).on('load resize orientationchange', function () {
    normalizeCarouselSlideHeights();
    markOverflowingElements();
  });

})(jQuery);
