import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { Anticipo, BalanceEmpleado, EmpresaConfig, Gasto } from '../types';

/**
 * Exporta los gastos a un archivo Excel (.xlsx) estructurado profesionalmente para asesorías contables
 */
export function exportGastosToExcel(
  gastos: Gasto[],
  balances: BalanceEmpleado[],
  anticipos: Anticipo[],
  empresa: EmpresaConfig,
  filtroMes: string // YYYY-MM o 'all'
): void {
  const wb = XLSX.utils.book_new();

  // Filtrar gastos si hay mes específico
  const gastosFiltrados = filtroMes === 'all'
    ? gastos
    : gastos.filter((g) => g.fecha.startsWith(filtroMes));

  // 1. Hoja principal: Registro Detallado de Gastos y Facturas
  const rowsGastos = gastosFiltrados.map((g, index) => {
    const emp = balances.find((b) => b.empleado.id === g.empleadoId)?.empleado;
    return {
      'Nº': index + 1,
      'Fecha': g.fecha,
      'Empleado': emp?.nombre || 'Desconocido',
      'Proveedor': g.proveedor,
      'CIF/NIF': g.cifProveedor || 'No indicado',
      'Nº Factura / Ref': g.numDocumento || '',
      'Tipo Documento': g.tipoDocumento,
      'Categoría': g.categoria,
      'Concepto': g.concepto,
      'Base Imponible (€)': g.baseImponible != null ? Number(g.baseImponible.toFixed(2)) : '',
      'Tipo IVA (%)': g.tipoIva != null ? `${g.tipoIva}%` : 'Sin desglosar',
      'Cuota IVA (€)': g.cuotaIva != null ? Number(g.cuotaIva.toFixed(2)) : '',
      'Total (€)': Number(g.importeTotal.toFixed(2)),
      'Forma de Pago': g.formaPago,
      'Estado': g.estado,
      'Archivo Adjunto': g.archivoAdjunto ? g.archivoAdjunto.nombre : 'Sin adjunto',
    };
  });

  const wsGastos = XLSX.utils.json_to_sheet(rowsGastos);
  XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos y Facturas');

  // 2. Hoja de Liquidación de Anticipos y Saldos con Empleados
  const rowsBalances = balances.map((b) => ({
    'Empleado': b.empleado.nombre,
    'Anticipos Recibidos (€)': Number(b.totalAnticipos.toFixed(2)),
    'Gastos Justificados con Anticipo (€)': Number(b.totalGastosConAnticipo.toFixed(2)),
    'Saldo Anticipo Pendiente (€)': Number(b.saldoAnticipo.toFixed(2)),
    'Gastos Pagados de su Bolsillo (€)': Number(b.aReembolsarBolsillo.toFixed(2)),
    'Posición Neta (€)': Number(b.posicionNeta.toFixed(2)),
    'Diagnóstico Liquidación': b.posicionNeta > 0
      ? `Abonar al empleado: ${b.posicionNeta.toFixed(2)} €`
      : b.posicionNeta < 0
      ? `Empleado debe justificar o devolver: ${Math.abs(b.posicionNeta).toFixed(2)} €`
      : 'Saldos al día (0.00 €)',
  }));

  const wsBalances = XLSX.utils.json_to_sheet(rowsBalances);
  XLSX.utils.book_append_sheet(wb, wsBalances, 'Liquidación Empleados');

  // Guardar archivo
  const nombreMes = filtroMes === 'all' ? 'Completo' : filtroMes;
  const fileName = `Informe_Gastos_Asesoria_${empresa.cifEmpresa}_${nombreMes}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Empaqueta todos los comprobantes (fotos, imágenes y facturas) en un archivo ZIP
 */
export async function downloadReceiptsZip(
  gastos: Gasto[],
  balances: BalanceEmpleado[],
  filtroMes: string,
  onProgress?: (porcentaje: number) => void
): Promise<void> {
  const zip = new JSZip();

  const gastosFiltrados = filtroMes === 'all'
    ? gastos.filter((g) => g.archivoAdjunto)
    : gastos.filter((g) => g.fecha.startsWith(filtroMes) && g.archivoAdjunto);

  if (gastosFiltrados.length === 0) {
    throw new Error('No hay comprobantes o facturas adjuntas en el período seleccionado.');
  }

  const folderName = `Facturas_y_Tickets_${filtroMes === 'all' ? 'Total' : filtroMes}`;
  const imgFolder = zip.folder(folderName);

  let procesados = 0;

  for (const gasto of gastosFiltrados) {
    if (!gasto.archivoAdjunto || !imgFolder) continue;

    const emp = balances.find((b) => b.empleado.id === gasto.empleadoId)?.empleado;
    const empNombre = (emp?.nombre || 'Empleado').replace(/[\s/\\:]+/g, '_');
    const provLimpio = gasto.proveedor.replace(/[\s/\\:]+/g, '_').substring(0, 15);
    const tipo = gasto.tipoDocumento.replace(/[\s/\\:]+/g, '_');
    
    // Extensión del archivo
    let ext = '.jpg';
    if (gasto.archivoAdjunto.tipo === 'application/pdf') ext = '.pdf';
    else if (gasto.archivoAdjunto.tipo === 'image/png') ext = '.png';
    else if (gasto.archivoAdjunto.tipo === 'image/svg+xml') ext = '.svg';

    const safeFilename = `${gasto.fecha}_${empNombre}_${provLimpio}_${tipo}_${gasto.importeTotal.toFixed(2)}eur${ext}`;

    // Obtener data base64 o svg
    const dataUrl = gasto.archivoAdjunto.dataUrl;
    if (dataUrl.startsWith('data:')) {
      const base64Data = dataUrl.split(',')[1];
      if (dataUrl.includes('image/svg+xml;utf8')) {
        // SVG en texto plano URI encoded
        const svgContent = decodeURIComponent(base64Data);
        imgFolder.file(safeFilename, svgContent);
      } else {
        // Base64 estándar
        imgFolder.file(safeFilename, base64Data, { base64: true });
      }
    }

    procesados++;
    if (onProgress) {
      onProgress(Math.round((procesados / gastosFiltrados.length) * 100));
    }
  }

  // Generar blob del ZIP y forzar descarga
  const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      onProgress(Math.min(99, Math.round(metadata.percent)));
    }
  });

  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Comprobantes_Contabilidad_${filtroMes === 'all' ? 'Historico' : filtroMes}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
