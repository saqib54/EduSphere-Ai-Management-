# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Approved product direction

- Product name: EduSphere School & College Management System.
- Selected visual target: the first revised ideation option based on the user's School Pro video reference.
- Preserve the compact deep-navy sidebar, light blue-gray workspace, royal-blue actions, colorful KPI strip, clean bordered panels, dense readable tables, and Inter-style typography.
- Build a responsive web/PWA surface for Principal/Admin, Teacher, and Student roles with realistic Pakistani academic and PKR fee data.

## Design System (SchoolHub Prototype — adopted Oct 2026)

- **Workspace background**: `#f4f5fc` (soft lavender-white, not plain white or navy)
- **Sidebar**: White with `1px` right border; NO dark navy background.
- **Active nav item**: Orange pill `background: #f97316` (accent), white text — NOT blue gradient.
- **Sidebar nav hover**: `var(--primary-light)` `#eef1ff` tint with blue text.
- **Primary brand colour**: `#4f6ef7` (medium blue, used for buttons, links, focus rings).
- **KPI stat cards**: Colourful gradient (blue / purple / green / teal / orange / red tones).
- **Card radius**: `16px` panels, `14px` table rows / cards, `12px` input fields.
- **Input fields**: `1.5px border`, rounded `10px`, `var(--canvas)` background.
- **Button**: gradient `#4f6ef7 → #8b5cf6`, `10px` radius, prominent shadow.
- **Login screen**: Two-panel layout — left hero with purple/violet gradient, right white auth card.
- **Active tab indicator**: Orange underline `var(--accent)`.
- **Mobile**: Sidebar collapses to slide-over drawer at `≤900px`; stats stack 2-col at `≤680px`; single col at `≤480px`.
- **AI Drawer**: Dark navy-purple gradient panel fixed to right edge.

