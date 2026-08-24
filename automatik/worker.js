/* ============================================================
   Gesichter der Stadt – Annahmestelle für Betriebsprofile

   Läuft als Cloudflare Worker. Nimmt das Betriebsprofil-Formular
   entgegen, legt das Logo im Repository ab und trägt den Betrieb
   in betriebe.json ein. Den Rest erledigt die GitHub Action:
   sie baut die Kachel und schreibt die Galerie neu.

   Damit muss niemand mehr eine Datei von Hand speichern oder ein
   Werkzeug starten.

   Einrichtung siehe automatik/README.md
============================================================ */

const ERLAUBT = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

const MAX_BYTES = 5 * 1024 * 1024;

export default {
  async fetch(anfrage, umgebung) {
    const cors = kopfzeilen(umgebung);

    if (anfrage.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (anfrage.method !== "POST") return antwort({ ok: false, fehler: "Nur POST." }, 405, cors);

    let daten;
    try {
      daten = await anfrage.formData();
    } catch {
      return antwort({ ok: false, fehler: "Formulardaten nicht lesbar." }, 400, cors);
    }

    /* Honigtopf: Bots füllen dieses Feld, Menschen sehen es nicht. */
    if (daten.get("hp")) return antwort({ ok: true, uebersprungen: true }, 200, cors);

    const name = (daten.get("betrieb") || "").toString().trim();
    const kategorie = (daten.get("kategorie") || "").toString().trim();
    const instagram = (daten.get("instagram") || "").toString().trim().replace(/^@/, "");
    const website = (daten.get("website") || "").toString().trim();
    const logo = daten.get("logo");

    if (!name) return antwort({ ok: false, fehler: "Betriebsname fehlt." }, 400, cors);
    if (!kategorie) return antwort({ ok: false, fehler: "Kategorietext fehlt." }, 400, cors);
    if (!(logo instanceof File)) return antwort({ ok: false, fehler: "Logo fehlt." }, 400, cors);
    if (logo.size > MAX_BYTES) return antwort({ ok: false, fehler: "Logo ist zu groß." }, 413, cors);

    const endung = ERLAUBT[logo.type];
    if (!endung) return antwort({ ok: false, fehler: "Dateiformat nicht erlaubt." }, 415, cors);

    const gh = new GitHub(umgebung);
    let liste;
    try {
      liste = await gh.leseJson("betriebe.json");
    } catch (e) {
      return antwort({ ok: false, fehler: "Repository nicht lesbar: " + e.message }, 502, cors);
    }

    /* Das Formular schickt den Slug aus der Auswahlliste mit. Fehlt er,
       wird er aus dem Namen abgeleitet – dann ist es ein neuer Betrieb. */
    const gewaehlt = (daten.get("slug") || "").toString().trim();
    const slug = gewaehlt && liste.some((b) => b.slug === gewaehlt) ? gewaehlt : slugify(name);
    if (!slug) return antwort({ ok: false, fehler: "Betriebsname ergibt keinen gültigen Namen." }, 400, cors);

    const neu = !liste.some((b) => b.slug === slug);
    const logoPfad = `assets/logos/${slug}-original${endung}`;

    /* Im PR-Modus landet alles auf einem eigenen Zweig und wartet auf
       einen Klick. Im Direkt-Modus geht es sofort auf main und damit live. */
    const direkt = (umgebung.MODUS || "pr") === "direkt";
    const zweig = direkt ? umgebung.ZWEIG || "main" : `profil/${slug}`;

    try {
      if (!direkt) await gh.zweigAnlegen(zweig);

      await gh.schreibeDatei(
        logoPfad,
        new Uint8Array(await logo.arrayBuffer()),
        `Add the logo ${name} supplied`,
        zweig);

      const eintrag = liste.find((b) => b.slug === slug) || { slug, name, kategorie: "", logo: "", instagram: "", website: "" };
      eintrag.name = eintrag.name || name;
      eintrag.kategorie = kategorie;
      eintrag.logo = logoPfad;
      if (instagram) eintrag.instagram = instagram;
      if (website) eintrag.website = website;
      if (neu) liste.push(eintrag);

      await gh.schreibeDatei(
        "betriebe.json",
        neuerText(liste),
        neu ? `Add ${name} to the business list` : `Update the ${name} profile`,
        zweig);

      if (direkt) return antwort({ ok: true, modus: "direkt", slug }, 200, cors);

      const pr = await gh.pullRequest(
        zweig,
        `Betriebsprofil: ${name}`,
        [
          `Eingereicht über das Betriebsprofil-Formular.`,
          ``,
          `- **Betrieb:** ${name}`,
          `- **Text auf der Grafik:** ${kategorie}`,
          instagram ? `- **Instagram:** @${instagram}` : null,
          website ? `- **Website:** ${website}` : null,
          `- **Logo:** \`${logoPfad}\``,
          ``,
          neu ? `Dieser Betrieb war noch nicht in \`betriebe.json\`.` : null,
          ``,
          `Nach dem Zusammenführen baut die Action die Kachel und schreibt die Galerie neu.`,
        ].filter((z) => z !== null).join("\n"));

      return antwort({ ok: true, modus: "pr", slug, pr }, 200, cors);
    } catch (e) {
      return antwort({ ok: false, fehler: e.message }, 502, cors);
    }
  },
};

/* ---------------------------------------------------------------- GitHub */

class GitHub {
  constructor(umgebung) {
    this.basis = `https://api.github.com/repos/${umgebung.REPO}`;
    this.haupt = umgebung.ZWEIG || "main";
    this.kopf = {
      Authorization: `Bearer ${umgebung.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "gesichter-der-stadt-annahme",
    };
  }

  async ruf(pfad, optionen = {}) {
    const r = await fetch(this.basis + pfad, {
      ...optionen,
      headers: { ...this.kopf, ...(optionen.headers || {}) },
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`GitHub ${r.status}: ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : null;
  }

  async leseJson(pfad, zweig) {
    const d = await this.ruf(`/contents/${pfad}?ref=${encodeURIComponent(zweig || this.haupt)}`);
    return JSON.parse(new TextDecoder().decode(vonBase64(d.content)));
  }

  async zweigAnlegen(zweig) {
    const ref = await this.ruf(`/git/ref/heads/${encodeURIComponent(this.haupt)}`);
    try {
      await this.ruf("/git/refs", {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${zweig}`, sha: ref.object.sha }),
      });
    } catch (e) {
      /* Zweig gibt es schon – dann wird darauf weitergearbeitet. */
      if (!/already exists/i.test(e.message)) throw e;
    }
  }

  async schreibeDatei(pfad, inhalt, nachricht, zweig) {
    let sha;
    try {
      const vorhanden = await this.ruf(`/contents/${pfad}?ref=${encodeURIComponent(zweig)}`);
      sha = vorhanden.sha;
    } catch (e) {
      if (!/404/.test(e.message)) throw e;
    }
    return this.ruf(`/contents/${pfad}`, {
      method: "PUT",
      body: JSON.stringify({
        message: nachricht,
        content: nachBase64(typeof inhalt === "string" ? new TextEncoder().encode(inhalt) : inhalt),
        branch: zweig,
        ...(sha ? { sha } : {}),
      }),
    });
  }

  async pullRequest(zweig, titel, text) {
    try {
      const pr = await this.ruf("/pulls", {
        method: "POST",
        body: JSON.stringify({ title: titel, head: zweig, base: this.haupt, body: text }),
      });
      return pr.html_url;
    } catch (e) {
      /* Zu diesem Zweig läuft schon ein Pull Request – der reicht. */
      if (!/already exists/i.test(e.message)) throw e;
      const offen = await this.ruf(`/pulls?head=${encodeURIComponent(this.basis.split("/repos/")[1].split("/")[0] + ":" + zweig)}&state=open`);
      return offen[0] ? offen[0].html_url : null;
    }
  }
}

/* ----------------------------------------------------------- Hilfsmittel */

function slugify(s) {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/* Gleiche Formatierung wie tools/*.js schreiben, sonst gibt es
   bei jedem Durchlauf einen unnötigen Unterschied. */
function neuerText(liste) {
  return JSON.stringify(liste, null, 2) + "\n";
}

function nachBase64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function vonBase64(b64) {
  const roh = atob(b64.replace(/\s/g, ""));
  const out = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) out[i] = roh.charCodeAt(i);
  return out;
}

function kopfzeilen(umgebung) {
  return {
    "Access-Control-Allow-Origin": umgebung.HERKUNFT || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function antwort(koerper, status, cors) {
  return new Response(JSON.stringify(koerper), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
  });
}
