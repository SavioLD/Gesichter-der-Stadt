/* ============================================================
   Gesichter der Stadt – Anmeldeformular

   Enthält Bankverbindung und zwei Unterschriften. Versendet wird
   über Web3Forms an die Adresse, die dort zum Access Key hinterlegt
   ist (info@laendle-digital.com). Der Schlüssel steht in config.js.

   Per mailto ginge das nicht: allein die beiden Unterschriften
   ergeben rund 25.000 Zeichen, viele Systeme brechen eine
   mailto-Adresse aber schon bei etwa 2.000 ab.

   Die Unterschriften gehen als echte PNG-Dateien mit, nicht als
   Textblock im E-Mail-Text.

   Solange kein Schlüssel hinterlegt ist, bleibt das Absenden
   gesperrt – die Daten verlassen den Browser nicht.
============================================================ */
(function () {
  "use strict";

  var form = document.getElementById("anmeldungForm");
  if (!form) return;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };


  /* ------------------------------------------------ Unterschriften --- */

  var SignaturePad = window.GdsSignaturePad;   // aus signature.js

  var pads = {};
  $$(".sig", form).forEach(function (box) { pads[box.getAttribute("data-sig")] = SignaturePad(box); });

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

  /* ---------------------------------------------- Beitrag anzeigen ---
     Rechnet aus Größe und Zahlungsweise den Beitrag für ein volles
     Projektjahr aus. Die jährliche Zahlung ist um 5 % rabattiert.
  --------------------------------------------------------------------- */

  var euro = function (n) {
    return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  };

  var priceBox = $("#an_price");

  function zeigeBeitrag() {
    var g = $("input:checked", $("#an_sizeGroup"));
    var z = $("input:checked", $("#an_payGroup"));
    if (!g || !z) { priceBox.hidden = true; return; }

    var monat = parseFloat(g.getAttribute("data-monat"));
    var raten = parseInt(z.getAttribute("data-raten"), 10);
    var rabatt = parseFloat(z.getAttribute("data-rabatt")) / 100;

    if (!raten) {                       // individuelle Lösung
      priceBox.innerHTML = "Den Beitrag stimmen wir persönlich mit Ihnen ab.";
      priceBox.hidden = false;
      return;
    }

    var voll = monat * 12;
    var zuZahlen = voll * (1 - rabatt);

    if (rabatt) {
      priceBox.innerHTML =
        "<strong>" + euro(zuZahlen) + "</strong> für ein volles Projektjahr statt " +
        "<s>" + euro(voll) + "</s> – Sie sparen " + euro(voll - zuZahlen) + ".";
    } else {
      priceBox.innerHTML =
        "<strong>" + euro(zuZahlen) + "</strong> für ein volles Projektjahr, zahlbar in " +
        raten + " Raten zu je " + euro(zuZahlen / raten) +
        ". <em>Bei jährlicher Zahlung sparen Sie " + euro(voll * 0.05) + ".</em>";
    }
    priceBox.hidden = false;
  }

  $$(".opts input[type=radio]", form).forEach(function (r) {
    r.addEventListener("change", zeigeBeitrag);
  });
  zeigeBeitrag();

  /* IBAN beim Verlassen des Feldes in Vierergruppen setzen */
  var ibanEl = $("#an_iban");
  ibanEl.addEventListener("blur", function () {
    var v = ibanEl.value.replace(/\s+/g, "").toUpperCase();
    if (v) ibanEl.value = v.replace(/(.{4})/g, "$1 ").trim();
  });

  /* --------------------------------------------------- Freischaltung --- */

  var notice = $("#anNotice");
  var submitBtn = $("#anSubmit");
  if (!window.GdsSubmit || !window.GdsSubmit.bereit()) {
    notice.hidden = false;
    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-describedby", "anNotice");
  }

  /* ------------------------------------------------------- Absenden --- */

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!window.GdsSubmit || !window.GdsSubmit.bereit()) return;

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
    var strich = function (v) { return v || "—"; };

    var felder = {
      subject: "Anmeldung – " + val("an_company"),
      from_name: val("an_company"),
      replyto: val("an_email"),
      Betrieb: val("an_company"),
      "E-Mail": val("an_email"),
      Telefon: val("an_phone"),
      Ansprechpartner: val("an_salutation") + " " + val("an_first") + " " + val("an_last"),
      Adresse: val("an_street") + ", " + val("an_zip") + " " + val("an_city"),
      "Unternehmensgröße": checked("an_sizeGroup"),
      Zahlungsweise: checked("an_payGroup"),
      Bankinstitut: strich(val("an_bank")),
      Kontoinhaber: val("an_holder"),
      IBAN: val("an_iban").replace(/\s+/g, ""),
      BIC: val("an_bic").toUpperCase(),
      Datenschutz: "zugestimmt",
      Eingereicht: new Date().toLocaleString("de-DE")
    };

    submitBtn.disabled = true;
    var label = submitBtn.innerHTML;
    submitBtn.textContent = "Wird gesendet …";

    var sicher = function (s) { return s.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 40); };

    Promise.all([pads.sepa.toBlob(), pads.terms.toBlob()]).then(function (blobs) {
      return window.GdsSubmit.senden(felder, [
        { feld: "Unterschrift SEPA-Mandat", dateiname: "unterschrift-sepa-" + sicher(val("an_company")) + ".png", blob: blobs[0] },
        { feld: "Unterschrift Anmeldung", dateiname: "unterschrift-anmeldung-" + sicher(val("an_company")) + ".png", blob: blobs[1] }
      ]);
    }).then(function () {
      $$("fieldset", form).forEach(function (f) { f.hidden = true; });
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
