# Análisis estático con SonarQube — Scan-go2

Documentación del análisis de calidad ejecutado sobre el proyecto **Scan-go2** con
SonarQube Community Build en local (contenedor Docker) y el scanner oficial en un
contenedor temporal.

- **Fecha del análisis:** 30/10/2026
- **Proyecto (projectKey):** `scan-go2`
- **Servidor:** SonarQube Community Build `26.10.0.133078` en `http://localhost:9000`
- **Scanner:** `sonarsource/sonar-scanner-cli:12.3.0.4285_8.1.0` (SonarScanner CLI 8.1.0.6389, Java 21)

---

## 1. Objetivo

Obtener una evaluación estática del código propio del proyecto (backend, frontend y
SQL) para detectar bugs, vulnerabilidades, code smells, duplicación y secretos
expuestos, sin modificar el código de la aplicación ni el entorno de ejecución.

---

## 2. Configuración utilizada

### 2.1 Archivo `sonar-project.properties`

Ubicado en la raíz del repositorio (`C:\Users\payne\OneDrive\Desktop\Scan-go2`):

```properties
# SonarQube - Scan-go2 (evaluacion local temporal, H2)
# El host URL y el token NO se guardan aqui: se pasan por entorno/CLI.

sonar.projectKey=scan-go2
sonar.projectName=Scan-go2
sonar.sourceEncoding=UTF-8

# Codigo fuente propio: JS del backend, JS del frontend y SQL propio.
sonar.sources=backend,frontend,database

# Dependencias, secretos, artefactos, binarios y documentacion.
sonar.exclusions=**/node_modules/**,**/.git/**,**/.env,**/.env.*,**/*.log,**/logs/**,**/coverage/**,**/dist/**,**/build/**,**/*.min.js,**/img/**,database/data/**,**/*.md
```

Decisiones relevantes:

- **El token y la URL del servidor no se guardan en el archivo**: se inyectan por
  variables de entorno en tiempo de ejecución.
- Se excluyen dependencias (`node_modules`), artefactos (`dist`, `build`,
  `coverage`), secretos (`.env*`), binarios/imágenes, logs, datos de base de datos
  (`database/data`) y documentación (`*.md`).
- Al excluir `**/*.md`, este mismo documento no se analiza.

### 2.2 Token

El token se heredó como variable de entorno temporal del proceso (`SONAR_TOKEN`).
En ningún momento se imprimió, se guardó en un archivo ni se persistió con `setx`.
Se verificó únicamente su existencia y longitud (presente, 44 caracteres).

### 2.3 Ejecución

Comando utilizado (el valor del token **no** aparece: se pasa por referencia desde
el entorno del proceso):

```powershell
docker run --rm `
  -e SONAR_TOKEN `
  -e SONAR_HOST_URL=http://host.docker.internal:9000 `
  -v "${PWD}:/usr/src" `
  sonarsource/sonar-scanner-cli:12.3.0.4285_8.1.0
```

Notas:

- `--rm` se usa **solo** para el contenedor temporal del scanner.
- `SONAR_HOST_URL` apunta a `http://host.docker.internal:9000` porque el scanner
  corre dentro de un contenedor y debe alcanzar el SonarQube publicado en el host.
- El contenedor `scan-go2-sonarqube` y sus volúmenes **no** se detienen ni se
  eliminan.

---

## 3. Resultado de la ejecución

| Elemento | Resultado |
|---|---|
| Exit code del scanner | **0** |
| `ANALYSIS SUCCESSFUL` | Sí |
| `EXECUTION SUCCESS` | Sí |
| Tiempo total del scanner | 19:13 min |
| Tiempo de análisis (engine) | 10:14 min |
| Report task (Compute Engine) | `9b28b14d-a3bf-4a4d-8724-d014e2b46cf7` |
| Estado de la tarea | **SUCCESS** (IN_PROGRESS → SUCCESS, ~4 min) |
| `analysisId` | `e296162c-499c-428b-960f-f273ab55dba1` |
| Warnings de la tarea | 0 |
| Errores de la tarea | Ninguno |
| **Quality Gate** | **OK** |
| Estado final del servidor | **UP** |

Fragmento final del log:

```text
17:40:15.376 INFO  Analysis report uploaded in 26735ms
17:40:15.591 INFO  ANALYSIS SUCCESSFUL, you can find the results at: http://host.docker.internal:9000/dashboard?id=scan-go2
17:40:15.605 INFO  More about the report processing at http://host.docker.internal:9000/api/ce/task?id=9b28b14d-a3bf-4a4d-8724-d014e2b46cf7
17:40:19.058 INFO  SonarScanner Engine completed successfully
17:40:28.073 INFO  EXECUTION SUCCESS
```

> `report-task.txt` se generó y consumió dentro del contenedor temporal. Al usar
> `--rm`, el contenedor se autoeliminó al terminar; la evidencia del envío queda en
> el log (`Analysis report uploaded` + URL de `/api/ce/task`) y en la tarea del
> Compute Engine con estado `SUCCESS`.

---

## 4. Cobertura y métricas obtenidas

Métricas consultadas a través de `/api/measures/component`:

| Métrica | Valor |
|---|---|
| Archivos analizados (`files`) | 31 |
| Líneas totales (`lines`) | 9.039 |
| Líneas de código (`ncloc`) | 7.879 |
| Sentencias (`statements`) | 4.687 |
| Funciones (`functions`) | 655 |
| Clases (`classes`) | 2 |
| Líneas de comentario (`comment_lines`) | 744 |

Detalle del proceso de indexado:

- 41 archivos preprocesados/indexados (5 lenguajes detectados: `js`, `css`, `web`,
  `json`, `docker`).
- 5 archivos ignorados por patrones de inclusión/exclusión.
- 2 directorios omitidos por exclusiones (contenido no contado).
- 34 archivos analizados por el sensor de texto y secretos.
- 29 archivos analizados por el sensor JavaScript/TypeScript/CSS.

---

## 5. Incidencias encontradas durante la ejecución

### 5.1 Primer intento fallido (exit code 3)

Antes del análisis exitoso se realizó un primer intento que **no** llegó a enviar el
reporte:

- Exit code: **3**
- El contenedor (con `--rm`) se autoeliminó, por lo que no se conservaron sus logs
  finales.
- En el servidor no apareció ningún `ce/submit` ni tarea `type=REPORT`: el reporte
  nunca se envió.
- El proceso se quedó en la fase del sensor JavaScript (descarga/despliegue del
  runtime de Node) y murió antes de generar el reporte.

**Causa probable:** saturación del host. Durante ese periodo corrían dos scanners y
SonarQube a la vez, con estos síntomas en los logs del servidor:

```text
WARN ce[][o.s.c.t.CeWorkerImpl] Compute Engine is waiting for Elasticsearch before processing tasks
WARN ce[][c.z.h.p.HikariPool] HikariPool-1 - Thread starvation or clock leap detected
WARN es[][o.e.m.j.JvmGcMonitorService] [gc][young] duration [13.3s], ... memory [174.2mb]->[130.3mb]/[512mb]
WARN es[][o.e.t.ThreadPool] timer thread slept for [13.7s/13727ms]
```

**Solución aplicada:** ejecutar **un solo** scanner a la vez y esperar a que termine,
sin relanzar análisis en paralelo ni reiniciar SonarQube.

### 5.2 Advertencia de SCM (no bloqueante)

```text
WARN SCM Publisher ... got smaller file timestamp on /usr/src (C:\), /usr/src/.git ...
```

Es una advertencia de resolución de timestamps por el montaje de Windows en Docker
(`OneDrive` + WSL2). No afecta al resultado del análisis.

### 5.3 `sonar.tests` no definido (informativo)

```text
INFO The property "sonar.tests" is not set. ...
```

El proyecto no tiene carpeta de tests configurada, por lo que Sonar usa heurísticas
para clasificar archivos como test. No es un error.

---

## 6. Acceso a los resultados

- **Dashboard del proyecto:** http://localhost:9000/dashboard?id=scan-go2
- **Tarea de procesamiento:** http://localhost:9000/api/ce/task?id=9b28b14d-a3bf-4a4d-8724-d014e2b46cf7
- **Quality Gate (API):** http://localhost:9000/api/qualitygates/project_status?projectKey=scan-go2
- **Métricas (API):** http://localhost:9000/api/measures/component?component=scan-go2&metricKeys=ncloc,files,lines

El proyecto es privado: para verlo en el navegador hay que iniciar sesión en
SonarQube. El token de análisis sirve para enviar análisis, no para navegar el
dashboard.

---

## 7. Cómo reproducir el análisis

Requisitos:

1. SonarQube en ejecución (`docker ps` debe mostrar `scan-go2-sonarqube`).
2. Servidor en estado `UP`:
   ```powershell
   (Invoke-RestMethod http://localhost:9000/api/system/status).status
   ```
3. `SONAR_TOKEN` presente en el entorno del proceso (sin imprimirlo):
   ```powershell
   if ([string]::IsNullOrEmpty($env:SONAR_TOKEN)) { "NO DISPONIBLE" } else { "OK" }
   ```
4. Ejecutar el comando de la sección 2.3 desde la raíz del repositorio.
5. Comprobar el resultado:
   ```powershell
   docker run --rm -e SONAR_TOKEN -e SONAR_HOST_URL=http://host.docker.internal:9000 -v "${PWD}:/usr/src" sonarsource/sonar-scanner-cli:12.3.0.4285_8.1.0
   ```
   y verificar en el log `EXECUTION SUCCESS`, y en la API el estado de la tarea y el
   Quality Gate.

**Recomendaciones operativas:**

- No ejecutar dos scanners en paralelo sobre el mismo proyecto.
- No reiniciar SonarQube mientras hay una tarea `REPORT` en `IN_PROGRESS`.
- Si el host está cargado, esperar a que el Compute Engine procese el reporte antes
  de lanzar otro análisis.

---

## 8. Estado del repositorio tras el análisis

`git status --short`:

```text
?? sonar-project.properties
```

Archivos creados/modificados por esta tarea:

- `sonar-project.properties` (nuevo, sin seguimiento en git)
- `frontend/Analisis_Sonarqube.md` (este documento)

No se modificó código de frontend, backend, SQL, `.env` ni `compose.yaml`. No se
realizaron commits ni push. No se detuvo SonarQube ni se eliminaron contenedores o
volúmenes del servidor.
