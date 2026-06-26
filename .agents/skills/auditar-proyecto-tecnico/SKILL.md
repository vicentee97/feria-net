---
name: auditar-proyecto-tecnico
description: "Audita la salud tecnica del proyecto en dos frentes: configuracion de build tools (Tailwind, ESLint, TypeScript, Next.js, PostCSS, .gitignore) y dependencias (paquetes sin usar, redundantes o desactualizados), verificando imports reales antes de proponer cambios. TRIGGERS: auditar config, auditar dependencias, verificar configuracion, config correcta, tailwind config, eslint config, tsconfig, next config, paquetes sin usar, limpiar package.json, redundant libraries, unused packages, dependency audit, configuration audit, misconfiguration."
---

# Auditar Proyecto Tecnico

## Objetivo
Auditar la salud tecnica del proyecto detectando misconfiguraciones, settings obsoletos, paths rotos y dependencias muertas, redundantes o desactualizadas, con evidencia concreta antes de proponer cualquier cambio.

## Alcance y limites
- Incluye verificar configs de Tailwind, ESLint, TypeScript, Next.js, PostCSS y `.gitignore`.
- Incluye escanear `package.json` contra imports reales y detectar librerias redundantes.
- Incluye detectar settings desactivados que deberian estar activos y paths que no coinciden con la estructura real.
- No cambia configs ni elimina paquetes sin confirmacion o brief explicito.
- No elimina transitive deps (las que necesitan otros paquetes directos).
- No asume que un paquete esta sin usar sin comprobar imports dinamicos, configs y CLI tools.
- No ejecuta `npm audit fix` ni actualiza versiones sin confirmacion.
- No redefine estrategias de testing ni arquitectura.

## Inputs / contexto obligatorio
- Todos los archivos de configuracion en la raiz del proyecto.
- `package.json`, lockfile y scripts reales del proyecto.
- Todos los archivos fuente en `src/` o equivalentes.
- Archivos de configuracion que puedan importar paquetes (next.config, tailwind.config, eslint.config, postcss.config, etc.).
- Estructura real del proyecto.
- Build y typecheck del proyecto como verificacion final.

## Comportamiento esperado
La auditoria sigue el patron inventario -> verificacion -> reporte, sin ejecutar acciones destructivas por iniciativa propia. Reporta hallazgos por impacto, separando errores reales de mejoras opcionales, y recomienda correcciones sin editar nada salvo confirmacion o brief explicito.

### 1. Configuracion de build tools
Verificar que las configs sean correctas, completas y esten alineadas con la estructura real.

#### 1.1 Tailwind CSS
- [ ] `content` paths coinciden con los directorios reales de codigo fuente.
- [ ] App Router incluido (no solo Pages Router).
- [ ] No faltan directorios que contengan clases Tailwind.
- [ ] No hay paths obsoletos apuntando a directorios inexistentes.
- [ ] `darkMode` configurado correctamente si el proyecto soporta temas.
- [ ] Plugins coinciden con los que se usan realmente.

#### 1.2 ESLint
- [ ] No hay reglas `"off"` sin justificacion documentada.
- [ ] Las reglas activas coinciden con el nivel de riesgo del proyecto.
- [ ] No hay reglas conflictivas.
- [ ] Extiende los presets apropiados (next/core-web-vitals, etc.).
- [ ] `no-unused-vars` activado (con patron de ignorar `_` si se usa).
- [ ] `react-hooks/exhaustive-deps` activado.
- [ ] `no-console` activado (al menos en `"warn"`).

#### 1.3 TypeScript
- [ ] `strict: true` activado.
- [ ] `noImplicitAny: true` activado.
- [ ] `strictNullChecks` activado (implicito con strict).
- [ ] `compilerOptions` coinciden con las necesidades del proyecto.
- [ ] `include`/`exclude` paths correctos.
- [ ] `moduleResolution` correcto para el framework.

#### 1.4 Next.js
- [ ] `next.config.ts` headers de seguridad correctos.
- [ ] CSP directives coinciden con los recursos externos reales.
- [ ] Metadata base URL correcta (no placeholders).
- [ ] Image domains configurados si se usan imagenes externas.
- [ ] `reactStrictMode: true` activado.
- [ ] `output` configurado correctamente para el tipo de despliegue.

#### 1.5 PostCSS
- [ ] Plugin de Tailwind presente.
- [ ] No hay plugins redundantes o conflictivos.

#### 1.6 .gitignore
- [ ] Cubre todos los archivos generados (`.next/`, `node_modules/`, `*.tsbuildinfo`, etc.).
- [ ] Cubre archivos de entorno (`.env.local`, `.env.*.local`).
- [ ] No ignora archivos necesarios (`.env.example` debe poder commitearse).
- [ ] Cubre artifacts del IDE si corresponde.

#### 1.7 General de configuracion
- [ ] No hay secrets en archivos de configuracion.
- [ ] No hay paths absolutos hardcoded que rompan en otras maquinas.
- [ ] `package.json` name refleja el nombre real del proyecto.
- [ ] Los scripts de `package.json` funcionan con el gestor de paquetes real.

### 2. Dependencias
Verificar el inventario, el uso real, la redundancia y la eliminacion segura.

#### 2.1 Inventario
1. Leer `package.json` y listar todas las dependencias directas (dependencies + devDependencies).
2. Para cada dependencia, determinar su patron de importacion:
   - Nombre del paquete: `import ... from "nombre-paquete"`
   - Subpaths: `import ... from "nombre-paquete/subpath"`
   - Config files: puede usarse en next.config, tailwind.config, etc.

#### 2.2 Verificacion de uso
3. Para cada dependencia, grep en todo `src/` y archivos de config raiz por:
   - `from "nombre-paquete"` o `from 'nombre-paquete'`
   - `require("nombre-paquete")` o `require('nombre-paquete')`
   - `import "nombre-paquete"` (side effects)
4. Marcar como "usada" si encuentra al menos un import.
5. Marcar como "no encontrada" si no encuentra ningun import.
6. Para las "no encontradas", verificar:
   - ¿Se usa en algun archivo de config? (next.config.ts, tailwind.config.ts, eslint.config, postcss.config, etc.)
   - ¿Es una CLI tool? (prisma, eslint, prettier, etc.)
   - ¿Es un paquete de tipos? (@types/*)
   - ¿Es una dependencia transitive de otro paquete directo?
7. Verificar imports dinamicos (`import()`, `require(variable)`) antes de marcar como candidato.

#### 2.3 Deteccion de redundancia
8. Buscar grupos de paquetes que cubren el mismo proposito:
   - Multiples librerias de iconos (lucide-react, @phosphor-icons/react, react-icons, etc.)
   - Multiples librerias de animacion (framer-motion, react-spring, etc.)
   - Multiples librerias de formularios (react-hook-form, formik, etc.)
   - Multiples gestores de estado (zustand, redux, jotai, etc.)
9. Para cada grupo redundante, recomendar cual mantener basandose en:
   - Uso real en el codigo (cual tiene mas imports)
   - Tamano del bundle
   - Mantenimiento activo

#### 2.4 Eliminacion segura
10. Eliminar dependencias no usadas una a una.
11. Despues de cada eliminacion, ejecutar typecheck para verificar.
12. Al final, ejecutar build completo.

### 3. Validacion final
13. Ejecutar typecheck completo.
14. Ejecutar build completo.
15. Ejecutar lint.
16. Reportar: configs a corregir, paquetes eliminados, paquetes redundantes detectados, estado final y riesgo residual.

## Anti-patterns
- No borrar paquetes sin verificar grep primero.
- No eliminar transitive deps (las necesitan otros paquetes directos).
- No asumir que un paquete esta sin usar sin comprobar imports dinamicos, configs y CLI tools.
- No eliminar paquetes de tipos (@types/*) si el proyecto usa TypeScript.
- No ejecutar `npm audit fix` ni actualizar versiones sin confirmacion explicita.
- No proponer cambios de config basados en defaults genericos; contrastar con el stack y la estructura real del proyecto.

## Flujo recomendado
- [ ] Leer SSOT, stack real, archivos de configuracion y `package.json` existentes.
- [ ] Inventariar configs relevantes segun el framework detectado y dependencias directas por uso esperado.
- [ ] Contrastar paths, scripts, versiones y estructura real del proyecto.
- [ ] Buscar imports reales, usos en configuracion y herramientas CLI antes de marcar paquetes como candidatos.
- [ ] Detectar redundancias por proposito y decidir si son materialmente problematicas.
- [ ] Revisar Tailwind, ESLint, TypeScript, framework, PostCSS y `.gitignore` cuando existan.
- [ ] Proponer correcciones, eliminaciones o consolidaciones una a una, con validacion proporcional.
- [ ] Reportar hallazgos por impacto: configs a corregir, paquetes usados, no encontrados, redundantes, riesgos y checks ejecutados o pendientes.

## Criterio de resultado bueno
- La auditoria identifica configuraciones rotas, incompletas u obsoletas y dependencias muertas o redundantes con evidencia concreta.
- Ninguna dependencia se marca como eliminable sin evidencia de busqueda y revision de excepciones (CLI tools, tipos, configs, imports dinamicos, transitivas).
- Las recomendaciones distinguen paquetes muertos, herramientas CLI, tipos, configs y dependencias transitivas.
- Las recomendaciones estan alineadas con el stack real y no con defaults genericos.
- No propone cambios de arquitectura, testing o tooling fuera del alcance de configuracion y dependencias.
- El cierre deja claro que corregir, que es opcional, que validaciones faltan y que riesgo residual queda.

## Checklist rapido
- [ ] Tailwind content paths correctos
- [ ] ESLint sin reglas "off" innecesarias
- [ ] TypeScript strict activado
- [ ] Next.js metadata y CSP correctos
- [ ] .gitignore completo
- [ ] No secrets en configs
- [ ] No paths hardcoded
- [ ] Listar todas las dependencias de package.json
- [ ] Grep por cada dependencia en src/ y configs
- [ ] Verificar imports dinamicos (import(), require(variable))
- [ ] Identificar dependencias no usadas
- [ ] Identificar librerias redundantes (mismo proposito)
- [ ] Eliminar una a una, verificar typecheck tras cada una
- [ ] Build + typecheck + lint final

## Triggers
- Keywords: auditar config, auditar dependencias, verificar configuracion, config correcta, tailwind config, eslint config, tsconfig, next config, paquetes sin usar, limpiar package.json, redundant libraries, unused packages, dependency audit, configuration audit, misconfiguration
- Patrones de usuario: "audita la configuracion del proyecto y dime que esta mal", "el tailwind no funciona bien", "el lint no detecta nada", "revisa tsconfig", "audita las dependencias", "hay paquetes sin usar?", "limpiamos package.json", "por que tengo tantos paquetes?", "antes de subir revisa que no haya paquetes muertos"
- Encadenamiento: despues de `arrancar-proyecto` o como validacion pre-publicacion; si la auditoria revela documentacion desalineada, coordinar con `documentar-con-criterio`

## Ejemplos de activacion
- "Audita la configuracion del proyecto y dime que esta mal."
- "El Tailwind no detecta todas las clases, revisa el config."
- "Antes de publicar, verifica que las configs estan bien."
- "Audita las dependencias del proyecto y elimina las que no se usan."
- "Tengo 70 dependencias en package.json, muchas no se usan."
- "Antes de subir, revisa que no haya paquetes muertos."
