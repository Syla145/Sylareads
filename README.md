# Sylareads

**Learn to read the world.** Ein Lesetrainer für GeoGuessr-Spieler: fremde Schriften lesen, Ortsnamen erkennen, Schilderwörter verstehen.

Stand: **Meilenstein M1** – vollständige Engine und vollständiger Kurs *Russian Cyrillic*. Greek, Bengali und Thai erscheinen als „Bald verfügbar“ und folgen in M2 und M3.

## Was drin ist

- 29 Lektionen Russisch: 33 Buchstaben in didaktischer Reihenfolge (Easy Wins → False Friends → neue Formen → komplexe Zeichen), Kleinbuchstaben-Fallen, Ortsnamen-Endungen, Namensbausteine, 4 Begriffslektionen, 6 Städte- und 6 Regionslektionen
- 50 Städte und 50 Regionen, 51 GeoGuessr-Begriffe mit Abkürzungen, 35 Übungswörter, 56 Kombinationen
- Lernen, Üben, Freies Üben, alle acht Modi (Letters, Combinations, Words, Cities, Regions, GeoGuessr Terms, Weak Items, Mixed), Smart Practice, Scan-Aufgabe
- Exaktes Answer Matching ohne Fuzzy-Logik: deutscher Name, englischer Name und Transliteration gleichwertig
- Leitner-SRS mit 8 Boxen, Mastery (New / Learning / Familiar / Mastered), Weak Items inklusive Verwechslungspaaren
- XP, Level, Streak, 14 Achievements, Lesbarkeits-Meilenstein („31 / 50 cities readable“)
- DE/EN-Oberfläche, Dark Mode, Desktop und Mobile, komplett per Tastatur bedienbar
- Fortschritt in localStorage, Export/Import als `sylareads-progress.json`

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
  content/     Inhalte pro Kurs (ru/: Buchstaben, Wörter, Begriffe, Orte, Lektionen,
               Transliterationsregeln) und das Kurs-Register
  store/       Zustand-Store, localStorage, Migrationen, Import/Export
  i18n/        Wörterbücher de/en und Übersetzungsfunktion
  features/    Seiten: home, dashboard, learn, practice, session, script, profile
  ui/          Bausteine: Buttons, Balken, Top-Bar, Modal
  styles/      Design-Tokens und Styles
```

## Einen Kurs ergänzen (M2/M3)

1. Ordner `src/content/<kurs>/` nach dem Muster von `ru/` anlegen: Leseeinheiten, Segmentierungsregeln (`segments`), Wörter, Orte, Lektionen.
2. Im Register `src/content/registry.ts` den Kurs auf `status: 'available'` setzen und `load` eintragen.
3. Den Kurs in `src/content/content.test.ts` zur Liste `courses` hinzufügen. Die Tests prüfen Eindeutigkeit, Decodierbarkeit, Antwortlisten und Übersetzungen.

## Antwortregeln

Eine Antwort ist richtig, wenn sie nach der Normalisierung exakt einer definierten Form entspricht. Normalisiert werden nur Groß-/Kleinschreibung, Leerzeichen am Rand, Akzente (ä → a), Strichvarianten und Apostrophe; Bindestrich und Leerzeichen gelten als gleich. Ein Tippfehler bleibt ein Fehler.
