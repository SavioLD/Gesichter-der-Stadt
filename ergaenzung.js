/* ============================================================
   Gesichter der Stadt – Ergänzung zur Teilnahme

   Bestätigung der ergänzenden Bedingungen durch Betriebe, die
   bereits über das frühere Formular abgeschlossen haben.

   Wie beim Anmeldeformular: Versand per POST an die URL aus
   data-endpoint am <form>. Solange leer, bleibt das Absenden
   gesperrt – die Unterschrift verlässt den Browser nicht.

   Aufbau des POST-Bodys:
     {
       firmenname, email, unterzeichner,
       unterschrift,   // PNG als data:-URL
       zustimmung,     // true
       fassung,        // Kennung der bestätigten Fassung
       gesendetAm      // ISO-Zeitstempel
     }
============================================================ */
(function () {
  "use strict";

  var form = document.getElementById("ergaenzungForm");
  if (!form) return;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var ENDPOINT = (form.getAttribute("data-endpoint") || "").trim();

  /* Kennung der Fassung – bei inhaltlicher Änderung der Ziffern hochzählen,
     damit später nachvollziehbar bleibt, wem welcher Text vorlag. */
  var FASSUNG = "2026-08-ergaenzung-1";

  var pad = window.GdsSignaturePad($(".sig"));

  var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };

  function showErr(key, on) {
    var msg = $('.err-msg[data-for="' + key + '"]');
    if (msg) msg.classList.toggle("show", on);
    var field = document.getElementById(key);
    if (field) {
      field.classList.toggle("err", on);
      field.setAttribute("aria-invalid", on ? "true" : "false");
    }
  }

  $$(".input", form).forEach(function (el) {
    el.addEventListener("input", function () { showErr(el.id, false); });
  });
  var agree = $("#er_agree");
  agree.addEventListener("change", function () { if (agree.checked) showErr("er_agree", false); });

  var notice = $("#erNotice");
  var submitBtn = $("#erSubmit");
  if (!ENDPOINT) {
    notice.hidden = false;
    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-describedby", "erNotice");
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!ENDPOINT) return;

    var trap = $("#er_website");
    if (trap && trap.value) return;

    var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
    var ok = true, firstBad = null;
    var fail = function (key) {
      showErr(key, true);
      ok = false;
      if (!firstBad) firstBad = document.getElementById(key);
    };

    if (!val("er_company")) fail("er_company"); else showErr("er_company", false);
    if (!val("er_name")) fail("er_name"); else showErr("er_name", false);
    if (!emailOk(val("er_email"))) fail("er_email"); else showErr("er_email", false);

    if (!pad.isSigned()) {
      var msg = $('.err-msg[data-for="sig-ergaenzung"]');
      if (msg) msg.classList.add("show");
      pad.box.classList.add("err");
      ok = false;
      if (!firstBad) firstBad = pad.box;
    }

    if (!agree.checked) { showErr("er_agree", true); ok = false; if (!firstBad) firstBad = agree; }
    else showErr("er_agree", false);

    if (!ok) {
      if (firstBad && firstBad.scrollIntoView) {
        firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
        if (firstBad.focus) firstBad.focus({ preventScroll: true });
      }
      return;
    }

    var payload = {
      firmenname: val("er_company"),
      email: val("er_email"),
      unterzeichner: val("er_name"),
      unterschrift: pad.toDataURL(),
      zustimmung: true,
      fassung: FASSUNG,
      gesendetAm: new Date().toISOString()
    };

    submitBtn.disabled = true;
    var label = submitBtn.innerHTML;
    submitBtn.textContent = "Wird gesendet …";

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      $$("fieldset", form).forEach(function (f) { f.hidden = true; });
      submitBtn.hidden = true;
      $("#erDone").hidden = false;
      $("#erDone").scrollIntoView({ behavior: "smooth", block: "center" });
    }).catch(function () {
      submitBtn.disabled = false;
      submitBtn.innerHTML = label;
      notice.hidden = false;
      notice.querySelector("span").innerHTML =
        "<strong>Das hat nicht geklappt.</strong> Bitte versuchen Sie es noch einmal oder schreiben Sie uns an " +
        '<a href="mailto:info@laendle-digital.com">info@laendle-digital.com</a>.';
      notice.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
})();
