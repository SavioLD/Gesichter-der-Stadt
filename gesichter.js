/* ============================================================
   Gesichter der Stadt – Rottweil
   Gemeinsames Skript für alle Seiten des Projekts:
   Mobile-Navigation, Jahreszahl, Scroll-Reveal, Aktions-Formular.
============================================================ */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------- Mobile-Menü --- */
  var burger = $("#burger"), mobileNav = $("#mobileNav");
  if (burger && mobileNav) {
    var setMenu = function (open) {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
      mobileNav.classList.toggle("is-open", open);
    };
    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });
    mobileNav.addEventListener("click", function (ev) {
      if (ev.target.tagName === "A") setMenu(false);
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        burger.focus();
      }
    });
  }

  /* ------------------------------------------------------ Jahreszahl --- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* --------------------------------------------------- Scroll-Reveal --- */
  var reveal = $$(".rv");
  if (document.documentElement.classList.contains("anim") && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveal.forEach(function (el) { io.observe(el); });
  } else {
    reveal.forEach(function (el) { el.classList.add("in"); });
  }

  /* ----------------------------------------------- Aktions-Formular ---
     Geprüft wird im Browser, versendet über Web3Forms an die Adresse,
     die dort zum Access Key hinterlegt ist (info@laendle-digital.com).
     Schlüssel siehe config.js.
  --------------------------------------------------------------------- */
  var form = $("#aktionForm");
  if (!form) return;

  var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };

  var showErr = function (id, on) {
    var msg = $('.err-msg[data-for="' + id + '"]');
    if (msg) msg.classList.toggle("show", on);
    var field = $("#" + id);
    if (field) {
      field.classList.toggle("err", on);
      field.setAttribute("aria-invalid", on ? "true" : "false");
    }
  };

  /* Art der Aktion – Einfachauswahl über Chips */
  var kind = "";
  $$("#aktionKind .chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var wasOn = chip.classList.contains("is-on");
      $$("#aktionKind .chip").forEach(function (x) {
        x.classList.remove("is-on");
        x.setAttribute("aria-pressed", "false");
      });
      if (!wasOn) {
        chip.classList.add("is-on");
        chip.setAttribute("aria-pressed", "true");
        kind = chip.getAttribute("data-kind") || "";
      } else {
        kind = "";
      }
      showErr("aktionKind", false);
    });
  });

  /* Fehler verschwinden, sobald korrigiert wird */
  $$(".input", form).forEach(function (el) {
    el.addEventListener("input", function () { showErr(el.id, false); });
  });
  var privacy = $("#af_privacy");
  if (privacy) {
    privacy.addEventListener("change", function () {
      var msg = $('.err-msg[data-for="af_privacy"]');
      if (msg && privacy.checked) msg.classList.remove("show");
    });
  }

  var notice = $("#aktionNotice");
  var submitBtn = $("#aktionSubmit");
  if (window.GdsSubmit && !window.GdsSubmit.bereit()) {
    if (notice) notice.hidden = false;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute("aria-describedby", "aktionNotice");
    }
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!window.GdsSubmit || !window.GdsSubmit.bereit()) return;

    /* Honigtopf: von Menschen nie ausgefüllt */
    var trap = $("#af_website");
    if (trap && trap.value) return;

    var val = function (id) { var el = $("#" + id); return el ? el.value.trim() : ""; };
    var ok = true;
    var firstBad = null;
    var fail = function (id) {
      showErr(id, true);
      ok = false;
      if (!firstBad) firstBad = $("#" + id) || $("#" + id + "Group");
    };

    if (!val("af_company")) fail("af_company"); else showErr("af_company", false);
    if (!emailOk(val("af_email"))) fail("af_email"); else showErr("af_email", false);
    if (!val("af_title")) fail("af_title"); else showErr("af_title", false);
    if (!val("af_text")) fail("af_text"); else showErr("af_text", false);

    var kindMsg = $('.err-msg[data-for="aktionKind"]');
    if (!kind) {
      if (kindMsg) kindMsg.classList.add("show");
      ok = false;
      if (!firstBad) firstBad = $("#aktionKind");
    } else if (kindMsg) {
      kindMsg.classList.remove("show");
    }

    var privMsg = $('.err-msg[data-for="af_privacy"]');
    if (privacy && !privacy.checked) {
      if (privMsg) privMsg.classList.add("show");
      ok = false;
      if (!firstBad) firstBad = privacy;
    } else if (privMsg) {
      privMsg.classList.remove("show");
    }

    if (!ok) {
      if (firstBad && firstBad.scrollIntoView) {
        firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
        if (firstBad.focus) firstBad.focus({ preventScroll: true });
      }
      return;
    }

    var dash = function (v) { return v || "—"; };
    var felder = {
      subject: "Aktion einreichen – " + val("af_title") + " (" + val("af_company") + ")",
      from_name: val("af_company"),
      replyto: val("af_email"),
      Betrieb: val("af_company"),
      Ansprechpartner: dash(val("af_contact")),
      "E-Mail": val("af_email"),
      Telefon: dash(val("af_phone")),
      "Art der Aktion": kind,
      Titel: val("af_title"),
      Zeitraum: dash(val("af_from")) + " bis " + dash(val("af_to")),
      Link: dash(val("af_link")),
      Beschreibung: val("af_text")
    };

    var label = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Wird gesendet …"; }

    window.GdsSubmit.senden(felder).then(function () {
      $$("fieldset, .fields > .field, .grid-2", form).forEach(function (el) { el.hidden = true; });
      if (submitBtn) submitBtn.hidden = true;
      var done = $("#aktionDone");
      if (done) { done.hidden = false; done.scrollIntoView({ behavior: "smooth", block: "center" }); }
    }).catch(function () {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = label; }
      if (notice) {
        notice.hidden = false;
        notice.querySelector("span").innerHTML =
          "<strong>Das hat nicht geklappt.</strong> Bitte versuchen Sie es noch einmal oder schreiben Sie uns an " +
          '<a href="mailto:info@laendle-digital.com">info@laendle-digital.com</a>.';
        notice.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });
})();

/* ============================================================
   Betriebsdialog

   Jede Kachel trägt ihre Angaben als verborgenen Block neben sich.
   Beim Antippen wandern Bild und Text in den Dialog. Die Daten
   stehen damit auch ohne JavaScript im Quelltext.
============================================================ */
(function () {
  "use strict";

  var dlg = document.getElementById("bizDlg");
  if (!dlg) return;

  var bild = document.getElementById("bizDlgBild");
  var text = document.getElementById("bizDlgText");
  var name = document.getElementById("bizDlgTitel");
  var zuletzt = null;

  function oeffnen(figur) {
    var daten = figur.querySelector(".post__daten");
    var quelle = figur.querySelector("img");
    if (!daten || !quelle) return;

    var titel = daten.querySelector("h3");
    name.textContent = titel ? titel.textContent : "";

    /* Name, Kategorie und Adresse stehen schon in der Grafik. Hier kommt
       nur dazu, was dort keinen Platz hat. */
    text.innerHTML = "";
    daten.querySelectorAll(".bd__adr, .bd__txt, .bd__links, .bd__offen")
      .forEach(function (el) { text.appendChild(el.cloneNode(true)); });

    bild.src = quelle.getAttribute("src");
    bild.alt = quelle.getAttribute("alt") || "";
    bild.width = quelle.getAttribute("width") || 1080;
    bild.height = quelle.getAttribute("height") || 1080;

    zuletzt = figur.querySelector(".post__auf");
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
    dlg.scrollTop = 0;
  }

  function schliessen() {
    if (typeof dlg.close === "function") dlg.close();
    else dlg.removeAttribute("open");
  }

  document.addEventListener("click", function (ev) {
    var knopf = ev.target.closest && ev.target.closest(".post__auf");
    if (knopf) {
      ev.preventDefault();
      oeffnen(knopf.closest(".post"));
    }
  });

  var zu = dlg.querySelector(".bizdlg__zu");
  if (zu) zu.addEventListener("click", schliessen);

  /* Klick auf die Fläche daneben schliesst ebenfalls. */
  dlg.addEventListener("click", function (ev) {
    if (ev.target === dlg) schliessen();
  });

  /* Fokus zurück auf die Kachel, von der aus geöffnet wurde. */
  dlg.addEventListener("close", function () {
    if (zuletzt && zuletzt.focus) zuletzt.focus();
    zuletzt = null;
  });
})();
