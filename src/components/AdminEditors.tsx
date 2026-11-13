import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Upload, Video, Image as ImageIcon } from 'lucide-react';
import type {
  AdminRole,
  BlogPost,
  HeaderPageKey,
  HeaderSlideItem,
  PageContent,
  ServiceItem,
} from '../types/concam';

const MAX_UPLOAD_BYTES = 35 * 1024 * 1024; // mirror of the server-side limit

export async function uploadMediaFile(file: File): Promise<{ url: string; mediaType: 'image' | 'video' }> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} Mo) — la limite est de 35 Mo.`,
    );
  }
  // Only ASCII-safe characters travel in the x-filename header.
  const safeName = file.name.replace(/[^\x20-\x7E]/g, '_');
  const res = await fetch('/api/admin/upload-media', {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'x-filename': safeName,
    },
    body: file,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Échec du téléversement.');
  }
  return { url: json.url as string, mediaType: json.mediaType as 'image' | 'video' };
}

function RichTextToolbar({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const appendSnippet = (snippet: string) => {
    const sep = value && !value.endsWith('\n') ? '\n' : '';
    onChange(`${value}${sep}${snippet}`);
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-1.5 text-[11px]">
      <span className="text-[#0F0C0C]/55 mr-1">Mise en forme :</span>
      <button
        type="button"
        onClick={() => appendSnippet('## Titre de section')}
        className="px-2 py-0.5 border border-[#E1DFDE] bg-[#F5F3F3] hover:border-[#A30013] rounded-[4px] cursor-pointer"
      >
        Sous-titre
      </button>
      <button
        type="button"
        onClick={() => appendSnippet('**Point clé à retenir**')}
        className="px-2 py-0.5 border border-[#E1DFDE] bg-[#F5F3F3] hover:border-[#A30013] rounded-[4px] font-semibold cursor-pointer"
      >
        Gras
      </button>
      <button
        type="button"
        onClick={() => appendSnippet('- Élément de liste')}
        className="px-2 py-0.5 border border-[#E1DFDE] bg-[#F5F3F3] hover:border-[#A30013] rounded-[4px] cursor-pointer"
      >
        Liste
      </button>
      <button
        type="button"
        onClick={() => appendSnippet('> Citation institutionnelle')}
        className="px-2 py-0.5 border border-[#E1DFDE] bg-[#F5F3F3] hover:border-[#A30013] rounded-[4px] italic cursor-pointer"
      >
        Citation
      </button>
    </div>
  );
}

export function ServiceFullEditor({
  service,
  role,
  onChange,
  onSave,
  onDelete,
  notify,
}: {
  service: ServiceItem;
  role: AdminRole;
  onChange: (next: ServiceItem) => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  notify: (msg: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const up = await uploadMediaFile(file);
      onChange({ ...service, imageUrl: up.url });
      notify('Visuel téléversé.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur téléversement');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={onSave} className="bg-white border border-[#E1DFDE] rounded-[6px] p-6 space-y-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E1DFDE]">
        <div>
          <h3 className="font-serif text-lg font-bold">Fiche complète : {service.titleFr || 'Nouveau service'}</h3>
          <p className="text-[#0F0C0C]/60 font-mono">/services/{service.slug}</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={service.published}
              onChange={(e) => onChange({ ...service, published: e.target.checked })}
            />
            <span>Publié en ligne</span>
          </label>
          {role === 'admin' && (
            <button
              type="button"
              onClick={() => onDelete(service.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#E1DFDE] hover:border-[#A30013] text-[#A30013] rounded-[6px] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer</span>
            </button>
          )}
        </div>
      </div>

      {/* Identity & Slugs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label className="block font-medium mb-1">Slug URL</label>
          <input
            type="text"
            required
            value={service.slug}
            onChange={(e) => onChange({ ...service, slug: e.target.value })}
            className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Ordre d’affichage</label>
          <input
            type="number"
            min={1}
            value={service.sortOrder}
            onChange={(e) => onChange({ ...service, sortOrder: Number(e.target.value) || 1 })}
            className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] tabular-nums"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Visuel (téléverser image)</label>
          <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E1DFDE] hover:border-[#A30013] rounded-[6px] cursor-pointer bg-[#F5F3F3] w-full justify-center">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Envoi...' : 'Choisir un fichier'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f);
              }}
            />
          </label>
        </div>
      </div>

      {/* Titles, Taglines, Summaries, WhatsApp, Image URL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Titre (FR)</label>
          <input
            type="text"
            required
            value={service.titleFr}
            onChange={(e) => onChange({ ...service, titleFr: e.target.value })}
            className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Title (EN)</label>
          <input
            type="text"
            required
            value={service.titleEn}
            onChange={(e) => onChange({ ...service, titleEn: e.target.value })}
            className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Accroche (FR)</label>
          <input
            type="text"
            value={service.taglineFr}
            onChange={(e) => onChange({ ...service, taglineFr: e.target.value })}
            className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Tagline (EN)</label>
          <input
            type="text"
            value={service.taglineEn}
            onChange={(e) => onChange({ ...service, taglineEn: e.target.value })}
            className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Résumé (FR)</label>
          <textarea
            rows={3}
            value={service.summaryFr}
            onChange={(e) => onChange({ ...service, summaryFr: e.target.value })}
            className="w-full p-2.5 border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Summary (EN)</label>
          <textarea
            rows={3}
            value={service.summaryEn}
            onChange={(e) => onChange({ ...service, summaryEn: e.target.value })}
            className="w-full p-2.5 border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Message WhatsApp pré-rempli (FR)</label>
          <input
            type="text"
            value={service.whatsappMessageFr}
            onChange={(e) => onChange({ ...service, whatsappMessageFr: e.target.value })}
            className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Pre-filled WhatsApp Message (EN)</label>
          <input
            type="text"
            value={service.whatsappMessageEn}
            onChange={(e) => onChange({ ...service, whatsappMessageEn: e.target.value })}
            className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block font-medium mb-1">URL du visuel</label>
          <input
            type="text"
            value={service.imageUrl}
            onChange={(e) => onChange({ ...service, imageUrl: e.target.value })}
            className="w-full px-3 py-2 border border-[#E1DFDE] rounded-[6px] font-mono"
          />
        </div>
      </div>

      {/* Benefits FR / EN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#E1DFDE]">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Bénéfices clients (FR)</span>
            <button
              type="button"
              onClick={() => onChange({ ...service, benefitsFr: [...service.benefitsFr, ''] })}
              className="text-[#A30013] hover:underline cursor-pointer"
            >
              + Ajouter
            </button>
          </div>
          {service.benefitsFr.map((b, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={b}
                onChange={(e) => {
                  const next = [...service.benefitsFr];
                  next[i] = e.target.value;
                  onChange({ ...service, benefitsFr: next });
                }}
                className="flex-1 px-2.5 py-1.5 border border-[#E1DFDE] rounded-[6px]"
              />
              <button
                type="button"
                onClick={() =>
                  onChange({ ...service, benefitsFr: service.benefitsFr.filter((_, idx) => idx !== i) })
                }
                className="p-1.5 text-[#A30013] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Client Benefits (EN)</span>
            <button
              type="button"
              onClick={() => onChange({ ...service, benefitsEn: [...service.benefitsEn, ''] })}
              className="text-[#A30013] hover:underline cursor-pointer"
            >
              + Add
            </button>
          </div>
          {service.benefitsEn.map((b, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={b}
                onChange={(e) => {
                  const next = [...service.benefitsEn];
                  next[i] = e.target.value;
                  onChange({ ...service, benefitsEn: next });
                }}
                className="flex-1 px-2.5 py-1.5 border border-[#E1DFDE] rounded-[6px]"
              />
              <button
                type="button"
                onClick={() =>
                  onChange({ ...service, benefitsEn: service.benefitsEn.filter((_, idx) => idx !== i) })
                }
                className="p-1.5 text-[#A30013] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Offerings */}
      <div className="space-y-3 pt-3 border-t border-[#E1DFDE]">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">Déclinaisons de l’offre ({service.offerings.length})</span>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...service,
                offerings: [
                  ...service.offerings,
                  { titleFr: '', titleEn: '', descFr: '', descEn: '' },
                ],
              })
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0F0C0C] text-white rounded-[6px] cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Ajouter une déclinaison</span>
          </button>
        </div>
        <div className="space-y-3">
          {service.offerings.map((o, idx) => (
            <div key={idx} className="p-3 bg-[#F5F3F3] border border-[#E1DFDE] rounded-[6px] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] text-[#0F0C0C]/60">Prestation #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...service,
                      offerings: service.offerings.filter((_, i) => i !== idx),
                    })
                  }
                  className="text-[#A30013] hover:underline cursor-pointer"
                >
                  Retirer
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={o.titleFr}
                  onChange={(e) => {
                    const next = [...service.offerings];
                    next[idx] = { ...o, titleFr: e.target.value };
                    onChange({ ...service, offerings: next });
                  }}
                  placeholder="Intitulé (FR)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
                <input
                  type="text"
                  value={o.titleEn}
                  onChange={(e) => {
                    const next = [...service.offerings];
                    next[idx] = { ...o, titleEn: e.target.value };
                    onChange({ ...service, offerings: next });
                  }}
                  placeholder="Title (EN)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
                <input
                  type="text"
                  value={o.descFr}
                  onChange={(e) => {
                    const next = [...service.offerings];
                    next[idx] = { ...o, descFr: e.target.value };
                    onChange({ ...service, offerings: next });
                  }}
                  placeholder="Description (FR)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
                <input
                  type="text"
                  value={o.descEn}
                  onChange={(e) => {
                    const next = [...service.offerings];
                    next[idx] = { ...o, descEn: e.target.value };
                    onChange({ ...service, offerings: next });
                  }}
                  placeholder="Description (EN)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Process Steps */}
      <div className="space-y-3 pt-3 border-t border-[#E1DFDE]">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">Processus de réalisation ({service.processSteps.length})</span>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...service,
                processSteps: [
                  ...service.processSteps,
                  {
                    step: service.processSteps.length + 1,
                    titleFr: '',
                    titleEn: '',
                    descFr: '',
                    descEn: '',
                  },
                ],
              })
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0F0C0C] text-white rounded-[6px] cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Ajouter une étape</span>
          </button>
        </div>
        <div className="space-y-2.5">
          {service.processSteps.map((st, idx) => (
            <div key={idx} className="p-3 bg-[#F5F3F3] border border-[#E1DFDE] rounded-[6px] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] font-semibold">Étape {idx + 1}</span>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...service,
                      processSteps: service.processSteps
                        .filter((_, i) => i !== idx)
                        .map((row, rIdx) => ({ ...row, step: rIdx + 1 })),
                    })
                  }
                  className="text-[#A30013] hover:underline cursor-pointer"
                >
                  Retirer
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={st.titleFr}
                  onChange={(e) => {
                    const next = [...service.processSteps];
                    next[idx] = { ...st, titleFr: e.target.value };
                    onChange({ ...service, processSteps: next });
                  }}
                  placeholder="Titre étape (FR)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
                <input
                  type="text"
                  value={st.titleEn}
                  onChange={(e) => {
                    const next = [...service.processSteps];
                    next[idx] = { ...st, titleEn: e.target.value };
                    onChange({ ...service, processSteps: next });
                  }}
                  placeholder="Step title (EN)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
                <input
                  type="text"
                  value={st.descFr}
                  onChange={(e) => {
                    const next = [...service.processSteps];
                    next[idx] = { ...st, descFr: e.target.value };
                    onChange({ ...service, processSteps: next });
                  }}
                  placeholder="Explication (FR)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
                <input
                  type="text"
                  value={st.descEn}
                  onChange={(e) => {
                    const next = [...service.processSteps];
                    next[idx] = { ...st, descEn: e.target.value };
                    onChange({ ...service, processSteps: next });
                  }}
                  placeholder="Description (EN)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-3 pt-3 border-t border-[#E1DFDE]">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">Questions fréquentes ({service.faqs.length})</span>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...service,
                faqs: [...service.faqs, { questionFr: '', questionEn: '', answerFr: '', answerEn: '' }],
              })
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0F0C0C] text-white rounded-[6px] cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Ajouter une FAQ</span>
          </button>
        </div>
        <div className="space-y-2.5">
          {service.faqs.map((fq, idx) => (
            <div key={idx} className="p-3 bg-[#F5F3F3] border border-[#E1DFDE] rounded-[6px] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px]">FAQ #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...service, faqs: service.faqs.filter((_, i) => i !== idx) })
                  }
                  className="text-[#A30013] hover:underline cursor-pointer"
                >
                  Retirer
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={fq.questionFr}
                  onChange={(e) => {
                    const next = [...service.faqs];
                    next[idx] = { ...fq, questionFr: e.target.value };
                    onChange({ ...service, faqs: next });
                  }}
                  placeholder="Question (FR)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
                <input
                  type="text"
                  value={fq.questionEn}
                  onChange={(e) => {
                    const next = [...service.faqs];
                    next[idx] = { ...fq, questionEn: e.target.value };
                    onChange({ ...service, faqs: next });
                  }}
                  placeholder="Question (EN)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
                <textarea
                  rows={2}
                  value={fq.answerFr}
                  onChange={(e) => {
                    const next = [...service.faqs];
                    next[idx] = { ...fq, answerFr: e.target.value };
                    onChange({ ...service, faqs: next });
                  }}
                  placeholder="Réponse (FR)"
                  className="p-2 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
                <textarea
                  rows={2}
                  value={fq.answerEn}
                  onChange={(e) => {
                    const next = [...service.faqs];
                    next[idx] = { ...fq, answerEn: e.target.value };
                    onChange({ ...service, faqs: next });
                  }}
                  placeholder="Answer (EN)"
                  className="p-2 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="px-5 py-2.5 font-semibold bg-[#A30013] hover:bg-[#861213] text-white rounded-[6px] cursor-pointer"
      >
        Enregistrer ce service et synchroniser le chatbot
      </button>
    </form>
  );
}

const PAGE_LABELS: Array<{ key: HeaderPageKey; label: string }> = [
  { key: 'home', label: 'Accueil (Hero)' },
  { key: 'about', label: 'À propos' },
  { key: 'services', label: 'Services' },
  { key: 'presse', label: 'Presse & édition' },
  { key: 'galerie', label: 'Galerie' },
  { key: 'insights', label: 'Actualités' },
  { key: 'contact', label: 'Contact' },
];

export function PageHeadersEditor({
  pagesDraft,
  onChange,
  notify,
}: {
  pagesDraft: PageContent;
  onChange: (next: PageContent) => void;
  notify: (msg: string) => void;
}) {
  const [selectedPage, setSelectedPage] = useState<HeaderPageKey>('home');
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);

  const slides: HeaderSlideItem[] = pagesDraft.pageHeaders?.[selectedPage] || [];

  const updateSlides = (nextSlides: HeaderSlideItem[]) => {
    onChange({
      ...pagesDraft,
      pageHeaders: {
        ...(pagesDraft.pageHeaders || {}),
        [selectedPage]: nextSlides,
      },
    });
  };

  const addSlide = () => {
    const newItem: HeaderSlideItem = {
      id: `hdr-${selectedPage}-${Date.now()}`,
      mediaType: 'image',
      imageUrl: pagesDraft.heroImageUrl || '/images/real/hdr_home_advisory.jpg',
      videoUrl: '',
      captionFr: 'Nouvelle diapositive institutionnelle',
      captionEn: 'New institutional slide',
    };
    updateSlides([...slides, newItem]);
  };

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= slides.length) return;
    const copy = [...slides];
    const tmp = copy[idx];
    copy[idx] = copy[target];
    copy[target] = tmp;
    updateSlides(copy);
  };

  const handleUploadForSlide = async (idx: number, file: File, kind: 'image' | 'video') => {
    const s = slides[idx];
    if (!s) return;
    setUploadingSlideId(`${s.id}-${kind}`);
    try {
      const res = await uploadMediaFile(file);
      const copy = [...slides];
      if (kind === 'video') {
        copy[idx] = { ...s, mediaType: 'video', videoUrl: res.url };
      } else {
        copy[idx] = { ...s, imageUrl: res.url };
      }
      updateSlides(copy);
      notify(kind === 'video' ? 'Vidéo MP4/WebM téléversée.' : 'Image poster téléversée.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur téléversement');
    } finally {
      setUploadingSlideId(null);
    }
  };

  return (
    <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-6 space-y-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold">En-têtes animés (Vidéo MP4 en boucle & Multi-slides)</h3>
          <p className="text-[#0F0C0C]/65">
            Choisissez une page et configurez ses vidéos MP4/WebM (avec image de repli obligatoire) ou diapositives.
          </p>
        </div>
        <button
          type="button"
          onClick={addSlide}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F0C0C] text-white rounded-[6px] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter une diapositive</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PAGE_LABELS.map((pg) => (
          <button
            key={pg.key}
            type="button"
            onClick={() => setSelectedPage(pg.key)}
            className={`px-3 py-1.5 font-semibold rounded-[6px] border cursor-pointer ${
              selectedPage === pg.key
                ? 'bg-[#A30013] text-white border-[#A30013]'
                : 'bg-[#F5F3F3] border-[#E1DFDE]'
            }`}
          >
            {pg.label} ({(pagesDraft.pageHeaders?.[pg.key] || []).length})
          </button>
        ))}
      </div>

      {slides.length === 0 ? (
        <p className="text-[#0F0C0C]/60 py-4">
          Aucune diapositive personnalisée pour cette page — les visuels par défaut seront utilisés.
        </p>
      ) : (
        <div className="space-y-4">
          {slides.map((sl, idx) => (
            <div key={sl.id} className="p-4 bg-[#F5F3F3] border border-[#E1DFDE] rounded-[6px] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">Slide 0{idx + 1}</span>
                  <select
                    value={sl.mediaType}
                    onChange={(e) => {
                      const copy = [...slides];
                      copy[idx] = { ...sl, mediaType: e.target.value as 'image' | 'video' };
                      updateSlides(copy);
                    }}
                    className="px-2 py-1 bg-white border border-[#E1DFDE] rounded-[6px] font-semibold"
                  >
                    <option value="image">Image (Ken Burns)</option>
                    <option value="video">Vidéo en boucle (MP4 / WebM)</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveSlide(idx, -1)}
                    className="p-1 bg-white border border-[#E1DFDE] rounded-[6px] disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === slides.length - 1}
                    onClick={() => moveSlide(idx, 1)}
                    className="p-1 bg-white border border-[#E1DFDE] rounded-[6px] disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSlides(slides.filter((_, i) => i !== idx))}
                    className="p-1 text-[#A30013] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">
                    {sl.mediaType === 'video' ? 'Image poster de repli (obligatoire)' : 'URL de l’image'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={sl.imageUrl}
                      onChange={(e) => {
                        const copy = [...slides];
                        copy[idx] = { ...sl, imageUrl: e.target.value };
                        updateSlides(copy);
                      }}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px] font-mono"
                    />
                    <label className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#E1DFDE] hover:border-[#A30013] rounded-[6px] cursor-pointer shrink-0">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{uploadingSlideId === `${sl.id}-image` ? '...' : 'Image'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadForSlide(idx, f, 'image');
                        }}
                      />
                    </label>
                  </div>
                </div>

                {sl.mediaType === 'video' && (
                  <div>
                    <label className="block font-medium mb-1">URL Vidéo MP4 / WebM (muette en boucle)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sl.videoUrl || ''}
                        onChange={(e) => {
                          const copy = [...slides];
                          copy[idx] = { ...sl, videoUrl: e.target.value };
                          updateSlides(copy);
                        }}
                        placeholder="/uploads/video.mp4 ou https://..."
                        className="flex-1 px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px] font-mono"
                      />
                      <label className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#0F0C0C] text-white rounded-[6px] cursor-pointer shrink-0">
                        <Video className="w-3.5 h-3.5" />
                        <span>{uploadingSlideId === `${sl.id}-video` ? 'Envoi...' : 'MP4/WebM'}</span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadForSlide(idx, f, 'video');
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-medium mb-1">Légende (FR)</label>
                  <input
                    type="text"
                    value={sl.captionFr}
                    onChange={(e) => {
                      const copy = [...slides];
                      copy[idx] = { ...sl, captionFr: e.target.value };
                      updateSlides(copy);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Caption (EN)</label>
                  <input
                    type="text"
                    value={sl.captionEn}
                    onChange={(e) => {
                      const copy = [...slides];
                      copy[idx] = { ...sl, captionEn: e.target.value };
                      updateSlides(copy);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                  />
                </div>

                {selectedPage === 'home' && (
                  <>
                    <input
                      type="text"
                      value={sl.tagFr || ''}
                      onChange={(e) => {
                        const copy = [...slides];
                        copy[idx] = { ...sl, tagFr: e.target.value };
                        updateSlides(copy);
                      }}
                      placeholder="Sur-titre carte (FR)"
                      className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                    />
                    <input
                      type="text"
                      value={sl.cardTitleFr || ''}
                      onChange={(e) => {
                        const copy = [...slides];
                        copy[idx] = { ...sl, cardTitleFr: e.target.value };
                        updateSlides(copy);
                      }}
                      placeholder="Titre carte (FR)"
                      className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                    />
                    <input
                      type="text"
                      value={sl.cardDescFr || ''}
                      onChange={(e) => {
                        const copy = [...slides];
                        copy[idx] = { ...sl, cardDescFr: e.target.value };
                        updateSlides(copy);
                      }}
                      placeholder="Description carte (FR)"
                      className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                    />
                    <input
                      type="text"
                      value={sl.href || ''}
                      onChange={(e) => {
                        const copy = [...slides];
                        copy[idx] = { ...sl, href: e.target.value };
                        updateSlides(copy);
                      }}
                      placeholder="Lien cible (ex: /services/conseil-communication)"
                      className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px] font-mono"
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AboutAndPresseEditor({
  pagesDraft,
  onChange,
}: {
  pagesDraft: PageContent;
  onChange: (next: PageContent) => void;
}) {
  return (
    <div className="bg-white border border-[#E1DFDE] rounded-[6px] p-6 space-y-6 text-xs">
      <h3 className="font-serif text-lg font-bold">Textes institutionnels (« À propos » & « Presse & édition »)</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Introduction « À propos » (FR)</label>
          <RichTextToolbar
            value={pagesDraft.aboutIntroFr}
            onChange={(v) => onChange({ ...pagesDraft, aboutIntroFr: v })}
          />
          <textarea
            rows={3}
            value={pagesDraft.aboutIntroFr}
            onChange={(e) => onChange({ ...pagesDraft, aboutIntroFr: e.target.value })}
            className="w-full p-2.5 border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">About Introduction (EN)</label>
          <RichTextToolbar
            value={pagesDraft.aboutIntroEn}
            onChange={(v) => onChange({ ...pagesDraft, aboutIntroEn: v })}
          />
          <textarea
            rows={3}
            value={pagesDraft.aboutIntroEn}
            onChange={(e) => onChange({ ...pagesDraft, aboutIntroEn: e.target.value })}
            className="w-full p-2.5 border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Mission & vocation (FR)</label>
          <textarea
            rows={2}
            value={pagesDraft.aboutMissionFr}
            onChange={(e) => onChange({ ...pagesDraft, aboutMissionFr: e.target.value })}
            className="w-full p-2.5 border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Mission Statement (EN)</label>
          <textarea
            rows={2}
            value={pagesDraft.aboutMissionEn}
            onChange={(e) => onChange({ ...pagesDraft, aboutMissionEn: e.target.value })}
            className="w-full p-2.5 border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Engagements qualité (FR)</label>
          <textarea
            rows={2}
            value={pagesDraft.aboutQualityFr}
            onChange={(e) => onChange({ ...pagesDraft, aboutQualityFr: e.target.value })}
            className="w-full p-2.5 border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Quality Pledge (EN)</label>
          <textarea
            rows={2}
            value={pagesDraft.aboutQualityEn}
            onChange={(e) => onChange({ ...pagesDraft, aboutQualityEn: e.target.value })}
            className="w-full p-2.5 border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Introduction « Presse & édition » (FR)</label>
          <textarea
            rows={2}
            value={pagesDraft.presseIntroFr}
            onChange={(e) => onChange({ ...pagesDraft, presseIntroFr: e.target.value })}
            className="w-full p-2.5 border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Press & Publishing Intro (EN)</label>
          <textarea
            rows={2}
            value={pagesDraft.presseIntroEn}
            onChange={(e) => onChange({ ...pagesDraft, presseIntroEn: e.target.value })}
            className="w-full p-2.5 border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
      </div>

      {/* Timeline Editor */}
      <div className="space-y-3 pt-4 border-t border-[#E1DFDE]">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">Chronologie historique ({pagesDraft.aboutTimeline.length})</span>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...pagesDraft,
                aboutTimeline: [
                  ...pagesDraft.aboutTimeline,
                  { year: '2026', titleFr: '', titleEn: '', descFr: '', descEn: '' },
                ],
              })
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0F0C0C] text-white rounded-[6px] cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Ajouter un jalon</span>
          </button>
        </div>
        <div className="space-y-2.5">
          {pagesDraft.aboutTimeline.map((t, idx) => (
            <div key={idx} className="p-3 bg-[#F5F3F3] border border-[#E1DFDE] rounded-[6px] space-y-2">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={t.year}
                  onChange={(e) => {
                    const next = [...pagesDraft.aboutTimeline];
                    next[idx] = { ...t, year: e.target.value };
                    onChange({ ...pagesDraft, aboutTimeline: next });
                  }}
                  placeholder="Année"
                  className="w-24 px-2 py-1 bg-white border border-[#E1DFDE] rounded-[6px] font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...pagesDraft,
                      aboutTimeline: pagesDraft.aboutTimeline.filter((_, i) => i !== idx),
                    })
                  }
                  className="text-[#A30013] hover:underline cursor-pointer"
                >
                  Retirer
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={t.titleFr}
                  onChange={(e) => {
                    const next = [...pagesDraft.aboutTimeline];
                    next[idx] = { ...t, titleFr: e.target.value };
                    onChange({ ...pagesDraft, aboutTimeline: next });
                  }}
                  placeholder="Titre (FR)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
                <input
                  type="text"
                  value={t.titleEn}
                  onChange={(e) => {
                    const next = [...pagesDraft.aboutTimeline];
                    next[idx] = { ...t, titleEn: e.target.value };
                    onChange({ ...pagesDraft, aboutTimeline: next });
                  }}
                  placeholder="Title (EN)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
                <input
                  type="text"
                  value={t.descFr}
                  onChange={(e) => {
                    const next = [...pagesDraft.aboutTimeline];
                    next[idx] = { ...t, descFr: e.target.value };
                    onChange({ ...pagesDraft, aboutTimeline: next });
                  }}
                  placeholder="Description (FR)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
                <input
                  type="text"
                  value={t.descEn}
                  onChange={(e) => {
                    const next = [...pagesDraft.aboutTimeline];
                    next[idx] = { ...t, descEn: e.target.value };
                    onChange({ ...pagesDraft, aboutTimeline: next });
                  }}
                  placeholder="Description (EN)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team / Leadership Poles Editor */}
      <div className="space-y-3 pt-4 border-t border-[#E1DFDE]">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">Pôles de direction & équipes ({pagesDraft.aboutTeam.length})</span>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...pagesDraft,
                aboutTeam: [
                  ...pagesDraft.aboutTeam,
                  { name: '', roleFr: '', roleEn: '', bioFr: '', bioEn: '' },
                ],
              })
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0F0C0C] text-white rounded-[6px] cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Ajouter un membre / pôle</span>
          </button>
        </div>
        <div className="space-y-2.5">
          {pagesDraft.aboutTeam.map((m, idx) => (
            <div key={idx} className="p-3 bg-[#F5F3F3] border border-[#E1DFDE] rounded-[6px] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={m.name}
                  onChange={(e) => {
                    const next = [...pagesDraft.aboutTeam];
                    next[idx] = { ...m, name: e.target.value };
                    onChange({ ...pagesDraft, aboutTeam: next });
                  }}
                  placeholder="Nom ou Pôle"
                  className="flex-1 px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px] font-semibold"
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...pagesDraft,
                      aboutTeam: pagesDraft.aboutTeam.filter((_, i) => i !== idx),
                    })
                  }
                  className="text-[#A30013] hover:underline cursor-pointer"
                >
                  Retirer
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={m.roleFr}
                  onChange={(e) => {
                    const next = [...pagesDraft.aboutTeam];
                    next[idx] = { ...m, roleFr: e.target.value };
                    onChange({ ...pagesDraft, aboutTeam: next });
                  }}
                  placeholder="Fonction (FR)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
                <input
                  type="text"
                  value={m.roleEn}
                  onChange={(e) => {
                    const next = [...pagesDraft.aboutTeam];
                    next[idx] = { ...m, roleEn: e.target.value };
                    onChange({ ...pagesDraft, aboutTeam: next });
                  }}
                  placeholder="Role (EN)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
                <input
                  type="text"
                  value={m.bioFr}
                  onChange={(e) => {
                    const next = [...pagesDraft.aboutTeam];
                    next[idx] = { ...m, bioFr: e.target.value };
                    onChange({ ...pagesDraft, aboutTeam: next });
                  }}
                  placeholder="Présentation (FR)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
                <input
                  type="text"
                  value={m.bioEn}
                  onChange={(e) => {
                    const next = [...pagesDraft.aboutTeam];
                    next[idx] = { ...m, bioEn: e.target.value };
                    onChange({ ...pagesDraft, aboutTeam: next });
                  }}
                  placeholder="Bio (EN)"
                  className="px-2.5 py-1.5 bg-white border border-[#E1DFDE] rounded-[6px]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BlogPostFullEditor({
  post,
  services,
  onChange,
  onSave,
  onCancel,
  notify,
}: {
  post: BlogPost;
  services: ServiceItem[];
  onChange: (next: BlogPost) => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
  notify: (msg: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const uploadCover = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadMediaFile(file);
      onChange({ ...post, imageUrl: res.url });
      notify('Image de couverture téléversée.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur téléversement');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={onSave} className="p-5 border border-[#E1DFDE] bg-[#F5F3F3] rounded-[6px] space-y-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-serif text-base font-bold">Éditer l’article</h4>
        <label className="flex items-center gap-2 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={post.published}
            onChange={(e) => onChange({ ...post, published: e.target.checked })}
          />
          <span>Article publié</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block font-medium mb-1">Slug URL</label>
          <input
            type="text"
            required
            value={post.slug}
            onChange={(e) => onChange({ ...post, slug: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E1DFDE] rounded-[6px] font-mono"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Date de publication</label>
          <input
            type="date"
            value={post.publishedAt}
            onChange={(e) => onChange({ ...post, publishedAt: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E1DFDE] rounded-[6px] tabular-nums"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Temps de lecture (min)</label>
          <input
            type="number"
            min={1}
            value={post.readMinutes}
            onChange={(e) => onChange({ ...post, readMinutes: Number(e.target.value) || 3 })}
            className="w-full px-3 py-2 bg-white border border-[#E1DFDE] rounded-[6px] tabular-nums"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          value={post.categoryFr}
          onChange={(e) => onChange({ ...post, categoryFr: e.target.value })}
          placeholder="Catégorie (FR)"
          className="px-3 py-2 bg-white border border-[#E1DFDE] rounded-[6px]"
        />
        <input
          type="text"
          value={post.categoryEn}
          onChange={(e) => onChange({ ...post, categoryEn: e.target.value })}
          placeholder="Category (EN)"
          className="px-3 py-2 bg-white border border-[#E1DFDE] rounded-[6px]"
        />
        <input
          type="text"
          required
          value={post.titleFr}
          onChange={(e) => onChange({ ...post, titleFr: e.target.value })}
          placeholder="Titre (FR) *"
          className="px-3 py-2 bg-white border border-[#E1DFDE] rounded-[6px]"
        />
        <input
          type="text"
          required
          value={post.titleEn}
          onChange={(e) => onChange({ ...post, titleEn: e.target.value })}
          placeholder="Title (EN) *"
          className="px-3 py-2 bg-white border border-[#E1DFDE] rounded-[6px]"
        />
        <textarea
          rows={2}
          value={post.excerptFr}
          onChange={(e) => onChange({ ...post, excerptFr: e.target.value })}
          placeholder="Extrait / Résumé (FR)"
          className="p-2.5 bg-white border border-[#E1DFDE] rounded-[6px]"
        />
        <textarea
          rows={2}
          value={post.excerptEn}
          onChange={(e) => onChange({ ...post, excerptEn: e.target.value })}
          placeholder="Excerpt (EN)"
          className="p-2.5 bg-white border border-[#E1DFDE] rounded-[6px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block font-medium mb-1">Contenu (FR) *</label>
          <RichTextToolbar
            value={post.contentFr}
            onChange={(v) => onChange({ ...post, contentFr: v })}
          />
          <textarea
            rows={5}
            required
            value={post.contentFr}
            onChange={(e) => onChange({ ...post, contentFr: e.target.value })}
            className="w-full p-2.5 bg-white border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Content (EN) *</label>
          <RichTextToolbar
            value={post.contentEn}
            onChange={(v) => onChange({ ...post, contentEn: v })}
          />
          <textarea
            rows={5}
            required
            value={post.contentEn}
            onChange={(e) => onChange({ ...post, contentEn: e.target.value })}
            className="w-full p-2.5 bg-white border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block font-medium mb-1">Mot-clé SEO cible</label>
          <input
            type="text"
            value={post.targetKeyword}
            onChange={(e) => onChange({ ...post, targetKeyword: e.target.value })}
            placeholder="ex: impression offset Conakry"
            className="w-full px-3 py-2 bg-white border border-[#E1DFDE] rounded-[6px]"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Service associé</label>
          <select
            value={post.relatedServiceSlug}
            onChange={(e) => onChange({ ...post, relatedServiceSlug: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E1DFDE] rounded-[6px]"
          >
            {services.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.titleFr}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Image couverture (URL ou téléversement)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={post.imageUrl}
              onChange={(e) => onChange({ ...post, imageUrl: e.target.value })}
              className="flex-1 px-2.5 py-2 bg-white border border-[#E1DFDE] rounded-[6px] font-mono"
            />
            <label className="inline-flex items-center gap-1 px-2.5 py-2 bg-white border border-[#E1DFDE] hover:border-[#A30013] rounded-[6px] cursor-pointer shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? '...' : 'Image'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadCover(f);
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-[#A30013] text-white font-semibold rounded-[6px] cursor-pointer">
          Publier / Enregistrer l’article
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-[#E1DFDE] rounded-[6px] cursor-pointer">
          Annuler
        </button>
      </div>
    </form>
  );
}
