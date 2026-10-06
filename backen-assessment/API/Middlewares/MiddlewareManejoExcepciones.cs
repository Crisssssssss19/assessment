using System.Net;
using System.Text.Json;
using AssessmentSystem.Business.DTOs.Comun;
using AssessmentSystem.Core.Exceptions;

namespace AssessmentSystem.API.Middlewares;

public class MiddlewareManejoExcepciones
{
    private readonly RequestDelegate _siguiente;
    private readonly ILogger<MiddlewareManejoExcepciones> _logger;

    public MiddlewareManejoExcepciones(RequestDelegate siguiente, ILogger<MiddlewareManejoExcepciones> logger)
    {
        _siguiente = siguiente;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext contexto)
    {
        try
        {
            await _siguiente(contexto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando la solicitud: {Mensaje}", ex.Message);
            await ManejarExcepcionAsync(contexto, ex);
        }
    }

    private static Task ManejarExcepcionAsync(HttpContext contexto, Exception excepcion)
    {
        var codigoEstado = excepcion switch
        {
            NoEncontradoException => HttpStatusCode.NotFound,
            ReglaNegocioException => HttpStatusCode.BadRequest,
            UnauthorizedAccessException => HttpStatusCode.Unauthorized,
            _ => HttpStatusCode.InternalServerError
        };

        var respuesta = RespuestaApi<object>.RespuestaError(
            excepcion is Exception ? excepcion.Message : "Ocurrió un error interno en el servidor."
        );

        contexto.Response.ContentType = "application/json";
        contexto.Response.StatusCode = (int)codigoEstado;

        return contexto.Response.WriteAsync(JsonSerializer.Serialize(respuesta));
    }
}
