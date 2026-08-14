import type { Metadata } from "next";
import { AdminDemoNotice, AdminPageHeading, AdminStatus, AdminTableCard } from "@/components/admin/admin-ui";
import { DemoAction } from "@/components/admin/demo-action";
import { adminDocuments, statusTone } from "@/data/admin-demo";

export const metadata: Metadata = { title: "Documentos | Administración demo" };

export default function DocumentsPage() {
  return (
    <section className="admin-page">
      <AdminPageHeading title="Documentos" description="Revisa metadatos y estados de los antecedentes enviados por profesionales ficticios." />
      <AdminDemoNotice>No existen archivos reales en esta vista. En producción, los documentos serán privados, validados y analizados antes de una revisión humana.</AdminDemoNotice>
      <AdminTableCard title="Bandeja documental" description="Archivos simulados, sin descarga">
        <table className="admin-table"><thead><tr><th>Documento</th><th>Propietario</th><th>Tipo</th><th>Recepción</th><th>Vencimiento</th><th>Estado</th><th>Acción demo</th></tr></thead>
          <tbody>{adminDocuments.map((document) => <tr key={document.id}><td><strong>{document.id}</strong><small>Metadato ficticio</small></td><td>{document.owner}</td><td>{document.type}</td><td>{document.received}</td><td>{document.expires}</td><td><AdminStatus tone={statusTone(document.status)}>{document.status}</AdminStatus></td><td><DemoAction label="Revisar" /></td></tr>)}</tbody>
        </table>
      </AdminTableCard>
    </section>
  );
}
