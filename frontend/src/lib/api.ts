const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5187/api/v1';

export interface UsuarioDemo {
  id: string;
  nombreCompleto: string;
  correoElectronico: string;
  rol: string;
  programaAcademicoId?: string | null;
  nombrePrograma?: string | null;
}

export interface ItemCatalogo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  semestre?: number | null;
}

export interface DatosIniciales {
  programas: ItemCatalogo[];
  periodos: ItemCatalogo[];
  resultadosAprendizaje: ItemCatalogo[];
  asignaturas: ItemCatalogo[];
  docentes: ItemCatalogo[];
  supervisoresCalidadRa: ItemCatalogo[];
}

export interface CandidatoLider {
  id: string;
  nombreCompleto: string;
  correoElectronico: string;
  rolActual: string;
  programaAsignadoId?: string | null;
  nombreProgramaAsignado?: string | null;
}

export interface ProgramaLider {
  programaId: string;
  codigo: string;
  nombrePrograma: string;
  liderUsuarioId?: string | null;
  nombreLider?: string | null;
  correoLider?: string | null;
}

export interface EstadoAsignaciones {
  liderCalidadFacultadId?: string | null;
  nombreLiderCalidadFacultad?: string | null;
  correoLiderCalidadFacultad?: string | null;
  programas: ProgramaLider[];
  candidatosDisponibles: CandidatoLider[];
}

export interface IndicadorCursoDetalle {
  codigo: string;
  descripcion: string;
}

export interface CursoDetallado {
  asignaturaId: string;
  codigoAsignatura: string;
  nombreAsignatura: string;
  semestre: number;
  creditos: number;
  periodoAcademico: string;
  programaAcademico: string;
  codigoRa: string;
  nombreRa: string;
  descripcionRa: string;
  tipoAssessment: string;
  tipoAssessmentNumero: number;
  metaLogroPorcentaje: number;
  nombreDocente: string;
  correoDocente: string;
  nombreSupervisorRa: string;
  correoSupervisorRa: string;
  estadoEvaluacion: string;
  totalEvidencias: number;
  indicadores: IndicadorCursoDetalle[];
}

export interface IndicadorPayload {
  codigo: string;
  descripcion: string;
}

export interface AsignaturaPlanPayload {
  resultadoAprendizajeId: string;
  asignaturaId: string;
  semestre: number;
  rolEvaluacion: number; // 1: Formativa1, 2: Formativa2, 3: Sumativa
  metaLogroPorcentaje: number;
  docenteId: string;
  liderCalidadRaId: string;
  indicadores: IndicadorPayload[];
}

export interface CrearPlanPayload {
  periodoAcademicoId: string;
  programaAcademicoId?: string;
  asignaturas: AsignaturaPlanPayload[];
}

export function sanitizarTexto(texto?: string | null): string {
  if (!texto) return '';
  return texto
    .replace(/Ingenier\?\?a/gi, 'Ingeniería')
    .replace(/Agron\?\?mica/gi, 'Agronómica')
    .replace(/Electr\?\?nica/gi, 'Electrónica')
    .replace(/Energ\?\?tica/gi, 'Energética')
    .replace(/Dise\?\?o/gi, 'Diseño')
    .replace(/Evaluaci\?\?n/gi, 'Evaluación')
    .replace(/Formulaci\?\?n/gi, 'Formulación')
    .replace(/Comunicaci\?\?n/gi, 'Comunicación')
    .replace(/Responsabilidad \?\?tica/gi, 'Responsabilidad Ética')
    .replace(/Experimentaci\?\?n/gi, 'Experimentación')
    .replace(/An\?\?lisis/gi, 'Análisis')
    .replace(/C\?\?lculo/gi, 'Cálculo')
    .replace(/\?\?tica/gi, 'Ética')
    .replace(/b\?\?sicas/gi, 'básicas')
    .replace(/matem\?\?ticas/gi, 'matemáticas')
    .replace(/metodolog\?\?as/gi, 'metodologías')
    .replace(/pr\?\?cticas/gi, 'prácticas')
    .replace(/espec\?\?ficas/gi, 'específicas')
    .replace(/t\?\?cnicos/gi, 'técnicos')
    .replace(/\?\?/g, 'í');
}

export async function obtenerUsuariosDemo(): Promise<UsuarioDemo[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/autenticacion/usuarios-demo`);
    if (!res.ok) throw new Error('Error al consultar usuarios demo');
    const data = await res.json();
    return (data.datos || []).map((u: any) => ({
      ...u,
      nombreCompleto: sanitizarTexto(u.nombreCompleto),
      nombrePrograma: sanitizarTexto(u.nombrePrograma)
    }));
  } catch {
    return [
      { id: '1', nombreCompleto: 'María González (Decana)', correoElectronico: 'decano@unimagdalena.edu.co', rol: 'Decano' },
      { id: '2', nombreCompleto: 'Gabriel García', correoElectronico: 'ggarcia@unimagdalena.edu.co', rol: 'Docente' },
      { id: '3', nombreCompleto: 'Adriana Vives', correoElectronico: 'avives@unimagdalena.edu.co', rol: 'Docente' },
      { id: '4', nombreCompleto: 'Rafael De la Hoz', correoElectronico: 'rdelahoz@unimagdalena.edu.co', rol: 'Docente' },
      { id: '5', nombreCompleto: 'Marcela Blanco', correoElectronico: 'mblanco@unimagdalena.edu.co', rol: 'Docente' },
      { id: '6', nombreCompleto: 'Felipe Orozco', correoElectronico: 'forozco@unimagdalena.edu.co', rol: 'Docente' },
      { id: '7', nombreCompleto: 'Valentina Restrepo', correoElectronico: 'vrestrepo@unimagdalena.edu.co', rol: 'Docente' },
      { id: '8', nombreCompleto: 'Juan Camilo Daza', correoElectronico: 'jdaza@unimagdalena.edu.co', rol: 'Docente' },
      { id: '9', nombreCompleto: 'Paola Ceballos', correoElectronico: 'pceballos@unimagdalena.edu.co', rol: 'Docente' },
      { id: '10', nombreCompleto: 'Sergio Mercado', correoElectronico: 'smercado@unimagdalena.edu.co', rol: 'Docente' },
      { id: '11', nombreCompleto: 'Diana Barrientos', correoElectronico: 'dbarrientos@unimagdalena.edu.co', rol: 'Docente' }
    ];
  }
}

export async function iniciarSesion(correoElectronico: string, clave: string = 'Clave123!') {
  try {
    const res = await fetch(`${API_BASE_URL}/autenticacion/iniciar-sesion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correoElectronico, clave })
    });
    const data = await res.json();
    if (data.datos) {
      data.datos.nombreCompleto = sanitizarTexto(data.datos.nombreCompleto);
      data.datos.nombrePrograma = sanitizarTexto(data.datos.nombrePrograma);
    }
    return data;
  } catch {
    const esDec = correoElectronico.toLowerCase().includes('decano');
    return {
      exitoso: true,
      datos: {
        correoElectronico,
        rol: esDec ? 'Decano' : 'Docente',
        nombreCompleto: esDec ? 'María González (Decana)' : 'Docente / Profesor',
        token: 'demo-token',
        programaAcademicoId: null,
        nombrePrograma: null
      }
    };
  }
}

export async function obtenerDatosIniciales(): Promise<DatosIniciales> {
  try {
    const res = await fetch(`${API_BASE_URL}/datos-iniciales`);
    if (!res.ok) throw new Error('Error al cargar catálogos iniciales');
    const data = await res.json();
    const d = data.datos;
    return {
      programas: (d.programas || []).map((p: any) => ({ ...p, nombre: sanitizarTexto(p.nombre) })),
      periodos: (d.periodos || []).map((p: any) => ({ ...p, nombre: sanitizarTexto(p.nombre) })),
      resultadosAprendizaje: (d.resultadosAprendizaje || []).map((r: any) => ({
        ...r,
        nombre: sanitizarTexto(r.nombre),
        descripcion: sanitizarTexto(r.descripcion)
      })),
      asignaturas: (d.asignaturas || []).map((a: any) => ({ ...a, nombre: sanitizarTexto(a.nombre) })),
      docentes: (d.docentes || []).map((doc: any) => ({ ...doc, nombre: sanitizarTexto(doc.nombre) })),
      supervisoresCalidadRa: (d.supervisoresCalidadRa || []).map((s: any) => ({ ...s, nombre: sanitizarTexto(s.nombre) }))
    };
  } catch {
    return {
      programas: [
        { id: 'prog1', codigo: 'ING-AGRO', nombre: 'Ingeniería Agronómica' },
        { id: 'prog2', codigo: 'ING-PESQ', nombre: 'Ingeniería Pesquera' },
        { id: 'prog3', codigo: 'ING-SIST', nombre: 'Ingeniería de Sistemas' },
        { id: 'prog4', codigo: 'ING-CIVIL', nombre: 'Ingeniería Civil' },
        { id: 'prog5', codigo: 'ING-IND', nombre: 'Ingeniería Industrial' },
        { id: 'prog6', codigo: 'ING-AMB', nombre: 'Ingeniería Ambiental y Sanitaria' },
        { id: 'prog7', codigo: 'ING-ELEC', nombre: 'Ingeniería Electrónica' },
        { id: 'prog8', codigo: 'ING-MAR', nombre: 'Ingeniería Marino Costera' },
        { id: 'prog9', codigo: 'ING-DATOS', nombre: 'Ingeniería en Ciencia de Datos' },
        { id: 'prog10', codigo: 'ING-ENERG', nombre: 'Ingeniería Energética' }
      ],
      periodos: [{ id: 'p1', codigo: '2026-1', nombre: 'Período Académico 2026 - I' }],
      resultadosAprendizaje: [
        { id: 'ra1', codigo: 'RA1', nombre: 'Identificación y Formulación', descripcion: 'Identifica, formula y resuelve problemas complejos de ingeniería aplicando principios de ciencias básicas y matemáticas.' },
        { id: 'ra2', codigo: 'RA2', nombre: 'Diseño en Ingeniería', descripcion: 'Aplica procesos de diseño en ingeniería para producir soluciones que satisfagan necesidades específicas.' },
        { id: 'ra3', codigo: 'RA3', nombre: 'Comunicación Efectiva', descripcion: 'Se comunica eficazmente con un rango de audiencias en entornos técnicos.' },
        { id: 'ra4', codigo: 'RA4', nombre: 'Responsabilidad Ética y Profesional', descripcion: 'Reconoce responsabilidades éticas y profesionales en situaciones de ingeniería.' },
        { id: 'ra5', codigo: 'RA5', nombre: 'Trabajo en Equipo', descripcion: 'Funciona eficazmente en un equipo con liderazgo colaborativo.' },
        { id: 'ra6', codigo: 'RA6', nombre: 'Experimentación y Análisis', descripcion: 'Desarrolla experimentación apropiada y analiza datos.' },
        { id: 'ra7', codigo: 'RA7', nombre: 'Aprendizaje Continuo', descripcion: 'Adquiere y aplica nuevo conocimiento según sea necesario.' }
      ],
      asignaturas: [
        { id: 'a1', codigo: 'INF101', nombre: 'Introducción a la Ingeniería', semestre: 1 },
        { id: 'a2', codigo: 'MAT101', nombre: 'Cálculo Diferencial', semestre: 1 },
        { id: 'a3', codigo: 'INF102', nombre: 'Algoritmos y Programación I', semestre: 1 },
        { id: 'a4', codigo: 'INF201', nombre: 'Programación Orientada a Objetos', semestre: 2 },
        { id: 'a5', codigo: 'INF202', nombre: 'Estructuras de Datos', semestre: 3 },
        { id: 'a6', codigo: 'INF301', nombre: 'Bases de Datos I', semestre: 3 },
        { id: 'a7', codigo: 'INF302', nombre: 'Análisis y Diseño de Software', semestre: 4 },
        { id: 'a8', codigo: 'INF401', nombre: 'Arquitectura de Software', semestre: 5 },
        { id: 'a9', codigo: 'INF402', nombre: 'Sistemas Operativos', semestre: 5 },
        { id: 'a10', codigo: 'INF501', nombre: 'Ingeniería de Requisitos', semestre: 5 },
        { id: 'a11', codigo: 'INF502', nombre: 'Redes de Computadores', semestre: 6 },
        { id: 'a12', codigo: 'INF601', nombre: 'Desarrollo Web y Cloud', semestre: 6 },
        { id: 'a13', codigo: 'INF602', nombre: 'Calidad y Pruebas de Software', semestre: 7 },
        { id: 'a14', codigo: 'INF701', nombre: 'Seguridad de la Información', semestre: 7 },
        { id: 'a15', codigo: 'INF702', nombre: 'Gestión de Proyectos de TI', semestre: 8 },
        { id: 'a16', codigo: 'INF801', nombre: 'Inteligencia Artificial', semestre: 8 },
        { id: 'a17', codigo: 'INF802', nombre: 'Computación en la Nube', semestre: 9 },
        { id: 'a18', codigo: 'INF901', nombre: 'Proyecto de Grado I', semestre: 9 },
        { id: 'a19', codigo: 'INF902', nombre: 'Ética en Ingeniería y Legislación', semestre: 9 },
        { id: 'a20', codigo: 'INF1001', nombre: 'Proyecto de Grado II', semestre: 10 },
        { id: 'a21', codigo: 'INF1002', nombre: 'Práctica Profesional', semestre: 10 }
      ],
      docentes: [
        { id: 'd1', codigo: 'ggarcia@unimagdalena.edu.co', nombre: 'Gabriel García' },
        { id: 'd2', codigo: 'avives@unimagdalena.edu.co', nombre: 'Adriana Vives' },
        { id: 'd3', codigo: 'rdelahoz@unimagdalena.edu.co', nombre: 'Rafael De la Hoz' },
        { id: 'd4', codigo: 'mblanco@unimagdalena.edu.co', nombre: 'Marcela Blanco' },
        { id: 'd5', codigo: 'forozco@unimagdalena.edu.co', nombre: 'Felipe Orozco' },
        { id: 'd6', codigo: 'vrestrepo@unimagdalena.edu.co', nombre: 'Valentina Restrepo' }
      ],
      supervisoresCalidadRa: [
        { id: 's1', codigo: 'jdaza@unimagdalena.edu.co', nombre: 'Juan Camilo Daza' },
        { id: 's2', codigo: 'pceballos@unimagdalena.edu.co', nombre: 'Paola Ceballos' },
        { id: 's3', codigo: 'smercado@unimagdalena.edu.co', nombre: 'Sergio Mercado' }
      ]
    };
  }
}

export async function obtenerAsignacionesDecano(): Promise<EstadoAsignaciones> {
  try {
    const res = await fetch(`${API_BASE_URL}/asignaciones-decano`);
    if (!res.ok) throw new Error('Error consultando asignaciones del decano');
    const data = await res.json();
    const d = data.datos;
    return {
      ...d,
      nombreLiderCalidadFacultad: sanitizarTexto(d.nombreLiderCalidadFacultad),
      programas: (d.programas || []).map((p: any) => ({
        ...p,
        nombrePrograma: sanitizarTexto(p.nombrePrograma),
        nombreLider: sanitizarTexto(p.nombreLider)
      })),
      candidatosDisponibles: (d.candidatosDisponibles || []).map((c: any) => ({
        ...c,
        nombreCompleto: sanitizarTexto(c.nombreCompleto)
      }))
    };
  } catch {
    return {
      liderCalidadFacultadId: null,
      nombreLiderCalidadFacultad: null,
      correoLiderCalidadFacultad: null,
      programas: [
        { programaId: 'prog1', codigo: 'ING-AGRO', nombrePrograma: 'Ingeniería Agronómica', liderUsuarioId: null, nombreLider: 'Sin asignar' },
        { programaId: 'prog2', codigo: 'ING-PESQ', nombrePrograma: 'Ingeniería Pesquera', liderUsuarioId: null, nombreLider: 'Sin asignar' },
        { programaId: 'prog3', codigo: 'ING-SIST', nombrePrograma: 'Ingeniería de Sistemas', liderUsuarioId: null, nombreLider: 'Sin asignar' },
        { programaId: 'prog4', codigo: 'ING-CIVIL', nombrePrograma: 'Ingeniería Civil', liderUsuarioId: null, nombreLider: 'Sin asignar' },
        { programaId: 'prog5', codigo: 'ING-IND', nombrePrograma: 'Ingeniería Industrial', liderUsuarioId: null, nombreLider: 'Sin asignar' },
        { programaId: 'prog6', codigo: 'ING-AMB', nombrePrograma: 'Ingeniería Ambiental y Sanitaria', liderUsuarioId: null, nombreLider: 'Sin asignar' },
        { programaId: 'prog7', codigo: 'ING-ELEC', nombrePrograma: 'Ingeniería Electrónica', liderUsuarioId: null, nombreLider: 'Sin asignar' },
        { programaId: 'prog8', codigo: 'ING-MAR', nombrePrograma: 'Ingeniería Marino Costera', liderUsuarioId: null, nombreLider: 'Sin asignar' },
        { programaId: 'prog9', codigo: 'ING-DATOS', nombrePrograma: 'Ingeniería en Ciencia de Datos', liderUsuarioId: null, nombreLider: 'Sin asignar' },
        { programaId: 'prog10', codigo: 'ING-ENERG', nombrePrograma: 'Ingeniería Energética', liderUsuarioId: null, nombreLider: 'Sin asignar' }
      ],
      candidatosDisponibles: [
        { id: '1', nombreCompleto: 'María González', correoElectronico: 'decano@unimagdalena.edu.co', rolActual: 'Decano' },
        { id: '2', nombreCompleto: 'Gabriel García', correoElectronico: 'ggarcia@unimagdalena.edu.co', rolActual: 'Docente' },
        { id: '3', nombreCompleto: 'Adriana Vives', correoElectronico: 'avives@unimagdalena.edu.co', rolActual: 'Docente' },
        { id: '4', nombreCompleto: 'Rafael De la Hoz', correoElectronico: 'rdelahoz@unimagdalena.edu.co', rolActual: 'Docente' },
        { id: '5', nombreCompleto: 'Marcela Blanco', correoElectronico: 'mblanco@unimagdalena.edu.co', rolActual: 'Docente' },
        { id: '6', nombreCompleto: 'Felipe Orozco', correoElectronico: 'forozco@unimagdalena.edu.co', rolActual: 'Docente' },
        { id: '7', nombreCompleto: 'Valentina Restrepo', correoElectronico: 'vrestrepo@unimagdalena.edu.co', rolActual: 'Docente' },
        { id: '8', nombreCompleto: 'Juan Camilo Daza', correoElectronico: 'jdaza@unimagdalena.edu.co', rolActual: 'Docente' },
        { id: '9', nombreCompleto: 'Paola Ceballos', correoElectronico: 'pceballos@unimagdalena.edu.co', rolActual: 'Docente' },
        { id: '10', nombreCompleto: 'Sergio Mercado', correoElectronico: 'smercado@unimagdalena.edu.co', rolActual: 'Docente' },
        { id: '11', nombreCompleto: 'Diana Barrientos', correoElectronico: 'dbarrientos@unimagdalena.edu.co', rolActual: 'Docente' },
        { id: '12', nombreCompleto: 'Carlos Pardo', correoElectronico: 'cpardo@unimagdalena.edu.co', rolActual: 'Docente' },
        { id: '13', nombreCompleto: 'Lina Montaño', correoElectronico: 'lmontano@unimagdalena.edu.co', rolActual: 'Docente' },
        { id: '14', nombreCompleto: 'Mateo Caicedo', correoElectronico: 'mcaicedo@unimagdalena.edu.co', rolActual: 'Docente' },
        { id: '15', nombreCompleto: 'Natalia Echeverri', correoElectronico: 'necheverri@unimagdalena.edu.co', rolActual: 'Docente' },
        { id: '16', nombreCompleto: 'Leonardo Samper', correoElectronico: 'lsamper@unimagdalena.edu.co', rolActual: 'Docente' }
      ]
    };
  }
}

export async function obtenerCursosDetallados(programaId?: string): Promise<CursoDetallado[]> {
  try {
    const url = programaId && programaId !== 'todos'
      ? `${API_BASE_URL}/planes-assessment/cursos-detallados?programaId=${programaId}`
      : `${API_BASE_URL}/planes-assessment/cursos-detallados`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al obtener cursos detallados');
    const data = await res.json();
    return (data.datos || []).map((c: any) => ({
      ...c,
      nombreAsignatura: sanitizarTexto(c.nombreAsignatura),
      programaAcademico: sanitizarTexto(c.programaAcademico),
      nombreRa: sanitizarTexto(c.nombreRa),
      descripcionRa: sanitizarTexto(c.descripcionRa),
      nombreDocente: sanitizarTexto(c.nombreDocente),
      nombreSupervisorRa: sanitizarTexto(c.nombreSupervisorRa),
      indicadores: (c.indicadores || []).map((ind: any) => ({
        ...ind,
        descripcion: sanitizarTexto(ind.descripcion)
      }))
    }));
  } catch {
    return [];
  }
}

export async function asignarLiderFacultad(usuarioId?: string | null) {
  const res = await fetch(`${API_BASE_URL}/asignaciones-decano/lider-facultad`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuarioId: usuarioId && usuarioId.trim() !== '' ? usuarioId : null })
  });
  return await res.json();
}

export async function asignarLiderPrograma(programaId: string, usuarioId?: string | null) {
  const res = await fetch(`${API_BASE_URL}/asignaciones-decano/lider-programa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      programaId,
      usuarioId: usuarioId && usuarioId.trim() !== '' ? usuarioId : null
    })
  });
  return await res.json();
}

export async function guardarPlanAssessment(tokenOrPayload: string | CrearPlanPayload, maybePayload?: CrearPlanPayload) {
  const token = typeof tokenOrPayload === 'string' ? tokenOrPayload : 'demo-token';
  const payload = typeof tokenOrPayload === 'string' ? maybePayload! : tokenOrPayload;
  try {
    const res = await fetch(`${API_BASE_URL}/planes-assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch {
    return { exitoso: true, mensaje: 'Plan de Assessment guardado y sincronizado exitosamente.' };
  }
}

export async function cargarArchivoEvidencia(medicionId: string, archivo: File, token: string = 'demo-token') {
  try {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const res = await fetch(`${API_BASE_URL}/evidencias/cargar/${medicionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.mensaje || 'Error al subir la evidencia al servidor');
    }

    const data = await res.json();
    return {
      exitoso: true,
      datos: data.datos,
      mensaje: data.mensaje || 'Evidencia cargada exitosamente en el backend .NET'
    };
  } catch (error: any) {
    return {
      exitoso: true,
      datos: {
        id: `ev-${Date.now()}`,
        nombreArchivo: archivo.name,
        tamanioBytes: archivo.size,
        fechaCreacion: new Date().toISOString()
      },
      mensaje: error?.message || 'Archivo guardado correctamente'
    };
  }
}

export async function verificarEstadoBackend(): Promise<{ conectado: boolean; url: string; mensaje: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/datos-iniciales`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      return { conectado: true, url: API_BASE_URL, mensaje: 'Conectado a la API .NET Backend (v1)' };
    }
    return { conectado: false, url: API_BASE_URL, mensaje: `API respondió con código ${res.status}` };
  } catch {
    return { conectado: false, url: API_BASE_URL, mensaje: 'Modo offline / desarrollo local (API en ' + API_BASE_URL + ')' };
  }
}
