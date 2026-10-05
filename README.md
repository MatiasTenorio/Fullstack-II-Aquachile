# AquaChile - Sistema de Gestión de Evaluaciones Psicolaborales

Proyecto de Vinculación con el Medio (VcM) — Asignatura **DSY1104 Desarrollo Full Stack II**, Duoc UC.

MVP web Full Stack para centralizar la gestión de candidatos, solicitudes de evaluación psicolaboral y evaluaciones, en reemplazo de un proceso hoy disperso entre planillas, correo y herramientas manuales del área de Reclutamiento y Selección de Aqua Chile.

> ⚠️ Proyecto académico. No reproduce automatizaciones corporativas (Microsoft Copilot, Power Automate, Planner, SharePoint) ni utiliza datos reales de candidatos o trabajadores — toda la información es ficticia o simulada.

## Contexto

- **Empresa/contraparte:** Aqua Chile (área de Reclutamiento y Selección)
- **Asignatura:** DSY1104 Desarrollo Full Stack II
- **Tipo de solución:** MVP de aplicación web Full Stack, arquitectura monolítica

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React (Vite) + Bootstrap 5 |
| Routing | React Router |
| Backend | Spring Boot |
| Base de datos | PostgreSQL |
| Testing frontend | Jasmine/Karma (pendiente de confirmar con el docente si se reemplaza por Vitest) |

## Alcance funcional

- Registro, edición y listado de candidatos
- Creación, listado, filtro y detalle de solicitudes de evaluación
- Registro de resultado y actualización de estado de una evaluación
- Dashboard con indicadores generales del proceso
- Roles: Analista de Reclutamiento, Profesional Evaluador

Estados del flujo: `Pendiente` → `En proceso` → `Finalizada`

## Requisitos previos

- Node.js 18 o superior
- npm


## Instalación y ejecución

```bash
git clone <url-del-repositorio>
cd aquachile-frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## Estructura del proyecto (frontend)

```
aquachile-frontend/
├── public/
├── src/
│   ├── assets/          # imágenes, íconos
│   ├── components/      # componentes React (formularios, listados, etc.)
│   ├── data/            # catálogos y datos mock (familias de cargo, etc.)
│   ├── App.jsx           # rutas de la aplicación
│   ├── main.jsx          # punto de entrada
│   └── App.css
├── package.json
└── README.md
```

## Flujo de ramas (Git)

- `main` — versión estable, lista para entrega
- `develop` — integración de features antes de pasar a `main`
- `feature/layout-navegacion` — barra de navegación y configuración de rutas
- `feature/candidatos` — alta, edición y listado de candidatos
- `feature/solicitudes` — listado, formulario, detalle y filtros de solicitudes
- `feature/formulario-evaluacion` — registro de evaluación y actualización de estado
- `feature/dashboard` — panel de indicadores
- `feature/testing-setup` — configuración de pruebas unitarias

Cada feature se integra a `develop` mediante pull request; `develop` se mergea a `main` en cada hito de entrega.

## Privacidad de datos

Todos los datos de candidatos usados en el desarrollo y las demostraciones son ficticios. No se utilizan nombres, RUT, correos, teléfonos ni CVs reales, y el acceso a la información queda restringido al equipo de Reclutamiento y Selección.

## Equipo

- Matías Tenorio
- Gabriel Altamirano