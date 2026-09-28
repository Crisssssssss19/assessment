# -*- coding: utf-8 -*-
import os

programas = {
    "ING-SIST": ("Ingeniería de Sistemas", [
        # Semestre 1
        ("SIS101", "Introducción a la Ingeniería de Sistemas", 3, 1),
        ("MAT101", "Cálculo Diferencial", 4, 1),
        ("MAT102", "Álgebra Lineal", 3, 1),
        ("SIS102", "Algoritmos y Lógica de Programación", 4, 1),
        ("HUM101", "Competencias Comunicativas", 2, 1),
        ("ING101", "Inglés I", 2, 1),
        # Semestre 2
        ("SIS201", "Programación Orientada a Objetos", 4, 2),
        ("MAT201", "Cálculo Integral", 4, 2),
        ("FIS201", "Física Mecánica", 4, 2),
        ("SIS202", "Matemáticas Discretas", 3, 2),
        ("ING201", "Inglés II", 2, 2),
        ("HUM201", "Cátedra Universitaria Unimagdalena", 2, 2),
        # Semestre 3
        ("SIS301", "Estructuras de Datos y Algoritmos", 4, 3),
        ("MAT301", "Cálculo Multivariado", 3, 3),
        ("FIS301", "Física de Campos y Ondas", 4, 3),
        ("SIS302", "Organización y Arquitectura del Computador", 3, 3),
        ("EST301", "Probabilidad y Estadística Fundamental", 3, 3),
        ("ING301", "Inglés III", 2, 3),
        # Semestre 4
        ("SIS401", "Bases de Datos Relacionales", 4, 4),
        ("MAT401", "Ecuaciones Diferenciales", 3, 4),
        ("SIS402", "Análisis y Diseño de Software", 4, 4),
        ("SIS403", "Sistemas Operativos y Concurrencia", 3, 4),
        ("SIS404", "Teoría de la Computación y Lenguajes Formales", 3, 4),
        ("ING401", "Inglés IV", 2, 4),
        # Semestre 5
        ("SIS501", "Ingeniería de Requisitos", 3, 5),
        ("SIS502", "Arquitectura de Software y Patrones de Diseño", 4, 5),
        ("SIS503", "Redes de Datos y Protocolos de Comunicación", 4, 5),
        ("SIS504", "Bases de Datos Avanzadas y NoSQL", 3, 5),
        ("EST501", "Estadística Aplicada e Inferencia", 3, 5),
        ("HUM501", "Metodología de la Investigación Científica", 2, 5),
        # Semestre 6
        ("SIS601", "Desarrollo Web Fullstack y Cloud", 4, 6),
        ("SIS602", "Pruebas y Aseguramiento de la Calidad del Software", 4, 6),
        ("SIS603", "Seguridad de la Información y Criptografía", 3, 6),
        ("SIS604", "Sistemas Distribuidos y Microservicios", 3, 6),
        ("ECO601", "Ingeniería Económica y Finanzas", 3, 6),
        # Semestre 7
        ("SIS701", "Desarrollo de Aplicaciones Móviles", 4, 7),
        ("SIS702", "Gestión de Proyectos de TI (Metodologías Ágiles)", 3, 7),
        ("SIS703", "Inteligencia Artificial y Aprendizaje Automático", 4, 7),
        ("SIS704", "Electiva de Profundización I - Sistemas", 3, 7),
        ("HUM701", "Ética Profesional y Legislación Informática", 2, 7),
        # Semestre 8
        ("SIS801", "Computación en la Nube y DevOps", 4, 8),
        ("SIS802", "Analítica de Datos y Big Data", 4, 8),
        ("SIS803", "Internet de las Cosas (IoT) y Sistemas Embebidos", 3, 8),
        ("SIS804", "Electiva de Profundización II - Sistemas", 3, 8),
        ("HUM801", "Formulación y Evaluación de Proyectos", 3, 8),
        # Semestre 9
        ("SIS901", "Proyecto de Grado I - Sistemas", 4, 9),
        ("SIS902", "Gobierno de TI y Auditoría de Sistemas", 3, 9),
        ("SIS903", "Electiva de Profundización III - Sistemas", 3, 9),
        ("SIS904", "Electiva Complementaria de Humanidades", 2, 9),
        # Semestre 10
        ("SIS1001", "Proyecto de Grado II - Sistemas", 4, 10),
        ("SIS1002", "Práctica Profesional en Ingeniería de Sistemas", 6, 10),
        ("SIS1003", "Innovación y Emprendimiento de Base Tecnológica", 3, 10)
    ]),

    "ING-CIVIL": ("Ingeniería Civil", [
        # Semestre 1
        ("CIV101", "Introducción a la Ingeniería Civil", 3, 1),
        ("MAT101", "Cálculo Diferencial", 4, 1),
        ("MAT102", "Álgebra Lineal", 3, 1),
        ("CIV102", "Dibujo en Ingeniería y CAD", 3, 1),
        ("QUI101", "Química General para Ingenieros", 3, 1),
        ("HUM101", "Competencias Comunicativas", 2, 1),
        # Semestre 2
        ("CIV201", "Topografía y Planimetría", 4, 2),
        ("MAT201", "Cálculo Integral", 4, 2),
        ("FIS201", "Física Mecánica y Laboratorio", 4, 2),
        ("CIV202", "Geología General y Geotecnia", 3, 2),
        ("HUM201", "Cátedra Universitaria Unimagdalena", 2, 2),
        # Semestre 3
        ("CIV301", "Estática y Dinámica de Estructuras", 4, 3),
        ("CIV302", "Altimetría y Topografía de Vías", 3, 3),
        ("MAT301", "Cálculo Multivariado", 3, 3),
        ("FIS301", "Física de Campos y Termodinámica", 4, 3),
        ("CIV303", "Materiales de Construcción y Concretos", 3, 3),
        # Semestre 4
        ("CIV401", "Resistencia de Materiales I", 4, 4),
        ("CIV402", "Mecánica de Fluidos", 4, 4),
        ("MAT401", "Ecuaciones Diferenciales", 3, 4),
        ("EST301", "Probabilidad y Estadística Fundamental", 3, 4),
        ("CIV403", "Sistemas de Información Geográfica (SIG)", 3, 4),
        # Semestre 5
        ("CIV501", "Resistencia de Materiales II", 3, 5),
        ("CIV502", "Mecánica de Suelos I", 4, 5),
        ("CIV503", "Hidráulica de Canales y Tuberías", 4, 5),
        ("CIV504", "Análisis Estructural I", 4, 5),
        ("ECO601", "Ingeniería Económica", 3, 5),
        # Semestre 6
        ("CIV601", "Análisis Estructural II", 4, 6),
        ("CIV602", "Mecánica de Suelos II y Cimentaciones", 4, 6),
        ("CIV603", "Hidrología y Climatología Aplicada", 3, 6),
        ("CIV604", "Diseño Geométrico de Vías", 4, 6),
        ("CIV605", "Procedimientos y Procesos Constructivos", 3, 6),
        # Semestre 7
        ("CIV701", "Diseño de Estructuras de Concreto Reforzado", 4, 7),
        ("CIV702", "Ingeniería de Tránsito y Transporte", 3, 7),
        ("CIV703", "Acueductos, Alcantarillados y Drenajes", 4, 7),
        ("CIV704", "Pavimentos Asfálticos y Rígidos", 4, 7),
        ("CIV705", "Electiva de Profundización I - Civil", 3, 7),
        # Semestre 8
        ("CIV801", "Diseño de Estructuras Metálicas", 4, 8),
        ("CIV802", "Obras Hidráulicas y Presas", 4, 8),
        ("CIV803", "Costos, Presupuestos y Programación de Obras", 3, 8),
        ("CIV804", "Electiva de Profundización II - Civil", 3, 8),
        ("HUM801", "Formulación y Evaluación de Proyectos", 3, 8),
        # Semestre 9
        ("CIV901", "Proyecto de Grado I - Civil", 4, 9),
        ("CIV902", "Interventoría y Supervisión Técnica de Obras", 3, 9),
        ("CIV903", "Impacto Ambiental en Obras Civiles", 3, 9),
        ("CIV904", "Electiva de Profundización III - Civil", 3, 9),
        ("HUM701", "Ética Profesional y Legislación de la Construcción", 2, 9),
        # Semestre 10
        ("CIV1001", "Proyecto de Grado II - Civil", 4, 10),
        ("CIV1002", "Práctica Profesional en Ingeniería Civil", 6, 10),
        ("CIV1003", "Gestión Integral del Riesgo en Infraestructura", 3, 10)
    ]),

    "ING-IND": ("Ingeniería Industrial", [
        # Semestre 1
        ("IND101", "Introducción a la Ingeniería Industrial", 3, 1),
        ("MAT101", "Cálculo Diferencial", 4, 1),
        ("MAT102", "Álgebra Lineal", 3, 1),
        ("QUI101", "Química General e Industrial", 3, 1),
        ("IND102", "Dibujo Técnico y CAD Industrial", 3, 1),
        ("HUM101", "Competencias Comunicativas", 2, 1),
        # Semestre 2
        ("IND201", "Estudio del Trabajo y Tiempos", 4, 2),
        ("MAT201", "Cálculo Integral", 4, 2),
        ("FIS201", "Física Mecánica", 4, 2),
        ("IND202", "Procesos Industriales y Materiales", 3, 2),
        ("HUM201", "Cátedra Universitaria Unimagdalena", 2, 2),
        # Semestre 3
        ("IND301", "Diseño de Procesos Productivos", 4, 3),
        ("MAT301", "Cálculo Multivariado", 3, 3),
        ("FIS301", "Física de Campos y Termodinámica", 4, 3),
        ("EST301", "Probabilidad y Estadística Fundamental", 3, 3),
        ("ADM301", "Fundamentos de Administración y Organizaciones", 3, 3),
        # Semestre 4
        ("IND401", "Investigación de Operaciones I (Determinística)", 4, 4),
        ("IND402", "Control Estadístico de la Calidad", 4, 4),
        ("MAT401", "Ecuaciones Diferenciales", 3, 4),
        ("IND403", "Contabilidad de Costos Industriales", 3, 4),
        ("EST501", "Estadística Aplicada e Inferencia", 3, 4),
        # Semestre 5
        ("IND501", "Investigación de Operaciones II (Estocástica)", 4, 5),
        ("IND502", "Gestión de la Producción y Operaciones I", 4, 5),
        ("IND503", "Ergonomía y Seguridad Industrial (SST)", 3, 5),
        ("ECO601", "Ingeniería Económica", 3, 5),
        ("IND504", "Mantenimiento Industrial y Confiabilidad", 3, 5),
        # Semestre 6
        ("IND601", "Gestión de la Producción y Operaciones II", 4, 6),
        ("IND602", "Logística Empresarial y Gestión de Inventarios", 4, 6),
        ("IND603", "Diseño y Distribución de Plantas Industriales", 4, 6),
        ("IND604", "Gestión de Sistemas de Calidad Integrados", 3, 6),
        ("IND605", "Modelado y Simulación de Procesos", 3, 6),
        # Semestre 7
        ("IND701", "Gestión de la Cadena de Suministro (SCM)", 4, 7),
        ("IND702", "Ingeniería y Gestión Ambiental en Industrias", 3, 7),
        ("IND703", "Mercadeo Industrial y Gestión Comercial", 3, 7),
        ("IND704", "Electiva de Profundización I - Industrial", 3, 7),
        ("HUM701", "Ética Profesional y Responsabilidad Social", 2, 7),
        # Semestre 8
        ("IND801", "Automatización y Robótica de Procesos", 4, 8),
        ("IND802", "Dirección Estratégica y Toma de Decisiones", 3, 8),
        ("IND803", "Formulación y Evaluación de Proyectos Industriales", 4, 8),
        ("IND804", "Electiva de Profundización II - Industrial", 3, 8),
        ("IND805", "Analítica de Operaciones y Big Data", 3, 8),
        # Semestre 9
        ("IND901", "Proyecto de Grado I - Industrial", 4, 9),
        ("IND902", "Optimización de Procesos y Lean Six Sigma", 4, 9),
        ("IND903", "Electiva de Profundización III - Industrial", 3, 9),
        ("IND904", "Electiva Complementaria Humanidades", 2, 9),
        # Semestre 10
        ("IND1001", "Proyecto de Grado II - Industrial", 4, 10),
        ("IND1002", "Práctica Profesional en Ingeniería Industrial", 6, 10),
        ("IND1003", "Innovación, Emprendimiento y Modelos de Negocio", 3, 10)
    ]),

    "ING-AGRO": ("Ingeniería Agronómica", [
        # Semestre 1
        ("AGR101", "Introducción a las Ciencias Agronómicas", 3, 1),
        ("AGR102", "Botánica General y Morfología Vegetal", 4, 1),
        ("MAT101", "Cálculo Diferencial", 4, 1),
        ("QUI101", "Química General e Inorgánica", 3, 1),
        ("HUM101", "Competencias Comunicativas", 2, 1),
        ("ING101", "Inglés I", 2, 1),
        # Semestre 2
        ("AGR201", "Botánica Sistemática y Taxonomía Vegetal", 4, 2),
        ("AGR202", "Química Orgánica y Bioquímica Agrícola", 4, 2),
        ("MAT201", "Cálculo Integral", 4, 2),
        ("FIS201", "Física Aplicada a la Agronomía", 4, 2),
        ("HUM201", "Cátedra Universitaria Unimagdalena", 2, 2),
        # Semestre 3
        ("AGR301", "Fisiología Vegetal", 4, 3),
        ("AGR302", "Edafología, Génesis y Clasificación de Suelos", 4, 3),
        ("AGR303", "Microbiología Agrícola y de Suelos", 3, 3),
        ("EST301", "Probabilidad y Diseños Experimentales", 4, 3),
        ("AGR304", "Topografía Agrícola y Manejo de Tierras", 3, 3),
        # Semestre 4
        ("AGR401", "Nutrición Vegetal y Fertilidad de Suelos", 4, 4),
        ("AGR402", "Entomología General y de Insectos Plaga", 4, 4),
        ("AGR403", "Agrometeorología y Clima Tropical", 3, 4),
        ("AGR404", "Genética General y Vegetal", 4, 4),
        ("AGR405", "Mapeo Digital y SIG Agrícola", 3, 4),
        # Semestre 5
        ("AGR501", "Fitopatología y Enfermedades de Cultivos", 4, 5),
        ("AGR502", "Riegos, Drenajes y Manejo de Recursos Hídricos", 4, 5),
        ("AGR503", "Maquinaria, Mecanización y Fuentes de Potencia", 3, 5),
        ("AGR504", "Fisiología de la Producción Agrícola", 3, 5),
        ("ECO601", "Economía Agraria", 3, 5),
        # Semestre 6
        ("AGR601", "Manejo Integrado de Plagas (MIP)", 4, 6),
        ("AGR602", "Fitomejoramiento y Biotecnología Vegetal", 4, 6),
        ("AGR603", "Propagación de Plantas, Semillas y Viveros", 3, 6),
        ("AGR604", "Manejo Integrado de Malezas y Arvenses", 3, 6),
        ("AGR605", "Agroecología y Sistemas de Producción Sostenible", 3, 6),
        # Semestre 7
        ("AGR701", "Sistemas de Cultivos de Clima Cálido (Palma, Banano, Café)", 4, 7),
        ("AGR702", "Agroforestería, Silvopastoreo y Conservación de Suelos", 3, 7),
        ("AGR703", "Sistemas de Producción de Hortalizas y Frutales", 4, 7),
        ("AGR704", "Electiva de Profundización I - Agronomía", 3, 7),
        ("HUM701", "Legislación Agraria y Ambiental", 2, 7),
        # Semestre 8
        ("AGR801", "Fisiología y Tecnología de Poscosecha", 4, 8),
        ("AGR802", "Administración y Gestión de Empresas Agropecuarias", 3, 8),
        ("AGR803", "Agricultura de Precisión, Sensores y Drones", 3, 8),
        ("AGR804", "Electiva de Profundización II - Agronomía", 3, 8),
        ("HUM801", "Formulación y Evaluación de Proyectos Agropecuarios", 3, 8),
        # Semestre 9
        ("AGR901", "Proyecto de Grado I - Agronomía", 4, 9),
        ("AGR902", "Inocuidad, BPA y Certificaciones Agrícolas", 3, 9),
        ("AGR903", "Comercialización y Cadenas de Valor Agropecuarias", 3, 9),
        ("AGR904", "Electiva de Profundización III - Agronomía", 3, 9),
        ("HUM901", "Ética Profesional y Desarrollo Rural Sostenible", 2, 9),
        # Semestre 10
        ("AGR1001", "Proyecto de Grado II - Agronomía", 4, 10),
        ("AGR1002", "Práctica Profesional en Ingeniería Agronómica", 6, 10),
        ("AGR1003", "Extensión Rural y Transferencia Tecnológica", 3, 10)
    ]),

    "ING-PESQ": ("Ingeniería Pesquera", [
        # Semestre 1
        ("PES101", "Introducción a las Ciencias Pesqueras", 3, 1),
        ("PES102", "Biología Marina y de Recursos Acuáticos", 4, 1),
        ("MAT101", "Cálculo Diferencial", 4, 1),
        ("QUI101", "Química General e Inorgánica", 3, 1),
        ("HUM101", "Competencias Comunicativas", 2, 1),
        ("ING101", "Inglés I", 2, 1),
        # Semestre 2
        ("PES201", "Ictiología y Taxonomía de Peces y Crustáceos", 4, 2),
        ("PES202", "Química Orgánica y Bioquímica Acuática", 4, 2),
        ("MAT201", "Cálculo Integral", 4, 2),
        ("FIS201", "Física Mecánica y de Fluidos", 4, 2),
        ("HUM201", "Cátedra Universitaria Unimagdalena", 2, 2),
        # Semestre 3
        ("PES301", "Ecología Acuática y Limnología", 4, 3),
        ("PES302", "Oceanografía Física y Pesquera", 4, 3),
        ("MAT301", "Cálculo Multivariado", 3, 3),
        ("EST301", "Bioestadística y Diseños Experimentales", 4, 3),
        ("PES303", "Navegación, Cartografía y Comunicaciones Marítimas", 3, 3),
        # Semestre 4
        ("PES401", "Acuicultura General y Sistemas de Cultivo", 4, 4),
        ("PES402", "Tecnología de Materiales y Artes de Pesca", 4, 4),
        ("PES403", "Dinámica de Poblaciones y Evaluación de Stocks", 4, 4),
        ("PES404", "Fisiología y Nutrición de Organismos Acuáticos", 3, 4),
        ("EST501", "Modelación Estadística Pesquera", 3, 4),
        # Semestre 5
        ("PES501", "Piscicultura Continental y Marina", 4, 5),
        ("PES502", "Embarcaciones Pesqueras y Máquinas Marinas", 4, 5),
        ("PES503", "Calidad de Aguas y Tratamiento de Efluentes Acuícolas", 3, 5),
        ("PES504", "Patología y Sanidad Acuícola", 3, 5),
        ("ECO601", "Economía Pesquera y de Recursos Marinos", 3, 5),
        # Semestre 6
        ("PES601", "Cultivo de Moluscos y Crustáceos", 4, 6),
        ("PES602", "Microbiología y Análisis de Alimentos Acuáticos", 4, 6),
        ("PES603", "Operaciones y Métodos de Pesca Industrial y Artesanal", 4, 6),
        ("PES604", "Diseño e Ingeniería de Plantas e Instalaciones Acuícolas", 3, 6),
        ("PES605", "Manejo y Preservación de Recursos Vivos en Alta Mar", 3, 6),
        # Semestre 7
        ("PES701", "Tecnología y Procesamiento de Productos Pesqueros", 4, 7),
        ("PES702", "Control y Aseguramiento de Calidad (HACCP Pesquero)", 4, 7),
        ("PES703", "Manejo y Ordenamiento de Pesquerías Sostenibles", 3, 7),
        ("PES704", "Electiva de Profundización I - Pesquera", 3, 7),
        ("HUM701", "Legislación y Políticas Pesqueras y Marítimas", 2, 7),
        # Semestre 8
        ("PES801", "Biotecnología y Genética Aplicada a la Acuicultura", 4, 8),
        ("PES802", "Administración y Gestión de Empresas Pesqueras", 3, 8),
        ("PES803", "Desarrollo e Innovación de Nuevos Productos Marinos", 3, 8),
        ("PES804", "Electiva de Profundización II - Pesquera", 3, 8),
        ("HUM801", "Formulación y Evaluación de Proyectos Acuícolas", 3, 8),
        # Semestre 9
        ("PES901", "Proyecto de Grado I - Pesquera", 4, 9),
        ("PES902", "Comercio Internacional y Logística de Cadena de Frío", 3, 9),
        ("PES903", "Impacto Ambiental y Certificaciones Pesqueras", 3, 9),
        ("PES904", "Electiva de Profundización III - Pesquera", 3, 9),
        ("HUM901", "Ética Profesional y Gobernanza Marina", 2, 9),
        # Semestre 10
        ("PES1001", "Proyecto de Grado II - Pesquera", 4, 10),
        ("PES1002", "Práctica Profesional en Ingeniería Pesquera", 6, 10),
        ("PES1003", "Emprendimiento e Innovación en Bioeconomía Azul", 3, 10)
    ]),

    "ING-AMB": ("Ingeniería Ambiental y Sanitaria", [
        # Semestre 1
        ("AMB101", "Introducción a la Ingeniería Ambiental y Sanitaria", 3, 1),
        ("MAT101", "Cálculo Diferencial", 4, 1),
        ("MAT102", "Álgebra Lineal", 3, 1),
        ("QUI101", "Química General e Inorgánica", 3, 1),
        ("HUM101", "Competencias Comunicativas", 2, 1),
        ("AMB102", "Biología y Ecología General", 3, 1),
        # Semestre 2
        ("AMB201", "Química Ambiental y Sanitaria", 4, 2),
        ("MAT201", "Cálculo Integral", 4, 2),
        ("FIS201", "Física Mecánica y Termodinámica", 4, 2),
        ("AMB202", "Geología Ambiental y Geomorfología", 3, 2),
        ("HUM201", "Cátedra Universitaria Unimagdalena", 2, 2),
        # Semestre 3
        ("AMB301", "Microbiología Ambiental y de Aguas", 4, 3),
        ("MAT301", "Cálculo Multivariado", 3, 3),
        ("FIS301", "Física de Fluidos y Transporte de Masa", 4, 3),
        ("EST301", "Estadística y Muestreo Ambiental", 3, 3),
        ("AMB302", "Topografía y Cartografía Digital", 3, 3),
        # Semestre 4
        ("AMB401", "Mecánica de Fluidos e Hidráulica Ambiental", 4, 4),
        ("MAT401", "Ecuaciones Diferenciales", 3, 4),
        ("AMB402", "Hidrología y Manejo de Cuencas Hidrográficas", 4, 4),
        ("AMB403", "Sistemas de Información Geográfica Aplicados (SIG)", 3, 4),
        ("AMB404", "Climatología y Meteorología de Contaminantes", 3, 4),
        # Semestre 5
        ("AMB501", "Calidad del Agua y Parámetros Fisicoquímicos", 4, 5),
        ("AMB502", "Diseño de Redes de Acueductos y Alcantarillados", 4, 5),
        ("AMB503", "Operaciones Unitarias en Ingeniería Ambiental", 4, 5),
        ("AMB504", "Contaminación y Química del Suelo", 3, 5),
        ("ECO601", "Economía Ambiental y Valoración Económica", 3, 5),
        # Semestre 6
        ("AMB601", "Plantas de Tratamiento de Agua Potable (PTAP)", 4, 6),
        ("AMB602", "Plantas de Tratamiento de Aguas Residuales (PTAR)", 4, 6),
        ("AMB603", "Gestión Integral de Residuos Sólidos Urbanos", 4, 6),
        ("AMB604", "Calidad del Aire, Emisiones y Control de Ruido", 3, 6),
        ("AMB605", "Modelación y Simulación Ambiental", 3, 6),
        # Semestre 7
        ("AMB701", "Evaluación de Impacto Ambiental (EIA)", 4, 7),
        ("AMB702", "Manejo de Residuos Peligrosos y Especiales (RESPEL)", 3, 7),
        ("AMB703", "Biorremediación y Restauración Ecológica", 3, 7),
        ("AMB704", "Electiva de Profundización I - Ambiental", 3, 7),
        ("HUM701", "Legislación y Normatividad Ambiental Colombiana", 2, 7),
        # Semestre 8
        ("AMB801", "Sistemas de Gestión Ambiental (ISO 14001) y Huella de Carbono", 4, 8),
        ("AMB802", "Salud Pública, Epidemiología y Toxicología Ambiental", 3, 8),
        ("AMB803", "Energías Renovables y Mitigación de Cambio Climático", 3, 8),
        ("AMB804", "Electiva de Profundización II - Ambiental", 3, 8),
        ("HUM801", "Formulación y Evaluación de Proyectos Ambientales", 3, 8),
        # Semestre 9
        ("AMB901", "Proyecto de Grado I - Ambiental y Sanitaria", 4, 9),
        ("AMB902", "Auditoría Ambiental y Producción Más Limpia", 3, 9),
        ("AMB903", "Gestión del Riesgo y Adaptación al Cambio Climático", 3, 9),
        ("AMB904", "Electiva de Profundización III - Ambiental", 3, 9),
        ("HUM901", "Ética Ambiental y Responsabilidad Socioambiental", 2, 9),
        # Semestre 10
        ("AMB1001", "Proyecto de Grado II - Ambiental y Sanitaria", 4, 10),
        ("AMB1002", "Práctica Profesional en Ingeniería Ambiental", 6, 10),
        ("AMB1003", "Ecoinnovación y Negocios Verdes", 3, 10)
    ]),

    "ING-ELEC": ("Ingeniería Electrónica", [
        # Semestre 1
        ("ELE101", "Introducción a la Ingeniería Electrónica", 3, 1),
        ("MAT101", "Cálculo Diferencial", 4, 1),
        ("MAT102", "Álgebra Lineal", 3, 1),
        ("ELE102", "Algoritmos y Programación para Ingeniería", 3, 1),
        ("QUI101", "Química General para Ingenieros", 3, 1),
        ("HUM101", "Competencias Comunicativas", 2, 1),
        # Semestre 2
        ("ELE201", "Circuitos Eléctricos I", 4, 2),
        ("MAT201", "Cálculo Integral", 4, 2),
        ("FIS201", "Física Mecánica y Oscilaciones", 4, 2),
        ("ELE202", "Diseño Digital y Lógica Booleana", 4, 2),
        ("HUM201", "Cátedra Universitaria Unimagdalena", 2, 2),
        # Semestre 3
        ("ELE301", "Circuitos Eléctricos II y Corriente Alterna", 4, 3),
        ("ELE302", "Dispositivos Semiconductores y Diodos", 4, 3),
        ("MAT301", "Cálculo Multivariado", 3, 3),
        ("FIS301", "Electromagnetismo y Teoría de Campos", 4, 3),
        ("ELE303", "Sistemas Digitales y VHDL/FPGA", 3, 3),
        # Semestre 4
        ("ELE401", "Electrónica Analógica I (Transistores y Amplificadores)", 4, 4),
        ("ELE402", "Microprocesadores, Microcontroladores y Arquitectura", 4, 4),
        ("MAT401", "Ecuaciones Diferenciales y Transformadas", 3, 4),
        ("ELE403", "Señales y Sistemas Continuos", 3, 4),
        ("EST301", "Probabilidad y Procesos Estocásticos", 3, 4),
        # Semestre 5
        ("ELE501", "Electrónica Analógica II (OpAmps y Filtros)", 4, 5),
        ("ELE502", "Sistemas de Control Clásico y Modelado", 4, 5),
        ("ELE503", "Procesamiento Digital de Señales (DSP)", 4, 5),
        ("ELE504", "Electrónica de Potencia y Convertidores", 3, 5),
        ("ECO601", "Ingeniería Económica", 3, 5),
        # Semestre 6
        ("ELE601", "Sistemas de Control Digital y Moderno", 4, 6),
        ("ELE602", "Líneas de Transmisión y Antenas", 4, 6),
        ("ELE603", "Sistemas de Comunicaciones Analógicas y Digitales", 4, 6),
        ("ELE604", "Instrumentación Electrónica y Sensores", 3, 6),
        ("ELE605", "Diseño de Circuitos Impresos (PCB) y Prototipado", 3, 6),
        # Semestre 7
        ("ELE701", "Automatización Industrial, PLC y SCADA", 4, 7),
        ("ELE702", "Comunicaciones Ópticas e Inalámbricas", 4, 7),
        ("ELE703", "Sistemas Embebidos y RTOS", 3, 7),
        ("ELE704", "Electiva de Profundización I - Electrónica", 3, 7),
        ("HUM701", "Ética Profesional y Marco Regulatorio TIC", 2, 7),
        # Semestre 8
        ("ELE801", "Robótica Industrial y Visión Artificial", 4, 8),
        ("ELE802", "Redes de Sensores e Internet de las Cosas (IoT)", 4, 8),
        ("ELE803", "Sistemas Biomédicos y Bioinstrumentación", 3, 8),
        ("ELE804", "Electiva de Profundización II - Electrónica", 3, 8),
        ("HUM801", "Formulación y Evaluación de Proyectos Electrónicos", 3, 8),
        # Semestre 9
        ("ELE901", "Proyecto de Grado I - Electrónica", 4, 9),
        ("ELE902", "Compatibilidad Electromagnética (EMC) y Normas", 3, 9),
        ("ELE903", "Vehículos Autónomos y Drones", 3, 9),
        ("ELE904", "Electiva de Profundización III - Electrónica", 3, 9),
        ("HUM901", "Innovación y Transferencia de Tecnología", 2, 9),
        # Semestre 10
        ("ELE1001", "Proyecto de Grado II - Electrónica", 4, 10),
        ("ELE1002", "Práctica Profesional en Ingeniería Electrónica", 6, 10),
        ("ELE1003", "Gestión de Mantenimiento Electrónico y Calibración", 3, 10)
    ]),

    "ING-MAR": ("Ingeniería Marino Costera", [
        # Semestre 1
        ("MAR101", "Introducción a la Ingeniería Marino Costera", 3, 1),
        ("MAT101", "Cálculo Diferencial", 4, 1),
        ("MAT102", "Álgebra Lineal", 3, 1),
        ("QUI101", "Química Marina y Soluciones", 3, 1),
        ("MAR102", "Dibujo Técnico y Cartografía Náutica", 3, 1),
        ("HUM101", "Competencias Comunicativas", 2, 1),
        # Semestre 2
        ("MAR201", "Geología Marina y Geomorfología Litoral", 4, 2),
        ("MAT201", "Cálculo Integral", 4, 2),
        ("FIS201", "Física Mecánica y Ondulatoria", 4, 2),
        ("MAR202", "Biología y Ecosistemas Marinos Costeros", 3, 2),
        ("HUM201", "Cátedra Universitaria Unimagdalena", 2, 2),
        # Semestre 3
        ("MAR301", "Oceanografía Física y Dinámica Marina", 4, 3),
        ("MAT301", "Cálculo Multivariado", 3, 3),
        ("FIS301", "Mecánica de Fluidos Marinos", 4, 3),
        ("EST301", "Estadística de Variables Hidro-Oceanográficas", 3, 3),
        ("MAR302", "Topografía y Batimetría Costera", 3, 3),
        # Semestre 4
        ("MAR401", "Hidrodinámica Marina y Teoría de Olas", 4, 4),
        ("MAT401", "Ecuaciones Diferenciales", 3, 4),
        ("MAR402", "Mecánica de Suelos Marinos y Sedimentos", 4, 4),
        ("MAR403", "Sistemas de Información Geográfica Marina (SIG-M)", 3, 4),
        ("MAR404", "Meteorología Marina y Climatología Extrema", 3, 4),
        # Semestre 5
        ("MAR501", "Dinámica del Oleaje, Mareas y Corrientes Litorales", 4, 5),
        ("MAR502", "Transporte de Sedimentos y Morfodinámica de Playas", 4, 5),
        ("MAR503", "Materiales para Ambientes Marinos y Corrosión", 3, 5),
        ("MAR504", "Operaciones Unitarias y Desalación de Agua", 3, 5),
        ("ECO601", "Ingeniería Económica Marina", 3, 5),
        # Semestre 6
        ("MAR601", "Diseño de Obras de Protección Costera (Espigones, Tajamares)", 4, 6),
        ("MAR602", "Ingeniería Portuaria, Muelles y Terminales Marítimas", 4, 6),
        ("MAR603", "Modelación Numérica Hidrodinámica y de Sedimentos", 4, 6),
        ("MAR604", "Estructuras Offshore y Plataformas Marinas", 3, 6),
        ("MAR605", "Dragados, Rellenos y Gestión de Canales Navegables", 3, 6),
        # Semestre 7
        ("MAR701", "Manejo Integrado de Zonas Costeras (MIZC)", 4, 7),
        ("MAR702", "Evaluación de Impacto Ambiental en Proyectos Marinos", 3, 7),
        ("MAR703", "Energías Marinas Renovables (Undimotriz y Mareomotriz)", 4, 7),
        ("MAR704", "Electiva de Profundización I - Marino Costera", 3, 7),
        ("HUM701", "Derecho Marítimo Internacional y Legislación Costera", 2, 7),
        # Semestre 8
        ("MAR801", "Riesgos Costeros, Erosión Litoral y Alerta Temprana", 4, 8),
        ("MAR802", "Planificación y Operación Portuaria y Logística", 3, 8),
        ("MAR803", "Diseño de Emisarios Submarinos y Obras de Descarga", 3, 8),
        ("MAR804", "Electiva de Profundización II - Marino Costera", 3, 8),
        ("HUM801", "Formulación y Evaluación de Proyectos Portuarios y Costeros", 3, 8),
        # Semestre 9
        ("MAR901", "Proyecto de Grado I - Marino Costera", 4, 9),
        ("MAR902", "Restauración Ecológica de Playas y Arrecifes", 3, 9),
        ("MAR903", "Inspección Subacuática, Buceo y Robótica Marina (ROVs)", 3, 9),
        ("MAR904", "Electiva de Profundización III - Marino Costera", 3, 9),
        ("HUM901", "Ética Profesional y Gobernanza Oceánica", 2, 9),
        # Semestre 10
        ("MAR1001", "Proyecto de Grado II - Marino Costera", 4, 10),
        ("MAR1002", "Práctica Profesional en Ingeniería Marino Costera", 6, 10),
        ("MAR1003", "Innovación en Infraestructura Resiliente Costera", 3, 10)
    ]),

    "ING-DATOS": ("Ingeniería en Ciencia de Datos", [
        # Semestre 1
        ("DAT101", "Introducción a la Ciencia de Datos e Inteligencia Artificial", 3, 1),
        ("MAT101", "Cálculo Diferencial", 4, 1),
        ("MAT102", "Álgebra Lineal para Ciencia de Datos", 4, 1),
        ("DAT102", "Programación en Python y Algoritmos", 4, 1),
        ("HUM101", "Competencias Comunicativas", 2, 1),
        ("ING101", "Inglés I", 2, 1),
        # Semestre 2
        ("DAT201", "Estructuras de Datos y Programación Avanzada", 4, 2),
        ("MAT201", "Cálculo Integral", 4, 2),
        ("DAT202", "Matemáticas Discretas y Lógica Computacional", 3, 2),
        ("DAT203", "Bases de Datos Relacionales y SQL Avanzado", 4, 2),
        ("HUM201", "Cátedra Universitaria Unimagdalena", 2, 2),
        # Semestre 3
        ("DAT301", "Probabilidad y Estadística Descriptiva e Inferencial", 4, 3),
        ("MAT301", "Cálculo Multivariado y Optimización", 3, 3),
        ("DAT302", "Adquisición, Limpieza y Transformación de Datos (ETL)", 4, 3),
        ("DAT303", "Bases de Datos NoSQL, Grafos y Distribuidas", 3, 3),
        ("DAT304", "Programación en R para Análisis de Datos", 3, 3),
        # Semestre 4
        ("DAT401", "Análisis Exploratorio y Visualización Interactiva de Datos", 4, 4),
        ("DAT402", "Inferencia Estadística y Modelos Lineales", 4, 4),
        ("DAT403", "Arquitectura de Computadores y Computación de Alto Rendimiento (HPC)", 3, 4),
        ("MAT401", "Métodos Numéricos y Optimización Convexa", 3, 4),
        ("EST501", "Modelos Estadísticos Multivariados", 3, 4),
        # Semestre 5
        ("DAT501", "Machine Learning Supervisado (Modelos Predictivos)", 4, 5),
        ("DAT502", "Ingeniería de Datos y Pipelines (Airflow, Kafka)", 4, 5),
        ("DAT503", "Minería de Textos y Procesamiento de Lenguaje Natural (NLP)", 4, 5),
        ("DAT504", "Sistemas de Almacenamiento Masivo (Data Lakes y Data Warehouses)", 3, 5),
        ("ECO601", "Ingeniería Económica y Finanzas Digitales", 3, 5),
        # Semestre 6
        ("DAT601", "Machine Learning No Supervisado y Reconocimiento de Patrones", 4, 6),
        ("DAT602", "Procesamiento de Big Data en la Nube (Spark, Hadoop)", 4, 6),
        ("DAT603", "Deep Learning y Redes Neuronales Artificiales", 4, 6),
        ("DAT604", "Series Temporales y Analítica Predictiva", 3, 6),
        ("DAT605", "Calidad y Gobierno del Dato (Data Governance)", 3, 6),
        # Semestre 7
        ("DAT701", "Visión por Computador y Modelos Generativos", 4, 7),
        ("DAT702", "Despliegue y Operación de Modelos de ML (MLOps)", 4, 7),
        ("DAT703", "Analítica de Negocios y Business Intelligence (BI)", 3, 7),
        ("DAT704", "Electiva de Profundización I - Ciencia de Datos", 3, 7),
        ("HUM701", "Privacidad, Ética del Dato y Legislación de IA (GDPR)", 2, 7),
        # Semestre 8
        ("DAT801", "Sistemas de Recomendación y Grafos de Conocimiento", 4, 8),
        ("DAT802", "Modelos de Lenguaje Grande (LLMs) e IA Generativa", 4, 8),
        ("DAT803", "Ciberseguridad y Protección de Datos", 3, 8),
        ("DAT804", "Electiva de Profundización II - Ciencia de Datos", 3, 8),
        ("HUM801", "Formulación y Gestión de Proyectos de Ciencia de Datos", 3, 8),
        # Semestre 9
        ("DAT901", "Proyecto de Grado I - Ciencia de Datos", 4, 9),
        ("DAT902", "Simulación, Teoría de Juegos y Modelos de Decisión", 3, 9),
        ("DAT903", "Electiva de Profundización III - Ciencia de Datos", 3, 9),
        ("DAT904", "Electiva Complementaria de Humanidades", 2, 9),
        # Semestre 10
        ("DAT1001", "Proyecto de Grado II - Ciencia de Datos", 4, 10),
        ("DAT1002", "Práctica Profesional en Ciencia de Datos", 6, 10),
        ("DAT1003", "Emprendimiento de Base Tecnológica en Datos e IA", 3, 10)
    ]),

    "ING-ENERG": ("Ingeniería Energética", [
        # Semestre 1
        ("ENE101", "Introducción a la Ingeniería Energética y Sostenibilidad", 3, 1),
        ("MAT101", "Cálculo Diferencial", 4, 1),
        ("MAT102", "Álgebra Lineal", 3, 1),
        ("QUI101", "Química General e Inorgánica", 3, 1),
        ("ENE102", "Dibujo Técnico y CAD Energético", 3, 1),
        ("HUM101", "Competencias Comunicativas", 2, 1),
        # Semestre 2
        ("ENE201", "Termodinámica Clásica I", 4, 2),
        ("MAT201", "Cálculo Integral", 4, 2),
        ("FIS201", "Física Mecánica y Oscilaciones", 4, 2),
        ("ENE202", "Circuitos Eléctricos y Mediciones", 4, 2),
        ("HUM201", "Cátedra Universitaria Unimagdalena", 2, 2),
        # Semestre 3
        ("ENE301", "Termodinámica Clásica II y Ciclos de Potencia", 4, 3),
        ("ENE302", "Mecánica de Fluidos Energéticos", 4, 3),
        ("MAT301", "Cálculo Multivariado", 3, 3),
        ("FIS301", "Electromagnetismo y Máquinas Eléctricas", 4, 3),
        ("EST301", "Estadística Aplicada a Sistemas Energéticos", 3, 3),
        # Semestre 4
        ("ENE401", "Transferencia de Calor y Masa", 4, 4),
        ("ENE402", "Generación y Conversión de Energía Eléctrica", 4, 4),
        ("MAT401", "Ecuaciones Diferenciales y Modelado", 3, 4),
        ("ENE403", "Recursos Energéticos Fósiles y de Transición", 3, 4),
        ("ENE404", "Instrumentación y Sensores en Plantas Energéticas", 3, 4),
        # Semestre 5
        ("ENE501", "Energía Solar Fotovoltaica y Térmica", 4, 5),
        ("ENE502", "Turbomaquinaria y Centrales Hidroeléctricas", 4, 5),
        ("ENE503", "Combustión, Biomasa y Biocombustibles", 4, 5),
        ("ENE504", "Redes de Distribución y Subestaciones Eléctricas", 3, 5),
        ("ECO601", "Ingeniería Económica y Mercados de Energía", 3, 5),
        # Semestre 6
        ("ENE601", "Energía Eólica y Aerogeneradores", 4, 6),
        ("ENE602", "Eficiencia Energética y Auditorías (ISO 50001)", 4, 6),
        ("ENE603", "Sistemas de Almacenamiento de Energía y Baterías", 4, 6),
        ("ENE604", "Refrigeración, Climatización (HVAC) y Bombas de Calor", 3, 6),
        ("ENE605", "Modelación y Simulación de Sistemas Energéticos", 3, 6),
        # Semestre 7
        ("ENE701", "Redes Eléctricas Inteligentes (Smart Grids) y Microredes", 4, 7),
        ("ENE702", "Hidrógeno Verde, Celdas de Combustible y PtX", 4, 7),
        ("ENE703", "Impacto Ambiental y Descarbonización Industrial", 3, 7),
        ("ENE704", "Electiva de Profundización I - Energética", 3, 7),
        ("HUM701", "Regulación y Marco Legal del Sector Eléctrico y Energético", 2, 7),
        # Semestre 8
        ("ENE801", "Geotermia y Otras Energías No Convencionales", 4, 8),
        ("ENE802", "Generación Distribuida y Autoconsumo Industrial", 4, 8),
        ("ENE803", "Gestión de la Demanda y Movilidad Eléctrica", 3, 8),
        ("ENE804", "Electiva de Profundización II - Energética", 3, 8),
        ("HUM801", "Formulación y Evaluación de Proyectos Energéticos", 3, 8),
        # Semestre 9
        ("ENE901", "Proyecto de Grado I - Energética", 4, 9),
        ("ENE902", "Mercado Eléctrico Mayorista y Transición Energética Justa", 3, 9),
        ("ENE903", "Electiva de Profundización III - Energética", 3, 9),
        ("HUM901", "Ética Profesional y Gobernanza Energética", 2, 9),
        # Semestre 10
        ("ENE1001", "Proyecto de Grado II - Energética", 4, 10),
        ("ENE1002", "Práctica Profesional en Ingeniería Energética", 6, 10),
        ("ENE1003", "Emprendimiento e Innovación en Soluciones Climáticas", 3, 10)
    ])
}

sql_lines = [
    "USE [AssessmentDb];",
    "GO",
    "SET NOCOUNT ON;",
    "PRINT '======================================================================';",
    "PRINT '  CARGA DE MALLAS CURRICULARES COMPLETAS (10 SEMESTRES) - 10 PROGRAMAS ';",
    "PRINT '                 UNIVERSIDAD DEL MAGDALENA                            ';",
    "PRINT '======================================================================';",
    "GO",
    "",
    "-- 1. Asegurar la columna ProgramaAcademicoId en la tabla Asignaturas",
    "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'ProgramaAcademicoId' AND Object_ID = Object_ID(N'Asignaturas'))",
    "BEGIN",
    "    ALTER TABLE [Asignaturas] ADD [ProgramaAcademicoId] uniqueidentifier NULL;",
    "    ALTER TABLE [Asignaturas] ADD CONSTRAINT [FK_Asignaturas_ProgramasAcademicos_ProgramaAcademicoId] ",
    "        FOREIGN KEY ([ProgramaAcademicoId]) REFERENCES [ProgramasAcademicos] ([Id]);",
    "END;",
    "GO",
    "",
    "-- 2. Sincronizar los 10 Programas Académicos",
    "MERGE INTO [ProgramasAcademicos] AS Target",
    "USING (VALUES",
    "    ('ING-SIST', N'Ingeniería de Sistemas', N'Facultad de Ingeniería'),",
    "    ('ING-CIVIL', N'Ingeniería Civil', N'Facultad de Ingeniería'),",
    "    ('ING-IND', N'Ingeniería Industrial', N'Facultad de Ingeniería'),",
    "    ('ING-ELEC', N'Ingeniería Electrónica', N'Facultad de Ingeniería'),",
    "    ('ING-AMB', N'Ingeniería Ambiental y Sanitaria', N'Facultad de Ingeniería'),",
    "    ('ING-AGRO', N'Ingeniería Agronómica', N'Facultad de Ingeniería'),",
    "    ('ING-PESQ', N'Ingeniería Pesquera', N'Facultad de Ingeniería'),",
    "    ('ING-MAR', N'Ingeniería Marino Costera', N'Facultad de Ingeniería'),",
    "    ('ING-DATOS', N'Ingeniería en Ciencia de Datos', N'Facultad de Ingeniería'),",
    "    ('ING-ENERG', N'Ingeniería Energética', N'Facultad de Ingeniería')",
    ") AS Source ([Codigo], [Nombre], [Facultad])",
    "ON (Target.[Codigo] = Source.[Codigo])",
    "WHEN MATCHED THEN",
    "    UPDATE SET Target.[Nombre] = Source.[Nombre], Target.[Facultad] = Source.[Facultad], Target.[EstaActivo] = 1",
    "WHEN NOT MATCHED THEN",
    "    INSERT ([Id], [Codigo], [Nombre], [Facultad], [FechaCreacion], [EstaActivo])",
    "    VALUES (NEWID(), Source.[Codigo], Source.[Nombre], Source.[Facultad], GETUTCDATE(), 1);",
    "GO",
    "",
    "-- 3. Poblar tabla temporal con todas las asignaturas oficiales",
    "CREATE TABLE #TempMallas (",
    "    Codigo NVARCHAR(50),",
    "    Nombre NVARCHAR(200),",
    "    Creditos INT,",
    "    Semestre INT,",
    "    CodigoPrograma NVARCHAR(50)",
    ");",
    ""
]

for prog_cod, (prog_nom, cursos) in programas.items():
    sql_lines.append(f"-- ======================================================================")
    sql_lines.append(f"-- PROGRAMA: {prog_nom} ({prog_cod}) - Total: {len(cursos)} asignaturas")
    sql_lines.append(f"-- ======================================================================")
    sql_lines.append("INSERT INTO #TempMallas (Codigo, Nombre, Creditos, Semestre, CodigoPrograma) VALUES")
    val_lines = []
    for c in cursos:
        cod, nom, cred, sem = c
        nom_escaped = nom.replace("'", "''")
        val_lines.append(f"('{cod}', N'{nom_escaped}', {cred}, {sem}, '{prog_cod}')")
    sql_lines.append(",\n".join(val_lines) + ";\n")

sql_lines.extend([
    "-- 4. Realizar MERGE en la tabla Asignaturas vinculando con el Programa Académico correspondiente",
    "MERGE INTO [Asignaturas] AS Target",
    "USING (",
    "    SELECT ",
    "        t.Codigo,",
    "        t.Nombre,",
    "        t.Creditos,",
    "        t.Semestre,",
    "        p.Id AS ProgramaAcademicoId",
    "    FROM #TempMallas t",
    "    INNER JOIN [ProgramasAcademicos] p ON p.Codigo = t.CodigoPrograma",
    ") AS Source",
    "ON (Target.[Codigo] = Source.[Codigo] AND Target.[ProgramaAcademicoId] = Source.[ProgramaAcademicoId])",
    "WHEN MATCHED THEN",
    "    UPDATE SET ",
    "        Target.[Nombre] = Source.[Nombre],",
    "        Target.[Creditos] = Source.[Creditos],",
    "        Target.[Semestre] = Source.[Semestre],",
    "        Target.[EstaActivo] = 1",
    "WHEN NOT MATCHED THEN",
    "    INSERT ([Id], [Codigo], [Nombre], [Creditos], [Semestre], [ProgramaAcademicoId], [FechaCreacion], [EstaActivo])",
    "    VALUES (NEWID(), Source.[Codigo], Source.[Nombre], Source.[Creditos], Source.[Semestre], Source.[ProgramaAcademicoId], GETUTCDATE(), 1);",
    "",
    "DROP TABLE #TempMallas;",
    "GO",
    "",
    "PRINT '======================================================================';",
    "PRINT '  CARGA COMPLETA EXITOSA: Mallas curriculares de 10 programas cargadas'; ",
    "PRINT '======================================================================';",
    "GO"
])

with open("cargar_mallas_completas_ingenierias.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print("Script cargar_mallas_completas_ingenierias.sql generado exitosamente.")
