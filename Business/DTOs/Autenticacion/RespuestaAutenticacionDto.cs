namespace AssessmentSystem.Business.DTOs.Autenticacion;

public record RespuestaAutenticacionDto(
    Guid Id,
    string NombreCompleto,
    string CorreoElectronico,
    string Rol,
    string Token,
    DateTime ExpiraEn,
    Guid? ProgramaAcademicoId = null,
    string? NombrePrograma = null
);
