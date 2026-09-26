using AssessmentSystem.Business.DTOs.Medicion;
using FluentValidation;

namespace AssessmentSystem.Business.Validators;

public class CrearMedicionDtoValidador : AbstractValidator<CrearMedicionDto>
{
    public CrearMedicionDtoValidador()
    {
        RuleFor(x => x.AsignaturaPlanAssessmentId)
            .NotEmpty().WithMessage("La asignación de la asignatura es obligatoria.");

        RuleFor(x => x.CantidadNivel0a59)
            .GreaterThanOrEqualTo(0).WithMessage("La cantidad de estudiantes en el nivel 0-59% no puede ser negativa.");

        RuleFor(x => x.CantidadNivel60a69)
            .GreaterThanOrEqualTo(0).WithMessage("La cantidad de estudiantes en el nivel 60-69% no puede ser negativa.");

        RuleFor(x => x.CantidadNivel70a89)
            .GreaterThanOrEqualTo(0).WithMessage("La cantidad de estudiantes en el nivel 70-89% no puede ser negativa.");

        RuleFor(x => x.CantidadNivel90a100)
            .GreaterThanOrEqualTo(0).WithMessage("La cantidad de estudiantes en el nivel 90-100% no puede ser negativa.");

        RuleFor(x => x)
            .Must(x => (x.CantidadNivel0a59 + x.CantidadNivel60a69 + x.CantidadNivel70a89 + x.CantidadNivel90a100) > 0)
            .WithMessage("Debe registrar al menos un estudiante evaluado.");

        RuleFor(x => x.AnalisisCualitativo)
            .NotEmpty().WithMessage("El análisis cualitativo es obligatorio.")
            .MaximumLength(4000).WithMessage("El análisis cualitativo no debe superar los 4000 caracteres.");

        RuleFor(x => x.PlanMejora)
            .NotEmpty().WithMessage("El plan de mejora es obligatorio.")
            .MaximumLength(4000).WithMessage("El plan de mejora no debe superar los 4000 caracteres.");
    }
}
