import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";

export default function CvPreview({ url, nombreArchivo }) {
  const contenedorRef = useRef(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);
  const extension = nombreArchivo.split(".").pop().toLowerCase();

  useEffect(() => {
    if (extension !== "docx") return;
    let cancelado = false;
    setCargando(true);
    setError(false);

    fetch(url)
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error("No se pudo descargar el archivo");
        return respuesta.arrayBuffer();
      })
      .then((buffer) => {
        if (cancelado) return;
        contenedorRef.current.innerHTML = "";
        return renderAsync(buffer, contenedorRef.current);
      })
      .catch(() => {
        if (!cancelado) setError(true);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [url, extension]);

  if (extension === "pdf") {
    return (
      <iframe
        className="cv-visor"
        src={url}
        title={`Previsualización de ${nombreArchivo}`}
      />
    );
  }

  if (extension === "docx") {
    return (
      <div className="cv-visor cv-visor-docx">
        {cargando && <p className="text-center text-muted mt-4">Cargando CV...</p>}
        {error && (
          <p className="text-center text-danger mt-4">
            No se pudo mostrar el CV. Intenta descargarlo.
          </p>
        )}
        <div ref={contenedorRef} />
      </div>
    );
  }

  return (
    <p className="text-center text-muted mt-4">
      Formato no soportado para previsualización. Descarga el archivo para verlo.
    </p>
  );
}