# Sylareads

**Learn to read the world.** Ein Lesetrainer für GeoGuessr-Spieler: fremde Schriften lesen, Ortsnamen erkennen, Schilderwörter verstehen.

Stand: **Meilenstein M3 + Orte-Ausbau** – vollständige Engine und vier Kurse: *Russian Cyrillic*, *Greek*, *Thai* und *Bengali* (Bangladesch). Jeder Kurs hat 100 Städte und alle Regionen erster Ebene; jeder Ort hat Koordinaten für die spätere Karte.

## Was drin ist

- 41 Lektionen Russisch: 33 Buchstaben in didaktischer Reihenfolge (Easy Wins → False Friends → neue Formen → komplexe Zeichen), Kleinbuchstaben-Fallen, Ortsnamen-Endungen, Namensbausteine, 4 Begriffslektionen, 11 Städte- und 13 Regionslektionen (auf der Karte)
- 100 Städte (die größten nach Einwohnerzahl) und alle 83 international anerkannten Föderationssubjekte (ohne Krim und Sewastopol), 51 GeoGuessr-Begriffe mit Abkürzungen, 35 Übungswörter, 56 Kombinationen
- Lernen, Üben, Freies Üben, alle acht Modi (Letters, Combinations, Words, Cities, Regions, GeoGuessr Terms, Weak Items, Mixed), Smart Practice, Scan-Aufgabe
- Exaktes Answer Matching ohne Fuzzy-Logik: deutscher Name, englischer Name und Transliteration gleichwertig
- Leitner-SRS mit 8 Boxen, Mastery (New / Learning / Familiar / Mastered), Weak Items inklusive Verwechslungspaaren
- XP, Level, Streak, Erfolge pro Kurs in Bronze/Silber/Gold (siehe unten), Lesbarkeits-Meilenstein („31 / 100 cities readable“)
- DE/EN-Oberfläche, Dark Mode, Desktop und Mobile, komplett per Tastatur bedienbar
- Fortschritt in localStorage, Export/Import als `sylareads-progress.json`

### Greek

- 27 Lektionen: 24 Buchstaben (Easy Wins → False Friends wie Η, Ρ, Ν, Β → neue Formen), zwei Lektionen Buchstabenpaare (αι ει οι ου, αυ ευ μπ ντ γκ γγ), Klein- und Großschrift ohne Akzente, Namensbausteine (Άγιος, Νέα, Άνω, Κάτω), 4 Begriffslektionen, 11 Städte- und 3 Regionslektionen
- 100 Städte (die größten eigenständigen Orte; Vororte von Athen und Thessaloniki zählen zur Stadt, Piräus ausgenommen), alle 13 Regionen, 14 Inseln, 38 Schilderbegriffe
- Transliteration nach ELOT 743 wie auf griechischen Wegweisern (Athina, Irakleio); die gängige gesprochene Form gilt ebenfalls (Iraklio, Pireas). Buchstabenpaare sind eigene Leseeinheiten: ευ ist ev/ef, nie „eu“.

### Thai

- 41 Lektionen: 42 Konsonanten, 15 Vokalzeichen und 5 Sonderzeichen (Tonzeichen, Karan, Mai Taikhu, Mai Yamok, Paiyannoi) in 11 Buchstabenlektionen, 3 Regellektionen (Silbenende, zusammengesetzte Vokale, unsichtbare Vokale), Namensbausteine, 4 Begriffslektionen, 11 Städte- und 11 Provinzlektionen (auf der Karte)
- 100 Städte (alle 77 Provinzhauptstädte plus die 23 größten weiteren Städte wie Hat Yai, Pattaya, Ko Samui), alle 77 Provinzen (inkl. Bangkok), 36 Schilderbegriffe, 52 Übungswörter
- Thai wird in Silben gelesen, nicht Buchstabe für Buchstabe. Deshalb gibt es keine regelbasierte Transliteration: Jedes Wort hat eine Liste erlaubter Lesungen nach RTGS (der Umschrift auf thailändischen Schildern), dazu verbreitete Varianten (Phuket, Chiang Mai, Ayutthaya). Tonhöhen werden nicht abgefragt – sie helfen beim Lesen von Schildern nicht.
- Vokalzeichen erscheinen mit Platzhalterkreis (◌า), damit sichtbar ist, wo sie am Konsonanten sitzen.

### Bengali

- 41 Lektionen: 36 Konsonanten, 11 unabhängige Vokale, 10 Vokalzeichen und 4 Sonderzeichen in 11 Buchstabenlektionen, Phala und Reph, 2 Lektionen Ligaturen (ট্ট ল্ল ক্স ঞ্জ ঙ্গ ক্ষ ষ্ট হ্ম ন্ধ ঞ্চ স্ট স্ক), Ortsnamen-Endungen (-পুর, -গঞ্জ, -বাজার, -হাট, -গ্রাম, -খালী), 4 Begriffslektionen, 1 Divisionslektion, 10 Distriktlektionen und 11 Städtelektionen
- 100 Städte (alle 64 Distrikthauptstädte plus 36 große Orte wie Savar, Sreemangal, Teknaf, Benapole), alle 8 Divisionen und alle 64 Distrikte, 32 Schilderbegriffe (viele englische Lehnwörter wie রোড, স্টেশন, কলেজ)
- Englische Namen nach der offiziellen Schreibweise von 2018 (Chattogram, Cumilla, Barishal, Jashore, Bogura); die älteren Formen (Chittagong, Comilla, Barisal, Jessore, Bogra) gelten ebenfalls. Ligaturen sind eigene Leseeinheiten, weil man sie als Ganzes erkennt.

### Karten (Bengali, Russian Cyrillic, Thai)

Drei Kurse haben eine klickbare Karte mit allen Gebieten der ersten Verwaltungsebene:

| Kurs | Gebiete | Gruppiert nach | Lektionen |
|------|---------|----------------|-----------|
| Bengali | 64 Distrikte | 8 Divisionen | 10 |
| Russian Cyrillic | 83 Föderationssubjekte (ohne Krim und Sewastopol) | 8 Föderationskreise | 13 |
| Thai | 77 Provinzen | 6 Landesteile | 11 |

- Die Lektionen sind geografisch geordnet, damit Nachbarn zusammen gelernt werden (z. B. „Moskau & Goldener Ring“, „Isan: am Mekong“).
- Aufgaben: **Wo liegt …?** (Namen in Originalschrift lesen, Gebiet anklicken), **Welche/r … ist markiert?** (markierte Fläche, Auswahl aus vier Nachbarn in Originalschrift) und das Tippen des Namens.
- Tab **Karte** zum Erkunden mit Zoom (Mausrad, Ziehen, zwei Finger, +/−) und Beschriftung in Originalschrift, Latein oder aus. In Kartenaufgaben ist die Beschriftung standardmäßig aus; das gesuchte Gebiet ist nie beschriftet.
- Zielkarte auf der Übersicht („Ziel: alle 64 Distrikte“ usw.) und „… üben“ startet eine Übung nur mit Kartengebieten (`?layer=map`).
- Grenzen: [geoBoundaries](https://www.geoboundaries.org) gbOpen ADM1/ADM2 (CC BY 4.0), vereinfacht und vorprojiziert in `src/content/<kurs>/map.json` (je ≈ 100 KB, wird nur mit dem jeweiligen Kurs geladen). Russland nutzt eine flächentreue Kegelprojektion (Albers), Thailand und Bangladesch eine einfache Zylinderprojektion. Jede der 100 Städte jedes Kurses liegt geprüft innerhalb ihres Gebiets.

### Kurs „Schriften erkennen“ (`#/scripts`)

Ein Blick aufs Schild verrät oft schon das Land. Der Kurs zeigt Ortsnamen in 28 Schriften; die Antwort ist immer der Ort (Land oder Region), der Name der Schrift steht als Info dabei. Nur Länder mit Street View in GeoGuessr.

| Lektion | Schriften |
|---------|-----------|
| 1 Erster Blick | Kyrillisch, Griechisch, Arabisch, Hebräisch, Thai, Devanagari |
| 2 Ostasien | Japanisch, Chinesisch (Langzeichen: Taiwan, Hongkong, Macau), Koreanisch |
| 3 Südostasien | Laotisch, Khmer (+ Thai) |
| 4 Nordindien, Bangladesch, Bhutan | Bengalisch, Gurmukhi, Gujarati, Odia, Tibetisch (+ Devanagari) |
| 5 Südindien und Sri Lanka | Tamil, Telugu, Kannada, Malayalam, Singhalesisch |
| 6 Kyrillisch I | Russisch, Ukrainisch, Bulgarisch |
| 7 Kyrillisch II | Serbisch, Mazedonisch, Kasachisch, Mongolisch (+ Russisch, Bulgarisch) |

- Jede Schrift hat zwei, drei Erkennungszeichen mit Beispielzeichen und echte Ortsnamen von Schildern. Bei den Kyrillisch-Varianten enthält jedes Beispiel sein Erkennungszeichen (ы/э, ї/є/ґ, ъ, ђ/ћ/џ, ѓ/ќ/ѕ, қ/ғ/ә/ұ/һ, doppelte Vokale); ein Test prüft das. Kirgisistan fehlt bewusst: seine Schrift ist von Kasachisch und Mongolisch an einzelnen Buchstaben kaum sicher zu trennen.
- Aufgaben: **Wo bist du?** (ein Ortsname, vier Orte zur Wahl) und **Welcher Name steht in …?** (drei Namen, einer ist gesucht). Falsche Optionen kommen bevorzugt aus der Verwechslungsgruppe derselben Familie. Nach einem Fehler zeigt das Feedback das Erkennungszeichen; die Schrift kommt einmal wieder.
- Fortschritt im normalen Speicher unter dem Kurs `scripts` (SRS, XP, Streak, Fehler-Review, Online-Speicherung). Seite mit allen Schriften zum Nachschlagen, Erfolge „Schriftkenner“ (10/20/28 Schriften), „Kyrillisch-Detektiv“ und „Indien-Kenner“.
- Schriftarten: Noto (SIL OFL 1.1). `tools/script-fonts.mjs` kopiert nur die nötigen Teilmengen nach `src/features/scripts/fonts/` (≈ 1,5 MB, der Browser lädt nur, was er anzeigt); nach Änderungen an `src/content/scripts/data.ts` neu ausführen – ein Test meldet fehlende Zeichen. Der Kurs wird erst beim Öffnen geladen.
- Nächste Ausbaustufe: lateinische Sonderzeichen (ő ű → Ungarn, ł → Polen, ș ț → Rumänien, ğ ş → Türkei, å ø æ → Skandinavien).

### Schildansicht

Ortsnamen erscheinen in Übungen, Tempo-Runden, im Fehler-Review und im Kurs „Schriften erkennen“ auf nachgezeichneten Schildern im Stil des Landes (CSS, keine Fotos oder Originalgrafiken). Umschalter **Aus / Gemischt / Immer** unter „Üben“, „Tempo“ und im Schriften-Kurs (pro Gerät, Standard „Gemischt“ = etwa jede zweite Aufgabe). In Lektionen kommen Schilder erst bei der Wiederholung, nicht beim ersten Kennenlernen; die Einstufung bleibt schlicht.

| Land | Schilder |
|------|----------|
| Russland | blauer Wegweiser (Landstraße), grüner Wegweiser (Autobahn), weißes Ortsschild mit schwarzem Rand, Ortsende mit roter Schräglinie |
| Griechenland | blaues Pfeilschild, Griechisch gelb, Latein weiß; Ortsschild weiß mit blauen Streifen |
| Thailand | grüner Highway-Wegweiser (Thai oben, Latein darunter); weißer Kilometerstein mit Pyramidendach, Provinzname auf der Seite |
| Bangladesch | Ladenschild: Ladenname, Angebot, „প্রোঃ …“, Adresse „Straße, Upazila, **Distrikt**“, Handynummer (Platzhalter). Aufgabe „In welchem Distrikt ist dieser Laden?“, auch auf der Karte |

- Die Lateinzeile zweisprachiger Schilder bleibt bis zur Antwort verdeckt.
- Nur belegte Schildtypen; Wegweiser und Kilometerpfosten in Bangladesch fehlen bewusst (keine sichere Quelle), ebenso eine Farbcodierung der Thai-Kilometersteine. Das thailändische Staatswappen auf den Steinen wird nicht gezeichnet.
- Upazilas je Distrikt aus [nuhil/bangladesh-geocode](https://github.com/nuhil/bangladesh-geocode) (MIT) in `src/content/bn/upazilas.ts`. Logik in `src/domain/signs.ts`, Zeichnung in `src/features/signs/` (Galerie aller Schilder unter `#/schilder`).

### Fehler-Review („Heute falsch“)

Auf der Übersicht und unter „Üben“ steht eine Liste aller Elemente, die heute falsch beantwortet wurden (am Morgen die von gestern, bis heute etwas falsch läuft). Pro Element: Originalschrift, Name, wie oft falsch und ob es inzwischen wieder richtig war. „Genau diese üben“ startet eine Übung mit genau diesen Elementen, „Nur die … offenen“ lässt die schon wieder richtigen weg.

- Fehler zählen aus Lektionen, Übungen und Tempo-Runden. Antworten der Einstufung („kann ich noch nicht“) und abgelaufene Tempo-Zeit (zu langsam, nicht falsch) zählen nicht.
- Gespeichert pro Kurs und Tag für eine Woche (`mistakes`), auch bei der Online-Speicherung zusammengeführt. Logik in `src/domain/mistakes.ts`, Karte in `src/features/mistakes/`.

### Einstufung („Kann ich schon“)

Wer eine Schrift schon lesen kann, übernimmt sein Vorwissen, statt alle Lektionen durchzuklicken. Beim ersten Öffnen eines Kurses fragt die Übersicht „Kennst du diese Schrift schon?“, auf der Lernen-Seite hat jeder Abschnitt einen Knopf „Kann ich schon“.

| Weg | Ablauf | Ergebnis |
|-----|--------|----------|
| Wiederholung | Jedes Element des Abschnitts einmal (getippt, Kartengebiete per Klick) | Gewusstes zählt als „Lernend“ (Box 2) |
| Test | 20 Aufgaben, etwa drei Viertel schwierige (False Friends, Verwechslungspaare, Ligaturen, weniger bekannte Orte) | Ab 18 / 20 gilt alles als „Vertraut“ (Box 3), Fehler kommen bald zur Wiederholung; darunter zählt nur Gewusstes |

- Abschnitte mit höchstens 20 Elementen haben nur einen Weg („Alles einmal prüfen“), weil der Test dort ohnehin alles abfragt.
- Die Einstufung hebt Fortschritt nur an. Lektionen, deren Elemente danach alle gewusst sind, gelten als „eingestuft“; gespielte Lektionen behalten ihr Ergebnis, und eine später gespielte Lektion ersetzt den Vermerk (auch geräteübergreifend). Erfolge für Lektionen gibt es nur für gespielte.
- Logik ohne React in `src/domain/placement.ts`, Seiten in `src/features/placement/`.

### Lesen auf Zeit (Tab „Tempo“)

Trainiert, Namen so schnell zu lesen wie in einer GeoGuessr-Runde. Mitmachen nur Dinge, die man schon gelernt hat (mindestens 4).

| Modus | Ablauf |
|-------|--------|
| Zeit pro Aufgabe | 20 Aufgaben, Zeit einstellbar von 1 bis 15 Sekunden; läuft sie ab, zählt die Aufgabe als nicht gewusst |
| Blitzrunde | 60 Sekunden, so viele richtige Antworten wie möglich; Bestwert pro Inhalt |
| Aufblitzen | Der Name ist nur 0,5 bis 2 Sekunden zu sehen, danach erscheinen die Antworten |

- Inhalte: **Buchstaben** (Zeichen → Lesung), **Ortsnamen** (Originalschrift → einer von vier ähnlich aussehenden Orten) und **Auf der Karte** (Name lesen, Gebiet antippen).
- Das Tempo zählt nur hier: Tempo-Runden ändern die Lernboxen nicht, langsames Lesen beim Lernen und Üben wird nie bestraft. Gespeichert werden eine geglättete Lesezeit pro Element, der Tagesdurchschnitt pro Inhalt (Verlauf auf der Tempo-Seite) und die Bestwerte. Langsame Namen kommen in den Tempo-Runden öfter dran; „Diese mit Zeit üben“ trainiert gezielt die langsamsten oder die falschen.
- Logik ohne React in `src/domain/tempo.ts` (Auswahl, Aufgaben, Ablauf, Lesezeiten, Zusammenführen bei der Online-Speicherung), Seiten in `src/features/tempo/`.

### Koordinaten und Quellen

Jeder Ort hat einen Kartenpunkt (`coords`, Breite/Länge) in `src/content/<kurs>/coords.ts`. Die Datei ist generiert: Städte stammen aus [GeoNames](https://www.geonames.org) (CC BY 4.0), Regionen sind die Label-Punkte aus [Natural Earth](https://www.naturalearthdata.com) (gemeinfrei). Jede Stadt wurde gegen das Polygon ihrer Region geprüft; einige kleinere Orte in Bangladesch und die griechischen Inseln sind von Hand gesetzt. Die Polygone aus Natural Earth sind die Grundlage für die geplante Karte.

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

Ohne Anmeldung bleibt alles im Browser des Nutzers (localStorage, ca. 200 KB im Vollausbau). Es gibt keine Tracker. Safari kann Website-Daten nach 7 Tagen ohne Besuch löschen; deshalb im Profil regelmäßig **Fortschritt exportieren** oder online speichern. Der Import zeigt vorher an, was ersetzt wird, und behält den alten Stand als Sicherung.

## Erfolge

Erfolge sind nach Kursen gruppiert; die meisten haben drei Stufen (Bronze, Silber, Gold). Alle Messungen stehen ohne Oberfläche in `src/domain/achievements.ts` (jeder Erfolg hat eine Funktion `measure`, die Wert und Ziel liefert).

- **Allgemein:** Erste Schritte, Dranbleiben (Streak 7/30/100 Tage), Vielleser (1.000/5.000/10.000 Antworten).
- **Pro Sprachkurs:** Alphabet (alle Buchstaben kennengelernt / Moderate / Pro), Stadtleser (10/50/100 Städte auf Pro), Lernpfad (10 Lektionen / Hälfte / alle; nur gespielte, nicht eingestufte), Blitz (15/25/35 richtige in einer Blitzrunde), Fehlerfrei (1/5/15 Lektionen ohne Fehler), Kartenkenner (Hälfte auf Pro / alle auf Pro / alle auf Expert; nur Kurse mit Karte) und ein Sonder-Erfolg je Sprache (False Friends, Buchstabenpaare, Vokalzeichen, Ligaturen).
- **Schriften erkennen:** Schriftkenner, Kyrillisch-Detektiv, Indien-Kenner.
- **Geheim:** ein Erfolg, der nur als „?“ erscheint.

Die Übersicht im Profil zeigt je Erfolg die drei Medaillen und die nächste Stufe; Kurse ohne erreichten Erfolg sind eingeklappt. Die Kursübersicht zeigt unter „Nächste Erfolge“ die zwei nächstliegenden Ziele mit Fortschrittsbalken. Erfolge werden beim Öffnen eines Kurses und nach jeder Sitzung nachgeprüft, also auch rückwirkend vergeben. Erfolge aus der alten Liste (vor der Umstellung) werden nicht mehr angezeigt.

## Online-Speicherung (optional, Firebase)

Im Profil erscheint „Online speichern“, sobald eine Firebase-Konfiguration eingetragen ist. Nutzer melden sich mit Google an; der Fortschritt wird ein paar Sekunden nach jeder Änderung, beim Öffnen und beim Zurückkehren in die App abgeglichen. Fortschritt von mehreren Geräten wird **zusammengeführt** (pro Lernobjekt gilt die zuletzt beantwortete Version, Lektionen und Achievements werden vereinigt), nichts wird überschrieben. Nur „Fortschritt zurücksetzen“ und „Importieren“ ersetzen bewusst auch die Online-Kopie. Firebase wird erst geladen, wenn jemand die Online-Speicherung nutzt.

Einrichtung (einmalig, kostenloser Spark-Tarif reicht):

1. [Firebase Console](https://console.firebase.google.com) → **Projekt hinzufügen**, z. B. `sylareads` (Google Analytics wird nicht gebraucht). Ein eigenes Projekt hält die Daten getrennt von anderen Seiten.
2. **Build → Authentication → Jetzt starten → Sign-in method → Google** aktivieren, Support-E-Mail wählen, speichern.
3. **Authentication → Settings → Authorized domains → Domain hinzufügen:** `<dein-name>.github.io`.
4. **Build → Firestore Database → Datenbank erstellen**, Standort z. B. `eur3 (europe-west)`, Produktionsmodus. Dann im Tab **Regeln** einfügen und **Veröffentlichen**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /sylareads/{uid} {
         allow read, delete: if request.auth != null && request.auth.uid == uid;
         allow create, update: if request.auth != null && request.auth.uid == uid
           && request.resource.data.data is string
           && request.resource.data.data.size() < 900000;
       }
     }
   }
   ```
   Jeder angemeldete Nutzer kann so nur sein eigenes Dokument lesen und schreiben.
5. **Projekteinstellungen (Zahnrad) → Allgemein → Meine Apps → Web-App hinzufügen (`</>`)**, Name `Sylareads`, kein Firebase Hosting. Die angezeigte `firebaseConfig` in `src/sync/firebaseConfig.ts` bei `FIREBASE_CONFIG` eintragen (statt `null`). Die Werte sind öffentlich und dürfen ins Repository; geschützt wird über die Regeln oben.

Gespeichert wird pro Nutzer ein Dokument `sylareads/<uid>` mit dem Fortschritt als JSON (wie beim Export) und dem Zeitpunkt der letzten Speicherung.

## Projektstruktur

```
src/
  domain/      reine Logik ohne React: Normalisierung, Matching, SRS, Session-Engine,
               Lektions- und Übungs-Builder, Statistik, XP/Level/Streak, Achievements
  content/     Inhalte pro Kurs (ru/, el/, th/, bn/: Leseeinheiten, Wörter, Begriffe,
               Orte, Lektionen, Transliterationsregeln) und das Kurs-Register
  store/       Zustand-Store, localStorage, Migrationen, Import/Export
  sync/        Online-Speicherung über Firebase (optional, lazy geladen)
  i18n/        Wörterbücher de/en und Übersetzungsfunktion
  features/    Seiten: home, dashboard, learn, practice, session, mistakes, placement, signs, tempo, map, script, scripts, profile
  ui/          Bausteine: Buttons, Balken, Top-Bar, Modal
  styles/      Design-Tokens und Styles
```

## Einen Kurs ergänzen

1. Ordner `src/content/<kurs>/` anlegen. Für Alphabetschriften dient `ru/` oder `el/` als Muster (Segmentierungsregeln in `segments`), für Abugidas `th/` oder `bn/` (`segments: () => []`, explizite Antwortlisten, Leseeinheiten über `requiredLetters`).
2. Im Register `src/content/registry.ts` den Kurs auf `status: 'available'` setzen und `load` eintragen.
3. Den Kurs in `src/content/content.test.ts` zur Liste `courses` hinzufügen. Die Tests prüfen Eindeutigkeit, Decodierbarkeit, Antwortlisten und Übersetzungen.

## Antwortregeln

Eine Antwort ist richtig, wenn sie nach der Normalisierung exakt einer definierten Form entspricht. Normalisiert werden nur Groß-/Kleinschreibung, Leerzeichen am Rand, Akzente (ä → a), Strichvarianten und Apostrophe; Bindestrich und Leerzeichen gelten als gleich. Ein Tippfehler bleibt ein Fehler.
