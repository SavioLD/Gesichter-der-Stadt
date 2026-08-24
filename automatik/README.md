# Automatische Übernahme der Betriebsprofile

Ziel: Ein Betrieb füllt `betriebsprofil.html` aus – und die Kachel auf
der Website ist danach ohne weiteres Zutun aktuell. Kein Logo von Hand
speichern, kein Werkzeug starten.

## Wie es zusammenhängt

```
Betrieb füllt das Formular aus
        │
        ├─► Web3Forms ──► E-Mail an info@laendle-digital.com
        │                 (mit Ansprechpartner, Telefon, Beschreibung)
        │
        └─► Annahmestelle (Cloudflare Worker)
                  │
                  ├─ legt das Logo unter assets/logos/ ab
                  └─ trägt den Betrieb in betriebe.json ein
                            │
                            ▼
                  GitHub Action "Kacheln und Galerie bauen"
                            │
                            ├─ node tools/kachel.js --alle
                            └─ node tools/galerie.js
                                      │
                                      ▼
                            GitHub Pages liefert aus
```

Die E-Mail bleibt, weil dort die Kontaktdaten stehen. Die gehören
bewusst **nicht** ins Repository – das ist öffentlich.

Das Werkzeug aus `tools/` verschwindet nicht, es läuft nur nicht mehr
bei euch, sondern in der Action.

## Einrichtung – einmalig, etwa zehn Minuten

### 1. GitHub-Token anlegen

github.com → Settings → Developer settings → **Fine-grained personal
access tokens** → *Generate new token*

- **Repository access:** nur `SavioLD/Gesichter-der-Stadt`
- **Permissions:** `Contents: Read and write`, `Pull requests: Read and write`
- Laufzeit nach eurem Geschmack; läuft er ab, hört die Automatik auf zu
  arbeiten und die Profile kommen weiterhin per E-Mail.

Den Token einmal kopieren – er wird nur einmal angezeigt.

### 2. Worker veröffentlichen

Cloudflare-Konto anlegen (kostenlos, der Bedarf hier liegt weit unter
jedem Limit). Dann im Ordner `automatik/`:

```bash
npx wrangler login
npx wrangler secret put GITHUB_TOKEN     # Token einfügen
npx wrangler deploy
```

`wrangler deploy` gibt am Ende eine Adresse aus, etwa
`https://gesichter-annahme.<konto>.workers.dev`.

### 3. Adresse eintragen

In `config.js`:

```js
window.GDS_AUTOMATIK_URL = "https://gesichter-annahme.<konto>.workers.dev";
```

Committen und pushen. Fertig.

## Zwei Betriebsarten

In `wrangler.toml` steht `MODUS`:

| Wert | Was passiert |
|---|---|
| `pr` | Die Einreichung landet als Pull Request. Ihr bekommt eine Benachrichtigung, schaut kurz drauf und tippt auf *Merge*. Danach läuft alles automatisch weiter. |
| `direkt` | Die Einreichung geht sofort auf `main` und ist wenige Minuten später live. Kein Klick, aber auch kein Blick. |

**Voreingestellt ist `pr`**, und dazu würde ich raten. Das Formular ist
öffentlich – im Direkt-Modus könnte jeder, der die Adresse kennt, ein
Bild unter dem Namen eines eurer Betriebe auf die Website stellen. Der
eine Klick ist die Sicherung dagegen.

Umstellen ist eine Zeile in `wrangler.toml` plus `npx wrangler deploy`.

## Was die Annahmestelle ablehnt

- fehlender Betriebsname, Kategorietext oder Logo
- Logos über 5 MB
- alles außer PNG, JPEG, WebP und SVG
- ausgefülltes Honigtopf-Feld (Bots)

`HERKUNFT` in `wrangler.toml` begrenzt zusätzlich, von welcher Seite
angenommen wird.

## Wenn etwas klemmt

Die Automatik ist bewusst so gebaut, dass sie nichts kaputt macht:
Schlägt sie fehl, geht die E-Mail trotzdem raus, und der Betrieb sieht
seine Bestätigung. Ihr pflegt das Profil dann wie bisher von Hand ein –
der Weg dafür steht in der `README.md` im Hauptordner.

Läuft der Worker, aber es kommt nichts an:

```bash
npx wrangler tail          # Live-Protokoll der Annahmestelle
```

Kommt der Eintrag an, aber die Kachel ändert sich nicht: im Repository
unter **Actions** nachsehen, ob *Kacheln und Galerie bauen* durchgelaufen
ist.
