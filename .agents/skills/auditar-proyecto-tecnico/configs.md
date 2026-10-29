# Configs auditables (referencia de auditar-proyecto-tecnico)

Checks verificables por tipo de config. El nucleo del metodo (frontera REPORTA, anti-patrones, metodo grep con los 4 casos trampa, gate de auto-cita) vive en [SKILL.md](SKILL.md); este archivo se ejecuta solo cuando la auditoria revisa una config concreta.

Cada item es verificable: si no puede responderse con un comando o un dato del archivo real, declararlo pendiente con motivo.

## Tailwind CSS

- [ ] `content` paths coinciden con los directorios reales de codigo fuente.
- [ ] App Router incluido cuando aplique (no solo Pages Router).
- [ ] No faltan directorios que contengan clases Tailwind.
- [ ] No hay paths obsoletos apuntando a directorios inexistentes.
- [ ] `darkMode` configurado correctamente si el proyecto soporta temas (no asumir `'class'` por defecto).
- [ ] Plugins coinciden con los que se usan realmente.

## ESLint

- [ ] No hay reglas `"off"` sin justificacion documentada.
- [ ] Las reglas activas coinciden con el nivel de riesgo del proyecto.
- [ ] No hay reglas conflictivas entre si.
- [ ] Extiende los presets apropiados (next/core-web-vitals, etc.).
- [ ] `no-unused-vars` activado (con patron de ignorar `_` si se usa).
- [ ] `react-hooks/exhaustive-deps` activado.
- [ ] `no-console` activado (al menos en `"warn"`).

## TypeScript

- [ ] `strict: true` activado.
- [ ] `noImplicitAny: true` activado (implicito con `strict`, pero verificar).
- [ ] `strictNullChecks` activado (implicito con `strict`).
- [ ] `compilerOptions` coinciden con las necesidades reales del proyecto.
- [ ] `include`/`exclude` paths correctos segun la estructura real.
- [ ] `moduleResolution` correcto para el framework usado.

## Next.js

- [ ] Headers de seguridad presentes y coherentes con los recursos externos reales (definir "correcto" contra CSP, dominios y endpoints vivos, no contra un template).
- [ ] CSP directives coinciden con los recursos externos reales cargados por la app.
- [ ] Metadata base URL correcta (no placeholders).
- [ ] Image domains configurados si se usan imagenes externas.
- [ ] `reactStrictMode` alineado con la decision del proyecto (no asumir `true` por defecto de memoria).
- [ ] `output` configurado correctamente para el tipo de despliegue.

## PostCSS

- [ ] Plugin de Tailwind presente cuando el proyecto usa Tailwind.
- [ ] No hay plugins redundantes o conflictivos.

## .gitignore

- [ ] Cubre todos los archivos generados (`.next/`, `node_modules/`, `*.tsbuildinfo`, etc.).
- [ ] Cubre archivos de entorno (`.env.local`, `.env.*.local`).
- [ ] No ignora archivos necesarios (`.env.example` debe poder commitearse).
- [ ] Cubre artifacts del IDE si corresponde.

## General de configuracion

- [ ] **[CRITICO]** No hay secrets en archivos de configuracion. Si se detecta uno (token, clave, URL privada con credenciales), escalar OBLIGATORIAMENTE a `@especialista-seguridad`; nunca dejarlo como hallazgo P3.
- [ ] No hay paths absolutos hardcoded que rompan en otras maquinas.
- [ ] `package.json` `name` refleja el nombre real del proyecto.
- [ ] Los scripts de `package.json` funcionan con el gestor de paquetes real (npm/pnpm/yarn/bun) detectado.
