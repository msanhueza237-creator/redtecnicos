import Image from "next/image";
import styles from "./professional-avatar.module.css";

interface ProfessionalAvatarProps {
  name: string;
  initials: string;
  imageUrl?: string;
  className?: string;
  sizes?: string;
}

export function ProfessionalAvatar({
  name,
  initials,
  imageUrl,
  className = "avatar",
  sizes = "84px",
}: Readonly<ProfessionalAvatarProps>) {
  if (!imageUrl) return <div className={className} aria-hidden="true">{initials}</div>;

  return (
    <div className={`${className} ${styles.root}`}>
      <Image alt={`Fotografía profesional de ${name}`} className={styles.image} fill sizes={sizes} src={imageUrl} />
    </div>
  );
}
