import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { updateRequestStatusAction } from "@/app/panel/solicitudes/actions";
import { RequestsDemoManager } from "@/components/professional-panel/professional-panel-demo";
import { PanelDemoNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";
import type { ContactRequestStatus } from "@/domain/directory";
import { listProfessionalContactRequests } from "@/lib/contact-requests/private-repository";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Solicitudes | Panel profesional" };
export const dynamic = "force-dynamic";

const labels: Record<ContactRequestStatus, string> = {
  new: "Nueva",
  viewed: "Vista",
  contacted: "Contactada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  completed: "Completada",
  cancelled: "Cancelada",
  expired: "Expirada",
};

const nextOptions: Partial<Record<ContactRequestStatus, ContactRequestStatus[]>> = {
  new: ["viewed", "contacted", "accepted", "rejected"],
  viewed: ["contacted", "accepted", "rejected"],
  contacted: ["accepted", "completed", "rejected"],
  accepted: ["completed", "rejected"],
};

export default async function ProfessionalRequestsPage() {
  if (!isSupabaseAuthMode()) {
    return <>
      <ProfessionalPanelHeader title="Solicitudes" description="Consulta la necesidad del cliente, sus canales autorizados y el estado de seguimiento." />
      <PanelDemoNotice>Ejemplo interactivo: abre SOL-DEMO-0004 y márcala como vista. Los correos `.invalid` y teléfonos indicados no son reales.</PanelDemoNotice>
      <RequestsDemoManager requests={demoProfessionalPanel.requests} />
    </>;
  }

  const requests = await listProfessionalContactRequests();
  const formatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" });

  return <>
    <ProfessionalPanelHeader title="Solicitudes" description="Historial real de clientes que solicitaron tus datos de contacto." />
    {requests.length === 0 ? <div className="professional-panel-empty"><h2>Aún no tienes solicitudes</h2><p>Las nuevas solicitudes aparecerán aquí inmediatamente después de que un cliente complete el formulario.</p></div> : <div className="professional-panel-list">
      {requests.map((request) => {
        const action = updateRequestStatusAction.bind(null, request.id);
        return <article className="professional-panel-list-item" key={request.id}>
          <div>
            <span className="professional-panel-list-meta">{request.id} · {formatter.format(new Date(request.createdAt))}</span>
            <h3>{request.service}</h3>
            <p>{request.description}</p>
            <p><strong>{request.customerName}</strong></p>
            <p><MapPin aria-hidden="true" size={16} /> {request.commune}</p>
            <p><Mail aria-hidden="true" size={16} /> {request.customerEmail} {request.emailVerified ? "· verificado" : "· pendiente de verificar"}</p>
            <p><Phone aria-hidden="true" size={16} /> {request.customerPhone}</p>
          </div>
          <div>
            <span className="professional-panel-status">{labels[request.status]}</span>
            {nextOptions[request.status]?.length ? <form action={action} className="professional-panel-actions">
              <label className="professional-panel-field"><span>Actualizar estado</span><select name="status" defaultValue={nextOptions[request.status]?.[0]}>{nextOptions[request.status]?.map((status) => <option key={status} value={status}>{labels[status]}</option>)}</select></label>
              <button className="button button-secondary" type="submit">Guardar estado</button>
            </form> : null}
          </div>
        </article>;
      })}
    </div>}
  </>;
}
