import React, { useState } from 'react';
import {
  Download,
  Trash2,
  Plus,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Database,
  RotateCcw,
  Edit3,
} from 'lucide-react';
import type {
  AdminRole,
  AdminUser,
  AuditLogEntry,
  BackupSnapshotInfo,
  ChatbotConfig,
  ChatSessionRecord,
  KbDocument,
  LeadRecord,
  RedirectRule,
  SeoConfig,
} from '../types/concam';

export interface AnalyticsOverview {
  pageviews: number;
  whatsappClicks: number;
  mediaOutbound: number;
  chatbotOpens: number;
  leadsTotal: number;
  chatSessionsTotal: number;
  chatConverted: number;
  chatSatisfactionAvg: number | null;
  topPages: Array<{ path: string; views: number }>;
  trafficSources: Array<{ source: string; visits: number }>;
  coreWebVitals: { lcpMs: number; inpMs: number; cls: number };
}

// Shared wrapper: never report success when the server rejected the mutation.
// A 401 reloads the dashboard so an expired session returns to the login screen.
async function adminApiFetch(input: RequestInfo, init?: RequestInit): Promise<{ ok: boolean; json: any }> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    return { ok: false, json: { error: 'Connexion au serveur impossible.' } };
  }
  if (res.status === 401) {
    window.location.reload();
    return { ok: false, json: { error: 'Session expirée.' } };
  }
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = {};
  }
  return { ok: res.ok, json };
}

export function ProspectsModule({
  leads,
  role,
  onRefresh,
  notify,
}: {
  leads: LeadRecord[];
  role: AdminRole;
  onRefresh: () => Promise<void>;
  notify: (msg: string) => void;
}) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualOrg, setManualOrg] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualService, setManualService] = useState('');
  const [manualMsg, setManualMsg] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  const filtered = leads.filter((l) => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.organization.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = async (id: string, status: LeadRecord['status']) => {
    const { ok, json } = await adminApiFetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!ok) {
      notify(json.error || 'Échec de la mise à jour du statut.');
      return;
    }
    await onRefresh();
    notify('Statut du prospect mis à jour.');
  };

  const handleSaveNote = async (id: string) => {
    const { ok, json } = await adminApiFetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: noteDraft }),
    });
    if (!ok) {
      notify(json.error || 'Échec de l’enregistrement de la note.');
      return;
    }
    setEditingNoteId(null);
    await onRefresh();
    notify('Note interne enregistrée.');
  };

  const handleDelete = async (id: string) => {
    const { ok, json } = await adminApiFetch(`/api/admin/leads/${id}`, { method: 'DELETE' });
    if (!ok) {
      notify(json.error || 'Échec de la suppression du prospect.');
      return;
    }
    await onRefresh();
    notify('Prospect supprimé (RGPD).');
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, json } = await adminApiFetch('/api/admin/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: manualName,
        organization: manualOrg,
        email: manualEmail,
        phone: manualPhone,
        serviceSlug: manualService,
        message: manualMsg,
        notes: manualNotes,
      }),
    });
    if (!ok) {
      notify(json.error || 'Erreur lors de la création.');
      return;
    }
    setManualName('');
    setManualOrg('');
    setManualEmail('');
    setManualPhone('');
    setManualService('');
    setManualMsg('');
    setManualNotes('');
    setShowAddForm(false);
    await onRefresh();
    notify('Prospect ajouté manuellement.');
  };

  const handlePurgeExpired = async () => {
    const res = await fetch('/api/admin/leads/purge-expired', { method: 'POST' });
    const json = await res.json();
    if (res.ok) {
      await onRefresh();
      notify(`Purge RGPD effectuée : ${json.purged ?? 0} prospect(s) expiré(s) supprimé(s).`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0F0C0C]">Prospects & Leads</h2>
          <p className="text-xs text-[#0F0C0C]/65">
            Collectés via formulaires, pop-ups et Conseiller CONCAM · Conservation RGPD 12 mois
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#A30013] hover:bg-[#861213] text-white rounded-[6px] whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un prospect manuellement</span>
          </button>
          {role === 'admin' && (
            <button
              type="button"
              onClick={handlePurgeExpired}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-[#E1DFDE] bg-white hover:border-[#A30013] text-[#0F0C0C] rounded-[6px] whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#A30013]" />
              <span>Purger expirés RGPD</span>
            </button>
          )}
          <a
            href="/api/admin/leads/export"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#0F0C0C] hover:bg-[#A30013] text-white rounded-[6px] whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Exporter en tableur (CSV)</span>
          </a>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateManual} className="bg-white border border-[#E1DFDE] rounded-[6px] p-5 space-y-3 text-xs">
          <h3 className="font-serif text-base font-bold">Nouveau prospect (saisie directe / téléphone / salon)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Nom complet *"
              className="px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
            />
            <input
              type="email"
              required
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="Courriel *"
              className="px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
            />
            <input
              type="text"
              value={manualPhone}
              onChange={(e) => setManualPhone(e.target.value)}
              placeholder="Téléphone"
              className="px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono"
            />
            <input
              type="text"
              value={manualOrg}
              onChange={(e) => setManualOrg(e.target.value)}
              placeholder="Institution / Entreprise"
              className="px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
            />
            <input
              type="text"
              value={manualService}
              onChange={(e) => setManualService(e.target.value)}
              placeholder="Service concerné (ex: impression-edition)"
              className="px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
            />
            <input
              type="text"
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="Note interne"
              className="px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
            />
          </div>
          <textarea
            rows={2}
            value={manualMsg}
            onChange={(e) => setManualMsg(e.target.value)}
            placeholder="Besoin exprimé / objet de la demande"
            className="w-full p-2.5 border border-[#E1DFDE] rounded-[6px]"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-[#A30013] text-white font-semibold rounded-[6px] cursor-pointer">
              Enregistrer le prospect
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-[#E1DFDE] rounded-[6px] cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, organisation, courriel..."
          className="px-3 py-2 text-sm border border-[#E1DFDE] bg-white rounded-[6px] w-full sm:w-72"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-[#E1DFDE] bg-white rounded-[6px]"
        >
          <option value="all">Tous les statuts ({leads.length})</option>
          <option value="nouveau">Nouveau</option>
          <option value="en_cours">En cours</option>
          <option value="qualifie">Qualifié</option>
          <option value="devis_envoye">Devis envoyé</option>
          <option value="cloture">Clôturé</option>
        </select>
      </div>

      <div className="bg-white border border-[#E1DFDE] rounded-[6px] overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F5F3F3] border-b border-[#E1DFDE] text-[#0F0C0C]/75">
            <tr>
              <th className="py-3 px-4 font-semibold">Date</th>
              <th className="py-3 px-4 font-semibold">Prospect</th>
              <th className="py-3 px-4 font-semibold">Source & Service</th>
              <th className="py-3 px-4 font-semibold">Message & Notes</th>
              <th className="py-3 px-4 font-semibold">Statut</th>
              {role === 'admin' && <th className="py-3 px-4 font-semibold text-right">RGPD</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E1DFDE]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#0F0C0C]/60">
                  Aucun prospect ne correspond aux filtres sélectionnés.
                </td>
              </tr>
            ) : (
              filtered.map((l) => (
                <tr key={l.id} className="hover:bg-[#F5F3F3]/60 align-top">
                  <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap text-[#0F0C0C]/70">
                    {l.createdAt.slice(0, 10)}
                  </td>
                  <td className="py-3 px-4 space-y-0.5">
                    <p className="font-semibold text-[#0F0C0C]">{l.name}</p>
                    {l.organization && <p className="text-[#0F0C0C]/70">{l.organization}</p>}
                    <p className="text-[#A30013]">{l.email}</p>
                    {l.phone && <p className="font-mono tabular-nums">{l.phone}</p>}
                  </td>
                  <td className="py-3 px-4 space-y-1">
                    <p className="font-medium">{l.source}</p>
                    {l.serviceSlug && <p className="text-[#0F0C0C]/65">{l.serviceSlug}</p>}
                    <p className="text-[11px] text-[#0F0C0C]/55">
                      Opt-in : {l.doubleOptInConfirmed ? 'Confirmé' : 'En attente'}
                    </p>
                  </td>
                  <td className="py-3 px-4 max-w-xs space-y-2">
                    <p className="text-[#0F0C0C]/80">{l.message}</p>
                    {editingNoteId === l.id ? (
                      <div className="space-y-1.5">
                        <textarea
                          rows={2}
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          className="w-full p-2 border border-[#E1DFDE] rounded-[6px] text-xs"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveNote(l.id)}
                            className="px-2.5 py-1 bg-[#A30013] text-white rounded-[6px] cursor-pointer"
                          >
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="px-2.5 py-1 border border-[#E1DFDE] rounded-[6px] cursor-pointer"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-[#0F0C0C]/65">
                        {l.notes && <p className="italic mb-1">Note : {l.notes}</p>}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(l.id);
                            setNoteDraft(l.notes);
                          }}
                          className="text-[#A30013] hover:underline cursor-pointer"
                        >
                          {l.notes ? 'Modifier la note' : 'Ajouter une note'}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={l.status}
                      onChange={(e) => handleStatusChange(l.id, e.target.value as LeadRecord['status'])}
                      className="px-2 py-1 border border-[#E1DFDE] rounded-[6px] bg-white text-xs"
                    >
                      <option value="nouveau">Nouveau</option>
                      <option value="en_cours">En cours</option>
                      <option value="qualifie">Qualifié</option>
                      <option value="devis_envoye">Devis envoyé</option>
                      <option value="cloture">Clôturé</option>
                    </select>
                  </td>
                  {role === 'admin' && (
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(l.id)}
                        title="Supprimer (droit à l'oubli RGPD)"
                        className="p-1.5 text-[#0F0C0C]/55 hover:text-[#E40014] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ChatbotModule({
  config,
  kbDocuments,
  chatSessions,
  role,
  onRefresh,
  notify,
}: {
  config: ChatbotConfig;
  kbDocuments: KbDocument[];
  chatSessions: ChatSessionRecord[];
  role: AdminRole;
  onRefresh: () => Promise<void>;
  notify: (msg: string) => void;
}) {
  const [cfg, setCfg] = useState(config);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editDocTitle, setEditDocTitle] = useState('');
  const [editDocContent, setEditDocContent] = useState('');
  const [selectedSession, setSelectedSession] = useState<ChatSessionRecord | null>(chatSessions[0] || null);

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, json } = await adminApiFetch('/api/admin/chatbot/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    if (!ok) {
      notify(json.error || 'Échec de l’enregistrement des réglages du Conseiller.');
      return;
    }
    await onRefresh();
    notify('Réglages du Conseiller CONCAM enregistrés.');
  };

  const addKbDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) return;
    const { ok, json } = await adminApiFetch('/api/admin/chatbot/kb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: docTitle,
        category: 'commercial_playbook',
        content: docContent,
        active: true,
      }),
    });
    if (!ok) {
      notify(json.error || 'Échec de l’ajout du document RAG.');
      return;
    }
    setDocTitle('');
    setDocContent('');
    await onRefresh();
    notify('Document ajouté à la base RAG du chatbot.');
  };

  const saveEditedKbDoc = async (doc: KbDocument) => {
    if (!editDocTitle.trim() || !editDocContent.trim()) return;
    const { ok, json } = await adminApiFetch('/api/admin/chatbot/kb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: doc.id,
        title: editDocTitle,
        category: doc.category,
        content: editDocContent,
        active: doc.active,
      }),
    });
    if (!ok) {
      notify(json.error || 'Échec de la mise à jour du document RAG.');
      return;
    }
    setEditingDocId(null);
    await onRefresh();
    notify('Document RAG mis à jour.');
  };

  const toggleKbDocActive = async (doc: KbDocument) => {
    const { ok, json } = await adminApiFetch('/api/admin/chatbot/kb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: doc.id,
        title: doc.title,
        category: doc.category,
        content: doc.content,
        active: !doc.active,
      }),
    });
    if (!ok) {
      notify(json.error || 'Échec du changement d’état du document RAG.');
      return;
    }
    await onRefresh();
    notify(doc.active ? 'Document RAG désactivé.' : 'Document RAG réactivé.');
  };

  const deleteDoc = async (id: string) => {
    const { ok, json } = await adminApiFetch(`/api/admin/chatbot/kb/${id}`, { method: 'DELETE' });
    if (!ok) {
      notify(json.error || 'Échec de la suppression du document RAG.');
      return;
    }
    await onRefresh();
    notify('Document RAG supprimé.');
  };

  const deleteSession = async (id: string) => {
    const { ok, json } = await adminApiFetch(`/api/admin/chat-sessions/${id}`, { method: 'DELETE' });
    if (!ok) {
      notify(json.error || 'Échec de la suppression de la conversation.');
      return;
    }
    if (selectedSession?.id === id) setSelectedSession(null);
    await onRefresh();
    notify('Conversation supprimée du journal.');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-bold text-[#0F0C0C]">Chatbot IA & Base de connaissances RAG</h2>
        <p className="text-xs text-[#0F0C0C]/65">
          Les pages publiées (services, galerie, contacts) sont réindexées automatiquement à chaque modification.
        </p>
      </div>

      {role === 'admin' && (
        <form onSubmit={saveConfig} className="bg-white border border-[#E1DFDE] rounded-[6px] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold">Paramètres comportementaux, escalade & mode vocal</h3>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={cfg.voiceEnabled}
                onChange={(e) => setCfg({ ...cfg, voiceEnabled: e.target.checked })}
                className="accent-[#A30013]"
              />
              <span>Mode vocal conversationnel actif</span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Accueil FR</label>
              <textarea
                rows={2}
                value={cfg.welcomeFr}
                onChange={(e) => setCfg({ ...cfg, welcomeFr: e.target.value })}
                className="w-full p-2.5 text-xs border border-[#E1DFDE] rounded-[6px]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Accueil EN</label>
              <textarea
                rows={2}
                value={cfg.welcomeEn}
                onChange={(e) => setCfg({ ...cfg, welcomeEn: e.target.value })}
                className="w-full p-2.5 text-xs border border-[#E1DFDE] rounded-[6px]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Directives de ton FR</label>
              <textarea
                rows={2}
                value={cfg.toneFr}
                onChange={(e) => setCfg({ ...cfg, toneFr: e.target.value })}
                className="w-full p-2.5 text-xs border border-[#E1DFDE] rounded-[6px]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Directives de ton EN</label>
              <textarea
                rows={2}
                value={cfg.toneEn}
                onChange={(e) => setCfg({ ...cfg, toneEn: e.target.value })}
                className="w-full p-2.5 text-xs border border-[#E1DFDE] rounded-[6px]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Courriel d’escalade humaine</label>
              <input
                type="email"
                value={cfg.escalationEmail}
                onChange={(e) => setCfg({ ...cfg, escalationEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#E1DFDE] rounded-[6px]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Numéro WhatsApp d’escalade humaine</label>
              <input
                type="text"
                value={cfg.escalationWhatsapp}
                onChange={(e) => setCfg({ ...cfg, escalationWhatsapp: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#E1DFDE] rounded-[6px] font-mono"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold bg-[#A30013] hover:bg-[#861213] text-white rounded-[6px] cursor-pointer"
          >
            Enregistrer les réglages
          </button>
        </form>
      )}

      {/* RAG Knowledge Base */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-[#E1DFDE] rounded-[6px] p-5 space-y-4">
          <h3 className="font-serif text-lg font-bold">Ajouter un argumentaire / fiche RAG</h3>
          <form onSubmit={addKbDoc} className="space-y-3">
            <input
              type="text"
              required
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Titre (ex: Grille délais impression grands formats)"
              className="w-full px-3 py-2 text-xs border border-[#E1DFDE] rounded-[6px]"
            />
            <textarea
              rows={5}
              required
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Contenu vérifié utilisable par Conseiller CONCAM..."
              className="w-full px-3 py-2 text-xs border border-[#E1DFDE] rounded-[6px]"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#0F0C0C] hover:bg-[#A30013] text-white rounded-[6px] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter à l’index RAG</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E1DFDE] rounded-[6px] p-5 space-y-3">
          <h3 className="font-serif text-lg font-bold">Documents indexés ({kbDocuments.length})</h3>
          <div className="max-h-80 overflow-y-auto divide-y divide-[#E1DFDE]">
            {kbDocuments.map((d) => (
              <div key={d.id} className="py-3 space-y-2">
                {editingDocId === d.id ? (
                  <div className="space-y-2 bg-[#F5F3F3] p-3 rounded-[6px] text-xs">
                    <input
                      type="text"
                      value={editDocTitle}
                      onChange={(e) => setEditDocTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                    />
                    <textarea
                      rows={3}
                      value={editDocContent}
                      onChange={(e) => setEditDocContent(e.target.value)}
                      className="w-full p-2 bg-white border border-[#E1DFDE] rounded-[6px]"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveEditedKbDoc(d)}
                        className="px-3 py-1 bg-[#A30013] text-white rounded-[6px] cursor-pointer"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingDocId(null)}
                        className="px-3 py-1 bg-white border border-[#E1DFDE] rounded-[6px] cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <p className={`text-xs font-semibold ${d.active ? 'text-[#0F0C0C]' : 'text-[#0F0C0C]/45 line-through'}`}>
                        {d.title}
                      </p>
                      <p className="text-[11px] text-[#0F0C0C]/60">
                        {d.autoIndexed ? 'Auto-indexé depuis le site' : 'Document manuel'} · {d.category} ·{' '}
                        {d.active ? 'Actif' : 'Désactivé'}
                      </p>
                      <p className="text-xs text-[#0F0C0C]/75 line-clamp-2">{d.content}</p>
                    </div>
                    {!d.autoIndexed && (
                      <div className="flex items-center gap-1 shrink-0 text-[11px]">
                        <button
                          type="button"
                          onClick={() => toggleKbDocActive(d)}
                          className="px-2 py-1 border border-[#E1DFDE] rounded-[6px] hover:border-[#A30013] cursor-pointer"
                        >
                          {d.active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDocId(d.id);
                            setEditDocTitle(d.title);
                            setEditDocContent(d.content);
                          }}
                          title="Modifier"
                          className="p-1 text-[#0F0C0C]/60 hover:text-[#A30013] cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => deleteDoc(d.id)}
                            title="Supprimer"
                            className="p-1 text-[#0F0C0C]/50 hover:text-[#E40014] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logged Conversations */}
      <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-5 space-y-4">
        <h3 className="font-serif text-lg font-bold">Journal des conversations ({chatSessions.length})</h3>
        {chatSessions.length === 0 ? (
          <p className="text-xs text-[#0F0C0C]/60">Aucune conversation enregistrée pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 divide-y divide-[#E1DFDE] max-h-80 overflow-y-auto border border-[#E1DFDE] rounded-[6px]">
              {chatSessions.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-start justify-between gap-2 p-3 text-xs ${
                    selectedSession?.id === s.id ? 'bg-[#FFEDEA]' : 'hover:bg-[#F5F3F3]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedSession(s)}
                    className="flex-1 text-left space-y-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex justify-between font-mono tabular-nums text-[11px] text-[#0F0C0C]/60">
                      <span>{s.lang.toUpperCase()} · {s.outcome}</span>
                      <span>{s.updatedAt.slice(0, 10)}</span>
                    </div>
                    <p className="font-semibold text-[#0F0C0C] truncate">
                      {s.detectedNeed || s.summary || 'Échange en cours'}
                    </p>
                  </button>
                  {role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => deleteSession(s.id)}
                      title="Supprimer cette conversation"
                      className="p-1 text-[#0F0C0C]/45 hover:text-[#E40014] cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="lg:col-span-7 border border-[#E1DFDE] rounded-[6px] p-4 max-h-80 overflow-y-auto space-y-3 bg-[#F5F3F3]">
              {selectedSession ? (
                <>
                  <div className="text-xs bg-white border border-[#E1DFDE] p-3 rounded-[6px] space-y-1">
                    <p><strong>Pages visitées :</strong> {selectedSession.pagesVisited.join(' → ')}</p>
                    <p><strong>Besoin :</strong> {selectedSession.detectedNeed || 'Non précisé'}</p>
                    <p><strong>Point de douleur :</strong> {selectedSession.painPoint || 'Non précisé'}</p>
                    <p><strong>Service recommandé :</strong> {selectedSession.recommendedService || 'Aucun'}</p>
                    {selectedSession.satisfaction !== null && (
                      <p><strong>Note visiteur :</strong> {selectedSession.satisfaction} / 5</p>
                    )}
                  </div>
                  {(selectedSession.messages || []).map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-[6px] text-xs ${
                        m.role === 'user' ? 'bg-[#0F0C0C] text-white ml-8' : 'bg-white border border-[#E1DFDE] mr-8'
                      }`}
                    >
                      <span className="font-mono text-[10px] opacity-60 mr-1.5">[{m.mode}]</span>
                      {m.content}
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-xs text-[#0F0C0C]/60">Sélectionnez une session.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function StatisticsModule({ analytics }: { analytics: AnalyticsOverview }) {
  const cwv = analytics.coreWebVitals;
  const chatConversionPct =
    analytics.chatSessionsTotal > 0
      ? Math.round((analytics.chatConverted / analytics.chatSessionsTotal) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-[#0F0C0C]">Statistiques & Core Web Vitals</h2>
        <p className="text-xs text-[#0F0C0C]/65">
          Mesures d’audience, conversions (leads, WhatsApp, chatbot, sorties médias) et indicateurs de performance réels.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-5">
          <p className="text-xs text-[#0F0C0C]/65">Pages vues</p>
          <p className="font-mono text-3xl font-bold tabular-nums text-[#0F0C0C] mt-1">{analytics.pageviews}</p>
        </div>
        <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-5">
          <p className="text-xs text-[#0F0C0C]/65">Prospects collectés</p>
          <p className="font-mono text-3xl font-bold tabular-nums text-[#A30013] mt-1">{analytics.leadsTotal}</p>
        </div>
        <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-5">
          <p className="text-xs text-[#0F0C0C]/65">Clics WhatsApp</p>
          <p className="font-mono text-3xl font-bold tabular-nums text-[#0F0C0C] mt-1">{analytics.whatsappClicks}</p>
        </div>
        <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-5">
          <p className="text-xs text-[#0F0C0C]/65">Sorties vers médias du groupe</p>
          <p className="font-mono text-3xl font-bold tabular-nums text-[#0F0C0C] mt-1">{analytics.mediaOutbound}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-5">
          <p className="text-xs text-[#0F0C0C]/65">Ouvertures Conseiller IA</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-[#0F0C0C] mt-1">{analytics.chatbotOpens}</p>
        </div>
        <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-5">
          <p className="text-xs text-[#0F0C0C]/65">Conversion chatbot ({analytics.chatConverted}/{analytics.chatSessionsTotal})</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-[#A30013] mt-1">{chatConversionPct}%</p>
        </div>
        <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-5">
          <p className="text-xs text-[#0F0C0C]/65">Satisfaction moyenne chatbot</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-[#0F0C0C] mt-1">
            {analytics.chatSatisfactionAvg !== null ? `${analytics.chatSatisfactionAvg} / 5` : '—'}
          </p>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-6 space-y-4">
        <h3 className="font-serif text-lg font-bold">Core Web Vitals mesurés (Seuil « Bon » exigé)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border border-[#E1DFDE] rounded-[6px]">
            <p className="text-xs text-[#0F0C0C]/65">LCP (cible ≤ 2 500 ms)</p>
            <p className="font-mono text-2xl font-bold tabular-nums mt-1">{cwv.lcpMs} ms</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              {cwv.lcpMs <= 2500 ? 'Conforme (Bon)' : 'À optimiser'}
            </p>
          </div>
          <div className="p-4 border border-[#E1DFDE] rounded-[6px]">
            <p className="text-xs text-[#0F0C0C]/65">INP (cible ≤ 200 ms)</p>
            <p className="font-mono text-2xl font-bold tabular-nums mt-1">{cwv.inpMs} ms</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              {cwv.inpMs <= 200 ? 'Conforme (Bon)' : 'À optimiser'}
            </p>
          </div>
          <div className="p-4 border border-[#E1DFDE] rounded-[6px]">
            <p className="text-xs text-[#0F0C0C]/65">CLS (cible ≤ 0,1)</p>
            <p className="font-mono text-2xl font-bold tabular-nums mt-1">{cwv.cls}</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              {cwv.cls <= 0.1 ? 'Conforme (Bon)' : 'À optimiser'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-6 space-y-3">
          <h3 className="font-serif text-lg font-bold">Pages les plus consultées</h3>
          <table className="w-full text-xs">
            <thead className="border-b border-[#E1DFDE] text-left text-[#0F0C0C]/65">
              <tr>
                <th className="py-2">Chemin</th>
                <th className="py-2 text-right">Vues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1DFDE]">
              {analytics.topPages.map((row) => (
                <tr key={row.path}>
                  <td className="py-2 font-mono">{row.path}</td>
                  <td className="py-2 text-right font-mono tabular-nums font-semibold">{row.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-6 space-y-3">
          <h3 className="font-serif text-lg font-bold">Sources de trafic</h3>
          {(analytics.trafficSources || []).length === 0 ? (
            <p className="text-xs text-[#0F0C0C]/60">En attente de visites enregistrées.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="border-b border-[#E1DFDE] text-left text-[#0F0C0C]/65">
                <tr>
                  <th className="py-2">Source / Référent</th>
                  <th className="py-2 text-right">Sessions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1DFDE]">
                {analytics.trafficSources.map((src) => (
                  <tr key={src.source}>
                    <td className="py-2 font-mono">{src.source}</td>
                    <td className="py-2 text-right font-mono tabular-nums font-semibold">{src.visits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export function UsersAndAuditModule({
  users,
  auditLogs,
  backups,
  currentUser,
  onRefresh,
  onAuthRefresh,
  notify,
}: {
  users: AdminUser[];
  auditLogs: AuditLogEntry[];
  backups: BackupSnapshotInfo[];
  currentUser: { id: string; email: string; totpEnabled?: boolean };
  onRefresh: () => Promise<void>;
  onAuthRefresh: () => Promise<void>;
  notify: (msg: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<AdminRole>('editor');
  const [password, setPassword] = useState('');

  // Password change & 2FA states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [setup2fa, setSetup2fa] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [disable2faPassword, setDisable2faPassword] = useState('');

  // Backup restore confirmation
  const [confirmRestoreFile, setConfirmRestoreFile] = useState<string | null>(null);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role, password }),
    });
    const json = await res.json();
    if (!res.ok) {
      notify(json.error || 'Erreur');
      return;
    }
    setEmail('');
    setName('');
    setPassword('');
    await onRefresh();
    notify('Compte utilisateur créé.');
  };

  const toggleUser = async (u: AdminUser) => {
    const { ok, json } = await adminApiFetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: u.role, active: !u.active }),
    });
    if (!ok) {
      notify(json.error || 'Échec de la mise à jour du statut utilisateur.');
      return;
    }
    await onRefresh();
    notify('Statut utilisateur mis à jour.');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await res.json();
    if (!res.ok) {
      notify(json.error || 'Échec du changement de mot de passe.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    await onRefresh();
    notify('Votre mot de passe a été modifié.');
  };

  const start2faSetup = async () => {
    const res = await fetch('/api/admin/2fa/setup', { method: 'POST' });
    const json = await res.json();
    if (!res.ok) {
      notify(json.error || 'Impossible d’initialiser la 2FA.');
      return;
    }
    setSetup2fa({ secret: json.secret, qrDataUrl: json.qrDataUrl });
  };

  const enable2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/2fa/enable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: totpCode }),
    });
    const json = await res.json();
    if (!res.ok) {
      notify(json.error || 'Code 2FA invalide.');
      return;
    }
    setSetup2fa(null);
    setTotpCode('');
    await onAuthRefresh();
    await onRefresh();
    notify('Double authentification 2FA activée sur votre compte.');
  };

  const disable2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/2fa/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: disable2faPassword }),
    });
    const json = await res.json();
    if (!res.ok) {
      notify(json.error || 'Mot de passe requis.');
      return;
    }
    setDisable2faPassword('');
    await onAuthRefresh();
    await onRefresh();
    notify('Double authentification 2FA désactivée.');
  };

  const createBackupNow = async () => {
    const res = await fetch('/api/admin/backups', { method: 'POST' });
    const json = await res.json();
    if (res.ok) {
      await onRefresh();
      notify(`Sauvegarde SQLite créée : ${json.backup?.filename || ''}`);
    } else {
      notify(json.error || 'Erreur lors de la sauvegarde.');
    }
  };

  const restoreBackupNow = async (filename: string) => {
    const res = await fetch(`/api/admin/backups/${encodeURIComponent(filename)}/restore`, { method: 'POST' });
    const json = await res.json();
    setConfirmRestoreFile(null);
    if (!res.ok) {
      notify(json.error || 'Échec de la restauration.');
      return;
    }
    await onRefresh();
    notify(`Base restaurée depuis ${filename}. Filet de sécurité créé : ${json.preRestoreSnapshot}`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-bold text-[#0F0C0C]">Utilisateurs, Sécurité 2FA, Sauvegardes & Audit</h2>
        <p className="text-xs text-[#0F0C0C]/65">
          RBAC (Administrateur, Éditeur, Commercial), double authentification TOTP, sauvegardes SQLite quotidiennes et journal d’audit.
        </p>
      </div>

      {/* Password & 2FA Security for Current User */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleChangePassword} className="bg-white border border-[#E1DFDE] rounded-[6px] p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#A30013]" />
            <h3 className="font-serif text-lg font-bold">Changer votre mot de passe ({currentUser.email})</h3>
          </div>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Mot de passe actuel"
            className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
          />
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nouveau mot de passe (min. 8 caractères)"
            className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
          />
          <button
            type="submit"
            className="px-4 py-2 font-semibold bg-[#0F0C0C] hover:bg-[#A30013] text-white rounded-[6px] cursor-pointer"
          >
            Mettre à jour le mot de passe
          </button>
        </form>

        <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#A30013]" />
              <h3 className="font-serif text-lg font-bold">Double authentification (2FA TOTP)</h3>
            </div>
            <span className={`font-mono font-semibold ${currentUser.totpEnabled ? 'text-emerald-700' : 'text-[#0F0C0C]/55'}`}>
              {currentUser.totpEnabled ? 'Activée' : 'Inactive'}
            </span>
          </div>

          {currentUser.totpEnabled ? (
            <form onSubmit={disable2fa} className="space-y-2.5 pt-1">
              <p className="text-[#0F0C0C]/70">
                Votre compte est protégé par code TOTP (Google Authenticator, FreeOTP, 1Password).
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  required
                  value={disable2faPassword}
                  onChange={(e) => setDisable2faPassword(e.target.value)}
                  placeholder="Mot de passe actuel pour désactiver"
                  className="flex-1 px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 font-semibold border border-[#E1DFDE] hover:border-[#A30013] text-[#A30013] rounded-[6px] cursor-pointer"
                >
                  Désactiver 2FA
                </button>
              </div>
            </form>
          ) : setup2fa ? (
            <form onSubmit={enable2fa} className="space-y-3 pt-1">
              <div className="flex items-center gap-4">
                <img
                  src={setup2fa.qrDataUrl}
                  alt="QR Code 2FA CONCAM"
                  className="w-28 h-28 border border-[#E1DFDE] rounded-[6px] bg-white shrink-0"
                />
                <div className="space-y-1.5 min-w-0">
                  <p className="text-[#0F0C0C]/75">Scannez ce QR Code dans votre application TOTP ou saisissez la clé :</p>
                  <p className="font-mono text-[11px] bg-[#F5F3F3] px-2 py-1 rounded-[4px] break-all">{setup2fa.secret}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Code à 6 chiffres"
                  className="flex-1 px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono tabular-nums"
                />
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-[#A30013] text-white rounded-[6px] cursor-pointer"
                >
                  Confirmer 2FA
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 pt-1">
              <p className="text-[#0F0C0C]/70">
                Ajoutez une vérification par code TOTP à 6 chiffres à chaque connexion au tableau de bord.
              </p>
              <button
                type="button"
                onClick={start2faSetup}
                className="px-4 py-2 font-semibold bg-[#A30013] hover:bg-[#861213] text-white rounded-[6px] cursor-pointer"
              >
                Activer la 2FA
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Users RBAC */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form onSubmit={createUser} className="lg:col-span-4 bg-white border border-[#E1DFDE] rounded-[6px] p-5 space-y-3 h-fit">
          <h3 className="font-serif text-lg font-bold">Nouvel utilisateur</h3>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom complet"
            className="w-full px-3 py-2 text-xs border border-[#E1DFDE] rounded-[6px]"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="courriel@concam.gn"
            className="w-full px-3 py-2 text-xs border border-[#E1DFDE] rounded-[6px]"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="w-full px-3 py-2 text-xs border border-[#E1DFDE] rounded-[6px] bg-white"
          >
            <option value="admin">Administrateur (Accès complet)</option>
            <option value="editor">Éditeur (Contenus uniquement)</option>
            <option value="commercial">Commercial (Prospects & Chatbot)</option>
          </select>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe (min 8 caractères)"
            className="w-full px-3 py-2 text-xs border border-[#E1DFDE] rounded-[6px]"
          />
          <button
            type="submit"
            className="w-full py-2 text-xs font-semibold bg-[#A30013] text-white rounded-[6px] cursor-pointer"
          >
            Créer le compte
          </button>
        </form>

        <div className="lg:col-span-8 bg-white border border-[#E1DFDE] rounded-[6px] p-5 space-y-3">
          <h3 className="font-serif text-lg font-bold">Comptes actifs</h3>
          <table className="w-full text-xs">
            <thead className="border-b border-[#E1DFDE] text-left text-[#0F0C0C]/65">
              <tr>
                <th className="py-2">Nom</th>
                <th className="py-2">Courriel</th>
                <th className="py-2">Rôle</th>
                <th className="py-2">2FA</th>
                <th className="py-2 text-right">État</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1DFDE]">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-2.5 font-medium">{u.name}</td>
                  <td className="py-2.5 font-mono">{u.email}</td>
                  <td className="py-2.5">{u.role}</td>
                  <td className="py-2.5 font-mono">
                    <span className={u.totpEnabled ? 'text-emerald-700 font-semibold' : 'text-[#0F0C0C]/50'}>
                      {u.totpEnabled ? 'Activée' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleUser(u)}
                      className="text-[#A30013] hover:underline cursor-pointer"
                    >
                      {u.active ? 'Actif (désactiver)' : 'Inactif (activer)'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SQLite Backups & Restore */}
      <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-5 space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#A30013]" />
            <div>
              <h3 className="font-serif text-lg font-bold">Sauvegardes & Restauration SQLite</h3>
              <p className="text-[#0F0C0C]/65">
                Instantané automatique quotidien (rétention 14 jours) et restauration transactionnelle avec filet de sécurité.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={createBackupNow}
            className="inline-flex items-center gap-1.5 px-4 py-2 font-semibold bg-[#0F0C0C] hover:bg-[#A30013] text-white rounded-[6px] cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Créer une sauvegarde maintenant</span>
          </button>
        </div>

        {backups.length === 0 ? (
          <p className="text-[#0F0C0C]/60">Aucune archive enregistrée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-[#E1DFDE] text-[#0F0C0C]/65">
                <tr>
                  <th className="py-2">Archive</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Taille</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1DFDE]">
                {backups.map((b) => (
                  <tr key={b.filename}>
                    <td className="py-2 font-mono">{b.filename}</td>
                    <td className="py-2 font-mono tabular-nums text-[#0F0C0C]/70">
                      {b.createdAt.replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-2 font-mono tabular-nums">{Math.max(1, Math.round(b.sizeBytes / 1024))} Ko</td>
                    <td className="py-2 text-right space-x-3">
                      <a
                        href={`/api/admin/backups/${encodeURIComponent(b.filename)}`}
                        className="inline-flex items-center gap-1 text-[#0F0C0C] hover:text-[#A30013] font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger</span>
                      </a>
                      {confirmRestoreFile === b.filename ? (
                        <span className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => restoreBackupNow(b.filename)}
                            className="px-2.5 py-1 bg-[#A30013] text-white font-semibold rounded-[4px] cursor-pointer"
                          >
                            Confirmer restauration
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRestoreFile(null)}
                            className="px-2 py-1 border border-[#E1DFDE] rounded-[4px] cursor-pointer"
                          >
                            Annuler
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRestoreFile(b.filename)}
                          className="inline-flex items-center gap-1 text-[#A30013] hover:underline cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restaurer</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Log */}
      <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-serif text-lg font-bold">Journal d’audit</h3>
          <a
            href="/api/admin/audit/export"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[#E1DFDE] hover:border-[#A30013] rounded-[6px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </a>
        </div>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-[#E1DFDE] text-[#0F0C0C]/65">
              <tr>
                <th className="py-2">Horodatage</th>
                <th className="py-2">Auteur</th>
                <th className="py-2">Action</th>
                <th className="py-2">Champ / Entité</th>
                <th className="py-2">Détail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1DFDE]">
              {auditLogs.map((a) => (
                <tr key={a.id}>
                  <td className="py-2 font-mono tabular-nums text-[#0F0C0C]/65">
                    {a.createdAt.replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="py-2">{a.actorEmail} ({a.actorRole})</td>
                  <td className="py-2 font-mono">{a.action}</td>
                  <td className="py-2 font-mono">{a.entity}.{a.field}</td>
                  <td className="py-2">{a.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function SeoModule({
  seoConfigs,
  redirects,
  role,
  onRefresh,
  notify,
}: {
  seoConfigs: SeoConfig[];
  redirects: RedirectRule[];
  role: AdminRole;
  onRefresh: () => Promise<void>;
  notify: (msg: string) => void;
}) {
  const [selectedKey, setSelectedKey] = useState(seoConfigs[0]?.routeKey || 'home');
  const activeCfg = seoConfigs.find((s) => s.routeKey === selectedKey) || seoConfigs[0];
  const [draft, setDraft] = useState<SeoConfig>(activeCfg);

  const [fromPath, setFromPath] = useState('');
  const [toPath, setToPath] = useState('');

  const handleSelectRoute = (key: string) => {
    setSelectedKey(key);
    const found = seoConfigs.find((s) => s.routeKey === key);
    if (found) setDraft(found);
  };

  const saveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, json } = await adminApiFetch('/api/admin/seo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (!ok) {
      notify(json.error || 'Échec de l’enregistrement des métadonnées SEO.');
      return;
    }
    await onRefresh();
    notify('Métadonnées SEO enregistrées.');
  };

  const addRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, json } = await adminApiFetch('/api/admin/redirects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromPath, toPath, statusCode: 301 }),
    });
    if (!ok) {
      notify(json.error || 'Échec de l’ajout de la redirection.');
      return;
    }
    setFromPath('');
    setToPath('');
    await onRefresh();
    notify('Redirection 301 ajoutée.');
  };

  const removeRedirect = async (id: string) => {
    const { ok, json } = await adminApiFetch(`/api/admin/redirects/${id}`, { method: 'DELETE' });
    if (!ok) {
      notify(json.error || 'Échec de la suppression de la redirection.');
      return;
    }
    await onRefresh();
    notify('Redirection supprimée.');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0F0C0C]">Paramètres SEO & Redirections 301</h2>
          <p className="text-xs text-[#0F0C0C]/65">
            Titres, méta-descriptions FR/EN, mots-clés, sitemap.xml et robots.txt automatiques.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#A30013] hover:underline">
            <span>sitemap.xml</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a href="/robots.txt" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#A30013] hover:underline">
            <span>robots.txt</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {draft && (
        <form onSubmit={saveSeo} className="bg-white border border-[#E1DFDE] rounded-[6px] p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {seoConfigs.map((c) => (
              <button
                key={c.routeKey}
                type="button"
                onClick={() => handleSelectRoute(c.routeKey)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] border cursor-pointer ${
                  selectedKey === c.routeKey ? 'bg-[#A30013] text-white border-[#A30013]' : 'bg-[#F5F3F3] border-[#E1DFDE]'
                }`}
              >
                {c.routeKey}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Titre SEO (FR)</label>
              <input
                type="text"
                value={draft.titleFr}
                onChange={(e) => setDraft({ ...draft, titleFr: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#E1DFDE] rounded-[6px]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Titre SEO (EN)</label>
              <input
                type="text"
                value={draft.titleEn}
                onChange={(e) => setDraft({ ...draft, titleEn: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#E1DFDE] rounded-[6px]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Meta Description (FR)</label>
              <textarea
                rows={2}
                value={draft.descriptionFr}
                onChange={(e) => setDraft({ ...draft, descriptionFr: e.target.value })}
                className="w-full p-2.5 text-xs border border-[#E1DFDE] rounded-[6px]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Meta Description (EN)</label>
              <textarea
                rows={2}
                value={draft.descriptionEn}
                onChange={(e) => setDraft({ ...draft, descriptionEn: e.target.value })}
                className="w-full p-2.5 text-xs border border-[#E1DFDE] rounded-[6px]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Mots-clés cibles (FR)</label>
              <input
                type="text"
                value={draft.keywordsFr}
                onChange={(e) => setDraft({ ...draft, keywordsFr: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#E1DFDE] rounded-[6px]"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.noIndex}
                  onChange={(e) => setDraft({ ...draft, noIndex: e.target.checked })}
                />
                <span>Exclure de l’indexation (noindex)</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold bg-[#A30013] text-white rounded-[6px] cursor-pointer"
          >
            Enregistrer cette page SEO
          </button>
        </form>
      )}

      {role === 'admin' && (
        <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-6 space-y-4">
          <h3 className="font-serif text-lg font-bold">Redirections 301</h3>
          <form onSubmit={addRedirect} className="flex flex-wrap gap-3">
            <input
              type="text"
              required
              value={fromPath}
              onChange={(e) => setFromPath(e.target.value)}
              placeholder="/ancienne-url"
              className="px-3 py-2 text-xs border border-[#E1DFDE] rounded-[6px] flex-1 min-w-[180px]"
            />
            <input
              type="text"
              required
              value={toPath}
              onChange={(e) => setToPath(e.target.value)}
              placeholder="/nouvelle-url"
              className="px-3 py-2 text-xs border border-[#E1DFDE] rounded-[6px] flex-1 min-w-[180px]"
            />
            <button type="submit" className="px-4 py-2 text-xs font-semibold bg-[#0F0C0C] text-white rounded-[6px] cursor-pointer">
              Ajouter 301
            </button>
          </form>

          {redirects.length > 0 && (
            <div className="divide-y divide-[#E1DFDE] text-xs">
              {redirects.map((r) => (
                <div key={r.id} className="py-2 flex items-center justify-between">
                  <span className="font-mono">
                    {r.fromPath} → {r.toPath} ({r.statusCode})
                  </span>
                  <button type="button" onClick={() => removeRedirect(r.id)} className="text-[#E40014] cursor-pointer">
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
