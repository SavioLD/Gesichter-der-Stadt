/* ============================================================
   Kachel-Generator für "Gesichter der Stadt"

   Baut aus betriebe.json und dem hinterlegten Logo eine
   Post-Grafik (1080 x 1080) nach der Vorlage der bestehenden
   Beiträge und legt sie unter posts/<slug>.png ab.

   Einmalig:  cd tools && npm install
   Aufruf:    node tools/kachel.js wohn-schick-gmbh-co-kg
              node tools/kachel.js --alle
============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const REPO = path.join(__dirname, "..");
const FONTS = path.join(__dirname, "node_modules", "@fontsource");

/* Der Logo-Rahmen auf der Kachel. Kleiner wird ein Logo nur, nie grösser –
   hochskalieren macht es unscharf, und genau das wollen wir nicht mehr. */
const MAX_B = 820;
const MAX_H = 400;

const b64 = (p) => fs.readFileSync(p).toString("base64");
const typ = (p) => (/\.jpe?g$/i.test(p) ? "image/jpeg" : "image/png");
const istPdf = (p) => /\.pdf$/i.test(p);

/* Druckereien liefern Logos meist als PDF. Die Seite wird gerendert und
   anschliessend auf den tatsächlich bedruckten Bereich beschnitten –
   sonst sässe das Logo verloren in einer leeren A4-Fläche. */
async function pdfRendern(datei) {
  const mupdf = await import("mupdf");
  const doc = mupdf.Document.openDocument(fs.readFileSync(datei), "application/pdf");
  if (!doc.countPages()) throw new Error("PDF hat keine Seite");
  const pix = doc.loadPage(0).toPixmap(
    mupdf.Matrix.scale(3, 3), mupdf.ColorSpace.DeviceRGB, true, true);
  return "data:image/png;base64," + Buffer.from(pix.asPNG()).toString("base64");
}

const schriften = [
  ["Roboto Condensed", 700, `${FONTS}/roboto-condensed/files/roboto-condensed-latin-700-normal.woff2`],
  ["Inter", 700, `${FONTS}/inter/files/inter-latin-700-normal.woff2`],
];

const schriftCss = schriften
  .map(([f, w, p]) =>
    `@font-face{font-family:"${f}";font-style:normal;font-weight:${w};` +
    `src:url(data:font/woff2;base64,${b64(p)}) format("woff2")}`)
  .join("\n");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* Vorlage nach dem Vorbild der bestehenden Beiträge */
function vorlage({ logo, name, kategorie, adresse, breite, hoehe }) {
  return `<!doctype html><meta charset="utf-8"><style>
${schriftCss}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1080px;background:#fbf8f2;position:relative;overflow:hidden;
     font-family:"Inter",sans-serif;-webkit-font-smoothing:antialiased}
.eyebrow{position:absolute;top:76px;font-weight:700;font-size:15px;letter-spacing:.24em;
         text-transform:uppercase;display:flex;align-items:center;gap:11px;white-space:nowrap}
.left{left:80px;color:#2b2622}
.left::before{content:"";width:9px;height:9px;border-radius:50%;background:#d5782a}
.right{right:80px;color:#d5782a}
.logo{position:absolute;left:50%;top:440px;transform:translate(-50%,-50%);
      width:${breite}px;height:${hoehe}px}
.logo img{width:${breite}px;height:${hoehe}px;display:block}
.name{position:absolute;left:0;right:0;top:718px;text-align:center;
      font-family:"Roboto Condensed",sans-serif;font-weight:700;font-size:56px;
      line-height:1.1;color:#2b2622;padding:0 90px}
.band{position:absolute;left:0;right:0;bottom:0;height:140px;background:#d5782a;
      border-radius:50% 50% 0 0 / 26px 26px 0 0}
.band span{position:absolute;left:0;right:0;bottom:44px;text-align:center;color:#fff;
           font-weight:700;font-size:15px;letter-spacing:.26em;text-transform:uppercase;
           padding:0 60px;white-space:nowrap;overflow:hidden}
</style>
<div class="eyebrow left" id="links">Gesichter unserer Stadt</div>
<div class="eyebrow right" id="rechts">${esc(kategorie)}</div>
<div class="logo"><img id="marke" src="${logo}"></div>
<div class="name">${esc(name)}</div>
<div class="band"><span id="fuss">${esc(adresse || "Rottweil")}</span></div>`;
}

/* Durchsichtigen Rand wegschneiden und die echten Masse zurückgeben. */
async function beschneiden(seite, quelle) {
  return seite.evaluate(
    (src) =>
      new Promise((ok, fehler) => {
        const i = new Image();
        i.onload = () => {
          const c = document.createElement("canvas");
          c.width = i.naturalWidth;
          c.height = i.naturalHeight;
          const ctx = c.getContext("2d");
          ctx.drawImage(i, 0, 0);
          const d = ctx.getImageData(0, 0, c.width, c.height).data;
          let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
          for (let y = 0; y < c.height; y++) {
            for (let x = 0; x < c.width; x++) {
              if (d[(y * c.width + x) * 4 + 3] > 8) {
                if (x < x0) x0 = x;
                if (y < y0) y0 = y;
                if (x > x1) x1 = x;
                if (y > y1) y1 = y;
              }
            }
          }
          if (x1 < 0) return fehler(new Error("Seite ist leer"));
          const b = x1 - x0 + 1, h = y1 - y0 + 1;
          const k = document.createElement("canvas");
          k.width = b;
          k.height = h;
          k.getContext("2d").drawImage(c, x0, y0, b, h, 0, 0, b, h);
          ok({ quelle: k.toDataURL("image/png"), b: b, h: h });
        };
        i.onerror = () => fehler(new Error("Gerendertes PDF nicht lesbar"));
        i.src = src;
      }),
    quelle);
}

async function masse(seite, quelle) {
  return seite.evaluate(
    (src) =>
      new Promise((ok, fehler) => {
        const i = new Image();
        i.onload = () => ok({ b: i.naturalWidth, h: i.naturalHeight });
        i.onerror = () => fehler(new Error("Logo nicht lesbar"));
        i.src = src;
      }),
    quelle);
}

/* Auf MAX_B x MAX_H einpassen, Seitenverhältnis behalten, nie vergrössern. */
function einpassen(b, h) {
  const f = Math.min(MAX_B / b, MAX_H / h, 1);
  return { breite: Math.round(b * f), hoehe: Math.round(h * f), faktor: f };
}

(async () => {
  const alle = JSON.parse(fs.readFileSync(path.join(REPO, "betriebe.json"), "utf8"));
  const args = process.argv.slice(2);
  const wunsch = args.includes("--alle")
    ? alle.filter((b) => b.logo)
    : alle.filter((b) => args.includes(b.slug));

  if (!wunsch.length) {
    console.error("Nichts zu tun. Slug angeben oder --alle. Vorhandene Slugs mit Logo:");
    alle.filter((b) => b.logo).forEach((b) => console.error("  " + b.slug));
    process.exit(1);
  }

  /* Normalfall: einmalig "npx playwright install chromium".
     CHROMIUM_PFAD ist für Umgebungen, in denen schon ein Chromium liegt. */
  const browser = await chromium.launch(
    process.env.CHROMIUM_PFAD ? { executablePath: process.env.CHROMIUM_PFAD } : {});
  let fehler = 0;

  for (const b of wunsch) {
    if (!b.logo) { console.error(`✗ ${b.slug}: kein Logo in betriebe.json`); fehler++; continue; }
    if (!b.kategorie) { console.error(`✗ ${b.slug}: keine Kategorie in betriebe.json`); fehler++; continue; }

    const datei = path.join(REPO, b.logo);
    if (!fs.existsSync(datei)) { console.error(`✗ ${b.slug}: ${b.logo} fehlt`); fehler++; continue; }

    const seite = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });

    let quelle, roh;
    if (istPdf(datei)) {
      const zugeschnitten = await beschneiden(seite, await pdfRendern(datei));
      quelle = zugeschnitten.quelle;
      roh = { b: zugeschnitten.b, h: zugeschnitten.h };
    } else {
      quelle = `data:${typ(datei)};base64,${b64(datei)}`;
      roh = await masse(seite, quelle);
    }

    const { breite, hoehe, faktor } = einpassen(roh.b, roh.h);

    await seite.setContent(
      vorlage({ logo: quelle, name: b.name, kategorie: b.kategorie, adresse: b.adresse, breite, hoehe }),
      { waitUntil: "load" });
    await seite.evaluate(() => document.fonts.ready);
    await seite.waitForTimeout(300);

    /* Warnen, statt still etwas Kaputtes zu schreiben. */
    const kollision = await seite.evaluate(() => {
      const l = document.getElementById("links").getBoundingClientRect();
      const r = document.getElementById("rechts").getBoundingClientRect();
      return { ueberlappt: r.left < l.right + 90, luecke: Math.round(r.left - l.right) };
    });
    if (kollision.ueberlappt)
      console.warn(`  ! ${b.slug}: Kategorietext ist zu lang – nur ${kollision.luecke}px Luft ` +
                   `zur linken Zeile. Bitte in betriebe.json kürzen.`);

    /* Die Adresse im Bogen darf nicht abgeschnitten werden. */
    const fuss = await seite.evaluate(() => {
      const s = document.getElementById("fuss");
      return { passt: s.scrollWidth <= s.clientWidth, noetig: s.scrollWidth, platz: s.clientWidth };
    });
    if (!fuss.passt)
      console.warn(`  ! ${b.slug}: Adresse braucht ${fuss.noetig}px, es sind ${fuss.platz}px da – ` +
                   `sie wird abgeschnitten. Bitte in betriebe.json kürzen.`);
    if (faktor < 0.999)
      console.log(`  · ${b.slug}: Logo ${roh.b}x${roh.h} auf ${breite}x${hoehe} verkleinert`);
    else if (breite < 420)
      console.warn(`  ! ${b.slug}: Logo ist nur ${roh.b}x${roh.h} gross und wirkt auf der Kachel klein. ` +
                   `Eine grössere Datei sieht besser aus.`);

    const ziel = path.join(REPO, "posts", b.slug + ".png");
    await seite.screenshot({ path: ziel });
    await seite.close();
    console.log(`✓ posts/${b.slug}.png`);
  }

  await browser.close();
  process.exit(fehler ? 1 : 0);
})();
