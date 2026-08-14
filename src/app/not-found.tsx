import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container empty-state">
        <span className="icon-box" style={{ margin: "0 auto" }}><SearchX size={24} aria-hidden="true" /></span>
        <h1>No encontramos esta página</h1>
        <p>Puede que el perfil ya no esté disponible o que la dirección sea incorrecta.</p>
        <Link className="button button-primary" href="/tecnicos">Volver al directorio</Link>
      </div>
    </section>
  );
}
