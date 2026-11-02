import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Wallet,
  TrendingDown,
  ArrowRightLeft,
  FileSpreadsheet,
  Download,
  Calendar,
  Check,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Plus,
  RefreshCw,
  Building,
  KeyRound,
  FileText,
  AlertTriangle,
  UserCheck,
  Printer,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import {
  Anticipo,
  BalanceEmpleado,
  Empleado,
  EmpresaConfig,
  EstadoGasto,
  Gasto,
  MetodoAnticipo,
} from '../types';
import {
  addAnticipo,
  deleteAnticipo,
  clearAllAnticipos,
  deleteGasto,
  clearAllGastos,
  getAllBalances,
  getAdminPin,
  saveAdminPin,
  getEmpresaConfig,
  saveEmpresaConfig,
  updateGasto,
  addEmpleado,
  deleteEmpleado,
  exportDatabaseJSON,
  importDatabaseJSON,
} from '../storage';
import { exportGastosToExcel, downloadReceiptsZip } from '../utils/exportHelper';
import { ReceiptModal } from './ReceiptModal';

interface AdminDashboardProps {
  empleados: Empleado[];
  gastos: Gasto[];
  anticipos: Anticipo[];
  onDataChanged: () => void;
}

type AdminTab = 'balances' | 'anticipos' | 'gastos' | 'asesoria' | 'empleados' | 'ajustes';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  empleados,
  gastos,
  anticipos,
  onDataChanged,
}) => {
  // Autenticación con PIN
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Pestaña activa
  const [activeTab, setActiveTab] = useState<AdminTab>('balances');

  // Filtros
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [filtroMes, setFiltroMes] = useState<string>('all');
  const [filtroEmpleado, setFiltroEmpleado] = useState<string>('all');
  const [filtroEstado, setFiltroEstado] = useState<string>('all');
  const [filtroTipoDoc, setFiltroTipoDoc] = useState<string>('all');

  // Modales
  const [viewingGasto, setViewingGasto] = useState<Gasto | null>(null);
  const [showNewAnticipoModal, setShowNewAnticipoModal] = useState<boolean>(false);
  const [preSelectedEmpleadoForAnticipo, setPreSelectedEmpleadoForAnticipo] = useState<string>('');

  // Formulario nuevo anticipo
  const [antEmpleadoId, setAntEmpleadoId] = useState<string>('');
  const [antFecha, setAntFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [antImporte, setAntImporte] = useState<string>('');
  const [antMetodo, setAntMetodo] = useState<MetodoAnticipo>('Transferencia');
  const [antConcepto, setAntConcepto] = useState<string>('');
  const [antNotas, setAntNotas] = useState<string>('');

  // Formulario nuevo empleado
  const [showNewEmpleadoModal, setShowNewEmpleadoModal] = useState<boolean>(false);
  const [empNombre, setEmpNombre] = useState('');

  // Estados de exportación
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Configuración empresa y PIN
  const [empresaConfig, setEmpresaConfig] = useState<EmpresaConfig>(getEmpresaConfig());
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const restoreInputRef = React.useRef<HTMLInputElement>(null);

  // Balances
  const balances = getAllBalances();

  // Validar PIN
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = getAdminPin();
    if (enteredPin.trim() === storedPin) {
      setIsAuthenticated(true);
      setPinError(null);
    } else {
      setPinError('PIN incorrecto.');
    }
  };

  // Guardar nuevo anticipo
  const handleCreateAnticipo = (e: React.FormEvent) => {
    e.preventDefault();
    const importeNum = parseFloat(antImporte.replace(',', '.'));
    if (!antEmpleadoId || !importeNum || importeNum <= 0 || !antConcepto.trim()) {
      alert('Por favor, rellena todos los campos obligatorios del anticipo.');
      return;
    }

    try {
      addAnticipo({
        empleadoId: antEmpleadoId,
        fecha: antFecha,
        importe: importeNum,
        metodo: antMetodo,
        concepto: antConcepto.trim(),
        notas: antNotas.trim() || undefined,
      });
    } catch (err) {
      console.error('Error al registrar anticipo:', err);
    } finally {
      setShowNewAnticipoModal(false);
      setAntImporte('');
      setAntConcepto('');
      setAntNotas('');
      onDataChanged();
      showMessage('Anticipo registrado con éxito.');
    }
  };

  // Crear empleado
  const handleCreateEmpleado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empNombre.trim()) return;
    addEmpleado({
      nombre: empNombre.trim(),
    });
    setShowNewEmpleadoModal(false);
    setEmpNombre('');
    onDataChanged();
    showMessage('Empleado añadido a la plantilla.');
  };

  // Cambiar estado de un gasto
  const handleChangeEstadoGasto = (gasto: Gasto, nuevoEstado: EstadoGasto) => {
    updateGasto({ ...gasto, estado: nuevoEstado });
    onDataChanged();
  };

  // Exportar Excel
  const handleExportExcel = () => {
    try {
      exportGastosToExcel(gastos, balances, anticipos, empresaConfig, filtroMes);
      showMessage('Hoja Excel descargada con éxito.');
    } catch (err) {
      console.error(err);
      alert('Error al generar el archivo Excel.');
    }
  };

  // Descargar ZIP de comprobantes
  const handleExportZip = async () => {
    try {
      setIsExportingZip(true);
      setZipProgress(5);
      await downloadReceiptsZip(gastos, balances, filtroMes, (p) => setZipProgress(p));
      showMessage('Paquete ZIP de tickets descargado con éxito.');
    } catch (err: any) {
      alert(err.message || 'Error al generar el archivo comprimido.');
    } finally {
      setIsExportingZip(false);
    }
  };

  const showMessage = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Si no está autenticado, mostrar pantalla de bloqueo con PIN
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-center text-slate-900">Acceso a Administración</h2>
        <p className="text-xs text-center text-slate-500 mt-1 mb-6">
          Introduce tu PIN para acceder al control de anticipos, balances y exportación para la asesoría contable.
        </p>

        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 text-center">
              PIN de Acceso
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              autoFocus
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              placeholder="••••"
              className="w-full text-center text-2xl tracking-widest font-mono py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <p className='text-center'>Codigo demo:2468</p>
          </div>

          {pinError && (
            <p className="text-xs text-red-600 text-center font-medium bg-red-50 p-2 rounded-lg">
              {pinError}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            Entrar al Panel
          </button>

        </form>
      </div>
    );
  }

  // Cálculos globales
  const totalAnticiposGlobal = anticipos.reduce((s, a) => s + (Number(a.importe) || 0), 0);
  const totalGastosJustificadosGlobal = gastos
    .filter((g) => g.estado !== 'Rechazado')
    .reduce((s, g) => s + (Number(g.importeTotal) || 0), 0);
  const totalTickets = gastos.filter((g) => g.tipoDocumento === 'Ticket').length;
  const totalFacturas = gastos.filter((g) => g.tipoDocumento.includes('Factura')).length;

  // Filtrado de gastos para la tabla
  const gastosFiltrados = gastos.filter((g) => {
    if (filtroMes !== 'all' && !g.fecha.startsWith(filtroMes)) return false;
    if (filtroEmpleado !== 'all' && g.empleadoId !== filtroEmpleado) return false;
    if (filtroEstado !== 'all' && g.estado !== filtroEstado) return false;
    if (filtroTipoDoc !== 'all' && g.tipoDocumento !== filtroTipoDoc) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast de notificación */}
      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Cabecera del Panel de Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              Panel Administrativo
            </span>
            <span className="text-xs text-slate-400">· {empresaConfig.nombreEmpresa}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">Control de Gastos y Asesoría</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAntEmpleadoId(empleados[0]?.id || '');
              setShowNewAnticipoModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Entregar Anticipo</span>
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Bloquear panel"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards: Resumen Financiero de Anticipos y Gastos Reales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Anticipos Entregados</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalAnticiposGlobal.toFixed(2)} €
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Dinero adelantado al personal</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Gastos Reales Justificados</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalGastosJustificadosGlobal.toFixed(2)} €
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalFacturas} facturas · {totalTickets} tickets
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Diferencia Neta Global</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl font-bold font-mono tabular-nums ${
              totalAnticiposGlobal >= totalGastosJustificadosGlobal
                ? 'text-amber-600'
                : 'text-emerald-600'
            }`}
          >
            {(totalAnticiposGlobal - totalGastosJustificadosGlobal).toFixed(2)} €
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalAnticiposGlobal >= totalGastosJustificadosGlobal
              ? 'Anticipo en manos de empleados'
              : 'Gastos excedieron anticipos'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Cierre Fiscal Asesoría</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => setActiveTab('asesoria')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
            >
              Exportar {filtroMes === 'all' ? 'Completo' : filtroMes} ➔
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Excel e imágenes listos</p>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('balances')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'balances'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. Balances por Empleado
        </button>

        <button
          onClick={() => setActiveTab('gastos')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'gastos'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          2. Registro de Gastos ({gastos.length})
        </button>

        <button
          onClick={() => setActiveTab('anticipos')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'anticipos'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          3. Anticipos Pagados ({anticipos.length})
        </button>

        <button
          onClick={() => setActiveTab('asesoria')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'asesoria'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          4. Exportación Asesoría
        </button>

        <button
          onClick={() => setActiveTab('empleados')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'empleados'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          5. Plantilla Empleados
        </button>

        <button
          onClick={() => setActiveTab('ajustes')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'ajustes'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          6. Ajustes & Backup
        </button>
      </div>

      {/* TAB 1: BALANCES POR EMPLEADO */}
      {activeTab === 'balances' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Liquidación y Conciliación por Empleado
              </h3>
              <p className="text-xs text-slate-500">
                Comparativa de lo pagado previamente como anticipo contra los gastos reales justificados
              </p>
            </div>
            <button
              onClick={() => {
                setAntEmpleadoId(empleados[0]?.id || '');
                setShowNewAnticipoModal(true);
              }}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              + Nuevo Anticipo
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Empleado</th>
                  <th className="py-3 px-4 text-right">Anticipos Recibidos</th>
                  <th className="py-3 px-4 text-right">Gastos Justificados</th>
                  <th className="py-3 px-4 text-right">Pagado Bolsillo Propio</th>
                  <th className="py-3 px-4 text-right">Saldo Anticipo</th>
                  <th className="py-3 px-4 text-right">Posición Neta</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {balances.map((b) => (
                  <tr key={b.empleado.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-sm">{b.empleado.nombre}</p>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums text-slate-800">
                      {b.totalAnticipos.toFixed(2)} €
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums text-slate-800">
                      {b.totalGastosGeneral.toFixed(2)} €
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      {b.aReembolsarBolsillo.toFixed(2)} €
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      {b.saldoAnticipo > 0 ? (
                        <span className="text-amber-700 font-bold">
                          +{b.saldoAnticipo.toFixed(2)} € (Por justificar)
                        </span>
                      ) : b.saldoAnticipo < 0 ? (
                        <span className="text-red-600 font-bold">
                          {b.saldoAnticipo.toFixed(2)} € (Excedido)
                        </span>
                      ) : (
                        <span className="text-slate-400">0.00 €</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      {b.posicionNeta > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-emerald-800 bg-emerald-100 font-bold">
                          Abonar {b.posicionNeta.toFixed(2)} €
                        </span>
                      ) : b.posicionNeta < 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-amber-800 bg-amber-100 font-bold">
                          Debe justificar {Math.abs(b.posicionNeta).toFixed(2)} €
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-slate-600 bg-slate-100 font-medium">
                          Liquidado al día
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setAntEmpleadoId(b.empleado.id);
                            setShowNewAnticipoModal(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          title="Dar anticipo a este empleado"
                        >
                          + Anticipo
                        </button>
                        <button
                          onClick={() => {
                            setFiltroEmpleado(b.empleado.id);
                            setActiveTab('gastos');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          Ver Gastos
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LISTADO Y VALIDACIÓN DE GASTOS */}
      {activeTab === 'gastos' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Registro General de Gastos y Facturas
              </h3>
              <p className="text-xs text-slate-500">
                Revisa justificantes, valida importes y gestiona el estado para la contabilidad
              </p>
            </div>

            {/* Filtros rápidos */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="month"
                  value={filtroMes === 'all' ? '' : filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value || 'all')}
                  className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                  title="Filtrar por mes (en blanco muestra todos)"
                />
                {filtroMes !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setFiltroMes('all')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                  >
                    Ver todos ({gastos.length})
                  </button>
                )}
              </div>

              <select
                value={filtroEmpleado}
                onChange={(e) => setFiltroEmpleado(e.target.value)}
                className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
              >
                <option value="all">Todos los empleados</option>
                {empleados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
              >
                <option value="all">Todos los estados</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Aprobado">Aprobados</option>
                <option value="Contabilizado">Contabilizados</option>
              </select>

              {(filtroEmpleado !== 'all' || filtroEstado !== 'all' || filtroMes !== 'all') && (
                <button
                  onClick={() => {
                    setFiltroMes('all');
                    setFiltroEmpleado('all');
                    setFiltroEstado('all');
                  }}
                  className="text-xs text-blue-600 hover:underline px-2 py-1 cursor-pointer"
                >
                  Restablecer filtros
                </button>
              )}

              {gastos.length > 0 && (
                <button
                  onClick={async () => {
                    if (
                      confirm(
                        `¿Estás seguro de que deseas eliminar permanentemente TODOS los ${gastos.length} gastos del registro? Esta acción no se puede deshacer.`
                      )
                    ) {
                      await clearAllGastos();
                      onDataChanged();
                      showMessage('Todos los gastos han sido eliminados permanentemente.');
                    }
                  }}
                  className="text-xs px-2.5 py-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg font-medium transition-colors cursor-pointer"
                  title="Eliminar todos los gastos de la base de datos"
                >
                  Vaciar todos los gastos
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Empleado</th>
                  <th className="py-3 px-4">Proveedor / CIF</th>
                  <th className="py-3 px-4">Concepto / Cat.</th>
                  <th className="py-3 px-4 text-right">Coste Total</th>
                  <th className="py-3 px-4">Pago</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gastosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      No se han encontrado gastos con los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  gastosFiltrados.map((gasto) => {
                    const emp = empleados.find((e) => e.id === gasto.empleadoId);
                    return (
                      <tr key={gasto.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          {gasto.archivoAdjunto ? (
                            <button
                              onClick={() => setViewingGasto(gasto)}
                              className="w-8 h-8 rounded border border-slate-200 overflow-hidden relative group cursor-pointer bg-slate-100 block"
                              title="Ver foto del ticket"
                            >
                              {gasto.archivoAdjunto.tipo.includes('image') ? (
                                <img
                                  src={gasto.archivoAdjunto.dataUrl}
                                  alt="Ticket"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FileText className="w-5 h-5 text-blue-600 m-auto mt-1" />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sin foto</span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {gasto.fecha}
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {emp?.nombre || 'Empleado'}
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900 truncate max-w-[150px]">
                            {gasto.proveedor}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {gasto.cifProveedor || gasto.tipoDocumento}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="text-slate-800 truncate max-w-[160px]">{gasto.concepto}</p>
                          <span className="text-[10px] text-slate-400">{gasto.categoria}</span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900 text-sm whitespace-nowrap">
                          {gasto.importeTotal.toFixed(2)} €
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`text-[11px] font-semibold ${
                              gasto.formaPago === 'Anticipo'
                                ? 'text-amber-700'
                                : gasto.formaPago.includes('Bolsillo')
                                ? 'text-emerald-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {gasto.formaPago === 'Anticipo' ? 'Anticipo' : 'Bolsillo'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              gasto.estado === 'Aprobado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : gasto.estado === 'Contabilizado'
                                ? 'bg-blue-100 text-blue-800'
                                : gasto.estado === 'Rechazado'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {gasto.estado}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {gasto.estado !== 'Aprobado' && (
                              <button
                                onClick={() => handleChangeEstadoGasto(gasto, 'Aprobado')}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Aprobar gasto"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}

                            {gasto.estado !== 'Contabilizado' && (
                              <button
                                onClick={() => handleChangeEstadoGasto(gasto, 'Contabilizado')}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Marcar como Contabilizado para asesoría"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}

                            {gasto.archivoAdjunto && (
                              <button
                                onClick={() => setViewingGasto(gasto)}
                                className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                                title="Ver comprobante"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={async () => {
                                if (confirm(`¿Eliminar permanentemente el gasto de ${gasto.proveedor} (${gasto.importeTotal.toFixed(2)} €)?`)) {
                                  await deleteGasto(gasto.id);
                                  onDataChanged();
                                  showMessage('Gasto eliminado permanentemente.');
                                }
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                              title="Eliminar gasto permanentemente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ANTICIPOS PAGADOS */}
      {activeTab === 'anticipos' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Historial de Anticipos y Entregas de Dinero a Cuenta
              </h3>
              <p className="text-xs text-slate-500">
                Registra cada entrega previa de fondos al empleado antes de sus viajes o compras
              </p>
            </div>
            <div className="flex items-center gap-2">
              {anticipos.length > 0 && (
                <button
                  onClick={async () => {
                    if (
                      confirm(
                        `¿Estás seguro de que deseas eliminar permanentemente TODOS los ${anticipos.length} anticipos? Esta acción no se puede deshacer.`
                      )
                    ) {
                      await clearAllAnticipos();
                      onDataChanged();
                      showMessage('Todos los anticipos han sido eliminados permanentemente.');
                    }
                  }}
                  className="text-xs px-2.5 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl font-medium transition-colors cursor-pointer"
                  title="Eliminar todos los anticipos de la base de datos"
                >
                  Vaciar anticipos
                </button>
              )}
              <button
                onClick={() => {
                  setAntEmpleadoId(empleados[0]?.id || '');
                  setShowNewAnticipoModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Entregar Nuevo Anticipo</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Empleado</th>
                  <th className="py-3 px-4">Concepto / Motivo</th>
                  <th className="py-3 px-4">Medio de Pago</th>
                  <th className="py-3 px-4 text-right">Importe Entregado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {anticipos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No hay anticipos registrados todavía
                    </td>
                  </tr>
                ) : (
                  anticipos.map((ant) => {
                    const emp = empleados.find((e) => e.id === ant.empleadoId);
                    return (
                      <tr key={ant.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-600">{ant.fecha}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{emp?.nombre || 'Empleado'}</td>
                        <td className="py-3 px-4">
                          <p className="text-slate-800 font-medium">{ant.concepto}</p>
                          {ant.notas && <p className="text-[11px] text-slate-400 italic">{ant.notas}</p>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium">
                            {ant.metodo}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm tabular-nums text-amber-700">
                          {ant.importe.toFixed(2)} €
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={async () => {
                              if (confirm(`¿Eliminar anticipo de ${ant.importe.toFixed(2)} € a ${emp?.nombre}?`)) {
                                await deleteAnticipo(ant.id);
                                onDataChanged();
                                showMessage('Anticipo eliminado permanentemente.');
                              }
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                            title="Eliminar anticipo permanentemente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ASESORÍA Y EXPORTACIÓN CONTABLE */}
      {activeTab === 'asesoria' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-700 uppercase">
                  Módulo de Asesoría y Gestoría
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Cierre Mensual y Paquete Contable
                </h3>
                <p className="text-xs text-slate-500">
                  Descarga la hoja de cálculo contable y el archivo comprimido con todos los tickets y facturas organizados
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-600">Período Fiscal:</label>
                <input
                  type="month"
                  value={filtroMes === 'all' ? '' : filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value || 'all')}
                  className="text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-semibold"
                />
              </div>
            </div>

            {/* Botones de Descarga Principal para Asesoría */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              {/* Botón Excel */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    Descargar Hoja Excel Contable (.xlsx)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Incluye registro detallado de gastos, comprobantes adjuntos y hoja de liquidación de anticipos por empleado.
                  </p>
                </div>
                <button
                  onClick={handleExportExcel}
                  className="mt-4 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Excel ({filtroMes === 'all' ? 'Histórico' : filtroMes})</span>
                </button>
              </div>

              {/* Botón ZIP */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                    <Download className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    Descargar Paquete ZIP de Comprobantes
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Empaqueta todas las fotografías, facturas y tickets adjuntos del período seleccionado, renombrados con fecha, empleado y proveedor.
                  </p>
                </div>
                <button
                  onClick={handleExportZip}
                  disabled={isExportingZip}
                  className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isExportingZip ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Empaquetando... {zipProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Descargar ZIP con Facturas y Fotos</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GESTIÓN DE PLANTILLA */}
      {activeTab === 'empleados' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Plantilla de Empleados</h3>
              <p className="text-xs text-slate-500">
                Gestiona los trabajadores autorizados para registrar tickets y recibir anticipos
              </p>
            </div>
            <button
              onClick={() => setShowNewEmpleadoModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Empleado</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {empleados.map((emp) => {
              const bal = balances.find((b) => b.empleado.id === emp.id);
              return (
                <div key={emp.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{emp.nombre}</h4>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Saldo pendiente:</span>
                    <span className="font-mono font-bold">
                      {bal ? `${bal.saldoAnticipo.toFixed(2)} €` : '0.00 €'}
                    </span>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => {
                        if (confirm(`¿Dar de baja a ${emp.nombre}?`)) {
                          deleteEmpleado(emp.id);
                          onDataChanged();
                        }
                      }}
                      className="text-[11px] text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: AJUSTES Y BACKUP */}
      {activeTab === 'ajustes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Datos Empresa */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Datos de la Empresa y Asesoría</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre o Razón Social</label>
                <input
                  type="text"
                  value={empresaConfig.nombreEmpresa}
                  onChange={(e) => setEmpresaConfig({ ...empresaConfig, nombreEmpresa: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CIF / NIF</label>
                <input
                  type="text"
                  value={empresaConfig.cifEmpresa}
                  onChange={(e) => setEmpresaConfig({ ...empresaConfig, cifEmpresa: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email de la Gestoría / Asesoría</label>
                <input
                  type="email"
                  value={empresaConfig.emailAsesoria}
                  onChange={(e) => setEmpresaConfig({ ...empresaConfig, emailAsesoria: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <button
                onClick={() => {
                  saveEmpresaConfig(empresaConfig);
                  showMessage('Configuración guardada.');
                }}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg"
              >
                Guardar Datos Empresa
              </button>
            </div>
          </div>

          {/* Seguridad PIN & Copia de Seguridad */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Cambiar PIN de Administrador</h3>
              <p className="text-xs text-slate-500 mb-3">
                Protege el acceso a los balances, anticipos y descargas contables.
              </p>
              <div className="space-y-2 text-xs">
                <input
                  type="password"
                  placeholder="Nuevo PIN (ej: 4 dígitos)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-center text-sm"
                />
                <button
                  onClick={() => {
                    if (newPin.trim().length >= 4) {
                      saveAdminPin(newPin.trim());
                      setNewPin('');
                      showMessage('PIN actualizado correctamente.');
                    } else {
                      alert('El PIN debe tener al menos 4 caracteres.');
                    }
                  }}
                  className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg w-full"
                >
                  Actualizar PIN
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Copia de Seguridad y Restauración</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const json = exportDatabaseJSON();
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `CopiaSeguridad_GastoControl_${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                  }}
                  className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg"
                >
                  Exportar Backup JSON
                </button>

                <input ref={restoreInputRef} type="file" accept=".json,application/json" className="hidden" onChange={async (event) => {
                  const file=event.target.files?.[0];
                  event.target.value='';
                  if(!file) return;
                  if(file.size > 15_000_000){alert('La copia supera el límite de 15 MB.');return;}
                  try {
                    const json=await file.text();
                    if(!confirm('¿Restaurar esta copia? Se reemplazarán todos los datos de esta demo guardados en este navegador.'))return;
                    if(importDatabaseJSON(json)){
                      setEmpresaConfig(getEmpresaConfig());
                      onDataChanged();
                      showMessage('Copia restaurada correctamente.');
                    }else alert('Archivo no válido o no se pudo guardar la copia en el navegador.');
                  }catch {alert('No se pudo leer el archivo JSON.');}
                }}/>
                <button
                  type="button"
                  onClick={() => restoreInputRef.current?.click()}
                  className="px-3 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg"
                >
                  Restaurar copia de seguridad
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Anticipo */}
      {showNewAnticipoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-2xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewAnticipoModal(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Entregar Dinero a Cuenta (Anticipo)</h3>
                <p className="text-xs text-slate-500">
                  Registra el importe abonado previamente al trabajador para cubrir sus gastos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewAnticipoModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                title="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAnticipo} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Empleado Receptor *</label>
                <select
                  value={antEmpleadoId}
                  onChange={(e) => setAntEmpleadoId(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl"
                  required
                >
                  <option value="">Elegir trabajador</option>
                  {empleados.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 min-w-0">
                <div className="min-w-0">
                  <label className="block font-semibold text-slate-700 mb-1">Importe (€) *</label>
                  <input
                    type="text"
                    required
                    placeholder="250,00"
                    value={antImporte}
                    onChange={(e) => setAntImporte(e.target.value)}
                    className="w-full min-w-0 max-w-full block box-border text-sm font-bold font-mono px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block font-semibold text-slate-700 mb-1">Fecha Entrega *</label>
                  <div className="relative w-full min-w-0 max-w-full flex items-center justify-between bg-white border border-slate-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 cursor-pointer">
                    <span className="text-sm font-mono text-slate-900 select-none">
                      {antFecha ? antFecha.split('-').reverse().join('/') : 'Seleccionar'}
                    </span>
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={antFecha}
                      onChange={(e) => setAntFecha(e.target.value)}
                      onClick={(e) => {
                        try {
                          (e.currentTarget as HTMLInputElement).showPicker?.();
                        } catch {
                          // Fallback
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medio de Pago</label>
                <select
                  value={antMetodo}
                  onChange={(e) => setAntMetodo(e.target.value as MetodoAnticipo)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Efectivo">Efectivo en mano (Caja)</option>
                  <option value="Tarjeta">Tarjeta de Empresa con recarga</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Concepto / Destino *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Fondo para gastos ruta clientes Norte"
                  value={antConcepto}
                  onChange={(e) => setAntConcepto(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas adicionales</label>
                <input
                  type="text"
                  placeholder="Opcional..."
                  value={antNotas}
                  onChange={(e) => setAntNotas(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewAnticipoModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Guardar Anticipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Empleado */}
      {showNewEmpleadoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Añadir Nuevo Empleado</h3>
            <form onSubmit={handleCreateEmpleado} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej: Alberto Ruiz Sánchez"
                  value={empNombre}
                  onChange={(e) => setEmpNombre(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewEmpleadoModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visor de Justificante */}
      {viewingGasto && (
        <ReceiptModal
          gasto={viewingGasto}
          empleado={empleados.find((e) => e.id === viewingGasto.empleadoId)}
          onClose={() => setViewingGasto(null)}
          onUpdateGasto={(updated) => {
            updateGasto(updated);
            setViewingGasto(updated);
            onDataChanged();
          }}
        />
      )}
    </div>
  );
};
