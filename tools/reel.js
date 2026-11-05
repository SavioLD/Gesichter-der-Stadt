/* ============================================================
   Vorschaubilder für Reels

   Einheitliche Titelbilder in der Handschrift des Projekts.
   Die Datei ist 1080 x 1920, also 9:16 wie das Reel selbst –
   gestaltet wird aber für den Ausschnitt, den Instagram davon
   tatsächlich zeigt.

   Drei Ansichten, drei Zuschnitte:

     Vollbild 9:16   das ganze Bild. Oben rund 250 px und unten rund
                     350 px liegen unter Instagrams Bedienleisten.
     Feed 4:5        nur die Mitte: 1080 x 1350, also y 285 bis 1635.
     Profilraster    derselbe mittige Ausschnitt.

   Gemeinsamer Nenner ist der Feed-Rahmen. Der ganze Entwurf steckt
   darin: Punkteraster oben, Text darunter, Bogen als Fuss. Was
   ausserhalb liegt, ist nur Grundfarbe – und liegt genau dort, wo
   Instagram seine Bedienleisten hinlegt.

   Der Satz haengt am Bogen, statt mittig zu stehen. Damit sitzt die
   Ueberschrift auf jedem Vorschaubild auf derselben Hoehe, egal wie
   lang der Titel ist – im Profilraster liegen sie dadurch auf einer
   Linie und die Reihe liest sich als Reihe.

   Einmalig:  cd tools && npm install && npx playwright install chromium

   Aufruf:
     node tools/reel.js "Seit 1829 in Familienhand" --betrieb "Juwelier Stauss"
     node tools/reel.js "Drei Geheimtipps|aus der Altstadt" --stil orange
     node tools/reel.js "Hinter den Kulissen" --betrieb "Borrelli" --bild standbild.jpg
     node tools/reel.js "Titel" --pruef        zeigt die Zuschnitte eingeblendet

   Ein | im Titel erzwingt einen Zeilenumbruch.
============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const REPO = path.join(__dirname, "..");
const FONTS = path.join(__dirname, "node_modules", "@fontsource");
const ZIEL = path.join(REPO, "reels");

/* ----------------------------------------------------- Geometrie --- */

const BREITE = 1080;
const HOEHE = 1920;
const FEED_HOEHE = 1350;                            // 4:5 bei 1080 Breite
const FEED_OBEN = (HOEHE - FEED_HOEHE) / 2;         // 285
const FEED_UNTEN = FEED_OBEN + FEED_HOEHE;          // 1635

/* Der Bogen beginnt noch im Feed-Rahmen, damit er dort als Fuss zu
   sehen ist, und läuft bis zum unteren Bildrand durch. Im Vollbild
   wird daraus das Farbband unter Instagrams Bedienleiste. */
const BOGEN_OBEN = 1400;

/* Der Satz haengt am Bogen statt mittig zu stehen: im Feed-Zuschnitt
   sass er sonst zu hoch und darunter blieb ein Loch. */
const SATZ_FUSS = BOGEN_OBEN - 120;   // 1280

/* ------------------------------------------------------- Schrift --- */

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

function vorlage({ titel, betrieb, stil, hintergrund, groesse, pruef }) {
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

  /* Nur für den Blick von aussen: zeigt, was im Feed übrig bleibt und
     was unter Instagrams Bedienleisten verschwindet. */
  const pruefCss = `
.pruef__ui{position:absolute;left:0;right:0;background:repeating-linear-gradient(45deg,
  rgba(220,40,40,.30) 0 14px,rgba(220,40,40,.12) 14px 28px)}
.pruef__oben{top:0;height:250px}
.pruef__unten{bottom:0;height:350px}
.pruef__feed{position:absolute;left:0;right:0;top:${FEED_OBEN}px;height:${FEED_HOEHE}px;
  border:5px dashed #1d6fd8}
.pruef__etikett{position:absolute;left:18px;top:${FEED_OBEN + 16}px;font-family:"Inter",sans-serif;
  font-weight:600;font-size:26px;letter-spacing:.14em;color:#1d6fd8;text-transform:uppercase}`;

  const pruefHtml = pruef
    ? `<div class="pruef__ui pruef__oben"></div><div class="pruef__ui pruef__unten"></div>
       <div class="pruef__feed"></div><div class="pruef__etikett">Feed 4:5</div>`
    : "";

  return `<!doctype html><meta charset="utf-8"><style>
${schriftCss}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${BREITE}px;height:${HOEHE}px;overflow:hidden;position:relative;background:${s.grund};
     font-family:"Roboto Condensed",sans-serif;-webkit-font-smoothing:antialiased}

.still{position:absolute;inset:0;background-size:cover;background-position:center}
/* Der Schleier hält den Titel lesbar, egal wie hell das Standbild ist. */
.schleier{position:absolute;inset:0;background:linear-gradient(180deg,
  rgba(43,38,34,.42) 0%,rgba(43,38,34,.66) 42%,rgba(43,38,34,.90) 100%)}

/* Alles Gestaltete liegt zwischen y=${FEED_OBEN} und y=${FEED_UNTEN} – dem Ausschnitt,
   den der Feed und das Profilraster vom Hochformat übrig lassen. */
.raster{position:absolute;right:-80px;top:${FEED_OBEN + 70}px;width:430px;aspect-ratio:1;
        color:${s.raster};opacity:${s.rasterDeck};
        background-image:radial-gradient(currentColor 5px,transparent 5.5px);background-size:20% 20%}

.satz{position:absolute;left:92px;right:92px;bottom:${HOEHE - SATZ_FUSS}px}

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

/* Beginnt im Feed-Rahmen und läuft bis zum Bildrand durch. */
.bogen{position:absolute;left:-6%;right:-6%;top:${BOGEN_OBEN}px;bottom:0;background:${s.bogen};
       border-radius:50% 50% 0 0 / 96px 96px 0 0}
${pruef ? pruefCss : ""}
</style>
${grundFlaeche}
<div class="satz">
  <div class="eyebrow">Gesichter der Stadt</div>
  <div id="titel">${zeilen}</div>
  ${betrieb ? `<div class="betrieb">${esc(betrieb)}</div>` : ""}
</div>
<div class="bogen"></div>
${pruefHtml}`;
}

/* ------------------------------------------------------- Aufruf --- */

const args = process.argv.slice(2);
const titel = args.find((a) => !a.startsWith("--"));
const hole = (name) => {
  const i = args.indexOf("--" + name);
  return i >= 0 ? args[i + 1] : null;
};
const schalter = (name) => args.includes("--" + name);

if (!titel) {
  console.error(`Vorschaubild für ein Reel.

  node tools/reel.js "Titel des Reels" [--betrieb "Name"] [--stil creme|orange|bild]
                     [--bild standbild.jpg] [--datei name.png] [--pruef]

  Ein | im Titel erzwingt einen Zeilenumbruch.
  --pruef blendet den Feed-Zuschnitt und die Bedienleisten ein.
  Ohne --datei landet das Bild unter reels/<titel>.png`);
  process.exit(1);
}

const betrieb = hole("betrieb") || "";
const bildPfad = hole("bild");
const pruef = schalter("pruef");
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
  const seite = await browser.newPage({ viewport: { width: BREITE, height: HOEHE }, deviceScaleFactor: 1 });

  /* Schriftgrad so weit herunter, bis der Satz in den Feed-Rahmen passt.
     Lieber kleiner setzen als über den Rand laufen lassen. */
  let groesse = 128, zerrissen = false;
  const MIN = 68;
  const PLATZ_TITEL = 760;
  const PLATZ_SATZ = SATZ_FUSS - FEED_OBEN;         // bis an die Oberkante des Feed-Rahmens
  for (;;) {
    await seite.setContent(vorlage({ titel, betrieb, stil, hintergrund, groesse, pruef }), { waitUntil: "load" });
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
    if ((m.titelHoehe <= PLATZ_TITEL && m.satzHoehe <= PLATZ_SATZ && !m.zerrissen) || groesse <= MIN) break;
    groesse -= 6;
  }
  if (groesse < 128) console.log(`  · Titel auf ${groesse}px verkleinert, damit er in den Feed-Rahmen passt`);
  if (groesse <= MIN) console.warn(`  ! Titel steht am kleinsten Grad (${MIN}px) – auf dem Handy ` +
                                   `wirkt ein kürzerer Titel deutlich besser. Mit | umbrechen hilft.`);
  if (zerrissen) console.warn(`  ! Ein Wort passt selbst dann nicht in eine Zeile und steht jetzt ` +
                              `mitten durchgeschnitten da. Bitte kürzer fassen.`);

  await seite.waitForTimeout(250);
  fs.mkdirSync(ZIEL, { recursive: true });
  const datei = hole("datei") || slug(titel) + (pruef ? "-pruef" : "") + ".png";
  await seite.screenshot({ path: path.join(ZIEL, datei) });
  await seite.close();
  await browser.close();
  console.log(`✓ reels/${datei}`);
})();
