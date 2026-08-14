import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfessionalProfileView } from "@/components/professional-profile-view";
import { demoProfessionals, getProfessionalBySlug } from "@/data/demo-professionals";
import { projectPublicProfessional } from "@/domain/directory";

interface ProfilePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return demoProfessionals
    .filter((professional) => professional.kind === "technician")
    .map((professional) => ({ slug: professional.slug }));
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const professional = getProfessionalBySlug(slug);
  return { title: professional?.kind === "technician" ? professional.displayName : "Perfil no encontrado" };
}

export default async function TechnicianProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params;
  const professional = getProfessionalBySlug(slug);
  if (!professional || professional.kind !== "technician") notFound();
  return <ProfessionalProfileView professional={projectPublicProfessional(professional)} />;
}
