const proyectosSimulados = {
  "101": {
    proyecto: { nombre: "Sistema de Gestión Scrum", rol: "Administrador" },
    resumen: {
      projectId: 101,
      productGoal: "Simplificar la organización y el seguimiento del trabajo Scrum.",
      teamConfiguration: {
        hasProductOwner: true,
        hasScrumMaster: true,
        developerCount: 4,
        hasDefinitionOfDone: true,
        completeForActivation: true
      },
      currentSprint: {
        sprintId: 7001,
        sprintGoal: "Completar el acceso seguro y habilitar la creación de cuentas",
        fechaInicio: "2026-10-12",
        fechaFin: "2026-10-23",
        estado: "ACTIVO"
      },
      progress: {
        percentage: 33,
        counts: { pendiente: 1, enProgreso: 1, terminado: 1 }
      },
      dailyToday: { dailyDisponible: true, dailyId: null, estado: "PROGRAMADA" },
      openImpediments: 2,
      closingStatus: { reviewEstado: null, retrospectiveEstado: null },
      primaryRecommendation: {
        codigo: "DAILY_PENDIENTE",
        mensaje: "La Daily Scrum de hoy está pendiente",
        destino: "DAILY"
      },
      secondaryAlerts: []
    }
  },
  "204": {
    proyecto: { nombre: "Portal de Ventas", rol: "Integrante" },
    resumen: {
      projectId: 204,
      productGoal: "Reducir el tiempo necesario para dar seguimiento a oportunidades.",
      teamConfiguration: {
        hasProductOwner: true,
        hasScrumMaster: true,
        developerCount: 3,
        hasDefinitionOfDone: true,
        completeForActivation: true
      },
      currentSprint: null,
      progress: null,
      dailyToday: null,
      openImpediments: 0,
      closingStatus: { reviewEstado: null, retrospectiveEstado: null },
      primaryRecommendation: {
        codigo: "PLANIFICACION_PENDIENTE",
        mensaje: "No existe un Sprint actual. Planifica el siguiente Sprint",
        destino: "SPRINT"
      },
      secondaryAlerts: []
    }
  },
  "318": {
    proyecto: { nombre: "Experiencia de Clientes", rol: "Administrador" },
    resumen: {
      projectId: 318,
      productGoal: null,
      teamConfiguration: {
        hasProductOwner: true,
        hasScrumMaster: false,
        developerCount: 2,
        hasDefinitionOfDone: false,
        completeForActivation: false
      },
      currentSprint: null,
      progress: null,
      dailyToday: null,
      openImpediments: 0,
      closingStatus: { reviewEstado: null, retrospectiveEstado: null },
      primaryRecommendation: {
        codigo: "CONFIGURACION_PENDIENTE",
        mensaje: "Completa el equipo y los acuerdos del proyecto",
        destino: "EQUIPO"
      },
      secondaryAlerts: []
    }
  }
};

// Mantiene la misma frontera que tendrá GET /api/proyectos/{projectId}/resumen.
export async function obtenerResumenProyecto(projectId) {
  const datos = proyectosSimulados[String(projectId)];
  if (!datos) throw new Error("No fue posible encontrar el proyecto.");
  return structuredClone(datos);
}
