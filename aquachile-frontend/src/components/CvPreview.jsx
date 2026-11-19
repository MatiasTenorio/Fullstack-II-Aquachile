import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import { adaptarCuadrosDeTexto } from "../utils/docxCuadrosTexto";
import "./CvPreview.css";

// Muestra el CV dentro de la caja: PDF con el visor del navegador y DOCX dibujado con docx-preview,
// reducido para que la página completa quepa a lo ancho (sin scroll horizontal ni zoom excesivo).
export default function CvPreview({ url, nombreArchivo }) {
  const extension = (nombreArchivo ?? "").split(".").pop().toLowerCase();

  if (extension === "pdf") {
    return <iframe className="cv-pdf" src={url} title="Previsualización del CV" />;
  }
  if (extension === "docx") {
    return <VisorDocx url={url} />;
  }
  return (
    <p className="text-muted p-3 m-0">
      No se puede previsualizar este formato ({extension || "desconocido"}). Usa el botón Descargar CV.
    </p>
  );
}

function VisorDocx({ url }) {
  const visor = useRef(null); // caja que se ve en pantalla
  const marco = useRef(null); // tiene el tamaño del documento ya reducido
  const contenido = useRef(null); // aquí docx-preview dibuja el documento a tamaño real
  const [error, setError] = useState("");
  // true si el documento usaba cuadros de texto flotantes y se muestra reordenado
  const [adaptado, setAdaptado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    let observador = null;

    const ajustar = () => {
      const hoja = contenido.current?.querySelector(".docx-wrapper");
      if (!hoja || !visor.current) return;
      const anchoReal = hoja.scrollWidth;
      const altoReal = hoja.scrollHeight;
      const escala = Math.min(1, visor.current.clientWidth / anchoReal);
      contenido.current.style.transform = `scale(${escala})`;
      marco.current.style.width = `${anchoReal * escala}px`;
      marco.current.style.height = `${altoReal * escala}px`;
    };

    setError("");
    setAdaptado(false);
    fetch(url)
      .then((r) => r.blob())
      // docx-preview no sabe ubicar los cuadros de texto flotantes: se pasan a párrafos normales antes de dibujar
      .then((original) => adaptarCuadrosDeTexto(original))
      .then(({ blob, adaptado: fueAdaptado }) => {
        if (cancelado) return null;
        setAdaptado(fueAdaptado);
        contenido.current.innerHTML = "";
        return renderAsync(blob, contenido.current, null, { className: "docx", inWrapper: true });
      })
      .then(() => {
        if (cancelado) return;
        ajustar();
        observador = new ResizeObserver(ajustar);
        observador.observe(visor.current);
      })
      .catch(() => {
        if (!cancelado) setError("No se pudo mostrar el CV. Usa el botón Descargar CV.");
      });

    return () => {
      cancelado = true;
      observador?.disconnect();
    };
  }, [url]);

  return (
    <div className="cv-docx-visor" ref={visor}>
      {error && <p className="text-danger p-3 m-0">{error}</p>}
      {adaptado && !error && (
        <p className="cv-docx-aviso">
          Vista adaptada: este CV usa cuadros de texto, así que se muestra su contenido en orden. Para ver el diseño
          original, usa Descargar CV.
        </p>
      )}
      <div className="cv-docx-marco" ref={marco}>
        <div className="cv-docx-contenido" ref={contenido} />
      </div>
    </div>
  );
}
