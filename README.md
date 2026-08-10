# Gesichter der Stadt – Rottweil

Projektwebsite für den gemeinsamen Social-Media-Kanal von Rottweil.
Statische Seite ohne Build-Schritt – einfach ausliefern.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite: Projekt, Vorteile, Ziele, Betriebe, Anmeldung |
| `anmeldung.html` | Verbindliche Anmeldung mit SEPA-Mandat und Unterschriften |
| `ergaenzung.html` | Ergänzung zur Teilnahme für Betriebe, die bereits dabei sind |
| `aktion-einreichen.html` | Formular für teilnehmende Betriebe |
| `gesichter.css` | Gesamtes Styling beider Seiten |
| `gesichter.js` | Navigation, Scroll-Reveal, Aktions-Formular |
| `anmeldung.js` | Anmeldeformular: IBAN-Prüfung, Versand |
| `ergaenzung.js` | Ergänzungsformular: Prüfung und Versand |
| `signature.js` | Unterschriftenfeld, von beiden Formularen genutzt |
| `datenschutz.html` | Datenschutzerklärung |
| `nutzungsbedingungen.html` | AGB für die Teilnahme |
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
nicht. Den Aufbau des Bodys dokumentiert der Kopf von `anmeldung.js`.

### Warum kein mailto

Alle Einreichungen sollen an `info@laendle-digital.com` gehen. Für das
Aktions-Formular reicht dafür `mailto`. Für Anmeldung und Ergänzung
nicht: die beiden Unterschriften ergeben zusammen rund **25.000
Zeichen**, viele Systeme brechen eine `mailto`-Adresse aber schon bei
etwa **2.000** ab. Dazu kommt, dass IBAN und Unterschrift nichts in
einer unverschlüsselten E-Mail zu suchen haben.

### Freischalten

1. Bei einem Formular-Dienst ein Formular anlegen, das an
   `info@laendle-digital.com` zustellt (z. B. Formspree – funktioniert
   ohne eigenen Server und damit auch auf GitHub Pages).
2. Die Endpunkt-URL in `anmeldung.html` und `ergaenzung.html` bei
   `data-endpoint` eintragen.
3. Fertig – Validierung, Unterschriften und Versand laufen dann.

Der `Accept: application/json`-Header ist bereits gesetzt, damit solche
Dienste mit JSON antworten statt mit einer Weiterleitungsseite.

Vor dem Einsatz mit Bankdaten: Auftragsverarbeitungsvertrag und
Serverstandort des Dienstes prüfen.

Die Teilnahmebedingungen stehen aufklappbar direkt über der
verbindlichen Unterschrift.

Alle Teilnahmen laufen in einem **gemeinsamen Projektjahr vom
28. Juli bis zum 27. Juli**. Danach endet die Teilnahme automatisch –
keine stillschweigende Verlängerung, entsprechend § 9 der
Nutzungsbedingungen. Wer später beitritt, zahlt anteilig bis zum
27. Juli.

Diese Regeln stehen an drei Stellen und müssen zusammen gepflegt
werden: `nutzungsbedingungen.html` § 9, `anmeldung.html` Ziffern 2–5
und `ergaenzung.html` Ziffern 2–4. Dadurch gibt es
einen Stichtag im Jahr statt vieler Einzeltermine – und niemand zahlt
im Voraus für einen Zeitraum, in dem das Projekt schon ausgelaufen
sein kann.

Zwei Zahlen sind geregelt: **15** aktive Betriebe für die Fortführung,
**20** als Schwelle für die Frühwarnung. Beide stehen in
`anmeldung.html` im Klartext – bei Änderung an sämtlichen Stellen
mitziehen (Seitenspalte und Ziffern 4, 5).

`ergaenzung.html` holt für die Bestandsteilnehmer nach, was in deren
Anmeldung fehlte. Sie ist ausdrücklich freiwillig und ändert Beitrag
und Leistung nicht – ohne Zustimmung bleibt es beim Bisherigen. Die
Kennung der bestätigten Fassung steckt in `ergaenzung.js` als
`FASSUNG`; bei inhaltlichen Änderungen hochzählen, damit
nachvollziehbar bleibt, wem welcher Text vorlag.

Ziffer 7 grenzt den Geltungsbereich ab: Die Bedingungen gelten für
Anmeldungen über dieses Formular. Die 44 Betriebe, die vorher über
Tally abgeschlossen haben, sind daran **nicht** gebunden – dafür
bräuchte es eine Ergänzungsvereinbarung mit deren Zustimmung.

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

- **Teilnehmerzahl**: Die „43" in `index.html` ist fest hinterlegt und
  muss bei neuen Betrieben mitgezogen werden – an zwei Stellen: im
  Zähler unter „Vorteile" und im Text über dem Raster.
- **Chatbot**: `<div id="chat-slot">` liegt auf allen Seiten bereit,
  die Skript-Einbindung ist auskommentiert.

## GitHub Pages

Settings → Pages → Branch `main`, Ordner `/`. Für ein öffentliches
Pages-Deployment muss das Repository öffentlich sein (oder GitHub Pro).
