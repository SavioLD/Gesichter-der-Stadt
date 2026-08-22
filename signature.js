/* ============================================================
   Gesichter der Stadt – Unterschriftenfeld

   Wird von anmeldung.js und ergaenzung.js genutzt. Erwartet Markup:

     <div class="sig" data-sig="NAME">
       <canvas class="sig__pad"></canvas>
       <span class="sig__line"></span>
       <span class="sig__hint">…</span>
       <button type="button" class="sig__clear">Löschen</button>
     </div>

   window.GdsSignaturePad(box) liefert:
     isSigned()   – wurde gezeichnet?
     toDataURL()  – PNG als data:-URL, sonst ""
     box          – das Element, für Fehlermarkierung und Scrollen
============================================================ */
(function () {
  "use strict";

  window.GdsSignaturePad = function (box) {
    var canvas = box.querySelector(".sig__pad");
    var ctx = canvas.getContext("2d");
    var drawing = false, dirty = false, last = null;

    function resize() {
      var keep = dirty ? canvas.toDataURL() : null;
      var rect = box.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#2b2622";
      if (keep) {
        var img = new Image();
        img.onload = function () { ctx.drawImage(img, 0, 0, rect.width, rect.height); };
        img.src = keep;
      }
    }

    function pos(ev) {
      var rect = canvas.getBoundingClientRect();
      var p = ev.touches ? ev.touches[0] : ev;
      return { x: p.clientX - rect.left, y: p.clientY - rect.top };
    }

    function markDirty() {
      if (!dirty) { dirty = true; box.classList.add("is-signed"); }
      box.classList.remove("err");
      var msg = document.querySelector('.err-msg[data-for="sig-' + box.getAttribute("data-sig") + '"]');
      if (msg) msg.classList.remove("show");
    }

    function start(ev) {
      ev.preventDefault();
      drawing = true;
      last = pos(ev);
      // einzelner Tipp soll auch einen Punkt setzen
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(last.x + 0.1, last.y);
      ctx.stroke();
      markDirty();
    }

    function move(ev) {
      if (!drawing) return;
      ev.preventDefault();
      var p = pos(ev);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
    }

    function end() { drawing = false; }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);

    box.querySelector(".sig__clear").addEventListener("click", function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dirty = false;
      box.classList.remove("is-signed");
    });

    var t;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(resize, 160); });
    resize();

    return {
      box: box,
      isSigned: function () { return dirty; },
      toDataURL: function () { return dirty ? canvas.toDataURL("image/png") : ""; },
      /* als echte PNG-Datei, damit sie als Anhang mitgehen kann */
      toBlob: function () {
        if (!dirty) return Promise.resolve(null);
        return new Promise(function (auf) { canvas.toBlob(auf, "image/png"); });
      }
    };
  };
})();
