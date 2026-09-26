namespace AssessmentSystem.Core.Entities;

public class IndicadorDesempeno : EntidadBase
{
    public Guid AsignaturaPlanAssessmentId { get; set; }
    public AsignaturaPlanAssessment AsignaturaPlanAssessment { get; set; } = null!;

    public string Codigo { get; set; } = string.Empty; // Ej. "ID1", "ID2", "ID3"
    public string Descripcion { get; set; } = string.Empty;
}
