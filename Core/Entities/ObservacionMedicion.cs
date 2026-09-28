using AssessmentSystem.Core.Enums;

namespace AssessmentSystem.Core.Entities;

public class ObservacionMedicion : EntidadBase
{
    public Guid MedicionId { get; set; }
    public Medicion Medicion { get; set; } = null!;

    public Guid UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public string RolEmisor { get; set; } = string.Empty; // "LiderCalidadRA" o "Docente"
    public string Contenido { get; set; } = string.Empty;
    public EstadoEvaluacion EstadoResultante { get; set; }
}
