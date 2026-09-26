namespace AssessmentSystem.Core.Entities;

public class Evidencia : EntidadBase
{
    public Guid MedicionId { get; set; }
    public Medicion Medicion { get; set; } = null!;

    public string NombreArchivo { get; set; } = string.Empty;
    public string UriBlob { get; set; } = string.Empty;
    public string TipoContenido { get; set; } = string.Empty;
    public long TamanoArchivoBytes { get; set; }
}
