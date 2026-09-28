USE [AssessmentDb];
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'ObservacionesMediciones')
BEGIN
    CREATE TABLE [ObservacionesMediciones] (
        [Id] uniqueidentifier NOT NULL,
        [MedicionId] uniqueidentifier NOT NULL,
        [UsuarioId] uniqueidentifier NOT NULL,
        [RolEmisor] nvarchar(50) NOT NULL,
        [Contenido] nvarchar(4000) NOT NULL,
        [EstadoResultante] int NOT NULL DEFAULT 0,
        [EstaActivo] bit NOT NULL DEFAULT 1,
        [FechaCreacion] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        [FechaModificacion] datetime2 NULL,
        CONSTRAINT [PK_ObservacionesMediciones] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ObservacionesMediciones_Mediciones_MedicionId] FOREIGN KEY ([MedicionId]) REFERENCES [Mediciones] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ObservacionesMediciones_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id])
    );

    CREATE INDEX [IX_ObservacionesMediciones_MedicionId] ON [ObservacionesMediciones] ([MedicionId]);
    CREATE INDEX [IX_ObservacionesMediciones_UsuarioId] ON [ObservacionesMediciones] ([UsuarioId]);
END;
GO
