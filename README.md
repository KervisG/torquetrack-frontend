# TorqueTrack Diesel — frontend (Vite + React + TypeScript)

SPA de TorqueTrack: tienda, portal de cliente y panel de administración.
Consume la API REST del backend Django (`backend/`). Usa Vite, React,
TypeScript, Tailwind CSS y shadcn/ui; las rutas se declaran en
`src/routes.tsx` y cada pantalla vive en `src/features/*`.

## Desarrollo local

```bash
pnpm install
pnpm dev
```

## Tests

```bash
pnpm test          # vitest run
pnpm exec vitest    # modo watch
```

## Tipos, lint y build

```bash
pnpm exec tsc -b
pnpm lint
pnpm build
```

## Agregar primitivas de shadcn/ui

```bash
pnpm dlx shadcn@latest add <component>
```

`components.json` ya está configurado (alias y variables CSS de Tailwind).

---

_Generado con `pnpm create vite@latest frontend --template react-ts`; las
secciones siguientes son las notas por defecto de la plantilla de Vite._

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
