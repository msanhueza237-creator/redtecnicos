import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { ProfessionalProfileView } from "@/components/professional-profile-view";
import { projectPublicProfessional } from "@/domain/directory";
import { getDirectoryProfessional } from "@/lib/directory/repository";
import { buildProfessionalJsonLd, buildProfessionalMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const professional = await getDirectoryProfessional(slug);
  return buildProfessionalMetadata(professional, "technician");
}

export default async function TechnicianProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params;
  const professional = await getDirectoryProfessional(slug);
  if (!professional || professional.kind !== "technician") notFound();
  const publicProfessional = projectPublicProfessional(professional);
  return (
    <>
      {publicProfessional.isDemo ? null : <JsonLd data={buildProfessionalJsonLd(publicProfessional)} />}
      <ProfessionalProfileView professional={publicProfessional} />
    </>
  );
}
