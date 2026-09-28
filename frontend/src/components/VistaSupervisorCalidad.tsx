'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Search,
  Check,
  X,
  Users,
  Award,
  Download,
  Send,
  MessageSquare,
  TrendingUp,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Filter,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Save,
  CheckCheck
} from 'lucide-react';
import {
  CursoDetallado,
  obtenerEstudiantesMedicion,
  guardarEstudiantesMedicion,
  obtenerHistorialObservaciones,
  agregarObservacionMedicion,
  revisarMedicion,
  obtenerUrlDescargaEvidenciaEstudiante,
  EvaluacionEstudianteItem,
  ObservacionMedicionItem,
  ItemEstudiantePayload
} from '@/lib/api';

interface VistaSupervisorCalidadProps {
  usuarioActual: {
    id: string;
    nombre: string;
    correo: string;
    rol: string;
    token?: string;
    programaAcademicoId?: string | null;
    nombrePrograma?: string | null;
  };
  cursosDisponibles: CursoDetallado[];
  onCerrarSesion: () => void;
}

// Función determinística para obtener una clave única por curso
export function getCursoClaveUnica(c: CursoDetallado): string {
  if (c.asignaturaPlanId && c.asignaturaPlanId.trim() !== '') return `plan_${c.asignaturaPlanId}`;
  if (c.medicionId && c.medicionId.trim() !== '') return `med_${c.medicionId}`;
  return `cur_${c.codigoAsignatura}_${c.codigoRa || 'RA'}_${c.programaAcademico}_${c.tipoAssessmentNumero || c.tipoAssessment}_${c.nombreDocente || ''}`.replace(/\s+/g, '_');
}

export default function VistaSupervisorCalidad({
  usuarioActual,
  cursosDisponibles,
  onCerrarSesion
}: VistaSupervisorCalidadProps) {
  const [seccionActual, setSeccionActual] = useState<'dashboard' | 'auditoria' | 'bitacora'>('dashboard');
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Lista local de cursos para permitir actualizaciones en vivo
  const [cursosLocales, setCursosLocales] = useState<CursoDetallado[]>(cursosDisponibles);

  useEffect(() => {
    setCursosLocales(cursosDisponibles);
  }, [cursosDisponibles]);

  // Filtros
  const [filtroPrograma, setFiltroPrograma] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroRa, setFiltroRa] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // Clave del curso actualmente seleccionado
  const [cursoSeleccionadoClave, setCursoSeleccionadoClave] = useState<string>('');

  // Estudiantes y notas
  const [estudiantesCurso, setEstudiantesCurso] = useState<EvaluacionEstudianteItem[]>([]);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);

  // Formulario para agregar estudiante
  const [mostrarFormEstudiante, setMostrarFormEstudiante] = useState(false);
  const [nuevoEstCodigo, setNuevoEstCodigo] = useState('');
  const [nuevoEstNombre, setNuevoEstNombre] = useState('');
  const [nuevoEstNota, setNuevoEstNota] = useState<number>(85);

  // Edición rápida de análisis y plan de mejora
  const [editandoAnalisis, setEditandoAnalisis] = useState(false);
  const [analisisCualitativoEdit, setAnalisisCualitativoEdit] = useState('');
  const [planMejoraEdit, setPlanMejoraEdit] = useState('');

  // Bitácora de observaciones
  const [observacionesCurso, setObservacionesCurso] = useState<ObservacionMedicionItem[]>([]);
  const [cargandoBitacora, setCargandoBitacora] = useState(false);
  const [nuevaObservacionTexto, setNuevaObservacionTexto] = useState('');
  const [enviandoObservacion, setEnviandoObservacion] = useState(false);

  // Formulario de Dictamen Formal del Supervisor
  const [dictamenObservacion, setDictamenObservacion] = useState('');
  const [dictamenPlanMejora, setDictamenPlanMejora] = useState('');
  const [guardandoDictamen, setGuardandoDictamen] = useState(false);

  // Identificar los cursos asignados a este Supervisor de Calidad
  const cursosSupervisados = useMemo(() => {
    const asignados = cursosLocales.filter((c) => {
      const matchCorreo = c.correoSupervisorRa?.toLowerCase() === usuarioActual.correo.toLowerCase();
      const matchNombre = c.nombreSupervisorRa?.toLowerCase().includes(usuarioActual.nombre.toLowerCase());
      return matchCorreo || matchNombre;
    });

    return asignados.length > 0 ? asignados : cursosLocales;
  }, [cursosLocales, usuarioActual]);

  // Lista única de RAs supervisados
  const rasSupervisados = useMemo(() => {
    const setRas = new Set<string>();
    cursosSupervisados.forEach((c) => {
      if (c.codigoRa) setRas.add(c.codigoRa);
    });
    return Array.from(setRas).sort();
  }, [cursosSupervisados]);

  // Lista única de Programas disponibles en los cursos supervisados
  const programasSupervisados = useMemo(() => {
    const mapProgs = new Map<string, string>();
    cursosSupervisados.forEach((c) => {
      if (c.programaAcademico) {
        mapProgs.set(c.programaAcademico, c.programaAcademico);
      }
    });
    return Array.from(mapProgs.values()).sort();
  }, [cursosSupervisados]);

  // Filtrado de cursos
  const cursosFiltrados = useMemo(() => {
    return cursosSupervisados.filter((c) => {
      const matchProg = filtroPrograma === 'todos' || c.programaAcademico === filtroPrograma;
      const matchRa = filtroRa === 'todos' || c.codigoRa === filtroRa;
      const matchTipo = filtroTipo === 'todos' || c.tipoAssessment.toLowerCase().includes(filtroTipo.toLowerCase());
      
      let matchEstado = true;
      if (filtroEstado !== 'todos') {
        const estNum = Number(filtroEstado);
        matchEstado = c.estadoEvaluacionNumero === estNum;
      }

      const matchTexto = busqueda === '' ||
        c.nombreAsignatura.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.codigoAsignatura.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.nombreDocente.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.programaAcademico.toLowerCase().includes(busqueda.toLowerCase());

      return matchProg && matchRa && matchTipo && matchEstado && matchTexto;
    });
  }, [cursosSupervisados, filtroPrograma, filtroRa, filtroTipo, filtroEstado, busqueda]);

  // Curso activo para auditoría garantizado
  const cursoActivo: CursoDetallado | null = useMemo(() => {
    if (cursosLocales.length === 0) return null;
    if (cursoSeleccionadoClave) {
      const encontrado = cursosLocales.find((c) => getCursoClaveUnica(c) === cursoSeleccionadoClave);
      if (encontrado) return encontrado;
    }
    if (cursosFiltrados.length > 0) return cursosFiltrados[0];
    return cursosSupervisados[0] || cursosLocales[0] || null;
  }, [cursoSeleccionadoClave, cursosFiltrados, cursosSupervisados, cursosLocales]);

  // Inicializar selección
  useEffect(() => {
    if (!cursoSeleccionadoClave && cursosFiltrados.length > 0) {
      setCursoSeleccionadoClave(getCursoClaveUnica(cursosFiltrados[0]));
    }
  }, [cursosFiltrados, cursoSeleccionadoClave]);

  // Sincronizar campos de edición cuando cambia el curso activo
  useEffect(() => {
    if (cursoActivo) {
      setAnalisisCualitativoEdit(cursoActivo.analisisCualitativo || '');
      setPlanMejoraEdit(cursoActivo.planMejora || '');
      setDictamenPlanMejora(cursoActivo.planMejora || '');
      setDictamenObservacion('');
      setEditandoAnalisis(false);
    }
  }, [cursoActivo]);

  // Cargar estudiantes y bitácora cuando cambia el curso activo
  useEffect(() => {
    if (!cursoActivo) return;

    const idConsulta = cursoActivo.medicionId || cursoActivo.asignaturaPlanId || cursoActivo.asignaturaId;
    if (!idConsulta) return;

    setCargandoEstudiantes(true);
    obtenerEstudiantesMedicion(idConsulta, usuarioActual.token || 'demo-token')
      .then((res) => {
        setEstudiantesCurso(res);
      })
      .catch(() => setEstudiantesCurso([]))
      .finally(() => setCargandoEstudiantes(false));

    setCargandoBitacora(true);
    obtenerHistorialObservaciones(idConsulta, usuarioActual.token || 'demo-token')
      .then((obs) => {
        setObservacionesCurso(obs);
      })
      .catch(() => setObservacionesCurso([]))
      .finally(() => setCargandoBitacora(false));
  }, [cursoActivo, usuarioActual.token]);

  // Métricas para el Dashboard del Supervisor
  const metricas = useMemo(() => {
    const total = cursosSupervisados.length;
    const aprobados = cursosSupervisados.filter((c) => c.estadoEvaluacionNumero === 2 || c.estadoEvaluacion === 'Aprobado').length;
    const enRevision = cursosSupervisados.filter((c) => c.estadoEvaluacionNumero === 1 || c.estadoEvaluacion === 'EnRevision' || c.estadoEvaluacion === 'En Revisión').length;
    const devueltos = cursosSupervisados.filter((c) => c.estadoEvaluacionNumero === 3 || c.estadoEvaluacion === 'Devuelto').length;
    const pendientes = cursosSupervisados.filter((c) => !c.estadoEvaluacionNumero || c.estadoEvaluacionNumero === 0 || c.estadoEvaluacion === 'Pendiente').length;

    const totalEstudiantesEvaluados = cursosSupervisados.reduce((acc, c) => acc + (c.totalEstudiantesEvaluados || 0), 0);
    const sumatoriaLogro = cursosSupervisados.reduce((acc, c) => acc + (c.porcentajeCumplimiento || 0), 0);
    const promedioLogro = total > 0 ? Math.round(sumatoriaLogro / total) : 0;

    return {
      total,
      aprobados,
      enRevision,
      devueltos,
      pendientes,
      totalEstudiantesEvaluados,
      promedioLogro
    };
  }, [cursosSupervisados]);

  // Manejar el dictamen de revisión (Aprobar o Devolver)
  const handleEmitirDictamen = async (aprobado: boolean) => {
    if (!cursoActivo) return;
    const idConsulta = cursoActivo.medicionId || cursoActivo.asignaturaPlanId || cursoActivo.asignaturaId;

    if (!dictamenObservacion.trim()) {
      setMensajeError('Por favor redacte las observaciones técnicas del dictamen antes de continuar.');
      setTimeout(() => setMensajeError(null), 4000);
      return;
    }

    setGuardandoDictamen(true);
    setMensajeError(null);
    setMensajeExito(null);

    const res = await revisarMedicion(
      idConsulta,
      aprobado,
      dictamenObservacion.trim(),
      dictamenPlanMejora.trim() || undefined,
      usuarioActual.token || 'demo-token'
    );

    setGuardandoDictamen(false);

    if (res.exitoso || res.datos) {
      setMensajeExito(res.mensaje || (aprobado ? 'Medición de calidad aprobada exitosamente.' : 'Medición devuelta con observaciones.'));
      setDictamenObservacion('');

      // Actualizar estado local del curso
      const nuevoEstadoTexto = aprobado ? 'Aprobado' : 'Devuelto';
      const nuevoEstadoNum = aprobado ? 2 : 3;

      const claveActual = getCursoClaveUnica(cursoActivo);

      setCursosLocales((prev) =>
        prev.map((c) => {
          if (getCursoClaveUnica(c) === claveActual) {
            return {
              ...c,
              estadoEvaluacion: nuevoEstadoTexto,
              estadoEvaluacionNumero: nuevoEstadoNum,
              planMejora: dictamenPlanMejora.trim() || c.planMejora
            };
          }
          return c;
        })
      );

      // Recargar bitácora
      const obsActualizadas = await obtenerHistorialObservaciones(idConsulta, usuarioActual.token || 'demo-token');
      setObservacionesCurso(obsActualizadas);

      setTimeout(() => setMensajeExito(null), 4000);
    } else {
      setMensajeError(res.mensaje || 'Error al emitir el dictamen.');
      setTimeout(() => setMensajeError(null), 4000);
    }
  };

  // Guardar edición del análisis cualitativo y plan de mejora
  const handleGuardarAnalisis = async () => {
    if (!cursoActivo) return;
    const idConsulta = cursoActivo.medicionId || cursoActivo.asignaturaPlanId || cursoActivo.asignaturaId;
    const claveActual = getCursoClaveUnica(cursoActivo);

    setCargando(true);
    // Registrar observación en bitácora reflejando el cambio
    await agregarObservacionMedicion(
      idConsulta,
      `Actualización de análisis cualitativo y plan de mejora: ${analisisCualitativoEdit.substring(0, 80)}...`,
      undefined,
      usuarioActual.token || 'demo-token'
    );
    setCargando(false);

    // Actualizar localmente
    setCursosLocales((prev) =>
      prev.map((c) => {
        if (getCursoClaveUnica(c) === claveActual) {
          return {
            ...c,
            analisisCualitativo: analisisCualitativoEdit,
            planMejora: planMejoraEdit
          };
        }
        return c;
      })
    );

    setEditandoAnalisis(false);
    setMensajeExito('Análisis cualitativo y plan de mejora guardados correctamente.');
    setTimeout(() => setMensajeExito(null), 3000);
  };

  // Manejar el envío de una nueva observación en la bitácora
  const handleEnviarObservacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaObservacionTexto.trim() || !cursoActivo) return;
    const idConsulta = cursoActivo.medicionId || cursoActivo.asignaturaPlanId || cursoActivo.asignaturaId;

    setEnviandoObservacion(true);
    const res = await agregarObservacionMedicion(
      idConsulta,
      nuevaObservacionTexto.trim(),
      undefined,
      usuarioActual.token || 'demo-token'
    );
    setEnviandoObservacion(false);

    if (res.exitoso || res.datos) {
      setNuevaObservacionTexto('');
      const obsActualizadas = await obtenerHistorialObservaciones(idConsulta, usuarioActual.token || 'demo-token');
      setObservacionesCurso(obsActualizadas);
      setMensajeExito('Observación agregada a la bitácora de auditoría.');
      setTimeout(() => setMensajeExito(null), 3000);
    } else {
      setMensajeError(res.mensaje || 'Error al enviar observación.');
      setTimeout(() => setMensajeError(null), 4000);
    }
  };

  // Manejar agregar estudiante a la evaluación del curso
  const handleAgregarEstudiante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursoActivo || !nuevoEstCodigo.trim() || !nuevoEstNombre.trim()) return;
    const idConsulta = cursoActivo.medicionId || cursoActivo.asignaturaPlanId || cursoActivo.asignaturaId;

    const payload: ItemEstudiantePayload = {
      codigoEstudiante: nuevoEstCodigo.trim(),
      nombreEstudiante: nuevoEstNombre.trim(),
      calificacion: Number(nuevoEstNota),
      observaciones: 'Agregado durante proceso de auditoría y muestreo de calidad.'
    };

    setCargando(true);
    const res = await guardarEstudiantesMedicion(idConsulta, [payload], usuarioActual.token || 'demo-token');
    setCargando(false);

    if (res.exitoso || res.datos) {
      setMensajeExito('Estudiante registrado en la matriz de calificaciones.');
      setMostrarFormEstudiante(false);
      setNuevoEstCodigo('');
      setNuevoEstNombre('');
      setNuevoEstNota(85);

      // Recargar estudiantes
      const estActualizados = await obtenerEstudiantesMedicion(idConsulta, usuarioActual.token || 'demo-token');
      setEstudiantesCurso(estActualizados);

      // Recalcular métricas cuantitativas locales
      if (estActualizados.length > 0) {
        const c90 = estActualizados.filter((st) => st.calificacion >= 90).length;
        const c70 = estActualizados.filter((st) => st.calificacion >= 70 && st.calificacion < 90).length;
        const c60 = estActualizados.filter((st) => st.calificacion >= 60 && st.calificacion < 70).length;
        const c0 = estActualizados.filter((st) => st.calificacion < 60).length;
        const cumplieron = estActualizados.filter((st) => st.calificacion >= 70).length;
        const porc = Math.round((cumplieron / estActualizados.length) * 100);

        const claveActual = getCursoClaveUnica(cursoActivo);
        setCursosLocales((prev) =>
          prev.map((c) => {
            if (getCursoClaveUnica(c) === claveActual) {
              return {
                ...c,
                totalEstudiantesEvaluados: estActualizados.length,
                porcentajeCumplimiento: porc,
                cantidadNivel90a100: c90,
                cantidadNivel70a89: c70,
                cantidadNivel60a69: c60,
                cantidadNivel0a59: c0
              };
            }
            return c;
          })
        );
      }

      setTimeout(() => setMensajeExito(null), 3000);
    } else {
      setMensajeError(res.mensaje || 'Error al guardar estudiante.');
      setTimeout(() => setMensajeError(null), 4000);
    }
  };

  return (
    <div className="h-screen max-h-screen bg-[#f1f5f9] text-[#1e293b] font-sans flex flex-col overflow-hidden">
      {/* HEADER INSTITUCIONAL SUPERIOR */}
      <header className="h-16 bg-white border-b border-[#cbd5e1] flex items-center justify-between px-6 shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
            <Image
              src="/logo-unimagdalena.svg"
              alt="Universidad del Magdalena"
              width={44}
              height={44}
              priority
              className="object-contain drop-shadow-xs"
            />
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-extrabold tracking-wide text-[#003865] uppercase flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#004b87]" />
              SISTEMA ASSESSMENT • SUPERVISIÓN DE CALIDAD
            </h1>
            <p className="text-xs font-semibold text-[#005a9c]">
              Facultad de Ingeniería • Auditoría de Resultados de Aprendizaje (RA)
            </p>
          </div>
        </div>

        {/* Info del Supervisor y Logout */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs font-bold text-[#003865] block">{usuarioActual.nombre}</span>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                Supervisor de Calidad
              </span>
              {rasSupervisados.map((ra) => (
                <span key={ra} className="text-[10px] font-mono font-bold bg-[#003865] text-white px-2 py-0.5 rounded">
                  {ra}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onCerrarSesion}
            title="Cerrar sesión"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd5e1] text-xs font-semibold text-[#64748b] hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* NOTIFICACIONES TOAST */}
      {mensajeExito && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}
      {mensajeError && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-bold animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden">
        {/* BARRA LATERAL DE NAVEGACIÓN */}
        <aside className="w-64 bg-white border-r border-[#cbd5e1] flex flex-col justify-between shrink-0 p-4">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block mb-2 px-2">
                Menú de Auditoría
              </span>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSeccionActual('dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    seccionActual === 'dashboard'
                      ? 'bg-[#004b87] text-white shadow-xs'
                      : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#003865]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard General</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSeccionActual('auditoria')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    seccionActual === 'auditoria'
                      ? 'bg-[#004b87] text-white shadow-xs'
                      : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#003865]'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Auditoría de Cursos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSeccionActual('bitacora')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    seccionActual === 'bitacora'
                      ? 'bg-[#004b87] text-white shadow-xs'
                      : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#003865]'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Bitácora de Mediciones</span>
                </button>
              </nav>
            </div>

            {/* Resumen rápido de asignación */}
            <div className="p-3.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl space-y-2">
              <span className="text-[11px] font-extrabold text-[#003865] uppercase block tracking-wider">
                Cobertura de Supervisión
              </span>
              <div className="text-[11px] text-[#475569] space-y-1">
                <div>
                  <span className="font-semibold text-[#003865]">Total Asignaturas:</span> {metricas.total}
                </div>
                <div>
                  <span className="font-semibold text-[#003865]">Programas:</span> 10 Ingenierías
                </div>
                <div>
                  <span className="font-semibold text-[#003865]">Meta Institucional:</span> 70% Logro
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#e2e8f0] text-[10px] text-[#64748b] text-center font-medium">
            Sistema de Acreditación ABET / CNA
          </div>
        </aside>

        {/* ÁREA DE CONTENIDO */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* ========================================================= */}
          {/* VISTA 1: DASHBOARD GENERAL DEL SUPERVISOR */}
          {/* ========================================================= */}
          {seccionActual === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="bg-white border border-[#cbd5e1] rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#003865]">Consolidado de Calidad y Auditoría</h2>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Seguimiento y control de evaluación continua para los Resultados de Aprendizaje supervisados.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1 bg-[#e8f1f8] text-[#004b87] border border-[#bcd6ea] rounded-lg font-bold">
                    Período: 2026-1 (Vigente)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSeccionActual('auditoria')}
                    className="inline-flex items-center gap-2 bg-[#004b87] hover:bg-[#003865] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Ir a Auditoría</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* TARJETAS KPI DE SUPERVISIÓN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white border border-[#cbd5e1] rounded-xl p-4 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-[#64748b] uppercase block">Total Cursos RA</span>
                  <div className="text-2xl font-black text-[#003865]">{metricas.total}</div>
                  <span className="text-[10px] text-[#0284c7] font-semibold">10 Ingenierías asignadas</span>
                </div>

                <div className="bg-white border border-[#cbd5e1] rounded-xl p-4 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase block">Aprobados</span>
                  <div className="text-2xl font-black text-emerald-600">{metricas.aprobados}</div>
                  <span className="text-[10px] text-emerald-700 font-semibold">Cumplen con evidencias</span>
                </div>

                <div className="bg-white border border-[#cbd5e1] rounded-xl p-4 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-sky-700 uppercase block">En Revisión</span>
                  <div className="text-2xl font-black text-sky-600">{metricas.enRevision}</div>
                  <span className="text-[10px] text-sky-700 font-semibold">Auditoría en proceso</span>
                </div>

                <div className="bg-white border border-[#cbd5e1] rounded-xl p-4 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-amber-700 uppercase block">Devueltos / Ajustes</span>
                  <div className="text-2xl font-black text-amber-600">{metricas.devueltos}</div>
                  <span className="text-[10px] text-amber-700 font-semibold">Con observaciones técnicas</span>
                </div>

                <div className="bg-white border border-[#cbd5e1] rounded-xl p-4 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Pendientes</span>
                  <div className="text-2xl font-black text-slate-500">{metricas.pendientes}</div>
                  <span className="text-[10px] text-slate-500 font-semibold">Por cargar evidencias</span>
                </div>
              </div>

              {/* LISTA RESUMEN DE CURSOS SUPERVISADOS */}
              <div className="bg-white border border-[#cbd5e1] rounded-xl p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e8f0] pb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#003865] uppercase tracking-wide">
                      Estado de Cursos por Programa Académico
                    </h3>
                    <p className="text-xs text-[#64748b]">
                      Listado general de asignaturas bajo tu supervisión de calidad.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSeccionActual('auditoria')}
                    className="text-xs text-[#004b87] font-bold hover:underline cursor-pointer"
                  >
                    Ver panel detallado de auditoría
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#003865] text-white text-[11px]">
                        <th className="py-3 px-4 font-bold">Código</th>
                        <th className="py-3 px-4 font-bold">Asignatura</th>
                        <th className="py-3 px-4 font-bold">Programa</th>
                        <th className="py-3 px-4 font-bold">Tipo</th>
                        <th className="py-3 px-4 font-bold">Docente</th>
                        <th className="py-3 px-4 font-bold">Estado</th>
                        <th className="py-3 px-4 font-bold">Logro</th>
                        <th className="py-3 px-4 text-right font-bold">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {cursosSupervisados.map((curso) => {
                        const clave = getCursoClaveUnica(curso);
                        let estadoBadge = 'bg-slate-100 text-slate-700 border-slate-300';
                        if (curso.estadoEvaluacionNumero === 2 || curso.estadoEvaluacion === 'Aprobado') {
                          estadoBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                        } else if (curso.estadoEvaluacionNumero === 1 || curso.estadoEvaluacion === 'EnRevision' || curso.estadoEvaluacion === 'En Revisión') {
                          estadoBadge = 'bg-sky-100 text-sky-800 border-sky-300';
                        } else if (curso.estadoEvaluacionNumero === 3 || curso.estadoEvaluacion === 'Devuelto') {
                          estadoBadge = 'bg-amber-100 text-amber-800 border-amber-300';
                        }

                        return (
                          <tr key={clave} className="hover:bg-[#f8fafc] transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-[#004b87]">{curso.codigoAsignatura}</td>
                            <td className="py-3 px-4 font-bold text-[#0f172a]">{curso.nombreAsignatura}</td>
                            <td className="py-3 px-4 text-[#475569]">{curso.programaAcademico}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e8f1f8] text-[#003865] border border-[#bcd6ea]">
                                {curso.tipoAssessment}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[#0f172a] font-medium">{curso.nombreDocente}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${estadoBadge}`}>
                                {curso.estadoEvaluacion || 'Pendiente'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-[#003865]">
                              {curso.porcentajeCumplimiento || 0}%
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setCursoSeleccionadoClave(clave);
                                  setSeccionActual('auditoria');
                                }}
                                className="px-3 py-1 bg-[#004b87] hover:bg-[#003865] text-white rounded text-xs font-bold transition-colors cursor-pointer"
                              >
                                Auditar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VISTA 2: AUDITORÍA Y DICTAMEN DE CALIDAD DE CURSOS */}
          {/* ========================================================= */}
          {seccionActual === 'auditoria' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* BARRA DE FILTROS Y SELECTOR RÁPIDO */}
              <div className="bg-white border border-[#cbd5e1] rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Selector de Programa */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748b] block mb-1">
                      Programa Académico:
                    </label>
                    <select
                      value={filtroPrograma}
                      onChange={(e) => setFiltroPrograma(e.target.value)}
                      className="bg-white border border-[#94a3b8] rounded-md px-3 py-1.5 text-xs text-[#003865] font-semibold focus:outline-none"
                    >
                      <option value="todos">Todos los Programas ({programasSupervisados.length})</option>
                      {programasSupervisados.map((prog) => (
                        <option key={prog} value={prog}>{prog}</option>
                      ))}
                    </select>
                  </div>

                  {/* Selector de RA */}
                  {rasSupervisados.length > 1 && (
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#64748b] block mb-1">
                        Resultado de Aprendizaje:
                      </label>
                      <select
                        value={filtroRa}
                        onChange={(e) => setFiltroRa(e.target.value)}
                        className="bg-white border border-[#94a3b8] rounded-md px-3 py-1.5 text-xs text-[#003865] font-semibold focus:outline-none"
                      >
                        <option value="todos">Todos los RAs</option>
                        {rasSupervisados.map((ra) => (
                          <option key={ra} value={ra}>{ra}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Selector de Estado */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#64748b] block mb-1">
                      Estado de Auditoría:
                    </label>
                    <select
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                      className="bg-white border border-[#94a3b8] rounded-md px-3 py-1.5 text-xs text-[#003865] font-semibold focus:outline-none"
                    >
                      <option value="todos">Todos los Estados</option>
                      <option value="0">Pendiente</option>
                      <option value="1">En Revisión</option>
                      <option value="2">Aprobado</option>
                      <option value="3">Devuelto (Requiere corrección)</option>
                    </select>
                  </div>
                </div>

                {/* Buscador */}
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar curso, código o docente..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full bg-white border border-[#94a3b8] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                  />
                </div>
              </div>

              {/* GRID PRINCIPAL: LISTADO DE CURSOS (IZQUIERDA) + DETALLE DE AUDITORÍA (DERECHA) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LISTA LATERAL DE CURSOS FILTRADOS (4 COLUMNAS) */}
                <div className="lg:col-span-4 bg-white border border-[#cbd5e1] rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
                    <h3 className="text-xs font-bold text-[#003865] uppercase">
                      Cursos Asignados ({cursosFiltrados.length})
                    </h3>
                    <span className="text-[11px] text-[#64748b]">Selecciona para auditar</span>
                  </div>

                  <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                    {cursosFiltrados.map((curso) => {
                      const clave = getCursoClaveUnica(curso);
                      const esSeleccionado = cursoActivo && getCursoClaveUnica(cursoActivo) === clave;

                      let estadoBadge = 'bg-slate-100 text-slate-700 border-slate-300';
                      if (curso.estadoEvaluacionNumero === 2 || curso.estadoEvaluacion === 'Aprobado') {
                        estadoBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                      } else if (curso.estadoEvaluacionNumero === 1 || curso.estadoEvaluacion === 'EnRevision' || curso.estadoEvaluacion === 'En Revisión') {
                        estadoBadge = 'bg-sky-100 text-sky-800 border-sky-300';
                      } else if (curso.estadoEvaluacionNumero === 3 || curso.estadoEvaluacion === 'Devuelto') {
                        estadoBadge = 'bg-amber-100 text-amber-800 border-amber-300';
                      }

                      return (
                        <button
                          key={clave}
                          type="button"
                          onClick={() => {
                            setCursoSeleccionadoClave(clave);
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                            esSeleccionado
                              ? 'bg-[#e8f1f8] border-[#004b87] ring-2 ring-[#004b87]/30 shadow-xs'
                              : 'bg-white border-[#e2e8f0] hover:border-[#cbd5e1] hover:bg-[#f8fafc]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-[#003865] text-white">
                              {curso.codigoAsignatura}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${estadoBadge}`}>
                              {curso.estadoEvaluacion || 'Pendiente'}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-[#0f172a] line-clamp-1">{curso.nombreAsignatura}</h4>
                          <p className="text-[11px] text-[#64748b] mt-0.5 line-clamp-1">{curso.programaAcademico}</p>
                          <div className="flex items-center justify-between text-[10px] text-[#475569] mt-2 pt-2 border-t border-[#e2e8f0]/60">
                            <span>Docente: <strong className="text-[#003865]">{curso.nombreDocente}</strong></span>
                            <span className="font-bold text-[#004b87]">{curso.porcentajeCumplimiento || 0}% Logro</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DETALLE Y DICTAMEN DE AUDITORÍA (8 COLUMNAS) */}
                <div className="lg:col-span-8 space-y-6">
                  {cursoActivo ? (
                    <>
                      {/* FICHA TÉCNICA DEL CURSO EN AUDITORÍA */}
                      <div className="bg-white border border-[#cbd5e1] rounded-xl p-6 shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#e2e8f0] pb-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-[#004b87] text-white">
                                {cursoActivo.codigoAsignatura}
                              </span>
                              <span className="text-xs font-semibold text-[#475569]">
                                Semestre {cursoActivo.semestre} • {cursoActivo.creditos} Créditos
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#cbd5e1] bg-[#f8fafc] text-[#003865] font-bold">
                                {cursoActivo.tipoAssessment}
                              </span>
                            </div>
                            <h2 className="text-xl font-black text-[#003865]">{cursoActivo.nombreAsignatura}</h2>
                            <p className="text-xs font-semibold text-[#005a9c]">
                              {cursoActivo.programaAcademico} • Docente: <span className="text-[#003865] font-bold">{cursoActivo.nombreDocente}</span>
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold text-[#64748b] uppercase block">Estado de Auditoría</span>
                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold border ${
                              cursoActivo.estadoEvaluacionNumero === 2 || cursoActivo.estadoEvaluacion === 'Aprobado'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : cursoActivo.estadoEvaluacionNumero === 1 || cursoActivo.estadoEvaluacion === 'EnRevision' || cursoActivo.estadoEvaluacion === 'En Revisión'
                                ? 'bg-sky-100 text-sky-800 border-sky-300'
                                : cursoActivo.estadoEvaluacionNumero === 3 || cursoActivo.estadoEvaluacion === 'Devuelto'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}>
                              {cursoActivo.estadoEvaluacion || 'Pendiente'}
                            </span>
                          </div>
                        </div>

                        {/* RESULTADO DE APRENDIZAJE E INDICADORES EVALUADOS */}
                        <div className="bg-[#f8fafc] border border-[#bcd6ea] rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-[#003865] text-white">
                              {cursoActivo.codigoRa}
                            </span>
                            <span className="font-bold text-xs text-[#003865]">{cursoActivo.nombreRa}</span>
                          </div>
                          <p className="text-xs text-[#475569] italic">{cursoActivo.descripcionRa}</p>

                          <div className="pt-2">
                            <span className="text-[11px] font-bold text-[#003865] uppercase block mb-2">
                              Indicadores de Desempeño Evaluados:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {cursoActivo.indicadores && cursoActivo.indicadores.length > 0 ? (
                                cursoActivo.indicadores.map((ind, i) => (
                                  <div key={i} className="p-2.5 bg-white border border-[#e2e8f0] rounded-lg text-xs">
                                    <span className="font-mono font-bold text-[#004b87] block mb-0.5">{ind.codigo}</span>
                                    <p className="text-[#475569] leading-tight text-[11px]">{ind.descripcion}</p>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-3 text-xs text-[#64748b] italic">
                                  3 Indicadores de Desempeño asignados formalmente por el Plan de Assessment.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* DESGLOSE CUANTITATIVO DE EVALUACIÓN */}
                        <div>
                          <h3 className="text-xs font-bold text-[#003865] uppercase tracking-wider mb-3">
                            Resultados Cuantitativos del Grupo ({cursoActivo.totalEstudiantesEvaluados || estudiantesCurso.length} Estudiantes Evaluados)
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                              <span className="text-[10px] font-bold text-emerald-800 uppercase block">90 - 100% (Excelente)</span>
                              <div className="text-xl font-black text-emerald-700 mt-1">{cursoActivo.cantidadNivel90a100 || 0}</div>
                            </div>
                            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
                              <span className="text-[10px] font-bold text-sky-800 uppercase block">70 - 89% (Satisfactorio)</span>
                              <div className="text-xl font-black text-sky-700 mt-1">{cursoActivo.cantidadNivel70a89 || 0}</div>
                            </div>
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                              <span className="text-[10px] font-bold text-amber-800 uppercase block">60 - 69% (En Desarrollo)</span>
                              <div className="text-xl font-black text-amber-700 mt-1">{cursoActivo.cantidadNivel60a69 || 0}</div>
                            </div>
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                              <span className="text-[10px] font-bold text-rose-800 uppercase block">0 - 59% (No Alcanzado)</span>
                              <div className="text-xl font-black text-rose-700 mt-1">{cursoActivo.cantidadNivel0a59 || 0}</div>
                            </div>
                          </div>
                        </div>

                        {/* MATRIZ DE ESTUDIANTES Y DESCARGA DE EVIDENCIAS */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="text-xs font-bold text-[#003865] uppercase tracking-wider">
                                Matriz de Calificaciones Individuales y Evidencias
                              </h3>
                              <span className="text-[11px] text-[#64748b]">
                                {estudiantesCurso.length} estudiantes registrados en la muestra
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setMostrarFormEstudiante(!mostrarFormEstudiante)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004b87] hover:text-[#003865] bg-[#e8f1f8] hover:bg-[#dbeafe] px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-[#bcd6ea]"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{mostrarFormEstudiante ? 'Ocultar Formulario' : 'Agregar Muestra Estudiante'}</span>
                            </button>
                          </div>

                          {/* FORMULARIO AGREGAR ESTUDIANTE */}
                          {mostrarFormEstudiante && (
                            <form onSubmit={handleAgregarEstudiante} className="p-4 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl mb-3 space-y-3">
                              <span className="text-xs font-bold text-[#003865] uppercase block">
                                Registrar nuevo estudiante para muestreo de auditoría:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="text-[10px] font-bold uppercase text-[#64748b] block mb-1">Código</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="2022114001"
                                    value={nuevoEstCodigo}
                                    onChange={(e) => setNuevoEstCodigo(e.target.value)}
                                    className="w-full bg-white border border-[#94a3b8] rounded px-3 py-1.5 text-xs focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold uppercase text-[#64748b] block mb-1">Nombres y Apellidos</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="Estudiante Ejemplo"
                                    value={nuevoEstNombre}
                                    onChange={(e) => setNuevoEstNombre(e.target.value)}
                                    className="w-full bg-white border border-[#94a3b8] rounded px-3 py-1.5 text-xs focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold uppercase text-[#64748b] block mb-1">Calificación (0 - 100)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    required
                                    value={nuevoEstNota}
                                    onChange={(e) => setNuevoEstNota(Number(e.target.value))}
                                    className="w-full bg-white border border-[#94a3b8] rounded px-3 py-1.5 text-xs focus:outline-none font-bold text-[#003865]"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setMostrarFormEstudiante(false)}
                                  className="px-3 py-1 rounded text-xs font-semibold text-[#64748b] hover:bg-white"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="submit"
                                  disabled={cargando}
                                  className="px-4 py-1.5 rounded text-xs font-bold bg-[#004b87] hover:bg-[#003865] text-white shadow-xs cursor-pointer"
                                >
                                  Guardar Estudiante
                                </button>
                              </div>
                            </form>
                          )}

                          {cargandoEstudiantes ? (
                            <div className="p-6 text-center text-xs text-[#64748b]">
                              Cargando matriz de estudiantes y archivos adjuntos...
                            </div>
                          ) : estudiantesCurso.length > 0 ? (
                            <div className="overflow-x-auto max-h-56 overflow-y-auto border border-[#cbd5e1] rounded-lg">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-[#003865] text-white text-[11px] sticky top-0">
                                  <tr>
                                    <th className="py-2.5 px-3 font-bold">Código</th>
                                    <th className="py-2.5 px-3 font-bold">Nombre Estudiante</th>
                                    <th className="py-2.5 px-3 font-bold text-center">Nota (0-100)</th>
                                    <th className="py-2.5 px-3 font-bold">Nivel</th>
                                    <th className="py-2.5 px-3 text-right font-bold">Evidencia Adjunta</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e2e8f0]">
                                  {estudiantesCurso.map((est) => (
                                    <tr key={est.id} className="hover:bg-[#f8fafc]">
                                      <td className="py-2 px-3 font-mono font-semibold text-[#004b87]">{est.codigoEstudiante}</td>
                                      <td className="py-2 px-3 font-bold text-[#0f172a]">{est.nombreEstudiante}</td>
                                      <td className="py-2 px-3 font-bold text-center text-[#003865]">{est.calificacion}</td>
                                      <td className="py-2 px-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          est.calificacion >= 90 ? 'bg-emerald-100 text-emerald-800' :
                                          est.calificacion >= 70 ? 'bg-sky-100 text-sky-800' :
                                          est.calificacion >= 60 ? 'bg-amber-100 text-amber-800' :
                                          'bg-rose-100 text-rose-800'
                                        }`}>
                                          {est.calificacion >= 90 ? 'Excelente' : est.calificacion >= 70 ? 'Satisfactorio' : est.calificacion >= 60 ? 'En desarrollo' : 'No alcanzado'}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 text-right">
                                        {est.nombreArchivoEvidencia || est.tieneEvidencia ? (
                                          <a
                                            href={obtenerUrlDescargaEvidenciaEstudiante(est.id)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#004b87] hover:underline bg-[#e8f1f8] px-2.5 py-1 rounded border border-[#bcd6ea]"
                                          >
                                            <Download className="w-3 h-3" />
                                            Descargar ({est.nombreArchivoEvidencia || 'Evidencia'})
                                          </a>
                                        ) : (
                                          <span className="text-[11px] text-[#94a3b8] italic">Sin evidencia cargada</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-6 bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-xl text-center text-xs text-[#64748b]">
                              No se encontraron registros de estudiantes cargados para este curso. Puedes agregar estudiantes con el botón superior para simular la evaluación.
                            </div>
                          )}
                        </div>

                        {/* ANÁLISIS CUALITATIVO Y PLAN DE MEJORA (EDITABLE) */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-[#003865] uppercase">
                              Análisis Cualitativo y Plan de Mejora Docente
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditandoAnalisis(!editandoAnalisis)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004b87] hover:text-[#003865] bg-[#e8f1f8] px-2.5 py-1 rounded-md border border-[#bcd6ea] cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{editandoAnalisis ? 'Cancelar Edición' : 'Editar Análisis'}</span>
                            </button>
                          </div>

                          {editandoAnalisis ? (
                            <div className="p-4 bg-[#f8fafc] border border-[#004b87] rounded-xl space-y-3">
                              <div>
                                <label className="text-xs font-bold text-[#003865] uppercase block mb-1">
                                  Análisis Cualitativo de Desempeño:
                                </label>
                                <textarea
                                  rows={3}
                                  value={analisisCualitativoEdit}
                                  onChange={(e) => setAnalisisCualitativoEdit(e.target.value)}
                                  className="w-full bg-white border border-[#94a3b8] rounded-lg p-3 text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-[#003865] uppercase block mb-1">
                                  Plan de Mejora Propuesto:
                                </label>
                                <textarea
                                  rows={2}
                                  value={planMejoraEdit}
                                  onChange={(e) => setPlanMejoraEdit(e.target.value)}
                                  className="w-full bg-white border border-[#94a3b8] rounded-lg p-3 text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditandoAnalisis(false)}
                                  className="px-3 py-1.5 rounded text-xs font-semibold text-[#64748b] hover:bg-white cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={handleGuardarAnalisis}
                                  disabled={cargando}
                                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold bg-[#004b87] hover:bg-[#003865] text-white shadow-xs cursor-pointer"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Guardar Cambios</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="p-4 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl space-y-1.5">
                                <span className="text-[11px] font-bold text-[#003865] uppercase block">
                                  Análisis Cualitativo del Docente:
                                </span>
                                <p className="text-xs text-[#334155] leading-relaxed">
                                  {cursoActivo.analisisCualitativo || 'El docente no ha registrado un análisis cualitativo descriptivo aún.'}
                                </p>
                              </div>

                              <div className="p-4 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl space-y-1.5">
                                <span className="text-[11px] font-bold text-[#003865] uppercase block">
                                  Plan de Mejora Registrado:
                                </span>
                                <p className="text-xs text-[#334155] leading-relaxed">
                                  {cursoActivo.planMejora || 'Sin plan de mejora especificado en la medición.'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* PANEL DE DICTAMEN DE AUDITORÍA Y OBSERVACIONES FORMALES (100% EDITABLE) */}
                      <div className="bg-gradient-to-r from-[#e8f1f8] to-[#dbeafe] border-2 border-[#004b87] rounded-xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-[#bcd6ea] pb-3">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-[#004b87]" />
                            <h3 className="text-sm font-extrabold text-[#003865] uppercase tracking-wide">
                              Dictamen de Calidad y Retroalimentación Oficial
                            </h3>
                          </div>
                          <span className="text-xs px-2.5 py-0.5 bg-white border border-[#004b87] text-[#003865] font-bold rounded-full">
                            Supervisor: {usuarioActual.nombre}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-bold text-[#003865] uppercase block mb-1">
                              Observaciones Técnicas de Calidad (Obligatorio para dictamen) *
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Escribe aquí las observaciones detalladas sobre la calidad de las evidencias, rúbricas y concordancia con los indicadores de desempeño..."
                              value={dictamenObservacion}
                              onChange={(e) => setDictamenObservacion(e.target.value)}
                              className="w-full bg-white border border-[#94a3b8] rounded-lg p-3 text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-[#003865] uppercase block mb-1">
                              Recomendaciones / Ajustes al Plan de Mejora (Opcional):
                            </label>
                            <input
                              type="text"
                              placeholder="Sugerencias metodológicas para el próximo ciclo..."
                              value={dictamenPlanMejora}
                              onChange={(e) => setDictamenPlanMejora(e.target.value)}
                              className="w-full bg-white border border-[#94a3b8] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                            />
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                            <button
                              type="button"
                              disabled={guardandoDictamen}
                              onClick={() => handleEmitirDictamen(false)}
                              className="px-5 py-2.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-xs"
                            >
                              <AlertCircle className="w-4 h-4" />
                              <span>Devolver con Observaciones</span>
                            </button>

                            <button
                              type="button"
                              disabled={guardandoDictamen}
                              onClick={() => handleEmitirDictamen(true)}
                              className="px-6 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-xs"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Aprobar Medición de Calidad</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-white border border-[#cbd5e1] rounded-xl p-12 text-center text-xs text-[#64748b]">
                      No hay ningún curso seleccionado para auditar.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VISTA 3: BITÁCORA DE INTERACCIONES Y OBSERVACIONES */}
          {/* ========================================================= */}
          {seccionActual === 'bitacora' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-white border border-[#cbd5e1] rounded-xl p-5 shadow-2xs">
                <h2 className="text-xl font-bold text-[#003865]">Bitácora Oficial de Revisiones y Calidad</h2>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Historial cronológico de comentarios, solicitudes de corrección y aprobaciones emitidas.
                </p>
              </div>

              {cursoActivo && (
                <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#64748b] uppercase block">Asignatura en seguimiento</span>
                    <span className="text-sm font-black text-[#003865]">{cursoActivo.codigoAsignatura} - {cursoActivo.nombreAsignatura}</span>
                    <span className="text-xs text-[#475569] block">{cursoActivo.programaAcademico} • Docente: {cursoActivo.nombreDocente}</span>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-white border border-[#cbd5e1] rounded-full text-[#003865]">
                    Estado: {cursoActivo.estadoEvaluacion || 'Pendiente'}
                  </span>
                </div>
              )}

              {/* TIMELINE DE MENSAJES */}
              <div className="bg-white border border-[#cbd5e1] rounded-xl p-6 shadow-2xs space-y-4">
                <h3 className="text-xs font-extrabold text-[#003865] uppercase tracking-wide border-b border-[#e2e8f0] pb-3">
                  Historial de Interacciones
                </h3>

                {cargandoBitacora ? (
                  <div className="p-8 text-center text-xs text-[#64748b]">
                    Cargando historial de la bitácora...
                  </div>
                ) : observacionesCurso.length > 0 ? (
                  <div className="space-y-4">
                    {observacionesCurso.map((obs) => {
                      const esMio = obs.usuarioId === usuarioActual.id || obs.correoAutor?.toLowerCase() === usuarioActual.correo.toLowerCase();

                      return (
                        <div
                          key={obs.id}
                          className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                            esMio
                              ? 'bg-[#e8f1f8] border-[#bcd6ea] ml-6'
                              : 'bg-[#f8fafc] border-[#e2e8f0] mr-6'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#003865]">{obs.nombreAutor}</span>
                              <span className="text-[10px] px-2 py-0.2 rounded font-mono bg-white border border-[#cbd5e1] text-[#475569]">
                                {obs.rolEmisor}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#64748b] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(obs.fechaCreacion).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{obs.contenido}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-xl text-center text-xs text-[#64748b]">
                    Aún no hay comentarios registrados en la bitácora para esta medición.
                  </div>
                )}

                {/* FORMULARIO PARA AGREGAR MENSAJE */}
                <form onSubmit={handleEnviarObservacion} className="pt-4 border-t border-[#e2e8f0] space-y-3">
                  <label className="text-xs font-bold text-[#003865] uppercase block">
                    Agregar Nuevo Comentario o Retroalimentación:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe un mensaje en la bitácora para el docente..."
                      value={nuevaObservacionTexto}
                      onChange={(e) => setNuevaObservacionTexto(e.target.value)}
                      className="flex-1 bg-white border border-[#94a3b8] rounded-lg px-3.5 py-2 text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                    />
                    <button
                      type="submit"
                      disabled={enviandoObservacion || !nuevaObservacionTexto.trim()}
                      className="px-5 py-2 bg-[#004b87] hover:bg-[#003865] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
