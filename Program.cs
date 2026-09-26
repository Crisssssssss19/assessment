using AssessmentSystem.API.Extensions;
using AssessmentSystem.API.Middlewares;
using AssessmentSystem.Business.Interfaces;
using AssessmentSystem.Business.Services;
using AssessmentSystem.Business.Validators;
using AssessmentSystem.Core.Interfaces;
using AssessmentSystem.DataAccess.Context;
using AssessmentSystem.DataAccess.Repositories;
using AssessmentSystem.DataAccess.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuración de Base de Datos (SQL Server)
builder.Services.AddDbContext<ContextoAplicacionDb>(opciones =>
    opciones.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Registro de Inyección de Dependencias (IoC)
builder.Services.AddScoped<IUnidadDeTrabajo, UnidadDeTrabajo>();
builder.Services.AddScoped(typeof(IRepositorio<>), typeof(Repositorio<>));
builder.Services.AddScoped<IServicioAlmacenamientoBlob, ServicioAlmacenamientoBlob>();
builder.Services.AddScoped<IServicioPlanAssessment, ServicioPlanAssessment>();
builder.Services.AddScoped<IServicioMedicion, ServicioMedicion>();
builder.Services.AddScoped<IServicioEvidencia, ServicioEvidencia>();

// 3. Autenticación JWT y Autorización RBAC
builder.Services.AgregarAutenticacionJwt(builder.Configuration);

// 4. Configuración de CORS
builder.Services.AddCors(opciones =>
{
    opciones.AddPolicy("PermitirFrontend", politica =>
    {
        politica.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
    });
});

// 5. Configuración de Controladores, Validación y Swagger
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CrearPlanAssessmentDtoValidador>();
builder.Services.AgregarDocumentacionSwagger();

var app = builder.Build();

// 6. Inicialización y Sembrado de Datos
try
{
    await InicializadorDatosDb.InicializarAsync(app.Services);
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogWarning(ex, "Aviso: No se pudo conectar a la base de datos para sembrar datos en el arranque (verifique que SQL Server esté activo).");
}

// 7. Pipeline HTTP
app.UseMiddleware<MiddlewareManejoExcepciones>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "API del Sistema de Assessment v1");
        c.RoutePrefix = string.Empty; // Servir Swagger en la raíz "/"
    });
}

app.UseCors("PermitirFrontend");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
