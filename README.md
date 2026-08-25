# Gesichter der Stadt – Rottweil

Projektwebsite für den gemeinsamen Social-Media-Kanal von Rottweil.
Statische Seite ohne Build-Schritt – einfach ausliefern.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite: Projekt, Vorteile, Ziele, Betriebe, Anmeldung |
| `anmeldung.html` | Verbindliche Anmeldung mit SEPA-Mandat und Unterschriften |
| `ergaenzung.html` | Ergänzung zur Teilnahme für Betriebe, die bereits dabei sind |
| `betriebsprofil.html` | Logo, Branche und Angaben – von den Betrieben selbst |
| `aktion-einreichen.html` | Formular für teilnehmende Betriebe |
| `gesichter.css` | Gesamtes Styling beider Seiten |
| `gesichter.js` | Navigation, Scroll-Reveal, Aktions-Formular |
| `anmeldung.js` | Anmeldeformular: IBAN-Prüfung, Versand |
| `ergaenzung.js` | Ergänzungsformular: Prüfung und Versand |
| `betriebsprofil.js` | Betriebsprofil: Prüfung, Logo-Upload, Versand |
| `signature.js` | Unterschriftenfeld, von beiden Formularen genutzt |
| `datenschutz.html` | Datenschutzerklärung |
| `nutzungsbedingungen.html` | AGB für die Teilnahme |
| `betriebe.json` | Alle teilnehmenden Betriebe: Name, Kategorietext, Logo, Instagram |
| `posts/` | Post-Grafiken der teilnehmenden Betriebe (1080×1080) |
| `assets/logos/` | Die Originaldateien, aus denen die Grafiken gebaut werden |
| `tools/` | Generatoren für Grafiken und Galerie |
| `logo.svg` | Favicon |
| `.nojekyll` | verhindert Jekyll-Verarbeitung auf GitHub Pages |

## Betriebsprofil einpflegen

Wenn über `betriebsprofil.html` ein Profil hereinkommt, sind es drei
Schritte. `betriebe.json` ist die einzige Stelle, an der Daten gepflegt
werden – `index.html` und die Grafiken werden daraus erzeugt.

**1. Logo ablegen.** Den Anhang aus der E-Mail nach `assets/logos/`
speichern, benannt nach dem Betrieb, z. B.
`assets/logos/wohn-schick-original.png`. Original lassen: nicht
zuschneiden, nicht freistellen, nicht skalieren.

**2. Eintrag in `betriebe.json` ergänzen.**

```json
{
  "slug": "wohn-schick-gmbh-co-kg",
  "name": "Wohn Schick GmbH + Co. KG",
  "kategorie": "Wir erfüllen Ihre Wohnträume",
  "logo": "assets/logos/wohn-schick-original.png",
  "instagram": "wohn_schick",
  "website": "https://www.wohn-schick.de/"
}
```

| Feld | Wirkung |
|---|---|
| `slug` | Dateiname der Grafik unter `posts/` – nur Kleinbuchstaben und Bindestriche |
| `name` | Bildunterschrift und Name auf der Grafik. Rohtext, keine HTML-Entities |
| `kategorie` | Der Text oben rechts auf der Grafik. Rund 30 Zeichen, sonst wird es eng |
| `adresse` | Die Zeile unten im Bogen. Ist sie leer, steht dort „Rottweil" |
| `beschreibung` | Aus dem Formular. Noch nicht auf der Website ausgegeben |
| `logo` | Pfad zur Originaldatei. Leer lassen, solange keine vorliegt |
| `instagram` | Handle ohne `@`. Ist es gesetzt, wird die Kachel auf der Website anklickbar |
| `website` | Aus dem Formular. Noch nicht auf der Website ausgegeben |

Die Adresse ersetzt das frühere „Rottweil" unten auf der Kachel – dass die
Betriebe in Rottweil sind, weiss der Betrachter ohnehin, die Lage ist die
nützlichere Information. „Rottweil" muss also nicht mit hinein, und
78628 auch nicht. Passt der Text nicht in den Bogen, sagt `kachel.js`
es beim Lauf.

Ansprechpartner, E-Mail und Telefon gehören **nicht** hierher – das
Repository ist öffentlich. Die stehen in der eingegangenen E-Mail.

**3. Neu erzeugen.**

```bash
cd tools && npm install && npx playwright install chromium   # einmalig
cd ..
node tools/kachel.js wohn-schick-gmbh-co-kg   # Grafik neu bauen
node tools/galerie.js                          # Kacheln in index.html neu schreiben
```

`kachel.js --alle` baut alle Grafiken neu, für die ein Logo hinterlegt
ist. Das Logo wird proportional in einen Rahmen von 820 × 400 px
eingepasst und dabei **nie vergrössert** – eine zu kleine Datei bleibt
klein, statt unscharf aufgeblasen zu werden. Ist der Kategorietext zu
lang oder das Logo zu klein, sagt das Werkzeug es beim Lauf.

`galerie.js` schreibt den Block zwischen `<!-- betriebe:start -->` und
`<!-- betriebe:ende -->` in `index.html` neu und zieht die Zahl im Text
über dem Raster mit. Von Hand muss dort nichts mehr geändert werden.

Die Bildunterschrift ist nur für Screenreader sichtbar – der Name steht
bereits in der Grafik.

### Herkunft der aktuellen Logos

Die Logos unter `assets/logos/` sind bei den meisten Betrieben aus der
jeweils bestehenden Kachel herausgelöst, nicht vom Betrieb geliefert.
Sie sind damit nicht besser als vorher – es sind dieselben Pixel, nur
ohne den weissen Kasten drumherum. Sobald ein Betrieb seine
Originaldatei über `betriebsprofil.html` schickt, ersetzt sie diese
Zwischenlösung, und `kachel.js` baut die Grafik in voller Qualität neu.

Welche Betriebe noch eine ordentliche Datei brauchen, verrät der Lauf
von `kachel.js --alle`: Er warnt bei jedem Logo unter 420 px Breite.

### Herkunft der Adressen

Die Adressen sind recherchiert, nicht von den Betrieben bestätigt.
Kommt über das Betriebsprofil eine eigene Angabe herein, gewinnt die.

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

### Versand über Web3Forms

Alle drei Formulare senden über **Web3Forms** an die Adresse, die dort
zum Access Key hinterlegt ist: `info@laendle-digital.com`.

**Freischalten:** In `config.js` den Access Key eintragen –

```js
window.GDS_WEB3FORMS_KEY = "hier-der-schluessel";
```

Den Schlüssel gibt es auf web3forms.com, indem man dort
`info@laendle-digital.com` einträgt; er kommt per E-Mail. Der Schlüssel
ist öffentlich und darf im Quelltext stehen. **Solange der Wert leer
ist, bleibt das Absenden in allen drei Formularen gesperrt** und ein
Hinweis erklärt das den Besuchern.

Unterschriften gehen als **PNG-Dateien** mit, nicht als Textblock.
Per `mailto` wäre das nicht gegangen: zwei Unterschriften ergeben rund
25.000 Zeichen, viele Systeme brechen eine `mailto`-Adresse aber schon
bei etwa 2.000 ab.

| Datei | Rolle |
|---|---|
| `config.js` | der Access Key – die einzige Stelle zum Ändern |
| `gds-submit.js` | baut die Anfrage und schickt sie ab |

Vor dem Einsatz mit Bankdaten: Auftragsverarbeitungsvertrag und
Serverstandort von Web3Forms prüfen.

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

Die Pflichtfelder werden im Browser geprüft, danach geht die Einreichung
wie bei den anderen Formularen über Web3Forms an
`info@laendle-digital.com`. Die Logik steht in `gesichter.js`.

Gegen Bots ist ein unsichtbares Honigtopf-Feld eingebaut.

## Mobil

Die Seite ist auf das Telefon hin gebaut, nicht nur darauf verkleinert.
Im Stylesheet stehen die Regeln dafür gesammelt am Ende, getrennt nach
zwei Fragen:

- `@media (pointer:coarse)` – wird mit dem Finger bedient? Dann sind alle
  Tippziele mindestens 44 × 44 px, erreicht über Innenabstand, damit sich
  am Erscheinungsbild nichts ändert.
- `@media (max-width:…)` – wie viel Platz ist da? Das steuert das Layout.

Ein paar Punkte, die leicht wieder kaputtgehen:

- **Rasterspuren** stehen auf `minmax(0,1fr)`, nicht auf `1fr`. Ein `1fr`
  schrumpft nicht unter die Breite des längsten Wortes – ein einziges
  Kompositum wie „Teilnahmebedingungen" zieht sonst die ganze Seite
  seitlich auf.
- **`padding-block`, nicht `padding`**, bei allem, was zusätzlich die
  Klasse `.shell` trägt. Die Kurzform überschreibt den seitlichen
  Abstand, und der Text läuft bis an den Bildschirmrand.
- **Verweise mitten im Satz** bekommen `padding-block`. Bei einem
  Inline-Element vergrössert das die Trefferfläche, ohne die Zeilenhöhe
  zu verändern. Ausgenommen ist die Zustimmungszeile: dort stehen die
  Verweise im Etikett des Ankreuzfelds, und grössere Trefferflächen
  führten nur dazu, dass man beim Ankreuzen aus dem Formular navigiert.
- **Unterschriftenfelder** brauchen `touch-action:none`, sonst blättert
  die Seite weg, während man unterschreibt.

Geprüft wird mit dem Skript unter `tools/` nicht – die Prüfung lief
einmalig über Playwright bei 320, 375 und 430 px auf allen sieben
Seiten: kein seitlicher Überlauf, keine zu kleinen Tippziele.

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

- **Teilnehmerzahl**: Den Text über dem Raster zieht `tools/galerie.js`
  automatisch mit. Der Zähler unter „Vorteile" steht weiterhin fest in
  `index.html` und muss von Hand nachgeführt werden.
- **Logos**: Erst vier Betriebe haben ein eigenes Logo hinterlegt. Für
  die übrigen stammt die Grafik noch aus der ersten Runde. Welche das
  sind, zeigt `node tools/galerie.js` am Ende an.
- **Chatbot**: `<div id="chat-slot">` liegt auf allen Seiten bereit,
  die Skript-Einbindung ist auskommentiert.

## GitHub Pages

Settings → Pages → Branch `main`, Ordner `/`. Für ein öffentliches
Pages-Deployment muss das Repository öffentlich sein (oder GitHub Pro).
