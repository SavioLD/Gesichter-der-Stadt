/* ============================================================
   Gesichter der Stadt – Ergänzung zur Teilnahme

   Bestätigung der ergänzenden Bedingungen durch Betriebe, die
   bereits über das frühere Formular abgeschlossen haben.

   Versand über Web3Forms an info@laendle-digital.com; der Access
   Key steht in config.js. Die Unterschrift geht als PNG-Datei mit.
   Ohne hinterlegten Schlüssel bleibt das Absenden gesperrt.
============================================================ */
(function () {
  "use strict";

  var form = document.getElementById("ergaenzungForm");
  if (!form) return;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };


  /* Kennung der Fassung – bei inhaltlicher Änderung der Ziffern hochzählen,
     damit später nachvollziehbar bleibt, wem welcher Text vorlag. */
  var FASSUNG = "2026-08-ergaenzung-1";

  var pad = window.GdsSignaturePad($(".sig", form));

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
  if (!window.GdsSubmit || !window.GdsSubmit.bereit()) {
    notice.hidden = false;
    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-describedby", "erNotice");
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!window.GdsSubmit || !window.GdsSubmit.bereit()) return;

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

    var felder = {
      subject: "Ergänzung bestätigt – " + val("er_company"),
      from_name: val("er_company"),
      replyto: val("er_email"),
      Betrieb: val("er_company"),
      "E-Mail": val("er_email"),
      Unterzeichner: val("er_name"),
      Zustimmung: "erteilt",
      Fassung: FASSUNG,
      Eingereicht: new Date().toLocaleString("de-DE")
    };

    submitBtn.disabled = true;
    var label = submitBtn.innerHTML;
    submitBtn.textContent = "Wird gesendet …";

    var sicher = function (s) { return s.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 40); };

    pad.toBlob().then(function (blob) {
      return window.GdsSubmit.senden(felder, [
        { feld: "Unterschrift", dateiname: "unterschrift-ergaenzung-" + sicher(val("er_company")) + ".png", blob: blob }
      ]);
    }).then(function () {
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
