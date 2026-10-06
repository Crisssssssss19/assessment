namespace AssessmentSystem.Core.Entities;

public class ResultadoAprendizaje : EntidadBase
{
    public string Codigo { get; set; } = string.Empty; // RA1, RA2, ..., RA7
    public string Nombre { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public ICollection<AsignaturaPlanAssessment> AsignaturasPlan { get; set; } = new List<AsignaturaPlanAssessment>();
}
