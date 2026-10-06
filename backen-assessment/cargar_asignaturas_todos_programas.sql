USE [AssessmentDb];
GO

SET NOCOUNT ON;

PRINT '======================================================================';
PRINT '  INICIALIZACIÓN DE PROGRAMAS Y ASIGNATURAS - FACULTAD DE INGENIERÍA  ';
PRINT '                    UNIVERSIDAD DEL MAGDALENA                         ';
PRINT '======================================================================';
GO

-- 1. Asegurar la columna ProgramaAcademicoId en la tabla Asignaturas
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'ProgramaAcademicoId' AND Object_ID = Object_ID(N'Asignaturas'))
BEGIN
    ALTER TABLE [Asignaturas] ADD [ProgramaAcademicoId] uniqueidentifier NULL;
    ALTER TABLE [Asignaturas] ADD CONSTRAINT [FK_Asignaturas_ProgramasAcademicos_ProgramaAcademicoId] 
        FOREIGN KEY ([ProgramaAcademicoId]) REFERENCES [ProgramasAcademicos] ([Id]);
    PRINT 'Columna ProgramaAcademicoId y Llave Foránea creadas en tabla Asignaturas.';
END;
GO

-- 2. Asegurar que los 10 Programas Académicos de Ingeniería existan en la tabla ProgramasAcademicos
MERGE INTO [ProgramasAcademicos] AS Target
USING (VALUES
    ('ING-SIST', N'Ingeniería de Sistemas', N'Facultad de Ingeniería'),
    ('ING-CIVIL', N'Ingeniería Civil', N'Facultad de Ingeniería'),
    ('ING-IND', N'Ingeniería Industrial', N'Facultad de Ingeniería'),
    ('ING-ELEC', N'Ingeniería Electrónica', N'Facultad de Ingeniería'),
    ('ING-AMB', N'Ingeniería Ambiental y Sanitaria', N'Facultad de Ingeniería'),
    ('ING-AGRO', N'Ingeniería Agronómica', N'Facultad de Ingeniería'),
    ('ING-PESQ', N'Ingeniería Pesquera', N'Facultad de Ingeniería'),
    ('ING-MAR', N'Ingeniería Marino Costera', N'Facultad de Ingeniería'),
    ('ING-DATOS', N'Ingeniería en Ciencia de Datos', N'Facultad de Ingeniería'),
    ('ING-ENERG', N'Ingeniería Energética', N'Facultad de Ingeniería')
) AS Source ([Codigo], [Nombre], [Facultad])
ON (Target.[Codigo] = Source.[Codigo])
WHEN MATCHED THEN
    UPDATE SET Target.[Nombre] = Source.[Nombre], Target.[Facultad] = Source.[Facultad], Target.[EstaActivo] = 1
WHEN NOT MATCHED THEN
    INSERT ([Id], [Codigo], [Nombre], [Facultad], [FechaCreacion], [EstaActivo])
    VALUES (NEWID(), Source.[Codigo], Source.[Nombre], Source.[Facultad], GETUTCDATE(), 1);

PRINT '10 Programas de Ingeniería verificados y sincronizados.';
GO

-- Declarar variables de ID de cada Programa Académico para vincular las asignaturas
DECLARE @IdSistemas UNIQUEIDENTIFIER = (SELECT Id FROM ProgramasAcademicos WHERE Codigo = 'ING-SIST');
DECLARE @IdCivil UNIQUEIDENTIFIER = (SELECT Id FROM ProgramasAcademicos WHERE Codigo = 'ING-CIVIL');
DECLARE @IdIndustrial UNIQUEIDENTIFIER = (SELECT Id FROM ProgramasAcademicos WHERE Codigo = 'ING-IND');
DECLARE @IdElectronica UNIQUEIDENTIFIER = (SELECT Id FROM ProgramasAcademicos WHERE Codigo = 'ING-ELEC');
DECLARE @IdAmbiental UNIQUEIDENTIFIER = (SELECT Id FROM ProgramasAcademicos WHERE Codigo = 'ING-AMB');
DECLARE @IdAgronomica UNIQUEIDENTIFIER = (SELECT Id FROM ProgramasAcademicos WHERE Codigo = 'ING-AGRO');
DECLARE @IdPesquera UNIQUEIDENTIFIER = (SELECT Id FROM ProgramasAcademicos WHERE Codigo = 'ING-PESQ');
DECLARE @IdMarino UNIQUEIDENTIFIER = (SELECT Id FROM ProgramasAcademicos WHERE Codigo = 'ING-MAR');
DECLARE @IdDatos UNIQUEIDENTIFIER = (SELECT Id FROM ProgramasAcademicos WHERE Codigo = 'ING-DATOS');
DECLARE @IdEnergetica UNIQUEIDENTIFIER = (SELECT Id FROM ProgramasAcademicos WHERE Codigo = 'ING-ENERG');

-- Tabla temporal con el catálogo completo de asignaturas por programa
CREATE TABLE #TempCursos (
    Codigo NVARCHAR(50),
    Nombre NVARCHAR(200),
    Creditos INT,
    Semestre INT,
    ProgramaAcademicoId UNIQUEIDENTIFIER
);

-- =========================================================================
-- 1. INGENIERÍA DE SISTEMAS (ING-SIST)
-- =========================================================================
INSERT INTO #TempCursos VALUES
('SIS101', N'Introducción a la Ingeniería de Sistemas', 3, 1, @IdSistemas),
('SIS102', N'Algoritmos y Programación I', 4, 1, @IdSistemas),
('SIS201', N'Programación Orientada a Objetos', 4, 2, @IdSistemas),
('SIS202', N'Álgebra Lineal Computacional', 3, 2, @IdSistemas),
('SIS301', N'Estructuras de Datos', 4, 3, @IdSistemas),
('SIS302', N'Bases de Datos I', 3, 3, @IdSistemas),
('SIS401', N'Análisis y Diseño de Software', 4, 4, @IdSistemas),
('SIS402', N'Bases de Datos II', 3, 4, @IdSistemas),
('SIS501', N'Ingeniería de Requisitos', 3, 5, @IdSistemas),
('SIS502', N'Sistemas Operativos', 3, 5, @IdSistemas),
('SIS503', N'Redes de Computadores', 3, 5, @IdSistemas),
('SIS601', N'Arquitectura de Software', 3, 6, @IdSistemas),
('SIS602', N'Desarrollo Web y Cloud', 4, 6, @IdSistemas),
('SIS701', N'Calidad y Pruebas de Software', 3, 7, @IdSistemas),
('SIS702', N'Seguridad de la Información', 3, 7, @IdSistemas),
('SIS801', N'Gestión de Proyectos de TI', 3, 8, @IdSistemas),
('SIS802', N'Inteligencia Artificial', 3, 8, @IdSistemas),
('SIS901', N'Proyecto de Grado I - Sistemas', 4, 9, @IdSistemas),
('SIS902', N'Ética en Ingeniería y Legislación', 2, 9, @IdSistemas),
('SIS1001', N'Proyecto de Grado II - Sistemas', 4, 10, @IdSistemas),
('SIS1002', N'Práctica Profesional - Sistemas', 6, 10, @IdSistemas);

-- =========================================================================
-- 2. INGENIERÍA CIVIL (ING-CIVIL)
-- =========================================================================
INSERT INTO #TempCursos VALUES
('CIV101', N'Introducción a la Ingeniería Civil', 3, 1, @IdCivil),
('CIV102', N'Geometría Descriptiva y Dibujo', 3, 1, @IdCivil),
('CIV201', N'Topografía y Fotogrametría', 4, 2, @IdCivil),
('CIV202', N'Estática', 3, 2, @IdCivil),
('CIV301', N'Resistencia de Materiales I', 4, 3, @IdCivil),
('CIV302', N'Materiales de Construcción', 3, 3, @IdCivil),
('CIV401', N'Mecánica de Fluidos Civil', 4, 4, @IdCivil),
('CIV402', N'Análisis Estructural I', 4, 4, @IdCivil),
('CIV403', N'Mecánica de Suelos I', 4, 4, @IdCivil),
('CIV501', N'Hidráulica de Canales y Tuberías', 4, 5, @IdCivil),
('CIV502', N'Análisis Estructural II', 4, 5, @IdCivil),
('CIV503', N'Mecánica de Suelos II y Cimentaciones', 4, 5, @IdCivil),
('CIV601', N'Diseño en Concreto Reforzado', 4, 6, @IdCivil),
('CIV602', N'Hidrología y Recursos Hídricos', 3, 6, @IdCivil),
('CIV603', N'Ingeniería de Vías y Tránsito', 4, 6, @IdCivil),
('CIV701', N'Diseño de Estructuras Metálicas', 3, 7, @IdCivil),
('CIV702', N'Sistemas de Acueductos y Alcantarillados', 4, 7, @IdCivil),
('CIV703', N'Diseño de Pavimentos', 3, 7, @IdCivil),
('CIV801', N'Presupuesto y Programación de Obras', 3, 8, @IdCivil),
('CIV802', N'Plantas de Tratamiento de Agua', 3, 8, @IdCivil),
('CIV901', N'Proyecto de Grado I - Civil', 4, 9, @IdCivil),
('CIV902', N'Interventoría y Supervisión Técnica', 3, 9, @IdCivil),
('CIV1001', N'Proyecto de Grado II - Civil', 4, 10, @IdCivil),
('CIV1002', N'Práctica Profesional - Civil', 6, 10, @IdCivil);

-- =========================================================================
-- 3. INGENIERÍA INDUSTRIAL (ING-IND)
-- =========================================================================
INSERT INTO #TempCursos VALUES
('IND101', N'Introducción a la Ingeniería Industrial', 3, 1, @IdIndustrial),
('IND102', N'Química General e Industrial', 3, 1, @IdIndustrial),
('IND201', N'Dibujo Industrial y CAD', 3, 2, @IdIndustrial),
('IND202', N'Física Mecánica', 4, 2, @IdIndustrial),
('IND301', N'Probabilidad y Estadística Industrial', 4, 3, @IdIndustrial),
('IND302', N'Procesos Industriales I', 3, 3, @IdIndustrial),
('IND303', N'Contabilidad Financiera y de Costos', 3, 3, @IdIndustrial),
('IND401', N'Inferencia Estadística y Muestreo', 3, 4, @IdIndustrial),
('IND402', N'Estudio del Trabajo y Productividad', 4, 4, @IdIndustrial),
('IND403', N'Termodinámica Aplicada', 3, 4, @IdIndustrial),
('IND501', N'Investigación de Operaciones I', 4, 5, @IdIndustrial),
('IND502', N'Control Estadístico de la Calidad', 3, 5, @IdIndustrial),
('IND503', N'Seguridad y Salud en el Trabajo', 3, 5, @IdIndustrial),
('IND601', N'Investigación de Operaciones II', 4, 6, @IdIndustrial),
('IND602', N'Planificación y Control de la Producción', 4, 6, @IdIndustrial),
('IND603', N'Ergonomía y Factores Humanos', 3, 6, @IdIndustrial),
('IND701', N'Logística y Cadena de Suministro', 4, 7, @IdIndustrial),
('IND702', N'Ingeniería Económica y Financiera', 3, 7, @IdIndustrial),
('IND703', N'Simulación de Sistemas Productivos', 3, 7, @IdIndustrial),
('IND801', N'Formulación y Evaluación de Proyectos', 4, 8, @IdIndustrial),
('IND802', N'Manufactura Esbelta (Lean Manufacturing)', 3, 8, @IdIndustrial),
('IND901', N'Proyecto de Grado I - Industrial', 4, 9, @IdIndustrial),
('IND902', N'Gestión Ambiental y Sostenibilidad', 3, 9, @IdIndustrial),
('IND1001', N'Proyecto de Grado II - Industrial', 4, 10, @IdIndustrial),
('IND1002', N'Práctica Profesional - Industrial', 6, 10, @IdIndustrial);

-- =========================================================================
-- 4. INGENIERÍA ELECTRÓNICA (ING-ELEC)
-- =========================================================================
INSERT INTO #TempCursos VALUES
('ELE101', N'Introducción a la Ingeniería Electrónica', 3, 1, @IdElectronica),
('ELE102', N'Algoritmos para Ingeniería', 3, 1, @IdElectronica),
('ELE201', N'Circuitos Eléctricos I', 4, 2, @IdElectronica),
('ELE202', N'Física Electromagnética', 4, 2, @IdElectronica),
('ELE301', N'Circuitos Eléctricos II', 4, 3, @IdElectronica),
('ELE302', N'Dispositivos Semiconductores', 4, 3, @IdElectronica),
('ELE401', N'Circuitos Electrónicos I', 4, 4, @IdElectronica),
('ELE402', N'Señales y Sistemas Lineales', 3, 4, @IdElectronica),
('ELE403', N'Sistemas Lógicos Digitales', 4, 4, @IdElectronica),
('ELE501', N'Circuitos Electrónicos II', 4, 5, @IdElectronica),
('ELE502', N'Microcontroladores y Sistemas Embebidos', 4, 5, @IdElectronica),
('ELE503', N'Campos y Ondas Electromagnéticas', 3, 5, @IdElectronica),
('ELE601', N'Sistemas de Control Automático I', 4, 6, @IdElectronica),
('ELE602', N'Procesamiento Digital de Señales (DSP)', 3, 6, @IdElectronica),
('ELE603', N'Sistemas de Comunicaciones Analógicas', 3, 6, @IdElectronica),
('ELE701', N'Control Automático II y PLC', 3, 7, @IdElectronica),
('ELE702', N'Comunicaciones Digitales e Inalámbricas', 4, 7, @IdElectronica),
('ELE703', N'Instrumentación Electrónica y Sensores', 3, 7, @IdElectronica),
('ELE801', N'Robótica y Automatización Industrial', 4, 8, @IdElectronica),
('ELE802', N'Internet de las Cosas (IoT)', 3, 8, @IdElectronica),
('ELE803', N'Electrónica de Potencia', 3, 8, @IdElectronica),
('ELE901', N'Proyecto de Grado I - Electrónica', 4, 9, @IdElectronica),
('ELE1001', N'Proyecto de Grado II - Electrónica', 4, 10, @IdElectronica),
('ELE1002', N'Práctica Profesional - Electrónica', 6, 10, @IdElectronica);

-- =========================================================================
-- 5. INGENIERÍA AMBIENTAL Y SANITARIA (ING-AMB)
-- =========================================================================
INSERT INTO #TempCursos VALUES
('AMB101', N'Introducción a la Ingeniería Ambiental', 3, 1, @IdAmbiental),
('AMB102', N'Química Ambiental y de Laboratorio', 4, 1, @IdAmbiental),
('AMB201', N'Biología y Ecología General', 3, 2, @IdAmbiental),
('AMB202', N'Química Orgánica Ambiental', 3, 2, @IdAmbiental),
('AMB301', N'Microbiología Ambiental', 4, 3, @IdAmbiental),
('AMB302', N'Topografía y Cartografía Ambiental', 3, 3, @IdAmbiental),
('AMB401', N'Mecánica de Fluidos Ambiental', 4, 4, @IdAmbiental),
('AMB402', N'Fisicoquímica Ambiental', 3, 4, @IdAmbiental),
('AMB403', N'Geología y Edafología Ambiental', 3, 4, @IdAmbiental),
('AMB501', N'Hidrología y Climatología', 3, 5, @IdAmbiental),
('AMB502', N'Calidad y Análisis de Aguas', 4, 5, @IdAmbiental),
('AMB503', N'Control de Contaminación Atmosférica', 3, 5, @IdAmbiental),
('AMB601', N'Tratamiento y Potabilización de Aguas', 4, 6, @IdAmbiental),
('AMB602', N'Gestión Integral de Residuos Sólidos', 4, 6, @IdAmbiental),
('AMB603', N'Modelación y Calidad Ambiental', 3, 6, @IdAmbiental),
('AMB701', N'Tratamiento de Aguas Residuales', 4, 7, @IdAmbiental),
('AMB702', N'Evaluación de Impacto Ambiental (EIA)', 4, 7, @IdAmbiental),
('AMB703', N'Sistemas de Información Geográfica (SIG)', 3, 7, @IdAmbiental),
('AMB801', N'Gestión del Riesgo y Cambio Climático', 3, 8, @IdAmbiental),
('AMB802', N'Biorremediación y Recuperación de Suelos', 3, 8, @IdAmbiental),
('AMB901', N'Proyecto de Grado I - Ambiental', 4, 9, @IdAmbiental),
('AMB902', N'Auditoría y Normatividad Ambiental', 3, 9, @IdAmbiental),
('AMB1001', N'Proyecto de Grado II - Ambiental', 4, 10, @IdAmbiental),
('AMB1002', N'Práctica Profesional - Ambiental', 6, 10, @IdAmbiental);

-- =========================================================================
-- 6. INGENIERÍA AGRONÓMICA (ING-AGRO)
-- =========================================================================
INSERT INTO #TempCursos VALUES
('AGR101', N'Introducción a las Ciencias Agronómicas', 3, 1, @IdAgronomica),
('AGR102', N'Botánica General y Morfología', 3, 1, @IdAgronomica),
('AGR201', N'Botánica Sistemática y Taxonomía', 3, 2, @IdAgronomica),
('AGR202', N'Química de Suelos y Fertilizantes', 4, 2, @IdAgronomica),
('AGR301', N'Fisiología Vegetal', 4, 3, @IdAgronomica),
('AGR302', N'Edafología y Clasificación de Suelos', 4, 3, @IdAgronomica),
('AGR401', N'Nutrición Vegetal y Fertilización', 3, 4, @IdAgronomica),
('AGR402', N'Entomología Agrícola', 4, 4, @IdAgronomica),
('AGR403', N'Agrometeorología y Clima Tropical', 3, 4, @IdAgronomica),
('AGR501', N'Fitopatología y Enfermedades de Plantas', 4, 5, @IdAgronomica),
('AGR502', N'Riegos, Drenajes y Fuentes Hídricas', 4, 5, @IdAgronomica),
('AGR503', N'Maquinaria y Mecanización Agrícola', 3, 5, @IdAgronomica),
('AGR601', N'Manejo Integrado de Plagas (MIP)', 4, 6, @IdAgronomica),
('AGR602', N'Genética y Mejoramiento Vegetal', 3, 6, @IdAgronomica),
('AGR603', N'Propagación Vegetal y Viveros', 3, 6, @IdAgronomica),
('AGR701', N'Sistemas de Cultivos de Clima Cálido', 4, 7, @IdAgronomica),
('AGR702', N'Agroforestería y Conservación de Suelos', 3, 7, @IdAgronomica),
('AGR801', N'Fisiología y Tecnología de Poscosecha', 3, 8, @IdAgronomica),
('AGR802', N'Administración de Empresas Agropecuarias', 3, 8, @IdAgronomica),
('AGR803', N'Agricultura de Precisión y Drones', 3, 8, @IdAgronomica),
('AGR901', N'Proyecto de Grado I - Agronomía', 4, 9, @IdAgronomica),
('AGR1001', N'Proyecto de Grado II - Agronomía', 4, 10, @IdAgronomica),
('AGR1002', N'Práctica Profesional - Agronomía', 6, 10, @IdAgronomica);

-- =========================================================================
-- 7. INGENIERÍA PESQUERA (ING-PESQ)
-- =========================================================================
INSERT INTO #TempCursos VALUES
('PES101', N'Introducción a la Ingeniería Pesquera', 3, 1, @IdPesquera),
('PES102', N'Biología Marina y de Recursos Acuáticos', 4, 1, @IdPesquera),
('PES201', N'Ictiología General y de Peces Comerciales', 4, 2, @IdPesquera),
('PES202', N'Química y Bioquímica Acuática', 3, 2, @IdPesquera),
('PES301', N'Oceanografía y Limnología Pesquera', 4, 3, @IdPesquera),
('PES302', N'Ecología Acuática y Recursos Hidrobiológicos', 3, 3, @IdPesquera),
('PES401', N'Dinámica de Poblaciones Pesqueras', 4, 4, @IdPesquera),
('PES402', N'Termodinámica y Sistemas de Refrigeración', 3, 4, @IdPesquera),
('PES501', N'Métodos, Artes y Tecnología de Pesca', 4, 5, @IdPesquera),
('PES502', N'Principios y Sistemas de Acuicultura', 4, 5, @IdPesquera),
('PES503', N'Navegación y Operaciones Marítimas', 3, 5, @IdPesquera),
('PES601', N'Nutrición y Alimentación de Peces', 3, 6, @IdPesquera),
('PES602', N'Tecnología y Procesamiento Pesquero I', 4, 6, @IdPesquera),
('PES603', N'Evaluación y Manejo de Stock Pesquero', 3, 6, @IdPesquera),
('PES701', N'Patología y Sanidad Acuícola', 3, 7, @IdPesquera),
('PES702', N'Tecnología y Procesamiento Pesquero II', 4, 7, @IdPesquera),
('PES703', N'Diseño de Embarcaciones Pesqueras', 3, 7, @IdPesquera),
('PES801', N'Gestión y Ordenamiento Pesquero', 3, 8, @IdPesquera),
('PES802', N'Control de Calidad e Inocuidad (HACCP)', 4, 8, @IdPesquera),
('PES901', N'Proyecto de Grado I - Pesquera', 4, 9, @IdPesquera),
('PES1001', N'Proyecto de Grado II - Pesquera', 4, 10, @IdPesquera),
('PES1002', N'Práctica Profesional - Pesquera', 6, 10, @IdPesquera);

-- =========================================================================
-- 8. INGENIERÍA MARINO COSTERA (ING-MAR)
-- =========================================================================
INSERT INTO #TempCursos VALUES
('MAR101', N'Introducción a la Ingeniería Marino Costera', 3, 1, @IdMarino),
('MAR102', N'Geografía Marina y Geomorfología Litoral', 3, 1, @IdMarino),
('MAR201', N'Geología Marina y Costera', 3, 2, @IdMarino),
('MAR202', N'Física del Océano y Ondas Marinas', 4, 2, @IdMarino),
('MAR301', N'Oceanografía Física y Dinámica de Oleaje', 4, 3, @IdMarino),
('MAR302', N'Topografía e Hidrografía Marina', 4, 3, @IdMarino),
('MAR401', N'Mecánica de Fluidos Marinos', 4, 4, @IdMarino),
('MAR402', N'Hidráulica Marítima y de Estuarios', 4, 4, @IdMarino),
('MAR403', N'Sedimentología y Transporte Litoral', 3, 4, @IdMarino),
('MAR501', N'Diseño de Estructuras y Rompeolas', 4, 5, @IdMarino),
('MAR502', N'Meteorología Marina y Climatología', 3, 5, @IdMarino),
('MAR503', N'Dinámica y Regeneración de Playas', 3, 5, @IdMarino),
('MAR601', N'Diseño de Puertos y Terminales Marítimos', 4, 6, @IdMarino),
('MAR602', N'Modelación Numérica e Hidrodinámica Marina', 4, 6, @IdMarino),
('MAR701', N'Obras de Dragado y Rellenos Hidráulicos', 3, 7, @IdMarino),
('MAR702', N'Sistemas de Monitoreo Oceanográfico', 3, 7, @IdMarino),
('MAR703', N'Teledetección y SIG Marino Costero', 3, 7, @IdMarino),
('MAR801', N'Manejo Integrado de Zonas Costeras (MIZC)', 4, 8, @IdMarino),
('MAR802', N'Prevención del Riesgo y Erosión Costera', 3, 8, @IdMarino),
('MAR803', N'Energías Renovables del Mar (Undimotriz/Mareomotriz)', 3, 8, @IdMarino),
('MAR901', N'Proyecto de Grado I - Marino Costera', 4, 9, @IdMarino),
('MAR1001', N'Proyecto de Grado II - Marino Costera', 4, 10, @IdMarino),
('MAR1002', N'Práctica Profesional - Marino Costera', 6, 10, @IdMarino);

-- =========================================================================
-- 9. INGENIERÍA EN CIENCIA DE DATOS (ING-DATOS)
-- =========================================================================
INSERT INTO #TempCursos VALUES
('DAT101', N'Introducción a la Ciencia de Datos', 3, 1, @IdDatos),
('DAT102', N'Programación en Python para Datos', 4, 1, @IdDatos),
('DAT201', N'Algoritmos y Estructuras de Datos Avanzadas', 4, 2, @IdDatos),
('DAT202', N'Álgebra Lineal y Métodos Matriciales', 3, 2, @IdDatos),
('DAT301', N'Bases de Datos Relacionales y NoSQL', 4, 3, @IdDatos),
('DAT302', N'Probabilidad y Estadística para Machine Learning', 4, 3, @IdDatos),
('DAT401', N'Análisis Exploratorio y Visualización de Datos', 3, 4, @IdDatos),
('DAT402', N'Inferencia Estadística y Modelos Lineales', 4, 4, @IdDatos),
('DAT403', N'Optimización Matemática y Computacional', 3, 4, @IdDatos),
('DAT501', N'Aprendizaje Automático Supervisado', 4, 5, @IdDatos),
('DAT502', N'Ingesta, Limpieza y Pipelines de Datos (ETL)', 4, 5, @IdDatos),
('DAT503', N'Computación Paralela y en la Nube', 3, 5, @IdDatos),
('DAT601', N'Aprendizaje No Supervisado y Ensamble', 4, 6, @IdDatos),
('DAT602', N'Arquitectura Big Data (Hadoop y Apache Spark)', 4, 6, @IdDatos),
('DAT603', N'Análisis y Predicción de Series de Tiempo', 3, 6, @IdDatos),
('DAT701', N'Aprendizaje Profundo (Deep Learning)', 4, 7, @IdDatos),
('DAT702', N'Procesamiento del Lenguaje Natural (NLP)', 4, 7, @IdDatos),
('DAT703', N'MLOps y Despliegue de Modelos', 3, 7, @IdDatos),
('DAT801', N'Visión por Computador', 3, 8, @IdDatos),
('DAT802', N'Analítica de Redes y Grafos', 3, 8, @IdDatos),
('DAT803', N'Ética, Privacidad y Gobernanza de Datos', 3, 8, @IdDatos),
('DAT901', N'Proyecto de Grado I - Ciencia de Datos', 4, 9, @IdDatos),
('DAT1001', N'Proyecto de Grado II - Ciencia de Datos', 4, 10, @IdDatos),
('DAT1002', N'Práctica Profesional - Ciencia de Datos', 6, 10, @IdDatos);

-- =========================================================================
-- 10. INGENIERÍA ENERGÉTICA (ING-ENERG)
-- =========================================================================
INSERT INTO #TempCursos VALUES
('ENG101', N'Introducción a la Ingeniería Energética', 3, 1, @IdEnergetica),
('ENG102', N'Química de la Energía y Combustibles', 3, 1, @IdEnergetica),
('ENG201', N'Física de Campos y Ondas', 4, 2, @IdEnergetica),
('ENG202', N'Ciencia de Materiales para la Energía', 3, 2, @IdEnergetica),
('ENG301', N'Termodinámica Aplicada I', 4, 3, @IdEnergetica),
('ENG302', N'Circuitos Eléctricos y Mediciones', 4, 3, @IdEnergetica),
('ENG401', N'Mecánica de Fluidos Energética', 4, 4, @IdEnergetica),
('ENG402', N'Transferencia de Calor e Intercambiadores', 4, 4, @IdEnergetica),
('ENG403', N'Máquinas Eléctricas y Generadores', 4, 4, @IdEnergetica),
('ENG501', N'Centrales Térmicas y de Turbinas', 4, 5, @IdEnergetica),
('ENG502', N'Energía Solar Fotovoltaica y Térmica', 4, 5, @IdEnergetica),
('ENG503', N'Sistemas Eléctricos de Potencia', 4, 5, @IdEnergetica),
('ENG601', N'Energía Eólica y Biomasa', 4, 6, @IdEnergetica),
('ENG602', N'Auditorías y Eficiencia Energética', 3, 6, @IdEnergetica),
('ENG603', N'Redes Eléctricas Inteligentes (Smart Grids)', 3, 6, @IdEnergetica),
('ENG701', N'Tecnologías de Hidrógeno y Baterías', 4, 7, @IdEnergetica),
('ENG702', N'Energía Hidroeléctrica y Geotérmica', 3, 7, @IdEnergetica),
('ENG703', N'Electrónica de Potencia para Renovables', 3, 7, @IdEnergetica),
('ENG801', N'Mercados Eléctricos y Regulación Energética', 3, 8, @IdEnergetica),
('ENG802', N'Descarbonización y Transición Energética', 3, 8, @IdEnergetica),
('ENG901', N'Proyecto de Grado I - Energética', 4, 9, @IdEnergetica),
('ENG1001', N'Proyecto de Grado II - Energética', 4, 10, @IdEnergetica),
('ENG1002', N'Práctica Profesional - Energética', 6, 10, @IdEnergetica);

-- =========================================================================
-- MERGE / INSERCIÓN EN LA TABLA REAL Asignaturas
-- =========================================================================
MERGE INTO [Asignaturas] AS Target
USING #TempCursos AS Source
ON (Target.[Codigo] = Source.[Codigo])
WHEN MATCHED THEN
    UPDATE SET 
        Target.[Nombre] = Source.[Nombre],
        Target.[Creditos] = Source.[Creditos],
        Target.[Semestre] = Source.[Semestre],
        Target.[ProgramaAcademicoId] = Source.[ProgramaAcademicoId],
        Target.[EstaActivo] = 1,
        Target.[FechaActualizacion] = GETUTCDATE()
WHEN NOT MATCHED THEN
    INSERT ([Id], [Codigo], [Nombre], [Creditos], [Semestre], [ProgramaAcademicoId], [FechaCreacion], [EstaActivo])
    VALUES (NEWID(), Source.[Codigo], Source.[Nombre], Source.[Creditos], Source.[Semestre], Source.[ProgramaAcademicoId], GETUTCDATE(), 1);

DROP TABLE #TempCursos;

PRINT '======================================================================';
PRINT '  CARGA COMPLETA: 220+ Asignaturas insertadas/actualizadas con éxito  ';
PRINT '======================================================================';
GO
