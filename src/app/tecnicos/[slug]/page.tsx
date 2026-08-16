import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfessionalProfileView } from "@/components/professional-profile-view";
import { projectPublicProfessional } from "@/domain/directory";
import { getDirectoryProfessional } from "@/lib/directory/repository";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const professional = await getDirectoryProfessional(slug);
  return { title: professional?.kind === "technician" ? professional.displayName : "Perfil no encontrado" };
}

export default async function TechnicianProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params;
  const professional = await getDirectoryProfessional(slug);
  if (!professional || professional.kind !== "technician") notFound();
  return <ProfessionalProfileView professional={projectPublicProfessional(professional)} />;
}
