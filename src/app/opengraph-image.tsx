import { ImageResponse } from "next/og";

export const alt = "Red Técnicos Chile — Refrigeración y climatización";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "linear-gradient(135deg, #082f49 0%, #0e7490 62%, #c8ff55 160%)",
        color: "white",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: "72px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", maxWidth: "1020px" }}>
        <div style={{ color: "#c8ff55", display: "flex", fontSize: 27, fontWeight: 800, letterSpacing: 2 }}>
          RED ESPECIALIZADA EN CHILE
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 900, lineHeight: 1.05, marginTop: 24 }}>
          Encuentra técnicos de refrigeración y climatización
        </div>
        <div style={{ color: "#d9eef5", display: "flex", fontSize: 31, marginTop: 30 }}>
          Compara servicios, cobertura e información publicada antes de solicitar contacto.
        </div>
        <div style={{ alignItems: "center", display: "flex", fontSize: 27, fontWeight: 800, marginTop: 50 }}>
          <div
            style={{
              alignItems: "center",
              background: "#c8ff55",
              borderRadius: 18,
              color: "#082f49",
              display: "flex",
              height: 58,
              justifyContent: "center",
              marginRight: 18,
              width: 58,
            }}
          >
            ❄
          </div>
          redtecnicos.cl
        </div>
      </div>
    </div>,
    size,
  );
}
