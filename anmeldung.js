/* ============================================================
   Gesichter der Stadt – Anmeldeformular

   Enthält Bankverbindung und Unterschriften. Diese Daten werden
   bewusst NICHT per mailto verschickt: unverschlüsselte E-Mail ist
   für IBAN und Unterschrift der falsche Kanal.

   Stattdessen sendet das Formular ein JSON per POST an die URL aus
   dem Attribut data-endpoint am <form>. Solange das Attribut leer
   ist, bleibt das Absenden gesperrt und ein Hinweis erscheint – die
   Daten verlassen den Browser nicht.

   Aufbau des POST-Bodys:
     {
       firmenname, email, telefon,
       anrede, vorname, nachname, adresse, plz, stadt,
       groesse, zahlungsweise,
       bankinstitut, kontoinhaber, iban, bic,
       unterschriftSepa,   // PNG als data:-URL
       unterschriftAgb,    // PNG als data:-URL
       datenschutz,        // true
       gesendetAm          // ISO-Zeitstempel
     }
============================================================ */
(function () {
  "use strict";

  var form = document.getElementById("anmeldungForm");
  if (!form) return;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var ENDPOINT = (form.getAttribute("data-endpoint") || "").trim();

  /* ------------------------------------------------ Unterschriften --- */

  var SignaturePad = window.GdsSignaturePad;   // aus signature.js

  var pads = {};
  $$(".sig").forEach(function (box) { pads[box.getAttribute("data-sig")] = SignaturePad(box); });

  /* ------------------------------------------------------ Prüfungen --- */

  var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };

  /* IBAN: Länge, Zeichen und Prüfsumme nach ISO 7064 (Modulo 97) */
  function ibanOk(raw) {
    var v = raw.replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/.test(v)) return false;
    var re = v.slice(4) + v.slice(0, 4);
    var digits = "";
    for (var i = 0; i < re.length; i++) {
      var c = re.charCodeAt(i);
      digits += (c >= 65 && c <= 90) ? String(c - 55) : re[i];
    }
    var rest = 0;
    for (var j = 0; j < digits.length; j += 7) {
      rest = parseInt(String(rest) + digits.substr(j, 7), 10) % 97;
    }
    return rest === 1;
  }

  function showErr(key, on) {
    var msg = $('.err-msg[data-for="' + key + '"]');
    if (msg) msg.classList.toggle("show", on);
    var field = document.getElementById(key);
    if (field) {
      field.classList.toggle("err", on);
      field.setAttribute("aria-invalid", on ? "true" : "false");
    }
  }

  /* Fehler verschwinden, sobald korrigiert wird */
  $$(".input", form).forEach(function (el) {
    var ev = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(ev, function () { showErr(el.id, false); });
  });
  $$(".opts input[type=radio]", form).forEach(function (r) {
    r.addEventListener("change", function () {
      var group = r.closest(".opts");
      showErr(group.id, false);
      group.classList.remove("err");
    });
  });
  var privacy = $("#an_privacy");
  privacy.addEventListener("change", function () { if (privacy.checked) showErr("an_privacy", false); });

  /* IBAN beim Verlassen des Feldes in Vierergruppen setzen */
  var ibanEl = $("#an_iban");
  ibanEl.addEventListener("blur", function () {
    var v = ibanEl.value.replace(/\s+/g, "").toUpperCase();
    if (v) ibanEl.value = v.replace(/(.{4})/g, "$1 ").trim();
  });

  /* --------------------------------------------------- Freischaltung --- */

  var notice = $("#anNotice");
  var submitBtn = $("#anSubmit");
  if (!ENDPOINT) {
    notice.hidden = false;
    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-describedby", "anNotice");
  }

  /* ------------------------------------------------------- Absenden --- */

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!ENDPOINT) return;

    var trap = $("#an_website");
    if (trap && trap.value) return;

    var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
    var ok = true, firstBad = null;
    var fail = function (key) {
      showErr(key, true);
      ok = false;
      if (!firstBad) firstBad = document.getElementById(key);
    };

    [["an_company"], ["an_phone"], ["an_salutation"], ["an_first"], ["an_last"],
     ["an_street"], ["an_zip"], ["an_city"], ["an_holder"], ["an_bic"]].forEach(function (f) {
      if (!val(f[0])) fail(f[0]); else showErr(f[0], false);
    });

    if (!emailOk(val("an_email"))) fail("an_email"); else showErr("an_email", false);
    if (!ibanOk(val("an_iban"))) fail("an_iban"); else showErr("an_iban", false);

    ["an_sizeGroup", "an_payGroup"].forEach(function (id) {
      var group = document.getElementById(id);
      if (!$("input:checked", group)) {
        showErr(id, true);
        group.classList.add("err");
        ok = false;
        if (!firstBad) firstBad = group;
      } else {
        showErr(id, false);
        group.classList.remove("err");
      }
    });

    Object.keys(pads).forEach(function (k) {
      var pad = pads[k];
      if (!pad.isSigned()) {
        var msg = $('.err-msg[data-for="sig-' + k + '"]');
        if (msg) msg.classList.add("show");
        pad.box.classList.add("err");
        ok = false;
        if (!firstBad) firstBad = pad.box;
      }
    });

    if (!privacy.checked) { showErr("an_privacy", true); ok = false; if (!firstBad) firstBad = privacy; }
    else showErr("an_privacy", false);

    if (!ok) {
      if (firstBad && firstBad.scrollIntoView) {
        firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
        if (firstBad.focus) firstBad.focus({ preventScroll: true });
      }
      return;
    }

    var checked = function (id) { var el = $("input:checked", document.getElementById(id)); return el ? el.value : ""; };
    var payload = {
      firmenname: val("an_company"),
      email: val("an_email"),
      telefon: val("an_phone"),
      anrede: val("an_salutation"),
      vorname: val("an_first"),
      nachname: val("an_last"),
      adresse: val("an_street"),
      plz: val("an_zip"),
      stadt: val("an_city"),
      groesse: checked("an_sizeGroup"),
      zahlungsweise: checked("an_payGroup"),
      bankinstitut: val("an_bank"),
      kontoinhaber: val("an_holder"),
      iban: val("an_iban").replace(/\s+/g, ""),
      bic: val("an_bic").toUpperCase(),
      unterschriftSepa: pads.sepa.toDataURL(),
      unterschriftAgb: pads.terms.toDataURL(),
      datenschutz: true,
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
      form.querySelector(".fields").querySelectorAll("fieldset").forEach(function (f) { f.hidden = true; });
      submitBtn.hidden = true;
      $("#anDone").hidden = false;
      $("#anDone").scrollIntoView({ behavior: "smooth", block: "center" });
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
