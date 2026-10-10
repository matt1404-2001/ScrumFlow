/*
    Sistema de Gestion Scrum
    Modelo de datos simplificado para Microsoft SQL Server

    Instrucciones:
    1. Cree o seleccione previamente la base de datos de destino.
    2. Ejecute este script una sola vez sobre un esquema dbo vacio.
    3. Las fechas y horas de auditoria se guardan en UTC.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    CREATE TABLE dbo.Usuario
    (
        usuario_id BIGINT IDENTITY(1,1) NOT NULL,
        nombre NVARCHAR(150) NOT NULL,
        correo NVARCHAR(320) NOT NULL,
        contrasena_hash NVARCHAR(255) NOT NULL,
        fecha_creacion DATETIME2(0) NOT NULL
            CONSTRAINT DF_Usuario_FechaCreacion DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Usuario PRIMARY KEY (usuario_id),
        CONSTRAINT UQ_Usuario_Correo UNIQUE (correo),
        CONSTRAINT CK_Usuario_Nombre
            CHECK (LEN(LTRIM(RTRIM(nombre))) > 0),
        CONSTRAINT CK_Usuario_Correo
            CHECK (LEN(LTRIM(RTRIM(correo))) > 0),
        CONSTRAINT CK_Usuario_ContrasenaHash
            CHECK (LEN(LTRIM(RTRIM(contrasena_hash))) > 0)
    );

    CREATE TABLE dbo.Proyecto
    (
        proyecto_id BIGINT IDENTITY(1,1) NOT NULL,
        creado_por_usuario_id BIGINT NOT NULL,
        nombre NVARCHAR(150) NOT NULL,
        descripcion NVARCHAR(1000) NULL,
        product_goal NVARCHAR(MAX) NULL,
        definition_of_done NVARCHAR(MAX) NULL,
        fecha_creacion DATETIME2(0) NOT NULL
            CONSTRAINT DF_Proyecto_FechaCreacion DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Proyecto PRIMARY KEY (proyecto_id),
        CONSTRAINT FK_Proyecto_UsuarioCreador
            FOREIGN KEY (creado_por_usuario_id)
            REFERENCES dbo.Usuario (usuario_id),
        CONSTRAINT CK_Proyecto_Nombre
            CHECK (LEN(LTRIM(RTRIM(nombre))) > 0)
    );

    CREATE TABLE dbo.MiembroProyecto
    (
        miembro_proyecto_id BIGINT IDENTITY(1,1) NOT NULL,
        proyecto_id BIGINT NOT NULL,
        usuario_id BIGINT NOT NULL,
        es_administrador BIT NOT NULL
            CONSTRAINT DF_MiembroProyecto_EsAdministrador DEFAULT (0),
        es_product_owner BIT NOT NULL
            CONSTRAINT DF_MiembroProyecto_EsProductOwner DEFAULT (0),
        es_scrum_master BIT NOT NULL
            CONSTRAINT DF_MiembroProyecto_EsScrumMaster DEFAULT (0),
        es_developer BIT NOT NULL
            CONSTRAINT DF_MiembroProyecto_EsDeveloper DEFAULT (0),
        activo BIT NOT NULL
            CONSTRAINT DF_MiembroProyecto_Activo DEFAULT (1),
        fecha_incorporacion DATETIME2(0) NOT NULL
            CONSTRAINT DF_MiembroProyecto_FechaIncorporacion DEFAULT (SYSUTCDATETIME()),
        fecha_retiro DATETIME2(0) NULL,

        CONSTRAINT PK_MiembroProyecto PRIMARY KEY (miembro_proyecto_id),
        CONSTRAINT UQ_MiembroProyecto_ProyectoUsuario
            UNIQUE (proyecto_id, usuario_id),
        CONSTRAINT FK_MiembroProyecto_Proyecto
            FOREIGN KEY (proyecto_id)
            REFERENCES dbo.Proyecto (proyecto_id),
        CONSTRAINT FK_MiembroProyecto_Usuario
            FOREIGN KEY (usuario_id)
            REFERENCES dbo.Usuario (usuario_id)
    );

    CREATE TABLE dbo.InvitacionProyecto
    (
        invitacion_proyecto_id BIGINT IDENTITY(1,1) NOT NULL,
        proyecto_id BIGINT NOT NULL,
        usuario_invitado_id BIGINT NOT NULL,
        invitado_por_miembro_id BIGINT NOT NULL,
        estado VARCHAR(15) NOT NULL
            CONSTRAINT DF_InvitacionProyecto_Estado DEFAULT ('PENDIENTE'),
        fecha_creacion DATETIME2(0) NOT NULL
            CONSTRAINT DF_InvitacionProyecto_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        fecha_respuesta DATETIME2(0) NULL,

        CONSTRAINT PK_InvitacionProyecto PRIMARY KEY (invitacion_proyecto_id),
        CONSTRAINT FK_InvitacionProyecto_Proyecto
            FOREIGN KEY (proyecto_id)
            REFERENCES dbo.Proyecto (proyecto_id),
        CONSTRAINT FK_InvitacionProyecto_UsuarioInvitado
            FOREIGN KEY (usuario_invitado_id)
            REFERENCES dbo.Usuario (usuario_id),
        CONSTRAINT FK_InvitacionProyecto_MiembroInvitador
            FOREIGN KEY (invitado_por_miembro_id)
            REFERENCES dbo.MiembroProyecto (miembro_proyecto_id),
        CONSTRAINT CK_InvitacionProyecto_Estado
            CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA'))
    );

    CREATE TABLE dbo.ElementoBacklog
    (
        elemento_backlog_id BIGINT IDENTITY(1,1) NOT NULL,
        proyecto_id BIGINT NOT NULL,
        titulo NVARCHAR(200) NOT NULL,
        descripcion NVARCHAR(MAX) NULL,
        prioridad VARCHAR(10) NOT NULL
            CONSTRAINT DF_ElementoBacklog_Prioridad DEFAULT ('MEDIA'),
        posicion INT NOT NULL,
        estimacion INT NULL,
        criterios_aceptacion NVARCHAR(MAX) NULL,
        retirado BIT NOT NULL
            CONSTRAINT DF_ElementoBacklog_Retirado DEFAULT (0),
        fecha_creacion DATETIME2(0) NOT NULL
            CONSTRAINT DF_ElementoBacklog_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        fecha_retiro DATETIME2(0) NULL,

        CONSTRAINT PK_ElementoBacklog PRIMARY KEY (elemento_backlog_id),
        CONSTRAINT FK_ElementoBacklog_Proyecto
            FOREIGN KEY (proyecto_id)
            REFERENCES dbo.Proyecto (proyecto_id),
        CONSTRAINT CK_ElementoBacklog_Titulo
            CHECK (LEN(LTRIM(RTRIM(titulo))) > 0),
        CONSTRAINT CK_ElementoBacklog_Prioridad
            CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA')),
        CONSTRAINT CK_ElementoBacklog_Posicion
            CHECK (posicion > 0),
        CONSTRAINT CK_ElementoBacklog_Estimacion
            CHECK (estimacion IS NULL OR estimacion > 0)
    );

    CREATE TABLE dbo.Sprint
    (
        sprint_id BIGINT IDENTITY(1,1) NOT NULL,
        proyecto_id BIGINT NOT NULL,
        sprint_goal NVARCHAR(MAX) NULL,
        fecha_inicio DATE NULL,
        fecha_fin DATE NULL,
        estado VARCHAR(20) NOT NULL
            CONSTRAINT DF_Sprint_Estado DEFAULT ('BORRADOR'),
        dod_snapshot NVARCHAR(MAX) NULL,
        fecha_activacion DATETIME2(0) NULL,
        fecha_inicio_cierre DATETIME2(0) NULL,
        fecha_finalizacion DATETIME2(0) NULL,

        CONSTRAINT PK_Sprint PRIMARY KEY (sprint_id),
        CONSTRAINT FK_Sprint_Proyecto
            FOREIGN KEY (proyecto_id)
            REFERENCES dbo.Proyecto (proyecto_id),
        CONSTRAINT CK_Sprint_Goal
            CHECK (LEN(LTRIM(RTRIM(sprint_goal))) > 0),
        CONSTRAINT CK_Sprint_Estado
            CHECK (estado IN ('BORRADOR', 'ACTIVO', 'EN_CIERRE', 'FINALIZADO')),
        CONSTRAINT CK_Sprint_DuracionMaxima
            CHECK
            (
                fecha_inicio IS NULL
                OR fecha_fin IS NULL
                OR DATEDIFF(DAY, fecha_inicio, fecha_fin) BETWEEN 0 AND 27
            )
    );

    CREATE TABLE dbo.ElementoSprint
    (
        elemento_sprint_id BIGINT IDENTITY(1,1) NOT NULL,
        sprint_id BIGINT NOT NULL,
        elemento_backlog_id BIGINT NOT NULL,
        responsable_miembro_id BIGINT NULL,
        estado VARCHAR(20) NOT NULL
            CONSTRAINT DF_ElementoSprint_Estado DEFAULT ('PENDIENTE'),
        fecha_inicio DATE NULL,
        fecha_limite DATE NULL,
        dod_confirmado BIT NOT NULL
            CONSTRAINT DF_ElementoSprint_DoDConfirmado DEFAULT (0),
        dod_confirmado_por_miembro_id BIGINT NULL,
        dod_confirmado_en DATETIME2(0) NULL,

        CONSTRAINT PK_ElementoSprint PRIMARY KEY (elemento_sprint_id),
        CONSTRAINT UQ_ElementoSprint_SprintElemento
            UNIQUE (sprint_id, elemento_backlog_id),
        CONSTRAINT FK_ElementoSprint_Sprint
            FOREIGN KEY (sprint_id)
            REFERENCES dbo.Sprint (sprint_id),
        CONSTRAINT FK_ElementoSprint_ElementoBacklog
            FOREIGN KEY (elemento_backlog_id)
            REFERENCES dbo.ElementoBacklog (elemento_backlog_id),
        CONSTRAINT FK_ElementoSprint_MiembroResponsable
            FOREIGN KEY (responsable_miembro_id)
            REFERENCES dbo.MiembroProyecto (miembro_proyecto_id),
        CONSTRAINT FK_ElementoSprint_MiembroConfirmadorDoD
            FOREIGN KEY (dod_confirmado_por_miembro_id)
            REFERENCES dbo.MiembroProyecto (miembro_proyecto_id),
        CONSTRAINT CK_ElementoSprint_Estado
            CHECK (estado IN ('PENDIENTE', 'EN_PROGRESO', 'TERMINADO')),
        CONSTRAINT CK_ElementoSprint_Fechas
            CHECK (fecha_inicio IS NULL OR fecha_limite IS NULL OR fecha_inicio <= fecha_limite)
    );

    CREATE TABLE dbo.ChecklistElementoSprint
    (
        checklist_elemento_sprint_id BIGINT IDENTITY(1,1) NOT NULL,
        elemento_sprint_id BIGINT NOT NULL,
        descripcion NVARCHAR(300) NOT NULL,
        posicion INT NOT NULL,
        completado BIT NOT NULL
            CONSTRAINT DF_ChecklistElementoSprint_Completado DEFAULT (0),

        CONSTRAINT PK_ChecklistElementoSprint PRIMARY KEY (checklist_elemento_sprint_id),
        CONSTRAINT FK_ChecklistElementoSprint_ElementoSprint
            FOREIGN KEY (elemento_sprint_id)
            REFERENCES dbo.ElementoSprint (elemento_sprint_id),
        CONSTRAINT UQ_ChecklistElementoSprint_Posicion
            UNIQUE (elemento_sprint_id, posicion),
        CONSTRAINT CK_ChecklistElementoSprint_Descripcion
            CHECK (LEN(LTRIM(RTRIM(descripcion))) > 0),
        CONSTRAINT CK_ChecklistElementoSprint_Posicion
            CHECK (posicion > 0)
    );

    CREATE TABLE dbo.ComentarioElementoSprint
    (
        comentario_elemento_sprint_id BIGINT IDENTITY(1,1) NOT NULL,
        elemento_sprint_id BIGINT NOT NULL,
        autor_miembro_id BIGINT NOT NULL,
        contenido NVARCHAR(MAX) NOT NULL,
        fecha_publicacion DATETIME2(0) NOT NULL
            CONSTRAINT DF_ComentarioElementoSprint_FechaPublicacion DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_ComentarioElementoSprint PRIMARY KEY (comentario_elemento_sprint_id),
        CONSTRAINT FK_ComentarioElementoSprint_ElementoSprint
            FOREIGN KEY (elemento_sprint_id)
            REFERENCES dbo.ElementoSprint (elemento_sprint_id),
        CONSTRAINT FK_ComentarioElementoSprint_Autor
            FOREIGN KEY (autor_miembro_id)
            REFERENCES dbo.MiembroProyecto (miembro_proyecto_id),
        CONSTRAINT CK_ComentarioElementoSprint_Contenido
            CHECK (LEN(LTRIM(RTRIM(contenido))) > 0)
    );

    CREATE TABLE dbo.Impedimento
    (
        impedimento_id BIGINT IDENTITY(1,1) NOT NULL,
        sprint_id BIGINT NOT NULL,
        elemento_sprint_id BIGINT NULL,
        reportado_por_miembro_id BIGINT NOT NULL,
        descripcion NVARCHAR(MAX) NOT NULL,
        estado VARCHAR(15) NOT NULL
            CONSTRAINT DF_Impedimento_Estado DEFAULT ('ABIERTO'),
        fecha_creacion DATETIME2(0) NOT NULL
            CONSTRAINT DF_Impedimento_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        resuelto_por_miembro_id BIGINT NULL,
        fecha_resolucion DATETIME2(0) NULL,

        CONSTRAINT PK_Impedimento PRIMARY KEY (impedimento_id),
        CONSTRAINT FK_Impedimento_Sprint
            FOREIGN KEY (sprint_id)
            REFERENCES dbo.Sprint (sprint_id),
        CONSTRAINT FK_Impedimento_ElementoSprint
            FOREIGN KEY (elemento_sprint_id)
            REFERENCES dbo.ElementoSprint (elemento_sprint_id),
        CONSTRAINT FK_Impedimento_MiembroReportador
            FOREIGN KEY (reportado_por_miembro_id)
            REFERENCES dbo.MiembroProyecto (miembro_proyecto_id),
        CONSTRAINT FK_Impedimento_MiembroResolutor
            FOREIGN KEY (resuelto_por_miembro_id)
            REFERENCES dbo.MiembroProyecto (miembro_proyecto_id),
        CONSTRAINT CK_Impedimento_Descripcion
            CHECK (LEN(LTRIM(RTRIM(descripcion))) > 0),
        CONSTRAINT CK_Impedimento_Estado
            CHECK (estado IN ('ABIERTO', 'RESUELTO'))
    );

    CREATE TABLE dbo.Daily
    (
        daily_id BIGINT IDENTITY(1,1) NOT NULL,
        sprint_id BIGINT NOT NULL,
        fecha DATE NOT NULL,
        estado VARCHAR(15) NOT NULL
            CONSTRAINT DF_Daily_Estado DEFAULT ('PROGRAMADA'),
        iniciada_por_miembro_id BIGINT NULL,
        hora_inicio DATETIME2(0) NULL,
        finalizada_por_miembro_id BIGINT NULL,
        hora_fin DATETIME2(0) NULL,

        CONSTRAINT PK_Daily PRIMARY KEY (daily_id),
        CONSTRAINT UQ_Daily_SprintFecha UNIQUE (sprint_id, fecha),
        CONSTRAINT FK_Daily_Sprint
            FOREIGN KEY (sprint_id)
            REFERENCES dbo.Sprint (sprint_id),
        CONSTRAINT FK_Daily_MiembroIniciador
            FOREIGN KEY (iniciada_por_miembro_id)
            REFERENCES dbo.MiembroProyecto (miembro_proyecto_id),
        CONSTRAINT FK_Daily_MiembroFinalizador
            FOREIGN KEY (finalizada_por_miembro_id)
            REFERENCES dbo.MiembroProyecto (miembro_proyecto_id),
        CONSTRAINT CK_Daily_Estado
            CHECK (estado IN ('PROGRAMADA', 'EN_CURSO', 'FINALIZADA'))
    );

    CREATE TABLE dbo.ParticipacionDaily
    (
        participacion_daily_id BIGINT IDENTITY(1,1) NOT NULL,
        daily_id BIGINT NOT NULL,
        miembro_proyecto_id BIGINT NOT NULL,
        hora_ingreso DATETIME2(0) NULL,

        CONSTRAINT PK_ParticipacionDaily PRIMARY KEY (participacion_daily_id),
        CONSTRAINT UQ_ParticipacionDaily_DailyMiembro
            UNIQUE (daily_id, miembro_proyecto_id),
        CONSTRAINT FK_ParticipacionDaily_Daily
            FOREIGN KEY (daily_id)
            REFERENCES dbo.Daily (daily_id),
        CONSTRAINT FK_ParticipacionDaily_MiembroProyecto
            FOREIGN KEY (miembro_proyecto_id)
            REFERENCES dbo.MiembroProyecto (miembro_proyecto_id)
    );

    CREATE TABLE dbo.MensajeDaily
    (
        mensaje_daily_id BIGINT IDENTITY(1,1) NOT NULL,
        daily_id BIGINT NOT NULL,
        autor_miembro_id BIGINT NOT NULL,
        elemento_sprint_id BIGINT NULL,
        tipo VARCHAR(15) NOT NULL
            CONSTRAINT DF_MensajeDaily_Tipo DEFAULT ('MENSAJE'),
        contenido NVARCHAR(MAX) NOT NULL,
        fecha_publicacion DATETIME2(0) NOT NULL
            CONSTRAINT DF_MensajeDaily_FechaPublicacion DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_MensajeDaily PRIMARY KEY (mensaje_daily_id),
        CONSTRAINT FK_MensajeDaily_Daily
            FOREIGN KEY (daily_id)
            REFERENCES dbo.Daily (daily_id),
        CONSTRAINT FK_MensajeDaily_Autor
            FOREIGN KEY (autor_miembro_id)
            REFERENCES dbo.MiembroProyecto (miembro_proyecto_id),
        CONSTRAINT FK_MensajeDaily_ElementoSprint
            FOREIGN KEY (elemento_sprint_id)
            REFERENCES dbo.ElementoSprint (elemento_sprint_id),
        CONSTRAINT CK_MensajeDaily_Tipo
            CHECK (tipo IN ('MENSAJE', 'AVANCE', 'IMPEDIMENTO')),
        CONSTRAINT CK_MensajeDaily_Contenido
            CHECK (LEN(LTRIM(RTRIM(contenido))) > 0)
    );

    CREATE TABLE dbo.SprintReview
    (
        sprint_review_id BIGINT IDENTITY(1,1) NOT NULL,
        sprint_id BIGINT NOT NULL,
        estado VARCHAR(15) NOT NULL
            CONSTRAINT DF_SprintReview_Estado DEFAULT ('BORRADOR'),
        participantes NVARCHAR(MAX) NULL,
        stakeholders_externos NVARCHAR(MAX) NULL,
        resultados NVARCHAR(MAX) NULL,
        retroalimentacion NVARCHAR(MAX) NULL,
        decisiones NVARCHAR(MAX) NULL,
        conclusion NVARCHAR(MAX) NULL,
        completada_por_miembro_id BIGINT NULL,
        fecha_completada DATETIME2(0) NULL,

        CONSTRAINT PK_SprintReview PRIMARY KEY (sprint_review_id),
        CONSTRAINT UQ_SprintReview_Sprint UNIQUE (sprint_id),
        CONSTRAINT FK_SprintReview_Sprint
            FOREIGN KEY (sprint_id)
            REFERENCES dbo.Sprint (sprint_id),
        CONSTRAINT FK_SprintReview_MiembroCompletador
            FOREIGN KEY (completada_por_miembro_id)
            REFERENCES dbo.MiembroProyecto (miembro_proyecto_id),
        CONSTRAINT CK_SprintReview_Estado
            CHECK (estado IN ('BORRADOR', 'COMPLETADA'))
    );

    CREATE TABLE dbo.SprintRetrospective
    (
        sprint_retrospective_id BIGINT IDENTITY(1,1) NOT NULL,
        sprint_id BIGINT NOT NULL,
        estado VARCHAR(15) NOT NULL
            CONSTRAINT DF_SprintRetrospective_Estado DEFAULT ('BORRADOR'),
        participantes NVARCHAR(MAX) NULL,
        aspectos_positivos NVARCHAR(MAX) NULL,
        problemas NVARCHAR(MAX) NULL,
        propuestas NVARCHAR(MAX) NULL,
        conclusion NVARCHAR(MAX) NULL,
        completada_por_miembro_id BIGINT NULL,
        fecha_completada DATETIME2(0) NULL,

        CONSTRAINT PK_SprintRetrospective PRIMARY KEY (sprint_retrospective_id),
        CONSTRAINT UQ_SprintRetrospective_Sprint UNIQUE (sprint_id),
        CONSTRAINT FK_SprintRetrospective_Sprint
            FOREIGN KEY (sprint_id)
            REFERENCES dbo.Sprint (sprint_id),
        CONSTRAINT FK_SprintRetrospective_MiembroCompletador
            FOREIGN KEY (completada_por_miembro_id)
            REFERENCES dbo.MiembroProyecto (miembro_proyecto_id),
        CONSTRAINT CK_SprintRetrospective_Estado
            CHECK (estado IN ('BORRADOR', 'COMPLETADA'))
    );

    CREATE TABLE dbo.AccionMejora
    (
        accion_mejora_id BIGINT IDENTITY(1,1) NOT NULL,
        sprint_retrospective_id BIGINT NOT NULL,
        elemento_backlog_id BIGINT NULL,
        descripcion NVARCHAR(MAX) NOT NULL,
        posicion INT NOT NULL,

        CONSTRAINT PK_AccionMejora PRIMARY KEY (accion_mejora_id),
        CONSTRAINT UQ_AccionMejora_RetrospectivaPosicion
            UNIQUE (sprint_retrospective_id, posicion),
        CONSTRAINT FK_AccionMejora_SprintRetrospective
            FOREIGN KEY (sprint_retrospective_id)
            REFERENCES dbo.SprintRetrospective (sprint_retrospective_id),
        CONSTRAINT FK_AccionMejora_ElementoBacklog
            FOREIGN KEY (elemento_backlog_id)
            REFERENCES dbo.ElementoBacklog (elemento_backlog_id),
        CONSTRAINT CK_AccionMejora_Descripcion
            CHECK (LEN(LTRIM(RTRIM(descripcion))) > 0),
        CONSTRAINT CK_AccionMejora_Posicion
            CHECK (posicion > 0)
    );

    CREATE INDEX IX_InvitacionProyecto_ProyectoUsuarioEstado
        ON dbo.InvitacionProyecto (proyecto_id, usuario_invitado_id, estado);

    CREATE INDEX IX_ElementoBacklog_ProyectoRetiradoPosicion
        ON dbo.ElementoBacklog (proyecto_id, retirado, posicion);

    CREATE INDEX IX_Sprint_ProyectoEstado
        ON dbo.Sprint (proyecto_id, estado);

    CREATE INDEX IX_ElementoSprint_SprintEstado
        ON dbo.ElementoSprint (sprint_id, estado);

    CREATE INDEX IX_ComentarioElementoSprint_ElementoFecha
        ON dbo.ComentarioElementoSprint (elemento_sprint_id, fecha_publicacion);

    CREATE INDEX IX_Impedimento_SprintEstado
        ON dbo.Impedimento (sprint_id, estado);

    CREATE INDEX IX_MensajeDaily_DailyFecha
        ON dbo.MensajeDaily (daily_id, fecha_publicacion);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;

/*
    Reglas que debe validar la capa de servicio/API:
    - Normalizar el correo antes de registrar o buscar un usuario.
    - Exigir contrasenas de al menos 12 caracteres, con un numero y un simbolo,
      antes de generar y almacenar el hash.
    - Crear al autor de un proyecto como miembro administrador, sin asignarle
      automaticamente una responsabilidad Scrum.
    - Impedir invitaciones pendientes duplicadas y validar que el invitado sea
      un usuario registrado que aun no pertenezca al proyecto.
    - Comprobar permisos administrativos y responsabilidades Scrum.
    - Mantener un solo Sprint activo o no finalizado por proyecto.
    - Exigir Sprint Goal, fechas, Definition of Done y al menos un elemento
      antes de activar un Sprint en estado BORRADOR.
    - Copiar la Definition of Done del proyecto a dod_snapshot al activar el Sprint.
    - Validar que los elementos y responsables pertenezcan al mismo proyecto.
    - Validar que las fechas de ElementoSprint esten dentro del Sprint.
    - Exigir la Definition of Done antes de marcar un elemento como terminado.
    - Crear una sola Daily por fecha y Sprint; la restriccion UNIQUE tambien
      protege esta regla ante inserciones concurrentes.
    - Registrar en ParticipacionDaily a los miembros esperados al iniciar la Daily;
      una hora_ingreso nula al finalizar representa una ausencia.
    - Completar la Sprint Review antes de la Sprint Retrospective.
    - Finalizar el Sprint solo despues de completar Review y Retrospective.
*/
