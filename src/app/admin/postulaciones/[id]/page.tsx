import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2, CircleAlert, MailCheck, PhoneCall, ShieldCheck } from "lucide-react";
import { AdminBackLink, AdminCard, AdminDemoNotice, AdminOperationalNotice, AdminPageHeading, AdminStatus } from "@/components/admin/admin-ui";
import { ModerationDecision, RealModerationDecision } from "@/components/admin/demo-action";
import { adminDocuments, adminGalleryItems, adminQualifications, getAdminApplication, statusTone } from "@/data/admin-demo";
import { regionNameFromCode } from "@/domain/professional-registration";
import { getProfessionalApplication, profileStatusLabels, profileStatusTone } from "@/lib/admin/professional-applications";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (isSupabaseAuthMode()) return { title: "Revisar postulación | Administración" };
  const application = getAdminApplication((await params).id);
  return { title: application ? `${application.name} | Postulación demo` : "Postulación no encontrada" };
}

export default async function ApplicationDetailPage({ params }: Props) {
  const { id } = await params;
  if (isSupabaseAuthMode()) {
    const result = await getProfessionalApplication(id);
    if (result.error) {
      return <section className="admin-page"><AdminBackLink href="/admin/postulaciones">Volver a postulaciones</AdminBackLink><p className="auth-message" role="alert" style={{ marginTop: 20 }}>{result.error}</p></section>;
    }
    if (!result.data) notFound();
    const liveApplication = result.data;
    const categoryLabel = liveApplication.categories[0] === "industrial" ? "Refrigeración industrial" : liveApplication.categories[0] === "commercial" ? "Refrigeración comercial" : "Climatización residencial";

    return (
      <section className="admin-page">
        <div style={{ marginBottom: 18 }}><AdminBackLink href="/admin/postulaciones">Volver a postulaciones</AdminBackLink></div>
        <AdminPageHeading
          eyebrow="Revisión real"
          title={liveApplication.displayName}
          description={`${liveApplication.id.slice(0, 8)} · ${liveApplication.kind === "company" ? "Empresa" : "Técnico independiente"}`}
          action={<AdminStatus tone={profileStatusTone(liveApplication.status)}>{profileStatusLabels[liveApplication.status]}</AdminStatus>}
        />
        <AdminOperationalNotice>Los datos de contacto son privados y visibles aquí únicamente por tu rol administrativo. Nunca forman parte del directorio público.</AdminOperationalNotice>
        <div className="admin-detail-grid">
          <div className="admin-stack">
            <AdminCard title="Perfil declarado" description="Información enviada durante el registro breve">
              <p className="admin-card-copy">{liveApplication.summary}</p>
              <dl className="admin-info-list">
                <div><dt>Categoría</dt><dd>{categoryLabel}</dd></div>
                <div><dt>Cobertura principal</dt><dd>{liveApplication.communeCodes.join(", ") || "No informada"}{liveApplication.regionCode ? `, ${regionNameFromCode(liveApplication.regionCode)}` : ""}</dd></div>
                <div><dt>Experiencia declarada</dt><dd>{liveApplication.yearsExperience} años</dd></div>
                <div><dt>Modalidad</dt><dd>{liveApplication.modalities.join(", ")}</dd></div>
                <div><dt>Vehículo</dt><dd>{liveApplication.hasVehicle ? "Sí" : "No"}</dd></div>
              </dl>
            </AdminCard>
            <AdminCard title="Servicios" description={`${liveApplication.services.length} servicios declarados`}>
              <div className="admin-chip-list">{liveApplication.services.map((service) => <span key={service}>{service}</span>)}</div>
            </AdminCard>
            <AdminCard title="Contacto privado" description="Disponible solo para gestión y moderación">
              <dl className="admin-info-list">
                <div><dt>Correo de cuenta</dt><dd>{liveApplication.email ?? "Pendiente"}</dd></div>
                <div><dt>Celular</dt><dd>{liveApplication.phone ?? "Pendiente"}</dd></div>
                <div><dt>WhatsApp</dt><dd>{liveApplication.whatsappPhone ?? "No informado"}</dd></div>
              </dl>
            </AdminCard>
            <AdminCard title="Formación" description="Opcional y posterior al registro">
              {liveApplication.qualifications?.length ? <dl className="admin-info-list">{liveApplication.qualifications.map((qualification) => <div key={qualification.id}><dt>{qualification.type}</dt><dd><strong>{qualification.title}</strong><br />{qualification.institution} · {qualification.year} · {qualification.status}</dd></div>)}</dl> : <p className="admin-card-copy">El profesional todavía no agregó títulos o capacitaciones.</p>}
            </AdminCard>
            <AdminCard title="Galería de trabajos" description="Máximo tres imágenes, agregadas después desde el panel">
              {liveApplication.portfolio?.length ? <dl className="admin-info-list">{liveApplication.portfolio.map((item) => <div key={item.id}><dt>{item.title}</dt><dd>{item.category} · {item.status}</dd></div>)}</dl> : <p className="admin-card-copy">El profesional todavía no agregó trabajos.</p>}
            </AdminCard>
          </div>
          <div className="admin-stack">
            <AdminCard title="Señales iniciales" description="Verificaciones disponibles en esta etapa">
              <ul className="check-list" style={{ marginTop: 4 }}>
                <li><MailCheck aria-hidden="true" size={16} /> Cuenta de correo creada</li>
                <li><PhoneCall aria-hidden="true" size={16} /> Celular informado</li>
                <li><ShieldCheck aria-hidden="true" size={16} /> Consentimiento versionado registrado</li>
              </ul>
              <p className="admin-card-copy" style={{ marginTop: 14 }}>Aprobar el perfil no certifica identidad, títulos ni calidad de servicio. Esas señales se revisan por separado.</p>
            </AdminCard>
            {liveApplication.reviewReason ? <AdminCard title="Último motivo registrado"><p className="admin-card-copy">{liveApplication.reviewReason}</p></AdminCard> : null}
            <AdminCard title="Decisión de moderación" description="La aprobación crea o actualiza la ficha pública segura">
              <RealModerationDecision resource={liveApplication.id} />
              <div className="responsibility-box" style={{ marginTop: 16 }}><CircleAlert aria-hidden="true" size={16} /><p>Correo, celular, notas administrativas y documentos nunca se copian al directorio público.</p></div>
            </AdminCard>
            <AdminCard title="Lista de control">
              <ul className="check-list"><li><CheckCircle2 aria-hidden="true" size={16} /> Presentación coherente</li><li><CheckCircle2 aria-hidden="true" size={16} /> Cobertura informada</li><li><CheckCircle2 aria-hidden="true" size={16} /> Servicios seleccionados</li></ul>
            </AdminCard>
          </div>
        </div>
      </section>
    );
  }

  const application = getAdminApplication(id);
  if (!application) notFound();
  const documents = adminDocuments.filter((document) => document.owner === application.name);
  const qualifications = adminQualifications.filter((qualification) => qualification.owner === application.name);
  const gallery = adminGalleryItems.filter((item) => item.owner === application.name).slice(0, 3);

  return (
    <section className="admin-page">
      <div style={{ marginBottom: 18 }}><AdminBackLink href="/admin/postulaciones">Volver a postulaciones</AdminBackLink></div>
      <AdminPageHeading
        title={application.name}
        description={`${application.id} · ${application.kind} · registro completamente ficticio`}
        action={<AdminStatus tone={statusTone(application.status)}>{application.status}</AdminStatus>}
      />
      <AdminDemoNotice>Esta es una simulación de revisión. Aprobar, pedir cambios o rechazar solo muestra una confirmación local y no altera el estado.</AdminDemoNotice>
      <div className="admin-detail-grid">
        <div className="admin-stack">
          <AdminCard title="Antecedentes declarados" description="Información de ejemplo enviada por el postulante">
            <p className="admin-card-copy">{application.summary}</p>
            <dl className="admin-info-list">
              <div><dt>Especialidad</dt><dd>{application.specialty}</dd></div>
              <div><dt>Cobertura principal</dt><dd>{application.commune}, Región de {application.region}</dd></div>
              <div><dt>Tipo de entidad</dt><dd>{application.kind}</dd></div>
              <div><dt>Correo</dt><dd>{application.emailVerified ? "Verificado (dato demo oculto)" : "Pendiente"}</dd></div>
              <div><dt>Teléfono</dt><dd>{application.phoneVerified ? "Verificado (dato demo oculto)" : "Pendiente"}</dd></div>
            </dl>
          </AdminCard>
          <AdminCard title="Documentos" description="Solo se muestran metadatos ficticios; no hay archivos descargables">
            {documents.length ? (
              <dl className="admin-info-list">
                {documents.map((document) => <div key={document.id}><dt>{document.type}</dt><dd><AdminStatus tone={statusTone(document.status)}>{document.status}</AdminStatus> · {document.id}</dd></div>)}
              </dl>
            ) : <p className="admin-card-copy">No hay documentos demo asociados a esta postulación.</p>}
          </AdminCard>
          <AdminCard title="Formación" description="Títulos y capacitaciones declarados con su estado de revisión">
            {qualifications.length ? <dl className="admin-info-list">{qualifications.map((qualification) => <div key={qualification.id}><dt>{qualification.type}</dt><dd><strong>{qualification.title}</strong><br />{qualification.institution} · {qualification.year} · <AdminStatus tone={statusTone(qualification.status)}>{qualification.status}</AdminStatus></dd></div>)}</dl> : <p className="admin-card-copy">No se declaró formación adicional en esta postulación ficticia.</p>}
          </AdminCard>
          <AdminCard title="Tres trabajos" description="Imágenes ilustrativas sujetas a moderación individual">
            {gallery.length ? <div className="admin-gallery-preview">{gallery.map((item) => <article key={item.id}><div><Image alt={`Trabajo ficticio: ${item.title}`} fill sizes="(max-width: 780px) 100vw, 260px" src={item.imageSrc} /></div><strong>{item.title}</strong><span>{item.category} · {item.status}</span></article>)}</div> : <p className="admin-card-copy">La galería opcional todavía no fue completada.</p>}
          </AdminCard>
        </div>
        <div className="admin-stack">
          <AdminCard title="Puntaje de revisión" description="Estimación visual con señales ficticias">
            <div className="admin-score"><span className="admin-score-value">{application.score}</span><div><strong>{application.score}/100</strong><p className="admin-card-copy">No es una certificación ni una garantía de calidad.</p></div></div>
            <ul className="check-list" style={{ marginTop: 20 }}>
              <li><MailCheck aria-hidden="true" size={16} /> Correo {application.emailVerified ? "verificado" : "pendiente"}</li>
              <li><PhoneCall aria-hidden="true" size={16} /> Teléfono {application.phoneVerified ? "verificado" : "pendiente"}</li>
              <li><ShieldCheck aria-hidden="true" size={16} /> Revisión documental demo</li>
            </ul>
          </AdminCard>
          <AdminCard title="Decisión de moderación" description="Se exigirá motivo y auditoría al conectar el backend">
            <ModerationDecision actions={["Aprobar", "Solicitar cambios", "Rechazar"]} resource={application.id} />
            <div className="responsibility-box" style={{ marginTop: 16 }}><CircleAlert aria-hidden="true" size={16} /><p>Las decisiones de esta demo no son persistentes ni notifican a nadie.</p></div>
          </AdminCard>
          <AdminCard title="Lista de control">
            <ul className="check-list"><li><CheckCircle2 aria-hidden="true" size={16} /> Identidad revisada</li><li><CheckCircle2 aria-hidden="true" size={16} /> Cobertura coherente</li><li><CheckCircle2 aria-hidden="true" size={16} /> Servicios declarados</li></ul>
          </AdminCard>
        </div>
      </div>
    </section>
  );
}
