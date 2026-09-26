USE [AssessmentDb];
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'ProgramaAcademicoId' AND Object_ID = Object_ID(N'Usuarios'))
BEGIN
    ALTER TABLE [Usuarios] ADD [ProgramaAcademicoId] uniqueidentifier NULL;
    ALTER TABLE [Usuarios] ADD CONSTRAINT [FK_Usuarios_ProgramasAcademicos_ProgramaAcademicoId] FOREIGN KEY ([ProgramaAcademicoId]) REFERENCES [ProgramasAcademicos] ([Id]);
END;
GO

-- Asociar al usuario lider.programa@unimagdalena.edu.co con Ingeniería de Sistemas (ING-SIST)
DECLARE @IdSistemas UNIQUEIDENTIFIER = (SELECT Id FROM ProgramasAcademicos WHERE Codigo = 'ING-SIST');
UPDATE Usuarios 
SET ProgramaAcademicoId = @IdSistemas 
WHERE CorreoElectronico = 'lider.programa@unimagdalena.edu.co';
GO
