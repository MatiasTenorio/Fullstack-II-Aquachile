ALTER TABLE solicitudes
    ADD COLUMN cv_drive_file_id   VARCHAR(255),
    ADD COLUMN cv_nombre_archivo  VARCHAR(160);

ALTER TABLE evaluaciones
    ADD COLUMN informe_nombre_archivo VARCHAR(160);
