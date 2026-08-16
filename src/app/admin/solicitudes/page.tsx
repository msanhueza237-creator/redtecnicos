import type { Metadata } from "next";
import { AdminDemoNotice, AdminOperationalNotice, AdminPageHeading, AdminStatus, AdminTableCard } from "@/components/admin/admin-ui";
import { DemoAction } from "@/components/admin/demo-action";
import { adminRequests, statusTone } from "@/data/admin-demo";
import { listDemoContactRequests } from "@/lib/contact-requests/demo-store";
import { listAdminContactRequests } from "@/lib/contact-requests/private-repository";
import { isSupabaseAuthMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Solicitudes | Administración" };
export const dynamic = "force-dynamic";

const createdAtFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
});

const requestStatusLabels = {
  new: "Nueva",
  viewed: "Revisada",
  contacted: "Contactada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  completed: "Completada",
  cancelled: "Cancelada",
  expired: "Expirada",
} as const;

export default async function RequestsPage() {
  if (isSupabaseAuthMode()) {
    const liveRequests = await listAdminContactRequests();
    return (
      <section className="admin-page">
        <AdminPageHeading eyebrow="Operación real" title="Solicitudes de contacto" description="Historial privado de solicitudes registradas en Supabase y entregadas a cada profesional." />
        <AdminOperationalNotice>Esta vista contiene datos personales autorizados para gestionar el contacto. Nunca muestra tokens ni hashes de seguimiento.</AdminOperationalNotice>
        <AdminTableCard title="Historial real" description={`${liveRequests.length} ${liveRequests.length === 1 ? "solicitud registrada" : "solicitudes registradas"}`}>
          {liveRequests.length > 0 ? <table className="admin-table">
            <thead><tr><th>Solicitud</th><th>Cliente</th><th>Servicio</th><th>Profesional</th><th>Estado</th><th>Creación</th></tr></thead>
            <tbody>{liveRequests.map((request) => <tr key={request.id}>
              <td><strong>{request.id}</strong><small>{request.description}</small></td>
              <td><strong>{request.customerName}</strong><small>{request.customerEmail} · {request.emailVerified ? "verificado" : "sin verificar"}</small><small>{request.customerPhone}</small></td>
              <td>{request.service}<small>{request.commune}</small></td>
              <td>{request.professionalDisplayName}</td>
              <td><AdminStatus tone={statusTone(requestStatusLabels[request.status])}>{requestStatusLabels[request.status]}</AdminStatus></td>
              <td>{createdAtFormatter.format(new Date(request.createdAt))}</td>
            </tr>)}</tbody>
          </table> : <div className="admin-empty-state"><strong>Aún no hay solicitudes</strong><p>El historial comenzará cuando un cliente solicite contacto desde un perfil publicado.</p></div>}
        </AdminTableCard>
      </section>
    );
  }

  const capturedRequests = listDemoContactRequests();

  return (
    <section className="admin-page">
      <AdminPageHeading
        title="Solicitudes de contacto"
        description="Revisa el historial privado de solicitudes ficticias y los datos que el cliente entregó para gestionar el contacto."
      />
      <AdminDemoNotice>
        Entorno local: los datos capturados son ficticios, viven solo en memoria y se eliminan al reiniciar el servidor. Esta vista protegida nunca expone tokens ni hashes de seguimiento.
      </AdminDemoNotice>

      <AdminTableCard
        title="Capturadas en esta ejecución"
        description={`${capturedRequests.length} ${capturedRequests.length === 1 ? "solicitud registrada" : "solicitudes registradas"} desde el formulario público`}
      >
        {capturedRequests.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Solicitud</th>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Profesional</th>
                <th>Estado</th>
                <th>Creación</th>
                <th>Acción demo</th>
              </tr>
            </thead>
            <tbody>
              {capturedRequests.map((request) => (
                <tr key={request.requestId}>
                  <td>
                    <strong>{request.requestId}</strong>
                    <small>{request.description}</small>
                  </td>
                  <td>
                    <strong>{request.customerName}</strong>
                    <small>{request.customerEmail}</small>
                    {request.customerPhone ? <small>{request.customerPhone}</small> : null}
                  </td>
                  <td>
                    {request.service}
                    <small>{request.commune}</small>
                  </td>
                  <td>{request.professionalDisplayName}</td>
                  <td><AdminStatus tone={statusTone(requestStatusLabels[request.status])}>{requestStatusLabels[request.status]}</AdminStatus></td>
                  <td>{createdAtFormatter.format(new Date(request.createdAt))}</td>
                  <td><DemoAction label="Ver detalle" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="admin-empty-state">
            <strong>Aún no hay solicitudes capturadas</strong>
            <p>Completa un formulario de contacto en un perfil demo para ver aquí el registro y los datos del cliente.</p>
          </div>
        )}
      </AdminTableCard>

      <AdminTableCard title="Historial base de demostración" description={`${adminRequests.length} fixtures estáticos claramente identificados`}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Solicitud</th>
              <th>Servicio</th>
              <th>Comuna</th>
              <th>Profesional</th>
              <th>Estado</th>
              <th>Creación</th>
              <th>Acción demo</th>
            </tr>
          </thead>
          <tbody>
            {adminRequests.map((request) => (
              <tr key={request.id}>
                <td><strong>{request.id}</strong><small>Cliente demo anónimo · fixture</small></td>
                <td>{request.service}</td>
                <td>{request.commune}</td>
                <td>{request.professional}</td>
                <td><AdminStatus tone={statusTone(request.status)}>{request.status}</AdminStatus></td>
                <td>{request.created}</td>
                <td><DemoAction label="Ver detalle" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableCard>
    </section>
  );
}
