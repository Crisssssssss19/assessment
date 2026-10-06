using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace AssessmentSystem.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public abstract class ControladorApiBase : ControllerBase
{
    protected Guid UsuarioActualId
    {
        get
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(claim, out var guid) ? guid : Guid.Empty;
        }
    }
}
