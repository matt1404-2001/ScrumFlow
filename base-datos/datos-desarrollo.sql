/*
    Datos minimos para ejecutar el frontend simulado contra la API local.
    Ejecute este script despues de schema.sql sobre la base ScrumFlow.
    Es idempotente y no reemplaza datos existentes.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @usuario_id BIGINT;

    SELECT @usuario_id = usuario_id
    FROM dbo.Usuario
    WHERE correo = N'maria.lopez@scrumflow.local';

    IF @usuario_id IS NULL
    BEGIN
        INSERT INTO dbo.Usuario (nombre, correo, contrasena_hash)
        VALUES (N'Mar' + NCHAR(237) + N'a L' + NCHAR(243) + N'pez', N'maria.lopez@scrumflow.local', N'DESARROLLO_SIN_AUTENTICACION');

        SET @usuario_id = SCOPE_IDENTITY();
    END;

    SET IDENTITY_INSERT dbo.Proyecto ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Proyecto WHERE proyecto_id = 101)
        INSERT INTO dbo.Proyecto (proyecto_id, creado_por_usuario_id, nombre, descripcion, product_goal)
        VALUES
        (
            101,
            @usuario_id,
            N'Sistema de Gesti' + NCHAR(243) + N'n Scrum',
            N'Plataforma acad' + NCHAR(233) + N'mica para organizar el trabajo y los eventos de un equipo Scrum.',
            N'Simplificar la organizaci' + NCHAR(243) + N'n y el seguimiento del trabajo Scrum.'
        );

    IF NOT EXISTS (SELECT 1 FROM dbo.Proyecto WHERE proyecto_id = 204)
        INSERT INTO dbo.Proyecto (proyecto_id, creado_por_usuario_id, nombre, descripcion, product_goal)
        VALUES (204, @usuario_id, N'Portal de Ventas', N'Mejoras al proceso comercial y seguimiento de oportunidades del equipo.', N'Reducir el tiempo necesario para dar seguimiento a oportunidades.');

    IF NOT EXISTS (SELECT 1 FROM dbo.Proyecto WHERE proyecto_id = 318)
        INSERT INTO dbo.Proyecto (proyecto_id, creado_por_usuario_id, nombre, descripcion, product_goal)
        VALUES
        (
            318,
            @usuario_id,
            N'Experiencia de Clientes',
            N'Iniciativas para simplificar el acompa' + NCHAR(241) + N'amiento y la atenci' + NCHAR(243) + N'n posterior a la compra.',
            NULL
        );

    SET IDENTITY_INSERT dbo.Proyecto OFF;

    IF NOT EXISTS (SELECT 1 FROM dbo.MiembroProyecto WHERE proyecto_id = 101 AND usuario_id = @usuario_id)
        INSERT INTO dbo.MiembroProyecto (proyecto_id, usuario_id, es_administrador, es_product_owner, es_developer)
        VALUES (101, @usuario_id, 1, 1, 1);

    IF NOT EXISTS (SELECT 1 FROM dbo.MiembroProyecto WHERE proyecto_id = 204 AND usuario_id = @usuario_id)
        INSERT INTO dbo.MiembroProyecto (proyecto_id, usuario_id, es_product_owner, es_developer)
        VALUES (204, @usuario_id, 1, 1);

    IF NOT EXISTS (SELECT 1 FROM dbo.MiembroProyecto WHERE proyecto_id = 318 AND usuario_id = @usuario_id)
        INSERT INTO dbo.MiembroProyecto (proyecto_id, usuario_id, es_administrador, es_developer)
        VALUES (318, @usuario_id, 1, 1);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;

    BEGIN TRY
        SET IDENTITY_INSERT dbo.Proyecto OFF;
    END TRY
    BEGIN CATCH
    END CATCH;

    THROW;
END CATCH;
