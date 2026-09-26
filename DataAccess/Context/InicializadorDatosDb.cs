using AssessmentSystem.Core.Entities;
using AssessmentSystem.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace AssessmentSystem.DataAccess.Context;

public static class InicializadorDatosDb
{
    public static async Task InicializarAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ContextoAplicacionDb>();

        // Aplicar migraciones pendientes automáticamente en SQL Server
        await contexto.Database.EnsureCreatedAsync();

        // Limpiar planes, mediciones y evidencias anteriores para que los datos sean ingresados 100% por los usuarios
        var evidencias = await contexto.Evidencias.ToListAsync();
        if (evidencias.Any()) contexto.Evidencias.RemoveRange(evidencias);

        var mediciones = await contexto.Mediciones.ToListAsync();
        if (mediciones.Any()) contexto.Mediciones.RemoveRange(mediciones);

        var indicadores = await contexto.IndicadoresDesempeno.ToListAsync();
        if (indicadores.Any()) contexto.IndicadoresDesempeno.RemoveRange(indicadores);

        var asignaturasPlan = await contexto.AsignaturasPlanAssessment.ToListAsync();
        if (asignaturasPlan.Any()) contexto.AsignaturasPlanAssessment.RemoveRange(asignaturasPlan);

        var planes = await contexto.PlanesAssessment.ToListAsync();
        if (planes.Any()) contexto.PlanesAssessment.RemoveRange(planes);

        await contexto.SaveChangesAsync();

        // 1. Sembrar Roles
        if (!await contexto.Roles.AnyAsync())
        {
            var roles = new List<Rol>
            {
                new() { Nombre = RolesSistema.Decano, Descripcion = "Decano o Decana de la Facultad" },
                new() { Nombre = RolesSistema.LiderCalidadFacultad, Descripcion = "Líder de Calidad de la Facultad" },
                new() { Nombre = RolesSistema.LiderPrograma, Descripcion = "Líder / Director del Programa Académico" },
                new() { Nombre = RolesSistema.LiderCalidadRA, Descripcion = "Líder de Calidad por Resultado de Aprendizaje" },
                new() { Nombre = RolesSistema.Docente, Descripcion = "Docente / Profesor a cargo de asignaturas" }
            };
            await contexto.Roles.AddRangeAsync(roles);
            await contexto.SaveChangesAsync();
        }

        var rolDecano = await contexto.Roles.FirstAsync(r => r.Nombre == RolesSistema.Decano);
        var rolCalidadFacultad = await contexto.Roles.FirstAsync(r => r.Nombre == RolesSistema.LiderCalidadFacultad);
        var rolLiderPrograma = await contexto.Roles.FirstAsync(r => r.Nombre == RolesSistema.LiderPrograma);
        var rolCalidadRa = await contexto.Roles.FirstAsync(r => r.Nombre == RolesSistema.LiderCalidadRA);
        var rolDocente = await contexto.Roles.FirstAsync(r => r.Nombre == RolesSistema.Docente);

        // 2. Sembrar o Corregir los 10 Programas de Ingeniería de la Universidad del Magdalena
        var mapaNombresProgramas = new Dictionary<string, string>
        {
            { "ING-AGRO", "Ingeniería Agronómica" },
            { "ING-PESQ", "Ingeniería Pesquera" },
            { "ING-SIST", "Ingeniería de Sistemas" },
            { "ING-CIVIL", "Ingeniería Civil" },
            { "ING-IND", "Ingeniería Industrial" },
            { "ING-AMB", "Ingeniería Ambiental y Sanitaria" },
            { "ING-ELEC", "Ingeniería Electrónica" },
            { "ING-MAR", "Ingeniería Marino Costera" },
            { "ING-DATOS", "Ingeniería en Ciencia de Datos" },
            { "ING-ENERG", "Ingeniería Energética" }
        };

        if (!await contexto.ProgramasAcademicos.AnyAsync())
        {
            var programas = mapaNombresProgramas.Select(p => new ProgramaAcademico
            {
                Codigo = p.Key,
                Nombre = p.Value,
                Facultad = "Facultad de Ingeniería"
            }).ToList();
            await contexto.ProgramasAcademicos.AddRangeAsync(programas);
            await contexto.SaveChangesAsync();
        }
        else
        {
            // Si ya existen, corregir cualquier registro con caracteres dañados (ej: Ingenier??a)
            var programasExistentes = await contexto.ProgramasAcademicos.ToListAsync();
            foreach (var prog in programasExistentes)
            {
                if (mapaNombresProgramas.TryGetValue(prog.Codigo, out var nombreLimpio) && prog.Nombre != nombreLimpio)
                {
                    prog.Nombre = nombreLimpio;
                    prog.Facultad = "Facultad de Ingeniería";
                }
            }
            await contexto.SaveChangesAsync();
        }

        // 3. Sembrar Usuarios: Conservar solo la Decana y sembrar los nuevos Docentes
        var decana = await contexto.Usuarios.FirstOrDefaultAsync(u => u.CorreoElectronico == "decano@unimagdalena.edu.co");
        if (decana == null)
        {
            decana = new Usuario
            {
                Nombres = "María",
                Apellidos = "González",
                CorreoElectronico = "decano@unimagdalena.edu.co",
                ClaveHash = "Clave123!",
                RolId = rolDecano.Id,
                ProgramaAcademicoId = null
            };
            await contexto.Usuarios.AddAsync(decana);
            await contexto.SaveChangesAsync();
        }
        else
        {
            decana.RolId = rolDecano.Id;
            decana.ProgramaAcademicoId = null;
            await contexto.SaveChangesAsync();
        }

        // Eliminar usuarios anteriores que no sean la Decana
        var usuariosAntiguos = await contexto.Usuarios
            .Where(u => u.CorreoElectronico != "decano@unimagdalena.edu.co")
            .ToListAsync();
        if (usuariosAntiguos.Any())
        {
            contexto.Usuarios.RemoveRange(usuariosAntiguos);
            await contexto.SaveChangesAsync();
        }

        // Sembrar los nuevos Docentes disponibles para asignación por la Decana
        var nuevosDocentes = new List<Usuario>
        {
            new() { Nombres = "Gabriel", Apellidos = "García", CorreoElectronico = "ggarcia@unimagdalena.edu.co", ClaveHash = "Clave123!", RolId = rolDocente.Id, ProgramaAcademicoId = null },
            new() { Nombres = "Adriana", Apellidos = "Vives", CorreoElectronico = "avives@unimagdalena.edu.co", ClaveHash = "Clave123!", RolId = rolDocente.Id, ProgramaAcademicoId = null },
            new() { Nombres = "Rafael", Apellidos = "De la Hoz", CorreoElectronico = "rdelahoz@unimagdalena.edu.co", ClaveHash = "Clave123!", RolId = rolDocente.Id, ProgramaAcademicoId = null },
            new() { Nombres = "Marcela", Apellidos = "Blanco", CorreoElectronico = "mblanco@unimagdalena.edu.co", ClaveHash = "Clave123!", RolId = rolDocente.Id, ProgramaAcademicoId = null },
            new() { Nombres = "Felipe", Apellidos = "Orozco", CorreoElectronico = "forozco@unimagdalena.edu.co", ClaveHash = "Clave123!", RolId = rolDocente.Id, ProgramaAcademicoId = null },
            new() { Nombres = "Valentina", Apellidos = "Restrepo", CorreoElectronico = "vrestrepo@unimagdalena.edu.co", ClaveHash = "Clave123!", RolId = rolDocente.Id, ProgramaAcademicoId = null },
            new() { Nombres = "Juan Camilo", Apellidos = "Daza", CorreoElectronico = "jdaza@unimagdalena.edu.co", ClaveHash = "Clave123!", RolId = rolDocente.Id, ProgramaAcademicoId = null },
            new() { Nombres = "Paola", Apellidos = "Ceballos", CorreoElectronico = "pceballos@unimagdalena.edu.co", ClaveHash = "Clave123!", RolId = rolDocente.Id, ProgramaAcademicoId = null },
            new() { Nombres = "Sergio", Apellidos = "Mercado", CorreoElectronico = "smercado@unimagdalena.edu.co", ClaveHash = "Clave123!", RolId = rolDocente.Id, ProgramaAcademicoId = null },
            new() { Nombres = "Diana", Apellidos = "Barrientos", CorreoElectronico = "dbarrientos@unimagdalena.edu.co", ClaveHash = "Clave123!", RolId = rolDocente.Id, ProgramaAcademicoId = null },
            new() { Nombres = "Carlos", Apellidos = "Pardo", CorreoElectronico = "cpardo@unimagdalena.edu.co", ClaveHash = "Clave123!", RolId = rolDocente.Id, ProgramaAcademicoId = null },
            new() { Nombres = "Lina", Apellidos = "Montaño", CorreoElectronico = "lmontano@unimagdalena.edu.co", ClaveHash = "Clave123!", RolId = rolDocente.Id, ProgramaAcademicoId = null },
            new() { Nombres = "Mateo", Apellidos = "Caicedo", CorreoElectronico = "mcaicedo@unimagdalena.edu.co", ClaveHash = "Clave123!", RolId = rolDocente.Id, ProgramaAcademicoId = null },
            new() { Nombres = "Natalia", Apellidos = "Echeverri", CorreoElectronico = "necheverri@unimagdalena.edu.co", ClaveHash = "Clave123!", RolId = rolDocente.Id, ProgramaAcademicoId = null },
            new() { Nombres = "Leonardo", Apellidos = "Samper", CorreoElectronico = "lsamper@unimagdalena.edu.co", ClaveHash = "Clave123!", RolId = rolDocente.Id, ProgramaAcademicoId = null }
        };

        await contexto.Usuarios.AddRangeAsync(nuevosDocentes);
        await contexto.SaveChangesAsync();

        // 4. Sembrar Período Académico
        if (!await contexto.PeriodosAcademicos.AnyAsync())
        {
            var periodo = new PeriodoAcademico
            {
                Codigo = "2026-1",
                Nombre = "Período Académico 2026 - I",
                FechaInicio = new DateTime(2026, 2, 1),
                FechaFin = new DateTime(2026, 6, 30),
                EsActual = true
            };
            await contexto.PeriodosAcademicos.AddAsync(periodo);
            await contexto.SaveChangesAsync();
        }

        // 5. Sembrar los 7 Resultados de Aprendizaje (RA1 a RA7)
        if (!await contexto.ResultadosAprendizaje.AnyAsync())
        {
            var ras = new List<ResultadoAprendizaje>
            {
                new() { Codigo = "RA1", Nombre = "Identificación y Formulación", Descripcion = "Identifica, formula y resuelve problemas complejos de ingeniería aplicando principios de ciencias básicas y matemáticas." },
                new() { Codigo = "RA2", Nombre = "Diseño en Ingeniería", Descripcion = "Aplica procesos de diseño en ingeniería para producir soluciones que satisfagan necesidades específicas con consideraciones de salud pública, seguridad y bienestar." },
                new() { Codigo = "RA3", Nombre = "Comunicación Efectiva", Descripcion = "Se comunica eficazmente con un rango de audiencias en entornos técnicos y profesionales multidisciplinarios." },
                new() { Codigo = "RA4", Nombre = "Responsabilidad Ética y Profesional", Descripcion = "Reconoce responsabilidades éticas y profesionales en situaciones de ingeniería y emite juicios informados." },
                new() { Codigo = "RA5", Nombre = "Trabajo en Equipo", Descripcion = "Funciona eficazmente en un equipo cuyos miembros proporcionan liderazgo, crean un entorno colaborativo e inclusivo." },
                new() { Codigo = "RA6", Nombre = "Experimentación y Análisis", Descripcion = "Desarrolla y conduce experimentación apropiada, analiza e interpreta datos y usa el juicio de ingeniería para sacar conclusiones." },
                new() { Codigo = "RA7", Nombre = "Aprendizaje Continuo", Descripcion = "Adquiere y aplica nuevo conocimiento según sea necesario, utilizando estrategias de aprendizaje apropiadas." }
            };
            await contexto.ResultadosAprendizaje.AddRangeAsync(ras);
            await contexto.SaveChangesAsync();
        }

        // 6. Sembrar 21 Asignaturas de prueba
        if (!await contexto.Asignaturas.AnyAsync())
        {
            var asignaturas = new List<Asignatura>
            {
                new() { Codigo = "INF101", Nombre = "Introducción a la Ingeniería", Creditos = 3, Semestre = 1 },
                new() { Codigo = "MAT101", Nombre = "Cálculo Diferencial", Creditos = 4, Semestre = 1 },
                new() { Codigo = "INF102", Nombre = "Algoritmos y Programación I", Creditos = 4, Semestre = 1 },
                new() { Codigo = "INF201", Nombre = "Programación Orientada a Objetos", Creditos = 4, Semestre = 2 },
                new() { Codigo = "INF202", Nombre = "Estructuras de Datos", Creditos = 4, Semestre = 3 },
                new() { Codigo = "INF301", Nombre = "Bases de Datos I", Creditos = 3, Semestre = 3 },
                new() { Codigo = "INF302", Nombre = "Análisis y Diseño de Software", Creditos = 4, Semestre = 4 },
                new() { Codigo = "INF401", Nombre = "Arquitectura de Software", Creditos = 3, Semestre = 5 },
                new() { Codigo = "INF402", Nombre = "Sistemas Operativos", Creditos = 3, Semestre = 5 },
                new() { Codigo = "INF501", Nombre = "Ingeniería de Requisitos", Creditos = 3, Semestre = 5 },
                new() { Codigo = "INF502", Nombre = "Redes de Computadores", Creditos = 3, Semestre = 6 },
                new() { Codigo = "INF601", Nombre = "Desarrollo Web y Cloud", Creditos = 4, Semestre = 6 },
                new() { Codigo = "INF602", Nombre = "Calidad y Pruebas de Software", Creditos = 3, Semestre = 7 },
                new() { Codigo = "INF701", Nombre = "Seguridad de la Información", Creditos = 3, Semestre = 7 },
                new() { Codigo = "INF702", Nombre = "Gestión de Proyectos de TI", Creditos = 3, Semestre = 8 },
                new() { Codigo = "INF801", Nombre = "Inteligencia Artificial", Creditos = 3, Semestre = 8 },
                new() { Codigo = "INF802", Nombre = "Computación en la Nube", Creditos = 3, Semestre = 9 },
                new() { Codigo = "INF901", Nombre = "Proyecto de Grado I", Creditos = 4, Semestre = 9 },
                new() { Codigo = "INF902", Nombre = "Ética en Ingeniería y Legislación", Creditos = 2, Semestre = 9 },
                new() { Codigo = "INF1001", Nombre = "Proyecto de Grado II", Creditos = 4, Semestre = 10 },
                new() { Codigo = "INF1002", Nombre = "Práctica Profesional", Creditos = 6, Semestre = 10 }
            };
            await contexto.Asignaturas.AddRangeAsync(asignaturas);
            await contexto.SaveChangesAsync();
        }
    }
}
