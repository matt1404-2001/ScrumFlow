# ScrumFlow

ScrumFlow es una aplicación web académica para apoyar la gestión de un proyecto Scrum, desde la organización del Product Backlog y la planificación del Sprint hasta sus eventos de seguimiento y cierre.

## Estructura del repositorio

- `frontend/`: aplicación cliente.
- `backend/`: API y lógica del sistema.
- `base-datos/`: script versionado para crear el esquema de SQL Server.
- `documentacion/`: contrato API, requisitos, reglas, casos de uso, diseño de interfaz y diagramas.

## Documentación

- [Especificación OpenAPI](documentacion/api/openapi.yaml)
- [Requerimientos](documentacion/requerimientos/requerimientos.md)
- [Reglas generales](documentacion/requerimientos/reglas-generales.md)
- [Casos de uso](documentacion/casos-uso/)
- [Guía de diseño de interfaz](documentacion/diseño/Guia_Diseno_Interfaz_ScrumFlow.md)
- [Esquema de base de datos](base-datos/schema.sql)

## Diagramas

### Diagrama de módulos Nivel 1

![Diagrama de módulos Nivel 1](documentacion/diagramas/Scrum%20nivel%201.png)

### Diagrama de base de datos

![Diagrama de base de datos](documentacion/diagramas/Untitled%20%289%29.png)

## Consultar la API con Swagger

1. Ubica el archivo [`documentacion/api/openapi.yaml`](documentacion/api/openapi.yaml).
2. Abre [Swagger Editor](https://editor.swagger.io/).
3. Importa el archivo `openapi.yaml` o copia su contenido en el editor.
4. Swagger mostrará automáticamente los endpoints, parámetros, requests, responses y schemas definidos en la especificación.

Las carpetas `frontend/` y `backend/` quedan preparadas para incorporar la implementación de la aplicación.
