import type { Metadata } from "next";
import { GalleryDemoManager } from "@/components/professional-panel/professional-panel-demo";
import { PanelDemoNotice, ProfessionalPanelHeader } from "@/components/professional-panel/professional-panel-ui";
import { demoProfessionalPanel } from "@/data/demo-professional-panel";

export const metadata: Metadata = { title: "Galería | Panel profesional demo" };

export default function ProfessionalGalleryPage() {
  return (
    <>
      <ProfessionalPanelHeader
        title="Galería"
        description="Presenta hasta tres trabajos, ordénalos y revisa su estado antes de publicarlos."
      />
      <PanelDemoNotice>
        Las tres fotografías son ilustrativas. Los controles modifican solo esta vista y no abren archivos ni transmiten datos.
      </PanelDemoNotice>
      <GalleryDemoManager gallery={demoProfessionalPanel.gallery} />
    </>
  );
}
