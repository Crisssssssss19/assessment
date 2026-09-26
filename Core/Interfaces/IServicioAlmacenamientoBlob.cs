namespace AssessmentSystem.Core.Interfaces;

public interface IServicioAlmacenamientoBlob
{
    Task<string> CargarArchivoAsync(Stream flujoArchivo, string nombreArchivo, string tipoContenido, string nombreContenedor);
    Task<Stream> DescargarArchivoAsync(string uriBlob, string nombreContenedor);
    Task<bool> EliminarArchivoAsync(string uriBlob, string nombreContenedor);
}
