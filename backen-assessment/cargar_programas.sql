USE [AssessmentDb];
GO

IF OBJECT_ID(N'[ProgramasAcademicos]') IS NULL
BEGIN
    CREATE TABLE [ProgramasAcademicos] (
        [Id] uniqueidentifier NOT NULL,
        [Codigo] nvarchar(20) NOT NULL,
        [Nombre] nvarchar(150) NOT NULL,
        [Facultad] nvarchar(150) NOT NULL,
        [FechaCreacion] datetime2 NOT NULL,
        [FechaActualizacion] datetime2 NULL,
        [EstaActivo] bit NOT NULL,
        CONSTRAINT [PK_ProgramasAcademicos] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_ProgramasAcademicos_Codigo] ON [ProgramasAcademicos] ([Codigo]);
END;
GO

-- Inserción / Actualización con prefijo N para Unicode UTF-16 de los 10 Programas de Ingeniería
IF NOT EXISTS (SELECT 1 FROM ProgramasAcademicos WHERE Codigo = 'ING-AGRO')
    INSERT INTO ProgramasAcademicos (Id, Codigo, Nombre, Facultad, FechaCreacion, EstaActivo)
    VALUES (NEWID(), 'ING-AGRO', N'Ingeniería Agronómica', N'Facultad de Ingeniería', GETUTCDATE(), 1);
ELSE
    UPDATE ProgramasAcademicos SET Nombre = N'Ingeniería Agronómica', Facultad = N'Facultad de Ingeniería' WHERE Codigo = 'ING-AGRO';

IF NOT EXISTS (SELECT 1 FROM ProgramasAcademicos WHERE Codigo = 'ING-PESQ')
    INSERT INTO ProgramasAcademicos (Id, Codigo, Nombre, Facultad, FechaCreacion, EstaActivo)
    VALUES (NEWID(), 'ING-PESQ', N'Ingeniería Pesquera', N'Facultad de Ingeniería', GETUTCDATE(), 1);
ELSE
    UPDATE ProgramasAcademicos SET Nombre = N'Ingeniería Pesquera', Facultad = N'Facultad de Ingeniería' WHERE Codigo = 'ING-PESQ';

IF NOT EXISTS (SELECT 1 FROM ProgramasAcademicos WHERE Codigo = 'ING-SIST')
    INSERT INTO ProgramasAcademicos (Id, Codigo, Nombre, Facultad, FechaCreacion, EstaActivo)
    VALUES (NEWID(), 'ING-SIST', N'Ingeniería de Sistemas', N'Facultad de Ingeniería', GETUTCDATE(), 1);
ELSE
    UPDATE ProgramasAcademicos SET Nombre = N'Ingeniería de Sistemas', Facultad = N'Facultad de Ingeniería' WHERE Codigo = 'ING-SIST';

IF NOT EXISTS (SELECT 1 FROM ProgramasAcademicos WHERE Codigo = 'ING-CIVIL')
    INSERT INTO ProgramasAcademicos (Id, Codigo, Nombre, Facultad, FechaCreacion, EstaActivo)
    VALUES (NEWID(), 'ING-CIVIL', N'Ingeniería Civil', N'Facultad de Ingeniería', GETUTCDATE(), 1);
ELSE
    UPDATE ProgramasAcademicos SET Nombre = N'Ingeniería Civil', Facultad = N'Facultad de Ingeniería' WHERE Codigo = 'ING-CIVIL';

IF NOT EXISTS (SELECT 1 FROM ProgramasAcademicos WHERE Codigo = 'ING-IND')
    INSERT INTO ProgramasAcademicos (Id, Codigo, Nombre, Facultad, FechaCreacion, EstaActivo)
    VALUES (NEWID(), 'ING-IND', N'Ingeniería Industrial', N'Facultad de Ingeniería', GETUTCDATE(), 1);
ELSE
    UPDATE ProgramasAcademicos SET Nombre = N'Ingeniería Industrial', Facultad = N'Facultad de Ingeniería' WHERE Codigo = 'ING-IND';

IF NOT EXISTS (SELECT 1 FROM ProgramasAcademicos WHERE Codigo = 'ING-AMB')
    INSERT INTO ProgramasAcademicos (Id, Codigo, Nombre, Facultad, FechaCreacion, EstaActivo)
    VALUES (NEWID(), 'ING-AMB', N'Ingeniería Ambiental y Sanitaria', N'Facultad de Ingeniería', GETUTCDATE(), 1);
ELSE
    UPDATE ProgramasAcademicos SET Nombre = N'Ingeniería Ambiental y Sanitaria', Facultad = N'Facultad de Ingeniería' WHERE Codigo = 'ING-AMB';

IF NOT EXISTS (SELECT 1 FROM ProgramasAcademicos WHERE Codigo = 'ING-ELEC')
    INSERT INTO ProgramasAcademicos (Id, Codigo, Nombre, Facultad, FechaCreacion, EstaActivo)
    VALUES (NEWID(), 'ING-ELEC', N'Ingeniería Electrónica', N'Facultad de Ingeniería', GETUTCDATE(), 1);
ELSE
    UPDATE ProgramasAcademicos SET Nombre = N'Ingeniería Electrónica', Facultad = N'Facultad de Ingeniería' WHERE Codigo = 'ING-ELEC';

IF NOT EXISTS (SELECT 1 FROM ProgramasAcademicos WHERE Codigo = 'ING-MAR')
    INSERT INTO ProgramasAcademicos (Id, Codigo, Nombre, Facultad, FechaCreacion, EstaActivo)
    VALUES (NEWID(), 'ING-MAR', N'Ingeniería Marino Costera', N'Facultad de Ingeniería', GETUTCDATE(), 1);
ELSE
    UPDATE ProgramasAcademicos SET Nombre = N'Ingeniería Marino Costera', Facultad = N'Facultad de Ingeniería' WHERE Codigo = 'ING-MAR';

IF NOT EXISTS (SELECT 1 FROM ProgramasAcademicos WHERE Codigo = 'ING-DATOS')
    INSERT INTO ProgramasAcademicos (Id, Codigo, Nombre, Facultad, FechaCreacion, EstaActivo)
    VALUES (NEWID(), 'ING-DATOS', N'Ingeniería en Ciencia de Datos', N'Facultad de Ingeniería', GETUTCDATE(), 1);
ELSE
    UPDATE ProgramasAcademicos SET Nombre = N'Ingeniería en Ciencia de Datos', Facultad = N'Facultad de Ingeniería' WHERE Codigo = 'ING-DATOS';

IF NOT EXISTS (SELECT 1 FROM ProgramasAcademicos WHERE Codigo = 'ING-ENERG')
    INSERT INTO ProgramasAcademicos (Id, Codigo, Nombre, Facultad, FechaCreacion, EstaActivo)
    VALUES (NEWID(), 'ING-ENERG', N'Ingeniería Energética', N'Facultad de Ingeniería', GETUTCDATE(), 1);
ELSE
    UPDATE ProgramasAcademicos SET Nombre = N'Ingeniería Energética', Facultad = N'Facultad de Ingeniería' WHERE Codigo = 'ING-ENERG';

GO

-- Actualizar columna ProgramaAcademicoId en PlanesAssessment si no existe
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'ProgramaAcademicoId' AND Object_ID = Object_ID(N'PlanesAssessment'))
BEGIN
    ALTER TABLE [PlanesAssessment] ADD [ProgramaAcademicoId] uniqueidentifier NULL;
    ALTER TABLE [PlanesAssessment] ADD CONSTRAINT [FK_PlanesAssessment_ProgramasAcademicos_ProgramaAcademicoId] FOREIGN KEY ([ProgramaAcademicoId]) REFERENCES [ProgramasAcademicos] ([Id]);
END;
GO
