import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FEEDBACK_URL, LEGAL_AS_OF, OPERATOR, REPO_URL } from '../../content/legal';
import { useLang, useT } from '../../i18n';
import { TopBar } from '../../ui/TopBar';
import './legal.css';

/** About, privacy policy, legal notice and credits: plain pages, German and English. */

function LegalShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="app-shell">
      <TopBar />
      <main className="page page-narrow legal">
        <h1 className="page-title">{title}</h1>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

const Ext = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer">
    {children}
  </a>
);

function PlaceholderNote() {
  const t = useT();
  return OPERATOR.placeholder ? <p className="notice">{t('legal.placeholder')}</p> : null;
}

function Address() {
  const lang = useLang();
  return (
    <address className="legal-address">
      {OPERATOR.name}
      <br />
      {OPERATOR.street}
      <br />
      {OPERATOR.city}
      <br />
      {OPERATOR.country[lang]}
      <br />
      <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
    </address>
  );
}

const DISCLAIMER = {
  de: 'Sylareads ist ein unabhängiges Fanprojekt und steht in keiner Verbindung zur GeoGuessr AB; es wird von ihr weder unterstützt noch geprüft. GeoGuessr ist eine Marke der GeoGuessr AB.',
  en: 'Sylareads is an independent fan project and is not affiliated with or endorsed by GeoGuessr AB. GeoGuessr is a trademark of GeoGuessr AB.',
};

// ---------------------------------------------------------------- About

export function AboutPage() {
  const t = useT();
  const lang = useLang();
  return (
    <LegalShell title={t('legal.about')}>
      {lang === 'de' ? (
        <>
          <p className="legal-lead">Sylareads bringt dir bei, Schilder in fremden Schriften schnell zu lesen und zu erkennen – für GeoGuessr und fürs Reisen.</p>
          <p>Du lernst Buchstaben, Ortsnamen, Regionen und Erkennungszeichen von Kyrillisch bis Bengali, übst sie mit Wiederholung im richtigen Abstand, auf Zeit und auf der Karte. Alles läuft in deinem Browser, auch ohne Netz, wenn du Sylareads als App installierst.</p>
          <h2>Kostenlos, ohne Werbung, ohne Tracking</h2>
          <p>Sylareads ist ein privates Hobbyprojekt. Es gibt keine Werbung, keine Statistik-Dienste und kein Konto-Zwang. Wer will, meldet sich mit Google an, um auf mehreren Geräten weiterzulernen. Details stehen in der <Link to="/privacy">Datenschutzerklärung</Link>.</p>
          <h2>Feedback</h2>
          <p>Fehler gefunden, ein Ortsname falsch, eine Idee? Schreib ein <Ext href={FEEDBACK_URL}>Issue auf GitHub</Ext> oder eine E-Mail an <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>. Der Code liegt öffentlich auf <Ext href={REPO_URL}>GitHub</Ext>.</p>
        </>
      ) : (
        <>
          <p className="legal-lead">Sylareads teaches you to read and recognise signs in foreign scripts quickly – for GeoGuessr and for travelling.</p>
          <p>You learn letters, place names, regions and tell-tale features from Cyrillic to Bengali, and practise them with spaced repetition, against the clock and on the map. Everything runs in your browser, even offline once you install Sylareads as an app.</p>
          <h2>Free, no ads, no tracking</h2>
          <p>Sylareads is a private hobby project. There are no ads, no analytics and no account required. If you like, sign in with Google to continue on several devices. Details are in the <Link to="/privacy">privacy policy</Link>.</p>
          <h2>Feedback</h2>
          <p>Found a bug, a wrong place name, have an idea? Open an <Ext href={FEEDBACK_URL}>issue on GitHub</Ext> or email <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>. The code is public on <Ext href={REPO_URL}>GitHub</Ext>.</p>
        </>
      )}
      <p className="legal-small">{DISCLAIMER[lang]}</p>
    </LegalShell>
  );
}

// ---------------------------------------------------------------- Impressum

export function ImpressumPage() {
  const t = useT();
  const lang = useLang();
  return (
    <LegalShell title={t('legal.impressum')}>
      <PlaceholderNote />
      <p>{lang === 'de' ? 'Angaben gemäß § 5 DDG und § 18 Abs. 1 MStV:' : 'Information according to § 5 DDG and § 18 (1) MStV (German law):'}</p>
      <Address />
      <p>{lang === 'de' ? 'Sylareads ist ein privates, nicht kommerzielles Angebot ohne Werbung.' : 'Sylareads is a private, non-commercial service without advertising.'}</p>
      <p className="legal-small">{DISCLAIMER[lang]}</p>
    </LegalShell>
  );
}

// ---------------------------------------------------------------- Privacy

export function PrivacyPage() {
  const t = useT();
  const lang = useLang();
  return (
    <LegalShell title={t('legal.privacy')}>
      <PlaceholderNote />
      {lang === 'de' ? <PrivacyDe /> : <PrivacyEn />}
      <p className="legal-small">{lang === 'de' ? `Stand: ${LEGAL_AS_OF.de}` : `Last updated: ${LEGAL_AS_OF.en}`}</p>
    </LegalShell>
  );
}

function PrivacyDe() {
  return (
    <>
      <p className="legal-lead">Kurz gesagt: Sylareads funktioniert ohne Konto, ohne Cookies, ohne Tracking und ohne Werbung. Dein Lernstand bleibt in deinem Browser. Nur wenn du dich freiwillig mit Google anmeldest, wird er online gespeichert.</p>

      <h2>Verantwortlich</h2>
      <Address />

      <h2>Aufruf der Seite (GitHub Pages)</h2>
      <p>Sylareads liegt bei GitHub Pages (GitHub, Inc., USA). Beim Aufruf verarbeitet GitHub technisch nötige Daten wie deine IP-Adresse, um die Seite auszuliefern und vor Angriffen zu schützen (Art. 6 Abs. 1 lit. f DSGVO). Ich bekomme diese Daten nicht zu sehen. Mehr in der <Ext href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement">Datenschutzerklärung von GitHub</Ext>.</p>

      <h2>Speicher in deinem Browser</h2>
      <p>Fortschritt, Einstellungen und die Namen für Duelle speichert Sylareads im Speicher deines Browsers (localStorage). Damit die App offline läuft, legt der Browser die Programmdateien in einen eigenen Speicher (Service Worker). Diese Daten verlassen dein Gerät nicht und sind für die Funktion nötig, die du nutzt (§ 25 Abs. 2 Nr. 2 TDDDG). Du kannst sie jederzeit im Profil zurücksetzen oder über die Browser-Einstellungen löschen.</p>

      <h2>Online speichern mit Google (freiwillig)</h2>
      <p>Wenn du dich anmeldest, nutzt Sylareads Firebase von Google:</p>
      <ul>
        <li><strong>Firebase Authentication</strong> für die Google-Anmeldung: Konto-ID, Name, E-Mail-Adresse, IP-Adresse und Gerätedaten. Firebase Authentication läuft in Rechenzentren in den USA.</li>
        <li><strong>Cloud Firestore</strong> für deinen Lernstand (ein Dokument mit Fortschritt und Zeitpunkt der letzten Speicherung), gespeichert in der EU.</li>
      </ul>
      <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO: Du möchtest deinen Fortschritt auf mehreren Geräten nutzen. Google verarbeitet die Daten als Auftragsverarbeiter nach den <Ext href="https://firebase.google.com/terms/data-processing-terms">Firebase-Datenverarbeitungsbedingungen</Ext>. Für Übermittlungen in die USA ist Google nach dem EU-US Data Privacy Framework zertifiziert, zusätzlich gelten Standardvertragsklauseln (<Ext href="https://firebase.google.com/support/privacy">Firebase und Datenschutz</Ext>).</p>
      <p>Die Daten bleiben gespeichert, bis du im Profil „Konto und Online-Daten löschen“ wählst. Google löscht Protokolldaten nach einigen Wochen.</p>

      <h2>„Wer ist da“ (freiwillig, mit Einwilligung)</h2>
      <p>Nur wenn du deine Karte einschaltest (ab 16 Jahren), sehen andere angemeldete Spieler deinen selbst gewählten Anzeigenamen, deinen aktuellen Kurs, deinen Fortschritt je Kurs, Streak, Level, dein letztes Daily-Challenge-Ergebnis und wann du zuletzt da warst. Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Du kannst sie jederzeit widerrufen, indem du die Karte ausschaltest; sie wird dann sofort gelöscht.</p>

      <h2>Duell-Links und Daily Challenge</h2>
      <p>Bei einem Duell stehen der Name, den du eingibst, und dein Ergebnis im Link selbst. Nur wer den Link von dir bekommt, sieht sie; auf keinem Server wird etwas gespeichert. Daily-Challenge-Ergebnisse bleiben in deinem Browser und erscheinen nur auf deiner Karte, wenn du sie zeigst.</p>

      <h2>Feedback</h2>
      <p>Issues auf GitHub sind öffentlich und brauchen ein GitHub-Konto; es gilt die Datenschutzerklärung von GitHub. E-Mails nutze ich nur, um zu antworten.</p>

      <h2>Deine Rechte</h2>
      <p>Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO) sowie darauf, eine Einwilligung jederzeit zu widerrufen (Art. 7 Abs. 3). Vieles geht direkt im Profil: Export als Datei, Zurücksetzen, Karte ausschalten, Konto löschen. Für alles andere schreib an die Adresse oben. Du kannst dich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO).</p>
    </>
  );
}

function PrivacyEn() {
  return (
    <>
      <p className="legal-lead">In short: Sylareads works without an account, without cookies, without tracking and without ads. Your progress stays in your browser. Only if you choose to sign in with Google is it saved online.</p>

      <h2>Controller</h2>
      <Address />

      <h2>Visiting the site (GitHub Pages)</h2>
      <p>Sylareads is hosted on GitHub Pages (GitHub, Inc., USA). When you visit, GitHub processes technically necessary data such as your IP address to deliver the site and protect it from attacks (Art. 6(1)(f) GDPR). I don’t get to see this data. More in <Ext href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub’s privacy statement</Ext>.</p>

      <h2>Storage in your browser</h2>
      <p>Sylareads keeps your progress, settings and duel names in your browser’s storage (localStorage). So the app works offline, the browser keeps the program files in a separate store (service worker). This data stays on your device and is needed for the feature you use (§ 25(2) no. 2 TDDDG). You can reset it in your profile or delete it in your browser settings at any time.</p>

      <h2>Saving online with Google (optional)</h2>
      <p>If you sign in, Sylareads uses Google Firebase:</p>
      <ul>
        <li><strong>Firebase Authentication</strong> for Google sign-in: account ID, name, email address, IP address and device data. Firebase Authentication runs in data centres in the USA.</li>
        <li><strong>Cloud Firestore</strong> for your progress (one document with your progress and the time of the last save), stored in the EU.</li>
      </ul>
      <p>The legal basis is Art. 6(1)(b) GDPR: you want to use your progress on several devices. Google processes the data as a processor under the <Ext href="https://firebase.google.com/terms/data-processing-terms">Firebase Data Processing and Security Terms</Ext>. For transfers to the USA, Google is certified under the EU-US Data Privacy Framework; standard contractual clauses apply as well (<Ext href="https://firebase.google.com/support/privacy">Privacy and Security in Firebase</Ext>).</p>
      <p>The data is kept until you choose “Delete account and online data” in your profile. Google deletes log data after a few weeks.</p>

      <h2>“Who’s here” (optional, with consent)</h2>
      <p>Only if you turn on your card (16 or older) do other signed-in players see your chosen display name, your current course, your progress per course, streak, level, your latest Daily Challenge result and when you were last here. The legal basis is your consent (Art. 6(1)(a) GDPR). You can withdraw it at any time by turning the card off; it is then deleted right away.</p>

      <h2>Duel links and Daily Challenge</h2>
      <p>In a duel, the name you enter and your result are part of the link itself. Only people you send the link to can see them; nothing is stored on a server. Daily Challenge results stay in your browser and only appear on your card if you show it.</p>

      <h2>Feedback</h2>
      <p>GitHub issues are public and need a GitHub account; GitHub’s privacy statement applies. I use emails only to reply.</p>

      <h2>Your rights</h2>
      <p>You have the right of access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction (Art. 18), data portability (Art. 20) and to object (Art. 21 GDPR), and you can withdraw consent at any time (Art. 7(3)). Much of this works directly in your profile: export as a file, reset, turn your card off, delete your account. For anything else, write to the address above. You can also lodge a complaint with a data protection supervisory authority (Art. 77 GDPR).</p>
    </>
  );
}

// ---------------------------------------------------------------- Credits

export function CreditsPage() {
  const t = useT();
  const lang = useLang();
  const de = lang === 'de';
  const rows: { what: string; who: ReactNode; licence: ReactNode }[] = [
    {
      what: de ? 'Grenzen von Regionen und Distrikten' : 'Region and district boundaries',
      who: <Ext href="https://www.geoboundaries.org">geoBoundaries</Ext>,
      licence: <Ext href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</Ext>,
    },
    {
      what: de ? 'Koordinaten der Städte' : 'City coordinates',
      who: <Ext href="https://www.geonames.org">GeoNames</Ext>,
      licence: <Ext href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</Ext>,
    },
    {
      what: de ? 'Lage der Regionen' : 'Region label points',
      who: <Ext href="https://www.naturalearthdata.com">Natural Earth</Ext>,
      licence: de ? 'gemeinfrei' : 'public domain',
    },
    {
      what: de ? 'Schrift der Oberfläche' : 'Interface font',
      who: <Ext href="https://rsms.me/inter/">Inter</Ext>,
      licence: <a href="./licenses/inter-OFL.txt">SIL OFL 1.1</a>,
    },
    {
      what: de ? 'Schriften für Bengali, Thai und „Schriften erkennen“' : 'Fonts for Bengali, Thai and “Recognise Scripts”',
      who: <Ext href="https://fonts.google.com/noto">Noto</Ext>,
      licence: <a href="./licenses/noto-OFL.txt">SIL OFL 1.1</a>,
    },
    {
      what: de ? 'Programmbibliotheken' : 'Libraries',
      who: 'React, React Router, Zustand, Vite',
      licence: 'MIT',
    },
    {
      what: de ? 'Online-Speicherung' : 'Online saving',
      who: 'Firebase JavaScript SDK',
      licence: 'Apache 2.0',
    },
  ];
  return (
    <LegalShell title={t('legal.credits')}>
      <p className="legal-lead">
        {de
          ? 'Ortsnamen, Umschriften, Erkennungszeichen, Schilder und Texte sind selbst erstellt. Diese Daten und Werkzeuge stecken außerdem in Sylareads:'
          : 'Place names, transliterations, tell-tale features, signs and texts are our own. Sylareads also builds on these data and tools:'}
      </p>
      <div className="legal-table-wrap">
        <table className="legal-table">
          <thead>
            <tr>
              <th>{de ? 'Was' : 'What'}</th>
              <th>{de ? 'Quelle' : 'Source'}</th>
              <th>{de ? 'Lizenz' : 'Licence'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.what}>
                <td>{r.what}</td>
                <td>{r.who}</td>
                <td>{r.licence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="legal-small">
        {de
          ? 'Grenzen: Runfola, D. et al. (2020) geoBoundaries: A global database of political administrative boundaries. PLoS ONE 15(4): e0231866. Vereinfacht und umprojiziert.'
          : 'Boundaries: Runfola, D. et al. (2020) geoBoundaries: A global database of political administrative boundaries. PLoS ONE 15(4): e0231866. Simplified and reprojected.'}
      </p>
      <p className="legal-small">{DISCLAIMER[lang]}</p>
    </LegalShell>
  );
}

// ---------------------------------------------------------------- Footer

/** Links to the legal pages and the GeoGuessr note, at the bottom of every page with a top bar. */
export function SiteFooter() {
  const t = useT();
  return (
    <footer className="site-footer">
      <nav aria-label={t('legal.footer')}>
        <Link to="/about">{t('legal.about')}</Link>
        <Link to="/privacy">{t('legal.privacy')}</Link>
        <Link to="/impressum">{t('legal.impressum')}</Link>
        <Link to="/credits">{t('legal.credits')}</Link>
        <a href={FEEDBACK_URL} target="_blank" rel="noreferrer">
          {t('legal.feedback')}
        </a>
      </nav>
      <p>{t('legal.notAffiliated')}</p>
    </footer>
  );
}
