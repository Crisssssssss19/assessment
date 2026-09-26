using AssessmentSystem.Business.DTOs.PlanAssessment;
using FluentValidation;

namespace AssessmentSystem.Business.Validators;

public class CrearPlanAssessmentDtoValidador : AbstractValidator<CrearPlanAssessmentDto>
{
    private const int CantidadIndicadoresRequeridos = 3;

    public CrearPlanAssessmentDtoValidador()
    {
        RuleFor(x => x.PeriodoAcademicoId)
            .NotEmpty().WithMessage("El ID del período académico es obligatorio.");

        RuleFor(x => x.Asignaturas)
            .NotNull().WithMessage("La lista de asignaturas no puede ser nula.")
            .Must(c => c != null && c.Count == 21).WithMessage("El plan debe contener exactamente 21 asignaturas.");

        RuleForEach(x => x.Asignaturas).ChildRules(asignatura =>
        {
            asignatura.RuleFor(c => c.ResultadoAprendizajeId)
                .NotEmpty().WithMessage("El Resultado de Aprendizaje es obligatorio.");

            asignatura.RuleFor(c => c.AsignaturaId)
                .NotEmpty().WithMessage("La asignatura es obligatoria.");

            asignatura.RuleFor(c => c.Semestre)
                .InclusiveBetween(1, 12).WithMessage("El semestre del curso debe estar entre 1 y 12.");

            asignatura.RuleFor(c => c.MetaLogroPorcentaje)
                .InclusiveBetween(1.0, 100.0).WithMessage("La meta de logro debe ser un porcentaje válido entre 1% y 100%.");

            asignatura.RuleFor(c => c.DocenteId)
                .NotEmpty().WithMessage("El docente asignado es obligatorio.");

            asignatura.RuleFor(c => c.LiderCalidadRaId)
                .NotEmpty().WithMessage("El Líder de Calidad del RA (supervisor) es obligatorio.");

            asignatura.RuleFor(c => c.RolEvaluacion)
                .IsInEnum().WithMessage("El rol de evaluación debe ser Formativa1, Formativa2 o Sumativa.");

            asignatura.RuleFor(c => c.Indicadores)
                .NotNull().WithMessage("La lista de indicadores de desempeño es obligatoria.")
                .Must(i => i != null && i.Count == CantidadIndicadoresRequeridos)
                .WithMessage($"Cada asignatura debe incluir exactamente {CantidadIndicadoresRequeridos} indicadores de desempeño.");

            asignatura.RuleForEach(c => c.Indicadores).ChildRules(indicador =>
            {
                indicador.RuleFor(i => i.Codigo)
                    .NotEmpty().WithMessage("El código del indicador es obligatorio (ej. ID1, ID2, ID3).")
                    .MaximumLength(20).WithMessage("El código del indicador no debe exceder 20 caracteres.");

                indicador.RuleFor(i => i.Descripcion)
                    .NotEmpty().WithMessage("La descripción del indicador es obligatoria.")
                    .MaximumLength(1000).WithMessage("La descripción del indicador no debe superar los 1000 caracteres.");
            });
        });
    }
}
