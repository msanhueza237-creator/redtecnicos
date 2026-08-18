import type { Metadata } from "next";
import { GalleryDemoManager } from "@/components/professional-panel/professional-panel-demo";
import { ProfessionalGalleryManager } from "@/components/professional-panel/professional-gallery-manager";
import { PanelDemoNotice, PanelOperationalNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";
import { getAppSession } from "@/lib/auth/session";
import { listProfessionalGallery } from "@/lib/professional/gallery";

export const metadata: Metadata = { title: "Galería | Panel profesional" };
export const dynamic = "force-dynamic";

export default async function ProfessionalGalleryPage() {
  const session = await getAppSession();
  if (session?.source === "supabase" && session.userId) {
    const result = await listProfessionalGallery(session.userId);
    return (
      <>
        <ProfessionalPanelHeader
          title="Galería"
          description="Presenta hasta cinco trabajos reales y revisa su estado de moderación."
        />
        <PanelOperationalNotice>
          Las fotografías se guardan de forma privada, se optimizan para eliminar metadatos y solo aparecen públicamente después de ser aprobadas.
        </PanelOperationalNotice>
        {result.error ? <div className="professional-panel-notice is-danger" role="alert"><p>{result.error}</p></div> : null}
        <ProfessionalGalleryManager initialItems={result.data} />
      </>
    );
  }

  return (
    <>
      <ProfessionalPanelHeader
        title="Galería"
        description="Presenta hasta cinco trabajos, ordénalos y revisa su estado antes de publicarlos."
      />
      <PanelDemoNotice>
        Las tres fotografías son ilustrativas. Los controles modifican solo esta vista y no abren archivos ni transmiten datos.
      </PanelDemoNotice>
      <GalleryDemoManager gallery={demoProfessionalPanel.gallery} />
    </>
  );
}
