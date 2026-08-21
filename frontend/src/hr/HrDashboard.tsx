import { useEffect, useState } from 'react';
import type { Session } from '../shared/types';
import { FormBuilder } from './form-builder/FormBuilder';
import { getJobOffers } from './form-builder/api';
import type { JobOffer } from './form-builder/types';
import { EvaluatorsPanel } from './EvaluatorsPanel';

type View = 'home' | 'forms' | 'evaluators' | 'builder';

export function HrDashboard({ session, logout }: { session: Session; logout: () => void }) {
  const [view, setView] = useState<View>('home');
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [error, setError] = useState('');

  const loadOffers = () => {
    setLoadingOffers(true);
    getJobOffers(session.accessToken)
      .then(setOffers)
      .catch(() => setError('Impossible de charger les offres.'))
      .finally(() => setLoadingOffers(false));
  };

  useEffect(() => { loadOffers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (view === 'builder') {
    return <FormBuilder session={session} onExit={() => { setView('forms'); loadOffers(); }} />;
  }

  return <div className="shell">
    <aside>
      <div className="side-logo">BF<span>Recruit</span></div>
      <nav>
        <b>RH</b>
        <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>⌂ Tableau de bord</button>
        <button className={view === 'forms' ? 'active' : ''} onClick={() => setView('forms')}>▦ Formulaires</button>
        <button className={view === 'evaluators' ? 'active' : ''} onClick={() => setView('evaluators')}>◇ Évaluateurs</button>
      </nav>
      <div className="profile">
        <span>{session.firstName[0]}{session.lastName[0]}</span>
        <div><b>{session.firstName} {session.lastName}</b><small>Ressources Humaines</small></div>
        <button onClick={logout}>↗</button>
      </div>
    </aside>
    <main className="content">
      {error && <div className="alert">{error}</div>}

      {view === 'home' && <>
        <header>
          <div><small>TABLEAU DE BORD</small><h1>Bonjour {session.firstName}</h1><p>Gérez les formulaires de candidature et l'affectation des évaluateurs par offre.</p></div>
        </header>
        <section className="stats">
          <article><span>Offres actives</span><b>{offers.length}</b><i>Postes ouverts</i></article>
          <article><span>Formulaires liés</span><b>{offers.filter(o => o.formId).length}</b><i>Sur {offers.length} offres</i></article>
          <article><span>Sans formulaire</span><b>{offers.filter(o => !o.formId).length}</b><i>À configurer</i></article>
        </section>
        <section className="table-card" style={{ padding: 24, display: 'flex', gap: 12 }}>
          <button className="primary" onClick={() => setView('forms')}>▦ Gérer les formulaires</button>
          <button className="primary" onClick={() => setView('evaluators')}>◇ Affecter des évaluateurs</button>
        </section>
      </>}

      {view === 'forms' && <>
        <header>
          <div><small>FORMULAIRES</small><h1>Constructeur de formulaires</h1><p>Configurez le formulaire de candidature de chaque offre.</p></div>
          <button className="primary add" onClick={() => setView('builder')}>＋ Ouvrir le constructeur</button>
        </header>
        <section className="table-card">
          <div className="table">
            <div className="tr head"><span>Offre</span><span>Département</span><span>Formulaire</span><span>Actions</span></div>
            {loadingOffers ? <div className="loading">Chargement des offres…</div>
              : offers.length === 0 ? <div className="loading">Aucune offre pour le moment.</div>
              : offers.map(offer => <div className="tr" key={offer.id}>
                <span><b>{offer.title}</b></span>
                <span>{offer.department || '—'}</span>
                <span><em className={offer.formId ? 'active' : 'disabled'}>● {offer.formId ? 'configuré' : 'non configuré'}</em></span>
                <span className="actions">
                  <button onClick={() => setView('builder')}>Configurer le formulaire</button>
                </span>
              </div>)}
          </div>
        </section>
      </>}

      {view === 'evaluators' && <EvaluatorsPanel session={session} offers={offers} loadingOffers={loadingOffers} />}
    </main>
  </div>;
}