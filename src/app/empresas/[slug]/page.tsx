import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { ProfessionalProfileView } from "@/components/professional-profile-view";
import { ProfileViewTracker } from "@/components/profile-view-tracker";
import { projectPublicProfessional } from "@/domain/directory";
import { getDirectoryProfessional } from "@/lib/directory/repository";
import { buildProfessionalJsonLd, buildProfessionalMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface CompanyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const professional = await getDirectoryProfessional(slug);
  return buildProfessionalMetadata(professional, "company");
}

export default async function CompanyProfilePage({ params }: CompanyPageProps) {
  const { slug } = await params;
  const professional = await getDirectoryProfessional(slug);
  if (!professional || professional.kind !== "company") notFound();
  const publicProfessional = projectPublicProfessional(professional);
  return (
    <>
      {publicProfessional.isDemo ? null : <JsonLd data={buildProfessionalJsonLd(publicProfessional)} />}
      {publicProfessional.isDemo ? null : <ProfileViewTracker slug={publicProfessional.slug} />}
      <ProfessionalProfileView professional={publicProfessional} />
    </>
  );
}
