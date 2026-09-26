using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AssessmentSystem.Business.DTOs.Autenticacion;
using AssessmentSystem.Business.DTOs.Comun;
using AssessmentSystem.DataAccess.Context;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AssessmentSystem.API.Controllers;

[ApiController]
[Route("api/v1/autenticacion")]
public class AutenticacionController : ControllerBase
{
    private readonly ContextoAplicacionDb _contexto;
    private readonly IConfiguration _configuracion;

    public AutenticacionController(ContextoAplicacionDb contexto, IConfiguration configuracion)
    {
        _contexto = contexto;
        _configuracion = configuracion;
    }

    public record UsuarioDemoDto(
        Guid Id,
        string NombreCompleto,
        string CorreoElectronico,
        string Rol,
        Guid? ProgramaAcademicoId,
        string? NombrePrograma
    );

    /// <summary>
    /// Retorna los usuarios de prueba con sus roles y programas asignados para facilitar el cambio de perfil.
    /// </summary>
    [HttpGet("usuarios-demo")]
    [ProducesResponseType(typeof(RespuestaApi<List<UsuarioDemoDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerUsuariosDemo()
    {
        var usuarios = await _contexto.Usuarios
            .Include(u => u.Rol)
            .Include(u => u.ProgramaAcademico)
            .Where(u => u.EstaActivo)
            .Select(u => new UsuarioDemoDto(
                u.Id,
                $"{u.Nombres} {u.Apellidos}",
                u.CorreoElectronico,
                u.Rol.Nombre,
                u.ProgramaAcademicoId,
                u.ProgramaAcademico != null ? u.ProgramaAcademico.Nombre : null
            ))
            .ToListAsync();

        return Ok(RespuestaApi<List<UsuarioDemoDto>>.RespuestaExitosa(usuarios));
    }

    /// <summary>
    /// Inicia sesión y genera el token JWT con los roles y el programa académico del usuario.
    /// </summary>
    [HttpPost("iniciar-sesion")]
    [ProducesResponseType(typeof(RespuestaApi<RespuestaAutenticacionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(RespuestaApi<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> IniciarSesion([FromBody] SolicitudInicioSesionDto solicitud)
    {
        var usuario = await _contexto.Usuarios
            .Include(u => u.Rol)
            .Include(u => u.ProgramaAcademico)
            .FirstOrDefaultAsync(u => u.CorreoElectronico == solicitud.CorreoElectronico && u.EstaActivo);

        if (usuario == null || usuario.ClaveHash != solicitud.Clave)
        {
            return Unauthorized(RespuestaApi<object>.RespuestaError("Credenciales inválidas. Correo o contraseña incorrectos."));
        }

        var token = GenerarJwtToken(usuario);

        var respuesta = new RespuestaAutenticacionDto(
            usuario.Id,
            $"{usuario.Nombres} {usuario.Apellidos}",
            usuario.CorreoElectronico,
            usuario.Rol.Nombre,
            token,
            DateTime.UtcNow.AddHours(Convert.ToDouble(_configuracion["Jwt:ExpiryInHours"] ?? "8")),
            usuario.ProgramaAcademicoId,
            usuario.ProgramaAcademico?.Nombre
        );

        return Ok(RespuestaApi<RespuestaAutenticacionDto>.RespuestaExitosa(respuesta, "Inicio de sesión exitoso."));
    }

    private string GenerarJwtToken(Core.Entities.Usuario usuario)
    {
        var jwtSecret = _configuracion["Jwt:SecretKey"] ?? "ClaveSecretaDeSuperSeguridadAssessmentSystem2026_Minimo32Caracteres!";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var credenciales = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var reclamos = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, usuario.CorreoElectronico),
            new(ClaimTypes.Name, $"{usuario.Nombres} {usuario.Apellidos}"),
            new(ClaimTypes.Role, usuario.Rol.Nombre)
        };

        if (usuario.ProgramaAcademicoId.HasValue)
        {
            reclamos.Add(new("ProgramaAcademicoId", usuario.ProgramaAcademicoId.Value.ToString()));
            if (usuario.ProgramaAcademico != null)
            {
                reclamos.Add(new("ProgramaAcademicoNombre", usuario.ProgramaAcademico.Nombre));
            }
        }

        var tokenDescriptor = new JwtSecurityToken(
            issuer: _configuracion["Jwt:Issuer"] ?? "AssessmentSystemAPI",
            audience: _configuracion["Jwt:Audience"] ?? "AssessmentSystemClients",
            claims: reclamos,
            expires: DateTime.UtcNow.AddHours(Convert.ToDouble(_configuracion["Jwt:ExpiryInHours"] ?? "8")),
            signingCredentials: credenciales
        );

        return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
    }
}
