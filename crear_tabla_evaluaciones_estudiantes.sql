USE [AssessmentDb];
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'EvaluacionesEstudiantes')
BEGIN
    CREATE TABLE [EvaluacionesEstudiantes] (
        [Id] uniqueidentifier NOT NULL,
        [MedicionId] uniqueidentifier NOT NULL,
        [CodigoEstudiante] nvarchar(50) NOT NULL,
        [NombreEstudiante] nvarchar(200) NOT NULL,
        [Calificacion] decimal(5,2) NOT NULL,
        [NombreArchivoEvidencia] nvarchar(255) NULL,
        [UriBlobEvidencia] nvarchar(1000) NULL,
        [TipoContenidoEvidencia] nvarchar(100) NULL,
        [TamanoArchivoBytes] bigint NULL,
        [Observaciones] nvarchar(1000) NULL,
        [EstaActivo] bit NOT NULL DEFAULT 1,
        [FechaCreacion] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        [FechaModificacion] datetime2 NULL,
        CONSTRAINT [PK_EvaluacionesEstudiantes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_EvaluacionesEstudiantes_Mediciones_MedicionId] FOREIGN KEY ([MedicionId]) REFERENCES [Mediciones] ([Id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_EvaluacionesEstudiantes_MedicionId] ON [EvaluacionesEstudiantes] ([MedicionId]);
END;
GO
