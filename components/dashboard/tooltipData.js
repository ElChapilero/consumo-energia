const tooltipData = {
  1: {
    text: "Voltaje (V)",
    description:
      "Mide la diferencia de potencial eléctrico entre dos puntos del circuito.",
    impact:
      "Si el voltaje es demasiado bajo o alto, puede afectar el rendimiento o dañar los equipos conectados."
  },

  2: {
    text: "Corriente (A)",
    description:
      "Representa la cantidad de carga eléctrica que fluye por el circuito en un momento dado.",
    impact:
      "Valores elevados de corriente pueden indicar sobrecarga o fallas en el sistema eléctrico."
  },

  3: {
    text: "Frecuencia (Hz)",
    description:
      "Indica cuántas veces cambia la polaridad de la corriente alterna por segundo.",
    impact:
      "Variaciones fuera de 60 Hz pueden causar daños o reducir la eficiencia de equipos eléctricos sensibles."
  },

  4: {
    text: "Potencia Activa (W)",
    description:
      "Refleja el consumo instantáneo de energía eléctrica en el sistema.",
    impact:
      "Un aumento repentino puede señalar un equipo defectuoso o un uso ineficiente de la energía."
  },

  5: {
    text: "Resumen de Potencia",
    description:
      "Muestra el comportamiento de la potencia activa a lo largo del día.",
    impact:
      "Ayuda a visualizar picos de consumo y planificar estrategias de ahorro energético."
  },

  6: {
    text: "Energía por Día (kWh)",
    description:
      "Indica la cantidad total de energía consumida en cada jornada.",
    impact:
      "Permite detectar patrones de alto consumo y evaluar la eficiencia de tus hábitos diarios."
  },

  7: {
    text: "Costo por Hora ($COP)",
    description:
      "Estima el valor monetario del consumo eléctrico horario según la tarifa local.",
    impact:
      "Conocer el costo horario ayuda a programar el uso de equipos para reducir la factura eléctrica."
  },

  8: {
    text: "Voltaje Semanal (Comparativa)",
    description:
      "Compara el voltaje promedio de la semana actual con el de semanas anteriores.",
    impact:
      "Detecta fluctuaciones persistentes que pueden afectar la estabilidad del sistema."
  },

  9: {
    text: "Corriente Semanal (Comparativa)",
    description:
      "Analiza cómo varía la corriente promedio de esta semana frente a la histórica.",
    impact:
      "Ayuda a identificar si hay incrementos de consumo anormales en determinados días."
  },

  10: {
    text: "Frecuencia Semanal (Comparativa)",
    description:
      "Evalúa la estabilidad de la frecuencia eléctrica durante la semana.",
    impact:
      "Desviaciones recurrentes pueden indicar problemas en la red o equipos defectuosos."
  },

  11: {
    text: "Potencia Activa Semanal (Comparativa)",
    description:
      "Muestra el comportamiento de la potencia activa diaria comparada con semanas anteriores.",
    impact:
      "Permite ver si el sistema mantiene un consumo estable o hay picos inusuales."
  },

  12: {
    text: "Energía Semanal (Comparativa)",
    description:
      "Visualiza el consumo energético diario comparado con el promedio histórico semanal.",
    impact:
      "Facilita la identificación de días con uso excesivo de energía y posibles oportunidades de ahorro."
  },

  13: {
    text: "Costo Semanal ($COP)",
    description:
      "Compara el gasto eléctrico diario de la semana actual con el promedio de semanas pasadas.",
    impact:
      "Ayuda a controlar la evolución del costo energético y ajustar tus hábitos de consumo."
  },

    14: {
    text: "Histórico de Potencia Activa (W)",
    description:
      "Muestra la evolución de la potencia activa promedio durante las fechas escogidas.",
    impact:
      "Permite identificar aumentos o disminuciones en el consumo y detectar posibles picos de demanda."
  },

  15: {
    text: "Histórico de Energía (kWh)",
    description:
      "Refleja la tendencia del consumo energético total a lo largo de las fechas escogidas.",
    impact:
      "Ayuda a analizar patrones de uso, evaluar la eficiencia del sistema y planificar estrategias de ahorro."
  },

  16: {
    text: "Histórico de Voltaje (V)",
    description:
      "Registra las variaciones de voltaje promedio a lo largo de las fechas escogidas.",
    impact:
      "Detectar fluctuaciones permite prevenir daños en los equipos eléctricos y mejorar la estabilidad del sistema."
  },

  17: {
    text: "Histórico de Corriente (A)",
    description:
      "Muestra cómo ha cambiado la corriente eléctrica en el tiempo durante las fechas escogidas.",
    impact:
      "Ayuda a detectar sobrecargas o comportamientos anormales que puedan indicar fallas en la instalación."
  },

  18: {
    text: "Histórico de Frecuencia (Hz)",
    description:
      "Representa la estabilidad de la frecuencia eléctrica durante las fechas escogidas.",
    impact:
      "Un historial de variaciones permite identificar posibles problemas de suministro o ineficiencias en la red."
  },

  19: {
    text: "Histórico del Factor de Potencia (FP)",
    description:
      "Muestra cómo ha variado el factor de potencia promedio durante las fechas escogidas.",
    impact:
      "Analizar su evolución ayuda a mantener la eficiencia del sistema y evitar penalizaciones por bajo rendimiento."
  },

  20: {
    text: "Histórico del Gasto Energético ($COP)",
    description:
      "Presenta la evolución del costo eléctrico estimado durante las fechas escogidas.",
    impact:
      "Permite evaluar el impacto económico del consumo y ajustar estrategias para reducir la factura energética."
  }
}

export default tooltipData

