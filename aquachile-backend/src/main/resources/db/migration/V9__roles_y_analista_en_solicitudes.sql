-- Fase producto: quedan tres roles (analista, evaluador, administrador) y el analista crea las solicitudes.

-- El responsable de una solicitud ahora es siempre un evaluador elegido por el analista.
-- Las solicitudes abiertas que quedaron a nombre de un analista o administrador (regla antigua:
-- "responsable = quien cambio el estado") vuelven a "sin asignar" para que el analista las reasigne.
-- Las finalizadas no se tocan: conservan quien las cerro.
UPDATE solicitudes
SET responsable_id = NULL
WHERE estado <> 'FINALIZADO'
  AND responsable_id IN (SELECT id FROM usuarios WHERE rol <> 'PROFESIONAL_EVALUADOR');

-- El rol Jefatura desaparece. Sus cuentas no se borran (podrian estar referenciadas): quedan desactivadas.
UPDATE usuarios
SET rol = 'ANALISTA_RECLUTAMIENTO', activo = FALSE
WHERE rol = 'JEFATURA';

ALTER TABLE usuarios DROP CONSTRAINT chk_usuarios_rol;
ALTER TABLE usuarios ADD CONSTRAINT chk_usuarios_rol CHECK (rol IN (
    'ANALISTA_RECLUTAMIENTO',
    'PROFESIONAL_EVALUADOR',
    'ADMINISTRADOR'
));

-- Analista que creo la solicitud. Queda vacio en las solicitudes que llegaron por el formulario publico antiguo.
ALTER TABLE solicitudes ADD COLUMN analista_id BIGINT REFERENCES usuarios (id);
CREATE INDEX idx_solicitudes_analista ON solicitudes (analista_id);
