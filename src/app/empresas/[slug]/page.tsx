import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfessionalProfileView } from "@/components/professional-profile-view";
import { demoProfessionals, getProfessionalBySlug } from "@/data/demo-professionals";
import { projectPublicProfessional } from "@/domain/directory";

interface CompanyPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return demoProfessionals
    .filter((professional) => professional.kind === "company")
    .map((professional) => ({ slug: professional.slug }));
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const professional = getProfessionalBySlug(slug);
  return { title: professional?.kind === "company" ? professional.displayName : "Perfil no encontrado" };
}

export default async function CompanyProfilePage({ params }: CompanyPageProps) {
  const { slug } = await params;
  const professional = getProfessionalBySlug(slug);
  if (!professional || professional.kind !== "company") notFound();
  return <ProfessionalProfileView professional={projectPublicProfessional(professional)} />;
}
