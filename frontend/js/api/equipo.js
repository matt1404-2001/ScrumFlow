const equiposSimulados = {
  "101": {
    members: [
      {
        miembroProyectoId: 11,
        usuario: { userId: 1, nombre: "María López", correo: "maria.lopez@correo.com" },
        esAdministrador: true,
        esProductOwner: true,
        esScrumMaster: false,
        esDeveloper: true,
        activo: true
      },
      {
        miembroProyectoId: 12,
        usuario: { userId: 2, nombre: "Juan Pérez", correo: "juan.perez@correo.com" },
        esAdministrador: false,
        esProductOwner: false,
        esScrumMaster: false,
        esDeveloper: true,
        activo: true
      },
      {
        miembroProyectoId: 13,
        usuario: { userId: 3, nombre: "Sofía Ramírez", correo: "sofia.ramirez@correo.com" },
        esAdministrador: false,
        esProductOwner: false,
        esScrumMaster: true,
        esDeveloper: true,
        activo: true
      },
      {
        miembroProyectoId: 14,
        usuario: { userId: 4, nombre: "Diego Silva", correo: "diego.silva@correo.com" },
        esAdministrador: true,
        esProductOwner: false,
        esScrumMaster: false,
        esDeveloper: true,
        activo: true
      }
    ],
    definitionOfDone: "Código revisado por otro integrante\nPruebas ejecutadas correctamente\nCambios integrados en la rama principal\nCriterios de aceptación verificados",
    pendingInvitations: [
      {
        invitationId: 81,
        projectId: 101,
        usuarioInvitado: { userId: 8, nombre: "Lucía Mendoza", correo: "lucia.mendoza@correo.com" },
        invitadoPor: { userId: 1, nombre: "María López", correo: "maria.lopez@correo.com" },
        estado: "PENDIENTE",
        fechaCreacion: "2026-10-08T14:30:00Z"
      }
    ]
  },
  "204": {
    members: [
      {
        miembroProyectoId: 21,
        usuario: { userId: 1, nombre: "María López", correo: "maria.lopez@correo.com" },
        esAdministrador: false,
        esProductOwner: false,
        esScrumMaster: false,
        esDeveloper: true,
        activo: true
      },
      {
        miembroProyectoId: 22,
        usuario: { userId: 5, nombre: "Andrés Molina", correo: "andres.molina@correo.com" },
        esAdministrador: true,
        esProductOwner: true,
        esScrumMaster: true,
        esDeveloper: false,
        activo: true
      }
    ],
    definitionOfDone: "Revisión funcional completada\nCambios publicados en el entorno de pruebas",
    pendingInvitations: []
  },
  "318": {
    members: [
      {
        miembroProyectoId: 31,
        usuario: { userId: 1, nombre: "María López", correo: "maria.lopez@correo.com" },
        esAdministrador: true,
        esProductOwner: false,
        esScrumMaster: false,
        esDeveloper: false,
        activo: true
      }
    ],
    definitionOfDone: null,
    pendingInvitations: []
  }
};
const proyectosAdministrados = new Set(["101", "318"]);

let siguienteInvitacionId = 100;

function obtenerDatos(projectId) {
  const datos = equiposSimulados[String(projectId)];
  if (!datos) throw crearError("No fue posible encontrar el proyecto.", "NOT_FOUND");
  return datos;
}

function crearError(mensaje, codigo) {
  const error = new Error(mensaje);
  error.codigo = codigo;
  return error;
}

export async function obtenerEquipo(projectId) {
  return structuredClone(obtenerDatos(projectId));
}

export async function crearInvitacion(projectId, { correo }) {
  const equipo = obtenerDatos(projectId);
  const correoNormalizado = correo.trim().toLowerCase();
  const yaRelacionado = equipo.members.some((miembro) => miembro.usuario.correo.toLowerCase() === correoNormalizado)
    || equipo.pendingInvitations.some((invitacion) => invitacion.usuarioInvitado.correo.toLowerCase() === correoNormalizado);

  if (yaRelacionado) {
    throw crearError("El usuario ya pertenece al proyecto o tiene una invitación pendiente.", "CONFLICT");
  }

  const nombresRegistrados = {
    "sofia.ramirez@correo.com": "Sofía Ramírez",
    "martin.arias@correo.com": "Martín Arias"
  };
  if (!nombresRegistrados[correoNormalizado]) {
    throw crearError("No existe una cuenta registrada con ese correo.", "NOT_FOUND");
  }

  const invitacion = {
    invitationId: siguienteInvitacionId++,
    projectId: Number(projectId),
    usuarioInvitado: { userId: siguienteInvitacionId, nombre: nombresRegistrados[correoNormalizado], correo: correoNormalizado },
    invitadoPor: { userId: 1, nombre: "María López", correo: "maria.lopez@correo.com" },
    estado: "PENDIENTE",
    fechaCreacion: new Date().toISOString()
  };
  equipo.pendingInvitations.push(invitacion);
  return structuredClone(invitacion);
}

export async function actualizarIntegrante(projectId, memberId, cambios) {
  const equipo = obtenerDatos(projectId);
  const integrante = equipo.members.find((miembro) => miembro.miembroProyectoId === Number(memberId));
  if (!integrante) throw crearError("No fue posible encontrar al integrante.", "NOT_FOUND");

  if (integrante.esAdministrador && cambios.esAdministrador === false) {
    const otrosAdministradores = equipo.members.filter((miembro) => miembro.esAdministrador && miembro !== integrante);
    if (!otrosAdministradores.length) {
      throw crearError("El proyecto debe conservar al menos un administrador técnico.", "CONFLICT");
    }
  }

  if (cambios.esProductOwner && equipo.members.some((miembro) => miembro !== integrante && miembro.esProductOwner)) {
    throw crearError("Ya existe un Product Owner. Cambia primero la responsabilidad del integrante actual.", "CONFLICT");
  }
  if (cambios.esScrumMaster && equipo.members.some((miembro) => miembro !== integrante && miembro.esScrumMaster)) {
    throw crearError("Ya existe un Scrum Master. Cambia primero la responsabilidad del integrante actual.", "CONFLICT");
  }

  Object.assign(integrante, cambios);
  return structuredClone(integrante);
}

export async function actualizarDefinitionOfDone(projectId, definitionOfDone) {
  const equipo = obtenerDatos(projectId);
  equipo.definitionOfDone = definitionOfDone.trim() || null;
  return { projectId: Number(projectId), definitionOfDone: equipo.definitionOfDone };
}

// Equivale a DELETE /api/proyectos/{projectId}/equipo/{memberId}.
export async function retirarIntegrante(projectId, memberId) {
  if (!proyectosAdministrados.has(String(projectId))) throw crearError("No tienes permiso para realizar esta acción.", "FORBIDDEN");
  const equipo = obtenerDatos(projectId);
  const integrante = equipo.members.find((miembro) => miembro.miembroProyectoId === Number(memberId));
  if (!integrante || !integrante.activo) throw crearError("No fue posible encontrar al integrante.", "NOT_FOUND");
  if (integrante.esAdministrador && equipo.members.filter((miembro) => miembro.activo && miembro.esAdministrador).length === 1) {
    throw crearError("El proyecto debe conservar al menos un administrador técnico.", "CONFLICT");
  }
  if (integrante.tieneTrabajoActivo) {
    throw crearError("Reasigna el trabajo activo del integrante antes de retirarlo.", "CONFLICT");
  }
  integrante.activo = false;
  integrante.esAdministrador = false;
  integrante.esProductOwner = false;
  integrante.esScrumMaster = false;
  integrante.esDeveloper = false;
  return { miembroProyectoId: integrante.miembroProyectoId, retirado: true };
}
