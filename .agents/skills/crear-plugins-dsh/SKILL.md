---
name: crear-plugins-dsh
description: "Crear, modificar y probar plugins para DeepSeek Harness con Desktop como runtime del proyecto, tarjetas de configuración y despliegues ligados al código probado. TRIGGERS: DSH Desktop, dsh-plugins, plugin DSH, settings.section, tarjeta Ajustes, ModuleLoader, deploy.ps1, ensayo Desktop."
---

# Crear plugins DSH

## Frontera: Desktop es el runtime operativo (leer primero)

- En este proyecto, la instalación operativa es DSH Desktop. Consulta la SSOT y las reglas del repositorio para confirmar versión, perfil y rutas antes de actuar.
- La instalación Web antigua está retirada. El laboratorio usa Desktop por defecto y no cambia automáticamente a Web.
- `dsh.client.platform: web` identifica el cliente que corre en el navegador interno de Desktop; no significa que el plugin use la instalación Web retirada.
- Web solo puede iniciarse mediante la opción explícita `-Modo Web`, con datos sintéticos. Un ensayo Web nunca acredita compatibilidad ni autoriza un despliegue Desktop.
- Toda prueba del harness usa un hogar, perfil y datos Electron sintéticos. NEVER copiar conversaciones, ajustes reales, claves o `.credentials.yaml` a un ensayo.
- Ajusta las pruebas al cambio: un cambio que solo afecta al host y no se va a desplegar no exige por sí mismo abrir la aplicación sintética.
- Antes de cualquier escritura en el perfil real —también si el paquete solo cambia código del host— MUST comprobar el arranque Desktop con la misma aplicación, los mismos paquetes y los mismos archivos que se desplegarán. Una ventana abierta, una prueba estática o una lista de entradas declaradas no demuestra por sí sola que cada plugin funcione.
- NEVER desplegar si el informe Desktop es negativo, incompleto, de otro runtime o ya no coincide con los archivos que se instalarán.
- NEVER cerrar, matar, iniciar ni reiniciar DSH real desde una IA. La persona dueña reinicia la aplicación desde su menú cuando el despliegue está preparado.
- Cuando una operación exija cerrar DSH y la IA viva dentro de él (tras el cierre, ya no puede continuar), MUST entregar a la persona dueña, antes de pedir el cierre, un **mensaje de relevo listo para copiar** en otra herramienta (otro IDE o chat de IA): el proyecto, el trabajo pendiente con su ficha y la sección «Reanudar en otro chat», las restricciones vigentes y cómo continuar (el siguiente paso exacto y la comprobación que lo cierra). Reutiliza esa sección de la ficha del trabajo; no inventes otro formato ni otro registro.

## Objetivo

Crear y mantener plugins de DSH sin romper la instancia del usuario. Usar los contratos reales de la versión instalada, probar el comportamiento afectado y conservar datos y cambios ajenos.

## Alcance y límites

- Aplica a los plugins propios de `dsh-plugins`, su cliente navegador y su despliegue al perfil Desktop.
- Web solo se usa para una prueba sintética que necesite explícitamente ese servidor; no es el destino operativo de este proyecto.
- No modifica el código interno del harness ni inventa APIs. Lee la versión exacta instalada y el código fuente real antes de depender de un contrato.
- Esta skill no autoriza tocar cuentas, credenciales, datos reales o el proceso vivo del harness.

## Inputs / contexto obligatorio

- Lee las reglas locales, `docs/SSOT.md`, `docs/ENTORNO-TRABAJO.md` y el README del paquete afectado.
- Inspecciona `packages/`, `deploy.ps1`, `tools/instancia-aislada.ps1` y las pruebas relacionadas antes de cambiar un contrato.
- Para APIs del harness, consulta el paquete de la versión instalada o los recursos empaquetados de la aplicación probada. Registra la versión comprobada; no uses recuerdos de versiones anteriores.
- Antes de acceder al perfil real, ejecuta `node tools/healthcheck.mjs` y `node tools/copias.mjs estado`. No leas ni imprimas valores de credenciales.

## Comportamiento esperado

- Implementa el host y el cliente con los contratos reales que ofrece la versión de Desktop instalada.
- Mantén la adaptación del navegador compatible con el runtime objetivo y no conviertas una falta de servicio en un error de arranque.
- Prueba los formularios, el guardado y los recursos que el cambio afecta; el informe global de arranque no reemplaza una prueba funcional.

### Contratos de un plugin

| Parte | Código y contrato |
|---|---|
| Host | `lib/index.js`: plugin Cordis que exporta `apply(ctx, config)`, `inject` y `name`; sus entradas se seleccionan desde la composición del perfil Desktop. |
| Cliente | `lib/client.js`, `dsh.client` y `exports['./client']`: plugin del navegador interno, cargado también dentro de Desktop. Conserva `platform: web` cuando así lo exige el formato de DSH. |

El cliente se publica mediante el `ModuleLoader` del navegador interno y se declara en `package.json` (`dsh.client` y `exports['./client']`). Comprueba el wrapper y la lista de módulos permitidos en la versión Desktop ensayada; esos contratos pueden cambiar. No añadas un bundler ni dependencias por reflejo.

- Mantén separadas las dependencias del host y del cliente. Comprueba que `dsh.client.inject`, los servicios usados y la composición del perfil coinciden; declarar un ID en un manifiesto no demuestra que el cliente se haya cargado.
- Cordis puede aislar un fallo de `inject` en vez de detener toda la aplicación. Revisa el registro del host, la consola y la tarjeta concreta cuando el arranque general parezca correcto.

### Formularios de configuración

- En Desktop, registra la entrada **directo en el hueco `settings.section`**, que es el que el armazón pinta como una página más del menú de Ajustes: `ctx.slots.inject("settings.section", () => ctx.slots.register({…}, Componente))`. El descriptor lleva `name`, `id`, `order`, `label` e `inject`, y el `id` propio hace que la entrada se AÑADA junto a General, Modelos y Plugins sin sustituir nada. Referencias vivas de este patrón, en el proyecto `dsh-plugins`: `packages/dsh-guardian/lib/client.js` y `packages/dsh-nombres-chat/lib/client.js`.
- Los datos los sirve **el propio plugin por su propia ruta**: la tarjeta no lee ámbitos y el host es quien tiene el almacén, el esquema que valida y el escritor. Si el hueco no está en la versión instalada, el cliente monta igual y lo dice por consola: la falta de una pantalla no puede tumbar el arranque.
- Un patrón que monta la tarjeta **dentro de una puerta** —a la espera de que el servicio de ajustes «sirva» la sección— es frágil y ya costó una pasada de ensayo perdida: si la puerta no se abre, la tarjeta no se registra nunca y no hay error visible. Registra sin puerta. Antes de construir una tarjeta o de usar una API del harness, **comprueba en la versión instalada que esa API existe y que el hueco se pinta**; si no existe, degrada y dilo. La lección completa está en `docs/ALTA-DE-PLUGIN.md` (del proyecto `dsh-plugins`) y no se repite aquí.
- Si el proyecto mantiene un adaptador para el servidor Web, sepáralo del camino Desktop y usa `settingsScope` solo en ese adaptador. El arranque Desktop nunca debe depender de que `settingsScope` exista.
- Al guardar, usa la API de configuración que ofrece el runtime comprobado; no supongas que existe `settings.yaml` ni escribas archivos de configuración a mano.
- Prueba la llegada tardía del hueco, el registro de una sola tarjeta y la liberación de recursos: al desmontar el cliente se retira la entrada y se libera el controlador, para que cada recarga no deje una tarjeta viva de más.

### Otros contratos

- Antes de cualquier efecto, toda ruta HTTP propia rechaza métodos distintos de `POST` y un `Content-Type` distinto de `application/json` (esto fuerza preflight en navegadores cruzados). Si están presentes tanto `Origin` como `Host`, rechaza `Origin` cuando no corresponde al mismo host; no hagas obligatorio `Origin` si no lo es en el contrato de la ruta.
- Las tarjetas editables mantienen un borrador local separado del estado publicado. Publica una copia nueva y aplica cambios por reemplazo; no expongas un objeto que el almacén pueda congelar.
- Conserva errores de configuración aislados: un fallo de una tarjeta no debe desactivar el host completo si el contrato permite degradación segura.
- Para interfaz, reutiliza componentes y estilos del proyecto; no fijes detalles visuales internos en pruebas si basta comprobar el comportamiento.

## Flujo recomendado

1. Lee las reglas del proyecto y revisa el estado Git y `.teams/`. Conserva los cambios de otras sesiones.
2. Ejecuta las pruebas focales y `node --check` para los archivos modificados. Amplía a `npm test` en un cambio transversal, una regresión de arranque o el cierre final del lote.
3. Para comprobar cambios de cliente, de arranque o de comportamiento visible, usa `pwsh tools/instancia-aislada.ps1`. El modo predeterminado es Desktop, con hogar y datos Electron sintéticos. Un cambio solo del host que no se desplegará puede validarse con sus pruebas focales sin abrir la aplicación.
4. Antes de cualquier escritura en el perfil real, ejecuta ese ensayo Desktop incluso si el paquete solo cambia código del host. Debe usar la aplicación, los paquetes y los archivos exactos que se instalarán. El ensayo requiere libre el puerto fijo del Host; si DSH real lo ocupa, prepara el resto y pide a la persona dueña que lo cierre desde su menú. La IA nunca cierra ni reinicia el proceso real. Si falta una aplicación compatible, detente con el error explicado; no uses Web como sustituto.
5. Verifica el comportamiento relevante en la aplicación sintética. El auditor CDP debe observar el inicio antes de que desaparezca la pantalla de arranque, el montaje del contenido, las entradas esperadas sin duplicados y cero errores de consola o excepciones.
6. Interpreta el informe con precisión: `__DSH_BOOT__.entries` acredita IDs declarados, no la activación individual de cada plugin. Prueba por separado cada tarjeta, ajuste o flujo que el cambio afirma corregir. Al terminar el recorrido, cierra solo la instancia sintética con `-CerrarProceso` y los campos estructurados `close` del resultado (no ejecutes texto del informe); conserva la carpeta y el informe. El informe v2 verifica identidad mientras Desktop sintético está abierto y sigue siendo válido tras el cierre seguro; el despliegue vuelve a comprobar runtime, marcadores, punteros, manifiestos y huellas. Un informe v1 o sin identidad verificada debe repetirse.
7. Si una sonda necesita el servidor Web, invócala con `-Modo Web` y datos sintéticos. No copies el hogar real; no presentes esa prueba como evidencia Desktop.
8. Antes de escribir en el perfil real, comprueba el estado y simula el alcance con `deploy.ps1 -Paquetes <nombres> -Simular`. Pasa a `-EnsayoDesktop` la ruta `evidenceReportPath` que informó el lanzador; por defecto, el archivo es `desktop-boot-evidence.json` dentro de la carpeta de prueba. Usa `-Paquetes` para el lote exacto; `-Todos` solo para una actualización completa revisada.
   Cuando la simulación confirme el lote, crea la copia previa con `node tools/copias.mjs copiar --motivo "antes del despliegue Desktop"` y usa el identificador devuelto en `-CopiaVerificada <id>`. El despliegue real exige un informe positivo del mismo runtime y de los mismos paquetes y archivos, más esa copia verificada.
9. El despliegue se ejecuta con DSH cerrado; el script debe rechazarlo si la aplicación continúa abierta. Tras escribir, ejecuta `node tools/healthcheck.mjs` y compara con la comprobación previa. Confirma que solo cambiaron los paquetes previstos y, si se desplegó `dsh-orquestador` sin `-SoloCodigo`, que `profiles/desktop/cordis.patch.yml` añade o conserva el modo Orquestador sin alterar las demás entradas. Separa las diferencias previas ajenas al lote. Avisa a la persona dueña para que reinicie desde el menú.

Si el archivo o la configuración que selecciona runtime, paquetes o punteros cambia después del ensayo, repite el ensayo. Un cambio de README o del título del PR no lo invalida.

**Al dar de alta un paquete nuevo**, la lista de los seis sitios que hay que tocar y el orden completo del despliegue están en `docs/ALTA-DE-PLUGIN.md` (del proyecto `dsh-plugins`): sin eso, el despliegue falla de uno en uno.

## Diagnóstico

- Si DSH no inicia, empieza por `node tools/rescate.mjs`; primero diagnostica sin modificar y repara una pieza cada vez.
- Si falta una tarjeta, comprueba que el cliente está declarado y cargado, que el hueco `settings.section` acepta la entrada (`ctx.slots.inject`) y que el host registra los namespaces que la tarjeta consume. Una entrada que no llega al hueco equivale a la tarjeta desaparecida sin un error visible.
- Un arranque limpio no demuestra que un formulario guarde ni que un proveedor responda. Prueba esa función con valores sintéticos y sin provocar solicitudes de pago.
- No vuelques logs o archivos que puedan contener claves, cookies, tokens, prompts o conversaciones. Para diagnosticar un archivo de claves, comprueba solo su presencia, cantidad o huella.

## Errores frecuentes

- **Usar Web como alternativa automática** — MAL: abrir el servidor Web porque no se encontró Desktop. BIEN: detener el ensayo y señalar que falta el ejecutable Desktop. EJEMPLO: el laboratorio debe acabar con error claro, no producir un informe Web.
- **Confundir `platform: web` con la instalación Web** — MAL: quitar esa etiqueta del paquete por creer que vuelve a desplegar en Web. BIEN: conservarla para el cliente navegador que también carga en Desktop.
- **Copiar el perfil real al ensayo** — MAL: copiar chats, credenciales o ajustes para que la prueba se parezca al usuario. BIEN: usar datos fabricados; el ensayo verifica contratos sin importar datos personales.
- **Dar por bueno un arranque estático** — MAL: afirmar que el plugin está activo porque el test de estructura pasó o porque el informe enumera su ID. BIEN: combinar auditoría de arranque con la prueba específica de la función.
- **Desplegar código distinto del ensayado** — MAL: editar un paquete después de crear el informe y usar el informe antiguo. BIEN: repetir el ensayo; el despliegue debe rechazar huellas que no coincidan.

## Triggers

- **Keywords:** DSH Desktop, plugin DSH, dsh-plugins, settings.section, settingsScope, ModuleLoader, perfil Desktop, despliegue DSH, ensayo aislado.
- **Patrones de usuario:** «El plugin no aparece en DSH», «¿puedes probar este cambio en Desktop?», «Actualiza el plugin en mi DSH», «Se ha roto la tarjeta de configuración»
- **Encadenamiento:** antes de `investigar-antes-de-implementar` si el contrato del harness requiere verificación; usar `validar-calidad` para el gate técnico y `configurar-github` antes de publicar.

## Ejemplos de activación

«Mi tarjeta no aparece en DSH Desktop; encuentra y corrige la causa sin tocar mis chats».
«Prueba este cambio de plugin en la instancia aislada y despliega solo el paquete afectado si coincide con el ensayo».

## Criterio de resultado bueno (gate de cierre, auto-cita)

Antes de cerrar una tarea de plugins DSH, declara como máximo estos siete puntos y cita el archivo, comando/salida o TEAM que prueba cada afirmación:

- [ ] Declaro qué versión, runtime y reglas locales comprobé; cito la versión y `docs/SSOT.md`.
- [ ] Declaro que la prueba usó datos sintéticos y no copió el hogar, conversaciones, configuración o credenciales reales; cito el comando y el informe.
- [ ] Declaro qué comportamiento concreto validé; distingo pruebas del paquete, arranque Desktop y recorrido funcional.
- [ ] Si preparé un despliegue, declaro si el informe es Desktop y coincide con runtime, paquetes y huellas; si no hubo despliegue, lo digo.
- [ ] Si escribí en el perfil real, cito la copia verificada, la simulación y el resultado de `node tools/healthcheck.mjs`; declaro el alcance exacto.
- [ ] Declaro quién reiniciará DSH y confirmo que la IA no inició, cerró ni reinició el proceso real.
- [ ] Declaro los fallos o partes no probadas y el riesgo residual; no llamo «activo» a un plugin basándome solo en su ID declarado.
