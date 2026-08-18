import { BriefcaseBusiness, MessageCircleMore, Share2, UsersRound } from "lucide-react";
import { publicSiteUrl } from "@/lib/site-url";

interface OrganicShareLinksProps {
  pathname: string;
  title: string;
  campaign: string;
}

export function OrganicShareLinks({ pathname, title, campaign }: OrganicShareLinksProps) {
  const trackedUrl = publicSiteUrl(
    `${pathname}?utm_source=share&utm_medium=organic&utm_campaign=${encodeURIComponent(campaign)}`,
  );
  const encodedUrl = encodeURIComponent(trackedUrl);
  const encodedText = encodeURIComponent(`${title} — Red Técnicos Chile`);

  const links = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      icon: MessageCircleMore,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: UsersRound,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: BriefcaseBusiness,
    },
  ] as const;

  return (
    <aside className="organic-share" aria-label="Compartir esta guía">
      <span><Share2 size={17} aria-hidden="true" /> Comparte esta guía</span>
      <div>
        {links.map(({ label, href, icon: Icon }) => (
          <a href={href} key={label} rel="noopener noreferrer" target="_blank">
            <Icon size={16} aria-hidden="true" /> {label}
          </a>
        ))}
      </div>
    </aside>
  );
}
