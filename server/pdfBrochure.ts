import PDFDocument from 'pdfkit';
import type {
  GalleryItem,
  Lang,
  MediaHubConfig,
  PageContent,
  ServiceItem,
  SiteSettings,
} from '../src/types/concam.ts';

interface BrochurePayload {
  lang: Lang;
  settings: SiteSettings;
  services: ServiceItem[];
  gallery: GalleryItem[];
  pageContent: PageContent;
  mediaHub: MediaHubConfig;
}

export function generateInstitutionalBrochurePdf(payload: BrochurePayload): Promise<Buffer> {
  const { lang, settings, services, gallery, pageContent, mediaHub } = payload;
  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 48, bottom: 48, left: 48, right: 48 },
      info: {
        Title: p(
          'Plaquette Institutionnelle — Agence CONCAM (Com’Com)',
          'Institutional Profile — CONCAM Agency (Com’Com)',
        ),
        Author: settings.companyName,
        Subject: p(
          'Conseil 360°, Manuels, Impression Numérique & Offset, Marquage Publicitaire',
          '360° Advisory, Manuals, Digital & Offset Printing, Corporate Merchandise',
        ),
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err: Error) => reject(err));

    const OBSIDIAN = '#110D0C';
    const GRENAT = '#931916';
    const CRIMSON = '#E40014';
    const IVORY = '#F7F4EF';
    const INK = '#181413';
    const MUTED = '#574E4A';
    const LINE = '#DDD5C9';

    // ==================== PAGE 1: COVER & CORPORATE REGISTRY ====================
    doc.rect(0, 0, doc.page.width, 215).fill(OBSIDIAN);
    doc.rect(0, 215, doc.page.width, 4).fill(GRENAT);

    // Logo badge
    doc.rect(48, 42, 132, 34).fill(GRENAT);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(15).text('CONCAM', 62, 52, { characterSpacing: 2 });

    doc
      .fillColor(CRIMSON)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(
        p('DOSSIER INSTITUTIONNEL OFFICIEL · CONAKRY', 'OFFICIAL INSTITUTIONAL DOSSIER · CONAKRY'),
        48,
        96,
        { characterSpacing: 1.4 },
      );

    doc
      .fillColor('#F6F2EA')
      .font('Times-Bold')
      .fontSize(26)
      .text(lang === 'en' ? pageContent.heroTitleEn : pageContent.heroTitleFr, 48, 116, {
        width: doc.page.width - 96,
      });

    doc
      .fillColor('#D6CEC2')
      .font('Helvetica')
      .fontSize(10.5)
      .text(lang === 'en' ? pageContent.heroSubtitleEn : pageContent.heroSubtitleFr, 48, 168, {
        width: doc.page.width - 96,
      });

    // Intro block on Ivory background box
    let y = 240;
    doc.rect(48, y, doc.page.width - 96, 108).fillAndStroke(IVORY, LINE);
    doc
      .fillColor(GRENAT)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(p('PRÉSENTATION DE LA MAISON', 'AGENCY OVERVIEW'), 64, y + 14, { characterSpacing: 1.2 });
    doc
      .fillColor(INK)
      .font('Helvetica')
      .fontSize(10)
      .text(lang === 'en' ? pageContent.aboutIntroEn : pageContent.aboutIntroFr, 64, y + 32, {
        width: doc.page.width - 128,
        lineGap: 3,
      });

    y += 126;

    // 3 Key Figures strip
    const statBoxW = (doc.page.width - 96 - 24) / 3;
    const statsList = [
      {
        val: `${settings.stats.yearsExperience} ${p('ans', 'yrs')}`,
        lbl: p('D’activité à Conakry (depuis 2010)', 'Operating in Conakry (since 2010)'),
      },
      {
        val: `${settings.stats.projectsCompleted}+`,
        lbl: p('Projets & tirages livrés', 'Projects & print runs delivered'),
      },
      {
        val: `${settings.stats.clientsSupported}+`,
        lbl: p('Institutions & entreprises accompagnées', 'Institutions & enterprises advised'),
      },
    ];

    statsList.forEach((st, idx) => {
      const bx = 48 + idx * (statBoxW + 12);
      doc.rect(bx, y, statBoxW, 66).fillAndStroke('#FFFFFF', LINE);
      doc.fillColor(GRENAT).font('Times-Bold').fontSize(20).text(st.val, bx + 14, y + 12);
      doc.fillColor(MUTED).font('Helvetica').fontSize(8.5).text(st.lbl, bx + 14, y + 38, {
        width: statBoxW - 28,
      });
    });

    y += 88;

    // Corporate Registry Ledger
    doc
      .fillColor(INK)
      .font('Times-Bold')
      .fontSize(15)
      .text(p('Fiche d’identité légale & références', 'Official Corporate Registry & Partners'), 48, y);
    y += 22;
    doc.moveTo(48, y).lineTo(doc.page.width - 48, y).strokeColor(GRENAT).lineWidth(1).stroke();
    y += 12;

    const registryRows = [
      [p('Dénomination sociale', 'Company Name'), `${settings.companyName} (${settings.brandAlias})`],
      [p('Forme & Immatriculation', 'Legal Form'), `${settings.legalForm} · ${settings.rccm}`],
      [p('Identifiants fiscaux', 'Tax IDs'), `NCC ${settings.ncc} · NIF ${settings.nif} (${settings.taxCategory})`],
      [p('Siège social', 'Headquarters'), lang === 'en' ? settings.address.en : settings.address.fr],
      [p('Partenaires publiés', 'Published Partners'), settings.partners.join(' · ')],
    ];

    registryRows.forEach(([k, v]) => {
      doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9).text(k, 48, y, { width: 150 });
      doc.fillColor(INK).font('Helvetica').fontSize(9).text(v, 204, y, { width: doc.page.width - 252 });
      y += Math.max(22, doc.heightOfString(v, { width: doc.page.width - 252 }) + 8);
    });

    // Footer Page 1
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(8)
      .text(
        `${settings.companyName} — ${settings.agencyEmail} — ${settings.phones[0] || ''}`,
        48,
        doc.page.height - 36,
        { align: 'center', width: doc.page.width - 96 },
      );

    // ==================== PAGE 2: FOUR SERVICE PILLARS & MEDIA HUB ====================
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 64).fill(OBSIDIAN);
    doc
      .fillColor(CRIMSON)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(p('OFFRE INTÉGRÉE 360°', 'INTEGRATED 360° CAPABILITIES'), 48, 20, { characterSpacing: 1.2 });
    doc
      .fillColor('#F6F2EA')
      .font('Times-Bold')
      .fontSize(17)
      .text(p('Nos pôles d’expertise & branche média', 'Service Pillars & Group Media Division'), 48, 34);

    y = 86;
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI'];

    services.slice(0, 4).forEach((srv, idx) => {
      const title = lang === 'en' ? srv.titleEn : srv.titleFr;
      const tagline = lang === 'en' ? srv.taglineEn : srv.taglineFr;
      const summary = lang === 'en' ? srv.summaryEn : srv.summaryFr;
      const benefits = (lang === 'en' ? srv.benefitsEn : srv.benefitsFr).slice(0, 3);
      const offerings = srv.offerings.map((o) => (lang === 'en' ? o.titleEn : o.titleFr)).join(' · ');

      const cardH = 148;
      doc.rect(48, y, doc.page.width - 96, cardH).fillAndStroke(IVORY, LINE);
      doc.rect(48, y, 4, cardH).fill(GRENAT);

      doc
        .fillColor(GRENAT)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`${p('PÔLE', 'PILLAR')} ${roman[idx] || idx + 1}`, 64, y + 12);
      doc.fillColor(INK).font('Times-Bold').fontSize(14).text(title, 64, y + 25);
      doc.fillColor(MUTED).font('Helvetica-Oblique').fontSize(9.5).text(tagline, 64, y + 43, {
        width: doc.page.width - 128,
      });
      doc.fillColor(INK).font('Helvetica').fontSize(9).text(summary, 64, y + 60, {
        width: doc.page.width - 128,
        height: 36,
      });

      const bText = benefits.map((b) => `• ${b}`).join('   ');
      doc.fillColor(MUTED).font('Helvetica').fontSize(8.2).text(bText, 64, y + 98, {
        width: doc.page.width - 128,
      });
      if (offerings) {
        doc.fillColor(GRENAT).font('Helvetica-Bold').fontSize(8.2).text(`${p('Livrables :', 'Deliverables:')} ${offerings}`, 64, y + 126, {
          width: doc.page.width - 128,
        });
      }

      y += cardH + 14;
    });

    // Press division strip
    doc.rect(48, y, doc.page.width - 96, 68).fill(OBSIDIAN);
    doc
      .fillColor(CRIMSON)
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(p('BRANCHE PRESSE & ÉDITION DU GROUPE', 'GROUP PRESS & PUBLISHING DIVISION'), 64, y + 12);
    doc
      .fillColor('#F6F2EA')
      .font('Helvetica')
      .fontSize(9)
      .text(
        `${mediaHub.reussiteMagazineEnabled ? `Réussite Magazine (${mediaHub.reussiteMagazineUrl}) — ` : ''}${
          lang === 'en' ? mediaHub.reussiteMagazineDescEn : mediaHub.reussiteMagazineDescFr
        }`,
        64,
        y + 28,
        { width: doc.page.width - 128 },
      );

    // ==================== PAGE 3: FEATURED CASE STUDIES & DIRECT CONTACT ====================
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 64).fill(OBSIDIAN);
    doc
      .fillColor(CRIMSON)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(p('PORTFOLIO & ENGAGEMENT QUALITÉ', 'PORTFOLIO & QUALITY PLEDGE'), 48, 20, { characterSpacing: 1.2 });
    doc
      .fillColor('#F6F2EA')
      .font('Times-Bold')
      .fontSize(17)
      .text(p('Sélection de réalisations & prise de contact', 'Selected Case Studies & Direct Contact'), 48, 34);

    y = 86;
    const featured = gallery.filter((g) => g.featured).slice(0, 4);
    const itemsToShow = featured.length > 0 ? featured : gallery.slice(0, 4);

    itemsToShow.forEach((g) => {
      const boxH = 104;
      doc.rect(48, y, doc.page.width - 96, boxH).fillAndStroke('#FFFFFF', LINE);
      doc
        .fillColor(GRENAT)
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text(`${g.clientOrSector} · ${g.year}`, 64, y + 12);
      doc
        .fillColor(INK)
        .font('Times-Bold')
        .fontSize(12.5)
        .text(lang === 'en' ? g.titleEn : g.titleFr, 64, y + 26, { width: doc.page.width - 128 });
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(8.8)
        .text(`${p('Besoin :', 'Brief:')} ${lang === 'en' ? g.needEn : g.needFr}`, 64, y + 46, {
          width: doc.page.width - 128,
          height: 24,
        });
      doc
        .fillColor(INK)
        .font('Helvetica')
        .fontSize(8.8)
        .text(`${p('Solution :', 'Solution:')} ${lang === 'en' ? g.solutionEn : g.solutionFr}`, 64, y + 72, {
          width: doc.page.width - 128,
          height: 24,
        });
      y += boxH + 12;
    });

    // Contact & Quote Pledge box
    y += 8;
    doc.rect(48, y, doc.page.width - 96, 152).fill(IVORY).strokeColor(GRENAT).lineWidth(1.2).stroke();
    doc
      .fillColor(GRENAT)
      .font('Times-Bold')
      .fontSize(14)
      .text(
        p('Demander une proposition graduée sous 24 heures ouvrées', 'Request a Tiered Proposal Within 24 Business Hours'),
        64,
        y + 16,
      );
    doc
      .fillColor(INK)
      .font('Helvetica')
      .fontSize(9.5)
      .text(lang === 'en' ? pageContent.aboutQualityEn : pageContent.aboutQualityFr, 64, y + 38, {
        width: doc.page.width - 128,
      });

    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text(`${p('Téléphones :', 'Phones:')} ${settings.phones.join(' / ')}`, 64, y + 76);
    doc.text(`WhatsApp Direct : ${settings.whatsappNumber}`, 64, y + 92);
    doc.text(`${p('Courriels :', 'Emails:')} ${settings.agencyEmail} · ${settings.magazineEmail}`, 64, y + 108);
    doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(
      `${lang === 'en' ? settings.address.en : settings.address.fr} · ${lang === 'en' ? settings.hoursEn : settings.hoursFr}`,
      64,
      y + 126,
      { width: doc.page.width - 128 },
    );

    doc.end();
  });
}
