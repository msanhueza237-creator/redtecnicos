import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfessionalProfileView } from "@/components/professional-profile-view";
import { projectPublicProfessional } from "@/domain/directory";
import { getDirectoryProfessional } from "@/lib/directory/repository";

export const dynamic = "force-dynamic";

interface CompanyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const professional = await getDirectoryProfessional(slug);
  return { title: professional?.kind === "company" ? professional.displayName : "Perfil no encontrado" };
}

export default async function CompanyProfilePage({ params }: CompanyPageProps) {
  const { slug } = await params;
  const professional = await getDirectoryProfessional(slug);
  if (!professional || professional.kind !== "company") notFound();
  return <ProfessionalProfileView professional={projectPublicProfessional(professional)} />;
}
