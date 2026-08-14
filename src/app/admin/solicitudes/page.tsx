import type { Metadata } from "next";
import { AdminDemoNotice, AdminPageHeading, AdminStatus, AdminTableCard } from "@/components/admin/admin-ui";
import { DemoAction } from "@/components/admin/demo-action";
import { adminRequests, statusTone } from "@/data/admin-demo";
import { listDemoContactRequests } from "@/lib/contact-requests/demo-store";

export const metadata: Metadata = { title: "Solicitudes | Administración demo" };
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

export default function RequestsPage() {
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
