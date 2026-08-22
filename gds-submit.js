/* ============================================================
   Gesichter der Stadt – Versand über Web3Forms

   Alle drei Formulare senden hierüber an die Adresse, die bei
   Web3Forms zum Access Key hinterlegt ist (info@laendle-digital.com).
   Der Schlüssel steht in config.js.

   Gesendet wird als multipart/form-data, damit Unterschriften als
   echte Bilddateien mitgehen statt als endloser Textblock im
   E-Mail-Text.

   window.GdsSubmit.bereit()  -> ist ein Schlüssel hinterlegt?
   window.GdsSubmit.senden(felder, dateien) -> Promise
       felder  : { name: wert, ... }  (subject, from_name, replyto
                  werden von Web3Forms besonders behandelt)
       dateien : [ { feld, dateiname, blob } ]
============================================================ */
(function () {
  "use strict";

  var ENDPUNKT = "https://api.web3forms.com/submit";

  window.GdsSubmit = {

    schluessel: function () {
      return String(window.GDS_WEB3FORMS_KEY || "").trim();
    },

    bereit: function () {
      return this.schluessel().length > 0;
    },

    senden: function (felder, dateien) {
      var key = this.schluessel();
      if (!key) return Promise.reject(new Error("Kein Access Key hinterlegt"));

      var fd = new FormData();
      fd.append("access_key", key);
      Object.keys(felder).forEach(function (k) {
        if (felder[k] !== undefined && felder[k] !== null && felder[k] !== "") {
          fd.append(k, felder[k]);
        }
      });
      (dateien || []).forEach(function (d) {
        if (d && d.blob) fd.append(d.feld, d.blob, d.dateiname);
      });

      return fetch(ENDPUNKT, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: fd
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok || data.success === false) {
            throw new Error(data.message || ("HTTP " + res.status));
          }
          return data;
        });
      });
    }
  };
})();
