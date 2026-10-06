namespace AssessmentSystem.Business.DTOs.Comun;

public class RespuestaApi<T>
{
    public bool Exitoso { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public T? Datos { get; set; }
    public List<string>? Errores { get; set; }

    public static RespuestaApi<T> RespuestaExitosa(T datos, string mensaje = "Operación exitosa")
    {
        return new RespuestaApi<T>
        {
            Exitoso = true,
            Mensaje = mensaje,
            Datos = datos
        };
    }

    public static RespuestaApi<T> RespuestaError(string mensaje, List<string>? errores = null)
    {
        return new RespuestaApi<T>
        {
            Exitoso = false,
            Mensaje = mensaje,
            Errores = errores
        };
    }
}
