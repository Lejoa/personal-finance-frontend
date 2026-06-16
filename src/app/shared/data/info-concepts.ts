import { InfoConcept } from '../interfaces/info-concept.interface';

export const INFO_CONCEPTS: Record<string, InfoConcept> = {
  'gasto': {
    id: 'gasto',
    title: '¿Qué es? Un Gasto',
    accent: 'red',
    definition: 'Es todo el dinero que sale de tus cuentas: compras, pagos, servicios o deudas. Conocerlos te muestra en qué se va tu dinero cada mes.',
    example: 'Este mes tus gastos hormiga suman <strong style="color:#E53935;font-weight:700">$84.000</strong>, un 12% de tus gastos variables.',
    exampleProgress: 12,
    exampleStat: '12% de tus gastos variables',
    tip: 'Identificar uno solo y reducirlo puede liberar dinero para tu ahorro.'
  },
  'ingreso': {
    id: 'ingreso',
    title: '¿Qué es? Un Ingreso',
    accent: 'green',
    definition: 'Es todo el dinero que entra a tus cuentas, como tu salario, ventas o pagos que recibes. Es la base sobre la que armas tu presupuesto.',
    example: 'Este mes tus ingresos variables son <strong style="color:#43A047;font-weight:700">$12.000.000</strong>; el mes pasado fueron $9.400.000.',
    exampleProgress: 28,
    exampleStat: '+28% vs. el mes anterior',
    tip: 'Cuando tengas un mes alto, aparta un poco extra para los meses más bajos.'
  },
  'categorias-presupuestadas': {
    id: 'categorias-presupuestadas',
    title: 'Categoría presupuestada',
    accent: 'red',
    definition: 'Agrupa gastos del mismo tipo, como alimentación o transporte. Crearla te muestra a dónde va tu dinero y te ayuda a ponerle un límite a cada gasto.',
    tip: 'Empieza con pocas categorías amplias y divídelas con el tiempo. Un presupuesto simple es más fácil de mantener que uno con demasiadas categorías.'
  },
  'dinero-sin-presupuestar': {
    id: 'dinero-sin-presupuestar',
    title: 'Dinero sin presupuestar',
    accent: 'red',
    definition: 'Es el dinero que aún no has asignado a ninguna categoría. Presupuestarlo le da un propósito a cada peso y evita que se te escape sin darte cuenta.',
    tip: 'Apenas recibas tu ingreso, asígnale a cada peso una categoría, incluido el ahorro. Lo que no se asigna, suele desaparecer sin que lo notes.'
  },
  'mis-analisis': {
    id: 'mis-analisis',
    title: 'Mis análisis',
    accent: 'red',
    definition: 'Es un resumen que la app crea automáticamente con tus movimientos. Te ayuda a entender tus hábitos de dinero sin tener que calcular nada.'
  },
  'consejos-para-ti': {
    id: 'consejos-para-ti',
    title: 'Consejos para ti',
    accent: 'red',
    definition: 'Aquí explicamos conceptos financieros clave, como la tasa de ahorro. Entenderlos te da herramientas para tomar mejores decisiones con tu dinero.'
  }
};
