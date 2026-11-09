-- Hora exacta de envio de la solicitud (la columna fecha_solicitud solo guarda el dia).
-- Queda vacia en las filas que ya existian: no hay forma de saber a que hora se enviaron.
ALTER TABLE solicitudes ADD COLUMN creada_en TIMESTAMP WITH TIME ZONE;
