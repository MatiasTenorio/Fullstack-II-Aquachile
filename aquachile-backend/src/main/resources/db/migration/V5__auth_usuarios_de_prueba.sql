-- Usuarios ficticios de prueba (clave de todos: Aqua2026!). Solo para desarrollo y demo academica.
INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES
    ('Analista Prueba',  'analista@aquachile.test',  '$2a$10$WTXkCqcIl0ELRsz7O0FcRuKxfpLOrbnq7SHsfDDis89gJDPW7tsyq', 'ANALISTA_RECLUTAMIENTO', TRUE),
    ('Evaluador Prueba', 'evaluador@aquachile.test', '$2a$10$WTXkCqcIl0ELRsz7O0FcRuKxfpLOrbnq7SHsfDDis89gJDPW7tsyq', 'PROFESIONAL_EVALUADOR',  TRUE),
    ('Admin Prueba',     'admin@aquachile.test',     '$2a$10$WTXkCqcIl0ELRsz7O0FcRuKxfpLOrbnq7SHsfDDis89gJDPW7tsyq', 'ADMINISTRADOR',          TRUE),
    ('Jefatura Prueba',  'jefatura@aquachile.test',  '$2a$10$WTXkCqcIl0ELRsz7O0FcRuKxfpLOrbnq7SHsfDDis89gJDPW7tsyq', 'JEFATURA',               TRUE);
