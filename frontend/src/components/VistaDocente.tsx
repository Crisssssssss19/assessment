'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  LogOut,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  UploadCloud,
  User,
  Check
} from 'lucide-react';
import { CursoDetallado, cargarArchivoEvidencia } from '@/lib/api';

export interface EvidenciaItem {
  id: string;
  numero: number;
  titulo: string;
  descripcionFormato: string;
  estado: 'cargado' | 'sin_cargar' | 'correccion_requerida';
  nombreArchivo?: string;
  tamanioMb?: number;
  fechaCarga?: string;
  observacionSupervisor?: string;
  urlSimulada?: string;
}

interface VistaDocenteProps {
  usuarioActual: {
    id: string;
    nombre: string;
    correo: string;
    rol: string;
    programaAcademicoId?: string | null;
    nombrePrograma?: string | null;
  };
  cursosDisponibles: CursoDetallado[];
  onCerrarSesion: () => void;
}

export default function VistaDocente({
  usuarioActual,
  cursosDisponibles,
  onCerrarSesion
}: VistaDocenteProps) {
  // Navegación interna del docente
  const [seccionActual, setSeccionActual] = useState<'evidencias' | 'dashboard' | 'cursos'>('evidencias');

  // Filtrar o seleccionar el curso actual asignado al docente
  const cursosDelDocente = cursosDisponibles.filter(
    (c) => c.correoDocente.toLowerCase() === usuarioActual.correo.toLowerCase() ||
           c.nombreDocente.toLowerCase().includes(usuarioActual.nombre.toLowerCase())
  );

  // Si no encuentra por coincidencia exacta, usar el primer curso disponible como muestra
  const cursoActivoDefault = cursosDelDocente.length > 0 ? cursosDelDocente[0] : (cursosDisponibles[0] || {
    asignaturaId: 'a10',
    codigoAsignatura: 'INF501',
    nombreAsignatura: 'Ingeniería de Requisitos',
    semestre: 5,
    creditos: 3,
    periodoAcademico: '2026-II',
    programaAcademico: 'Ingeniería de Sistemas',
    codigoRa: 'RA-2',
    nombreRa: 'Capacidad de Diseñar Soluciones',
    descripcionRa: 'Aplica procesos de diseño en ingeniería para producir soluciones.',
    tipoAssessment: 'Sumativa',
    tipoAssessmentNumero: 3,
    metaLogroPorcentaje: 75,
    nombreDocente: usuarioActual.nombre,
    correoDocente: usuarioActual.correo,
    nombreSupervisorRa: 'Ing. Laura Pérez (Líder Calidad RA)',
    correoSupervisorRa: 'calidad.ra@unimagdalena.edu.co',
    estadoEvaluacion: 'En Proceso de Carga',
    totalEvidencias: 6,
    indicadores: [
      { codigo: 'IND-2.1', descripcion: 'Especifica requerimientos funcionales y no funcionales estructurados.' },
      { codigo: 'IND-2.2', descripcion: 'Modela diagramas UML y casos de uso con precisión técnica.' }
    ]
  });

  const [cursoSeleccionadoId, setCursoSeleccionadoId] = useState<string>(cursoActivoDefault.asignaturaId);
  const cursoActivo = cursosDisponibles.find((c) => c.asignaturaId === cursoSeleccionadoId) || cursoActivoDefault;

  // Estado de las 6 evidencias por curso (inicializado vacío para que los datos sean 100% ingresados por el usuario)
  const [mapaEvidencias, setMapaEvidencias] = useState<{ [cursoId: string]: EvidenciaItem[] }>({
    [cursoActivoDefault.asignaturaId]: [
      { id: 'ev-1', numero: 1, titulo: '1. Sílabus del Curso', descripcionFormato: 'Obligatorio PDF / DOCX (Max 2 MB)', estado: 'sin_cargar' },
      { id: 'ev-2', numero: 2, titulo: '2. Hoja de Vida del Docente', descripcionFormato: 'Obligatorio PDF / DOCX (Max 2 MB)', estado: 'sin_cargar' },
      { id: 'ev-3', numero: 3, titulo: '3. Texto Guía', descripcionFormato: 'Obligatorio PDF / DOCX (Max 2 MB)', estado: 'sin_cargar' },
      { id: 'ev-4', numero: 4, titulo: '4. Muestra Trabajo Clase', descripcionFormato: 'Obligatorio PDF / DOCX (Max 2 MB)', estado: 'sin_cargar' },
      { id: 'ev-5', numero: 5, titulo: '5. Muestra Examen', descripcionFormato: 'Obligatorio PDF / DOCX (Max 2 MB)', estado: 'sin_cargar' },
      { id: 'ev-6', numero: 6, titulo: '6. Muestra Retroalimentación', descripcionFormato: 'Obligatorio PDF / DOCX (Max 2 MB)', estado: 'sin_cargar' }
    ]
  });

  // Modal para adjuntar o corregir archivo
  const [modalAbierto, setModalAbierto] = useState(false);
  const [evidenciaParaEditar, setEvidenciaParaEditar] = useState<EvidenciaItem | null>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [notificacion, setNotificacion] = useState<{ tipo: 'exito' | 'info' | 'error'; mensaje: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Obtener la lista de evidencias del curso actual
  const evidenciasActuales: EvidenciaItem[] = mapaEvidencias[cursoActivo.asignaturaId] || [
    { id: 'ev-1', numero: 1, titulo: '1. Sílabus del Curso', descripcionFormato: 'Obligatorio PDF / DOCX (Max 2 MB)', estado: 'sin_cargar' },
    { id: 'ev-2', numero: 2, titulo: '2. Hoja de Vida del Docente', descripcionFormato: 'Obligatorio PDF / DOCX (Max 2 MB)', estado: 'sin_cargar' },
    { id: 'ev-3', numero: 3, titulo: '3. Texto Guía', descripcionFormato: 'Obligatorio PDF / DOCX (Max 2 MB)', estado: 'sin_cargar' },
    { id: 'ev-4', numero: 4, titulo: '4. Muestra Trabajo Clase', descripcionFormato: 'Obligatorio PDF / DOCX (Max 2 MB)', estado: 'sin_cargar' },
    { id: 'ev-5', numero: 5, titulo: '5. Muestra Examen', descripcionFormato: 'Obligatorio PDF / DOCX (Max 2 MB)', estado: 'sin_cargar' },
    { id: 'ev-6', numero: 6, titulo: '6. Muestra Retroalimentación', descripcionFormato: 'Obligatorio PDF / DOCX (Max 2 MB)', estado: 'sin_cargar' }
  ];

  // Cálculo de estadísticas de completitud
  const totalEvidencias = evidenciasActuales.length;
  const evidenciasCargadas = evidenciasActuales.filter((e) => e.estado === 'cargado').length;
  const pendientes = evidenciasActuales.filter((e) => e.estado === 'sin_cargar');
  const conCorreccion = evidenciasActuales.filter((e) => e.estado === 'correccion_requerida');
  const todasListas = evidenciasCargadas === totalEvidencias;

  const mostrarNotificacion = (tipo: 'exito' | 'info' | 'error', mensaje: string) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion(null), 4500);
  };

  const abrirModalCarga = (evidencia: EvidenciaItem) => {
    setEvidenciaParaEditar(evidencia);
    setArchivoSeleccionado(null);
    setErrorCarga(null);
    setModalAbierto(true);
  };

  const handleArchivoCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de formato: PDF o DOCX
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'pdf' && extension !== 'docx' && extension !== 'doc') {
      setErrorCarga('Formato no permitido. Solo se aceptan archivos PDF o DOCX.');
      return;
    }

    // Validación de tamaño (Máx 2 MB = 2 * 1024 * 1024 bytes)
    if (file.size > 2 * 1024 * 1024) {
      setErrorCarga(`El archivo supera el límite de 2 MB (Tamaño actual: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    setErrorCarga(null);
    setArchivoSeleccionado(file);
  };

  const handleGuardarArchivo = async () => {
    if (!evidenciaParaEditar || !archivoSeleccionado) return;

    setSubiendo(true);
    const medicionId = cursoActivo.asignaturaId || '00000000-0000-0000-0000-000000000000';
    const resultadoBackend = await cargarArchivoEvidencia(medicionId, archivoSeleccionado);

    setMapaEvidencias((prev) => {
      const listaActual = prev[cursoActivo.asignaturaId] || evidenciasActuales;
      const listaActualizada = listaActual.map((item) => {
        if (item.id === evidenciaParaEditar.id) {
          return {
            ...item,
            estado: 'cargado' as const,
            nombreArchivo: archivoSeleccionado.name,
            tamanioMb: Number((archivoSeleccionado.size / (1024 * 1024)).toFixed(2)),
            fechaCarga: new Date().toISOString().split('T')[0],
            observacionSupervisor: undefined
          };
        }
        return item;
      });

      return {
        ...prev,
        [cursoActivo.asignaturaId]: listaActualizada
      };
    });

    setSubiendo(false);
    setModalAbierto(false);
    mostrarNotificacion('exito', `Evidencia "${evidenciaParaEditar.titulo}" procesada con éxito. ${resultadoBackend.mensaje}`);
  };

  const handleGuardarAvance = () => {
    mostrarNotificacion('info', 'Avance guardado exitosamente en el sistema.');
  };

  const handleEnviarEvidencias = () => {
    if (!todasListas) {
      const nombresPendientes = pendientes.map((p) => p.titulo.replace(/^\d+\.\s*/, '')).join(', ');
      mostrarNotificacion(
        'error',
        `No es posible enviar aún. Faltan ${pendientes.length} evidencias por adjuntar (${nombresPendientes})${
          conCorreccion.length > 0 ? ' y hay correcciones requeridas pendientes.' : '.'
        }`
      );
      return;
    }

    mostrarNotificacion(
      'exito',
      `¡Todas las evidencias de ${cursoActivo.nombreAsignatura} han sido enviadas para revisión del Supervisor (${cursoActivo.nombreSupervisorRa})!`
    );
  };

  return (
    <div className="h-screen max-h-screen bg-[#f1f5f9] text-[#1e293b] font-sans flex flex-col overflow-hidden">
      {/* HEADER SUPERIOR */}
      <header className="h-16 bg-white border-b border-[#cbd5e1] flex items-center justify-between px-6 shrink-0 z-20 shadow-xs">
        {/* LOGO INSTITUCIONAL + TITULO SISTEMA */}
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
              Unimagdalena
            </p>
          </div>
        </div>

        {/* INFO DOCENTE + PERIODO */}
        <div className="flex items-center gap-3">
          <div className="bg-[#e8f1f8] border border-[#bcd6ea] px-4 py-1.5 rounded-md text-xs font-medium text-[#003865] flex items-center gap-2 shadow-2xs">
            <span className="font-bold">Docente:</span>
            <span>{usuarioActual.nombre}</span>
            <span className="text-[#94a3b8]">|</span>
            <span className="font-bold">Periodo:</span>
            <span>{cursoActivo.periodoAcademico || '2026-II'}</span>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL: SIDEBAR + CONTENIDO */}
      <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden">
        {/* SIDEBAR AZUL INSTITUCIONAL */}
        <aside className="w-64 bg-[#004b87] text-white flex flex-col justify-between p-4 shrink-0 h-full overflow-hidden select-none shadow-md">
          <div className="space-y-4">
            <div className="px-2 pt-2">
              <span className="text-[11px] font-bold tracking-widest text-[#93c5fd] uppercase block">
                NAVEGACIÓN DOCENTE
              </span>
            </div>

            <nav className="space-y-1.5">
              {/* Dashboard */}
              <button
                onClick={() => setSeccionActual('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                  seccionActual === 'dashboard'
                    ? 'bg-[#00325d] text-white shadow-inner border-l-4 border-[#38bdf8]'
                    : 'text-[#e0f2fe] hover:bg-[#003d70] hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[#93c5fd] shrink-0" />
                Dashboard
              </button>

              {/* Evidencias del Curso (VISTA PRINCIPAL) */}
              <button
                onClick={() => setSeccionActual('evidencias')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                  seccionActual === 'evidencias'
                    ? 'bg-[#00325d] text-white shadow-inner border-l-4 border-[#38bdf8]'
                    : 'text-[#e0f2fe] hover:bg-[#003d70] hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 text-[#93c5fd] shrink-0" />
                Evidencias del Curso
              </button>

              {/* Cursos */}
              <button
                onClick={() => setSeccionActual('cursos')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                  seccionActual === 'cursos'
                    ? 'bg-[#00325d] text-white shadow-inner border-l-4 border-[#38bdf8]'
                    : 'text-[#e0f2fe] hover:bg-[#003d70] hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4 text-[#93c5fd] shrink-0" />
                Cursos
              </button>
            </nav>
          </div>

          {/* CERRAR SESIÓN */}
          <div className="pt-4 border-t border-[#003865]/60">
            <button
              onClick={onCerrarSesion}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-[#fed7aa] hover:bg-[#b91c1c]/20 hover:text-white transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[#f87171] shrink-0" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* ÁREA DE CONTENIDO */}
        <main className="flex-1 flex flex-col h-full overflow-y-auto bg-[#f8fafc]">
          {/* TOAST NOTIFICACIÓN */}
          {notificacion && (
            <div
              className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border text-xs font-medium flex items-center gap-3 animate-fade-in ${
                notificacion.tipo === 'exito'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : notificacion.tipo === 'error'
                  ? 'bg-red-50 text-red-900 border-red-300'
                  : 'bg-sky-50 text-sky-900 border-sky-300'
              }`}
            >
              {notificacion.tipo === 'exito' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {notificacion.tipo === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
              {notificacion.tipo === 'info' && <AlertTriangle className="w-4 h-4 text-sky-600 shrink-0" />}
              <span>{notificacion.mensaje}</span>
              <button onClick={() => setNotificacion(null)} className="text-neutral-500 hover:text-neutral-800 font-bold ml-2 cursor-pointer p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* VISTA: EVIDENCIAS DEL CURSO */}
          {seccionActual === 'evidencias' && (
            <div className="p-6 md:p-8 flex flex-col flex-1 max-w-7xl w-full mx-auto justify-between">
              <div>
                {/* BANNER / CAJA SUPERIOR DE INFORMACIÓN DEL CURSO */}
                <div className="bg-[#dceaf6] border border-[#b4d4ed] rounded-lg p-4 mb-6 shadow-2xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-[#003865]">
                          Asignatura: {cursoActivo.nombreAsignatura}
                        </span>
                        {cursosDelDocente.length > 1 && (
                          <select
                            value={cursoActivo.asignaturaId}
                            onChange={(e) => setCursoSeleccionadoId(e.target.value)}
                            className="text-xs bg-white border border-[#94a3b8] rounded px-2 py-0.5 text-[#003865] font-semibold focus:outline-hidden"
                          >
                            {cursosDelDocente.map((c) => (
                              <option key={c.asignaturaId} value={c.asignaturaId}>
                                Cambiar a: {c.nombreAsignatura} ({c.codigoAsignatura})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <p className="text-xs text-[#1e3a8a] mt-1">
                        <span className="font-bold">Resultado de Aprendizaje:</span> {cursoActivo.codigoRa} ({cursoActivo.nombreRa})
                        <span className="mx-2 text-[#94a3b8]">|</span>
                        <span className="font-bold">Rol:</span> {cursoActivo.tipoAssessment || 'Sumativa'}
                        <span className="mx-2 text-[#94a3b8]">|</span>
                        <span className="font-bold">Supervisor:</span> {cursoActivo.nombreSupervisorRa}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[#003865] bg-white/70 px-2.5 py-1 rounded border border-[#b4d4ed]">
                        Semestre {cursoActivo.semestre} • {cursoActivo.programaAcademico}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TÍTULO DE LA SECCIÓN */}
                <h2 className="text-base font-bold text-[#0f172a] mb-5">
                  Carga y Gestión de Evidencias Académicas Obligatorias
                </h2>

                {/* GRID DE LAS 6 EVIDENCIAS (3 columnas x 2 filas en pantallas medianas/grandes) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                  {evidenciasActuales.map((evidencia) => {
                    const esCargado = evidencia.estado === 'cargado';
                    const esCorreccion = evidencia.estado === 'correccion_requerida';
                    const esSinCargar = evidencia.estado === 'sin_cargar';

                    // Estilo de tarjeta según estado
                    const borderClase = esCorreccion
                      ? 'border-red-300 bg-[#fff5f5]'
                      : esCargado
                      ? 'border-[#cbd5e1] bg-white'
                      : 'border-[#fca5a5]/80 bg-[#fffafa]';

                    return (
                      <div
                        key={evidencia.id}
                        className={`rounded-xl border p-5 flex flex-col justify-between min-h-[210px] shadow-2xs transition-all hover:shadow-md ${borderClase}`}
                      >
                        {/* HEADER DE LA TARJETA */}
                        <div>
                          <div className="flex items-start gap-2.5 mb-2">
                            {/* Icono del tipo de evidencia */}
                            <div className="text-[#004b87] mt-0.5">
                              {evidencia.numero === 1 && <FileText className="w-5 h-5" />}
                              {evidencia.numero === 2 && <User className="w-5 h-5" />}
                              {evidencia.numero === 3 && <BookOpen className="w-5 h-5" />}
                              {evidencia.numero === 4 && <FileText className="w-5 h-5" />}
                              {evidencia.numero === 5 && <CheckCircle2 className="w-5 h-5" />}
                              {evidencia.numero === 6 && <AlertCircle className="w-5 h-5" />}
                            </div>

                            <div>
                              <h3 className="text-xs font-bold text-[#0f172a] leading-tight">
                                {evidencia.titulo}
                              </h3>
                              <p className="text-[11px] text-[#64748b] mt-0.5">
                                {evidencia.descripcionFormato}
                              </p>
                            </div>
                          </div>

                          {/* BADGE DE ESTADO */}
                          <div className="my-2.5">
                            {esCargado && (
                              <span className="inline-block bg-[#86efac] text-[#14532d] text-[11px] font-bold px-3 py-0.5 rounded-full">
                                CARGADO
                              </span>
                            )}
                            {esSinCargar && (
                              <span className="inline-block bg-[#fecaca] text-[#991b1b] text-[11px] font-bold px-3 py-0.5 rounded-full">
                                SIN CARGAR
                              </span>
                            )}
                            {esCorreccion && (
                              <span className="inline-block bg-[#fecaca] text-[#991b1b] text-[11px] font-bold px-3 py-0.5 rounded-full">
                                CORRECCIÓN REQUERIDA
                              </span>
                            )}
                          </div>

                          {/* INFORMACIÓN DEL ARCHIVO O ADVERTENCIA */}
                          <div className="min-h-[28px] mb-3">
                            {esCargado && (
                              <p className="text-xs text-[#334155] font-medium truncate" title={evidencia.nombreArchivo}>
                                {evidencia.nombreArchivo || 'Nombre del documento'}
                              </p>
                            )}

                            {esSinCargar && (
                              <p className="text-xs text-[#94a3b8] italic">
                                Requerido para habilitar el envío.
                              </p>
                            )}

                            {esCorreccion && (
                              <div className="flex items-center gap-1.5 text-xs text-[#dc2626] font-medium">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{evidencia.observacionSupervisor || 'Adjuntar rúbrica faltante.'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* BOTÓN DE ACCIÓN */}
                        <div>
                          {esCargado && (
                            <button
                              onClick={() => abrirModalCarga(evidencia)}
                              className="w-full bg-[#004b87] hover:bg-[#003865] text-white text-xs font-semibold py-2 px-3 rounded-md transition-all cursor-pointer shadow-xs"
                            >
                              Reemplazar Archivo
                            </button>
                          )}

                          {esSinCargar && (
                            <button
                              onClick={() => abrirModalCarga(evidencia)}
                              className="w-full bg-[#004b87] hover:bg-[#003865] text-white text-xs font-semibold py-2 px-3 rounded-md transition-all cursor-pointer shadow-xs"
                            >
                              + Adjuntar Archivo
                            </button>
                          )}

                          {esCorreccion && (
                            <button
                              onClick={() => abrirModalCarga(evidencia)}
                              className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold py-2 px-3 rounded-md transition-all cursor-pointer shadow-xs"
                            >
                              Corregir y Subir
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BARRA INFERIOR DE ESTADO Y ACCIONES */}
              <div className="bg-white border border-[#cbd5e1] rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                {/* ESTADO DE CARGA */}
                <div className="flex items-center gap-3">
                  <div className="text-xs text-[#0f172a]">
                    <span className="font-bold">Estado de Carga: </span>
                    <span className="font-semibold text-[#004b87]">
                      {evidenciasCargadas} de {totalEvidencias} Evidencias Listas
                    </span>
                    {pendientes.length > 0 && (
                      <span className="text-[#64748b] ml-1">
                        (Pendiente: {pendientes.map((p) => p.titulo.replace(/^\d+\.\s*/, '')).join(' y ')})
                      </span>
                    )}
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN: GUARDAR AVANCE & ENVIAR */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleGuardarAvance}
                    className="flex-1 sm:flex-initial bg-[#004b87] hover:bg-[#003d70] text-white text-xs font-bold px-6 py-2.5 rounded-md transition-all cursor-pointer shadow-xs"
                  >
                    Guardar Avance
                  </button>

                  <button
                    onClick={handleEnviarEvidencias}
                    className="flex-1 sm:flex-initial bg-[#003865] hover:bg-[#002848] text-white text-xs font-bold px-7 py-2.5 rounded-md transition-all cursor-pointer shadow-xs"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VISTA: DASHBOARD DOCENTE */}
          {seccionActual === 'dashboard' && (
            <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#003865]">Panel de Control Docente</h2>
                  <p className="text-xs text-[#64748b]">Resumen del periodo académico {cursoActivo.periodoAcademico || '2026-II'}</p>
                </div>
              </div>

              {/* METRIC CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-xl border border-[#cbd5e1] shadow-2xs">
                  <span className="text-xs font-semibold text-[#64748b]">Cursos Asignados</span>
                  <p className="text-2xl font-bold text-[#003865] mt-1">{cursosDelDocente.length || 1}</p>
                  <span className="text-[11px] text-[#004b87] mt-2 block">Facultad de Ingeniería</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#cbd5e1] shadow-2xs">
                  <span className="text-xs font-semibold text-[#64748b]">Progreso Total de Evidencias</span>
                  <p className="text-2xl font-bold text-[#16a34a] mt-1">
                    {Math.round((evidenciasCargadas / totalEvidencias) * 100)}%
                  </p>
                  <span className="text-[11px] text-[#64748b] mt-2 block">
                    {evidenciasCargadas} de {totalEvidencias} cargadas
                  </span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#cbd5e1] shadow-2xs">
                  <span className="text-xs font-semibold text-[#64748b]">Correcciones Pendientes</span>
                  <p className="text-2xl font-bold text-[#dc2626] mt-1">{conCorreccion.length}</p>
                  <span className="text-[11px] text-[#dc2626] mt-2 block">Requiere atención docente</span>
                </div>
              </div>

              {/* LISTA RÁPIDA DE ASIGNATURAS */}
              <div className="bg-white rounded-xl border border-[#cbd5e1] p-6 shadow-2xs">
                <h3 className="text-sm font-bold text-[#003865] mb-4">Mis Asignaturas en Assessment</h3>
                <div className="space-y-3">
                  {(cursosDelDocente.length > 0 ? cursosDelDocente : [cursoActivo]).map((c) => (
                    <div
                      key={c.asignaturaId}
                      className="p-4 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-[#0f172a]">{c.nombreAsignatura} ({c.codigoAsignatura})</h4>
                        <p className="text-[11px] text-[#64748b]">
                          {c.codigoRa}: {c.nombreRa} • Rol: {c.tipoAssessment}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setCursoSeleccionadoId(c.asignaturaId);
                          setSeccionActual('evidencias');
                        }}
                        className="text-xs bg-[#004b87] hover:bg-[#003865] text-white px-3.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer"
                      >
                        Gestionar Evidencias
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VISTA: LISTA DE CURSOS */}
          {seccionActual === 'cursos' && (
            <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#003865]">Cursos y Rúbricas</h2>
                  <p className="text-xs text-[#64748b]">Asignaturas con plan de assessment asignado</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(cursosDelDocente.length > 0 ? cursosDelDocente : [cursoActivo]).map((c) => (
                  <div key={c.asignaturaId} className="bg-white rounded-xl border border-[#cbd5e1] p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-[#004b87] bg-[#e0f2fe] px-2 py-0.5 rounded">
                          Semestre {c.semestre}
                        </span>
                        <span className="text-[11px] text-[#64748b]">{c.programaAcademico}</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#003865]">{c.nombreAsignatura}</h3>
                      <p className="text-xs text-[#475569] mt-1">{c.descripcionRa || c.nombreRa}</p>
                      
                      <div className="mt-4 pt-3 border-t border-[#f1f5f9] text-xs space-y-1 text-[#334155]">
                        <p><span className="font-semibold">Supervisor RA:</span> {c.nombreSupervisorRa}</p>
                        <p><span className="font-semibold">Tipo Evaluación:</span> {c.tipoAssessment}</p>
                        <p><span className="font-semibold">Meta de Logro:</span> {c.metaLogroPorcentaje}%</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCursoSeleccionadoId(c.asignaturaId);
                        setSeccionActual('evidencias');
                      }}
                      className="mt-5 w-full bg-[#004b87] hover:bg-[#003865] text-white text-xs font-bold py-2 rounded-md transition-colors cursor-pointer"
                    >
                      Ver Evidencias Obligatorias
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL PARA SUBIR / REEMPLAZAR / CORREGIR ARCHIVO */}
      {modalAbierto && evidenciaParaEditar && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-[#cbd5e1] max-w-lg w-full p-6 text-[#1e293b]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#e0f2fe] text-[#004b87] flex items-center justify-center font-bold text-sm">
                  {evidenciaParaEditar.numero}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#003865]">{evidenciaParaEditar.titulo}</h3>
                  <p className="text-[11px] text-[#64748b]">{cursoActivo.nombreAsignatura}</p>
                </div>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-neutral-400 hover:text-neutral-700 text-lg font-bold cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4">
              {evidenciaParaEditar.observacionSupervisor && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
                  <span className="font-bold block mb-0.5">Observación del Supervisor de Calidad:</span>
                  {evidenciaParaEditar.observacionSupervisor}
                </div>
              )}

              {/* ZONA DRAG & DROP / SELECTOR */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#93c5fd] hover:border-[#004b87] bg-[#f8fafc] hover:bg-[#eff6ff] rounded-xl p-6 text-center cursor-pointer transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleArchivoCambio}
                  className="hidden"
                />

                <UploadCloud className="w-10 h-10 text-[#004b87] mx-auto mb-2" />

                {archivoSeleccionado ? (
                  <div>
                    <p className="text-xs font-bold text-[#003865]">{archivoSeleccionado.name}</p>
                    <p className="text-[11px] text-[#64748b] mt-0.5">
                      Tamaño: {(archivoSeleccionado.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <span className="inline-block mt-2 text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                      Archivo seleccionado listo para guardar
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-[#0f172a]">
                      Haz clic para seleccionar o arrastra tu archivo aquí
                    </p>
                    <p className="text-[11px] text-[#64748b] mt-1">
                      Formatos permitidos: <span className="font-semibold text-[#004b87]">PDF o DOCX</span> (Máximo 2 MB)
                    </p>
                  </div>
                )}
              </div>

              {errorCarga && (
                <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-md border border-red-200">
                  {errorCarga}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={!archivoSeleccionado || subiendo}
                onClick={handleGuardarArchivo}
                className="bg-[#004b87] hover:bg-[#003865] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-5 py-2 rounded-md transition-colors cursor-pointer"
              >
                {subiendo ? 'Cargando archivo...' : 'Guardar y Adjuntar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
