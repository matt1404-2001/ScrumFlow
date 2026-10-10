# Decisiones funcionales y reglas generales del sistema

| Campo | Valor |
| --- | --- |
| **Proyecto** | Sistema web de apoyo a la metodología Scrum |
| **Versión** | 1 |
| **Fecha** | 09/10/2026 |
| **Estado** | Pendiente de revisión y aprobación |

## Propósito

Este documento establece las decisiones funcionales y las reglas generales que deberán mantenerse coherentes en los casos de uso, las pantallas, la API y la base de datos.

La solución debe continuar siendo minimalista, funcional y desplegable para usuarios reales. Estas reglas no crean nuevos módulos ni submódulos y no deben interpretarse como casos de uso independientes.

## Distinción entre Scrum y decisiones de la aplicación

- Scrum establece los eventos, artefactos, compromisos y responsabilidades principales del marco de trabajo.
- El profesor solicitó además funciones propias de una aplicación, como asistencia, interacción durante la Daily Scrum, responsables, prioridades y fechas.
- Las tarjetas de trabajo del Sprint permiten registrar fecha de inicio y fecha límite por solicitud del profesor; estas fechas pertenecen a la ejecución del Sprint y no al elemento mientras permanece pendiente en el Product Backlog. Scrum no exige fechas individuales para cada elemento.
- Para este sistema, un Sprint tendrá una duración máxima exacta de cuatro semanas, equivalentes a 28 días naturales.

---

## 1. Registro y acceso de usuarios

### Decisión

- Cualquier persona puede registrarse con nombre, correo electrónico, contraseña y confirmación de contraseña.
- El correo se normaliza y debe ser único.
- La contraseña debe contener al menos 12 caracteres, un número y un símbolo.
- La contraseña se almacena mediante un hash seguro de una sola vía con sal única, nunca como texto visible ni mediante cifrado reversible.
- La cuenta queda activa inmediatamente después del registro.
- Después del registro, el usuario es dirigido al inicio de sesión; el registro no inicia sesión automáticamente.
- El sistema permite iniciar y cerrar sesión.
- La recuperación de contraseña y la verificación del correo quedan fuera del alcance inicial.

### Justificación

Esta solución permite desplegar y utilizar realmente la aplicación sin depender de cuentas precargadas ni de un servicio externo de correo.

### Regla funcional resultante

Registrar una cuenta identifica a una persona dentro del sistema, pero no crea proyectos ni la incorpora automáticamente a un equipo Scrum.

### Submódulos afectados

- 1.1 Registrar usuario.
- 1.2 Iniciar sesión.

---

## 2. Creación y propiedad de proyectos

### Decisión

- Cualquier usuario autenticado puede crear un proyecto.
- El creador se convierte automáticamente en miembro y administrador técnico inicial del proyecto, sin recibir una responsabilidad Scrum automática.
- El administrador puede modificar el nombre y la descripción del proyecto.
- El administrador configura la Definition of Done.
- El proyecto puede tener más de un administrador si un administrador actual concede esa condición a otro miembro.
- Un proyecto nunca puede quedar sin al menos un administrador.
- La eliminación definitiva de proyectos queda fuera del alcance inicial.

### Justificación

La propiedad queda claramente definida sin introducir organizaciones, departamentos, supervisores globales o administración empresarial.

### Regla funcional resultante

Crear un proyecto otorga administración técnica sobre ese proyecto, pero no asigna automáticamente las responsabilidades de Product Owner o Scrum Master.

### Submódulos afectados

- 1.3 Gestionar proyecto Scrum.
- 1.4 Gestionar equipo Scrum y acuerdos.

---

## 3. Ingreso de usuarios a un equipo

### Decisión

Se utilizará una invitación interna dirigida al correo exacto de un usuario registrado:

1. Un administrador introduce el correo del usuario.
2. El sistema busca una cuenta registrada con ese correo normalizado.
3. Si la cuenta existe, crea una invitación pendiente dentro de la aplicación.
4. El usuario invitado puede aceptar o rechazar la invitación después de iniciar sesión.
5. Al aceptarla, se convierte en miembro del proyecto sin recibir una responsabilidad Scrum automática.
6. Un administrador asigna posteriormente las responsabilidades Scrum que correspondan.

No se enviarán correos electrónicos ni se mostrará un directorio público de usuarios. Si el correo no está registrado, el sistema indicará que la persona debe crear primero una cuenta.

### Justificación

La invitación interna evita incorporar usuarios sin su consentimiento y no requiere integrar un servicio externo de correo.

### Regla funcional resultante

Un usuario solo pasa a formar parte del equipo después de aceptar una invitación interna.

### Submódulos afectados

- 1.1 Registrar usuario.
- 1.2 Iniciar sesión.
- 1.4 Gestionar equipo Scrum y acuerdos.
- 4.1 Consultar estado y guía del proyecto.

---

## 4. Responsabilidades Scrum y permisos técnicos

### Decisión

Los permisos técnicos y las responsabilidades Scrum serán conceptos diferentes.

#### Permisos técnicos

- **Administrador del proyecto:** configura el proyecto, integrantes, invitaciones, responsabilidades, Definition of Done y transiciones administrativas importantes del Sprint.
- **Miembro del proyecto:** participa en el Product Backlog, el Sprint y los eventos Scrum.

#### Responsabilidades Scrum

- Product Owner.
- Scrum Master.
- Developer.

Las responsabilidades Scrum indican quién responde por cada parte del proceso, pero no constituyen un sistema general de autorización.

Antes de activar un Sprint debe existir exactamente un Product Owner, exactamente un Scrum Master y al menos un Developer. Una persona puede desempeñar más de una responsabilidad Scrum.

### Justificación

La separación evita convertir las responsabilidades de Scrum en una matriz compleja de permisos técnicos.

### Regla funcional resultante

Todos los miembros pueden colaborar en el trabajo operativo. Los administradores controlan la configuración, los integrantes y las transiciones sensibles.

### Submódulos afectados

- 1.4 Gestionar equipo Scrum y acuerdos.
- 2.1 Gestionar Product Backlog.
- 2.2 Refinar Product Backlog.
- 3.1 Planificar Sprint.
- 3.2 Gestionar trabajo del Sprint.
- 4.2 Registrar Daily Scrum.
- 4.3 Registrar Sprint Review.
- 4.4 Registrar Sprint Retrospective.

---

## 5. Product Backlog

### Decisión

- Todos los miembros pueden crear, consultar y editar elementos.
- Todos los miembros pueden colaborar en el refinamiento y en el ordenamiento.
- El sistema debe señalar que el Product Owner conserva la responsabilidad sobre el Product Goal y el orden final del Product Backlog.
- Los Developers conservan la responsabilidad conceptual de la estimación, aunque no se bloqueará el campo para los demás miembros.
- Solo un administrador puede retirar un elemento del backlog.
- Un elemento que nunca participó en un Sprint puede eliminarse.
- Un elemento con historial de Sprint no se elimina físicamente; se marca como retirado para conservar el historial.

La separación funcional será la siguiente:

- **Gestionar Product Backlog:** mantener el Product Goal, crear, consultar, editar, ordenar y retirar elementos.
- **Refinar Product Backlog:** aclarar, detallar criterios, estimar, dividir y preparar elementos.

Ambas funciones compartirán la misma pantalla y el mismo panel de detalle.

### Justificación

Se conserva la responsabilidad del Product Owner sin impedir la colaboración ni implementar permisos por cada campo.

### Regla funcional resultante

Gestionar mantiene el conjunto y orden del trabajo; refinar mejora la preparación de elementos existentes. Refinar no constituye otra reunión formal.

### Submódulos afectados

- 2.1 Gestionar Product Backlog.
- 2.2 Refinar Product Backlog.

---

## 6. Modelo de elemento de trabajo

### Decisión

El sistema utilizará un único tipo principal denominado **Elemento del Product Backlog**.

La información del mismo elemento se completa progresivamente según su contexto:

- **En el Product Backlog:** título, descripción, orden y prioridad.
- **Durante el refinamiento:** estimación, criterios de aceptación, aclaraciones y posibles divisiones.
- **Durante la planificación:** Sprint seleccionado y relación con el Sprint Goal.
- **Durante la ejecución del Sprint:** responsable, estado del tablero, fecha de inicio, fecha límite, checklist, comentarios e impedimentos.
- **Como información permanente:** identificador e historial de participación en Sprints.

Los campos de fecha funcionarán de esta forma:

- El usuario puede registrar una fecha de inicio, una fecha límite o ambas únicamente cuando el elemento forma parte de un Sprint.
- Un elemento pendiente de planificación en el Product Backlog no tiene fechas de ejecución.
- Si se informan ambas, la fecha de inicio no puede ser posterior a la fecha límite.
- Las fechas, si se informan, deben encontrarse dentro del intervalo del Sprint al que pertenece el elemento.
- Las fechas no cambian automáticamente el estado del elemento.
- La fecha límite vencida genera una advertencia, pero no mueve ni termina automáticamente el trabajo.

El elemento nace en el Product Backlog. Al seleccionarse para un Sprint, el mismo elemento aparece como tarjeta del tablero y puede recibir datos de ejecución. Los pasos menores se representan mediante checklist dentro del Sprint. No se implementarán inicialmente épicas, historias, tareas y subtareas como entidades diferentes.

### Justificación

Un único modelo cubre el objetivo académico, permite asignar fechas y evita relaciones, formularios y reglas duplicadas.

### Regla funcional resultante

Un elemento no se copia al pasar al Sprint; se asocia con este y cambia su contexto de visualización.

### Submódulos afectados

- 2.1 Gestionar Product Backlog.
- 2.2 Refinar Product Backlog.
- 3.1 Planificar Sprint.
- 3.2 Gestionar trabajo del Sprint.

---

## 7. Ciclo de vida del Sprint

### Decisión

El Sprint tendrá cuatro estados:

1. **Borrador:** se realiza la planificación.
2. **Activo:** se ejecuta el trabajo y se registran Dailies.
3. **En cierre:** se detiene la ejecución y se realizan Review y Retrospectiva.
4. **Finalizado:** queda disponible en el historial.

Para activar un Sprint se debe cumplir lo siguiente:

- No existe otro Sprint no finalizado.
- Existe exactamente un Product Owner.
- Existe exactamente un Scrum Master.
- Existe al menos un Developer.
- Existe un Product Goal.
- Existe una Definition of Done.
- El Sprint Goal está definido.
- Las fechas son válidas.
- La duración planificada no supera cuatro semanas o 28 días naturales.
- Existe al menos un elemento seleccionado.
- Los elementos seleccionados tienen título, descripción y estimación.
- Un administrador confirma la activación.

Solo puede existir un Sprint no finalizado por proyecto, ya sea Borrador, Activo o En cierre.

Cuando se inicia el cierre:

- El tablero deja de aceptar cambios operativos.
- Se determina qué elementos están terminados.
- Se habilita la Sprint Review.
- La Retrospectiva permanece pendiente hasta concluir la Review.

El Sprint pasa a Finalizado después de completar la Retrospectiva y confirmar el cierre.

### Justificación

Los cuatro estados permiten representar todo el ciclo sin crear módulos adicionales. El límite de cuatro semanas implementa expresamente la regla indicada por el profesor.

### Regla funcional resultante

Todo Sprint tiene un intervalo definido, con una duración máxima de 28 días naturales y sin superposición con otro Sprint no finalizado del mismo proyecto.

### Submódulos afectados

- 3.1 Planificar Sprint.
- 3.2 Gestionar trabajo del Sprint.
- 4.1 Consultar estado y guía del proyecto.
- 4.3 Registrar Sprint Review.
- 4.4 Registrar Sprint Retrospective.

---

## 8. Trabajo incompleto

### Decisión

- Al finalizar el Sprint, los elementos no terminados regresan al Product Backlog.
- No pasan automáticamente al siguiente Sprint.
- El elemento conserva su descripción, prioridad, orden, estimación y criterios de aceptación.
- Los datos de la ejecución anterior, incluyendo responsable, estado, fechas, checklist y comentarios, se conservan en el historial del Sprint finalizado, pero no permanecen activos en el Product Backlog.
- La asignación, el estado del tablero y las fechas de ejecución se limpian para permitir una nueva planificación.
- El historial conserva que el elemento participó en el Sprint anterior sin completarse.
- El Product Owner y el equipo pueden reordenarlo, refinarlo o retirarlo.

### Justificación

Esta decisión evita asumir que todo trabajo incompleto continúa siendo prioritario y conserva la evidencia histórica.

### Regla funcional resultante

Cada elemento incompleto requiere una nueva decisión antes de incorporarse a otro Sprint.

### Submódulos afectados

- 2.1 Gestionar Product Backlog.
- 2.2 Refinar Product Backlog.
- 3.1 Planificar Sprint.
- 3.2 Gestionar trabajo del Sprint.
- 4.4 Registrar Sprint Retrospective.

---

## 9. Definition of Done

### Decisión

- Se configura en el proyecto como una lista breve de criterios.
- Al activar un Sprint, se conserva una copia de la Definition of Done vigente para ese Sprint.
- Al mover un elemento a Terminado, el sistema muestra esos criterios.
- El usuario debe confirmar su cumplimiento.
- El sistema registra quién realizó la confirmación y cuándo.
- La aplicación no intenta comprobar automáticamente criterios abstractos como calidad del código, pruebas o despliegue.
- Si un elemento vuelve a abrirse, deja de considerarse parte del incremento hasta que vuelva a terminarse.

### Justificación

Se proporciona evidencia y guía sin simular comprobaciones técnicas que la aplicación no puede realizar.

### Regla funcional resultante

Ningún elemento forma parte del incremento sin una confirmación explícita de la Definition of Done.

### Submódulos afectados

- 1.4 Gestionar equipo Scrum y acuerdos.
- 3.1 Planificar Sprint.
- 3.2 Gestionar trabajo del Sprint.
- 4.3 Registrar Sprint Review.

---

## 10. Daily Scrum

### Decisión

La Daily Scrum será un espacio de interacción asociado con un Sprint activo y una fecha.

- Se permite una Daily por día laboral y Sprint activo.
- El sistema muestra la Daily del día como disponible.
- El primer miembro que accede crea el registro si todavía no existe.
- Cada usuario selecciona la opción **Unirse**.
- El sistema registra automáticamente su asistencia y hora de ingreso.
- Los participantes pueden publicar mensajes o actualizaciones.
- Una actualización puede relacionarse con un elemento del Sprint.
- Un mensaje puede marcarse como impedimento.
- La sesión conserva autores, contenidos y horas.
- Los ausentes se calculan comparando los participantes con los integrantes esperados.
- La lista de integrantes esperados se conserva para que cambios futuros del equipo no alteren el historial.
- La Daily puede cerrarse manualmente o automáticamente al terminar el día.
- No se requiere videollamada.
- La actualización instantánea del chat puede decidirse técnicamente después; funcionalmente los mensajes deben enviarse y consultarse.

### Justificación

La solución satisface el requisito del profesor sin construir una plataforma compleja de comunicación.

### Regla funcional resultante

Solo se registra como asistente quien utiliza la acción Unirse; consultar posteriormente el historial no modifica la asistencia.

### Submódulos afectados

- 3.2 Gestionar trabajo del Sprint.
- 4.1 Consultar estado y guía del proyecto.
- 4.2 Registrar Daily Scrum.

---

## 11. Sprint Review y Sprint Retrospective

### Decisión

Se utilizará una pantalla de **Cierre del Sprint** con dos pasos diferentes.

### Paso 1: Sprint Review

- Muestra el Sprint Goal.
- Calcula el incremento a partir de los elementos terminados.
- Permite registrar asistentes.
- Permite registrar resultados, retroalimentación y decisiones.
- Permite crear o actualizar elementos del Product Backlog.
- Debe marcarse como completada antes de concluir la Retrospectiva.

Los stakeholders externos no necesitarán una cuenta inicialmente. Un miembro podrá registrar sus nombres y retroalimentación.

### Paso 2: Sprint Retrospective

- Registra qué funcionó bien.
- Registra problemas.
- Registra propuestas y acciones de mejora.
- Una acción puede convertirse en elemento del Product Backlog.
- Al completarla, un administrador confirma la finalización del Sprint.

### Justificación

Se respetan los propósitos diferentes de ambos eventos sin construir pantallas y flujos completamente aislados.

### Regla funcional resultante

El orden obligatorio es Sprint Review, Sprint Retrospective y Sprint finalizado.

### Submódulos afectados

- 2.1 Gestionar Product Backlog.
- 3.2 Gestionar trabajo del Sprint.
- 4.3 Registrar Sprint Review.
- 4.4 Registrar Sprint Retrospective.

---

## 12. Historial

### Decisión

- Los Sprints finalizados se consultan desde la misma área de Sprint mediante un selector de historial.
- Las Dailies se consultan desde el historial de reuniones del Sprint.
- La Review y la Retrospectiva se consultan desde el cierre del Sprint correspondiente.
- Los registros finalizados son de solo lectura.
- Se conservan participantes, ausentes, mensajes, resultados y acciones.
- No se registra un historial detallado de cada edición del sistema.
- No se crea un módulo de auditoría.

### Justificación

Se conserva la evidencia académica y se pueden revisar Sprints anteriores sin implementar una auditoría empresarial.

### Regla funcional resultante

Finalizar un evento o Sprint conserva una representación histórica que no puede sobrescribirse.

### Submódulos afectados

- 3.2 Gestionar trabajo del Sprint.
- 4.2 Registrar Daily Scrum.
- 4.3 Registrar Sprint Review.
- 4.4 Registrar Sprint Retrospective.

---

## 13. Asistente o guía Scrum

### Decisión

La guía utilizará reglas ordenadas calculadas a partir de los datos actuales:

1. Si el usuario tiene una invitación pendiente, recomendar revisarla.
2. Si no pertenece a ningún proyecto, recomendar crear uno o esperar una invitación.
3. Si el proyecto no tiene equipo o responsabilidades completas, recomendar configurarlas.
4. Si falta la Definition of Done, recomendar definirla.
5. Si falta el Product Goal o el backlog está vacío, recomendar preparar el Product Backlog.
6. Si existe un Sprint borrador incompleto, indicar qué falta para activarlo.
7. Si no existe un Sprint actual, recomendar planificarlo.
8. Si existe un Sprint activo y es un día laboral sin Daily, recomendar registrar la Daily.
9. Si existen impedimentos abiertos, mostrarlos como alerta.
10. Si faltan dos días o menos para finalizar el Sprint, recomendar preparar su cierre.
11. Si la fecha final llegó y el Sprint continúa activo, recomendar iniciar el cierre.
12. Si el Sprint está En cierre y falta la Review, recomendar realizarla.
13. Si la Review terminó y falta la Retrospectiva, recomendar realizarla.
14. Si el Sprint finalizó, recomendar refinar el backlog y planificar el siguiente.

El sistema puede mostrar una recomendación principal y alertas secundarias. Las recomendaciones no se almacenan como datos permanentes.

### Justificación

Estas reglas son fáciles de implementar, comprobar y explicar, y no requieren inteligencia artificial.

### Regla funcional resultante

La guía orienta al usuario hacia la pantalla correspondiente, pero no modifica información ni ejecuta acciones automáticamente.

### Submódulos afectados

- Principalmente 4.1 Consultar estado y guía del proyecto.
- Utiliza información generada por los demás submódulos.

---

# Reglas generales consolidadas

## Usuarios y acceso

- **RN-01.** Cualquier persona puede crear una cuenta desde la aplicación.
- **RN-02.** El registro requiere nombre, correo, contraseña y confirmación.
- **RN-03.** El correo debe normalizarse y ser único sin distinguir mayúsculas y minúsculas.
- **RN-04.** La contraseña debe tener al menos 12 caracteres, un número y un símbolo.
- **RN-05.** La contraseña debe almacenarse mediante un hash seguro de una sola vía con sal única.
- **RN-06.** La cuenta queda activa inmediatamente después del registro.
- **RN-07.** Registrarse no inicia sesión ni incorpora al usuario a proyectos.
- **RN-08.** El inicio de sesión crea una sesión segura y el cierre de sesión la invalida.
- **RN-09.** La recuperación de contraseña y la verificación del correo quedan fuera del alcance inicial.

## Proyectos y equipo

- **RN-10.** Cualquier usuario autenticado puede crear un proyecto.
- **RN-11.** El creador se convierte en miembro y administrador inicial, sin recibir automáticamente una responsabilidad Scrum.
- **RN-12.** Todo proyecto debe conservar al menos un administrador.
- **RN-13.** Solo un administrador puede modificar la información general, el equipo, las responsabilidades y la Definition of Done.
- **RN-14.** La eliminación definitiva de proyectos queda fuera del alcance inicial.
- **RN-15.** Los nuevos integrantes ingresan mediante una invitación interna dirigida a un correo registrado.
- **RN-16.** Una invitación debe ser aceptada antes de crear la membresía.
- **RN-17.** Una persona no puede tener dos membresías ni dos invitaciones pendientes en el mismo proyecto.
- **RN-18.** Al aceptar una invitación, el usuario se convierte en miembro sin responsabilidad Scrum hasta que un administrador se la asigne.

## Responsabilidades y permisos

- **RN-19.** Administrador y miembro son permisos técnicos independientes de las responsabilidades Scrum.
- **RN-20.** Product Owner, Scrum Master y Developer representan responsabilidades del proceso, no perfiles generales de seguridad.
- **RN-21.** Antes de activar un Sprint debe existir exactamente un Product Owner, exactamente un Scrum Master y al menos un Developer.
- **RN-22.** Una misma persona puede desempeñar más de una responsabilidad Scrum.
- **RN-23.** Todos los miembros pueden consultar y colaborar en el trabajo operativo del proyecto.
- **RN-24.** Las transiciones administrativas importantes del Sprint requieren confirmación de un administrador.

## Product Backlog y elementos

- **RN-25.** El Product Goal forma parte del Product Backlog.
- **RN-26.** Los miembros pueden crear, consultar, editar, ordenar y refinar elementos.
- **RN-27.** El Product Owner conserva la responsabilidad sobre el Product Goal y el orden final del Product Backlog.
- **RN-28.** Los Developers conservan la responsabilidad de la estimación.
- **RN-29.** Solo un administrador puede retirar definitivamente un elemento de la vista activa del backlog.
- **RN-30.** Un elemento con historial de Sprint no se elimina físicamente; se marca como retirado.
- **RN-31.** Refinar consiste en mejorar la claridad, detalle, tamaño y preparación de elementos; no constituye otra reunión formal.
- **RN-32.** El sistema utiliza un único tipo principal de elemento de trabajo.
- **RN-33.** Los pasos menores de un elemento seleccionado para un Sprint se representan mediante checklist.
- **RN-34.** Seleccionar un elemento para un Sprint lo asocia con ese Sprint sin crear una copia.
- **RN-35.** Un elemento no puede pertenecer simultáneamente a dos Sprints no finalizados.
- **RN-36.** Un elemento solo permite registrar fecha de inicio y fecha límite cuando se encuentra asociado con un Sprint; mientras está pendiente en el Product Backlog no tiene fechas de ejecución.
- **RN-37.** Si un elemento contiene ambas fechas, la fecha de inicio no puede ser posterior a la fecha límite.
- **RN-38.** Las fechas informadas de un elemento seleccionado para un Sprint deben encontrarse dentro del intervalo del Sprint.
- **RN-39.** Las fechas de un elemento no cambian automáticamente su estado.
- **RN-40.** Una fecha límite vencida genera una advertencia, pero no termina ni mueve automáticamente el elemento.

## Sprint y Definition of Done

- **RN-41.** Los estados del Sprint son Borrador, Activo, En cierre y Finalizado.
- **RN-42.** Solo puede existir un Sprint no finalizado por proyecto.
- **RN-43.** Todo Sprint debe tener fecha de inicio y fecha de finalización.
- **RN-44.** La duración de un Sprint no puede superar cuatro semanas o 28 días naturales.
- **RN-45.** Un Sprint solo puede activarse si cumple las condiciones de equipo, objetivos, fechas, Definition of Done y trabajo seleccionado.
- **RN-46.** El tablero de un Sprint activo utiliza los estados Pendiente, En progreso y Terminado.
- **RN-47.** Al iniciar el cierre, el tablero queda bloqueado para cambios operativos.
- **RN-48.** Los elementos incompletos regresan al Product Backlog al finalizar el Sprint.
- **RN-49.** El trabajo incompleto no pasa automáticamente al siguiente Sprint.
- **RN-50.** El historial conserva en qué Sprint participó un elemento incompleto.
- **RN-51.** Los elementos terminados que cumplen la Definition of Done constituyen el incremento.
- **RN-52.** La Definition of Done se configura como una lista de criterios del proyecto.
- **RN-53.** Cada Sprint conserva una copia de la Definition of Done vigente al activarse.
- **RN-54.** Marcar un elemento como Terminado requiere confirmar manualmente la Definition of Done.
- **RN-55.** La confirmación registra usuario y fecha, pero no sustituye comprobaciones técnicas externas.

## Eventos e historial

- **RN-56.** Solo puede existir una Daily por fecha y Sprint activo.
- **RN-57.** Un usuario registra su asistencia mediante la acción Unirse.
- **RN-58.** La Daily permite publicar mensajes, actualizaciones e impedimentos.
- **RN-59.** Consultar posteriormente una Daily no registra asistencia.
- **RN-60.** La ausencia se calcula utilizando la lista de integrantes esperados al crear la sesión.
- **RN-61.** La Daily no requiere videollamada ni comunicación en tiempo real.
- **RN-62.** Sprint Review y Sprint Retrospective son registros diferentes.
- **RN-63.** Ambos eventos pueden compartir la pantalla Cierre del Sprint.
- **RN-64.** La Sprint Review debe completarse antes de concluir la Sprint Retrospective.
- **RN-65.** Completar la Retrospectiva y confirmar el cierre finaliza el Sprint.
- **RN-66.** Las acciones de mejora pueden convertirse en elementos del Product Backlog.
- **RN-67.** Los Sprints y eventos finalizados quedan disponibles como historial de solo lectura.
- **RN-68.** No se implementa un módulo de auditoría detallada.

## Guía Scrum

- **RN-69.** Las recomendaciones se calculan a partir del estado real del proyecto.
- **RN-70.** La guía no utiliza inteligencia artificial.
- **RN-71.** La guía puede señalar configuración incompleta, Daily pendiente, impedimentos, fechas próximas y actividades de cierre.
- **RN-72.** La guía orienta al usuario, pero no modifica datos ni ejecuta acciones automáticamente.

---

## Consecuencias para los casos de uso

- CU-01 Registrar usuario debe aplicar RN-01 a RN-07.
- CU-02 Iniciar sesión debe aplicar RN-08 y contemplar el cierre de sesión dentro del mismo submódulo de acceso.
- CU-05 Gestionar Product Backlog solo administra título, descripción, prioridad, orden y Product Goal.
- CU-06 Refinar Product Backlog administra estimación, criterios de aceptación, aclaración y división de elementos.
- El caso de uso Planificar Sprint debe validar el máximo de cuatro semanas o 28 días naturales.
- CU-07 Planificar Sprint administra la selección de elementos y el Sprint Goal, sin asignar fechas individuales.
- CU-08 Gestionar trabajo del Sprint administra responsable, estado, fecha de inicio, fecha límite, checklist, comentarios e impedimentos.
- Los casos de uso posteriores no deben contradecir estas reglas sin actualizar primero este documento.
