# Gesichter der Stadt – Rottweil

Projektwebsite für den gemeinsamen Social-Media-Kanal von Rottweil.
Statische Seite ohne Build-Schritt – einfach ausliefern.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite: Projekt, Vorteile, Ziele, Betriebe, Anmeldung |
| `aktion-einreichen.html` | Formular für teilnehmende Betriebe |
| `gesichter.css` | Gesamtes Styling beider Seiten |
| `gesichter.js` | Navigation, Scroll-Reveal, Formular-Validierung |
| `logo.svg` | Favicon |
| `.nojekyll` | verhindert Jekyll-Verarbeitung auf GitHub Pages |

## Design

Farben und Typografie folgen den Social-Media-Posts des Projekts:
warmes Creme, kräftiges Orange, Condensed-Bold-Headlines, gesperrte
Uppercase-Labels mit Punkt und die Bogenkanten zwischen den Farbflächen.
Bewusst ohne Fotos.

Schriften kommen von Google Fonts (Roboto Condensed, Inter).

## Formular

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

- **Rechtstexte**: `impressum.html` und `datenschutz.html` sind verlinkt,
  liegen aber noch nicht im Repo. Beide anlegen, sonst laufen die
  Footer-Links ins Leere.
- **Social-Profile**: Die Icons im Footer stehen auf `href="#"`.
- **Logos**: beach0741 und Borrelli sind getippte Platzhalter. Logo als
  PNG ablegen und in der Karte das `<span class="mark">` durch ein
  `<img>` ersetzen.
- **Teilnehmerzahl**: Die „37" in `index.html` ist fest hinterlegt.
- **Chatbot**: `<div id="chat-slot">` liegt auf beiden Seiten bereit,
  die Skript-Einbindung ist auskommentiert.

## GitHub Pages

Settings → Pages → Branch `main`, Ordner `/`. Für ein öffentliches
Pages-Deployment muss das Repository öffentlich sein (oder GitHub Pro).
