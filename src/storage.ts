import { Anticipo, BalanceEmpleado, Empleado, EmpresaConfig, Gasto } from './types';
import { createSampleReceiptDataUrl } from './utils/imageHelper';

// DEMO INDEPENDIENTE: almacenamiento exclusivamente local. Sin Firebase, sin API y sin datos reales.
const KEY = 'gastocontrol_demo_local_v2';
const DEFAULT_PIN = '2468'; // PIN de demostración, no es un mecanismo de seguridad.
const DEFAULT_CONFIG: EmpresaConfig = { nombreEmpresa: 'Servicios Ejemplo S.L.', cifEmpresa: 'B-28991200', emailAsesoria: 'asesoria@ejemplo.invalid' };

const sampleEmpleados: Empleado[] = [
  { id: 'demo-e1', nombre: 'Ana Pérez', activo: true },
  { id: 'demo-e2', nombre: 'Luis García', activo: true },
  { id: 'demo-e3', nombre: 'Marta López', activo: true },
  { id: 'demo-e4', nombre: 'David Ruiz', activo: true },
  { id: 'demo-e5', nombre: 'Elena Martín', activo: true },
];

const sampleAnticipos: Anticipo[] = [
  { id: 'demo-a1', empleadoId: 'demo-e1', fecha: '2026-10-25', importe: 350, metodo: 'Transferencia', concepto: 'Anticipo desplazamiento comercial', creadoEn: '2026-10-25T09:00:00.000Z' },
  { id: 'demo-a2', empleadoId: 'demo-e2', fecha: '2026-10-29', importe: 200, metodo: 'Efectivo', concepto: 'Gastos de visita técnica', creadoEn: '2026-10-29T09:00:00.000Z' },
  { id: 'demo-a3', empleadoId: 'demo-e3', fecha: '2026-11-01', importe: 420, metodo: 'Transferencia', concepto: 'Viaje instalación clientes zona norte', creadoEn: '2026-11-01T09:00:00.000Z' },
  { id: 'demo-a4', empleadoId: 'demo-e4', fecha: '2026-11-02', importe: 160, metodo: 'Transferencia', concepto: 'Material ferretería y peajes', creadoEn: '2026-11-02T09:00:00.000Z' },
];

const sampleGastos: Gasto[] = [
  {
    id: 'demo-g1',
    empleadoId: 'demo-e1',
    fecha: '2026-10-28',
    concepto: 'Combustible diésel furgoneta',
    categoria: 'Combustible',
    proveedor: 'Estación de Servicio Repsol M-40',
    cifProveedor: 'B-28001234',
    numDocumento: 'TK-2026-00491',
    tipoDocumento: 'Ticket',
    importeTotal: 60.5,
    formaPago: 'Anticipo',
    estado: 'Aprobado',
    observaciones: 'Llenado de depósito para desplazamiento a clientes.',
    archivoAdjunto: {
      nombre: 'ticket_repsol_60_50.svg',
      tipo: 'image/svg+xml',
      dataUrl: createSampleReceiptDataUrl('Estación de Servicio Repsol', 'B-28001234', 'Combustible diésel', 60.5, '2026-10-28', 'Ticket'),
      tamanoBytes: 1540,
    },
    creadoEn: '2026-10-28T10:15:00.000Z',
  },
  {
    id: 'demo-g2',
    empleadoId: 'demo-e1',
    fecha: '2026-10-30',
    concepto: 'Menú del día visita comercial',
    categoria: 'Dietas y Comidas',
    proveedor: 'Restaurante Mesón Don Pepe',
    cifProveedor: 'B-81992011',
    numDocumento: 'FS-2026-8812',
    tipoDocumento: 'Factura Simplificada',
    importeTotal: 22.0,
    formaPago: 'Anticipo',
    estado: 'Aprobado',
    observaciones: 'Almuerzo durante jornada continua en ruta.',
    archivoAdjunto: {
      nombre: 'ticket_restaurante_22_00.svg',
      tipo: 'image/svg+xml',
      dataUrl: createSampleReceiptDataUrl('Restaurante Mesón Don Pepe', 'B-81992011', 'Menú del día', 22.0, '2026-10-30', 'Ticket'),
      tamanoBytes: 1480,
    },
    creadoEn: '2026-10-30T14:30:00.000Z',
  },
  {
    id: 'demo-g3',
    empleadoId: 'demo-e2',
    fecha: '2026-11-01',
    concepto: 'Peaje autopista tramo norte',
    categoria: 'Peajes y Parking',
    proveedor: 'Autopistas del Norte A-6',
    cifProveedor: 'A-08221990',
    numDocumento: 'TK-AP6-99231',
    tipoDocumento: 'Ticket',
    importeTotal: 15.0,
    formaPago: 'Anticipo',
    estado: 'Pendiente',
    observaciones: 'Peaje de ida y vuelta para urgencia técnica.',
    archivoAdjunto: {
      nombre: 'ticket_peaje_15_00.svg',
      tipo: 'image/svg+xml',
      dataUrl: createSampleReceiptDataUrl('Autopistas del Norte', 'A-08221990', 'Peaje autopista', 15.0, '2026-11-01', 'Ticket'),
      tamanoBytes: 1390,
    },
    creadoEn: '2026-11-01T08:45:00.000Z',
  },
  {
    id: 'demo-g4',
    empleadoId: 'demo-e3',
    fecha: '2026-11-01',
    concepto: 'Alojamiento técnico 1 noche',
    categoria: 'Alojamiento',
    proveedor: 'Hotel Central Express',
    cifProveedor: 'B-48102938',
    numDocumento: 'FAC-2026-0144',
    tipoDocumento: 'Factura Completa',
    importeTotal: 99.0,
    formaPago: 'Anticipo',
    estado: 'Aprobado',
    observaciones: 'Habitación individual noche del 1 de noviembre.',
    archivoAdjunto: {
      nombre: 'factura_hotel_99_00.svg',
      tipo: 'image/svg+xml',
      dataUrl: createSampleReceiptDataUrl('Hotel Central Express', 'B-48102938', 'Alojamiento técnico', 99.0, '2026-11-01', 'Factura'),
      tamanoBytes: 1620,
    },
    creadoEn: '2026-11-01T20:10:00.000Z',
  },
  {
    id: 'demo-g5',
    empleadoId: 'demo-e4',
    fecha: '2026-11-02',
    concepto: 'Material fijación y tornillería',
    categoria: 'Material y Suministros',
    proveedor: 'Ferretería Industrial del Tajo',
    cifProveedor: 'B-50918273',
    numDocumento: 'FAC-2026-9012',
    tipoDocumento: 'Factura Completa',
    importeTotal: 48.4,
    formaPago: 'Bolsillo Propio (A reembolsar)',
    estado: 'Aprobado',
    observaciones: 'Material comprado in-situ de urgencia por falta de stock.',
    archivoAdjunto: {
      nombre: 'factura_ferreteria_48_40.svg',
      tipo: 'image/svg+xml',
      dataUrl: createSampleReceiptDataUrl('Ferretería Industrial', 'B-50918273', 'Material y recambios', 48.4, '2026-11-02', 'Factura'),
      tamanoBytes: 1580,
    },
    creadoEn: '2026-11-02T11:20:00.000Z',
  },
  {
    id: 'demo-g6',
    empleadoId: 'demo-e5',
    fecha: '2026-11-02',
    concepto: 'Estacionamiento 3 horas reunión',
    categoria: 'Peajes y Parking',
    proveedor: 'Parking Indigo Centro',
    cifProveedor: 'A-08119283',
    numDocumento: 'TK-PARK-3312',
    tipoDocumento: 'Ticket',
    importeTotal: 10.0,
    formaPago: 'Tarjeta Empresa',
    estado: 'Contabilizado',
    observaciones: 'Aparcamiento cercano a la sede del cliente.',
    archivoAdjunto: {
      nombre: 'ticket_parking_10_00.svg',
      tipo: 'image/svg+xml',
      dataUrl: createSampleReceiptDataUrl('Parking Indigo Centro', 'A-08119283', 'Estacionamiento rotativo', 10.0, '2026-11-02', 'Ticket'),
      tamanoBytes: 1410,
    },
    creadoEn: '2026-11-02T16:00:00.000Z',
  },
];
interface DemoData { empleados: Empleado[]; anticipos: Anticipo[]; gastos: Gasto[]; empresaConfig: EmpresaConfig; adminPin: string }
const initialData = (): DemoData => ({ empleados: structuredClone(sampleEmpleados), anticipos: structuredClone(sampleAnticipos), gastos: structuredClone(sampleGastos), empresaConfig: {...DEFAULT_CONFIG}, adminPin:DEFAULT_PIN });
let cache: DemoData = initialData();
const subscribers = new Set<() => void>();
let initialized = false;
const notify = () => subscribers.forEach(cb=>cb());
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch(e) { console.error('No se pudo guardar la demo local:',e); alert('No se pudo guardar. El almacenamiento del navegador puede estar lleno.'); } notify(); };
export const subscribeToDataChanges = (cb:()=>void) => { subscribers.add(cb); return ()=>{subscribers.delete(cb)}; };
export function initializeLocalDemo():void { // Nombre mantenido por compatibilidad interna. NO utiliza Firebase.
  if(initialized) return;
  initialized=true;
  try {
    const value=localStorage.getItem(KEY);
    if(value){
      const parsed=JSON.parse(value);
      if(isValid(parsed)) cache=parsed;
    } else {
      persist();
    }
  } catch(e){console.warn('Se cargarán los datos ficticios',e);}
}
const ready=()=>initializeLocalDemo();
const uid=(prefix:string)=>`${prefix}-${crypto.randomUUID()}`;
export const getEmpleados=():Empleado[]=>{ready();return cache.empleados;};
export const getAnticipos=():Anticipo[]=>{ready();return cache.anticipos;};
export const getGastos=():Gasto[]=>{ready();return cache.gastos;};
export function addEmpleado(e:{nombre:string}):Empleado {ready(); const next={id:uid('emp'),nombre:e.nombre.trim(),activo:true};cache.empleados=[...cache.empleados,next];persist();return next;}
export function updateEmpleado(e:Empleado):void {ready();cache.empleados=cache.empleados.map(x=>x.id===e.id?e:x);persist();}
export function deleteEmpleado(id:string):void {ready();cache.empleados=cache.empleados.filter(x=>x.id!==id);persist();}
export function addAnticipo(a:Omit<Anticipo,'id'|'creadoEn'>):Anticipo {ready();const next={...a,id:uid('ant'),creadoEn:new Date().toISOString()};cache.anticipos=[next,...cache.anticipos];persist();return next;}
export async function deleteAnticipo(id:string):Promise<void> {ready();cache.anticipos=cache.anticipos.filter(x=>x.id!==id);persist();}
export async function clearAllAnticipos():Promise<void> {ready();cache.anticipos=[];persist();}
export function addGasto(g:Omit<Gasto,'id'|'creadoEn'>):Gasto {ready();const next={...g,id:uid('gst'),creadoEn:new Date().toISOString()};cache.gastos=[next,...cache.gastos];persist();return next;}
export function updateGasto(g:Gasto):void {ready();cache.gastos=cache.gastos.map(x=>x.id===g.id?g:x);persist();}
export async function deleteGasto(id:string):Promise<void> {ready();cache.gastos=cache.gastos.filter(x=>x.id!==id);persist();}
export async function clearAllGastos():Promise<void> {ready();cache.gastos=[];persist();}
// CÁLCULO DE BALANCES
export function calcularBalanceEmpleado(empleadoId: string): BalanceEmpleado | null {
  const empleados = getEmpleados();
  const empleado = empleados.find((e) => e.id === empleadoId);
  if (!empleado) return null;

  const anticipos = getAnticipos().filter((a) => a.empleadoId === empleadoId);
  const gastos = getGastos().filter((g) => g.empleadoId === empleadoId && g.estado !== 'Rechazado');

  const totalAnticipos = anticipos.reduce((acc, a) => acc + (Number(a.importe) || 0), 0);

  const gastosConAnticipo = gastos.filter((g) => g.formaPago === 'Anticipo');
  const gastosBolsilloPropio = gastos.filter((g) => g.formaPago === 'Bolsillo Propio (A reembolsar)');
  const gastosTarjetaEmpresa = gastos.filter((g) => g.formaPago === 'Tarjeta Empresa');

  const totalGastosConAnticipo = gastosConAnticipo.reduce((acc, g) => acc + (Number(g.importeTotal) || 0), 0);
  const totalGastosBolsilloPropio = gastosBolsilloPropio.reduce((acc, g) => acc + (Number(g.importeTotal) || 0), 0);
  const totalGastosTarjetaEmpresa = gastosTarjetaEmpresa.reduce((acc, g) => acc + (Number(g.importeTotal) || 0), 0);
  const totalGastosGeneral = totalGastosConAnticipo + totalGastosBolsilloPropio + totalGastosTarjetaEmpresa;

  const saldoAnticipo = totalAnticipos - totalGastosConAnticipo;
  const aReembolsarBolsillo = totalGastosBolsilloPropio;
  const excesoGastoAnticipo = saldoAnticipo < 0 ? Math.abs(saldoAnticipo) : 0;
  const dineroPorJustificar = saldoAnticipo > 0 ? saldoAnticipo : 0;
  const posicionNeta = (aReembolsarBolsillo + excesoGastoAnticipo) - dineroPorJustificar;

  return {
    empleado,
    totalAnticipos,
    totalGastosConAnticipo,
    totalGastosBolsilloPropio,
    totalGastosTarjetaEmpresa,
    totalGastosGeneral,
    saldoAnticipo,
    aReembolsarBolsillo,
    posicionNeta,
  };
}

export function getAllBalances(): BalanceEmpleado[] {
  const empleados = getEmpleados();
  return empleados.map((e) => calcularBalanceEmpleado(e.id)!).filter(Boolean);
}


export function getAdminPin():string {ready();return cache.adminPin;}
export function saveAdminPin(pin:string):void {ready();cache.adminPin=pin;persist();}
export function getEmpresaConfig():EmpresaConfig {ready();return cache.empresaConfig;}
export function saveEmpresaConfig(config:EmpresaConfig):void {ready();cache.empresaConfig={...config};persist();}
export function exportDatabaseJSON():string {ready();return JSON.stringify({version:'demo-1',exportDate:new Date().toISOString(), ...cache},null,2);}
function isValid(d:any):d is DemoData {
  if(!d || typeof d!=='object' || !Array.isArray(d.empleados)||!Array.isArray(d.anticipos)||!Array.isArray(d.gastos)||!d.empresaConfig || typeof d.empresaConfig.nombreEmpresa!=='string') return false;
  if(d.empleados.length>1000 || d.gastos.length>30000 || d.anticipos.length>30000) return false;
  if(!d.empleados.every((e:any)=>typeof e.id==='string'&&typeof e.nombre==='string'&&e.nombre.length<200)) return false;
  if(!d.anticipos.every((a:any)=>typeof a.id==='string'&&typeof a.empleadoId==='string'&&typeof a.fecha==='string'&&Number.isFinite(a.importe))) return false;
  if(!d.gastos.every((g:any)=>typeof g.id==='string'&&typeof g.empleadoId==='string'&&typeof g.fecha==='string'&&typeof g.importeTotal==='number'&&Number.isFinite(g.importeTotal))) return false;
  if(typeof d.empresaConfig.cifEmpresa!=='string'||typeof d.empresaConfig.emailAsesoria!=='string') return false;
  if(d.adminPin!==undefined && typeof d.adminPin!=='string') return false;
  return true;
}
export function importDatabaseJSON(jsonStr:string):boolean {
  ready();try {if(jsonStr.length>15_000_000)return false;const d=JSON.parse(jsonStr);if(!isValid(d))return false;
    const next:DemoData={empleados:d.empleados,anticipos:d.anticipos,gastos:d.gastos,empresaConfig:d.empresaConfig,adminPin:typeof d.adminPin==='string'?d.adminPin:cache.adminPin};
    const previous=cache;cache=next;try {localStorage.setItem(KEY,JSON.stringify(cache));}catch(e){cache=previous;return false;}notify();return true;
  }catch(e){console.error('Copia JSON no válida',e);return false;}
}
