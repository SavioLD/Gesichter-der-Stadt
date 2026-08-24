/* ============================================================
   Gesichter der Stadt – Betriebsprofil

   Teilnehmende Betriebe hinterlegen hier selbst Logo, Branche,
   Kategorietext und Beschreibung. Daraus entstehen Kachel,
   Beiträge und Video.

   Versand über Web3Forms an info@laendle-digital.com, Schlüssel
   siehe config.js. Das Logo geht als echte Datei mit.

   Ist in config.js zusätzlich GDS_AUTOMATIK_URL gesetzt, geht das
   Profil parallel an die Annahmestelle. Die legt Logo und Eintrag
   selbst im Repository ab, die Kachel baut danach die GitHub
   Action. Die E-Mail bleibt davon unberührt – sie enthält auch die
   Kontaktdaten, die bewusst nicht ins öffentliche Repository
   gehören.
============================================================ */
(function () {
  "use strict";

  var form = document.getElementById("profilForm");
  if (!form) return;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var MAX_MB = 5;

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

  /* Dateiname anzeigen, sobald ein Logo gewählt wurde */
  var logo = $("#bp_logo");
  var logoName = $("#bp_logoName");
  logo.addEventListener("change", function () {
    var f = logo.files && logo.files[0];
    if (!f) { logoName.textContent = "Keine Datei gewählt"; return; }
    logoName.textContent = f.name + " (" + (f.size / 1024 / 1024).toFixed(1) + " MB)";
    showErr("bp_logo", false);
  });

  $$(".input", form).forEach(function (el) {
    var ev = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(ev, function () { showErr(el.id, false); });
  });
  var privacy = $("#bp_privacy");
  privacy.addEventListener("change", function () { if (privacy.checked) showErr("bp_privacy", false); });

  /* Betriebsauswahl aus betriebe.json füllen. Klappt das nicht,
     bleibt das Feld verborgen und der Firmenname allein zählt. */
  var picker = $("#bp_picker");
  var pickerFeld = $("#bp_pickerField");
  var firma = $("#bp_company");

  fetch("betriebe.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (liste) {
      if (!Array.isArray(liste) || !liste.length) return;
      liste.slice().sort(function (a, b) { return a.name.localeCompare(b.name, "de"); })
        .forEach(function (b) {
          var o = document.createElement("option");
          o.value = b.slug;
          o.textContent = b.name;
          picker.appendChild(o);
        });
      var neu = document.createElement("option");
      neu.value = "__neu";
      neu.textContent = "Mein Betrieb ist noch nicht dabei";
      picker.appendChild(neu);
      pickerFeld.hidden = false;

      /* Auswahl trägt den Namen gleich ins Firmenfeld ein. */
      picker.addEventListener("change", function () {
        showErr("bp_picker", false);
        var treffer = liste.filter(function (b) { return b.slug === picker.value; })[0];
        if (treffer && !firma.value.trim()) { firma.value = treffer.name; showErr("bp_company", false); }
      });
    })
    .catch(function () { /* ohne Liste läuft das Formular wie bisher */ });

  var notice = $("#bpNotice");
  var submitBtn = $("#bpSubmit");
  if (!window.GdsSubmit || !window.GdsSubmit.bereit()) {
    notice.hidden = false;
    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-describedby", "bpNotice");
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!window.GdsSubmit || !window.GdsSubmit.bereit()) return;

    var trap = $("#bp_website");
    if (trap && trap.value) return;

    var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
    var ok = true, firstBad = null;
    var fail = function (key) {
      showErr(key, true);
      ok = false;
      if (!firstBad) firstBad = document.getElementById(key);
    };

    ["bp_company", "bp_contact", "bp_branche", "bp_label", "bp_text"].forEach(function (id) {
      if (!val(id)) fail(id); else showErr(id, false);
    });
    if (!emailOk(val("bp_email"))) fail("bp_email"); else showErr("bp_email", false);

    var datei = logo.files && logo.files[0];
    if (!datei || datei.size > MAX_MB * 1024 * 1024) {
      fail("bp_logo");
      if (datei) {
        $('.err-msg[data-for="bp_logo"]').textContent =
          "Die Datei ist " + (datei.size / 1024 / 1024).toFixed(1) + " MB groß – bitte höchstens " + MAX_MB + " MB.";
      }
    } else {
      showErr("bp_logo", false);
    }

    if (!pickerFeld.hidden && !picker.value) { showErr("bp_picker", true); ok = false; if (!firstBad) firstBad = picker; }
    else showErr("bp_picker", false);

    if (!privacy.checked) { showErr("bp_privacy", true); ok = false; if (!firstBad) firstBad = privacy; }
    else showErr("bp_privacy", false);

    if (!ok) {
      if (firstBad && firstBad.scrollIntoView) {
        firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
        if (firstBad.focus) firstBad.focus({ preventScroll: true });
      }
      return;
    }

    var strich = function (v) { return v || "—"; };
    var felder = {
      subject: "Betriebsprofil – " + val("bp_company"),
      from_name: val("bp_company"),
      replyto: val("bp_email"),
      Betrieb: val("bp_company"),
      Ansprechpartner: val("bp_contact"),
      "E-Mail": val("bp_email"),
      Telefon: strich(val("bp_phone")),
      Branche: val("bp_branche"),
      "Text auf der Grafik": val("bp_label"),
      Beschreibung: val("bp_text"),
      Instagram: strich(val("bp_insta")),
      Website: strich(val("bp_web")),
      Eingereicht: new Date().toLocaleString("de-DE")
    };

    submitBtn.disabled = true;
    var label = submitBtn.innerHTML;
    submitBtn.textContent = "Wird gesendet …";

    var sicher = function (s) { return s.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 40); };
    var endung = (datei.name.match(/\.[a-zA-Z0-9]+$/) || [".png"])[0];

    /* Parallel an die Annahmestelle. Schlägt das fehl, bleibt die
       E-Mail trotzdem gültig – die Einreichung ist nicht verloren. */
    var automatik = Promise.resolve(null);
    if (window.GDS_AUTOMATIK_URL) {
      var paket = new FormData();
      paket.append("slug", picker && picker.value !== "__neu" ? picker.value : "");
      paket.append("betrieb", val("bp_company"));
      paket.append("kategorie", val("bp_label"));
      paket.append("instagram", val("bp_insta"));
      paket.append("website", val("bp_web"));
      paket.append("logo", datei, datei.name);
      automatik = fetch(window.GDS_AUTOMATIK_URL, { method: "POST", body: paket })
        .then(function (r) { return r.json(); })
        .catch(function () { return null; });
    }

    Promise.all([
      window.GdsSubmit.senden(felder, [
        { feld: "Logo", dateiname: "logo-" + sicher(val("bp_company")) + endung, blob: datei }
      ]),
      automatik
    ]).then(function () {
      $$("fieldset", form).forEach(function (f) { f.hidden = true; });
      $$(".fields > .field", form).forEach(function (f) { f.hidden = true; });
      submitBtn.hidden = true;
      $("#bpDone").hidden = false;
      $("#bpDone").scrollIntoView({ behavior: "smooth", block: "center" });
    }).catch(function () {
      submitBtn.disabled = false;
      submitBtn.innerHTML = label;
      notice.hidden = false;
      notice.querySelector("span").innerHTML =
        "<strong>Das hat nicht geklappt.</strong> Bitte versuchen Sie es noch einmal oder schicken Sie uns Ihre Angaben an " +
        '<a href="mailto:info@laendle-digital.com">info@laendle-digital.com</a>.';
      notice.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
})();
