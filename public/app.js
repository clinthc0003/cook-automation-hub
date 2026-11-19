/* Cook Automation hub
   Hash routes:
     #/           home
     #/apps       app directory from /apps.json
     #/app/<id>   app feature overview, launching the live tool in a new tab
*/

(function () {
  "use strict";

  var view = document.querySelector("#view");
  var navLinks = document.querySelectorAll("[data-nav]");
  var appsRequest = null;
  var renderToken = 0;

  /* ---------- Data ---------- */

  function loadApps() {
    if (!appsRequest) {
      appsRequest = fetch("/apps.json")
        .then(function (response) {
          if (!response.ok) {
            throw new Error("apps.json request failed");
          }
          return response.json();
        })
        .catch(function (error) {
          appsRequest = null;
          throw error;
        });
    }
    return appsRequest;
  }

  function findApp(apps, id) {
    for (var i = 0; i < apps.length; i += 1) {
      if (apps[i].id === id) {
        return apps[i];
      }
    }
    return null;
  }

  function initials(name) {
    var parts = String(name || "").trim().split(/\s+/).slice(0, 2);
    return parts
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("");
  }

  function hostLabel(url) {
    try {
      return new URL(url).host;
    } catch (err) {
      return "";
    }
  }

  function formatCount(count) {
    var padded = count < 10 ? "0" + count : String(count);
    return padded + (count === 1 ? " Tool" : " Tools");
  }

  function padIndex(index) {
    var n = index + 1;
    return n < 10 ? "0" + n : String(n);
  }

  /* ---------- Routing ---------- */

  function parseRoute() {
    var raw = (location.hash || "#/").replace(/^#/, "");
    var parts = raw.split("/").filter(Boolean);

    if (parts.length === 0 || parts[0] === "home") {
      return { name: "home" };
    }
    if (parts[0] === "apps") {
      return { name: "apps" };
    }
    if (parts[0] === "app" && parts[1]) {
      return { name: "app", id: decodeURIComponent(parts[1]) };
    }
    return { name: "home" };
  }

  function setChrome(routeName) {
    var current = routeName === "app" ? "apps" : routeName;

    navLinks.forEach(function (link) {
      if (link.getAttribute("data-nav") === current) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function setTitle(page) {
    document.title = page ? page + " · Cook Automation" : "Cook Automation";
  }

  /* ---------- DOM helpers ---------- */

  function clearView() {
    view.textContent = "";
  }

  function addText(parent, tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  function addArrowLink(parent, className, href, label, id) {
    var link = document.createElement("a");
    link.className = className;
    link.href = href;
    if (id) {
      link.id = id;
    }
    addText(link, "span", "", label);
    var arrow = addText(link, "span", "arrow", "\u2192");
    arrow.setAttribute("aria-hidden", "true");
    parent.appendChild(link);
    return link;
  }

  function addLaunchLink(parent, className, href, label, ariaLabel, id) {
    var link = document.createElement("a");
    link.className = className;
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    if (id) {
      link.id = id;
    }
    if (ariaLabel) {
      link.setAttribute("aria-label", ariaLabel);
    }
    addText(link, "span", "", label);
    var arrow = addText(link, "span", "arrow-ext", "\u2197");
    arrow.setAttribute("aria-hidden", "true");
    parent.appendChild(link);
    return link;
  }

  function buildWatermark(className) {
    var mark = document.createElement("img");
    mark.className = className;
    mark.src = "/brand/monogram-cream.svg";
    mark.alt = "";
    mark.setAttribute("aria-hidden", "true");
    return mark;
  }

  /* ---------- App cards ---------- */

  function buildAppCard(app, headingTag) {
    var item = document.createElement("li");
    var card = document.createElement("article");
    card.className = "app-card";

    /* Top row: app mark + host label */
    var top = document.createElement("div");
    top.className = "app-card-top";

    var mark = document.createElement("span");
    mark.className = "app-mark";
    if (app.icon) {
      var image = document.createElement("img");
      image.src = app.icon;
      image.alt = "";
      image.addEventListener("error", function () {
        image.remove();
        mark.classList.add("is-initials");
        mark.textContent = initials(app.name);
      });
      mark.appendChild(image);
    } else {
      mark.classList.add("is-initials");
      mark.textContent = initials(app.name);
    }
    top.appendChild(mark);

    var host = hostLabel(app.url);
    if (host) {
      addText(top, "span", "app-host", host);
    }
    card.appendChild(top);

    /* Title (stretched link to overview) + description */
    var heading = document.createElement(headingTag || "h2");
    var link = document.createElement("a");
    link.className = "app-card-link";
    link.href = "#/app/" + encodeURIComponent(app.id);
    link.textContent = app.name;
    heading.appendChild(link);
    card.appendChild(heading);

    addText(card, "p", "app-card-desc", app.description || "");

    /* Footer: Learn more cue + direct new-tab launch */
    var foot = document.createElement("div");
    foot.className = "app-card-foot";

    var cta = document.createElement("span");
    cta.className = "app-card-cta";
    cta.setAttribute("aria-hidden", "true");
    addText(cta, "span", "", app.ctaLabel || "Learn more");
    addText(cta, "span", "arrow", "\u2192");
    foot.appendChild(cta);

    if (app.url) {
      addLaunchLink(
        foot,
        "app-card-ext",
        app.url,
        app.launchLabel || "Open app",
        "Open " + app.name + " in a new tab"
      );
    }

    card.appendChild(foot);
    item.appendChild(card);
    return item;
  }

  function buildFeaturedAppCard(app, headingTag) {
    var item = document.createElement("li");
    item.className = "app-grid-item is-featured";

    var card = document.createElement("article");
    card.className = "app-card is-featured";

    /* Left column: editorial copy & actions */
    var content = document.createElement("div");
    content.className = "app-card-content";

    var meta = document.createElement("div");
    meta.className = "app-card-top";
    addText(meta, "span", "eyebrow app-card-eyebrow", app.category || "Featured");

    var host = hostLabel(app.url);
    if (host) {
      addText(meta, "span", "app-host", host);
    }
    content.appendChild(meta);

    var heading = document.createElement(headingTag || "h2");
    heading.className = "app-card-title-lg";
    var link = document.createElement("a");
    link.className = "app-card-link";
    link.href = "#/app/" + encodeURIComponent(app.id);
    link.textContent = app.name;
    heading.appendChild(link);
    content.appendChild(heading);

    addText(content, "p", "app-card-desc", app.description || "");

    var actions = document.createElement("div");
    actions.className = "app-card-actions";

    var cta = document.createElement("span");
    cta.className = "button button-navy app-card-primary";
    cta.setAttribute("aria-hidden", "true");
    addText(cta, "span", "", app.ctaLabel || "Learn more");
    addText(cta, "span", "arrow", "\u2192");
    actions.appendChild(cta);

    if (app.url) {
      addLaunchLink(
        actions,
        "app-card-ext app-card-ext-lg",
        app.url,
        app.launchLabel || "Open map",
        "Open " + app.name + " in a new tab at " + host
      );
    }

    content.appendChild(actions);
    card.appendChild(content);

    /* Right column: cartographic visual stage */
    var media = document.createElement("div");
    media.className = "app-card-media";
    media.setAttribute("aria-hidden", "true");

    if (app.image) {
      var img = document.createElement("img");
      img.className = "app-card-media-img";
      img.src = app.image;
      img.alt = "";
      media.appendChild(img);
    }

    var frame = document.createElement("div");
    frame.className = "app-card-media-frame";
    media.appendChild(frame);

    addText(media, "span", "app-card-coords", "180\u00b0W \u2014 180\u00b0E");

    card.appendChild(media);
    item.appendChild(card);
    return item;
  }

  function buildAppGrid(apps, headingTag) {
    var hasFeatured = apps.some(function (app) {
      return Boolean(app.featured && app.image);
    });
    var list = document.createElement("ul");
    list.className =
      apps.length === 1 && !hasFeatured ? "app-grid is-single" : "app-grid";

    apps.forEach(function (app) {
      if (app.featured && app.image) {
        list.appendChild(buildFeaturedAppCard(app, headingTag));
      } else {
        list.appendChild(buildAppCard(app, headingTag));
      }
    });
    return list;
  }

  /* ---------- Home view ---------- */

  function renderHome(token) {
    setTitle("");
    clearView();

    /* Hero */
    var hero = document.createElement("section");
    hero.className = "hero";
    hero.appendChild(buildWatermark("hero-watermark"));

    var heroInner = document.createElement("div");
    heroInner.className = "hero-inner";

    var lockup = document.createElement("img");
    lockup.className = "hero-lockup";
    lockup.src = "/brand/lockup-est2019-cream.svg";
    lockup.alt = "Cook Automation, Est. 2019";
    heroInner.appendChild(lockup);

    var rule = document.createElement("div");
    rule.className = "hero-rule";
    rule.setAttribute("aria-hidden", "true");
    heroInner.appendChild(rule);

    addText(heroInner, "h1", "hero-title", "A focused home for the tools we run.");
    addText(
      heroInner,
      "p",
      "hero-lead",
      "Explore what we build, read a quick overview of each app, and launch any tool in its own browser tab."
    );

    var actions = document.createElement("div");
    actions.className = "hero-actions";
    addArrowLink(actions, "button button-light", "#/apps", "Browse apps", "hero-browse-apps");
    heroInner.appendChild(actions);

    hero.appendChild(heroInner);
    view.appendChild(hero);

    /* Featured / available tools */
    var toolsSection = document.createElement("section");
    toolsSection.className = "home-section";
    toolsSection.setAttribute("aria-labelledby", "home-tools-heading");

    var sectionHead = document.createElement("div");
    sectionHead.className = "section-head";

    var headLeft = document.createElement("div");
    addText(headLeft, "p", "eyebrow", "01 \u00b7 Available tools");
    var toolsHeading = addText(headLeft, "h2", "", "Active applications");
    toolsHeading.id = "home-tools-heading";
    sectionHead.appendChild(headLeft);

    addArrowLink(sectionHead, "text-link", "#/apps", "View full directory", "home-all-apps");
    toolsSection.appendChild(sectionHead);

    var toolsSlot = document.createElement("div");
    addText(toolsSlot, "p", "empty-state", "Loading applications\u2026");
    toolsSection.appendChild(toolsSlot);
    view.appendChild(toolsSection);

    /* Principles strip */
    var principlesWrap = document.createElement("section");
    principlesWrap.className = "principles-wrap";
    principlesWrap.setAttribute("aria-label", "How the hub works");

    var principles = document.createElement("ol");
    principles.className = "principles";

    var items = [
      {
        num: "01",
        title: "One front door",
        copy: "Every active Cook Automation web tool stays organized in a single bookmarkable directory."
      },
      {
        num: "02",
        title: "Clear overviews",
        copy: "Each app has a quick overview page summarizing what it does and how to use it."
      },
      {
        num: "03",
        title: "Full-tab launch",
        copy: "Every tool opens directly in its own browser tab at full speed and full screen size."
      }
    ];

    items.forEach(function (entry) {
      var li = document.createElement("li");
      addText(li, "span", "principle-num", entry.num);
      addText(li, "h3", "", entry.title);
      addText(li, "p", "", entry.copy);
      principles.appendChild(li);
    });

    principlesWrap.appendChild(principles);
    view.appendChild(principlesWrap);

    /* Populate live app list */
    loadApps()
      .then(function (apps) {
        if (token !== renderToken) {
          return;
        }
        if (!Array.isArray(apps)) {
          throw new Error("apps.json must be a list");
        }
        toolsSlot.textContent = "";
        if (!apps.length) {
          addText(toolsSlot, "p", "empty-state", "No apps are listed yet.");
          return;
        }
        toolsSlot.appendChild(buildAppGrid(apps, "h3"));
      })
      .catch(function () {
        if (token !== renderToken) {
          return;
        }
        toolsSlot.textContent = "";
        addText(toolsSlot, "p", "empty-state", "The app list could not be loaded.");
      });
  }

  /* ---------- Apps directory view ---------- */

  function renderStatus(message) {
    clearView();
    var box = document.createElement("section");
    box.className = "status-box";
    addText(box, "p", "", message);
    view.appendChild(box);
  }

  function renderApps(apps) {
    setTitle("Apps");
    clearView();

    /* Navy page banner */
    var banner = document.createElement("section");
    banner.className = "page-banner";
    banner.appendChild(buildWatermark("page-banner-watermark"));

    var bannerInner = document.createElement("div");
    bannerInner.className = "page-banner-inner";

    var bannerCopy = document.createElement("div");
    addText(bannerCopy, "p", "eyebrow eyebrow-light", "Directory");
    addText(bannerCopy, "h1", "", "Apps");
    addText(
      bannerCopy,
      "p",
      "page-banner-lead",
      "Tools currently running on Cook Automation. Read an overview of any app or launch it directly in a new tab."
    );
    bannerInner.appendChild(bannerCopy);

    addText(bannerInner, "span", "banner-count", formatCount(apps.length));
    banner.appendChild(bannerInner);
    view.appendChild(banner);

    /* Warm cream directory */
    var body = document.createElement("section");
    body.className = "directory-body";
    body.setAttribute("aria-label", "Application list");

    if (!apps.length) {
      addText(body, "p", "empty-state", "No apps are listed yet.");
    } else {
      body.appendChild(buildAppGrid(apps, "h2"));
    }

    view.appendChild(body);
  }

  /* ---------- App overview subpage ---------- */

  function renderAppDetail(app) {
    setTitle(app.name);
    clearView();

    var host = hostLabel(app.url);
    var launchText = app.launchLabel || "Open app";

    /* Deep navy detail hero */
    var hero = document.createElement("section");
    hero.className = "detail-hero";
    hero.appendChild(buildWatermark("page-banner-watermark"));

    var heroInner = document.createElement("div");
    heroInner.className = "detail-hero-inner";

    var back = document.createElement("a");
    back.className = "back-link";
    back.id = "detail-back-apps";
    back.href = "#/apps";
    addText(back, "span", "arrow-back", "\u2190");
    addText(back, "span", "", "Back to apps");
    heroInner.appendChild(back);

    var grid = document.createElement("div");
    grid.className = app.image ? "detail-hero-grid" : "detail-hero-grid is-solo";

    /* Left column: title, summary, primary launch CTA */
    var copy = document.createElement("div");
    copy.className = "detail-hero-copy";

    var eyebrowText = app.category ? app.category : "Application";
    if (host) {
      eyebrowText += " \u00b7 " + host;
    }
    addText(copy, "p", "eyebrow eyebrow-light", eyebrowText);
    addText(copy, "h1", "detail-title", app.name);
    addText(copy, "p", "detail-lead", app.overview || app.description || "");

    var actions = document.createElement("div");
    actions.className = "hero-actions";
    if (app.url) {
      addLaunchLink(
        actions,
        "button button-light",
        app.url,
        launchText + " at " + (host || "live site"),
        "Open " + app.name + " in a new tab at " + (host || app.url),
        "detail-open-primary"
      );
    }
    copy.appendChild(actions);
    grid.appendChild(copy);

    /* Right column: framed visual plate */
    if (app.image) {
      var plate = document.createElement("div");
      plate.className = "detail-plate";
      plate.setAttribute("aria-hidden", "true");

      var img = document.createElement("img");
      img.className = "detail-plate-img";
      img.src = app.image;
      img.alt = "";
      plate.appendChild(img);

      var frame = document.createElement("div");
      frame.className = "app-card-media-frame";
      plate.appendChild(frame);

      grid.appendChild(plate);
    }

    heroInner.appendChild(grid);
    hero.appendChild(heroInner);
    view.appendChild(hero);

    /* Quick-glance stats strip */
    if (Array.isArray(app.stats) && app.stats.length) {
      var statsSection = document.createElement("section");
      statsSection.className = "detail-stats-band";
      statsSection.setAttribute("aria-label", "At a glance");

      var statsList = document.createElement("dl");
      statsList.className = "detail-stats";

      app.stats.forEach(function (stat) {
        var cell = document.createElement("div");
        cell.className = "detail-stat";
        addText(cell, "dt", "detail-stat-value", stat.value);
        addText(cell, "dd", "detail-stat-label", stat.label);
        statsList.appendChild(cell);
      });

      statsSection.appendChild(statsList);
      view.appendChild(statsSection);
    }

    /* Key features grid */
    if (Array.isArray(app.features) && app.features.length) {
      var featSection = document.createElement("section");
      featSection.className = "detail-section";
      featSection.setAttribute("aria-labelledby", "detail-features-heading");

      var head = document.createElement("div");
      head.className = "section-head";
      var headLeft = document.createElement("div");
      addText(headLeft, "p", "eyebrow", "01 \u00b7 Features");
      var featHeading = addText(headLeft, "h2", "", "What you can do");
      featHeading.id = "detail-features-heading";
      head.appendChild(headLeft);
      featSection.appendChild(head);

      var featGrid = document.createElement("ol");
      featGrid.className = "feature-grid";

      app.features.forEach(function (feat, index) {
        var card = document.createElement("li");
        card.className = "feature-card";
        addText(card, "span", "feature-num", padIndex(index));
        addText(card, "h3", "", feat.title);
        addText(card, "p", "", feat.copy);
        featGrid.appendChild(card);
      });

      featSection.appendChild(featGrid);
      view.appendChild(featSection);
    }

    /* Bottom launch callout + data credit */
    var footBand = document.createElement("section");
    footBand.className = "detail-cta-wrap";
    footBand.setAttribute("aria-label", "Launch application");

    var footBox = document.createElement("div");
    footBox.className = "detail-cta-box";

    var footCopy = document.createElement("div");
    addText(footCopy, "h2", "detail-cta-title", "Ready to explore?");
    if (app.credit) {
      addText(footCopy, "p", "detail-credit", app.credit);
    }
    footBox.appendChild(footCopy);

    if (app.url) {
      addLaunchLink(
        footBox,
        "button button-navy",
        app.url,
        launchText,
        "Open " + app.name + " in a new tab at " + (host || app.url),
        "detail-open-bottom"
      );
    }

    footBand.appendChild(footBox);
    view.appendChild(footBand);
  }

  function renderMissing(id) {
    setTitle("App not found");
    clearView();

    var banner = document.createElement("section");
    banner.className = "page-banner";
    banner.appendChild(buildWatermark("page-banner-watermark"));

    var bannerInner = document.createElement("div");
    bannerInner.className = "page-banner-inner";
    var bannerCopy = document.createElement("div");
    addText(bannerCopy, "p", "eyebrow eyebrow-light", "Directory");
    addText(bannerCopy, "h1", "", "App not found");
    bannerInner.appendChild(bannerCopy);
    banner.appendChild(bannerInner);
    view.appendChild(banner);

    var panel = document.createElement("section");
    panel.className = "missing-panel";
    addText(panel, "p", "", "Nothing in the directory matches \u201c" + id + "\u201d.");
    addArrowLink(panel, "button button-navy", "#/apps", "Back to apps", "missing-back-apps");
    view.appendChild(panel);
  }

  /* ---------- Start ---------- */

  function show() {
    var token = (renderToken += 1);
    var route = parseRoute();
    setChrome(route.name);
    window.scrollTo(0, 0);

    if (route.name === "home") {
      renderHome(token);
      return;
    }

    renderStatus("Loading\u2026");
    loadApps()
      .then(function (apps) {
        if (token !== renderToken) {
          return;
        }
        if (!Array.isArray(apps)) {
          throw new Error("apps.json must be a list");
        }
        if (route.name === "apps") {
          renderApps(apps);
          return;
        }
        var app = findApp(apps, route.id);
        if (!app || !app.url) {
          renderMissing(route.id);
          return;
        }
        renderAppDetail(app);
      })
      .catch(function () {
        if (token !== renderToken) {
          return;
        }
        renderStatus("The app list could not be loaded.");
      });
  }

  window.addEventListener("hashchange", show);
  show();
})();
