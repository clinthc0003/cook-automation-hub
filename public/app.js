/* Cook Automation hub
   Hash routes:
     #/           home
     #/apps       app cards from /apps.json
     #/app/<id>   embedded app, with a new-tab link
*/

(function () {
  "use strict";

  var view = document.querySelector("#view");
  var navLinks = document.querySelectorAll("[data-nav]");
  var appsRequest = null;
  var renderToken = 0;

  /* ---------- Data ---------- */

  // fallbackUrl is the workers.dev host for World History Map. The frame
  // loads `url` only. The fallback is offered as a link when embedding fails
  // or the custom host is not ready.
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
    document.body.classList.toggle("is-app", routeName === "app");
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

  /* ---------- Views ---------- */

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

  function renderHome() {
    setTitle("");
    clearView();

    var panel = document.createElement("section");
    panel.className = "panel";
    addText(panel, "p", "eyebrow", "Hub");
    addText(panel, "h1", "", "Cook Automation");
    addText(
      panel,
      "p",
      "lead",
      "A small home for the tools we run. Pick an app, use it here, or open it in its own tab."
    );

    var action = document.createElement("p");
    var link = document.createElement("a");
    link.className = "button";
    link.href = "#/apps";
    link.textContent = "Browse apps";
    action.appendChild(link);
    panel.appendChild(action);
    view.appendChild(panel);
  }

  function renderStatus(message) {
    clearView();
    addText(view, "p", "status", message);
  }

  function renderApps(apps) {
    setTitle("Apps");
    clearView();

    var panel = document.createElement("section");
    addText(panel, "p", "eyebrow", "Apps");
    addText(panel, "h1", "", "Apps");

    if (!apps.length) {
      addText(panel, "p", "status", "No apps are listed yet.");
      view.appendChild(panel);
      return;
    }

    var list = document.createElement("ul");
    list.className = "app-grid";

    apps.forEach(function (app) {
      var item = document.createElement("li");
      var card = document.createElement("a");
      card.className = "app-card";
      card.href = "#/app/" + encodeURIComponent(app.id);

      var mark = document.createElement("span");
      mark.className = "app-mark";
      if (app.icon) {
        var image = document.createElement("img");
        image.src = app.icon;
        image.alt = "";
        image.addEventListener("error", function () {
          image.remove();
          mark.textContent = initials(app.name);
        });
        mark.appendChild(image);
      } else {
        mark.textContent = initials(app.name);
      }

      card.appendChild(mark);
      addText(card, "h2", "", app.name);
      addText(card, "p", "", app.description || "");
      item.appendChild(card);
      list.appendChild(item);
    });

    panel.appendChild(list);
    view.appendChild(panel);
  }

  function renderMissing(id) {
    setTitle("App");
    clearView();
    var panel = document.createElement("section");
    panel.className = "panel";
    addText(panel, "h1", "", "App not found");
    addText(panel, "p", "lead", "Nothing in the list matches “" + id + "”.");
    var back = document.createElement("p");
    var link = document.createElement("a");
    link.className = "button";
    link.href = "#/apps";
    link.textContent = "Back to apps";
    back.appendChild(link);
    panel.appendChild(back);
    view.appendChild(panel);
  }

  /* ---------- App frame ---------- */

  function externalLink(href, label) {
    var link = document.createElement("a");
    link.className = "bar-link";
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    return link;
  }

  function watchFrame(frame, note, app) {
    frame.addEventListener("error", function () {
      markBlocked(note, app);
    });

    frame.addEventListener("load", function () {
      try {
        var href = frame.contentWindow.location.href;
        // A readable about:blank means the browser kept our empty document.
        // Cross-origin pages throw, which is what a successful embed looks like.
        if (!href || href === "about:blank") {
          markBlocked(note, app);
        }
      } catch (err) {
        note.classList.remove("is-blocked");
      }
    });
  }

  function markBlocked(note, app) {
    note.classList.add("is-blocked");
    note.textContent = "";
    note.appendChild(
      document.createTextNode(app.name + " does not allow embedding. ")
    );
    var link = document.createElement("a");
    link.href = app.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open it in a new tab";
    note.appendChild(link);
    note.appendChild(document.createTextNode("."));
  }

  function renderApp(app) {
    setTitle(app.name);
    clearView();

    var shell = document.createElement("section");
    shell.className = "app-view";

    var bar = document.createElement("div");
    bar.className = "app-bar";

    var back = document.createElement("a");
    back.className = "bar-link";
    back.href = "#/apps";
    back.textContent = "Back";
    bar.appendChild(back);
    addText(bar, "h1", "", app.name);
    bar.appendChild(externalLink(app.url, "Open in new tab"));
    if (app.fallbackUrl && app.fallbackUrl !== app.url) {
      bar.appendChild(externalLink(app.fallbackUrl, "Open fallback"));
    }

    var note = document.createElement("p");
    note.className = "frame-note";
    note.appendChild(
      document.createTextNode("If this stays blank, the app is blocking the embedded view. ")
    );
    var noteLink = document.createElement("a");
    noteLink.href = app.url;
    noteLink.target = "_blank";
    noteLink.rel = "noopener noreferrer";
    noteLink.textContent = "Open in a new tab";
    note.appendChild(noteLink);
    note.appendChild(document.createTextNode("."));

    var frame = document.createElement("iframe");
    frame.className = "app-frame";
    frame.title = app.name;
    frame.src = app.url;
    frame.referrerPolicy = "no-referrer";
    watchFrame(frame, note, app);

    shell.appendChild(bar);
    shell.appendChild(note);
    shell.appendChild(frame);
    view.appendChild(shell);
  }

  /* ---------- Start ---------- */

  function show() {
    var token = (renderToken += 1);
    var route = parseRoute();
    setChrome(route.name);

    if (route.name === "home") {
      renderHome();
      return;
    }

    renderStatus("Loading…");
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
        renderApp(app);
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
