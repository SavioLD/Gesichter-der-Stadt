/* ============================================================
   Vorschaubilder für Reels

   Einheitliche Titelbilder in der Handschrift des Projekts.
   1080 x 1920, also 9:16 wie das Reel selbst.

   Instagram legt oben rund 250 px mit Name und Ton-Symbol zu und
   unten rund 350 px mit Bildtext und Knöpfen. Im Profilraster bleibt
   nur die Mitte stehen. Deshalb sitzt der ganze Satz mittig um
   y = 960 – dort überlebt er beide Zuschnitte.

   Einmalig:  cd tools && npm install && npx playwright install chromium

   Aufruf:
     node tools/reel.js "Seit 1829 in Familienhand" --betrieb "Juwelier Stauss"
     node tools/reel.js "Drei Geheimtipps|aus der Altstadt" --stil orange
     node tools/reel.js "Hinter den Kulissen" --betrieb "Borrelli" --bild standbild.jpg

   Ein | im Titel erzwingt einen Zeilenumbruch.
============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const REPO = path.join(__dirname, "..");
const FONTS = path.join(__dirname, "node_modules", "@fontsource");
const ZIEL = path.join(REPO, "reels");

const b64 = (p) => fs.readFileSync(p).toString("base64");
const typ = (p) => (/\.jpe?g$/i.test(p) ? "image/jpeg" : /\.webp$/i.test(p) ? "image/webp" : "image/png");

const schriftCss = [
  ["Roboto Condensed", 700, `${FONTS}/roboto-condensed/files/roboto-condensed-latin-700-normal.woff2`],
  ["Inter", 600, `${FONTS}/inter/files/inter-latin-600-normal.woff2`],
].map(([f, w, p]) =>
  `@font-face{font-family:"${f}";font-style:normal;font-weight:${w};` +
  `src:url(data:font/woff2;base64,${b64(p)}) format("woff2")}`).join("\n");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const slug = (s) => s.normalize("NFC").toLowerCase()
  .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/* Die drei Grundstimmungen. Mehr braucht es nicht – Einheitlichkeit
   entsteht dadurch, dass es wenige sind. */
const STILE = {
  creme:  { grund: "#fbf8f2", eyebrow: "#d5782a", titel: "#2b2622", betrieb: "#d5782a",
            bogen: "#d5782a", raster: "#d5782a", rasterDeck: ".45" },
  orange: { grund: "#d5782a", eyebrow: "#fbf8f2", titel: "#fbf8f2", betrieb: "#2b2622",
            bogen: "#fbf8f2", raster: "#fbf8f2", rasterDeck: ".26" },
  bild:   { grund: "#2b2622", eyebrow: "#d5782a", titel: "#fbf8f2", betrieb: "#fbf8f2",
            bogen: "#d5782a", raster: null, rasterDeck: "0" },
};

function vorlage({ titel, betrieb, stil, hintergrund, groesse }) {
  const s = STILE[stil];
  /* Jedes Wort bekommt eine eigene Huelle. Nur so laesst sich nachher
     messen, ob eines davon umgebrochen werden musste. */
  const zeilen = titel.split("|")
    .map((z) => esc(z.trim()).split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" "))
    .join("<br />");

  const grundFlaeche = hintergrund
    ? `<div class="still" style="background-image:url('${hintergrund}')"></div>
       <div class="schleier"></div>`
    : (s.raster ? `<span class="raster"></span>` : "");

  return `<!doctype html><meta charset="utf-8"><style>
${schriftCss}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;position:relative;background:${s.grund};
     font-family:"Roboto Condensed",sans-serif;-webkit-font-smoothing:antialiased}

.still{position:absolute;inset:0;background-size:cover;background-position:center}
/* Der Schleier hält den Titel lesbar, egal wie hell das Standbild ist. */
.schleier{position:absolute;inset:0;background:linear-gradient(180deg,
  rgba(43,38,34,.42) 0%,rgba(43,38,34,.66) 42%,rgba(43,38,34,.90) 100%)}

.raster{position:absolute;right:-80px;top:300px;width:430px;aspect-ratio:1;
        color:${s.raster};opacity:${s.rasterDeck};
        background-image:radial-gradient(currentColor 5px,transparent 5.5px);background-size:20% 20%}

/* Mittig um y=960: überlebt Bedienleisten und Rasterzuschnitt. */
.satz{position:absolute;left:92px;right:92px;top:50%;transform:translateY(-50%)}

.eyebrow{font-family:"Inter",sans-serif;font-weight:600;font-size:30px;letter-spacing:.26em;
         text-transform:uppercase;color:${s.eyebrow};display:flex;align-items:center;gap:20px;
         margin-bottom:40px}
.eyebrow::before{content:"";width:17px;height:17px;border-radius:50%;background:currentColor;flex:none}

/* overflow-wrap faengt das lange deutsche Kompositum ab: lieber
   umgebrochen als rechts aus dem Bild heraus. */
#titel{font-weight:700;text-transform:uppercase;line-height:.96;letter-spacing:-.005em;
       color:${s.titel};font-size:${groesse}px;overflow-wrap:anywhere}

.betrieb{font-weight:700;font-size:40px;letter-spacing:.2em;text-transform:uppercase;
         color:${s.betrieb};margin-top:48px;display:flex;align-items:center;gap:26px}
.betrieb::before{content:"";width:74px;height:5px;background:currentColor;flex:none}

.bogen{position:absolute;left:-6%;right:-6%;bottom:0;height:270px;background:${s.bogen};
       border-radius:50% 50% 0 0 / 86px 86px 0 0}
</style>
${grundFlaeche}
<div class="satz">
  <div class="eyebrow">Gesichter der Stadt</div>
  <div id="titel">${zeilen}</div>
  ${betrieb ? `<div class="betrieb">${esc(betrieb)}</div>` : ""}
</div>
<div class="bogen"></div>`;
}

/* ------------------------------------------------------- Aufruf --- */

const args = process.argv.slice(2);
const titel = args.find((a) => !a.startsWith("--"));
const hole = (name) => {
  const i = args.indexOf("--" + name);
  return i >= 0 ? args[i + 1] : null;
};

if (!titel) {
  console.error(`Vorschaubild für ein Reel.

  node tools/reel.js "Titel des Reels" [--betrieb "Name"] [--stil creme|orange|bild]
                     [--bild standbild.jpg] [--datei name.png]

  Ein | im Titel erzwingt einen Zeilenumbruch.
  Ohne --datei landet das Bild unter reels/<titel>.png`);
  process.exit(1);
}

const betrieb = hole("betrieb") || "";
const bildPfad = hole("bild");
const stil = hole("stil") || (bildPfad ? "bild" : "creme");
if (!STILE[stil]) { console.error(`Unbekannter Stil "${stil}". Erlaubt: ${Object.keys(STILE).join(", ")}`); process.exit(1); }

(async () => {
  let hintergrund = null;
  if (bildPfad) {
    const p = path.isAbsolute(bildPfad) ? bildPfad : path.join(REPO, bildPfad);
    if (!fs.existsSync(p)) { console.error(`Standbild nicht gefunden: ${bildPfad}`); process.exit(1); }
    hintergrund = `data:${typ(p)};base64,${b64(p)}`;
  }

  const browser = await chromium.launch(
    process.env.CHROMIUM_PFAD ? { executablePath: process.env.CHROMIUM_PFAD } : {});
  const seite = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });

  /* Schriftgrad so weit herunter, bis der Titel in die Schutzzone passt.
     Lieber kleiner setzen als über den Rand laufen lassen. */
  let groesse = 128, zerrissen = false;
  const MIN = 68, PLATZ = 760;        // Höhe, die dem Titel bleibt
  for (;;) {
    await seite.setContent(vorlage({ titel, betrieb, stil, hintergrund, groesse }), { waitUntil: "load" });
    await seite.evaluate(() => document.fonts.ready);
    const m = await seite.evaluate(() => {
      const t = document.getElementById("titel");
      const s = document.querySelector(".satz");
      return { titelHoehe: t.getBoundingClientRect().height,
               satzHoehe: s.getBoundingClientRect().height,
               /* Ein Wort, das auf zwei Zeilen steht, wurde mitten
                  durchgeschnitten. In der Hoehe faellt das nicht auf,
                  deshalb eigens gemessen. */
               zerrissen: [...t.querySelectorAll(".w")].some((w) => w.getClientRects().length > 1) };
    });
    zerrissen = m.zerrissen;
    if ((m.titelHoehe <= PLATZ && m.satzHoehe <= 1100 && !m.zerrissen) || groesse <= MIN) break;
    groesse -= 6;
  }
  if (groesse < 128) console.log(`  · Titel auf ${groesse}px verkleinert, damit er in die Schutzzone passt`);
  if (groesse <= MIN) console.warn(`  ! Titel steht am kleinsten Grad (${MIN}px) – auf dem Handy ` +
                                   `wirkt ein kürzerer Titel deutlich besser. Mit | umbrechen hilft.`);
  if (zerrissen) console.warn(`  ! Ein Wort passt selbst dann nicht in eine Zeile und steht jetzt ` +
                              `mitten durchgeschnitten da. Bitte kürzer fassen.`);

  await seite.waitForTimeout(250);
  fs.mkdirSync(ZIEL, { recursive: true });
  const datei = hole("datei") || slug(titel) + ".png";
  await seite.screenshot({ path: path.join(ZIEL, datei) });
  await seite.close();
  await browser.close();
  console.log(`✓ reels/${datei}`);
})();
