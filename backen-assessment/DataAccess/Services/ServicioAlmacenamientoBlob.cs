using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using AssessmentSystem.Core.Exceptions;
using AssessmentSystem.Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace AssessmentSystem.DataAccess.Services;

public class ServicioAlmacenamientoBlob : IServicioAlmacenamientoBlob
{
    private readonly BlobServiceClient _clienteServicioBlob;
    private const long TamanoMaximoBytes = 15 * 1024 * 1024; // 15 MB
    private static readonly string[] ExtensionesPermitidas = { ".pdf", ".docx" };
    private static readonly string[] TiposMimePermitidos =
    {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };

    public ServicioAlmacenamientoBlob(IConfiguration configuracion)
    {
        var cadenaConexion = configuracion.GetConnectionString("AzureBlobStorage")
                             ?? "UseDevelopmentStorage=true";
        _clienteServicioBlob = new BlobServiceClient(cadenaConexion);
    }

    public async Task<string> CargarArchivoAsync(Stream flujoArchivo, string nombreArchivo, string tipoContenido, string nombreContenedor)
    {
        if (flujoArchivo.Length > TamanoMaximoBytes)
        {
            throw new ReglaNegocioException("El archivo excede el tamaño máximo permitido de 15MB.");
        }

        var extension = Path.GetExtension(nombreArchivo).ToLowerInvariant();
        if (!ExtensionesPermitidas.Contains(extension) || !TiposMimePermitidos.Contains(tipoContenido.ToLowerInvariant()))
        {
            throw new ReglaNegocioException("Formato no permitido. Solo se aceptan archivos PDF (.pdf) y Word (.docx).");
        }

        var clienteContenedor = _clienteServicioBlob.GetBlobContainerClient(nombreContenedor.ToLowerInvariant());
        await clienteContenedor.CreateIfNotExistsAsync(PublicAccessType.None);

        var nombreUnicoBlob = $"{Guid.NewGuid()}_{Path.GetFileName(nombreArchivo)}";
        var clienteBlob = clienteContenedor.GetBlobClient(nombreUnicoBlob);

        flujoArchivo.Position = 0;
        var opcionesCarga = new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = tipoContenido }
        };

        await clienteBlob.UploadAsync(flujoArchivo, opcionesCarga);
        return clienteBlob.Uri.ToString();
    }

    public async Task<Stream> DescargarArchivoAsync(string uriBlob, string nombreContenedor)
    {
        var uri = new Uri(uriBlob);
        var nombreBlob = Path.GetFileName(uri.LocalPath);
        var clienteContenedor = _clienteServicioBlob.GetBlobContainerClient(nombreContenedor.ToLowerInvariant());
        var clienteBlob = clienteContenedor.GetBlobClient(nombreBlob);

        if (!await clienteBlob.ExistsAsync())
        {
            throw new NoEncontradoException("El archivo solicitado no se encuentra en el almacenamiento.");
        }

        var resultadoDescarga = await clienteBlob.DownloadStreamingAsync();
        return resultadoDescarga.Value.Content;
    }

    public async Task<bool> EliminarArchivoAsync(string uriBlob, string nombreContenedor)
    {
        var uri = new Uri(uriBlob);
        var nombreBlob = Path.GetFileName(uri.LocalPath);
        var clienteContenedor = _clienteServicioBlob.GetBlobContainerClient(nombreContenedor.ToLowerInvariant());
        var clienteBlob = clienteContenedor.GetBlobClient(nombreBlob);

        return await clienteBlob.DeleteIfExistsAsync();
    }
}
