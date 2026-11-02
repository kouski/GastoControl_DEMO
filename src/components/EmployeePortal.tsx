import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  CheckCircle,
  FileText,
  AlertCircle,
  Trash2,
  Calendar,
  Building,
  Euro,
  User,
  Plus,
  Send,
} from 'lucide-react';
import {
  CategoriaGasto,
  Empleado,
  FormaPago,
} from '../types';
import { processFileForUpload, formatBytes } from '../utils/imageHelper';
import { addGasto } from '../storage';

interface EmployeePortalProps {
  empleados: Empleado[];
  selectedEmpleadoId: string;
  onSelectEmpleado: (id: string) => void;
  onGastoCreated: () => void;
  onAddNewEmpleado: (nombre: string) => void;
}

const CATEGORIAS: { id: CategoriaGasto; label: string; icon: string }[] = [
  { id: 'Combustible', label: 'Combustible', icon: '⛽' },
  { id: 'Agua', label: 'Agua', icon: '💧' },
  { id: 'Tarjetas de acceso', label: 'Tarjetas de acceso', icon: '✈️' },
  { id: 'ITV / Recambios vehículos', label: 'ITV / Recambios vehículos', icon: '🚗' },
  { id: 'Dietas y Comidas', label: 'Dietas y Comidas', icon: '🍽️' },
  { id: 'Material y Suministros', label: 'Material y Compras', icon: '🔧' },
  { id: 'Peajes y Parking', label: 'Peajes y Parking', icon: '🅿️' },
  { id: 'Alojamiento', label: 'Hotel / Alojamiento', icon: '🏨' },
  { id: 'Transporte', label: 'Transporte / Billetes', icon: '🚆' },
  { id: 'Varios', label: 'Otros Gastos', icon: '📦' },
];

const formatFechaDisplay = (isoStr: string): string => {
  if (!isoStr) return 'Seleccionar fecha';
  try {
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
      return `${d}/${m}/${y}`;
    }
    return isoStr;
  } catch {
    return isoStr;
  }
};

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  empleados,
  selectedEmpleadoId,
  onSelectEmpleado,
  onGastoCreated,
  onAddNewEmpleado,
}) => {
  // Estado del formulario simplificado (inicia sin selección para mostrar "Elegir trabajador")
  const [empleadoId, setEmpleadoId] = useState<string>(selectedEmpleadoId || '');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [proveedor, setProveedor] = useState('');
  const [categoria, setCategoria] = useState<CategoriaGasto>('Material y Suministros');
  const [importeTotal, setImporteTotal] = useState<string>('');
  const [formaPago, setFormaPago] = useState<FormaPago>('Anticipo');

  // Archivo adjunto (foto o PDF)
  const [adjunto, setAdjunto] = useState<{
    nombre: string;
    tipo: string;
    dataUrl: string;
    tamanoBytes: number;
  } | null>(null);

  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal para agregar empleado rápido
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [newEmpNombre, setNewEmpNombre] = useState('');

  // Sincronizar si cambia desde fuera
  useEffect(() => {
    if (selectedEmpleadoId !== undefined && selectedEmpleadoId !== empleadoId) {
      setEmpleadoId(selectedEmpleadoId);
    }
  }, [selectedEmpleadoId]);

  // Si el empleado seleccionado ya no existe en la lista, resetear a vacío
  useEffect(() => {
    if (empleadoId && !empleados.some((e) => e.id === empleadoId)) {
      setEmpleadoId('');
      onSelectEmpleado('');
    }
  }, [empleados, empleadoId, onSelectEmpleado]);

  // Referencias a inputs de archivos
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manejador de subida de archivos (cámara directa o galería/archivos)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsProcessingFile(true);
      setErrorMessage(null);
      const processed = await processFileForUpload(files[0]);
      setAdjunto(processed);
    } catch (err) {
      console.error(err);
      setErrorMessage('Error al leer el archivo. Intenta con otra imagen o PDF.');
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
    }
  };

  // Enviar formulario rápido
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const empId = empleadoId.trim();
    if (!empId) {
      setErrorMessage('Por favor, selecciona qué trabajador registra el gasto en el desplegable.');
      return;
    }

    const numTotal = parseFloat(importeTotal.replace(',', '.'));
    if (!numTotal || numTotal <= 0 || isNaN(numTotal)) {
      setErrorMessage('Introduce el importe total del gasto.');
      return;
    }

    if (!fecha) {
      setErrorMessage('Por favor, indica la fecha del gasto.');
      return;
    }

    // Concepto generado automáticamente a partir de la categoría y el proveedor (si se indica)
    const provLimpio = proveedor.trim();
    const conceptoAutomatico = provLimpio ? `${categoria} en ${provLimpio}` : categoria;

    // Detectar tipo de documento según el archivo o por defecto Ticket
    const tipoDocumento = adjunto?.tipo === 'application/pdf' ? 'Factura Completa' : 'Ticket';

    addGasto({
      empleadoId: empId,
      fecha,
      concepto: conceptoAutomatico,
      categoria,
      proveedor: provLimpio || 'Sin especificar',
      tipoDocumento,
      importeTotal: numTotal,
      formaPago,
      estado: 'Pendiente',
      archivoAdjunto: adjunto || undefined,
    });

    // Resetear formulario para el siguiente ticket
    setProveedor('');
    setImporteTotal('');
    setAdjunto(null);

    // Feedback centrado a mitad de pantalla (dura ~1.8 segundos)
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 1800);

    onGastoCreated();
  };

  const handleCreateEmpleado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpNombre.trim()) return;
    onAddNewEmpleado(newEmpNombre.trim());
    setNewEmpNombre('');
    setShowAddEmpModal(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 min-w-0">
      {/* Popup / Notificación centrada a mitad de pantalla */}
      {showSuccessToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none animate-in fade-in duration-200">
          {/* Fondo oscurecido sutil */}
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-2xs transition-opacity duration-200" />

          {/* Tarjeta flotante en el centro de la pantalla */}
          <div className="relative bg-white text-slate-900 px-6 py-6 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-xs w-full mx-auto border border-emerald-500 transform animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">¡Gasto Registrado con Éxito!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tu justificante ha sido enviado y guardado correctamente.
            </p>
          </div>
        </div>
      )}

      {/* CONTENEDOR DEL FORMULARIO (DIV para garantizar que ninguna tecla Intro de teclado móvil envíe el formulario) */}
      <div
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            (e.target as HTMLElement)?.blur?.();
          }
        }}
        className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5 overflow-hidden min-w-0"
      >
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900">Registrar Nuevo Gasto</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Selecciona tu nombre, aporta la foto o archivo del ticket e introduce el importe
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. DESPLEGABLE CON EL NOMBRE DE LA PERSONA QUE REGISTRA */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            ¿Quién registra el gasto? *
          </label>
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex-1 min-w-0">
              <select
                required
                value={empleadoId}
                onChange={(e) => {
                  setEmpleadoId(e.target.value);
                  onSelectEmpleado(e.target.value);
                }}
                className={`w-full min-w-0 max-w-full appearance-none border text-sm font-bold rounded-xl pl-4 pr-10 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer transition-colors truncate ${
                  !empleadoId
                    ? 'bg-slate-50 border-slate-300 text-slate-500'
                    : 'bg-white border-blue-400 text-slate-900 shadow-xs'
                }`}
              >
                <option value="" disabled hidden>
                  Elegir trabajador
                </option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id} className="text-slate-900 font-medium">
                    {emp.nombre}
                  </option>
                ))}
              </select>
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => setShowAddEmpModal(true)}
              className="p-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-300 transition-colors cursor-pointer"
              title="Añadir nuevo nombre si no estás en la lista"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {!empleadoId && (
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Selecciona tu nombre en el desplegable antes de guardar el gasto
            </p>
          )}
        </div>

        {/* 2. JUSTIFICANTE: FOTO CON CÁMARA O SUBIR ARCHIVO */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Foto del ticket o factura <span className="font-normal text-slate-400">(opcional)</span>
          </label>

          {/* Inputs ocultos */}
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          {!adjunto ? (
            <div className="grid grid-cols-2 gap-3">
              {/* Botón Cámara Directa */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessingFile}
                className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400 rounded-2xl transition-all cursor-pointer group text-center"
              >
                <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-900">Hacer Foto</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Cámara móvil</span>
              </button>

              {/* Botón Adjuntar Archivo o PDF */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 rounded-2xl transition-all cursor-pointer group text-center"
              >
                <div className="w-11 h-11 rounded-full bg-slate-200/70 text-slate-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-900">Subir Archivo</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Galería o PDF</span>
              </button>
            </div>
          ) : (
            /* Vista previa del comprobante */
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {adjunto.tipo.includes('image') ? (
                  <img
                    src={adjunto.dataUrl}
                    alt="Ticket"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{adjunto.nombre}</p>
                  <p className="text-[11px] text-slate-500">{formatBytes(adjunto.tamanoBytes)}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={() => setAdjunto(null)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                  title="Quitar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. IMPORTE TOTAL (€) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Importe Total (€) *
          </label>
          <div className="relative min-w-0">
            <input
              type="text"
              inputMode="decimal"
              enterKeyHint="done"
              placeholder="0,00"
              value={importeTotal}
              onChange={(e) => setImporteTotal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.keyCode === 13) {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-full min-w-0 max-w-full block box-border text-2xl font-bold font-mono pl-4 pr-11 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <Euro className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 4. FECHA Y CATEGORÍA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0 max-w-full">
          <div className="w-full min-w-0 max-w-full">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Fecha del gasto *
            </label>
            <div className="relative w-full min-w-0 max-w-full flex items-center justify-between bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors cursor-pointer">
              <span className="text-sm font-mono text-slate-800 select-none">
                {formatFechaDisplay(fecha)}
              </span>
              <Calendar className="w-4 h-4 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                onClick={(e) => {
                  try {
                    (e.currentTarget as HTMLInputElement).showPicker?.();
                  } catch {
                    // Fallback
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                aria-label="Fecha del gasto"
              />
            </div>
          </div>

          <div className="w-full min-w-0 max-w-full">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Descripción gasto *
            </label>
            <div className="relative w-full min-w-0 max-w-full">
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaGasto)}
                className="w-full min-w-0 max-w-full block text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer truncate"
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 5. PROVEEDOR / ESTABLECIMIENTO */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Establecimiento o Proveedor <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <div className="relative min-w-0">
            <input
              type="text"
              enterKeyHint="done"
              placeholder="Ej: Repsol, Restaurante El Molino, Hotel, Parking..."
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.keyCode === 13) {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-full min-w-0 max-w-full block box-border text-sm pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <Building className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 6. FORMA DE PAGO */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            ¿Cómo se pagó este gasto? *
          </label>
          <div className="relative min-w-0">
            <select
              value={formaPago}
              onChange={(e) => setFormaPago(e.target.value as FormaPago)}
              className="w-full min-w-0 max-w-full block text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer truncate"
            >
              <option value="Anticipo">Con dinero de Anticipo entregado por la empresa</option>
              <option value="Bolsillo Propio (A reembolsar)">De mi bolsillo (A reembolsar por la empresa)</option>
              <option value="Tarjeta Empresa">Con Tarjeta de Empresa</option>
            </select>
          </div>
        </div>

        {/* BOTÓN ENVIAR */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Gasto</span>
          </button>
        </div>
      </div>

      {/* Modal para añadir nuevo empleado si no está en la lista */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Añadir Nombre</h3>
            <p className="text-xs text-slate-500">
              Introduce tu nombre para que aparezca en el desplegable.
            </p>
            <form onSubmit={handleCreateEmpleado} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nombre y Apellidos *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej: Miguel Hernández"
                  value={newEmpNombre}
                  onChange={(e) => setNewEmpNombre(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Añadir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
