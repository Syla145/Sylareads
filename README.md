# Sylareads

**Learn to read the world.** Ein Lesetrainer für GeoGuessr-Spieler: fremde Schriften lesen, Ortsnamen erkennen, Schilderwörter verstehen.

Stand: **Meilenstein M3** – vollständige Engine und vier Kurse: *Russian Cyrillic*, *Greek* (Griechenland und Zypern), *Thai* und *Bengali* (Bangladesch).

## Was drin ist

- 29 Lektionen Russisch: 33 Buchstaben in didaktischer Reihenfolge (Easy Wins → False Friends → neue Formen → komplexe Zeichen), Kleinbuchstaben-Fallen, Ortsnamen-Endungen, Namensbausteine, 4 Begriffslektionen, 6 Städte- und 6 Regionslektionen
- 50 Städte und 50 Regionen, 51 GeoGuessr-Begriffe mit Abkürzungen, 35 Übungswörter, 56 Kombinationen
- Lernen, Üben, Freies Üben, alle acht Modi (Letters, Combinations, Words, Cities, Regions, GeoGuessr Terms, Weak Items, Mixed), Smart Practice, Scan-Aufgabe
- Exaktes Answer Matching ohne Fuzzy-Logik: deutscher Name, englischer Name und Transliteration gleichwertig
- Leitner-SRS mit 8 Boxen, Mastery (New / Learning / Familiar / Mastered), Weak Items inklusive Verwechslungspaaren
- XP, Level, Streak, 14 Achievements, Lesbarkeits-Meilenstein („31 / 50 cities readable“)
- DE/EN-Oberfläche, Dark Mode, Desktop und Mobile, komplett per Tastatur bedienbar
- Fortschritt in localStorage, Export/Import als `sylareads-progress.json`

### Greek

- 23 Lektionen: 24 Buchstaben (Easy Wins → False Friends wie Η, Ρ, Ν, Β → neue Formen), zwei Lektionen Buchstabenpaare (αι ει οι ου, αυ ευ μπ ντ γκ γγ), Klein- und Großschrift ohne Akzente, Namensbausteine (Άγιος, Νέα, Άνω, Κάτω), 4 Begriffslektionen, 6 Städte- und 4 Regionslektionen
- 50 Städte (40 Griechenland, 10 Zypern), 13 Regionen, 5 Bezirke Zyperns, 14 Inseln, 38 Schilderbegriffe
- Transliteration nach ELOT 743 wie auf griechischen Wegweisern (Athina, Irakleio); die gängige gesprochene Form gilt ebenfalls (Iraklio, Pireas). Buchstabenpaare sind eigene Leseeinheiten: ευ ist ev/ef, nie „eu“.

### Thai

- 34 Lektionen: 42 Konsonanten, 15 Vokalzeichen und 5 Sonderzeichen (Tonzeichen, Karan, Mai Taikhu, Mai Yamok, Paiyannoi) in 11 Buchstabenlektionen, 3 Regellektionen (Silbenende, zusammengesetzte Vokale, unsichtbare Vokale), Namensbausteine, 4 Begriffslektionen, 6 Städte- und 9 Provinzlektionen
- 50 Städte, alle 77 Provinzen (inkl. Bangkok), 36 Schilderbegriffe, 52 Übungswörter
- Thai wird in Silben gelesen, nicht Buchstabe für Buchstabe. Deshalb gibt es keine regelbasierte Transliteration: Jedes Wort hat eine Liste erlaubter Lesungen nach RTGS (der Umschrift auf thailändischen Schildern), dazu verbreitete Varianten (Phuket, Chiang Mai, Ayutthaya). Tonhöhen werden nicht abgefragt – sie helfen beim Lesen von Schildern nicht.
- Vokalzeichen erscheinen mit Platzhalterkreis (◌า), damit sichtbar ist, wo sie am Konsonanten sitzen.

### Bengali

- 26 Lektionen: 36 Konsonanten, 11 unabhängige Vokale, 10 Vokalzeichen und 4 Sonderzeichen in 11 Buchstabenlektionen, Phala und Reph, 2 Lektionen Ligaturen (ট্ট ল্ল ক্স ঞ্জ ঙ্গ ক্ষ ষ্ট হ্ম ন্ধ ঞ্চ স্ট স্ক), Ortsnamen-Endungen (-পুর, -গঞ্জ, -বাজার, -হাট, -গ্রাম, -খালী), 4 Begriffslektionen, 6 Städte- und 1 Divisionslektion
- 50 Städte, alle 8 Divisionen, 32 Schilderbegriffe (viele englische Lehnwörter wie রোড, স্টেশন, কলেজ)
- Englische Namen nach der offiziellen Schreibweise von 2018 (Chattogram, Cumilla, Barishal, Jashore, Bogura); die älteren Formen (Chittagong, Comilla, Barisal, Jessore, Bogra) gelten ebenfalls. Ligaturen sind eigene Leseeinheiten, weil man sie als Ganzes erkennt.

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
npm run dev        # Entwicklungsserver auf http://localhost:5173
npm test           # Logik- und Inhaltstests
npm run build      # statischer Build nach dist/
npm run preview    # Build lokal ansehen
```

## Deployment auf GitHub Pages

1. Neues Repository auf GitHub anlegen (öffentlich oder privat mit Pages-Freigabe), z. B. `sylareads`.
2. Projekt hochladen:
   ```bash
   git init
   git add .
   git commit -m "Sylareads M1"
   git branch -M main
   git remote add origin https://github.com/<dein-name>/sylareads.git
   git push -u origin main
   ```
3. Im Repository unter **Settings → Pages → Build and deployment → Source** die Option **GitHub Actions** wählen.
4. Der Workflow `.github/workflows/deploy.yml` startet bei jedem Push auf `main`: Typecheck, Tests, Build, Veröffentlichung. Nach etwa einer Minute ist die App unter `https://<dein-name>.github.io/sylareads/` erreichbar. Den Fortschritt siehst du unter **Actions**.
5. Den Link an ausgewählte Personen schicken. Es gibt keinen Login; wer den Link hat, kann die App nutzen.

Weitere Hinweise:

- Der Build verwendet relative Pfade und Hash-Routing (`#/russian/learn`). Der Repository-Name ist deshalb egal, und direkte Links funktionieren ohne Server-Konfiguration.
- Schlägt ein Test fehl, wird nicht veröffentlicht. Die Inhaltstests prüfen u. a., dass jeder Ort mit allen Namen erkannt wird und keine Antwort zwei Orte gleichzeitig trifft.
- Eigene Domain: unter **Settings → Pages → Custom domain** eintragen.

## Fortschritt und Datenschutz

Alles bleibt im Browser des Nutzers (localStorage, ca. 200 KB im Vollausbau). Es gibt keinen Server und keine Tracker. Safari kann Website-Daten nach 7 Tagen ohne Besuch löschen; deshalb im Profil regelmäßig **Fortschritt exportieren**. Der Import zeigt vorher an, was ersetzt wird, und behält den alten Stand als Sicherung.

## Projektstruktur

```
src/
  domain/      reine Logik ohne React: Normalisierung, Matching, SRS, Session-Engine,
               Lektions- und Übungs-Builder, Statistik, XP/Level/Streak, Achievements
  content/     Inhalte pro Kurs (ru/, el/, th/, bn/: Leseeinheiten, Wörter, Begriffe,
               Orte, Lektionen, Transliterationsregeln) und das Kurs-Register
  store/       Zustand-Store, localStorage, Migrationen, Import/Export
  i18n/        Wörterbücher de/en und Übersetzungsfunktion
  features/    Seiten: home, dashboard, learn, practice, session, script, profile
  ui/          Bausteine: Buttons, Balken, Top-Bar, Modal
  styles/      Design-Tokens und Styles
```

## Einen Kurs ergänzen

1. Ordner `src/content/<kurs>/` anlegen. Für Alphabetschriften dient `ru/` oder `el/` als Muster (Segmentierungsregeln in `segments`), für Abugidas `th/` oder `bn/` (`segments: () => []`, explizite Antwortlisten, Leseeinheiten über `requiredLetters`).
2. Im Register `src/content/registry.ts` den Kurs auf `status: 'available'` setzen und `load` eintragen.
3. Den Kurs in `src/content/content.test.ts` zur Liste `courses` hinzufügen. Die Tests prüfen Eindeutigkeit, Decodierbarkeit, Antwortlisten und Übersetzungen.

## Antwortregeln

Eine Antwort ist richtig, wenn sie nach der Normalisierung exakt einer definierten Form entspricht. Normalisiert werden nur Groß-/Kleinschreibung, Leerzeichen am Rand, Akzente (ä → a), Strichvarianten und Apostrophe; Bindestrich und Leerzeichen gelten als gleich. Ein Tippfehler bleibt ein Fehler.
