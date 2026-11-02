export type CategoriaGasto =
  | 'Combustible'
  | 'Dietas y Comidas'
  | 'Alojamiento'
  | 'Peajes y Parking'
  | 'Transporte'
  | 'Material y Suministros'
  | 'Agua'
  | 'Tarjetas de acceso'
  | 'ITV / Recambios vehículos'
  | 'Varios';

export type TipoDocumento = 'Ticket' | 'Factura Simplificada' | 'Factura Completa';

export type FormaPago = 'Anticipo' | 'Bolsillo Propio (A reembolsar)' | 'Tarjeta Empresa';

export type EstadoGasto = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Contabilizado';

export type MetodoAnticipo = 'Transferencia' | 'Efectivo' | 'Tarjeta';

export interface ArchivoAdjunto {
  nombre: string;
  tipo: string; // 'image/jpeg', 'image/png', 'application/pdf', etc.
  dataUrl: string;
  tamanoBytes?: number;
}

export interface Empleado {
  id: string;
  nombre: string;
  activo?: boolean;
}

export interface Anticipo {
  id: string;
  empleadoId: string;
  fecha: string; // YYYY-MM-DD
  importe: number;
  metodo: MetodoAnticipo;
  concepto: string;
  notas?: string;
  creadoEn: string;
}

export interface Gasto {
  id: string;
  empleadoId: string;
  fecha: string; // YYYY-MM-DD
  concepto: string;
  categoria: CategoriaGasto;
  proveedor: string;
  cifProveedor?: string;
  numDocumento?: string; // Nº Factura o Ticket
  tipoDocumento: TipoDocumento;
  baseImponible?: number;
  tipoIva?: number; // 0, 4, 10, 21
  cuotaIva?: number;
  importeTotal: number;
  formaPago: FormaPago;
  estado: EstadoGasto;
  archivoAdjunto?: ArchivoAdjunto;
  observaciones?: string;
  creadoEn: string;
}

export interface BalanceEmpleado {
  empleado: Empleado;
  totalAnticipos: number;
  totalGastosConAnticipo: number;
  totalGastosBolsilloPropio: number;
  totalGastosTarjetaEmpresa: number;
  totalGastosGeneral: number;
  // Saldo anticipo: anticipos recibidos - gastos pagados con anticipo
  // Si > 0: el empleado tiene dinero sobrante de anticipo por justificar o devolver
  // Si < 0: el empleado gastó más del anticipo recibido, la empresa le debe la diferencia
  saldoAnticipo: number;
  // Dinero directo a reembolsar al empleado por gastos hechos con su propio dinero
  aReembolsarBolsillo: number;
  // Posición neta final:
  // Si > 0: la empresa debe pagar al empleado este importe
  // Si < 0: el empleado debe devolver o justificar a la empresa
  posicionNeta: number; 
}

export interface EmpresaConfig {
  nombreEmpresa: string;
  cifEmpresa: string;
  emailAsesoria: string;
}
