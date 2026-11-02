import React, { useState } from 'react';
import { Download, RotateCw, X, ZoomIn, ZoomOut, FileText, CheckCircle2 } from 'lucide-react';
import { Gasto, Empleado } from '../types';
import { formatBytes } from '../utils/imageHelper';

interface ReceiptModalProps {
  gasto: Gasto | null;
  empleado?: Empleado;
  onClose: () => void;
  onUpdateGasto?: (gasto: Gasto) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ gasto, empleado, onClose, onUpdateGasto }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!gasto) return null;

  const adjunto = gasto.archivoAdjunto;
  const isPdf = adjunto?.tipo === 'application/pdf';

  const handleDownload = () => {
    if (!adjunto) return;
    const a = document.createElement('a');
    a.href = adjunto.dataUrl;
    a.download = adjunto.nombre || `comprobante_${gasto.fecha}_${gasto.proveedor}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleAssignIva = (tipo: number | null) => {
    if (!onUpdateGasto) return;
    if (tipo === null) {
      const updated: Gasto = {
        ...gasto,
        baseImponible: undefined,
        tipoIva: undefined,
        cuotaIva: undefined,
      };
      onUpdateGasto(updated);
    } else {
      const divisor = 1 + tipo / 100;
      const base = Number((gasto.importeTotal / divisor).toFixed(2));
      const cuota = Number((gasto.importeTotal - base).toFixed(2));
      const updated: Gasto = {
        ...gasto,
        baseImponible: base,
        tipoIva: tipo,
        cuotaIva: cuota,
      };
      onUpdateGasto(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                {gasto.tipoDocumento}
              </span>
              <h3 className="text-base font-bold text-slate-900 truncate">
                {gasto.proveedor} · {gasto.importeTotal.toFixed(2)} €
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registrado por {empleado?.nombre || 'Empleado'} · {gasto.fecha}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {adjunto && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                title="Descargar archivo original"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Descargar</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido dividido: Visor a la izquierda y Datos a la derecha */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100">
          {/* Zona de imagen / documento */}
          <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-900/95 min-h-[350px]">
            {/* Controles de visualización */}
            {!isPdf && adjunto && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-lg border border-slate-700 text-white shadow-lg">
                <button
                  onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Alejar"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono px-1 text-slate-300">{Math.round(scale * 100)}%</span>
                <button
                  onClick={() => setScale((s) => Math.min(3, s + 0.25))}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Acercar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-700 mx-0.5" />
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Girar 90º"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Canvas o visor */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              {adjunto ? (
                isPdf ? (
                  <div className="text-center p-8 bg-white/10 rounded-xl text-white max-w-sm">
                    <FileText className="w-16 h-16 mx-auto text-blue-400 mb-3" />
                    <p className="font-medium text-sm mb-1">{adjunto.nombre}</p>
                    <p className="text-xs text-slate-400 mb-4">{formatBytes(adjunto.tamanoBytes)}</p>
                    <a
                      href={adjunto.dataUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                    >
                      Abrir PDF en pestaña nueva
                    </a>
                  </div>
                ) : (
                  <div className="transition-transform duration-150 ease-out flex items-center justify-center">
                    <img
                      src={adjunto.dataUrl}
                      alt={`Comprobante de ${gasto.proveedor}`}
                      referrerPolicy="no-referrer"
                      className="max-h-[550px] max-w-full object-contain rounded shadow-lg bg-white"
                      style={{
                        transform: `scale(${scale}) rotate(${rotation}deg)`,
                      }}
                    />
                  </div>
                )
              ) : (
                <div className="text-center p-8 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-medium">No se adjuntó archivo o foto en este gasto</p>
                </div>
              )}
            </div>
          </div>

          {/* Ficha técnica contable */}
          <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Detalle para Asesoría
              </h4>

              <div>
                <span className="text-xs text-slate-400">Concepto / Motivo</span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{gasto.concepto}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Proveedor</span>
                  <p className="font-semibold text-slate-800 truncate mt-0.5">{gasto.proveedor}</p>
                </div>
                <div>
                  <span className="text-slate-400">CIF / NIF</span>
                  <p className="font-semibold text-slate-800 font-mono mt-0.5">
                    {gasto.cifProveedor || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Fecha del Gasto</span>
                  <p className="font-semibold text-slate-800 font-mono mt-0.5">{gasto.fecha}</p>
                </div>
                <div>
                  <span className="text-slate-400">Categoría</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{gasto.categoria}</p>
                </div>
              </div>

              {/* Cuadro fiscal */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 text-xs">
                {gasto.baseImponible != null ? (
                  <div className="flex justify-between text-slate-600">
                    <span>Base Imponible:</span>
                    <span className="font-mono tabular-nums">{gasto.baseImponible.toFixed(2)} €</span>
                  </div>
                ) : null}
                {gasto.tipoIva != null && gasto.cuotaIva != null ? (
                  <div className="flex justify-between text-slate-600">
                    <span>IVA ({gasto.tipoIva}%):</span>
                    <span className="font-mono tabular-nums">{gasto.cuotaIva.toFixed(2)} €</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-amber-700 bg-amber-50/70 px-2 py-1 rounded">
                    <span>Desglose IVA:</span>
                    <span className="font-semibold italic">Sin desglosar</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Registrado:</span>
                  <span className="font-mono tabular-nums text-blue-600">{gasto.importeTotal.toFixed(2)} €</span>
                </div>
              </div>

              {/* Selector rápido de IVA para Administración / Asesoría */}
              {onUpdateGasto && (
                <div className="bg-white rounded-xl p-2.5 border border-slate-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-700 block text-[11px]">
                    Desglosar IVA (Administración / Asesoría):
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: '0%', tipo: 0 },
                      { label: '4%', tipo: 4 },
                      { label: '10%', tipo: 10 },
                      { label: '21%', tipo: 21 },
                    ].map((btn) => (
                      <button
                        key={btn.tipo}
                        type="button"
                        onClick={() => handleAssignIva(btn.tipo)}
                        className={`py-1 px-1.5 text-center font-bold text-[11px] rounded transition-colors cursor-pointer border ${
                          gasto.tipoIva === btn.tipo
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  {gasto.tipoIva !== undefined && (
                    <button
                      type="button"
                      onClick={() => handleAssignIva(null)}
                      className="text-[10px] text-slate-400 hover:text-red-600 underline block mt-1 transition-colors cursor-pointer"
                    >
                      Quitar desglose (solo total)
                    </button>
                  )}
                </div>
              )}

              {/* Forma de pago y estado */}
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-slate-400">Medio de Pago:</span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {gasto.formaPago === 'Anticipo' ? (
                      <span className="text-amber-700 font-semibold">Pagado con Dinero de Anticipo</span>
                    ) : gasto.formaPago === 'Bolsillo Propio (A reembolsar)' ? (
                      <span className="text-emerald-700 font-semibold">Bolsillo Propio (Pendiente de Reembolso)</span>
                    ) : (
                      <span className="text-slate-700 font-semibold">Tarjeta de Empresa</span>
                    )}
                  </p>
                </div>

                {gasto.observaciones && (
                  <div>
                    <span className="text-slate-400">Notas adicionales:</span>
                    <p className="text-slate-600 bg-slate-50 p-2 rounded text-xs mt-1 italic">
                      "{gasto.observaciones}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Estado: {gasto.estado}
              </span>
              <span className="font-mono">ID: {gasto.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
