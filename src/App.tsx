import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Shield,
  User,
  Building2,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { Empleado, Gasto, Anticipo } from './types';
import {
  getEmpleados,
  getGastos,
  getAnticipos,
  addEmpleado,
  subscribeToDataChanges,
} from './storage';
import { EmployeePortal } from './components/EmployeePortal';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [view, setView] = useState<'empleado' | 'admin'>('empleado');
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>('');
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Cargar datos
  const reloadData = () => {
    const emps = getEmpleados();
    const gsts = getGastos();
    const ants = getAnticipos();
    setEmpleados(emps);
    setGastos(gsts);
    setAnticipos(ants);
    if (selectedEmpleadoId && !emps.some((e) => e.id === selectedEmpleadoId)) {
      setSelectedEmpleadoId('');
    }
  };

  useEffect(() => {
    reloadData();
    const unsubscribe = subscribeToDataChanges(() => {
      reloadData();
    });
    return () => unsubscribe();
  }, []);

  const handleAddNewEmpleado = (nombre: string) => {
    const nuevo = addEmpleado({
      nombre,
    });
    reloadData();
    setSelectedEmpleadoId(nuevo.id);
  };

  const currentEmpleado = empleados.find((e) => e.id === selectedEmpleadoId) || empleados[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans overflow-x-hidden">
      {/* Barra superior de navegación (Top Bar Contract) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 overflow-x-clip">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Zona 1: Marca */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-none">
                GastoControl
              </span>
              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap block mt-0.5">
                Gastos de personal
              </span>
            </div>
          </div>

          {/* Zona 2: Selector de Modo (Empleado sin clave / Administrador con PIN) */}
          <nav className="flex items-center p-1 bg-slate-100 rounded-xl shrink-0">
            <button
              onClick={() => setView('empleado')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                view === 'empleado'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Portal Empleado</span>
            </button>

            <button
              onClick={() => setView('admin')}
              className={`hidden md:flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                view === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Administración</span>
            </button>
          </nav>

          {/* Zona 3: Ayuda / Info rápida */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Guía de uso para empleados y gestoría"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-x-hidden">
        {view === 'empleado' ? (
          <EmployeePortal
            empleados={empleados}
            selectedEmpleadoId={selectedEmpleadoId}
            onSelectEmpleado={(id) => setSelectedEmpleadoId(id)}
            onGastoCreated={reloadData}
            onAddNewEmpleado={handleAddNewEmpleado}
          />
        ) : (
          <AdminDashboard
            empleados={empleados}
            gastos={gastos}
            anticipos={anticipos}
            onDataChanged={reloadData}
          />
        )}
      </main>

      {/* Pie de página discreto */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>© 2026 GastoControl</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="text-emerald-700 font-medium">Demo local · Datos ficticios · Sin nube</span>
          </div>
        </div>
      </footer>

      {/* Modal de Ayuda y Flujo de Trabajo */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">¿Cómo funciona GastoControl?</h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Para los empleados (Sin contraseña)</h4>
                  <p className="mt-0.5">
                    Entran directamente, eligen su nombre, hacen una foto al ticket con la cámara o adjuntan la factura (JPG, PNG o PDF) e introducen el importe. Al guardar, queda archivado al instante.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Control de anticipos pagados previamente</h4>
                  <p className="mt-0.5">
                    En el panel de Administración (PIN <span className="font-mono font-bold">****</span>) puedes registrar el dinero adelantado a cada trabajador. La app calcula automáticamente el saldo: si le sobra dinero del anticipo por justificar o si gastó de más y la empresa debe reembolsarle.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Cierre mensual para la Asesoría Contable</h4>
                  <p className="mt-0.5">
                    Al terminar el mes, descarga con un solo clic:
                  </p>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li><strong>Hoja Excel (.xlsx):</strong> Con desglose contable</li>
                    <li><strong>Paquete ZIP:</strong> Con todas las fotos de los tickets y facturas ordenadas por fecha y empleado.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
