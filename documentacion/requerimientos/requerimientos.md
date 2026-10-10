**Requerimientos del Sistema de Gestión Scrum**

Documento académico de requerimientos funcionales y no funcionales

|  |  |
| --- | --- |
| **Documento** | Requerimientos del Sistema |
| **Versión** | 1.0 |
| **Fecha** | 9 de octubre de 2026 |
| **Base funcional** | 12 casos de uso y reglas generales aprobadas |

Aplicación web minimalista para la gestión de un ciclo Scrum

# **1 Introducción**

Este documento transforma los doce casos de uso y las reglas funcionales aprobadas en requerimientos verificables para el Sistema de Gestión Scrum. La especificación contiene 46 requerimientos funcionales y 15 requerimientos no funcionales, con trazabilidad directa hacia cada caso de uso.

El sistema apoyará el ciclo completo desde el registro del usuario y la creación del proyecto hasta el cierre del Sprint. La solución conservará pocas áreas principales, operaciones contextuales y un alcance viable para un equipo universitario de tres personas.

# **2 Alcance**

El alcance funcional se organiza en cuatro módulos aprobados:

* Acceso proyecto y equipo, que incluye registro, autenticación, proyectos, integrantes, responsabilidades y Definition of Done.
* Product Backlog, que incluye Product Goal, gestión de elementos y refinamiento.
* Sprint, que incluye planificación, tablero y seguimiento del trabajo.
* Seguimiento y eventos Scrum, que incluye estado y guía del proyecto, Daily Scrum, Sprint Review y Sprint Retrospective.

Quedan fuera del alcance inicial la recuperación de contraseña, verificación de correo, acceso con proveedores externos, autenticación multifactor, perfiles públicos, eliminación definitiva de proyectos, videollamada, chat en tiempo real obligatorio, auditoría empresarial detallada e inteligencia artificial para las recomendaciones.

# **3 Requerimientos funcionales**

Los requerimientos se agrupan por caso de uso. La prioridad Alta identifica funciones necesarias para completar el ciclo definido; la prioridad Media identifica funciones de apoyo que mejoran el seguimiento o la interacción sin crear un módulo independiente.

## **CU 01 Registrar usuario**

### **RF 01 Registrar cuenta**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-01 |
| **Nombre** | Registrar cuenta |
| **Descripción** | El sistema deberá permitir a una persona crear una cuenta activa mediante nombre, correo, contraseña y confirmación de contraseña, y dirigirla después al inicio de sesión sin autenticarla automáticamente. |
| **Actor(es) relacionado(s)** | Persona no registrada |
| **Caso de uso relacionado** | CU-01 Registrar usuario |
| **Prioridad** | Alta |

### **RF 02 Validar datos de registro**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-02 |
| **Nombre** | Validar datos de registro |
| **Descripción** | El sistema deberá validar que todos los datos de registro estén completos, que el correo normalizado sea único y que la contraseña coincida con su confirmación y tenga al menos 12 caracteres, un número y un símbolo. |
| **Actor(es) relacionado(s)** | Persona no registrada |
| **Caso de uso relacionado** | CU-01 Registrar usuario |
| **Prioridad** | Alta |

## **CU 02 Iniciar sesión**

### **RF 03 Autenticar usuario**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-03 |
| **Nombre** | Autenticar usuario |
| **Descripción** | El sistema deberá permitir a un usuario registrado iniciar sesión mediante su correo y contraseña y crear una sesión válida cuando las credenciales sean correctas. |
| **Actor(es) relacionado(s)** | Usuario registrado |
| **Caso de uso relacionado** | CU-02 Iniciar sesión |
| **Prioridad** | Alta |

### **RF 04 Rechazar credenciales inválidas**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-04 |
| **Nombre** | Rechazar credenciales inválidas |
| **Descripción** | El sistema deberá rechazar el acceso cuando las credenciales sean inválidas, mostrar un mensaje general y no revelar si el correo o la contraseña causaron el error. |
| **Actor(es) relacionado(s)** | Usuario registrado |
| **Caso de uso relacionado** | CU-02 Iniciar sesión |
| **Prioridad** | Alta |

### **RF 05 Cerrar sesión**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-05 |
| **Nombre** | Cerrar sesión |
| **Descripción** | El sistema deberá permitir al usuario cerrar sesión e invalidar la sesión activa para impedir accesos posteriores con esa sesión. |
| **Actor(es) relacionado(s)** | Usuario autenticado |
| **Caso de uso relacionado** | CU-02 Iniciar sesión |
| **Prioridad** | Alta |

## **CU 03 Gestionar proyecto Scrum**

### **RF 06 Crear proyecto Scrum**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-06 |
| **Nombre** | Crear proyecto Scrum |
| **Descripción** | El sistema deberá permitir a un usuario autenticado crear un proyecto y registrarlo automáticamente como miembro y administrador inicial, sin asignarle una responsabilidad Scrum. |
| **Actor(es) relacionado(s)** | Usuario autenticado |
| **Caso de uso relacionado** | CU-03 Gestionar proyecto Scrum |
| **Prioridad** | Alta |

### **RF 07 Consultar y seleccionar proyectos**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-07 |
| **Nombre** | Consultar y seleccionar proyectos |
| **Descripción** | El sistema deberá mostrar al usuario los proyectos a los que pertenece y permitirle seleccionar uno para trabajar en su información y ciclo Scrum. |
| **Actor(es) relacionado(s)** | Usuario autenticado |
| **Caso de uso relacionado** | CU-03 Gestionar proyecto Scrum |
| **Prioridad** | Alta |

### **RF 08 Editar proyecto**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-08 |
| **Nombre** | Editar proyecto |
| **Descripción** | El sistema deberá permitir a un administrador modificar el nombre y la descripción del proyecto. La eliminación definitiva del proyecto no estará disponible. |
| **Actor(es) relacionado(s)** | Administrador del proyecto |
| **Caso de uso relacionado** | CU-03 Gestionar proyecto Scrum |
| **Prioridad** | Alta |

## **CU 04 Gestionar equipo Scrum y acuerdos**

### **RF 09 Enviar invitación interna**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-09 |
| **Nombre** | Enviar invitación interna |
| **Descripción** | El sistema deberá permitir a un administrador invitar a un usuario mediante el correo exacto de una cuenta registrada y crear una invitación pendiente dentro de la aplicación. |
| **Actor(es) relacionado(s)** | Administrador del proyecto |
| **Caso de uso relacionado** | CU-04 Gestionar equipo Scrum y acuerdos |
| **Prioridad** | Alta |

### **RF 10 Aceptar o rechazar invitación**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-10 |
| **Nombre** | Aceptar o rechazar invitación |
| **Descripción** | El sistema deberá permitir al usuario invitado aceptar o rechazar la invitación. Al aceptarla, se convertirá en miembro del proyecto sin recibir una responsabilidad Scrum automática. |
| **Actor(es) relacionado(s)** | Usuario invitado |
| **Caso de uso relacionado** | CU-04 Gestionar equipo Scrum y acuerdos |
| **Prioridad** | Alta |

### **RF 11 Administrar integrantes**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-11 |
| **Nombre** | Administrar integrantes |
| **Descripción** | El sistema deberá permitir a un administrador consultar y gestionar los integrantes y administradores del proyecto, evitando membresías duplicadas y que el proyecto quede sin administrador. |
| **Actor(es) relacionado(s)** | Administrador del proyecto |
| **Caso de uso relacionado** | CU-04 Gestionar equipo Scrum y acuerdos |
| **Prioridad** | Alta |

### **RF 12 Asignar responsabilidades Scrum**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-12 |
| **Nombre** | Asignar responsabilidades Scrum |
| **Descripción** | El sistema deberá permitir a un administrador asignar o retirar las responsabilidades Product Owner, Scrum Master y Developer. Una persona podrá tener más de una responsabilidad. |
| **Actor(es) relacionado(s)** | Administrador del proyecto |
| **Caso de uso relacionado** | CU-04 Gestionar equipo Scrum y acuerdos |
| **Prioridad** | Alta |

### **RF 13 Configurar Definition of Done**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-13 |
| **Nombre** | Configurar Definition of Done |
| **Descripción** | El sistema deberá permitir a un administrador mantener la Definition of Done del proyecto como una lista breve de criterios que se utilizará al terminar trabajo del Sprint. |
| **Actor(es) relacionado(s)** | Administrador del proyecto |
| **Caso de uso relacionado** | CU-04 Gestionar equipo Scrum y acuerdos |
| **Prioridad** | Alta |

## **CU 05 Gestionar Product Backlog**

### **RF 14 Gestionar Product Goal**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-14 |
| **Nombre** | Gestionar Product Goal |
| **Descripción** | El sistema deberá permitir a los miembros consultar y editar el Product Goal dentro del Product Backlog e indicar que el Product Owner conserva su responsabilidad final. |
| **Actor(es) relacionado(s)** | Miembro del proyecto y Product Owner |
| **Caso de uso relacionado** | CU-05 Gestionar Product Backlog |
| **Prioridad** | Alta |

### **RF 15 Crear elemento del Product Backlog**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-15 |
| **Nombre** | Crear elemento del Product Backlog |
| **Descripción** | El sistema deberá permitir a un miembro crear un elemento con título, descripción, prioridad y posición en el orden del Product Backlog, sin fechas de ejecución. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-05 Gestionar Product Backlog |
| **Prioridad** | Alta |

### **RF 16 Consultar y editar elementos**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-16 |
| **Nombre** | Consultar y editar elementos |
| **Descripción** | El sistema deberá permitir a los miembros consultar y modificar el título, la descripción y la prioridad de los elementos disponibles en el Product Backlog. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-05 Gestionar Product Backlog |
| **Prioridad** | Alta |

### **RF 17 Ordenar Product Backlog**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-17 |
| **Nombre** | Ordenar Product Backlog |
| **Descripción** | El sistema deberá permitir a los miembros cambiar el orden de los elementos y señalar que el Product Owner conserva la responsabilidad sobre el orden final. |
| **Actor(es) relacionado(s)** | Miembro del proyecto y Product Owner |
| **Caso de uso relacionado** | CU-05 Gestionar Product Backlog |
| **Prioridad** | Alta |

### **RF 18 Retirar elemento**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-18 |
| **Nombre** | Retirar elemento |
| **Descripción** | El sistema deberá permitir solo a un administrador retirar un elemento. Si nunca participó en un Sprint podrá eliminarse; si tiene historial deberá conservarse como retirado. |
| **Actor(es) relacionado(s)** | Administrador del proyecto |
| **Caso de uso relacionado** | CU-05 Gestionar Product Backlog |
| **Prioridad** | Alta |

## **CU 06 Refinar Product Backlog**

### **RF 19 Refinar elemento**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-19 |
| **Nombre** | Refinar elemento |
| **Descripción** | El sistema deberá permitir a los miembros registrar estimación, criterios de aceptación y aclaraciones en un elemento que no forme parte de un Sprint Activo o En cierre. La estimación deberá ser un entero positivo. |
| **Actor(es) relacionado(s)** | Miembro del proyecto y Developer |
| **Caso de uso relacionado** | CU-06 Refinar Product Backlog |
| **Prioridad** | Alta |

### **RF 20 Determinar preparación**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-20 |
| **Nombre** | Determinar preparación |
| **Descripción** | El sistema deberá mostrar si un elemento está preparado para planificación y señalar la información faltante. Un elemento estará preparado cuando tenga título, descripción y estimación válida. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-06 Refinar Product Backlog |
| **Prioridad** | Alta |

### **RF 21 Dividir elemento**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-21 |
| **Nombre** | Dividir elemento |
| **Descripción** | El sistema deberá permitir dividir un elemento en al menos dos elementos independientes del Product Backlog, sin crear una jerarquía, y retirar el elemento original conservando su trazabilidad. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-06 Refinar Product Backlog |
| **Prioridad** | Alta |

## **CU 07 Planificar Sprint**

### **RF 22 Crear borrador de Sprint**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-22 |
| **Nombre** | Crear borrador de Sprint |
| **Descripción** | El sistema deberá permitir crear y editar un Sprint en estado Borrador con Sprint Goal, fecha de inicio y fecha de finalización. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-07 Planificar Sprint |
| **Prioridad** | Alta |

### **RF 23 Seleccionar elementos para el Sprint**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-23 |
| **Nombre** | Seleccionar elementos para el Sprint |
| **Descripción** | El sistema deberá permitir seleccionar elementos preparados, asociarlos al Sprint sin copiarlos y mostrar la estimación total seleccionada. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-07 Planificar Sprint |
| **Prioridad** | Alta |

### **RF 24 Validar activación del Sprint**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-24 |
| **Nombre** | Validar activación del Sprint |
| **Descripción** | El sistema deberá validar antes de activar un Sprint que no exista otro sin finalizar, que la duración no supere 28 días naturales, que exista exactamente un Product Owner, un Scrum Master y al menos un Developer, y que estén definidos los objetivos, fechas, Definition of Done y trabajo preparado. |
| **Actor(es) relacionado(s)** | Administrador del proyecto |
| **Caso de uso relacionado** | CU-07 Planificar Sprint |
| **Prioridad** | Alta |

### **RF 25 Activar Sprint**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-25 |
| **Nombre** | Activar Sprint |
| **Descripción** | El sistema deberá permitir a un administrador confirmar la activación, conservar una copia de la Definition of Done vigente e iniciar los elementos seleccionados en estado Pendiente. |
| **Actor(es) relacionado(s)** | Administrador del proyecto |
| **Caso de uso relacionado** | CU-07 Planificar Sprint |
| **Prioridad** | Alta |

## **CU 08 Gestionar trabajo del Sprint**

### **RF 26 Mostrar tablero del Sprint**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-26 |
| **Nombre** | Mostrar tablero del Sprint |
| **Descripción** | El sistema deberá mostrar los elementos del Sprint activo en un tablero con los estados Pendiente, En progreso y Terminado, junto con su información de ejecución. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-08 Gestionar trabajo del Sprint |
| **Prioridad** | Alta |

### **RF 27 Gestionar responsable y fechas**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-27 |
| **Nombre** | Gestionar responsable y fechas |
| **Descripción** | El sistema deberá permitir asignar un responsable y fechas opcionales de inicio y límite a un elemento del Sprint. Las fechas deberán respetar el intervalo del Sprint, la fecha de inicio no podrá superar la fecha límite y una fecha vencida solo generará una advertencia. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-08 Gestionar trabajo del Sprint |
| **Prioridad** | Alta |

### **RF 28 Gestionar checklist y comentarios**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-28 |
| **Nombre** | Gestionar checklist y comentarios |
| **Descripción** | El sistema deberá permitir mantener un checklist y registrar comentarios con su autor y momento de publicación dentro del detalle de cada elemento del Sprint. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-08 Gestionar trabajo del Sprint |
| **Prioridad** | Media |

### **RF 29 Gestionar impedimentos**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-29 |
| **Nombre** | Gestionar impedimentos |
| **Descripción** | El sistema deberá permitir registrar, consultar y resolver impedimentos asociados con el Sprint o con uno de sus elementos. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-08 Gestionar trabajo del Sprint |
| **Prioridad** | Alta |

### **RF 30 Cambiar estado y confirmar Definition of Done**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-30 |
| **Nombre** | Cambiar estado y confirmar Definition of Done |
| **Descripción** | El sistema deberá permitir cambiar el estado de un elemento y exigir la confirmación de la Definition of Done antes de marcarlo Terminado, registrando quién confirmó y cuándo. Reabrirlo anulará la confirmación y su pertenencia al incremento. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-08 Gestionar trabajo del Sprint |
| **Prioridad** | Alta |

### **RF 31 Iniciar cierre del Sprint**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-31 |
| **Nombre** | Iniciar cierre del Sprint |
| **Descripción** | El sistema deberá permitir a un administrador pasar el Sprint activo a En cierre, bloquear cambios operativos del tablero y habilitar la Sprint Review. |
| **Actor(es) relacionado(s)** | Administrador del proyecto |
| **Caso de uso relacionado** | CU-08 Gestionar trabajo del Sprint |
| **Prioridad** | Alta |

## **CU 09 Consultar estado y guía del proyecto**

### **RF 32 Consultar estado del proyecto**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-32 |
| **Nombre** | Consultar estado del proyecto |
| **Descripción** | El sistema deberá mostrar un resumen del estado del proyecto, incluyendo configuración, Product Backlog, Sprint actual, Daily Scrum, impedimentos y actividades de cierre aplicables. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-09 Consultar estado y guía del proyecto |
| **Prioridad** | Media |

### **RF 33 Generar guía y alertas**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-33 |
| **Nombre** | Generar guía y alertas |
| **Descripción** | El sistema deberá calcular una recomendación principal y alertas secundarias a partir del estado real del proyecto, mediante reglas definidas y sin utilizar inteligencia artificial. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-09 Consultar estado y guía del proyecto |
| **Prioridad** | Media |

### **RF 34 Navegar desde la guía**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-34 |
| **Nombre** | Navegar desde la guía |
| **Descripción** | El sistema deberá permitir abrir desde cada recomendación el área correspondiente, sin modificar datos ni ejecutar acciones automáticamente. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-09 Consultar estado y guía del proyecto |
| **Prioridad** | Media |

## **CU 10 Registrar Daily Scrum**

### **RF 35 Consultar Daily del día**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-35 |
| **Nombre** | Consultar Daily del día |
| **Descripción** | El sistema deberá mostrar la Daily del día para el Sprint activo en estado Programada, En curso o Finalizada y garantizar que exista como máximo una por fecha y Sprint. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-10 Registrar Daily Scrum |
| **Prioridad** | Alta |

### **RF 36 Iniciar Daily**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-36 |
| **Nombre** | Iniciar Daily |
| **Descripción** | El sistema deberá permitir a un miembro iniciar explícitamente una Daily Programada y registrar fecha, hora de inicio, usuario iniciador y copia de los integrantes esperados. El iniciador quedará registrado como participante. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-10 Registrar Daily Scrum |
| **Prioridad** | Alta |

### **RF 37 Unirse a la Daily**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-37 |
| **Nombre** | Unirse a la Daily |
| **Descripción** | El sistema deberá permitir a los demás integrantes unirse mientras la Daily esté En curso y registrar automáticamente su asistencia y hora de ingreso una sola vez. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-10 Registrar Daily Scrum |
| **Prioridad** | Alta |

### **RF 38 Registrar interacción en la Daily**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-38 |
| **Nombre** | Registrar interacción en la Daily |
| **Descripción** | El sistema deberá permitir a los participantes publicar mensajes, avances e impedimentos durante la sesión y relacionarlos opcionalmente con un elemento del Sprint. |
| **Actor(es) relacionado(s)** | Participante de la Daily |
| **Caso de uso relacionado** | CU-10 Registrar Daily Scrum |
| **Prioridad** | Alta |

### **RF 39 Finalizar y consultar Daily**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-39 |
| **Nombre** | Finalizar y consultar Daily |
| **Descripción** | El sistema deberá permitir al iniciador o a un administrador finalizar la Daily, registrar la hora de cierre, determinar los ausentes y conservar la sesión como historial de solo lectura. |
| **Actor(es) relacionado(s)** | Iniciador de la Daily y Administrador del proyecto |
| **Caso de uso relacionado** | CU-10 Registrar Daily Scrum |
| **Prioridad** | Alta |

## **CU 11 Registrar Sprint Review**

### **RF 40 Consultar información de la Sprint Review**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-40 |
| **Nombre** | Consultar información de la Sprint Review |
| **Descripción** | El sistema deberá mostrar durante el cierre el Sprint Goal, el incremento formado por elementos Terminados con Definition of Done confirmada y los elementos incompletos por separado. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-11 Registrar Sprint Review |
| **Prioridad** | Alta |

### **RF 41 Registrar Sprint Review**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-41 |
| **Nombre** | Registrar Sprint Review |
| **Descripción** | El sistema deberá permitir guardar como borrador participantes, nombres de stakeholders externos, resultados, retroalimentación, decisiones y conclusión de la Sprint Review. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-11 Registrar Sprint Review |
| **Prioridad** | Alta |

### **RF 42 Adaptar backlog desde la Review**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-42 |
| **Nombre** | Adaptar backlog desde la Review |
| **Descripción** | El sistema deberá permitir crear o actualizar elementos del Product Backlog a partir de la retroalimentación y decisiones registradas durante la Sprint Review. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-11 Registrar Sprint Review |
| **Prioridad** | Alta |

### **RF 43 Completar Sprint Review**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-43 |
| **Nombre** | Completar Sprint Review |
| **Descripción** | El sistema deberá permitir a un administrador completar la Sprint Review, dejarla en solo lectura y habilitar la Retrospectiva sin finalizar todavía el Sprint. |
| **Actor(es) relacionado(s)** | Administrador del proyecto |
| **Caso de uso relacionado** | CU-11 Registrar Sprint Review |
| **Prioridad** | Alta |

## **CU 12 Registrar Sprint Retrospective**

### **RF 44 Registrar Sprint Retrospective**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-44 |
| **Nombre** | Registrar Sprint Retrospective |
| **Descripción** | El sistema deberá permitir registrar como borrador participantes, aspectos que funcionaron bien, problemas, propuestas, acciones de mejora y conclusión después de completar la Sprint Review. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-12 Registrar Sprint Retrospective |
| **Prioridad** | Alta |

### **RF 45 Convertir acción de mejora**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-45 |
| **Nombre** | Convertir acción de mejora |
| **Descripción** | El sistema deberá permitir convertir una acción de mejora en un elemento del Product Backlog, sin incorporarlo automáticamente al siguiente Sprint. |
| **Actor(es) relacionado(s)** | Miembro del proyecto |
| **Caso de uso relacionado** | CU-12 Registrar Sprint Retrospective |
| **Prioridad** | Alta |

### **RF 46 Finalizar Retrospectiva y Sprint**

| **Campo** | **Contenido** |
| --- | --- |
| **Código** | RF-46 |
| **Nombre** | Finalizar Retrospectiva y Sprint |
| **Descripción** | El sistema deberá permitir a un administrador finalizar la Retrospectiva y el Sprint en una sola operación, devolver los elementos incompletos al Product Backlog sin asignarlos al siguiente Sprint, limpiar sus datos activos de ejecución y conservar el Sprint y sus eventos como historial de solo lectura. |
| **Actor(es) relacionado(s)** | Administrador del proyecto |
| **Caso de uso relacionado** | CU-12 Registrar Sprint Retrospective |
| **Prioridad** | Alta |

# **4 Requerimientos no funcionales**

Estos requerimientos establecen condiciones mínimas de calidad acordes con una aplicación web académica desplegable. Los valores cuantitativos no definidos por los casos de uso se mantienen como decisiones pendientes.

| **Código** | **Categoría** | **Requerimiento** | **Prioridad** |
| --- | --- | --- | --- |
| RNF-01 | Seguridad | Las contraseñas deberán almacenarse con un algoritmo de hash seguro de una sola vía y una sal única por cuenta; nunca en texto visible ni mediante cifrado reversible. | Alta |
| RNF-02 | Seguridad | Las sesiones deberán crearse de forma segura, proteger las rutas autenticadas e invalidarse al cerrar sesión. | Alta |
| RNF-03 | Seguridad | La autorización deberá verificarse en el servidor según la membresía y la condición de administrador del proyecto, con independencia de lo que muestre la interfaz. | Alta |
| RNF-04 | Seguridad | Las entradas del usuario deberán normalizarse y validarse antes de almacenarse o mostrarse, evitando que contenido no confiable se ejecute como código. | Alta |
| RNF-05 | Integridad de datos | Las operaciones críticas que modifican varios registros, como activar o finalizar un Sprint, deberán ejecutarse de forma atómica para evitar estados parciales. | Alta |
| RNF-06 | Integridad de datos | La base de datos deberá aplicar restricciones de unicidad y relaciones para correo, membresías, invitaciones pendientes, Daily por fecha y Sprint no finalizado. | Alta |
| RNF-07 | Integridad de datos | Los Sprints y eventos finalizados deberán conservar sus datos históricos y permanecer en solo lectura, incluidos los registros de participantes y confirmaciones. | Alta |
| RNF-08 | Usabilidad | La interfaz deberá concentrar operaciones relacionadas en pocas áreas y mostrar acciones contextuales según el estado del proyecto, el Sprint o el evento. | Alta |
| RNF-09 | Usabilidad | El sistema deberá mostrar mensajes claros para resultados, validaciones y acciones bloqueadas, indicando qué dato o condición debe corregirse. | Alta |
| RNF-10 | Diseño responsive | La aplicación deberá ser utilizable en computadoras, tabletas y teléfonos, adaptando formularios, listas y tableros sin perder funciones esenciales. | Media |
| RNF-11 | Compatibilidad web | La aplicación deberá utilizar tecnologías web estándar. La lista exacta de navegadores y versiones compatibles queda como decisión pendiente. | Media |
| RNF-12 | Rendimiento | Las operaciones habituales deberán responder con fluidez para la carga académica prevista. El tiempo máximo de respuesta y la cantidad de usuarios concurrentes quedan como decisión pendiente. | Media |
| RNF-13 | Disponibilidad | La aplicación deberá poder desplegarse y accederse mediante la web. La plataforma de alojamiento, el porcentaje de disponibilidad y la política de respaldo quedan como decisión pendiente. | Media |
| RNF-14 | Mantenibilidad | El código deberá organizarse de acuerdo con los cuatro módulos y los doce casos de uso, separando responsabilidades y reutilizando componentes comunes. | Media |
| RNF-15 | Mantenibilidad | Las reglas de negocio y validaciones compartidas deberán centralizarse para evitar comportamientos contradictorios entre la interfaz, la API y la base de datos. | Alta |

# **5 Matriz de trazabilidad**

La matriz relaciona cada caso de uso con los requerimientos funcionales que lo desarrollan y confirma la cobertura de los doce casos aprobados.

| **Caso de uso** | **Requerimientos relacionados** |
| --- | --- |
| CU-01 Registrar usuario | RF-01, RF-02 |
| CU-02 Iniciar sesión | RF-03, RF-04, RF-05 |
| CU-03 Gestionar proyecto Scrum | RF-06, RF-07, RF-08 |
| CU-04 Gestionar equipo Scrum y acuerdos | RF-09, RF-10, RF-11, RF-12, RF-13 |
| CU-05 Gestionar Product Backlog | RF-14, RF-15, RF-16, RF-17, RF-18 |
| CU-06 Refinar Product Backlog | RF-19, RF-20, RF-21 |
| CU-07 Planificar Sprint | RF-22, RF-23, RF-24, RF-25 |
| CU-08 Gestionar trabajo del Sprint | RF-26, RF-27, RF-28, RF-29, RF-30, RF-31 |
| CU-09 Consultar estado y guía del proyecto | RF-32, RF-33, RF-34 |
| CU-10 Registrar Daily Scrum | RF-35, RF-36, RF-37, RF-38, RF-39 |
| CU-11 Registrar Sprint Review | RF-40, RF-41, RF-42, RF-43 |
| CU-12 Registrar Sprint Retrospective | RF-44, RF-45, RF-46 |