-- El informe del psicologo pasa a vivir en la propia solicitud y se elimina la tabla evaluaciones.
-- La columna observaciones (sin uso) se reemplaza por los datos del informe.

ALTER TABLE solicitudes
    ADD COLUMN informe_drive_file_id  VARCHAR(255),
    ADD COLUMN informe_nombre_archivo VARCHAR(160);

-- Conserva los informes que ya se habian subido
UPDATE solicitudes s
SET informe_drive_file_id  = e.informe_drive_file_id,
    informe_nombre_archivo = e.informe_nombre_archivo
FROM evaluaciones e
WHERE e.solicitud_id = s.id;

ALTER TABLE solicitudes DROP COLUMN observaciones;
DROP TABLE evaluaciones;

-- Buscar al candidato por correo (sin distinguir mayusculas) cuando llega una solicitud nueva
CREATE INDEX idx_candidatos_correo ON candidatos (LOWER(correo));
