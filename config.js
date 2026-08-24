/* ============================================================
   Gesichter der Stadt – Konfiguration

   HIER den Access Key von Web3Forms eintragen. Er gilt für alle
   drei Formulare (Anmeldung, Ergänzung, Aktion einreichen).

   So kommt man an den Schlüssel:
     1. web3forms.com aufrufen
     2. info@laendle-digital.com eintragen
     3. Der Schlüssel kommt per E-Mail – hier einsetzen

   Solange der Wert leer ist, bleibt das Absenden in allen
   Formularen gesperrt und ein Hinweis erklärt das den Besuchern.

   Der Schlüssel ist öffentlich und darf im Quelltext stehen – er
   erlaubt nur das Zustellen an die hinterlegte Adresse.
============================================================ */
window.GDS_WEB3FORMS_KEY = "bf808e37-6e67-475d-b83e-68e95ab03c54";

/* ============================================================
   Automatische Übernahme der Betriebsprofile

   Adresse der Annahmestelle (Cloudflare Worker, Einrichtung siehe
   automatik/README.md). Ist sie eingetragen, legt ein eingereichtes
   Profil Logo und Eintrag selbst im Repository ab – Kachel und
   Galerie baut danach die GitHub Action.

   Solange der Wert leer ist, ändert sich nichts: Das Profil kommt
   weiterhin per E-Mail und wird von Hand eingepflegt.
============================================================ */
window.GDS_AUTOMATIK_URL = "";
