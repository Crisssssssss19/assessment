'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  Users,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Search,
  Check,
  X,
  UserCheck,
  UserX,
  BarChart3,
  FileText,
  Award,
  Sparkles,
  GraduationCap,
  Calendar,
  Plus
} from 'lucide-react';
import VistaDocente from '@/components/VistaDocente';
import VistaSupervisorCalidad from '@/components/VistaSupervisorCalidad';
import {
  obtenerUsuariosDemo,
  iniciarSesion,
  obtenerDatosIniciales,
  guardarPlanAssessment,
  obtenerAsignacionesDecano,
  asignarLiderFacultad,
  asignarLiderPrograma,
  crearPeriodoAcademico,
  obtenerPeriodosAcademicos,
  obtenerCursosDetallados,
  UsuarioDemo,
  DatosIniciales,
  EstadoAsignaciones,
  CursoDetallado,
  AsignaturaPlanPayload
} from '@/lib/api';

type TabView = 'dashboard' | 'assessment' | 'cursos' | 'asignaciones';
type SubVistaAssessment = 'lista' | 'detalle_ra' | 'graficos_conclusiones' | 'formulario_configuracion';

export default function AssessmentApp() {
  const [usuarioActual, setUsuarioActual] = useState<{
    id: string;
    nombre: string;
    correo: string;
    rol: string;
    token: string;
    programaAcademicoId?: string | null;
    nombrePrograma?: string | null;
  } | null>(null);

  const [usuariosDemo, setUsuariosDemo] = useState<UsuarioDemo[]>([]);
  const [vistaActual, setVistaActual] = useState<TabView>('dashboard');
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const [datosCatalogo, setDatosCatalogo] = useState<DatosIniciales | null>(null);
  const [estadoAsignaciones, setEstadoAsignaciones] = useState<EstadoAsignaciones | null>(null);
  const [liderFacultadSeleccionado, setLiderFacultadSeleccionado] = useState<string>('');
  const [asignacionesProgramas, setAsignacionesProgramas] = useState<{ [progId: string]: string }>({});

  const [cursosDetallados, setCursosDetallados] = useState<CursoDetallado[]>([]);
  const [cursoSeleccionadoModal, setCursoSeleccionadoModal] = useState<CursoDetallado | null>(null);
  const [filtroTipoCurso, setFiltroTipoCurso] = useState<string>('todos');
  const [filtroRaCurso, setFiltroRaCurso] = useState<string>('todos');
  const [busquedaCurso, setBusquedaCurso] = useState<string>('');

  const [programaSeleccionadoId, setProgramaSeleccionadoId] = useState<string>('todos');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>('2026-1');
  const [periodosAcademicos, setPeriodosAcademicos] = useState<{ id: string; codigo: string; nombre: string; fechaInicio?: string; fechaFin?: string; esActual?: boolean }[]>([]);
  const [modalCrearPeriodo, setModalCrearPeriodo] = useState(false);
  const [nuevoPeriodoCodigo, setNuevoPeriodoCodigo] = useState('');
  const [nuevoPeriodoNombre, setNuevoPeriodoNombre] = useState('');
  const [nuevoPeriodoFechaInicio, setNuevoPeriodoFechaInicio] = useState('');
  const [nuevoPeriodoFechaFin, setNuevoPeriodoFechaFin] = useState('');
  const [nuevoPeriodoEsActual, setNuevoPeriodoEsActual] = useState(true);
  const [guardandoPeriodo, setGuardandoPeriodo] = useState(false);
  const [raIndexActual, setRaIndexActual] = useState<number>(0);

  // Control de las 3 vistas de Assessment
  const [subVistaAssessment, setSubVistaAssessment] = useState<SubVistaAssessment>('lista');
  const [raSeleccionadoSeguimientoIndex, setRaSeleccionadoSeguimientoIndex] = useState<number>(0);

  // Estado para la configuración del plan (21 asignaturas: 7 RAs x 3 cursos, 1 supervisor único por RA)
  const [planAsignaturas, setPlanAsignaturas] = useState<{
    [raKey: string]: {
      supervisorRaId: string;
      metaLogro: number;
      cursos: {
        asignaturaId: string;
        nombreCurso: string;
        semestre: number;
        rolEvaluacion: number; // 1: Formativa 1, 2: Formativa 2, 3: Sumativa
        docenteId: string;
      }[];
      indicadores: {
        codigo: string;
        descripcion: string;
      }[];
    };
  }>({});

  useEffect(() => {
    async function inicializar() {
      const usuarios = await obtenerUsuariosDemo();
      setUsuariosDemo(usuarios);

      const catalogos = await obtenerDatosIniciales();
      setDatosCatalogo(catalogos);

      const perRes = await obtenerPeriodosAcademicos();
      if (perRes && perRes.datos) {
        setPeriodosAcademicos(perRes.datos);
        const actual = perRes.datos.find((p: any) => p.esActual);
        if (actual) {
          setPeriodoSeleccionado(actual.codigo);
        }
      }

      const asignaciones = await obtenerAsignacionesDecano();
      setEstadoAsignaciones(asignaciones);
      if (asignaciones.liderCalidadFacultadId) {
        setLiderFacultadSeleccionado(asignaciones.liderCalidadFacultadId);
      }
      const mapaProg: { [k: string]: string } = {};
      asignaciones.programas.forEach(p => {
        if (p.liderUsuarioId) mapaProg[p.programaId] = p.liderUsuarioId;
      });
      setAsignacionesProgramas(mapaProg);

      const cursos = await obtenerCursosDetallados();
      setCursosDetallados(cursos);

      if (catalogos && catalogos.resultadosAprendizaje.length > 0) {
        const estadoInicial: { [raKey: string]: any } = {};
        catalogos.resultadosAprendizaje.forEach((ra) => {
          const cursosDelRa = (cursos || []).filter((c) => c.codigoRa === ra.codigo);
          const primerCurso = cursosDelRa[0];
          const supObj = primerCurso
            ? catalogos.supervisoresCalidadRa.find((s) => s.codigo === primerCurso.correoSupervisorRa || s.nombre === primerCurso.nombreSupervisorRa)
            : null;

          const f1 = cursosDelRa.find((c) => c.tipoAssessmentNumero === 1);
          const f2 = cursosDelRa.find((c) => c.tipoAssessmentNumero === 2);
          const sum = cursosDelRa.find((c) => c.tipoAssessmentNumero === 3);

          const docF1 = f1 ? catalogos.docentes.find((d) => d.codigo === f1.correoDocente || d.nombre === f1.nombreDocente) : null;
          const docF2 = f2 ? catalogos.docentes.find((d) => d.codigo === f2.correoDocente || d.nombre === f2.nombreDocente) : null;
          const docSum = sum ? catalogos.docentes.find((d) => d.codigo === sum.correoDocente || d.nombre === sum.nombreDocente) : null;

          estadoInicial[ra.codigo] = {
            supervisorRaId: supObj?.id || '',
            metaLogro: primerCurso?.metaLogroPorcentaje || 70,
            cursos: [
              {
                asignaturaId: f1?.asignaturaId || '',
                nombreCurso: f1?.nombreAsignatura || '',
                semestre: f1?.semestre || 1,
                rolEvaluacion: 1, // Formativa 1
                docenteId: docF1?.id || ''
              },
              {
                asignaturaId: f2?.asignaturaId || '',
                nombreCurso: f2?.nombreAsignatura || '',
                semestre: f2?.semestre || 1,
                rolEvaluacion: 2, // Formativa 2
                docenteId: docF2?.id || ''
              },
              {
                asignaturaId: sum?.asignaturaId || '',
                nombreCurso: sum?.nombreAsignatura || '',
                semestre: sum?.semestre || 1,
                rolEvaluacion: 3, // Sumativa
                docenteId: docSum?.id || ''
              }
            ],
            indicadores: (primerCurso?.indicadores && primerCurso.indicadores.length > 0)
              ? primerCurso.indicadores
              : [
                  { codigo: 'ID1', descripcion: 'Reconoce conceptos técnicos fundamentales y su relación con problemas de la ingeniería.' },
                  { codigo: 'ID2', descripcion: 'Interpreta datos experimentales o resultados científicos para analizar una situación técnica.' },
                  { codigo: 'ID3', descripcion: 'Propone explicaciones o soluciones iniciales a un problema a partir de conocimientos científicos.' }
                ]
          };
        });
        setPlanAsignaturas(estadoInicial);
      }
    }
    inicializar();
  }, []);

  const handleLoginDemo = async (u: UsuarioDemo) => {
    setCargando(true);
    setMensajeError(null);

    // Validar asignación de rol: la Decana siempre tiene rol; los demás deben haber sido asignados por Decanatura o por el Líder de Programa
    const esDecana = u.rol === 'Decano' || u.correoElectronico.toLowerCase().includes('decano');
    const progAsignado = estadoAsignaciones?.programas.find(
      (p) => p.liderUsuarioId === u.id || p.correoLider?.toLowerCase() === u.correoElectronico?.toLowerCase()
    );
    const esLiderProg = !!progAsignado || u.rol === 'LiderPrograma';
    const esLiderFac = estadoAsignaciones?.liderCalidadFacultadId === u.id || u.rol === 'LiderCalidadFacultad';
    
    // Supervisión de RA: revisar en cursos cargados o en la configuración de plan
    const rasSupervisados = Array.from(new Set([
      ...cursosDetallados.filter(c => c.correoSupervisorRa?.toLowerCase() === u.correoElectronico.toLowerCase() || c.nombreSupervisorRa?.toLowerCase() === u.nombreCompleto.toLowerCase()).map(c => c.codigoRa),
      ...Object.entries(planAsignaturas).filter(([_, cfg]) => cfg.supervisorRaId === u.id).map(([raKey]) => raKey)
    ]));
    const esSupervisorRa = u.rol === 'LiderCalidadRA' || rasSupervisados.length > 0;
    const tieneCursosDocente = cursosDetallados.some((c) => c.correoDocente?.toLowerCase() === u.correoElectronico?.toLowerCase());

    const res = await iniciarSesion(u.correoElectronico);

    let rolEfectivo = esDecana ? 'Decano' : esLiderProg ? 'LiderPrograma' : esLiderFac ? 'LiderCalidadFacultad' : esSupervisorRa ? 'LiderCalidadRA' : tieneCursosDocente ? 'Docente' : u.rol;

    let progId = progAsignado?.programaId || res.datos?.programaAcademicoId || u.programaAcademicoId;
    let progNombre = progAsignado?.nombrePrograma || res.datos?.nombrePrograma || u.nombrePrograma;

    if (datosCatalogo?.programas) {
      if (progNombre) {
        const pMatch = datosCatalogo.programas.find(
          (p) => p.nombre.toLowerCase().trim() === progNombre?.toLowerCase().trim() || p.id === progId
        );
        if (pMatch) {
          progId = pMatch.id;
          progNombre = pMatch.nombre;
        }
      } else if (progId) {
        const pMatch = datosCatalogo.programas.find((p) => p.id === progId);
        if (pMatch) {
          progNombre = pMatch.nombre;
        }
      }
    }

    if (rolEfectivo === 'LiderPrograma' && !progId && datosCatalogo?.programas && datosCatalogo.programas.length > 0) {
      progId = datosCatalogo.programas[0].id;
      progNombre = datosCatalogo.programas[0].nombre;
    }

    setUsuarioActual({
      id: u.id,
      nombre: u.nombreCompleto,
      correo: u.correoElectronico,
      rol: rolEfectivo,
      token: res.datos?.token || 'demo-token',
      programaAcademicoId: progId,
      nombrePrograma: progNombre
    });

    if (rolEfectivo === 'LiderPrograma') {
      if (progId) setProgramaSeleccionadoId(progId);
      setSubVistaAssessment('formulario_configuracion');
    } else {
      setProgramaSeleccionadoId('todos');
      setSubVistaAssessment('lista');
    }

    setVistaActual('dashboard');
    setCargando(false);
  };

  const handleGuardarPlan = async () => {
    if (!datosCatalogo || !usuarioActual) return;
    setCargando(true);
    setMensajeExito(null);
    setMensajeError(null);

    // 1. Resolver el GUID del período
    let periodoId = datosCatalogo.periodos.find(p => p.codigo === periodoSeleccionado || p.id === periodoSeleccionado)?.id;
    if (!periodoId && datosCatalogo.periodos.length > 0) {
      periodoId = datosCatalogo.periodos[0].id;
    }

    // 2. Resolver el GUID del programa
    let progId = programaSeleccionadoId !== 'todos' ? programaSeleccionadoId : usuarioActual.programaAcademicoId;
    if (!progId && usuarioActual.nombrePrograma) {
      const matchProg = datosCatalogo.programas.find(p => p.nombre.toLowerCase().trim() === usuarioActual.nombrePrograma?.toLowerCase().trim());
      if (matchProg) progId = matchProg.id;
    }
    if (!progId && datosCatalogo.programas.length > 0) {
      progId = datosCatalogo.programas[0].id;
    }

    // 3. Construir la lista completa de las 21 asignaturas (7 RAs x 3 cursos: F1, F2, Sumativa)
    const todasAsignaturas: AsignaturaPlanPayload[] = [];
    const asignaturasPorPrograma = (datosCatalogo.asignaturas || []).filter(a => !progId || a.programaAcademicoId === progId);
    const asignaturasCatalogo = asignaturasPorPrograma.length > 0 ? asignaturasPorPrograma : (datosCatalogo.asignaturas || []);
    const docentesCatalogo = datosCatalogo.docentes || [];
    const supervisoresCatalogo = datosCatalogo.supervisoresCalidadRa || [];

    datosCatalogo.resultadosAprendizaje.forEach((ra, raIdx) => {
      const config = planAsignaturas[ra.codigo];
      const supervisorId = config?.supervisorRaId || supervisoresCatalogo[raIdx % supervisoresCatalogo.length]?.id || (supervisoresCatalogo[0]?.id || '');
      const metaLogro = Number(config?.metaLogro) || 70;
      const indicadores = (config?.indicadores && config.indicadores.length === 3)
        ? config.indicadores
        : [
            { codigo: 'ID1', descripcion: 'Reconoce conceptos técnicos fundamentales y su relación con problemas de la ingeniería.' },
            { codigo: 'ID2', descripcion: 'Interpreta datos experimentales o resultados científicos para analizar una situación técnica.' },
            { codigo: 'ID3', descripcion: 'Propone explicaciones o soluciones iniciales a un problema a partir de conocimientos científicos.' }
          ];

      for (let tipo = 1; tipo <= 3; tipo++) {
        const cursoConfig = config?.cursos?.find(c => Number(c.rolEvaluacion) === tipo) || config?.cursos?.[tipo - 1];

        const fallbackAsignaturaIdx = (raIdx * 3 + (tipo - 1)) % Math.max(1, asignaturasCatalogo.length);
        const defaultAsignatura = asignaturasCatalogo[fallbackAsignaturaIdx];
        const asigId = cursoConfig?.asignaturaId || defaultAsignatura?.id || '';
        const semestre = Number(cursoConfig?.semestre) || defaultAsignatura?.semestre || (raIdx + 1);

        const fallbackDocenteIdx = (raIdx * 3 + (tipo - 1)) % Math.max(1, docentesCatalogo.length);
        const docId = cursoConfig?.docenteId || docentesCatalogo[fallbackDocenteIdx]?.id || '';

        todasAsignaturas.push({
          resultadoAprendizajeId: ra.id,
          asignaturaId: asigId,
          semestre: semestre,
          rolEvaluacion: tipo,
          metaLogroPorcentaje: metaLogro,
          docenteId: docId,
          liderCalidadRaId: supervisorId,
          indicadores: indicadores
        });
      }
    });

    const resultado = await guardarPlanAssessment(usuarioActual.token || 'demo-token', {
      periodoAcademicoId: periodoId || 'p1',
      programaAcademicoId: progId || undefined,
      asignaturas: todasAsignaturas
    });

    setCargando(false);
    if (resultado.exitoso) {
      setMensajeExito('¡Plan de Assessment guardado y sincronizado exitosamente!');
      const cursosActualizados = await obtenerCursosDetallados(progId || undefined);
      setCursosDetallados(cursosActualizados);
      const usuarios = await obtenerUsuariosDemo();
      setUsuariosDemo(usuarios);
      const asig = await obtenerAsignacionesDecano();
      setEstadoAsignaciones(asig);
      setTimeout(() => setMensajeExito(null), 5000);
    } else {
      setMensajeError(resultado.mensaje || 'Error al guardar el plan');
      setTimeout(() => setMensajeError(null), 5000);
    }
  };

  const handleAsignarLiderFacultad = async (usuarioId?: string | null) => {
    setCargando(true);
    const res = await asignarLiderFacultad(usuarioId || null);
    setCargando(false);
    if (res.exitoso) {
      setMensajeExito(res.mensaje || 'Líder de Calidad de Facultad actualizado con éxito');
      setLiderFacultadSeleccionado(usuarioId || '');
      const asig = await obtenerAsignacionesDecano();
      setEstadoAsignaciones(asig);
      const usuarios = await obtenerUsuariosDemo();
      setUsuariosDemo(usuarios);
      setTimeout(() => setMensajeExito(null), 4000);
    } else {
      setMensajeError(res.mensaje || 'Error al actualizar líder de facultad');
      setTimeout(() => setMensajeError(null), 4000);
    }
  };

  const handleAsignarLiderPrograma = async (programaId: string, usuarioId?: string | null) => {
    const uId = usuarioId !== undefined ? usuarioId : (asignacionesProgramas[programaId] || '');
    setCargando(true);
    const res = await asignarLiderPrograma(programaId, uId || null);
    setCargando(false);
    if (res.exitoso) {
      setMensajeExito(res.mensaje || 'Líder de programa actualizado');
      setAsignacionesProgramas((prev) => ({ ...prev, [programaId]: uId || '' }));
      const asig = await obtenerAsignacionesDecano();
      setEstadoAsignaciones(asig);
      const usuarios = await obtenerUsuariosDemo();
      setUsuariosDemo(usuarios);
      setTimeout(() => setMensajeExito(null), 4000);
    } else {
      setMensajeError(res.mensaje || 'Error al actualizar líder de programa');
      setTimeout(() => setMensajeError(null), 4000);
    }
  };

  const handleCrearPeriodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPeriodoCodigo.trim() || !nuevoPeriodoNombre.trim()) {
      setMensajeError('El código y el nombre del período son obligatorios.');
      setTimeout(() => setMensajeError(null), 4000);
      return;
    }
    setGuardandoPeriodo(true);
    try {
      const res = await crearPeriodoAcademico(
        {
          codigo: nuevoPeriodoCodigo.trim(),
          nombre: nuevoPeriodoNombre.trim(),
          fechaInicio: nuevoPeriodoFechaInicio ? new Date(nuevoPeriodoFechaInicio).toISOString() : undefined,
          fechaFin: nuevoPeriodoFechaFin ? new Date(nuevoPeriodoFechaFin).toISOString() : undefined,
          esActual: nuevoPeriodoEsActual
        },
        usuarioActual?.token || 'demo-token'
      );

      if (res.exitoso || res.datos) {
        setMensajeExito(res.mensaje || `Período académico '${nuevoPeriodoCodigo}' creado exitosamente.`);
        setModalCrearPeriodo(false);
        const codCreado = nuevoPeriodoCodigo.trim();
        setNuevoPeriodoCodigo('');
        setNuevoPeriodoNombre('');
        setNuevoPeriodoFechaInicio('');
        setNuevoPeriodoFechaFin('');
        setNuevoPeriodoEsActual(true);

        // Actualizar catálogos y períodos
        const catalogos = await obtenerDatosIniciales();
        setDatosCatalogo(catalogos);
        const perRes = await obtenerPeriodosAcademicos();
        if (perRes && perRes.datos) {
          setPeriodosAcademicos(perRes.datos);
        }
        setPeriodoSeleccionado(codCreado);
        setTimeout(() => setMensajeExito(null), 4000);
      } else {
        setMensajeError(res.mensaje || 'Error al crear el período académico.');
        setTimeout(() => setMensajeError(null), 4000);
      }
    } catch (err: any) {
      setMensajeError(err?.message || 'Error de conexión al crear el período.');
      setTimeout(() => setMensajeError(null), 4000);
    } finally {
      setGuardandoPeriodo(false);
    }
  };

  // -------------------------------------------------------------
  // PANTALLA DE LOGIN CON DISEÑO INSTITUCIONAL
  // -------------------------------------------------------------
  if (!usuarioActual) {
    const usuarioDocente = usuariosDemo.find((u) => u.rol === 'Docente') || {
      id: '2',
      nombreCompleto: 'Gabriel García',
      correoElectronico: 'ggarcia@unimagdalena.edu.co',
      rol: 'Docente'
    };

    return (
      <div className="min-h-screen bg-[#f1f5f9] text-[#1e293b] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* HEADER SUPERIOR */}
        <header className="absolute top-0 left-0 right-0 h-16 bg-white border-b border-[#cbd5e1] flex items-center justify-between px-8 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <Image
                src="/logo-unimagdalena.svg"
                alt="Universidad del Magdalena"
                width={40}
                height={40}
                priority
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-wider text-[#003865] uppercase">SISTEMA ASSESSMENT</h1>
              <p className="text-[11px] font-semibold text-[#005a9c]">Facultad de Ingeniería • Universidad del Magdalena</p>
            </div>
          </div>
          <span className="text-xs text-[#003865] font-semibold bg-[#e8f1f8] px-3.5 py-1 rounded-full border border-[#bcd6ea]">
            Periodo 2026-II
          </span>
        </header>

        {/* TARJETA DE LOGIN */}
        <div className="w-full max-w-md bg-white border border-[#cbd5e1] rounded-2xl p-8 shadow-xl z-10 text-center mt-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#f8fafc] p-2 flex items-center justify-center border border-[#e2e8f0] shadow-xs">
            <Image
              src="/logo-unimagdalena.svg"
              alt="Universidad del Magdalena"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>

          <h2 className="text-xs font-bold tracking-widest text-[#005a9c] uppercase mb-1">Plataforma Institucional</h2>
          <h3 className="text-2xl font-black tracking-tight text-[#003865] mb-5">SISTEMA ASSESSMENT</h3>

          {mensajeError && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-xl text-left text-xs font-semibold text-amber-950 flex items-start gap-2 shadow-xs animate-shake">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{mensajeError}</span>
              </div>
              <button onClick={() => setMensajeError(null)} className="text-amber-800 hover:text-amber-950 font-bold cursor-pointer p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* BOTONES DIRECTOS POR ROL - DECANA PREDETERMINADA */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleLoginDemo(usuariosDemo.find(u => u.rol === 'Decano') || { id: '1', nombreCompleto: 'María González (Decana)', correoElectronico: 'decano@unimagdalena.edu.co', rol: 'Decano' })}
              disabled={cargando}
              className="w-full bg-[#004b87] hover:bg-[#003865] text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer border border-[#38bdf8]/40 shadow-md hover:scale-[1.01]"
            >
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="block font-extrabold text-sm">Ingresar como Decana</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-200 border border-amber-300/30 px-1.5 py-0.2 rounded font-semibold">Predeterminado</span>
                </div>
                <span className="text-[11px] text-[#e0f2fe] font-normal">Control Total, Gestión de Facultad y Asignación de Roles</span>
              </div>
              <span className="bg-[#38bdf8] text-[#002848] font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                Decano
              </span>
            </button>

            <button
              onClick={() => {
                const supDemo = usuariosDemo.find(u => u.rol === 'LiderCalidadRA' || u.correoElectronico.toLowerCase().includes('carlos.ramirez')) || {
                  id: '3',
                  nombreCompleto: 'Carlos Ramírez',
                  correoElectronico: 'carlos.ramirez@unimagdalena.edu.co',
                  rol: 'LiderCalidadRA'
                };
                handleLoginDemo(supDemo);
              }}
              disabled={cargando}
              className="w-full bg-white hover:bg-purple-50 text-purple-950 font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer border-2 border-purple-600 shadow-xs"
            >
              <div className="text-left">
                <span className="block font-bold text-sm text-purple-950">Ingresar como Supervisor de Calidad</span>
                <span className="text-[10px] text-[#64748b]">Auditoría de RAs, Revisión de Mediciones y Dictámenes</span>
              </div>
              <span className="bg-purple-100 text-purple-900 font-mono text-[10px] px-2 py-0.5 rounded border border-purple-300 font-bold">
                Supervisor RA
              </span>
            </button>

            <button
              onClick={() => handleLoginDemo(usuarioDocente)}
              disabled={cargando}
              className="w-full bg-white hover:bg-[#f8fafc] text-[#003865] font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer border-2 border-[#004b87] shadow-xs"
            >
              <div className="text-left">
                <span className="block font-bold text-sm">Ingresar como Docente</span>
                <span className="text-[10px] text-[#64748b]">Carga y Gestión de Evidencias Obligatorias</span>
              </div>
              <span className="bg-[#e8f1f8] text-[#003865] font-mono text-[10px] px-2 py-0.5 rounded border border-[#bcd6ea]">
                Docente
              </span>
            </button>
          </div>

          {/* LISTA COMPLETA DE USUARIOS DEMO */}
          <div className="border-t border-[#e2e8f0] pt-4">
            <p className="text-[11px] uppercase tracking-wider text-[#64748b] mb-2.5 font-bold text-center">
              O selecciona otro usuario del sistema:
            </p>
            <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-1">
              {usuariosDemo.map((u) => {
                const esDec = u.rol === 'Decano' || u.correoElectronico.toLowerCase().includes('decano');
                const progAsignado = estadoAsignaciones?.programas.find(p => p.liderUsuarioId === u.id || p.correoLider === u.correoElectronico);
                const esLidFac = estadoAsignaciones?.liderCalidadFacultadId === u.id;
                const cursosDoc = cursosDetallados.filter(c => c.correoDocente?.toLowerCase() === u.correoElectronico.toLowerCase());
                const rasSupervisados = Array.from(new Set([
                  ...cursosDetallados.filter(c => c.correoSupervisorRa?.toLowerCase() === u.correoElectronico.toLowerCase() || c.nombreSupervisorRa?.toLowerCase() === u.nombreCompleto.toLowerCase()).map(c => c.codigoRa),
                  ...Object.entries(planAsignaturas).filter(([_, cfg]) => cfg.supervisorRaId === u.id).map(([raKey]) => raKey)
                ]));
                const esSupCalidad = u.rol === 'LiderCalidadRA' || rasSupervisados.length > 0;
                const tieneAsignacion = esDec || !!progAsignado || esLidFac || esSupCalidad || cursosDoc.length > 0;

                let etiquetaRol = 'Sin Asignar (Pendiente)';
                let badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';

                if (esDec) {
                  etiquetaRol = 'Decana';
                  badgeClass = 'bg-[#003865] text-white border-[#002848]';
                } else if (progAsignado) {
                  etiquetaRol = `Líder ${progAsignado.codigo}`;
                  badgeClass = 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]';
                } else if (esLidFac) {
                  etiquetaRol = 'Líder Facultad';
                  badgeClass = 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]';
                } else if (esSupCalidad) {
                  etiquetaRol = `Supervisor (${rasSupervisados.length > 0 ? rasSupervisados.join(', ') : 'Calidad RA'})`;
                  badgeClass = 'bg-purple-100 text-purple-800 border-purple-300';
                } else if (cursosDoc.length > 0) {
                  etiquetaRol = `Docente (${cursosDoc.length} ${cursosDoc.length === 1 ? 'curso' : 'cursos'})`;
                  badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                }

                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      if (!tieneAsignacion) {
                        setMensajeError(`El usuario "${u.nombreCompleto}" aún no ha sido asignado a ninguna asignatura ni rol directivo para el periodo actual. El Decano o el Líder de Programa deben asignarle sus cursos.`);
                        setTimeout(() => setMensajeError(null), 6000);
                        return;
                      }
                      handleLoginDemo(u);
                    }}
                    className={`flex items-center justify-between px-3.5 py-2 text-xs rounded-lg border transition-all text-left cursor-pointer ${
                      tieneAsignacion
                        ? 'bg-[#f8fafc] hover:bg-[#e8f1f8] border-[#e2e8f0]'
                        : 'bg-[#fffbeb] hover:bg-[#fef3c7] border-[#fde68a] opacity-80'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-[#0f172a] block">{u.nombreCompleto}</span>
                      <span className="text-[10px] text-[#64748b]">
                        {u.correoElectronico} {progAsignado ? `• ${progAsignado.nombrePrograma}` : ''}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono border font-bold ${badgeClass}`}>
                      {etiquetaRol}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SI EL ROL ES SUPERVISOR DE CALIDAD (LiderCalidadRA)
  // -------------------------------------------------------------
  if (usuarioActual.rol === 'LiderCalidadRA') {
    return (
      <VistaSupervisorCalidad
        usuarioActual={usuarioActual}
        cursosDisponibles={cursosDetallados}
        onCerrarSesion={() => setUsuarioActual(null)}
      />
    );
  }

  // -------------------------------------------------------------
  // SI EL ROL ES DOCENTE: VISTA DOCENTE
  // -------------------------------------------------------------
  if (usuarioActual.rol === 'Docente') {
    return (
      <VistaDocente
        usuarioActual={usuarioActual}
        cursosDisponibles={cursosDetallados}
        onCerrarSesion={() => setUsuarioActual(null)}
      />
    );
  }

  const raList = datosCatalogo?.resultadosAprendizaje || [];
  const raActual = raList[raIndexActual] || { id: 'ra1', codigo: 'RA1', nombre: 'Resultado de Aprendizaje 1', descripcion: '' };
  const configActual = planAsignaturas[raActual.codigo] || {
    cursos: [],
    metaLogro: 70,
    indicadores: []
  };

  const esDecano = usuarioActual.rol === 'Decano';
  const esLiderPrograma = usuarioActual.rol === 'LiderPrograma';

  // Obtener los cursos filtrados por el programa académico del Líder o el seleccionado
  const asignaturasDisponibles = (() => {
    if (!datosCatalogo?.asignaturas || datosCatalogo.asignaturas.length === 0) return [];

    const progAsignado = estadoAsignaciones?.programas.find(
      (p) => p.liderUsuarioId === usuarioActual?.id || p.correoLider?.toLowerCase() === usuarioActual?.correo?.toLowerCase()
    );

    let progId = progAsignado?.programaId || usuarioActual?.programaAcademicoId;
    let progNombre = progAsignado?.nombrePrograma || usuarioActual?.nombrePrograma;

    if (datosCatalogo?.programas) {
      if (progNombre) {
        const match = datosCatalogo.programas.find(
          (p) => p.nombre.toLowerCase().trim() === progNombre?.toLowerCase().trim() || p.id === progId
        );
        if (match) {
          progId = match.id;
        }
      } else if (progId) {
        const match = datosCatalogo.programas.find((p) => p.id === progId);
        if (match) {
          progId = match.id;
        }
      }
    }

    if (!progId && programaSeleccionadoId && programaSeleccionadoId !== 'todos') {
      progId = programaSeleccionadoId;
    }

    if (progId) {
      const filtradas = datosCatalogo.asignaturas.filter((a) => a.programaAcademicoId === progId);
      if (filtradas.length > 0) return filtradas;
    }

    return datosCatalogo.asignaturas;
  })();

  const nombreProgramaActual = programaSeleccionadoId === 'todos'
    ? 'Consolidado General - Facultad de Ingeniería'
    : (datosCatalogo?.programas.find((p) => p.id === programaSeleccionadoId)?.nombre || usuarioActual.nombrePrograma || 'Ingeniería de Sistemas');

  // Datos para el RA seleccionado en seguimiento
  const raSeguimientoActual = raList[raSeleccionadoSeguimientoIndex] || raList[0] || { id: 'ra1', codigo: 'RA1', nombre: 'Resultado de Aprendizaje 1', descripcion: '' };
  const configSeguimiento = planAsignaturas[raSeguimientoActual.codigo] || configActual;

  // Filtrado de cursos para pestaña Cursos
  const tienePlanGuardado = cursosDetallados && cursosDetallados.length > 0;
  const esConsolidadoGlobal = programaSeleccionadoId === 'todos';
  const totalProgramas = datosCatalogo?.programas.length || 10;
  const totalCursosEsperados = esConsolidadoGlobal ? totalProgramas * 21 : 21;
  const totalEvidenciasEsperadas = totalCursosEsperados * 6;

  const cursosFiltrados = cursosDetallados.filter((c) => {
    const matchTipo = filtroTipoCurso === 'todos' || c.tipoAssessment.toLowerCase().includes(filtroTipoCurso.toLowerCase());
    const matchRa = filtroRaCurso === 'todos' || c.codigoRa === filtroRaCurso;
    const matchTexto = busquedaCurso === '' ||
      c.nombreAsignatura.toLowerCase().includes(busquedaCurso.toLowerCase()) ||
      c.codigoAsignatura.toLowerCase().includes(busquedaCurso.toLowerCase()) ||
      c.nombreDocente.toLowerCase().includes(busquedaCurso.toLowerCase());
    return matchTipo && matchRa && matchTexto;
  });

  return (
    <div className="h-screen max-h-screen bg-[#f1f5f9] text-[#1e293b] font-sans flex flex-col overflow-hidden">
      {/* HEADER SUPERIOR BLANCO CON BRANDING INSTITUCIONAL */}
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
            <h1 className="text-base font-extrabold tracking-wide text-[#003865] uppercase">
              SISTEMA ASSESSMENT
            </h1>
            <p className="text-xs font-semibold text-[#005a9c]">
              Facultad de Ingeniería • Universidad del Magdalena
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs font-bold text-[#003865] block">{usuarioActual.nombre}</span>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold text-[#004b87] bg-[#e8f1f8] px-2 py-0.5 rounded border border-[#bcd6ea]">
                {usuarioActual.rol}
              </span>
              {usuarioActual.nombrePrograma && (
                <span className="text-[10px] text-[#475569] bg-white px-2 py-0.5 rounded border border-[#cbd5e1] font-medium">
                  {usuarioActual.nombrePrograma}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setUsuarioActual(null)}
            className="text-xs px-3.5 py-1.5 bg-[#f8fafc] hover:bg-[#e2e8f0] text-[#003865] font-semibold border border-[#cbd5e1] rounded-md transition-colors cursor-pointer"
          >
            Salir
          </button>
        </div>
      </header>

      {/* CONTENEDOR DE APP CON ALTURA FIJA */}
      <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden">
        {/* SIDEBAR AZUL INSTITUCIONAL */}
        <aside className="w-64 bg-[#004b87] text-white flex flex-col justify-between p-4 shrink-0 h-full overflow-hidden select-none shadow-md">
          <div className="space-y-3">
            <div className="px-2 pt-1">
              <span className="text-[11px] font-bold tracking-widest text-[#93c5fd] uppercase block">
                MENÚ PRINCIPAL
              </span>
            </div>

            <nav className="space-y-1.5">
              <button
                onClick={() => setVistaActual('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  vistaActual === 'dashboard'
                    ? 'bg-[#00325d] text-white shadow-inner border-l-4 border-[#38bdf8]'
                    : 'text-[#e0f2fe] hover:bg-[#003d70] hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[#93c5fd] shrink-0" />
                Dashboard
              </button>

              <button
                onClick={() => {
                  setVistaActual('assessment');
                  if (esDecano) setSubVistaAssessment('lista');
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  vistaActual === 'assessment'
                    ? 'bg-[#00325d] text-white shadow-inner border-l-4 border-[#38bdf8]'
                    : 'text-[#e0f2fe] hover:bg-[#003d70] hover:text-white'
                }`}
              >
                <ClipboardList className="w-4 h-4 text-[#93c5fd] shrink-0" />
                Assessments
              </button>

              <button
                onClick={() => setVistaActual('cursos')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  vistaActual === 'cursos'
                    ? 'bg-[#00325d] text-white shadow-inner border-l-4 border-[#38bdf8]'
                    : 'text-[#e0f2fe] hover:bg-[#003d70] hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4 text-[#93c5fd] shrink-0" />
                Cursos
              </button>

              {/* OPCIÓN EXCLUSIVA PARA EL DECANO */}
              {esDecano && (
                <div className="pt-3 mt-3 border-t border-[#003865]/60">
                  <span className="text-[10px] uppercase font-bold text-[#93c5fd] px-3 tracking-wider block mb-1">
                    Administración Decanatura
                  </span>
                  <button
                    onClick={() => setVistaActual('asignaciones')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                      vistaActual === 'asignaciones'
                        ? 'bg-[#00325d] text-white shadow-inner border-l-4 border-[#38bdf8]'
                        : 'text-[#e0f2fe] hover:bg-[#003d70] hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4 text-[#93c5fd] shrink-0" />
                    Asignar Líderes (Decano)
                  </button>
                </div>
              )}
            </nav>
          </div>

          <button
            onClick={() => setUsuarioActual(null)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-[#fed7aa] hover:bg-[#b91c1c]/20 hover:text-white transition-colors w-full text-left cursor-pointer border-t border-[#003865]/60 pt-3"
          >
            <LogOut className="w-4 h-4 text-[#f87171] shrink-0" />
            Cerrar sesión
          </button>
        </aside>

        {/* CONTENIDO PRINCIPAL CON SCROLL INDEPENDIENTE */}
        <main className="flex-1 bg-[#f8fafc] overflow-y-auto p-6 md:p-8">
          {mensajeExito && (
            <div className="mb-5 p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{mensajeExito}</span>
              </div>
              <button onClick={() => setMensajeExito(null)} className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {mensajeError && (
            <div className="mb-5 p-4 bg-red-50 border border-red-300 rounded-xl text-xs font-semibold text-red-900 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{mensajeError}</span>
              </div>
              <button onClick={() => setMensajeError(null)} className="text-red-700 hover:text-red-950 font-bold cursor-pointer p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* VISTA 2: DASHBOARD / ADMIN CON COLORES VIVOS */}
          {/* ========================================================= */}
          {vistaActual === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="bg-white border border-[#cbd5e1] rounded-xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-[#003865]">Dashboard Consolidado</h2>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Informe de evaluación para: <strong className="text-[#004b87]">{nombreProgramaActual}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#475569] font-bold uppercase">Programa:</span>
                    {esLiderPrograma ? (
                      <span className="bg-[#e8f1f8] border border-[#bcd6ea] px-3 py-1 text-xs text-[#003865] font-bold rounded-md">
                        {usuarioActual.nombrePrograma || 'Ingeniería de Sistemas'}
                      </span>
                    ) : (
                      <select
                        value={programaSeleccionadoId}
                        onChange={(e) => setProgramaSeleccionadoId(e.target.value)}
                        className="bg-white border border-[#94a3b8] rounded-md px-3 py-1 text-xs text-[#003865] font-semibold max-w-xs focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                      >
                        <option value="todos">-- Todas las Ingenierías (Consolidado) --</option>
                        {datosCatalogo?.programas.map((prog) => (
                          <option key={prog.id} value={prog.id}>
                            {prog.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#475569] font-bold uppercase">Periodo:</span>
                    <select
                      value={periodoSeleccionado}
                      onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                      className="bg-white border border-[#94a3b8] rounded-md px-3 py-1 text-xs text-[#003865] font-semibold focus:outline-none"
                    >
                      <option value="2026-1">2026 - I</option>
                      <option value="2025-2">2025 - II</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4 Tarjetas de Métricas con Acentos de Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#cbd5e1] rounded-xl p-5 shadow-2xs hover:shadow-md transition-all">
                  <span className="text-[11px] uppercase tracking-wider text-[#64748b] font-bold block mb-1">
                    Cumplimiento global en %
                  </span>
                  <div className="text-3xl font-extrabold text-[#004b87]">
                    {tienePlanGuardado ? '78.5%' : '0.0%'}
                  </div>
                  <div className="w-full bg-[#e2e8f0] h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#0284c7] to-[#004b87] h-full rounded-full" style={{ width: tienePlanGuardado ? '78.5%' : '0%' }}></div>
                  </div>
                  <span className={`text-[11px] font-bold mt-2 flex items-center gap-1.5 ${tienePlanGuardado ? 'text-[#16a34a]' : 'text-[#64748b]'}`}>
                    {tienePlanGuardado ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 inline shrink-0" />
                        Meta institucional (70.0%) superada
                      </>
                    ) : (
                      'Sin mediciones cargadas'
                    )}
                  </span>
                </div>

                <div className="bg-white border border-[#cbd5e1] rounded-xl p-5 shadow-2xs hover:shadow-md transition-all">
                  <span className="text-[11px] uppercase tracking-wider text-[#64748b] font-bold block mb-1">
                    Total estudiantes evaluados
                  </span>
                  <div className="text-3xl font-extrabold text-[#16a34a]">
                    {tienePlanGuardado ? (programaSeleccionadoId === 'todos' ? '2,480' : '524') : '0'}
                  </div>
                  <span className="text-[11px] text-[#64748b] mt-3 block font-medium truncate">
                    {tienePlanGuardado ? nombreProgramaActual : 'Sin estudiantes evaluados'}
                  </span>
                </div>

                <div className="bg-white border border-[#cbd5e1] rounded-xl p-5 shadow-2xs hover:shadow-md transition-all">
                  <span className="text-[11px] uppercase tracking-wider text-[#64748b] font-bold block mb-1">
                    {esConsolidadoGlobal ? 'Total Cursos Globales en Plan' : 'Cursos en Plan'}
                  </span>
                  <div className="text-3xl font-extrabold text-[#4f46e5]">
                    {tienePlanGuardado ? `${cursosDetallados.length} / ${totalCursosEsperados}` : `0 / ${totalCursosEsperados}`}
                  </div>
                  <span className="text-[11px] text-[#4f46e5] font-semibold mt-3 block">
                    {esConsolidadoGlobal
                      ? tienePlanGuardado
                        ? `${cursosDetallados.length} de ${totalCursosEsperados} cursos configurados (${totalProgramas} programas)`
                        : `0 de ${totalCursosEsperados} cursos globales (${totalProgramas} ingenierías)`
                      : tienePlanGuardado
                      ? `${cursosDetallados.length} de 21 cursos configurados`
                      : 'Pendiente de configuración'}
                  </span>
                </div>

                <div className="bg-white border border-[#cbd5e1] rounded-xl p-5 shadow-2xs hover:shadow-md transition-all">
                  <span className="text-[11px] uppercase tracking-wider text-[#64748b] font-bold block mb-1">
                    {esConsolidadoGlobal ? 'Total Evidencias Globales' : 'Evidencias Validadas'}
                  </span>
                  <div className="text-3xl font-extrabold text-[#d97706]">
                    {tienePlanGuardado ? (esConsolidadoGlobal ? '184' : '42') : '0'}
                  </div>
                  <span className="text-[11px] text-[#64748b] mt-3 block font-medium">
                    {tienePlanGuardado
                      ? esConsolidadoGlobal
                        ? `Documentos validados de ${totalEvidenciasEsperadas} esperados`
                        : 'Documentos PDF/DOCX'
                      : `0 de ${totalEvidenciasEsperadas} archivos subidos`}
                  </span>
                </div>
              </div>

              {/* Paneles Centrales */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-[#cbd5e1] rounded-xl p-6 shadow-2xs">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#003865]">
                      Logro de los resultados de aprendizaje (RA1 - RA7)
                    </h3>
                    <span className="text-xs font-bold text-[#004b87] bg-[#e0f2fe] px-2.5 py-0.5 rounded-full">
                      Meta Institucional: 70%
                    </span>
                  </div>

                  {!tienePlanGuardado ? (
                    <div className="py-12 text-center text-[#64748b] text-xs space-y-2">
                      <BarChart3 className="w-8 h-8 text-[#004b87] mx-auto opacity-75" />
                      <p className="font-semibold text-[#003865]">Sin datos de evaluación registrados</p>
                      <p className="max-w-md mx-auto">
                        Los gráficos de logro por RA se generarán automáticamente cuando el líder diligencie el plan y los docentes registren sus mediciones.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {[
                        { ra: 'RA1 - Formulación y Resolución', valor: 82, meta: 70 },
                        { ra: 'RA2 - Diseño en Ingeniería', valor: 75, meta: 70 },
                        { ra: 'RA3 - Comunicación Efectiva', valor: 68, meta: 70 },
                        { ra: 'RA4 - Responsabilidad Ética', valor: 91, meta: 70 },
                        { ra: 'RA5 - Trabajo en Equipo', valor: 85, meta: 70 },
                        { ra: 'RA6 - Experimentación y Análisis', valor: 72, meta: 70 },
                        { ra: 'RA7 - Aprendizaje Continuo', valor: 79, meta: 70 }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#1e293b] font-bold">{item.ra}</span>
                            <span className={`font-mono font-extrabold ${item.valor >= item.meta ? 'text-[#16a34a]' : 'text-[#d97706]'}`}>
                              {item.valor}%
                            </span>
                          </div>
                          <div className="w-full bg-[#f1f5f9] h-2.5 rounded-full overflow-hidden flex border border-[#e2e8f0]">
                            <div
                              className={`h-full rounded-full ${item.valor >= item.meta ? 'bg-gradient-to-r from-[#10b981] to-[#059669]' : 'bg-gradient-to-r from-[#f59e0b] to-[#d97706]'}`}
                              style={{ width: `${item.valor}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-[#cbd5e1] rounded-xl p-6 shadow-2xs">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#003865] mb-5">
                    Distribución de estudiantes
                  </h3>

                  {!tienePlanGuardado ? (
                    <div className="py-12 text-center text-[#64748b] text-xs space-y-2">
                      <Users className="w-8 h-8 text-[#004b87] mx-auto opacity-75" />
                      <p className="font-semibold text-[#003865]">Sin estudiantes evaluados</p>
                      <p>Esperando carga de mediciones docentes.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[
                        { rango: '90 - 100% (Excelente)', pct: 38, count: 199, color: 'bg-[#10b981]', text: 'text-[#047857]' },
                        { rango: '70 - 89% (Satisfactorio)', pct: 40, count: 210, color: 'bg-[#0ea5e9]', text: 'text-[#0369a1]' },
                        { rango: '60 - 69% (En desarrollo)', pct: 14, count: 73, color: 'bg-[#f59e0b]', text: 'text-[#b45309]' },
                        { rango: '0 - 59% (No alcanzado)', pct: 8, count: 42, color: 'bg-[#f43f5e]', text: 'text-[#be123c]' }
                      ].map((r, i) => (
                        <div key={i} className="space-y-1.5 border-b border-[#f1f5f9] pb-3 last:border-0">
                          <div className="flex justify-between text-xs">
                            <span className={`font-semibold ${r.text}`}>{r.rango}</span>
                            <span className="font-bold text-[#0f172a]">{r.pct}% ({r.count})</span>
                          </div>
                          <div className="w-full bg-[#f1f5f9] h-2 rounded-full overflow-hidden border border-[#e2e8f0]">
                            <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECCIÓN ASSESSMENTS: 3 VISTAS DE SEGUIMIENTO + CONFIG */}
          {/* ========================================================= */}
          {vistaActual === 'assessment' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Barra Superior con Selector de Período y Toggle de Vistas */}
              <div className="bg-white border border-[#cbd5e1] rounded-xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-1">
                      Período de Assessment
                    </label>
                    <select
                      value={periodoSeleccionado}
                      onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                      className="bg-white border border-[#94a3b8] rounded-md px-3 py-1.5 text-xs text-[#003865] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                    >
                      {periodosAcademicos.length > 0 ? (
                        periodosAcademicos.map((p) => (
                          <option key={p.id || p.codigo} value={p.codigo}>
                            {p.codigo} {p.esActual ? '(Vigente)' : ''} - {p.nombre}
                          </option>
                        ))
                      ) : datosCatalogo?.periodos && datosCatalogo.periodos.length > 0 ? (
                        datosCatalogo.periodos.map((p) => (
                          <option key={p.id || p.codigo} value={p.codigo}>
                            {p.codigo} - {p.nombre}
                          </option>
                        ))
                      ) : (
                        <option value="2026-1">2026-1 (Vigente)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-1">
                      Programa Académico
                    </label>
                    {esLiderPrograma ? (
                      <span className="bg-[#e8f1f8] border border-[#bcd6ea] px-3.5 py-1.5 text-xs text-[#003865] font-bold rounded-md inline-block">
                        {usuarioActual.nombrePrograma || 'Ingeniería de Sistemas'}
                      </span>
                    ) : (
                      <select
                        value={programaSeleccionadoId}
                        onChange={(e) => setProgramaSeleccionadoId(e.target.value)}
                        className="bg-white border border-[#94a3b8] rounded-md px-3 py-1.5 text-xs text-[#003865] font-semibold focus:outline-none"
                      >
                        {datosCatalogo?.programas.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Si es Líder de Programa, permitir alternar entre Configurar y Ver Resultados */}
                {esLiderPrograma && (
                  <div className="flex items-center gap-2 bg-[#f1f5f9] border border-[#cbd5e1] p-1.5 rounded-lg">
                    <button
                      onClick={() => setSubVistaAssessment('formulario_configuracion')}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        subVistaAssessment === 'formulario_configuracion'
                          ? 'bg-[#004b87] text-white shadow-xs'
                          : 'text-[#475569] hover:text-[#003865]'
                      }`}
                    >
                      Configurar Plan (7 RAs)
                    </button>
                    <button
                      onClick={() => setSubVistaAssessment('lista')}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        subVistaAssessment !== 'formulario_configuracion'
                          ? 'bg-[#004b87] text-white shadow-xs'
                          : 'text-[#475569] hover:text-[#003865]'
                      }`}
                    >
                      Ver Resultados
                    </button>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SUB-VISTA 1: LISTA GENERAL DE RAs */}
              {/* ------------------------------------------------------------- */}
              {subVistaAssessment === 'lista' && (
                <div className="space-y-4">
                  <div className="pb-1">
                    <h2 className="text-xl font-bold text-[#003865]">Resultados de Aprendizaje</h2>
                    <p className="text-xs text-[#64748b]">
                      Plan de evaluación para {nombreProgramaActual} • Período {periodoSeleccionado}
                    </p>
                  </div>

                  {!tienePlanGuardado ? (
                    <div className="bg-white border border-[#cbd5e1] rounded-2xl p-12 text-center shadow-2xs space-y-4">
                      <div className="w-16 h-16 rounded-full bg-[#e8f1f8] text-[#004b87] flex items-center justify-center mx-auto shadow-inner">
                        <ClipboardList className="w-8 h-8 text-[#004b87]" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-base font-extrabold text-[#003865]">
                          Plan de Assessment Pendiente de Configuración
                        </h3>
                        <p className="text-xs text-[#64748b] max-w-lg mx-auto leading-relaxed">
                          Esta información solo se muestra cuando el Líder de Programa o Calidad diligencie y guarde los datos del Plan de Assessment para este programa académico.
                        </p>
                      </div>

                      {esLiderPrograma && (
                        <div className="pt-2">
                          <button
                            onClick={() => setSubVistaAssessment('formulario_configuracion')}
                            className="px-5 py-2.5 bg-[#004b87] hover:bg-[#003865] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
                          >
                            <span>Ir a Configurar Plan (7 RAs)</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {raList.map((ra, idx) => {
                        const cfg = planAsignaturas[ra.codigo];
                        const asig1 = cfg?.cursos[0]?.nombreCurso || 'Sin asignar';
                        const asig2 = cfg?.cursos[1]?.nombreCurso || 'Sin asignar';
                        const asig3 = cfg?.cursos[2]?.nombreCurso || 'Sin asignar';

                        return (
                          <div
                            key={ra.id}
                            className="bg-white border border-[#cbd5e1] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#93c5fd] hover:shadow-md transition-all shadow-2xs"
                          >
                            <div className="flex-1">
                              <span className="text-xs font-extrabold uppercase tracking-wider text-[#004b87] block">
                                RESULTADO DE APRENDIZAJE {idx + 1} ({ra.codigo})
                              </span>
                              <span className="text-sm font-semibold text-[#0f172a] mt-0.5 block truncate max-w-xl">
                                {ra.nombre}
                              </span>
                              <span className="text-xs text-[#64748b] line-clamp-1 mt-0.5">
                                {ra.descripcion}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-semibold px-2.5 py-1 bg-[#e0f2fe] border border-[#bae6fd] rounded-md text-[#0369a1]" title="Formativa 1">
                                {asig1}
                              </span>
                              <span className="text-[11px] font-semibold px-2.5 py-1 bg-[#e0e7ff] border border-[#c7d2fe] rounded-md text-[#4338ca]" title="Formativa 2">
                                {asig2}
                              </span>
                              <span className="text-[11px] font-semibold px-2.5 py-1 bg-[#fef3c7] border border-[#fde68a] rounded-md text-[#92400e]" title="Sumativa">
                                {asig3}
                              </span>

                              <button
                                onClick={() => {
                                  setRaSeleccionadoSeguimientoIndex(idx);
                                  setSubVistaAssessment('detalle_ra');
                                }}
                                className="px-4 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white font-bold rounded-md text-xs transition-colors cursor-pointer shadow-xs ml-2"
                              >
                                Ver Detalle
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUB-VISTA 2: DETALLE DE EVALUACIÓN DE DESEMPEÑO RA */}
              {/* ------------------------------------------------------------- */}
              {subVistaAssessment === 'detalle_ra' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#003865]">
                        Detalle de Evaluación: {raSeguimientoActual.codigo}
                      </h2>
                      <h3 className="text-sm font-semibold text-[#475569] mt-0.5">
                        {raSeguimientoActual.nombre}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setSubVistaAssessment('lista')}
                        className="px-3.5 py-1.5 bg-white hover:bg-[#f1f5f9] border border-[#cbd5e1] rounded-md text-xs font-bold text-[#003865] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Volver a Lista</span>
                      </button>
                      <button
                        onClick={() => setSubVistaAssessment('graficos_conclusiones')}
                        className="px-4 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white font-bold rounded-md text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                      >
                        <span>Ver Gráficos y Conclusiones</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Caja de Objetivo */}
                  <div className="bg-[#e8f1f8] border border-[#bcd6ea] rounded-xl p-5 flex items-start gap-4">
                    <span className="text-xs font-bold uppercase text-[#003865] tracking-wider shrink-0 mt-0.5">
                      Objetivo Formativo:
                    </span>
                    <p className="text-xs text-[#0f172a] leading-relaxed font-medium">
                      {raSeguimientoActual.descripcion || 'Habilidad para identificar, formular o resolver problemas de ingeniería complejos mediante la aplicación de principios de ingeniería, ciencias y matemáticas.'}
                    </p>
                  </div>

                  {/* Tabla de Indicadores */}
                  <div className="bg-white border border-[#cbd5e1] rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-[#003865] text-white px-5 py-3 text-xs font-bold uppercase tracking-wider">
                      Indicadores de Desempeño
                    </div>
                    <div className="divide-y divide-[#e2e8f0]">
                      {configSeguimiento.indicadores.map((ind, i) => (
                        <div key={i} className="p-4 flex items-center justify-between gap-4 hover:bg-[#f8fafc]">
                          <div className="flex items-center gap-3.5 flex-1">
                            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#004b87] text-white rounded-md">
                              {ind.codigo}
                            </span>
                            <span className="text-xs font-medium text-[#1e293b]">{ind.descripcion}</span>
                          </div>
                          {i === 0 && (
                            <div className="text-right pl-4 border-l border-[#cbd5e1]">
                              <span className="text-[10px] text-[#64748b] block uppercase font-bold">Meta Institucional</span>
                              <span className="text-base font-extrabold text-[#16a34a] font-mono">{configSeguimiento.metaLogro}%</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabla de Evaluación de Desempeño */}
                  <div className="bg-white border border-[#cbd5e1] rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-[#003865] text-white px-5 py-3 text-xs font-bold uppercase tracking-wider">
                      Evaluación de Desempeño del {raSeguimientoActual.codigo}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#f1f5f9] border-b border-[#cbd5e1] text-[#475569] uppercase text-[10px]">
                            <th className="p-3.5 font-bold">Curso</th>
                            <th className="p-3.5 font-bold">Docente Responsable</th>
                            <th className="p-3.5 font-bold text-center">Semestre</th>
                            <th className="p-3.5 font-bold text-center">Tipo Assessment</th>
                            <th className="p-3.5 font-bold text-center">% Destacado</th>
                            <th className="p-3.5 font-bold text-center">% Satisfactorio</th>
                            <th className="p-3.5 font-bold text-center">% Básico</th>
                            <th className="p-3.5 font-bold text-center">% Cumplimiento</th>
                            <th className="p-3.5 font-bold text-center">Meta</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0] text-[#1e293b]">
                          {configSeguimiento.cursos.map((c, i) => {
                            const pctDestacado = i === 0 ? 55 : i === 1 ? 40 : 35;
                            const pctSatisfactorio = i === 0 ? 30 : i === 1 ? 38 : 45;
                            const pctBasico = i === 0 ? 10 : i === 1 ? 15 : 12;
                            const pctCumplimiento = pctDestacado + pctSatisfactorio;
                            const tipoTxt = c.rolEvaluacion === 1 ? 'Formativa 1' : c.rolEvaluacion === 2 ? 'Formativa 2' : 'Sumativa';

                            return (
                              <tr key={i} className="hover:bg-[#f8fafc]">
                                <td className="p-3.5 font-bold text-[#003865]">{c.nombreCurso}</td>
                                <td className="p-3.5 text-[#475569] font-medium">{datosCatalogo?.docentes[i % (datosCatalogo.docentes.length || 1)]?.nombre || 'Docente ' + (i + 1)}</td>
                                <td className="p-3.5 text-center font-bold">{c.semestre}</td>
                                <td className="p-3.5 text-center">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#bae6fd] bg-[#e0f2fe] text-[#0369a1]">
                                    {tipoTxt}
                                  </span>
                                </td>
                                <td className="p-3.5 text-center font-mono text-[#059669] font-bold">{pctDestacado}%</td>
                                <td className="p-3.5 text-center font-mono text-[#0284c7] font-bold">{pctSatisfactorio}%</td>
                                <td className="p-3.5 text-center font-mono text-[#d97706] font-bold">{pctBasico}%</td>
                                <td className="p-3.5 text-center font-mono font-black text-sm text-[#16a34a]">{pctCumplimiento}%</td>
                                <td className="p-3.5 text-center font-mono text-[#64748b] font-bold">{configSeguimiento.metaLogro}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUB-VISTA 3: ANÁLISIS GRÁFICO Y CONCLUSIONES */}
              {/* ------------------------------------------------------------- */}
              {subVistaAssessment === 'graficos_conclusiones' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#003865]">
                        Análisis Gráfico y Conclusiones: {raSeguimientoActual.codigo}
                      </h2>
                      <h3 className="text-sm font-semibold text-[#475569] mt-0.5">
                        {raSeguimientoActual.nombre}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setSubVistaAssessment('detalle_ra')}
                        className="px-3.5 py-1.5 bg-white hover:bg-[#f1f5f9] border border-[#cbd5e1] rounded-md text-xs font-bold text-[#003865] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Volver a Evaluación</span>
                      </button>
                      <button
                        onClick={() => setSubVistaAssessment('lista')}
                        className="px-4 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white font-bold rounded-md text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        Ver todos los RAs
                      </button>
                    </div>
                  </div>

                  {/* Panel Gráficos */}
                  <div className="bg-white border border-[#cbd5e1] rounded-xl p-6 space-y-4 shadow-2xs">
                    <div className="bg-[#e8f1f8] px-4 py-2.5 rounded-lg border border-[#bcd6ea] text-xs font-bold uppercase tracking-wider text-[#003865] text-center">
                      Análisis Gráfico del Desempeño de los RA ({raSeguimientoActual.codigo})
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-5 flex flex-col justify-between space-y-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#003865] block border-b border-[#cbd5e1] pb-2">
                          Gráfico 1: Desempeño por Curso Evaluado
                        </span>
                        <div className="space-y-3.5 py-2">
                          {configSeguimiento.cursos.map((c, i) => {
                            const val = i === 0 ? 85 : i === 1 ? 78 : 80;
                            return (
                              <div key={i} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-[#0f172a] font-bold truncate max-w-xs">{c.nombreCurso}</span>
                                  <span className="font-mono text-[#004b87] font-extrabold">{val}%</span>
                                </div>
                                <div className="w-full bg-[#e2e8f0] h-3 rounded-full overflow-hidden border border-[#cbd5e1]">
                                  <div className="bg-gradient-to-r from-[#0284c7] to-[#004b87] h-full rounded-full" style={{ width: `${val}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <span className="text-[11px] text-[#64748b] font-bold block">Meta de Aprobación Institucional: 70%</span>
                      </div>

                      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-5 flex flex-col justify-between space-y-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#003865] block border-b border-[#cbd5e1] pb-2">
                          Gráfico 2: Comparativa Cumplimiento vs Meta
                        </span>
                        <div className="space-y-4 py-2">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-[#0f172a] font-bold">Logro Global Promedio ({raSeguimientoActual.codigo})</span>
                              <span className="font-mono text-[#16a34a] font-extrabold text-sm">81.0%</span>
                            </div>
                            <div className="w-full bg-[#e2e8f0] h-3.5 rounded-full overflow-hidden border border-[#cbd5e1]">
                              <div className="bg-gradient-to-r from-[#10b981] to-[#059669] h-full rounded-full" style={{ width: '81%' }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-[#64748b] font-semibold">Meta Institucional</span>
                              <span className="font-mono text-[#475569] font-bold">70.0%</span>
                            </div>
                            <div className="w-full bg-[#e2e8f0] h-3.5 rounded-full overflow-hidden border border-[#cbd5e1]">
                              <div className="bg-[#94a3b8] h-full rounded-full" style={{ width: '70%' }}></div>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#15803d] bg-[#dcfce7] px-3 py-1.5 rounded-md border border-[#86efac] flex items-center justify-center gap-1.5 text-center">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Cumplimiento Satisfactorio (+11.0% sobre la meta)</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de Conclusiones */}
                  <div className="bg-white border border-[#cbd5e1] rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-[#003865] text-white px-5 py-3 text-xs font-bold uppercase tracking-wider">
                      Conclusiones del Proceso de Evaluación
                    </div>

                    <table className="w-full text-left text-xs border-collapse">
                      <tbody className="divide-y divide-[#e2e8f0]">
                        <tr className="hover:bg-[#f8fafc]">
                          <td className="p-4 w-60 font-bold text-[#003865] uppercase tracking-wide bg-[#f1f5f9] border-r border-[#cbd5e1]">
                            Acciones Implementadas
                          </td>
                          <td className="p-4 text-[#334155] leading-relaxed font-medium">
                            Se llevaron a cabo talleres prácticos en laboratorio y proyectos integradores de curso enfocados en la formulación rigurosa de problemas de ingeniería aplicando ciencias básicas y matemáticas.
                          </td>
                        </tr>

                        <tr className="hover:bg-[#f8fafc]">
                          <td className="p-4 w-60 font-bold text-[#003865] uppercase tracking-wide bg-[#f1f5f9] border-r border-[#cbd5e1]">
                            Resultados Obtenidos
                          </td>
                          <td className="p-4 text-[#334155] leading-relaxed font-medium">
                            El 81% de los estudiantes matriculados alcanzó niveles de desempeño Satisfactorio y Destacado, superando en un 11% la meta establecida por el comité curricular.
                          </td>
                        </tr>

                        <tr className="hover:bg-[#f8fafc]">
                          <td className="p-4 w-60 font-bold text-[#003865] uppercase tracking-wide bg-[#f1f5f9] border-r border-[#cbd5e1]">
                            Acciones de Mejora
                          </td>
                          <td className="p-4 text-[#334155] leading-relaxed font-medium">
                            Reforzar las sesiones de tutoría en el indicador ID2 (interpretación de resultados) y homogeneizar las rúbricas analíticas de evaluación entre los docentes de las tres asignaturas.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUB-VISTA 4: PLAN DE CONFIGURACIÓN (LÍDER DE PROGRAMA) */}
              {/* ------------------------------------------------------------- */}
              {subVistaAssessment === 'formulario_configuracion' && (
                <div className="space-y-6">
                  {esDecano && (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900 font-semibold shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>
                          <strong>Modo Solo Lectura (Decanatura):</strong> La edición está reservada para el Líder de Programa y Líder de Calidad.
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-200 border border-amber-300 rounded text-amber-950 font-bold">
                        Solo Lectura
                      </span>
                    </div>
                  )}

                  <div className="bg-white border border-[#cbd5e1] rounded-xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-extrabold text-[#003865]">
                        Plan de Configuración de Assessment
                      </h2>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        Asociación de las 3 asignaturas (Formativa 1, Formativa 2, Sumativa) para <strong>{nombreProgramaActual}</strong>.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#004b87] bg-[#e8f1f8] px-3 py-1.5 rounded-md border border-[#bcd6ea]">
                        Configurando: {raActual.codigo} ({raIndexActual + 1} de 7)
                      </span>
                      {!esDecano ? (
                        <button
                          onClick={handleGuardarPlan}
                          disabled={cargando}
                          className="bg-[#004b87] hover:bg-[#003865] text-white font-bold px-6 py-2 rounded-md text-xs tracking-wider uppercase transition-colors shadow-xs cursor-pointer"
                        >
                          {cargando ? 'Guardando...' : 'Guardar Plan'}
                        </button>
                      ) : (
                        <span className="text-xs px-4 py-2 bg-[#f1f5f9] border border-[#cbd5e1] rounded-md text-[#475569] font-semibold">
                          Vista Decanatura
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tabla Principal */}
                  <div className="bg-white border border-[#cbd5e1] rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#003865] text-white border-b border-[#cbd5e1] text-[11px]">
                            <th className="p-3.5 w-44 font-bold">Resultado de aprendizaje</th>
                            <th className="p-3.5 w-60 font-bold">Supervisor Calidad (1 por RA)</th>
                            <th className="p-3.5 font-bold">Nombre del curso</th>
                            <th className="p-3.5 w-24 font-bold text-center">Semestre</th>
                            <th className="p-3.5 w-32 font-bold">Tipo assessment</th>
                            <th className="p-3.5 font-bold">Docente Asignado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                          {configActual.cursos.map((curso, idx) => (
                            <tr key={idx} className="hover:bg-[#f8fafc]">
                              {idx === 0 ? (
                                <>
                                  <td rowSpan={3} className="p-4 align-top bg-[#f8fafc] border-r border-[#cbd5e1]">
                                    <span className="text-2xl font-black text-[#003865] block">{raActual.codigo}</span>
                                    <span className="text-xs font-semibold text-[#0f172a] mt-1 block leading-tight">
                                      {raActual.nombre}
                                    </span>
                                  </td>

                                  <td rowSpan={3} className="p-4 align-top bg-[#f8fafc] border-r border-[#cbd5e1]">
                                    <label className="text-[10px] uppercase font-bold text-[#004b87] block mb-1">
                                      Supervisor Calidad del {raActual.codigo}:
                                    </label>
                                    <select
                                      disabled={esDecano}
                                      value={configActual.supervisorRaId || ''}
                                      onChange={(e) => {
                                        setPlanAsignaturas({
                                          ...planAsignaturas,
                                          [raActual.codigo]: {
                                            ...configActual,
                                            supervisorRaId: e.target.value
                                          }
                                        });
                                      }}
                                      className={`w-full bg-white border border-[#94a3b8] rounded-md px-2.5 py-2 text-xs text-[#003865] font-semibold focus:outline-none focus:ring-2 focus:ring-[#004b87] ${esDecano ? 'cursor-not-allowed opacity-80' : ''}`}
                                    >
                                      <option value="">-- Seleccionar Supervisor Calidad --</option>
                                      {datosCatalogo?.supervisoresCalidadRa.map((s) => (
                                        <option key={s.id} value={s.id}>
                                          {s.nombre}
                                        </option>
                                      ))}
                                    </select>
                                    <span className="text-[10px] text-[#64748b] mt-1.5 block leading-tight">
                                      Supervisa y valida las evidencias de las 3 asignaturas del {raActual.codigo}.
                                    </span>
                                  </td>
                                </>
                              ) : null}

                              <td className="p-3">
                                <select
                                  disabled={esDecano}
                                  value={curso.asignaturaId}
                                  onChange={(e) => {
                                    const selected = (datosCatalogo?.asignaturas || []).find((a) => a.id === e.target.value);
                                    const newCursos = [...configActual.cursos];
                                    newCursos[idx] = {
                                      ...newCursos[idx],
                                      asignaturaId: e.target.value,
                                      nombreCurso: selected?.nombre || '',
                                      semestre: selected?.semestre ?? (newCursos[idx]?.semestre || 1)
                                    };
                                    setPlanAsignaturas({
                                      ...planAsignaturas,
                                      [raActual.codigo]: { ...configActual, cursos: newCursos }
                                    });
                                  }}
                                  className={`w-full bg-white border border-[#94a3b8] rounded-md px-2.5 py-1.5 text-xs text-[#003865] font-semibold focus:outline-none ${esDecano ? 'cursor-not-allowed opacity-80' : ''}`}
                                >
                                  <option value="">-- Seleccionar Asignatura --</option>
                                  {asignaturasDisponibles.map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {a.codigo} - {a.nombre} (Sem {a.semestre})
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center">
                                  <span className="inline-flex items-center justify-center min-w-[3.5rem] py-1 px-2 bg-[#f1f5f9] border border-[#cbd5e1] rounded-md text-xs font-black text-[#003865] shadow-2xs">
                                    {curso.semestre ? `Sem ${curso.semestre}` : '-'}
                                  </span>
                                </div>
                              </td>

                              <td className="p-3">
                                <select
                                  disabled={esDecano}
                                  value={curso.rolEvaluacion}
                                  onChange={(e) => {
                                    const newCursos = [...configActual.cursos];
                                    newCursos[idx] = { ...newCursos[idx], rolEvaluacion: parseInt(e.target.value) || 1 };
                                    setPlanAsignaturas({
                                      ...planAsignaturas,
                                      [raActual.codigo]: { ...configActual, cursos: newCursos }
                                    });
                                  }}
                                  className={`w-full bg-white border border-[#94a3b8] rounded-md px-2.5 py-1.5 text-xs text-[#003865] font-semibold focus:outline-none ${esDecano ? 'cursor-not-allowed opacity-80' : ''}`}
                                >
                                  <option value={1}>Formativa 1</option>
                                  <option value={2}>Formativa 2</option>
                                  <option value={3}>Sumativa</option>
                                </select>
                              </td>

                              <td className="p-3">
                                <select
                                  disabled={esDecano}
                                  value={curso.docenteId}
                                  onChange={(e) => {
                                    const newCursos = [...configActual.cursos];
                                    newCursos[idx] = { ...newCursos[idx], docenteId: e.target.value };
                                    setPlanAsignaturas({
                                      ...planAsignaturas,
                                      [raActual.codigo]: { ...configActual, cursos: newCursos }
                                    });
                                  }}
                                  className={`w-full bg-white border border-[#94a3b8] rounded-md px-2.5 py-1.5 text-xs text-[#003865] font-semibold focus:outline-none ${esDecano ? 'cursor-not-allowed opacity-80' : ''}`}
                                >
                                  <option value="">-- Seleccionar Docente a Cargo --</option>
                                  {datosCatalogo?.docentes.map((d) => (
                                    <option key={d.id} value={d.id}>
                                      {d.nombre}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Indicadores de Desempeño */}
                  <div className="bg-white border border-[#cbd5e1] rounded-xl p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#003865]">
                          Indicadores de desempeño para {raActual.codigo}
                        </h3>
                        <p className="text-[11px] text-[#64748b]">Exactamente 3 indicadores aplicables al resultado.</p>
                      </div>

                      <div className="flex items-center gap-3 bg-[#e8f1f8] border border-[#bcd6ea] px-3.5 py-1.5 rounded-lg">
                        <label className="text-xs font-bold text-[#003865]">Meta del logro ID:</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            disabled={esDecano}
                            min={1}
                            max={100}
                            value={configActual.metaLogro}
                            onChange={(e) => {
                              setPlanAsignaturas({
                                ...planAsignaturas,
                                [raActual.codigo]: { ...configActual, metaLogro: parseFloat(e.target.value) || 70 }
                              });
                            }}
                            className={`w-16 bg-white border border-[#94a3b8] rounded px-2 py-0.5 text-xs text-center text-[#003865] font-extrabold focus:outline-none ${esDecano ? 'cursor-not-allowed opacity-80' : ''}`}
                          />
                          <span className="text-xs font-bold text-[#003865]">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {configActual.indicadores.map((ind, iIdx) => (
                        <div key={iIdx} className="flex items-start gap-3.5 bg-[#f8fafc] border border-[#cbd5e1] p-3 rounded-lg hover:border-[#94a3b8] transition-colors">
                          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#004b87] text-white rounded-md shrink-0 mt-0.5">
                            {ind.codigo}
                          </span>
                          <textarea
                            disabled={esDecano}
                            rows={2}
                            value={ind.descripcion}
                            onChange={(e) => {
                              const newInds = [...configActual.indicadores];
                              newInds[iIdx] = { ...newInds[iIdx], descripcion: e.target.value };
                              setPlanAsignaturas({
                                ...planAsignaturas,
                                [raActual.codigo]: { ...configActual, indicadores: newInds }
                              });
                            }}
                            placeholder="Descripción del indicador de desempeño..."
                            className={`flex-1 bg-transparent border-0 text-xs font-medium text-[#1e293b] focus:outline-none resize-y min-h-[44px] leading-relaxed ${esDecano ? 'cursor-not-allowed opacity-80' : ''}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Paginador */}
                  <div className="flex items-center justify-center gap-1.5 pt-2">
                    <button
                      onClick={() => setRaIndexActual((prev) => Math.max(0, prev - 1))}
                      disabled={raIndexActual === 0}
                      className="px-3.5 py-1.5 text-xs font-bold bg-white border border-[#cbd5e1] rounded-md hover:bg-[#f1f5f9] text-[#003865] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      &lt; Anterior
                    </button>

                    {raList.map((ra, idx) => (
                      <button
                        key={ra.id}
                        onClick={() => setRaIndexActual(idx)}
                        className={`w-8 h-8 text-xs font-mono font-bold rounded-md border transition-colors cursor-pointer ${
                          raIndexActual === idx
                            ? 'bg-[#004b87] text-white border-[#004b87] shadow-xs'
                            : 'bg-white text-[#475569] border-[#cbd5e1] hover:bg-[#e8f1f8] hover:text-[#003865]'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => setRaIndexActual((prev) => Math.min(raList.length - 1, prev + 1))}
                      disabled={raIndexActual === raList.length - 1}
                      className="px-3.5 py-1.5 text-xs font-bold bg-white border border-[#cbd5e1] rounded-md hover:bg-[#f1f5f9] text-[#003865] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Siguiente &gt;
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* VISTA 4: CURSOS DETALLADOS */}
          {/* ========================================================= */}
          {vistaActual === 'cursos' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="bg-white border border-[#cbd5e1] rounded-xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#003865]">Catálogo de Cursos y Malla Curricular</h2>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Cursos asignados para evaluación en: <strong className="text-[#004b87]">{nombreProgramaActual}</strong>
                  </p>
                </div>

                {/* Filtros de Cursos */}
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Buscar curso o docente..."
                    value={busquedaCurso}
                    onChange={(e) => setBusquedaCurso(e.target.value)}
                    className="bg-white border border-[#94a3b8] rounded-md px-3 py-1.5 text-xs text-[#003865] font-semibold w-48 focus:outline-none"
                  />

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#475569] uppercase font-bold">RA:</span>
                    <select
                      value={filtroRaCurso}
                      onChange={(e) => setFiltroRaCurso(e.target.value)}
                      className="bg-white border border-[#94a3b8] rounded-md px-2 py-1.5 text-xs text-[#003865] font-semibold focus:outline-none"
                    >
                      <option value="todos">Todos los RAs</option>
                      {datosCatalogo?.resultadosAprendizaje.map((ra) => (
                        <option key={ra.id} value={ra.codigo}>{ra.codigo}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#475569] uppercase font-bold">Tipo:</span>
                    <select
                      value={filtroTipoCurso}
                      onChange={(e) => setFiltroTipoCurso(e.target.value)}
                      className="bg-white border border-[#94a3b8] rounded-md px-2 py-1.5 text-xs text-[#003865] font-semibold focus:outline-none"
                    >
                      <option value="todos">Todos los tipos</option>
                      <option value="formativa 1">Formativa 1</option>
                      <option value="formativa 2">Formativa 2</option>
                      <option value="sumativa">Sumativa</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid de Tarjetas de Cursos */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {cursosFiltrados.length === 0 ? (
                  <div className="col-span-full bg-white border border-[#cbd5e1] rounded-xl p-12 text-center shadow-2xs space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#e8f1f8] text-[#004b87] flex items-center justify-center mx-auto shadow-inner">
                      <ClipboardList className="w-6 h-6 text-[#004b87]" />
                    </div>
                    <h3 className="text-base font-bold text-[#003865]">No hay asignaturas en el Plan de Assessment</h3>
                    <p className="text-xs text-[#64748b] max-w-md mx-auto">
                      Actualmente no existen cursos guardados en el plan de evaluación. El Líder de Programa debe ingresar a la sección de Assessment, seleccionar y configurar las 21 asignaturas y asignar sus docentes para comenzar.
                    </p>
                  </div>
                ) : (
                  cursosFiltrados.map((curso, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-[#cbd5e1] rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-[#93c5fd] hover:shadow-md transition-all shadow-2xs"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold bg-[#e8f1f8] border border-[#bcd6ea] px-2.5 py-0.5 rounded text-[#003865]">
                              {curso.codigoAsignatura}
                            </span>
                            <span className="text-[11px] text-[#64748b] font-semibold">
                              Semestre {curso.semestre} • {curso.creditos} Cr
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#cbd5e1] bg-[#f8fafc] text-[#475569] font-bold">
                            {curso.periodoAcademico}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-[#003865] leading-snug">
                          {curso.nombreAsignatura}
                        </h3>

                        <div className="space-y-2 pt-2 border-t border-[#f1f5f9]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#64748b]">Resultado Aprendizaje:</span>
                            <span className="font-bold text-[#004b87] bg-[#e0f2fe] px-2 py-0.5 rounded border border-[#bae6fd] font-mono">
                              {curso.codigoRa}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#64748b]">Tipo Assessment:</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${
                              curso.tipoAssessment.includes('Sumativa')
                                ? 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
                                : 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]'
                            }`}>
                              {curso.tipoAssessment}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#64748b]">Docente Asignado:</span>
                            <span className="font-semibold text-[#1e293b] truncate max-w-[170px]" title={curso.nombreDocente}>
                              {curso.nombreDocente}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#64748b]">Supervisor RA:</span>
                            <span className="text-[#475569] text-[11px] font-medium truncate max-w-[170px]" title={curso.nombreSupervisorRa}>
                              {curso.nombreSupervisorRa}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#64748b] font-semibold">
                          {curso.indicadores.length} Indicadores • Meta {curso.metaLogroPorcentaje}%
                        </span>
                        <button
                          onClick={() => setCursoSeleccionadoModal(curso)}
                          className="px-3.5 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          Ver más detalles
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VISTA: ASIGNACIÓN DE ROLES POR EL DECANO */}
          {/* ========================================================= */}
          {vistaActual === 'asignaciones' && esDecano && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="bg-white border border-[#cbd5e1] rounded-xl p-5 shadow-2xs">
                <h2 className="text-xl font-bold text-[#003865]">Gestión y Asignación de Líderes Académicos</h2>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Panel exclusivo de Decanatura para designar al Líder de Calidad de Facultad y a los Líderes de los 10 Programas de Ingeniería.
                </p>
              </div>

              {/* SECCIÓN 1: LÍDER DE CALIDAD DE FACULTAD */}
              <div className="bg-gradient-to-r from-[#e8f1f8] to-[#dbeafe] border border-[#bcd6ea] rounded-xl p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#003865] uppercase tracking-wide">
                      1. Líder de Calidad de la Facultad de Ingeniería
                    </h3>
                    <p className="text-xs text-[#475569] mt-0.5">
                      Supervisa el consolidado general de evaluación para todos los programas académicos.
                    </p>
                  </div>
                  <span className="text-xs px-3 py-1 bg-white border border-[#bcd6ea] rounded-full text-[#003865] font-bold">
                    Facultad de Ingeniería
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-[#003865] uppercase block mb-1">
                      Seleccionar Usuario:
                    </label>
                    <select
                      value={liderFacultadSeleccionado}
                      onChange={(e) => setLiderFacultadSeleccionado(e.target.value)}
                      className="w-full bg-white border border-[#94a3b8] rounded-md px-3.5 py-2 text-xs text-[#003865] font-semibold focus:outline-none"
                    >
                      <option value="">-- Sin asignar (Ninguno) --</option>
                      {estadoAsignaciones?.candidatosDisponibles
                        .filter((c) => {
                          // Si es el actual seleccionado, mostrarlo
                          if (liderFacultadSeleccionado && c.id === liderFacultadSeleccionado) return true;
                          // Si está asignado en algún programa, excluirlo
                          const asignadoEnPrograma = Object.values(asignacionesProgramas).includes(c.id);
                          if (asignadoEnPrograma) return false;
                          // Si ya tiene rol de Líder de Programa en BD, excluirlo
                          if (c.rolActual === 'LiderPrograma') return false;
                          return true;
                        })
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombreCompleto} ({c.correoElectronico})
                          </option>
                        ))}
                    </select>
                  </div>

                  <button
                    onClick={() => handleAsignarLiderFacultad(liderFacultadSeleccionado)}
                    disabled={cargando}
                    className="self-end bg-[#004b87] hover:bg-[#003865] text-white font-bold px-6 py-2.5 rounded-md text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {liderFacultadSeleccionado ? 'Guardar Líder de Facultad' : 'Desasignar Líder de Facultad'}
                  </button>
                </div>
              </div>

              {/* SECCIÓN 2: LÍDERES POR PROGRAMA */}
              <div className="bg-white border border-[#cbd5e1] rounded-xl p-6 space-y-4 shadow-2xs">
                <div>
                  <h3 className="text-sm font-extrabold text-[#003865] uppercase tracking-wide">
                    2. Asignación de Líderes por Programa Académico (10 Ingenierías)
                  </h3>
                  <p className="text-xs text-[#64748b]">
                    Designa a los directores o líderes encargados de configurar el plan de cada programa. Un usuario solo puede tener un rol a la vez.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#003865] text-white text-[11px]">
                        <th className="py-3 px-4 font-bold">Código</th>
                        <th className="py-3 px-4 font-bold">Programa de Ingeniería</th>
                        <th className="py-3 px-4 font-bold">Estado</th>
                        <th className="py-3 px-4 font-bold">Líder de Programa Asignado</th>
                        <th className="py-3 px-4 text-right font-bold">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {estadoAsignaciones?.programas.map((prog) => {
                        const tieneAsignado = !!prog.liderUsuarioId;
                        const valorActual = asignacionesProgramas[prog.programaId] !== undefined
                          ? asignacionesProgramas[prog.programaId]
                          : (prog.liderUsuarioId || '');
                        const huboCambio = valorActual !== (prog.liderUsuarioId || '');

                        // Filtrar candidatos para este programa excluyendo usuarios con otros roles
                        const candidatosDisponiblesEstePrograma = (estadoAsignaciones?.candidatosDisponibles || []).filter((c) => {
                          // Si es el actualmente asignado a este programa, mantenerlo en la lista
                          if (valorActual && c.id === valorActual) return true;
                          // Si está seleccionado o asignado como Líder de Facultad, excluirlo
                          if (liderFacultadSeleccionado && c.id === liderFacultadSeleccionado) return false;
                          if (c.rolActual === 'LiderCalidadFacultad') return false;
                          // Si está asignado en otro programa en el estado local, excluirlo
                          const asignadoEnOtroPrograma = Object.entries(asignacionesProgramas).some(
                            ([pId, uId]) => pId !== prog.programaId && uId === c.id
                          );
                          if (asignadoEnOtroPrograma) return false;
                          // Si en la BD ya es Líder de otro programa, excluirlo
                          if (c.rolActual === 'LiderPrograma' && c.programaAsignadoId && c.programaAsignadoId !== prog.programaId) {
                            return false;
                          }
                          return true;
                        });

                        return (
                          <tr key={prog.programaId} className="hover:bg-[#f8fafc] transition-colors">
                            <td className="py-3 px-4 font-mono text-[#004b87] font-bold">{prog.codigo}</td>
                            <td className="py-3 px-4 font-bold text-[#0f172a]">
                              {prog.nombrePrograma}
                              {prog.nombreLider && prog.nombreLider !== 'Sin asignar' && (
                                <div className="text-[11px] text-[#64748b] font-normal">
                                  Líder actual: <span className="font-semibold text-[#004b87]">{prog.nombreLider}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {tieneAsignado ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  Asignado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  Sin Asignar
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={valorActual}
                                onChange={(e) => {
                                  setAsignacionesProgramas({
                                    ...asignacionesProgramas,
                                    [prog.programaId]: e.target.value
                                  });
                                }}
                                className="w-full bg-white border border-[#94a3b8] rounded-md px-3 py-1.5 text-xs text-[#003865] font-semibold focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                              >
                                <option value="">-- Sin asignar --</option>
                                {candidatosDisponiblesEstePrograma.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.nombreCompleto} ({c.correoElectronico})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleAsignarLiderPrograma(prog.programaId, valorActual)}
                                disabled={cargando || !huboCambio}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer shadow-xs ${
                                  huboCambio
                                    ? valorActual === ''
                                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                                      : 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                                    : 'bg-[#94a3b8] text-white opacity-50 cursor-not-allowed'
                                }`}
                              >
                                {huboCambio ? (valorActual === '' ? 'Quitar Líder' : 'Guardar') : (tieneAsignado ? 'Asignado' : 'Sin asignar')}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECCIÓN 3: GESTIÓN DE PERÍODOS ACADÉMICOS DE ASSESSMENT */}
              <div className="bg-white border border-[#cbd5e1] rounded-xl p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#003865] uppercase tracking-wide flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#004b87]" />
                      3. Gestión de Períodos Académicos de Assessment
                    </h3>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      Configuración de los períodos oficiales para la medición y evaluación continua de los 10 programas de Ingeniería.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setNuevoPeriodoCodigo('');
                      setNuevoPeriodoNombre('');
                      setNuevoPeriodoFechaInicio('');
                      setNuevoPeriodoFechaFin('');
                      setNuevoPeriodoEsActual(true);
                      setModalCrearPeriodo(true);
                    }}
                    className="inline-flex items-center gap-2 bg-[#004b87] hover:bg-[#003865] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Período Académico
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {(periodosAcademicos.length > 0 ? periodosAcademicos : (datosCatalogo?.periodos || [])).map((per: any) => {
                    const esActivo = per.esActual || per.codigo === periodoSeleccionado;
                    return (
                      <div
                        key={per.id || per.codigo}
                        className={`p-4 rounded-xl border transition-all ${
                          esActivo
                            ? 'bg-[#f0f9ff] border-[#0284c7] shadow-xs'
                            : 'bg-white border-[#e2e8f0] hover:border-[#cbd5e1]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded bg-[#003865] text-white">
                            {per.codigo}
                          </span>
                          {per.esActual ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Período Actual
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-[#64748b] px-2 py-0.5 rounded-full bg-[#f1f5f9] border border-[#e2e8f0]">
                              Histórico
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-[#0f172a] mb-1">{per.nombre}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
                          <Clock className="w-3 h-3 text-[#94a3b8]" />
                          <span>
                            {per.fechaInicio ? new Date(per.fechaInicio).toLocaleDateString() : 'Inicio del ciclo'} - {per.fechaFin ? new Date(per.fechaFin).toLocaleDateString() : 'Fin del ciclo'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL: DETALLES COMPLETOS DEL CURSO */}
      {/* ========================================================= */}
      {cursoSeleccionadoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#cbd5e1] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-[#1e293b]">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#bcd6ea] flex items-start justify-between bg-[#e8f1f8] rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#004b87] text-white">
                    {cursoSeleccionadoModal.codigoAsignatura}
                  </span>
                  <span className="text-xs text-[#475569] font-semibold">
                    Semestre {cursoSeleccionadoModal.semestre} • {cursoSeleccionadoModal.creditos} Créditos
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#cbd5e1] bg-white text-[#003865] font-bold">
                    {cursoSeleccionadoModal.periodoAcademico}
                  </span>
                </div>
                <h2 className="text-xl font-black text-[#003865]">
                  {cursoSeleccionadoModal.nombreAsignatura}
                </h2>
                <p className="text-xs font-semibold text-[#005a9c]">
                  {cursoSeleccionadoModal.programaAcademico} • Facultad de Ingeniería
                </p>
              </div>

              <button
                onClick={() => setCursoSeleccionadoModal(null)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-[#e2e8f0] border border-[#cbd5e1] text-[#64748b] hover:text-[#003865] flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs">
              {/* Sección RA */}
              <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                    Resultado de Aprendizaje (RA)
                  </span>
                  <span className="text-xs font-mono font-bold bg-[#004b87] text-white px-2.5 py-0.5 rounded">
                    {cursoSeleccionadoModal.codigoRa}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#003865]">
                  {cursoSeleccionadoModal.nombreRa}
                </h4>
                <p className="text-[#334155] leading-relaxed text-xs">
                  {cursoSeleccionadoModal.descripcionRa}
                </p>
              </div>

              {/* Sección Tipo de Assessment y Meta */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-4">
                  <span className="text-[10px] font-bold uppercase text-[#64748b] block mb-1">
                    Tipo de Assessment
                  </span>
                  <span className="text-base font-extrabold text-[#003865] block">
                    {cursoSeleccionadoModal.tipoAssessment}
                  </span>
                  <span className="text-[10px] text-[#64748b] mt-1 block">
                    {cursoSeleccionadoModal.tipoAssessment.includes('Sumativa')
                      ? 'Evaluación de salida del ciclo formativo'
                      : 'Evaluación de progreso y seguimiento'}
                  </span>
                </div>

                <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-4">
                  <span className="text-[10px] font-bold uppercase text-[#64748b] block mb-1">
                    Meta de Logro Institucional
                  </span>
                  <span className="text-base font-extrabold text-[#16a34a] block">
                    {cursoSeleccionadoModal.metaLogroPorcentaje}%
                  </span>
                  <span className="text-[10px] text-[#64748b] mt-1 block">
                    Porcentaje mínimo de aprobación esperado
                  </span>
                </div>
              </div>

              {/* Sección Indicadores de Desempeño */}
              <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#003865]">
                    Indicadores de Desempeño Asociados (3)
                  </span>
                  <span className="text-[10px] text-[#64748b] font-mono">ID1, ID2, ID3</span>
                </div>

                <div className="space-y-2.5">
                  {cursoSeleccionadoModal.indicadores.map((ind, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white border border-[#e2e8f0] p-3 rounded-lg shadow-2xs">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#004b87] text-white shrink-0">
                        {ind.codigo}
                      </span>
                      <p className="text-xs text-[#334155] leading-relaxed font-medium">
                        {ind.descripcion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sección Equipo y Supervisión */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#64748b] block">Docente Responsable</span>
                  <div className="font-bold text-[#003865] text-xs">{cursoSeleccionadoModal.nombreDocente}</div>
                  <div className="text-[11px] text-[#64748b] font-mono">{cursoSeleccionadoModal.correoDocente}</div>
                </div>

                <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#64748b] block">Supervisor de Calidad (RA)</span>
                  <div className="font-bold text-[#003865] text-xs">{cursoSeleccionadoModal.nombreSupervisorRa}</div>
                  <div className="text-[11px] text-[#64748b] font-mono">{cursoSeleccionadoModal.correoSupervisorRa}</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#e2e8f0] bg-[#f8fafc] rounded-b-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748b] font-medium">Estado de Evaluación:</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#86efac] bg-[#dcfce7] text-[#15803d]">
                  {cursoSeleccionadoModal.estadoEvaluacion} ({cursoSeleccionadoModal.totalEvidencias} Evidencias)
                </span>
              </div>
              <button
                onClick={() => setCursoSeleccionadoModal(null)}
                className="px-5 py-2 bg-[#004b87] hover:bg-[#003865] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR PERÍODO ACADÉMICO (DECANO) */}
      {/* ========================================================= */}
      {modalCrearPeriodo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#cbd5e1] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col text-[#1e293b]">
            <div className="p-5 border-b border-[#bcd6ea] flex items-center justify-between bg-[#e8f1f8] rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#003865] flex items-center justify-center text-white">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#003865]">Crear Período Académico</h3>
                  <p className="text-[11px] text-[#475569]">Decanatura de Ingeniería • Universidad del Magdalena</p>
                </div>
              </div>
              <button
                onClick={() => setModalCrearPeriodo(false)}
                className="p-1.5 rounded-lg hover:bg-white/80 text-[#64748b] hover:text-[#0f172a] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearPeriodo} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#003865] uppercase block mb-1.5">
                  Código del Período *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 2026-2, 2027-1"
                  value={nuevoPeriodoCodigo}
                  onChange={(e) => setNuevoPeriodoCodigo(e.target.value)}
                  className="w-full bg-white border border-[#94a3b8] rounded-lg px-3.5 py-2 text-xs font-mono font-bold text-[#003865] focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                />
                <span className="text-[11px] text-[#64748b] mt-1 block">Formato estándar semestral: AAAA-1 o AAAA-2.</span>
              </div>

              <div>
                <label className="text-xs font-bold text-[#003865] uppercase block mb-1.5">
                  Nombre Oficial / Descriptivo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Período Académico 2026 - II"
                  value={nuevoPeriodoNombre}
                  onChange={(e) => setNuevoPeriodoNombre(e.target.value)}
                  className="w-full bg-white border border-[#94a3b8] rounded-lg px-3.5 py-2 text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#003865] uppercase block mb-1.5">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={nuevoPeriodoFechaInicio}
                    onChange={(e) => setNuevoPeriodoFechaInicio(e.target.value)}
                    className="w-full bg-white border border-[#94a3b8] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#003865] uppercase block mb-1.5">
                    Fecha de Finalización
                  </label>
                  <input
                    type="date"
                    value={nuevoPeriodoFechaFin}
                    onChange={(e) => setNuevoPeriodoFechaFin(e.target.value)}
                    className="w-full bg-white border border-[#94a3b8] rounded-lg px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#004b87]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
                  <input
                    type="checkbox"
                    checked={nuevoPeriodoEsActual}
                    onChange={(e) => setNuevoPeriodoEsActual(e.target.checked)}
                    className="w-4 h-4 rounded text-[#004b87] border-[#94a3b8] focus:ring-[#004b87]"
                  />
                  <span className="text-xs font-semibold text-[#0f172a]">
                    Establecer como Período Académico Actual / Vigente de la Facultad
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setModalCrearPeriodo(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-[#64748b] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPeriodo}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-[#004b87] hover:bg-[#003865] text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-xs"
                >
                  {guardandoPeriodo ? (
                    <span>Guardando período...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Crear Período</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
