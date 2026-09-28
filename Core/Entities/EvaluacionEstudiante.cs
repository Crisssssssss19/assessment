namespace AssessmentSystem.Core.Entities;

public class EvaluacionEstudiante : EntidadBase
{
    public Guid MedicionId { get; set; }
    public Medicion Medicion { get; set; } = null!;

    public string CodigoEstudiante { get; set; } = string.Empty;
    public string NombreEstudiante { get; set; } = string.Empty;
    public decimal Calificacion { get; set; }

    // Archivo de evidencia individual (Examen / Evaluación calificada)
    public string? NombreArchivoEvidencia { get; set; }
    public string? UriBlobEvidencia { get; set; }
    public string? TipoContenidoEvidencia { get; set; }
    public long? TamanoArchivoBytes { get; set; }

    public string? Observaciones { get; set; }
}
