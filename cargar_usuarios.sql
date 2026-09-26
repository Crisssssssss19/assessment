USE [AssessmentDb];
GO

-- 1. Asegurar la existencia de Roles
IF NOT EXISTS (SELECT 1 FROM Roles WHERE Nombre = 'Decano')
    INSERT INTO Roles (Id, Nombre, Descripcion, FechaCreacion, EstaActivo)
    VALUES (NEWID(), 'Decano', 'Decano o Decana de Facultad', GETUTCDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Roles WHERE Nombre = 'LiderCalidadFacultad')
    INSERT INTO Roles (Id, Nombre, Descripcion, FechaCreacion, EstaActivo)
    VALUES (NEWID(), 'LiderCalidadFacultad', 'Líder de Calidad de la Facultad', GETUTCDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Roles WHERE Nombre = 'LiderPrograma')
    INSERT INTO Roles (Id, Nombre, Descripcion, FechaCreacion, EstaActivo)
    VALUES (NEWID(), 'LiderPrograma', 'Líder / Director del Programa Académico', GETUTCDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Roles WHERE Nombre = 'LiderCalidadRA')
    INSERT INTO Roles (Id, Nombre, Descripcion, FechaCreacion, EstaActivo)
    VALUES (NEWID(), 'LiderCalidadRA', 'Líder de Calidad por Resultado de Aprendizaje', GETUTCDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Roles WHERE Nombre = 'Docente')
    INSERT INTO Roles (Id, Nombre, Descripcion, FechaCreacion, EstaActivo)
    VALUES (NEWID(), 'Docente', 'Docente / Profesor a cargo de asignaturas', GETUTCDATE(), 1);

-- 2. Variables para almacenar los IDs de Roles
DECLARE @RolDecano UNIQUEIDENTIFIER = (SELECT Id FROM Roles WHERE Nombre = 'Decano');
DECLARE @RolCalidadFacultad UNIQUEIDENTIFIER = (SELECT Id FROM Roles WHERE Nombre = 'LiderCalidadFacultad');
DECLARE @RolLiderPrograma UNIQUEIDENTIFIER = (SELECT Id FROM Roles WHERE Nombre = 'LiderPrograma');
DECLARE @RolCalidadRA UNIQUEIDENTIFIER = (SELECT Id FROM Roles WHERE Nombre = 'LiderCalidadRA');
DECLARE @RolDocente UNIQUEIDENTIFIER = (SELECT Id FROM Roles WHERE Nombre = 'Docente');

-- 3. Asegurar la existencia de la Decana
IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE CorreoElectronico = 'decano@unimagdalena.edu.co')
    INSERT INTO Usuarios (Id, Nombres, Apellidos, CorreoElectronico, ClaveHash, RolId, ProgramaAcademicoId, FechaCreacion, EstaActivo)
    VALUES (NEWID(), 'María', 'González (Decana)', 'decano@unimagdalena.edu.co', 'Clave123!', @RolDecano, NULL, GETUTCDATE(), 1);
ELSE
    UPDATE Usuarios SET RolId = @RolDecano, ProgramaAcademicoId = NULL WHERE CorreoElectronico = 'decano@unimagdalena.edu.co';

-- 4. Eliminar usuarios antiguos de prueba (conservando solo la Decana)
DELETE FROM Usuarios WHERE CorreoElectronico <> 'decano@unimagdalena.edu.co';

-- 5. Insertar la nueva lista limpia de Docentes de la Facultad de Ingeniería
DECLARE @DocentesList TABLE (Nombres NVARCHAR(100), Apellidos NVARCHAR(100), Correo NVARCHAR(150));
INSERT INTO @DocentesList VALUES
('Gabriel', 'García', 'ggarcia@unimagdalena.edu.co'),
('Adriana', 'Vives', 'avives@unimagdalena.edu.co'),
('Rafael', 'De la Hoz', 'rdelahoz@unimagdalena.edu.co'),
('Marcela', 'Blanco', 'mblanco@unimagdalena.edu.co'),
('Felipe', 'Orozco', 'forozco@unimagdalena.edu.co'),
('Valentina', 'Restrepo', 'vrestrepo@unimagdalena.edu.co'),
('Juan Camilo', 'Daza', 'jdaza@unimagdalena.edu.co'),
('Paola', 'Ceballos', 'pceballos@unimagdalena.edu.co'),
('Sergio', 'Mercado', 'smercado@unimagdalena.edu.co'),
('Diana', 'Barrientos', 'dbarrientos@unimagdalena.edu.co'),
('Carlos', 'Pardo', 'cpardo@unimagdalena.edu.co'),
('Lina', 'Montaño', 'lmontano@unimagdalena.edu.co'),
('Mateo', 'Caicedo', 'mcaicedo@unimagdalena.edu.co'),
('Natalia', 'Echeverri', 'necheverri@unimagdalena.edu.co'),
('Leonardo', 'Samper', 'lsamper@unimagdalena.edu.co');

DECLARE @Nombres NVARCHAR(100), @Apellidos NVARCHAR(100), @Correo NVARCHAR(150);
DECLARE doc_cursor CURSOR FOR SELECT Nombres, Apellidos, Correo FROM @DocentesList;

OPEN doc_cursor;
FETCH NEXT FROM doc_cursor INTO @Nombres, @Apellidos, @Correo;

WHILE @@FETCH_STATUS = 0
BEGIN
    INSERT INTO Usuarios (Id, Nombres, Apellidos, CorreoElectronico, ClaveHash, RolId, ProgramaAcademicoId, FechaCreacion, EstaActivo)
    VALUES (NEWID(), @Nombres, @Apellidos, @Correo, 'Clave123!', @RolDocente, NULL, GETUTCDATE(), 1);

    FETCH NEXT FROM doc_cursor INTO @Nombres, @Apellidos, @Correo;
END;

CLOSE doc_cursor;
DEALLOCATE doc_cursor;

GO

GO
