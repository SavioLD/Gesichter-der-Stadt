/* ============================================================
   Galerie-Generator für "Gesichter der Stadt"

   Schreibt den Kachel-Block in index.html aus betriebe.json neu:
   Reihenfolge, Namen, Alt-Texte und – wo hinterlegt – die
   Verlinkung auf den Instagram-Account des Betriebs.
   Auch die Anzahl im Vorspann wird mitgezogen.

   Aufruf: node tools/galerie.js
============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const SEITE = path.join(REPO, "index.html");
const START = "<!-- betriebe:start -->";
const ENDE = "<!-- betriebe:ende -->";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const betriebe = JSON.parse(fs.readFileSync(path.join(REPO, "betriebe.json"), "utf8"));
let html = fs.readFileSync(SEITE, "utf8");

if (!html.includes(START) || !html.includes(ENDE)) {
  console.error(`In index.html fehlen die Marken ${START} und ${ENDE}.`);
  process.exit(1);
}

const kacheln = betriebe.map((b) => {
  const bild =
    `<img src="posts/${b.slug}.png" alt="Gesichter unserer Stadt: ${esc(b.name)}" ` +
    `loading="lazy" width="1080" height="1080" />`;
  const titel = `<figcaption>${esc(b.name)}</figcaption>`;

  /* Mit Instagram-Handle wird die Kachel anklickbar, ohne bleibt sie ruhig. */
  if (b.instagram) {
    const nutzer = b.instagram.replace(/^@/, "");
    return [
      `        <figure class="post post--link rv">`,
      `          <a class="post__link" href="https://www.instagram.com/${esc(nutzer)}/"`,
      `             target="_blank" rel="noopener" aria-label="${esc(b.name)} auf Instagram">${bild}</a>`,
      `          ${titel}`,
      `        </figure>`,
    ].join("\n");
  }
  return [
    `        <figure class="post rv">`,
    `          ${bild}`,
    `          ${titel}`,
    `        </figure>`,
  ].join("\n");
}).join("\n");

const vorher = html;
html = html.replace(
  new RegExp(`${START}[\\s\\S]*?${ENDE}`),
  `${START}\n${kacheln}\n        ${ENDE}`);

/* Die Zahl im Vorspann darf nicht auseinanderlaufen. */
const anzahl = betriebe.length;
html = html.replace(
  /(<p class="lede">)\d+( Betriebe aus Rottweil sind dabei)/,
  `$1${anzahl}$2`);

if (html === vorher) {
  console.log("Keine Änderung nötig.");
} else {
  fs.writeFileSync(SEITE, html);
  console.log(`index.html aktualisiert: ${anzahl} Kacheln, ` +
              `${betriebe.filter((b) => b.instagram).length} davon mit Instagram-Verlinkung.`);
}

const ohneLogo = betriebe.filter((b) => !b.logo);
if (ohneLogo.length)
  console.log(`Hinweis: ${ohneLogo.length} Betriebe haben noch kein eigenes Logo hinterlegt.`);
