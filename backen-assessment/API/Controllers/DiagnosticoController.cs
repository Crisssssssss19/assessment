using AssessmentSystem.Business.DTOs.Comun;
using AssessmentSystem.DataAccess.Context;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssessmentSystem.API.Controllers;

[ApiController]
[Route("api/v1/diagnostico")]
public class DiagnosticoController : ControllerBase
{
    private readonly ContextoAplicacionDb _contexto;

    public DiagnosticoController(ContextoAplicacionDb contexto)
    {
        _contexto = contexto;
    }

    public record EstadoConexionDbDto(
        bool Conectado,
        string Mensaje,
        string NombreBaseDatos,
        int TotalRoles,
        int TotalUsuarios,
        int TotalResultadosAprendizaje,
        int TotalAsignaturas,
        int TotalPeriodos
    );

    /// <summary>
    /// Prueba la conexión a la base de datos SQL Server y valida los registros sembrados.
    /// </summary>
    [HttpGet("conexion-db")]
    [ProducesResponseType(typeof(RespuestaApi<EstadoConexionDbDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ProbarConexionDb()
    {
        try
        {
            // 1. Probar conectividad con la BD
            var puedeConectar = await _contexto.Database.CanConnectAsync();
            if (!puedeConectar)
            {
                return StatusCode(500, RespuestaApi<object>.RespuestaError(
                    "No se pudo establecer conexión con SQL Server. Verifique que el servidor esté activo y las credenciales sean correctas."));
            }

            // 2. Garantizar que la base de datos y tablas existan
            await _contexto.Database.EnsureCreatedAsync();

            // 3. Ejecutar sembrado si faltan datos
            await InicializadorDatosDb.InicializarAsync(HttpContext.RequestServices);

            // 4. Obtener conteos de validación
            var rolesCount = await _contexto.Roles.CountAsync();
            var usuariosCount = await _contexto.Usuarios.CountAsync();
            var raCount = await _contexto.ResultadosAprendizaje.CountAsync();
            var asignaturasCount = await _contexto.Asignaturas.CountAsync();
            var periodosCount = await _contexto.PeriodosAcademicos.CountAsync();

            var resultado = new EstadoConexionDbDto(
                Conectado: true,
                Mensaje: "¡Conexión a SQL Server exitosa y datos sembrados correctamente!",
                NombreBaseDatos: _contexto.Database.GetDbConnection().Database,
                TotalRoles: rolesCount,
                TotalUsuarios: usuariosCount,
                TotalResultadosAprendizaje: raCount,
                TotalAsignaturas: asignaturasCount,
                TotalPeriodos: periodosCount
            );

            return Ok(RespuestaApi<EstadoConexionDbDto>.RespuestaExitosa(resultado, "Prueba de conexión completada con éxito."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, RespuestaApi<object>.RespuestaError(
                $"Error al conectar con la base de datos: {ex.Message}",
                new List<string> { ex.ToString() }
            ));
        }
    }
}
