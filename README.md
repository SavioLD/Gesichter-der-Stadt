# Gesichter der Stadt – Rottweil

Projektwebsite für den gemeinsamen Social-Media-Kanal von Rottweil.
Statische Seite ohne Build-Schritt – einfach ausliefern.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite: Projekt, Vorteile, Ziele, Betriebe, Anmeldung |
| `anmeldung.html` | Verbindliche Anmeldung mit SEPA-Mandat und Unterschriften |
| `aktion-einreichen.html` | Formular für teilnehmende Betriebe |
| `gesichter.css` | Gesamtes Styling beider Seiten |
| `gesichter.js` | Navigation, Scroll-Reveal, Aktions-Formular |
| `anmeldung.js` | Anmeldeformular: Unterschriftenfelder, IBAN-Prüfung, Versand |
| `posts/` | 43 Post-Grafiken der teilnehmenden Betriebe (1080×1080) |
| `logo.svg` | Favicon |
| `.nojekyll` | verhindert Jekyll-Verarbeitung auf GitHub Pages |

## Betriebe ergänzen

Die Post-Grafik (1080×1080 PNG) nach `posts/` legen und in `index.html`
im Raster `.posts` eine Kachel ergänzen:

```html
<figure class="post rv">
  <img src="posts/name-des-betriebs.png" alt="Gesichter unserer Stadt: Name des Betriebs"
       loading="lazy" width="1080" height="1080" />
  <figcaption>Name des Betriebs</figcaption>
</figure>
```

Die Bildunterschrift ist nur für Screenreader sichtbar – der Name steht
bereits in der Grafik.

## Design

Farben und Typografie folgen den Social-Media-Posts des Projekts:
warmes Creme, kräftiges Orange, Condensed-Bold-Headlines, gesperrte
Uppercase-Labels mit Punkt und die Bogenkanten zwischen den Farbflächen.
Bewusst ohne Fotos.

Schriften kommen von Google Fonts (Roboto Condensed, Inter).

## Anmeldung (`anmeldung.html`)

Enthält Bankverbindung und zwei Unterschriften. Diese Daten gehen
bewusst **nicht** per `mailto` raus – unverschlüsselte E-Mail ist für
IBAN und Unterschrift der falsche Kanal.

Stattdessen sendet das Formular ein JSON per POST an die URL im
Attribut `data-endpoint` des `<form>`:

```html
<form id="anmeldungForm" data-endpoint="" novalidate>
```

**Solange das Attribut leer ist, bleibt das Absenden gesperrt** und ein
Hinweis erklärt das den Besuchern. Die Daten verlassen den Browser
nicht. Sobald die SEPA-Lösung feststeht, dort die URL eintragen – mehr
ist nicht nötig. Den Aufbau des Bodys dokumentiert der Kopf von
`anmeldung.js`.

Die Teilnahmebedingungen stehen aufklappbar direkt über der
verbindlichen Unterschrift. Zwei Schwellen sind darin geregelt: **45**
Anmeldungen für den Start, **15** aktive Betriebe für die Fortführung.
Beide Zahlen stehen in `anmeldung.html` im Klartext – bei Änderung an
allen Stellen mitziehen (Seitenspalte und Ziffern 1, 3, 4).

Geprüft wird im Browser: Pflichtfelder, E-Mail-Format, IBAN inklusive
Prüfsumme nach ISO 7064, beide Unterschriften und die Zustimmung.

## Aktion einreichen (`aktion-einreichen.html`)

`aktion-einreichen.html` läuft ohne Backend: Die Pflichtfelder werden im
Browser geprüft, danach öffnet sich das E-Mail-Programm mit der fertigen
Nachricht. Empfänger steuert das Attribut `data-mailto` am `<form>`.

Soll später ein echter Endpunkt dran, ersetzt man in `gesichter.js` den
`mailto`-Block durch ein `fetch()` – die Validierung bleibt unverändert.

Gegen Bots ist ein unsichtbares Honigtopf-Feld eingebaut.

## Lokal ansehen

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Offene Punkte

- **SEPA-Mandat**: Gläubiger-Identifikationsnummer und Mandatsreferenz
  fehlen noch. In `anmeldung.html` ist der Block bereits vorbereitet und
  auskommentiert – Werte eintragen und einkommentieren.
- **Handelsregisternummer**: gehört ins Impressum, sobald sie vorliegt.

- **Rechtstexte**: `impressum.html` und `datenschutz.html` sind verlinkt,
  liegen aber noch nicht im Repo. Beide anlegen, sonst laufen die
  Footer-Links ins Leere.
- **Teilnehmerzahl**: Die „43" in `index.html` ist fest hinterlegt und
  muss bei neuen Betrieben mitgezogen werden – an zwei Stellen: im
  Zähler unter „Vorteile" und im Text über dem Raster.
- **Chatbot**: `<div id="chat-slot">` liegt auf allen Seiten bereit,
  die Skript-Einbindung ist auskommentiert.

## GitHub Pages

Settings → Pages → Branch `main`, Ordner `/`. Für ein öffentliches
Pages-Deployment muss das Repository öffentlich sein (oder GitHub Pro).
