export interface DashboardRiskDistribution {
  totalSinRiesgo: number;
  totalRiesgoBajo: number;
  totalRiesgoMedio: number;
  totalRiesgoAlto: number;
}

export interface DashboardReport {
  totalEstudiantes: number;
  estudiantesConRiesgo: number;
  alertasPendientes: number;
  promedioGeneral: number;
  estudiantesConAsistenciaIrregular: number;
  estudiantesConBajoRendimiento: number;
  distribucionRiesgo: DashboardRiskDistribution;
}
