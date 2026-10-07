import { useState } from 'react';
import { TopBar } from '../../ui/TopBar';
import { Button } from '../../ui/primitives';
import { Sign } from './Sign';

/** Design preview of all sign types (not linked from the app). */
export default function SignsPreview() {
  const [revealed, setRevealed] = useState(false);
  const items = [
    { label: 'Russland · Wegweiser Landstraße', node: <Sign kind="ru-direction" native="Новосибирск" km={245} arrow="right" /> },
    { label: 'Russland · Wegweiser Autobahn', node: <Sign kind="ru-motorway" native="Екатеринбург" km={512} arrow="up" /> },
    { label: 'Russland · Ortseingang', node: <Sign kind="ru-town" native="Ярославль" /> },
    { label: 'Russland · Ortsende', node: <Sign kind="ru-town-end" native="Ярославль" /> },
    { label: 'Griechenland · Wegweiser', node: <Sign kind="gr-direction" native="Θεσσαλονίκη" latin="Thessaloniki" km={78} revealed={revealed} /> },
    { label: 'Griechenland · Ortsschild', node: <Sign kind="gr-town" native="Λάρισα" latin="Larisa" revealed={revealed} /> },
    { label: 'Thailand · Wegweiser Highway', node: <Sign kind="th-direction" native="เชียงใหม่" latin="Chiang Mai" km={125} arrow="left" revealed={revealed} lang="th" /> },
    { label: 'Thailand · Kilometerstein', node: <Sign kind="th-kmstone" native="ลำปาง" road={11} km={512} sideKm={38} lang="th" /> },
    {
      label: 'Bangladesch · Ladenschild',
      node: (
        <Sign
          kind="bd-shop"
          native="সাতক্ষীরা"
          shop={{ name: 'মায়ের দোয়া স্টোর', offer: 'এখানে মুদি মালামাল পাওয়া যায়', owner: 'প্রোঃ মোঃ আব্দুল করিম', address: 'স্টেশন রোড, কালিগঞ্জ, সাতক্ষীরা', phone: 'মোবাঃ ০১৭০০-০০০০০০' }}
        />
      ),
    },
  ];
  return (
    <div className="app-shell">
      <TopBar />
      <main className="page signs-preview">
        <h1 className="page-title">Schildansicht · Vorschau</h1>
        <Button onClick={() => setRevealed((r) => !r)}>{revealed ? 'Lateinzeile verdecken' : 'Antwort aufdecken'}</Button>
        <div className="signs-preview-grid">
          {items.map((it) => (
            <section key={it.label} className="signs-preview-item">
              <h2 className="card-label">{it.label}</h2>
              <div className="signs-preview-stage">{it.node}</div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
