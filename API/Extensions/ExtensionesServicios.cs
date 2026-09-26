using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

namespace AssessmentSystem.API.Extensions;

public static class ExtensionesServicios
{
    public static IServiceCollection AgregarAutenticacionJwt(this IServiceCollection servicios, IConfiguration configuracion)
    {
        var claveSecreta = configuracion["Jwt:SecretKey"] ?? "ClaveSecretaDeSuperSeguridadAssessmentSystem2026_Minimo32Caracteres!";
        var emisor = configuracion["Jwt:Issuer"] ?? "AssessmentSystemAPI";
        var audiencia = configuracion["Jwt:Audience"] ?? "AssessmentSystemClients";

        servicios.AddAuthentication(opciones =>
        {
            opciones.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            opciones.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(opciones =>
        {
            opciones.RequireHttpsMetadata = false;
            opciones.SaveToken = true;
            opciones.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(claveSecreta)),
                ValidateIssuer = true,
                ValidIssuer = emisor,
                ValidateAudience = true,
                ValidAudience = audiencia,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        servicios.AddAuthorization();
        return servicios;
    }

    public static IServiceCollection AgregarDocumentacionSwagger(this IServiceCollection servicios)
    {
        servicios.AddEndpointsApiExplorer();
        servicios.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "API del Sistema de Assessment Académico",
                Version = "v1",
                Description = "API RESTful para la gestión institucional del Assessment Académico y Acreditación."
            });

            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "Cabecera de autorización JWT utilizando el esquema Bearer. Ejemplo: 'Bearer 12345abcdef'",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer"
            });

            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        return servicios;
    }
}
