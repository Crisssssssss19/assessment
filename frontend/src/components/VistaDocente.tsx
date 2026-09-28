'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Check,
  GraduationCap,
  Plus,
  Trash2,
  Download,
  Save,
  FileSpreadsheet,
  TrendingUp,
  Award,
  Users,
  Search,
  ExternalLink,
  MessageSquare,
  Send,
  Clock,
  ShieldCheck
} from 'lucide-react';
import {
  CursoDetallado,
  cargarArchivoEvidencia,
  obtenerEstudiantesMedicion,
  guardarEstudiantesMedicion,
  cargarEvidenciaEstudiante,
  eliminarEvidenciaEstudiante,
  obtenerUrlDescargaEvidenciaEstudiante,
  obtenerHistorialObservaciones,
  agregarObservacionMedicion,
  EvaluacionEstudianteItem,
  ObservacionMedicionItem,
  ItemEstudiantePayload
} from '@/lib/api';

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
    token?: string;
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
  const [seccionActual, setSeccionActual] = useState<'evidencias' | 'evaluaciones' | 'bitacora' | 'dashboard' | 'cursos'>('evaluaciones');

  const esSupervisor = usuarioActual.rol === 'LiderCalidadRA';

  // Filtrar o seleccionar los cursos asignados al docente o supervisados
  const cursosDelDocente = cursosDisponibles.filter(
    (c) => esSupervisor
      ? (c.correoSupervisorRa?.toLowerCase() === usuarioActual.correo.toLowerCase() ||
         c.nombreSupervisorRa?.toLowerCase().includes(usuarioActual.nombre.toLowerCase()))
      : (c.correoDocente?.toLowerCase() === usuarioActual.correo.toLowerCase() ||
         c.nombreDocente?.toLowerCase().includes(usuarioActual.nombre.toLowerCase()))
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

  // Estado de las 6 evidencias generales por curso
  const [mapaEvidencias, setMapaEvidencias] = useState<{ [cursoId: string]: EvidenciaItem[] }>({
    [cursoActivoDefault.asignaturaId]: [
      { id: 'ev-1', numero: 1, titulo: '1. Sílabus del Curso', descripcionFormato: 'Obligatorio PDF / DOCX (Max 15 MB)', estado: 'sin_cargar' },
      { id: 'ev-2', numero: 2, titulo: '2. Hoja de Vida del Docente', descripcionFormato: 'Obligatorio PDF / DOCX (Max 15 MB)', estado: 'sin_cargar' },
      { id: 'ev-3', numero: 3, titulo: '3. Texto Guía', descripcionFormato: 'Obligatorio PDF / DOCX (Max 15 MB)', estado: 'sin_cargar' },
      { id: 'ev-4', numero: 4, titulo: '4. Muestra Trabajo Clase', descripcionFormato: 'Obligatorio PDF / DOCX (Max 15 MB)', estado: 'sin_cargar' },
      { id: 'ev-5', numero: 5, titulo: '5. Muestra Examen', descripcionFormato: 'Obligatorio PDF / DOCX (Max 15 MB)', estado: 'correccion_requerida', observacionSupervisor: 'Por favor adjuntar la evaluación con la rúbrica oficial institucional y no el borrador.' },
      { id: 'ev-6', numero: 6, titulo: '6. Muestra Retroalimentación', descripcionFormato: 'Obligatorio PDF / DOCX (Max 15 MB)', estado: 'sin_cargar' }
    ]
  });

  // Estado del módulo de Evaluaciones de Estudiantes
  const [estudiantesPorCurso, setEstudiantesPorCurso] = useState<{ [cursoId: string]: EvaluacionEstudianteItem[] }>({
    [cursoActivoDefault.asignaturaId]: [
      { id: 'est-1', medicionId: cursoActivoDefault.asignaturaId, codigoEstudiante: '20221001', nombreEstudiante: 'Alejandro Gómez', calificacion: 92, rangoDesempeno: '90 - 100 (Excelente / Avanzado)', nombreArchivoEvidencia: 'Evaluacion_AlejandroGomez_Calificada.pdf', tamanoArchivoBytes: 1240000 },
      { id: 'est-2', medicionId: cursoActivoDefault.asignaturaId, codigoEstudiante: '20221002', nombreEstudiante: 'Beatriz Morales', calificacion: 85, rangoDesempeno: '70 - 89 (Medio / Competente)', nombreArchivoEvidencia: 'Evaluacion_BeatrizMorales.pdf', tamanoArchivoBytes: 890000 },
      { id: 'est-3', medicionId: cursoActivoDefault.asignaturaId, codigoEstudiante: '20221003', nombreEstudiante: 'Carlos Mario Restrepo', calificacion: 78, rangoDesempeno: '70 - 89 (Medio / Competente)' },
      { id: 'est-4', medicionId: cursoActivoDefault.asignaturaId, codigoEstudiante: '20221004', nombreEstudiante: 'Daniela Castro', calificacion: 64, rangoDesempeno: '60 - 69 (Básico)' },
      { id: 'est-5', medicionId: cursoActivoDefault.asignaturaId, codigoEstudiante: '20221005', nombreEstudiante: 'Esteban Valencia', calificacion: 55, rangoDesempeno: '0 - 59 (Insuficiente)' },
      { id: 'est-6', medicionId: cursoActivoDefault.asignaturaId, codigoEstudiante: '20221006', nombreEstudiante: 'Fernanda Ortiz', calificacion: 95, rangoDesempeno: '90 - 100 (Excelente / Avanzado)', nombreArchivoEvidencia: 'Evaluacion_FernandaOrtiz.pdf', tamanoArchivoBytes: 1540000 },
      { id: 'est-7', medicionId: cursoActivoDefault.asignaturaId, codigoEstudiante: '20221007', nombreEstudiante: 'Gabriel Paternina', calificacion: 72, rangoDesempeno: '70 - 89 (Medio / Competente)' },
      { id: 'est-8', medicionId: cursoActivoDefault.asignaturaId, codigoEstudiante: '20221008', nombreEstudiante: 'Helena Quintero', calificacion: 88, rangoDesempeno: '70 - 89 (Medio / Competente)' }
    ]
  });

  // Estado del historial de observaciones / bitácora
  const [observacionesPorCurso, setObservacionesPorCurso] = useState<{ [cursoId: string]: ObservacionMedicionItem[] }>({
    [cursoActivoDefault.asignaturaId]: [
      {
        id: 'obs-1',
        medicionId: cursoActivoDefault.asignaturaId,
        usuarioId: 'u-sup',
        nombreAutor: 'Ing. Laura Pérez',
        correoAutor: 'calidad.ra@unimagdalena.edu.co',
        rolEmisor: 'LiderCalidadRA',
        contenido: 'Estimado docente, se revisaron las evidencias iniciales. La evidencia "Muestra Examen" no cuenta con la rúbrica oficial anexa. Por favor reemplazar el archivo para continuar con la aprobación.',
        estadoResultante: 3, // Devuelto
        fechaCreacion: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  });

  const [textoNuevaObservacion, setTextoNuevaObservacion] = useState('');
  const [enviandoObservacion, setEnviandoObservacion] = useState(false);

  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
  const [filtroRangoEstudiante, setFiltroRangoEstudiante] = useState('todos');
  const [guardandoEstudiantes, setGuardandoEstudiantes] = useState(false);

  // Formulario para nuevo estudiante
  const [mostrarFormNuevoEstudiante, setMostrarFormNuevoEstudiante] = useState(false);
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaNota, setNuevaNota] = useState<string>('');
  const [nuevasObservaciones, setNuevasObservaciones] = useState('');

  // Modal para evidencia de estudiante
  const [modalEstudianteEvidencia, setModalEstudianteEvidencia] = useState<{
    abierto: boolean;
    estudiante: EvaluacionEstudianteItem | null;
    archivo: File | null;
    subiendo: boolean;
    error: string | null;
  }>({
    abierto: false,
    estudiante: null,
    archivo: null,
    subiendo: false,
    error: null
  });

  // Modal para evidencia general de curso
  const [modalAbierto, setModalAbierto] = useState(false);
  const [evidenciaParaEditar, setEvidenciaParaEditar] = useState<EvidenciaItem | null>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [notificacion, setNotificacion] = useState<{ tipo: 'exito' | 'info' | 'error'; mensaje: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputEstudianteRef = useRef<HTMLInputElement | null>(null);

  // Lista de evidencias del curso actual
  const evidenciasActuales: EvidenciaItem[] = mapaEvidencias[cursoActivo.asignaturaId] || [
    { id: 'ev-1', numero: 1, titulo: '1. Sílabus del Curso', descripcionFormato: 'Obligatorio PDF / DOCX (Max 15 MB)', estado: 'sin_cargar' },
    { id: 'ev-2', numero: 2, titulo: '2. Hoja de Vida del Docente', descripcionFormato: 'Obligatorio PDF / DOCX (Max 15 MB)', estado: 'sin_cargar' },
    { id: 'ev-3', numero: 3, titulo: '3. Texto Guía', descripcionFormato: 'Obligatorio PDF / DOCX (Max 15 MB)', estado: 'sin_cargar' },
    { id: 'ev-4', numero: 4, titulo: '4. Muestra Trabajo Clase', descripcionFormato: 'Obligatorio PDF / DOCX (Max 15 MB)', estado: 'sin_cargar' },
    { id: 'ev-5', numero: 5, titulo: '5. Muestra Examen', descripcionFormato: 'Obligatorio PDF / DOCX (Max 15 MB)', estado: 'sin_cargar' },
    { id: 'ev-6', numero: 6, titulo: '6. Muestra Retroalimentación', descripcionFormato: 'Obligatorio PDF / DOCX (Max 15 MB)', estado: 'sin_cargar' }
  ];

  // Lista de estudiantes del curso actual
  const estudiantesActuales = estudiantesPorCurso[cursoActivo.asignaturaId] || [];
  const observacionesActuales = observacionesPorCurso[cursoActivo.asignaturaId] || [];

  // Cálculos estadísticos en tiempo real sobre los estudiantes
  const totalEstudiantes = estudiantesActuales.length;
  const cant0a59 = estudiantesActuales.filter(e => e.calificacion < 60).length;
  const cant60a69 = estudiantesActuales.filter(e => e.calificacion >= 60 && e.calificacion < 70).length;
  const cant70a89 = estudiantesActuales.filter(e => e.calificacion >= 70 && e.calificacion < 90).length;
  const cant90a100 = estudiantesActuales.filter(e => e.calificacion >= 90).length;

  const totalAprobadosCumple = cant70a89 + cant90a100;
  const porcentajeCumplimiento = totalEstudiantes > 0 ? Number(((totalAprobadosCumple / totalEstudiantes) * 100).toFixed(1)) : 0;
  const estudiantesConEvidencia = estudiantesActuales.filter(e => !!e.nombreArchivoEvidencia).length;
  const porcentajeConEvidencia = totalEstudiantes > 0 ? Number(((estudiantesConEvidencia / totalEstudiantes) * 100).toFixed(1)) : 0;

  // Evidencias generales estadísticas
  const totalEvidencias = evidenciasActuales.length;
  const evidenciasCargadas = evidenciasActuales.filter((e) => e.estado === 'cargado').length;
  const pendientes = evidenciasActuales.filter((e) => e.estado === 'sin_cargar');
  const conCorreccion = evidenciasActuales.filter((e) => e.estado === 'correccion_requerida');
  const todasListas = evidenciasCargadas === totalEvidencias;

  const mostrarNotificacion = (tipo: 'exito' | 'info' | 'error', mensaje: string) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion(null), 4500);
  };

  // Sincronizar datos con Backend
  useEffect(() => {
    async function sincronizarDatos() {
      if (cursoActivo.asignaturaId && cursoActivo.asignaturaId.includes('-')) {
        const ests = await obtenerEstudiantesMedicion(cursoActivo.asignaturaId, usuarioActual.token);
        if (ests && ests.length > 0) {
          setEstudiantesPorCurso(prev => ({ ...prev, [cursoActivo.asignaturaId]: ests }));
        }

        const obs = await obtenerHistorialObservaciones(cursoActivo.asignaturaId, usuarioActual.token);
        if (obs && obs.length > 0) {
          setObservacionesPorCurso(prev => ({ ...prev, [cursoActivo.asignaturaId]: obs }));
        }
      }
    }
    sincronizarDatos();
  }, [cursoActivo.asignaturaId, usuarioActual.token]);

  // Manejo de carga de Evidencia General de Curso
  const abrirModalCarga = (evidencia: EvidenciaItem) => {
    setEvidenciaParaEditar(evidencia);
    setArchivoSeleccionado(null);
    setErrorCarga(null);
    setModalAbierto(true);
  };

  const handleArchivoCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'pdf' && extension !== 'docx' && extension !== 'doc') {
      setErrorCarga('Formato no permitido. Solo se aceptan archivos PDF o DOCX.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorCarga(`El archivo supera el límite de 15 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    setErrorCarga(null);
    setArchivoSeleccionado(file);
  };

  const handleGuardarArchivo = async () => {
    if (!evidenciaParaEditar || !archivoSeleccionado) return;

    setSubiendo(true);
    const medicionId = cursoActivo.asignaturaId || '00000000-0000-0000-0000-000000000000';
    await cargarArchivoEvidencia(medicionId, archivoSeleccionado, usuarioActual.token);

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
    mostrarNotificacion('exito', `Evidencia "${evidenciaParaEditar.titulo}" guardada correctamente.`);
  };

  // Manejo de Estudiantes
  const handleAgregarEstudiante = () => {
    if (!nuevoCodigo.trim() || !nuevoNombre.trim() || nuevaNota === '') {
      mostrarNotificacion('error', 'Por favor complete el código, nombre y la calificación del estudiante.');
      return;
    }

    const nota = parseFloat(nuevaNota);
    if (isNaN(nota) || nota < 0 || nota > 100) {
      mostrarNotificacion('error', 'La calificación debe ser un valor numérico entre 0 y 100.');
      return;
    }

    const rangoDesc = nota < 60 ? '0 - 59 (Insuficiente)' :
                      nota < 70 ? '60 - 69 (Básico)' :
                      nota < 90 ? '70 - 89 (Medio / Competente)' : '90 - 100 (Excelente / Avanzado)';

    const nuevoItem: EvaluacionEstudianteItem = {
      id: `est-${Date.now()}`,
      medicionId: cursoActivo.asignaturaId,
      codigoEstudiante: nuevoCodigo.trim(),
      nombreEstudiante: nuevoNombre.trim(),
      calificacion: nota,
      rangoDesempeno: rangoDesc,
      observaciones: nuevasObservaciones.trim() || undefined
    };

    setEstudiantesPorCurso(prev => ({
      ...prev,
      [cursoActivo.asignaturaId]: [...(prev[cursoActivo.asignaturaId] || []), nuevoItem]
    }));

    setNuevoCodigo('');
    setNuevoNombre('');
    setNuevaNota('');
    setNuevasObservaciones('');
    setMostrarFormNuevoEstudiante(false);
    mostrarNotificacion('exito', `Estudiante ${nuevoItem.nombreEstudiante} agregado a la lista.`);
  };

  const handleEliminarEstudiante = (id: string) => {
    setEstudiantesPorCurso(prev => ({
      ...prev,
      [cursoActivo.asignaturaId]: (prev[cursoActivo.asignaturaId] || []).filter(e => e.id !== id)
    }));
    mostrarNotificacion('info', 'Estudiante removido de la lista.');
  };

  const handleGuardarEstudiantesServidor = async () => {
    setGuardandoEstudiantes(true);
    const listaPayload: ItemEstudiantePayload[] = estudiantesActuales.map(e => ({
      codigoEstudiante: e.codigoEstudiante,
      nombreEstudiante: e.nombreEstudiante,
      calificacion: e.calificacion,
      observaciones: e.observaciones
    }));

    const resultado = await guardarEstudiantesMedicion(cursoActivo.asignaturaId, listaPayload, usuarioActual.token);
    setGuardandoEstudiantes(false);

    if (resultado.exitoso) {
      mostrarNotificacion('exito', `Se han sincronizado ${estudiantesActuales.length} estudiantes y se recalcularon los rangos en el backend.`);
    } else {
      mostrarNotificacion('info', 'Calificaciones registradas en la sesión local (Backend offline o simulado).');
    }
  };

  // Manejo de Evidencias individuales por Estudiante
  const abrirModalEvidenciaEstudiante = (estudiante: EvaluacionEstudianteItem) => {
    setModalEstudianteEvidencia({
      abierto: true,
      estudiante,
      archivo: null,
      subiendo: false,
      error: null
    });
  };

  const handleArchivoEstudianteCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'pdf' && extension !== 'docx' && extension !== 'doc') {
      setModalEstudianteEvidencia(prev => ({ ...prev, error: 'Solo se permiten archivos PDF o Word (.docx).' }));
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setModalEstudianteEvidencia(prev => ({ ...prev, error: 'El archivo excede los 15 MB permitidos.' }));
      return;
    }

    setModalEstudianteEvidencia(prev => ({ ...prev, archivo: file, error: null }));
  };

  const handleSubirEvidenciaEstudiante = async () => {
    if (!modalEstudianteEvidencia.estudiante || !modalEstudianteEvidencia.archivo) return;

    setModalEstudianteEvidencia(prev => ({ ...prev, subiendo: true }));
    const est = modalEstudianteEvidencia.estudiante;
    const file = modalEstudianteEvidencia.archivo;

    if (est.id && est.id.includes('-') && !est.id.startsWith('est-')) {
      await cargarEvidenciaEstudiante(est.id, file, usuarioActual.token);
    }

    setEstudiantesPorCurso(prev => {
      const lista = prev[cursoActivo.asignaturaId] || [];
      const actualizada = lista.map(item => {
        if (item.id === est.id) {
          return {
            ...item,
            nombreArchivoEvidencia: file.name,
            tipoContenidoEvidencia: file.type,
            tamanoArchivoBytes: file.size,
            uriBlobEvidencia: `https://storage.unimagdalena.edu.co/blobs/${file.name}`
          };
        }
        return item;
      });
      return { ...prev, [cursoActivo.asignaturaId]: actualizada };
    });

    setModalEstudianteEvidencia({ abierto: false, estudiante: null, archivo: null, subiendo: false, error: null });
    mostrarNotificacion('exito', `Evaluación calificada de ${est.nombreEstudiante} subida correctamente.`);
  };

  const handleEliminarEvidenciaEstudiante = async (estudiante: EvaluacionEstudianteItem) => {
    if (estudiante.id && estudiante.id.includes('-') && !estudiante.id.startsWith('est-')) {
      await eliminarEvidenciaEstudiante(estudiante.id, usuarioActual.token);
    }

    setEstudiantesPorCurso(prev => {
      const lista = prev[cursoActivo.asignaturaId] || [];
      const actualizada = lista.map(item => {
        if (item.id === estudiante.id) {
          return {
            ...item,
            nombreArchivoEvidencia: null,
            uriBlobEvidencia: null,
            tipoContenidoEvidencia: null,
            tamanoArchivoBytes: null
          };
        }
        return item;
      });
      return { ...prev, [cursoActivo.asignaturaId]: actualizada };
    });

    mostrarNotificacion('info', `Evidencia de ${estudiante.nombreEstudiante} eliminada.`);
  };

  // Manejo de Bitácora y Observaciones
  const handleEnviarRespuestaBitacora = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoNuevaObservacion.trim()) return;

    setEnviandoObservacion(true);
    const medicionId = cursoActivo.asignaturaId || '00000000-0000-0000-0000-000000000000';

    if (medicionId.includes('-') && !medicionId.startsWith('a')) {
      await agregarObservacionMedicion(medicionId, textoNuevaObservacion.trim(), 1, usuarioActual.token);
    }

    const nuevaEntrada: ObservacionMedicionItem = {
      id: `obs-${Date.now()}`,
      medicionId: cursoActivo.asignaturaId,
      usuarioId: usuarioActual.id,
      nombreAutor: usuarioActual.nombre,
      correoAutor: usuarioActual.correo,
      rolEmisor: 'Docente',
      contenido: textoNuevaObservacion.trim(),
      estadoResultante: 1, // EnRevision
      fechaCreacion: new Date().toISOString()
    };

    setObservacionesPorCurso(prev => ({
      ...prev,
      [cursoActivo.asignaturaId]: [...(prev[cursoActivo.asignaturaId] || []), nuevaEntrada]
    }));

    setTextoNuevaObservacion('');
    setEnviandoObservacion(false);
    mostrarNotificacion('exito', 'Respuesta enviada al Supervisor de Calidad en la bitácora.');
  };

  // Filtrado de estudiantes en la tabla
  const estudiantesFiltrados = estudiantesActuales.filter(e => {
    const coincideBusqueda = e.nombreEstudiante.toLowerCase().includes(busquedaEstudiante.toLowerCase()) ||
                             e.codigoEstudiante.includes(busquedaEstudiante);
    if (!coincideBusqueda) return false;

    if (filtroRangoEstudiante === '0-59') return e.calificacion < 60;
    if (filtroRangoEstudiante === '60-69') return e.calificacion >= 60 && e.calificacion < 70;
    if (filtroRangoEstudiante === '70-89') return e.calificacion >= 70 && e.calificacion < 90;
    if (filtroRangoEstudiante === '90-100') return e.calificacion >= 90;
    if (filtroRangoEstudiante === 'con-evidencia') return !!e.nombreArchivoEvidencia;
    if (filtroRangoEstudiante === 'sin-evidencia') return !e.nombreArchivoEvidencia;

    return true;
  });

  return (
    <div className="h-screen max-h-screen bg-[#f1f5f9] text-[#1e293b] font-sans flex flex-col overflow-hidden">
      {/* HEADER SUPERIOR */}
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
              Universidad del Magdalena
            </p>
          </div>
        </div>

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
                GESTIÓN DOCENTE
              </span>
            </div>

            <nav className="space-y-1.5">
              {/* Evaluaciones y Evidencias de Estudiantes */}
              <button
                onClick={() => setSeccionActual('evaluaciones')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                  seccionActual === 'evaluaciones'
                    ? 'bg-[#00325d] text-white shadow-inner border-l-4 border-[#38bdf8]'
                    : 'text-[#e0f2fe] hover:bg-[#003d70] hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-[#38bdf8] shrink-0" />
                <span>Evaluación de Estudiantes</span>
              </button>

              {/* Evidencias Generales del Curso */}
              <button
                onClick={() => setSeccionActual('evidencias')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                  seccionActual === 'evidencias'
                    ? 'bg-[#00325d] text-white shadow-inner border-l-4 border-[#38bdf8]'
                    : 'text-[#e0f2fe] hover:bg-[#003d70] hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 text-[#93c5fd] shrink-0" />
                <span>Evidencias del Curso</span>
              </button>

              {/* Bitácora y Observaciones del Supervisor */}
              <button
                onClick={() => setSeccionActual('bitacora')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                  seccionActual === 'bitacora'
                    ? 'bg-[#00325d] text-white shadow-inner border-l-4 border-[#38bdf8]'
                    : 'text-[#e0f2fe] hover:bg-[#003d70] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-[#fbbf24] shrink-0" />
                  <span>Bitácora y Observaciones</span>
                </div>
                {observacionesActuales.length > 0 && (
                  <span className="bg-[#fbbf24] text-[#78350f] font-black text-[10px] px-1.5 py-0.2 rounded-full">
                    {observacionesActuales.length}
                  </span>
                )}
              </button>

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
                <span>Dashboard de Métricas</span>
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
                <span>Mis Cursos Asignados</span>
              </button>
            </nav>
          </div>

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

          {/* BANNER / SELECTOR DE ASIGNATURA COMPARTIDO */}
          <div className="p-6 md:p-8 pb-0 max-w-7xl w-full mx-auto">
            <div className="bg-[#dceaf6] border border-[#b4d4ed] rounded-xl p-4 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-extrabold text-[#003865]">
                      Asignatura Activa: {cursoActivo.nombreAsignatura} ({cursoActivo.codigoAsignatura})
                    </span>
                    <span className="text-[11px] font-bold text-[#0284c7] bg-white px-2 py-0.5 rounded border border-[#b4d4ed]">
                      Semestre {cursoActivo.semestre}
                    </span>
                  </div>

                  <p className="text-xs text-[#1e3a8a] mt-1">
                    <span className="font-bold">Resultado de Aprendizaje:</span> {cursoActivo.codigoRa} ({cursoActivo.nombreRa})
                    <span className="mx-2 text-[#94a3b8]">|</span>
                    <span className="font-bold">Supervisor RA:</span> {cursoActivo.nombreSupervisorRa}
                    <span className="mx-2 text-[#94a3b8]">|</span>
                    <span className="font-bold">Meta de Logro:</span> {cursoActivo.metaLogroPorcentaje || 75}%
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#003865] bg-white/80 px-3 py-1.5 rounded-lg border border-[#b4d4ed] shadow-2xs">
                    {cursoActivo.programaAcademico}
                  </span>
                </div>
              </div>

              {/* SELECTOR RÁPIDO DE CURSO SI EL DOCENTE TIENE MÁS DE UNA ASIGNATURA */}
              {cursosDelDocente.length > 1 && (
                <div className="mt-3 pt-3 border-t border-[#b4d4ed]/80 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#003865] shrink-0">Selecciona el curso a evaluar:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {cursosDelDocente.map((c) => {
                      const esActivo = c.asignaturaId === cursoActivo.asignaturaId;
                      return (
                        <button
                          key={c.asignaturaId}
                          onClick={() => setCursoSeleccionadoId(c.asignaturaId)}
                          className={`text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            esActivo
                              ? 'bg-[#003865] text-white shadow-2xs'
                              : 'bg-white hover:bg-[#e0f2fe] text-[#003865] border border-[#b4d4ed]'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{c.nombreAsignatura} ({c.codigoAsignatura})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* VISTA 1: EVALUACIÓN DE ESTUDIANTES Y EVIDENCIAS INDIVIDUALES */}
          {seccionActual === 'evaluaciones' && (
            <div className="p-6 md:p-8 flex flex-col flex-1 max-w-7xl w-full mx-auto space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="bg-white rounded-xl border border-[#cbd5e1] p-3.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-[#64748b] uppercase block">Total Estudiantes</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black text-[#003865]">{totalEstudiantes}</span>
                    <Users className="w-5 h-5 text-[#94a3b8]" />
                  </div>
                  <span className="text-[10px] text-[#0284c7] font-medium mt-1 block">Curso evaluado</span>
                </div>

                <div className="bg-rose-50/70 rounded-xl border border-rose-200 p-3.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-rose-800 uppercase block">0 - 59 Insuficiente</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black text-rose-700">{cant0a59}</span>
                    <span className="text-xs font-bold text-rose-600">
                      {totalEstudiantes > 0 ? ((cant0a59 / totalEstudiantes) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <span className="text-[10px] text-rose-600 font-medium mt-1 block">No cumple logro</span>
                </div>

                <div className="bg-amber-50/70 rounded-xl border border-amber-200 p-3.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-amber-800 uppercase block">60 - 69 Básico</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black text-amber-700">{cant60a69}</span>
                    <span className="text-xs font-bold text-amber-600">
                      {totalEstudiantes > 0 ? ((cant60a69 / totalEstudiantes) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-600 font-medium mt-1 block">Requiere refuerzo</span>
                </div>

                <div className="bg-sky-50/70 rounded-xl border border-sky-200 p-3.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-sky-800 uppercase block">70 - 89 Competente</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black text-sky-700">{cant70a89}</span>
                    <span className="text-xs font-bold text-sky-600">
                      {totalEstudiantes > 0 ? ((cant70a89 / totalEstudiantes) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <span className="text-[10px] text-sky-600 font-medium mt-1 block">Cumple el RA</span>
                </div>

                <div className="bg-emerald-50/70 rounded-xl border border-emerald-200 p-3.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block">90 - 100 Avanzado</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black text-emerald-700">{cant90a100}</span>
                    <span className="text-xs font-bold text-emerald-600">
                      {totalEstudiantes > 0 ? ((cant90a100 / totalEstudiantes) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium mt-1 block">Nivel superior</span>
                </div>

                <div className="bg-[#003865] text-white rounded-xl border border-[#002747] p-3.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-[#93c5fd] uppercase block">% Logro Obtenido</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black text-white">{porcentajeCumplimiento}%</span>
                    <Award className="w-5 h-5 text-[#38bdf8]" />
                  </div>
                  <span className="text-[10px] text-[#bae6fd] font-medium mt-1 flex items-center gap-1">
                    Meta: {cursoActivo.metaLogroPorcentaje || 75}% {porcentajeCumplimiento >= (cursoActivo.metaLogroPorcentaje || 75) ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-300 font-bold"><Check className="w-3 h-3" /> Superada</span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-amber-300 font-bold"><X className="w-3 h-3" /> Pendiente</span>
                    )}
                  </span>
                </div>
              </div>

              {/* SECCIÓN PRINCIPAL: TABLA DE EVALUACIONES */}
              <div className="bg-white rounded-xl border border-[#cbd5e1] p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#e2e8f0]">
                  <div>
                    <h2 className="text-base font-bold text-[#003865] flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-[#004b87]" />
                      Evaluación de Estudiantes — {cursoActivo.nombreAsignatura} ({cursoActivo.codigoAsignatura})
                    </h2>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      Registra las calificaciones y evidencias de los estudiantes matriculados específicamente en este curso ({cursoActivo.codigoRa} • Semestre {cursoActivo.semestre}).
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setMostrarFormNuevoEstudiante(true)}
                      className="bg-[#004b87] hover:bg-[#003865] text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Estudiante
                    </button>

                    <button
                      disabled={guardandoEstudiantes}
                      onClick={handleGuardarEstudiantesServidor}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Save className="w-4 h-4" />
                      {guardandoEstudiantes ? 'Guardando...' : 'Guardar en Backend'}
                    </button>
                  </div>
                </div>

                {mostrarFormNuevoEstudiante && (
                  <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-4 animate-fade-in space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0369a1] uppercase tracking-wide">
                        + Nuevo Estudiante para Evaluación
                      </span>
                      <button
                        onClick={() => setMostrarFormNuevoEstudiante(false)}
                        className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-[#003865] block mb-1">Código Estudiante *</label>
                        <input
                          type="text"
                          placeholder="Ej: 20221009"
                          value={nuevoCodigo}
                          onChange={(e) => setNuevoCodigo(e.target.value)}
                          className="w-full text-xs bg-white border border-[#94a3b8] rounded-lg px-3 py-2 text-[#0f172a] focus:outline-hidden focus:border-[#004b87]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#003865] block mb-1">Nombre Completo *</label>
                        <input
                          type="text"
                          placeholder="Ej: Camilo Andrés Rojas"
                          value={nuevoNombre}
                          onChange={(e) => setNuevoNombre(e.target.value)}
                          className="w-full text-xs bg-white border border-[#94a3b8] rounded-lg px-3 py-2 text-[#0f172a] focus:outline-hidden focus:border-[#004b87]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#003865] block mb-1">Calificación (0 - 100) *</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="Ej: 85"
                          value={nuevaNota}
                          onChange={(e) => setNuevaNota(e.target.value)}
                          className="w-full text-xs bg-white border border-[#94a3b8] rounded-lg px-3 py-2 text-[#0f172a] focus:outline-hidden focus:border-[#004b87]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setMostrarFormNuevoEstudiante(false)}
                        className="px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAgregarEstudiante}
                        className="bg-[#004b87] hover:bg-[#003865] text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Añadir a la Lista
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar por código o nombre..."
                      value={busquedaEstudiante}
                      onChange={(e) => setBusquedaEstudiante(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg focus:outline-hidden focus:border-[#004b87]"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs font-semibold text-[#64748b]">Filtrar:</span>
                    <select
                      value={filtroRangoEstudiante}
                      onChange={(e) => setFiltroRangoEstudiante(e.target.value)}
                      className="text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2.5 py-1.5 text-[#003865] font-semibold focus:outline-hidden cursor-pointer"
                    >
                      <option value="todos">Todos los rangos ({totalEstudiantes})</option>
                      <option value="90-100">90 - 100 Avanzado ({cant90a100})</option>
                      <option value="70-89">70 - 89 Competente ({cant70a89})</option>
                      <option value="60-69">60 - 69 Básico ({cant60a69})</option>
                      <option value="0-59">0 - 59 Insuficiente ({cant0a59})</option>
                      <option value="con-evidencia">Con Evidencia Adjunta ({estudiantesConEvidencia})</option>
                      <option value="sin-evidencia">Sin Evidencia ({totalEstudiantes - estudiantesConEvidencia})</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-[#e2e8f0] rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#003865] text-white font-bold border-b border-[#002b4e]">
                        <th className="py-3 px-3.5 w-12 text-center">#</th>
                        <th className="py-3 px-3.5">Código</th>
                        <th className="py-3 px-3.5">Nombre del Estudiante</th>
                        <th className="py-3 px-3.5 text-center">Nota (0-100)</th>
                        <th className="py-3 px-3.5">Nivel de Desempeño</th>
                        <th className="py-3 px-3.5">Evidencia de Evaluación (PDF/DOCX)</th>
                        <th className="py-3 px-3.5 text-center w-24">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {estudiantesFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-neutral-400 font-medium">
                            No se encontraron estudiantes con los filtros seleccionados.
                          </td>
                        </tr>
                      ) : (
                        estudiantesFiltrados.map((est, idx) => {
                          const tieneEvidencia = !!est.nombreArchivoEvidencia;
                          const esAvanzado = est.calificacion >= 90;
                          const esMedio = est.calificacion >= 70 && est.calificacion < 90;
                          const esBasico = est.calificacion >= 60 && est.calificacion < 70;

                          return (
                            <tr key={est.id} className="hover:bg-[#f8fafc] transition-colors">
                              <td className="py-3 px-3.5 text-center text-[#64748b] font-medium">{idx + 1}</td>
                              <td className="py-3 px-3.5 font-bold text-[#003865]">{est.codigoEstudiante}</td>
                              <td className="py-3 px-3.5 font-semibold text-[#0f172a]">{est.nombreEstudiante}</td>
                              <td className="py-3 px-3.5 text-center font-extrabold text-sm">
                                <span className={`px-2.5 py-0.5 rounded-md ${
                                  esAvanzado ? 'bg-emerald-100 text-emerald-800' :
                                  esMedio ? 'bg-sky-100 text-sky-800' :
                                  esBasico ? 'bg-amber-100 text-amber-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {est.calificacion}
                                </span>
                              </td>
                              <td className="py-3 px-3.5">
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                  esAvanzado ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  esMedio ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                                  esBasico ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {est.rangoDesempeno || (esAvanzado ? '90-100 (Excelente)' : esMedio ? '70-89 (Competente)' : esBasico ? '60-69 (Básico)' : '0-59 (Insuficiente)')}
                                </span>
                              </td>
                              <td className="py-3 px-3.5">
                                {tieneEvidencia ? (
                                  <div className="flex items-center gap-2">
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 flex items-center gap-2 max-w-xs truncate">
                                      <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span className="text-[11px] font-semibold text-emerald-900 truncate" title={est.nombreArchivoEvidencia!}>
                                        {est.nombreArchivoEvidencia}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => abrirModalEvidenciaEstudiante(est)}
                                      className="text-neutral-500 hover:text-[#004b87] text-[11px] font-semibold underline cursor-pointer"
                                      title="Reemplazar archivo"
                                    >
                                      Cambiar
                                    </button>
                                    <button
                                      onClick={() => handleEliminarEvidenciaEstudiante(est)}
                                      className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer"
                                      title="Eliminar evidencia"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => abrirModalEvidenciaEstudiante(est)}
                                    className="bg-[#eff6ff] hover:bg-[#dbeafe] text-[#004b87] border border-[#bfdbfe] text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    Adjuntar Examen / Taller
                                  </button>
                                )}
                              </td>
                              <td className="py-3 px-3.5 text-center">
                                <button
                                  onClick={() => handleEliminarEstudiante(est.id)}
                                  className="text-neutral-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                                  title="Remover estudiante"
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

                <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748b] pt-2 gap-2">
                  <span>Mostrando <b>{estudiantesFiltrados.length}</b> de <b>{totalEstudiantes}</b> estudiantes registrados</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-semibold text-[#003865]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Evidencias cargadas: {estudiantesConEvidencia} / {totalEstudiantes} ({porcentajeConEvidencia}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 2: BITÁCORA Y HISTORIAL DE OBSERVACIONES DEL SUPERVISOR */}
          {seccionActual === 'bitacora' && (
            <div className="p-6 md:p-8 flex flex-col flex-1 max-w-7xl w-full mx-auto space-y-6">
              <div className="bg-white rounded-xl border border-[#cbd5e1] p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                  <div>
                    <h2 className="text-base font-bold text-[#003865] flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-[#004b87]" />
                      Bitácora de Observaciones y Retroalimentación
                    </h2>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      Historial completo de comentarios, revisiones y respuestas entre el Supervisor de Calidad y el Docente.
                    </p>
                  </div>
                  <span className="bg-[#e8f1f8] text-[#003865] border border-[#bcd6ea] text-xs font-bold px-3 py-1 rounded-full">
                    {observacionesActuales.length} mensaje(s) en el hilo
                  </span>
                </div>

                {/* HILO DE COMENTARIOS / TIMELINE */}
                <div className="space-y-4">
                  {observacionesActuales.length === 0 ? (
                    <div className="text-center py-12 text-neutral-400">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
                      <p className="text-xs font-semibold">No hay observaciones registradas aún para este curso.</p>
                      <p className="text-[11px]">Cuando el Supervisor revise las evidencias o notas, los comentarios quedarán archivados aquí.</p>
                    </div>
                  ) : (
                    observacionesActuales.map((obs) => {
                      const esSupervisor = obs.rolEmisor === 'LiderCalidadRA' || obs.rolEmisor.toLowerCase().includes('lider');
                      const fechaFormateada = new Date(obs.fechaCreacion).toLocaleString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      });

                      return (
                        <div
                          key={obs.id}
                          className={`p-4 rounded-xl border transition-all ${
                            esSupervisor
                              ? 'bg-[#fff8f8] border-red-200'
                              : 'bg-[#f0f9ff] border-sky-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                esSupervisor ? 'bg-red-100 text-red-800' : 'bg-sky-100 text-[#003865]'
                              }`}>
                                {esSupervisor ? 'RA' : 'DOC'}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-[#0f172a] block">
                                  {obs.nombreAutor}
                                </span>
                                <span className="text-[10px] text-[#64748b]">
                                  {esSupervisor ? 'Supervisor de Calidad (Líder RA)' : 'Docente a Cargo'} • {obs.correoAutor}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {obs.estadoResultante === 3 && (
                                <span className="bg-red-100 text-red-800 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                                  <span>Corrección Requerida</span>
                                </span>
                              )}
                              {obs.estadoResultante === 2 && (
                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>Aprobado</span>
                                </span>
                              )}
                              {obs.estadoResultante === 1 && (
                                <span className="bg-sky-100 text-sky-800 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-sky-600 shrink-0" />
                                  <span>En Revisión / Respuesta</span>
                                </span>
                              )}
                              <span className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {fechaFormateada}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-[#334155] leading-relaxed pl-10 whitespace-pre-wrap">
                            {obs.contenido}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* FORMULARIO PARA RESPONDER EN LA BITÁCORA */}
                <form onSubmit={handleEnviarRespuestaBitacora} className="pt-4 border-t border-[#e2e8f0] space-y-3">
                  <label className="text-xs font-bold text-[#003865] block">
                    Responder o Notificar al Supervisor de Calidad:
                  </label>
                  <textarea
                    rows={3}
                    value={textoNuevaObservacion}
                    onChange={(e) => setTextoNuevaObservacion(e.target.value)}
                    placeholder="Escribe tu aclaración o respuesta sobre las correcciones realizadas..."
                    className="w-full text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-3 text-[#0f172a] focus:outline-hidden focus:border-[#004b87] focus:bg-white resize-y"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-[#64748b]">
                      Al enviar una respuesta, el supervisor recibirá notificación y el informe pasará a estado <b>En Revisión</b>.
                    </p>
                    <button
                      type="submit"
                      disabled={!textoNuevaObservacion.trim() || enviandoObservacion}
                      className="bg-[#004b87] hover:bg-[#003865] disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {enviandoObservacion ? 'Enviando...' : 'Enviar Respuesta'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* VISTA 3: EVIDENCIAS GENERALES DEL CURSO */}
          {seccionActual === 'evidencias' && (
            <div className="p-6 md:p-8 flex flex-col flex-1 max-w-7xl w-full mx-auto justify-between">
              <div>
                <h2 className="text-base font-bold text-[#0f172a] mb-5">
                  Carga y Gestión de Evidencias Académicas del Curso
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                  {evidenciasActuales.map((evidencia) => {
                    const esCargado = evidencia.estado === 'cargado';
                    const esCorreccion = evidencia.estado === 'correccion_requerida';
                    const esSinCargar = evidencia.estado === 'sin_cargar';

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
                        <div>
                          <div className="flex items-start gap-2.5 mb-2">
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

                          {esCargado && (
                            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-md p-2 text-[11px] text-[#334155] space-y-0.5 mb-2">
                              <p className="font-semibold truncate flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-[#004b87] shrink-0" />
                                <span>{evidencia.nombreArchivo}</span>
                              </p>
                              <p className="text-[#64748b]">Tamaño: {evidencia.tamanioMb || 1.2} MB • {evidencia.fechaCarga || '2026-03-28'}</p>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between">
                          <button
                            onClick={() => abrirModalCarga(evidencia)}
                            className="bg-[#004b87] hover:bg-[#003865] text-white text-xs font-bold px-4 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            {esCargado ? 'Reemplazar' : 'Subir Archivo'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VISTA 4: DASHBOARD */}
          {seccionActual === 'dashboard' && (
            <div className="p-6 md:p-8 flex flex-col flex-1 max-w-7xl w-full mx-auto space-y-6">
              <h2 className="text-base font-bold text-[#003865]">
                Resumen General de Rendimiento y Assessment
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-[#cbd5e1] rounded-xl p-6 shadow-xs">
                  <h3 className="text-sm font-bold text-[#003865] mb-4">Cumplimiento del Resultado de Aprendizaje</h3>
                  <div className="flex items-center justify-center p-6">
                    <div className="relative w-36 h-36 rounded-full border-8 border-[#003865] flex items-center justify-center text-center">
                      <div>
                        <span className="text-3xl font-black text-[#003865]">{porcentajeCumplimiento}%</span>
                        <span className="text-[11px] font-bold text-[#64748b] block">Logro</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-center text-[#64748b]">
                    Meta institucional requerida: <b>{cursoActivo.metaLogroPorcentaje || 75}%</b>
                  </p>
                </div>

                <div className="bg-white border border-[#cbd5e1] rounded-xl p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-[#003865]">Estado de Evidencias Digitales</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-[#003865] mb-1">
                        <span>Evidencias de Estudiantes Subidas</span>
                        <span>{estudiantesConEvidencia} / {totalEstudiantes}</span>
                      </div>
                      <div className="w-full bg-[#e2e8f0] h-3 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${porcentajeConEvidencia}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-[#003865] mb-1">
                        <span>Evidencias Generales de Asignatura</span>
                        <span>{evidenciasCargadas} / {totalEvidencias}</span>
                      </div>
                      <div className="w-full bg-[#e2e8f0] h-3 rounded-full overflow-hidden">
                        <div className="bg-[#004b87] h-full rounded-full" style={{ width: `${(evidenciasCargadas / totalEvidencias) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 5: MIS CURSOS ASIGNADOS */}
          {seccionActual === 'cursos' && (
            <div className="p-6 md:p-8 flex flex-col flex-1 max-w-7xl w-full mx-auto space-y-6">
              <h2 className="text-base font-bold text-[#003865]">
                Mis Asignaturas Asignadas en el Plan de Assessment
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(cursosDelDocente.length > 0 ? cursosDelDocente : [cursoActivoDefault]).map((c) => (
                  <div
                    key={c.asignaturaId}
                    className="bg-white border border-[#cbd5e1] rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-[#0284c7] uppercase">Semestre {c.semestre}</span>
                      <h3 className="text-sm font-bold text-[#003865] mt-1">{c.nombreAsignatura}</h3>
                      <p className="text-xs text-[#64748b] mt-0.5">{c.codigoAsignatura} • {c.programaAcademico}</p>
                      <div className="mt-3 bg-[#f8fafc] p-2.5 rounded-lg border border-[#e2e8f0] text-xs space-y-1">
                        <p><span className="font-bold">RA:</span> {c.codigoRa} - {c.nombreRa}</p>
                        <p><span className="font-bold">Rol:</span> {c.tipoAssessment || 'Sumativa'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCursoSeleccionadoId(c.asignaturaId);
                        setSeccionActual('evaluaciones');
                      }}
                      className="mt-4 w-full bg-[#004b87] hover:bg-[#003865] text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Evaluar Estudiantes del Curso
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: SUBIR EVIDENCIA INDIVIDUAL DE ESTUDIANTE */}
      {modalEstudianteEvidencia.abierto && modalEstudianteEvidencia.estudiante && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-[#cbd5e1] max-w-lg w-full p-6 text-[#1e293b]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-[#e0f2fe] text-[#004b87] flex items-center justify-center font-bold text-sm">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#003865]">
                    Evaluación de {modalEstudianteEvidencia.estudiante.nombreEstudiante}
                  </h3>
                  <p className="text-[11px] text-[#64748b]">
                    Código: {modalEstudianteEvidencia.estudiante.codigoEstudiante} • Nota: {modalEstudianteEvidencia.estudiante.calificacion}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalEstudianteEvidencia({ abierto: false, estudiante: null, archivo: null, subiendo: false, error: null })}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div
                onClick={() => fileInputEstudianteRef.current?.click()}
                className="border-2 border-dashed border-[#93c5fd] hover:border-[#004b87] bg-[#f8fafc] hover:bg-[#eff6ff] rounded-xl p-6 text-center cursor-pointer transition-all"
              >
                <input
                  ref={fileInputEstudianteRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleArchivoEstudianteCambio}
                  className="hidden"
                />

                <UploadCloud className="w-10 h-10 text-[#004b87] mx-auto mb-2" />

                {modalEstudianteEvidencia.archivo ? (
                  <div>
                    <p className="text-xs font-bold text-[#003865]">{modalEstudianteEvidencia.archivo.name}</p>
                    <p className="text-[11px] text-[#64748b] mt-0.5">
                      Tamaño: {(modalEstudianteEvidencia.archivo.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <span className="inline-block mt-2 text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                      Archivo seleccionado para este estudiante
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-[#0f172a]">
                      Haz clic para seleccionar el examen o evidencia calificada
                    </p>
                    <p className="text-[11px] text-[#64748b] mt-1">
                      Formatos: <span className="font-semibold text-[#004b87]">PDF o Word DOCX</span> (Máximo 15 MB)
                    </p>
                  </div>
                )}
              </div>

              {modalEstudianteEvidencia.error && (
                <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-md border border-red-200">
                  {modalEstudianteEvidencia.error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setModalEstudianteEvidencia({ abierto: false, estudiante: null, archivo: null, subiendo: false, error: null })}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={!modalEstudianteEvidencia.archivo || modalEstudianteEvidencia.subiendo}
                onClick={handleSubirEvidenciaEstudiante}
                className="bg-[#004b87] hover:bg-[#003865] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                {modalEstudianteEvidencia.subiendo ? 'Subiendo a Blob Storage...' : 'Guardar Evidencia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SUBIR EVIDENCIA GENERAL DE CURSO */}
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
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4">
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
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-[#0f172a]">
                      Haz clic para seleccionar o arrastra tu archivo aquí
                    </p>
                    <p className="text-[11px] text-[#64748b] mt-1">
                      Formatos: <span className="font-semibold text-[#004b87]">PDF o DOCX</span> (Máx 15 MB)
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
                className="bg-[#004b87] hover:bg-[#003865] disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-lg transition-colors cursor-pointer"
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
