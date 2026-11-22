// Datos del taller: estudiantes, profesores y cursos.
// Es UNA sola sentencia CREATE: péguela completa en Query (Aura) o en Neo4j Browser y ejecútela.
CREATE
  // ---- Estudiantes ----
  (ana:Estudiante    {codigo: 'E001', nombre: 'Ana',    carrera: 'Ingeniería de Sistemas', semestre: 7}),
  (luis:Estudiante   {codigo: 'E002', nombre: 'Luis',   carrera: 'Ingeniería de Sistemas', semestre: 6}),
  (eva:Estudiante    {codigo: 'E003', nombre: 'Eva',    carrera: 'Ingeniería de Sistemas', semestre: 5}),
  (pedro:Estudiante  {codigo: 'E004', nombre: 'Pedro',  carrera: 'Ingeniería Industrial',  semestre: 4}),
  (marta:Estudiante  {codigo: 'E005', nombre: 'Marta',  carrera: 'Estadística',            semestre: 5}),
  (camila:Estudiante {codigo: 'E006', nombre: 'Camila', carrera: 'Ingeniería de Sistemas', semestre: 3}),

  // ---- Profesores ----
  (rojas:Profesor  {nombre: 'Sofía Rojas',  departamento: 'Matemáticas'}),
  (pena:Profesor   {nombre: 'Carlos Peña',  departamento: 'Sistemas y Computación'}),
  (vargas:Profesor {nombre: 'Lucía Vargas', departamento: 'Sistemas y Computación'}),

  // ---- Cursos ----
  (cal1:Curso  {codigo: 'CAL1',  nombre: 'Cálculo Diferencial',          creditos: 4, area: 'Matemáticas'}),
  (cal2:Curso  {codigo: 'CAL2',  nombre: 'Cálculo Integral',             creditos: 4, area: 'Matemáticas'}),
  (prog1:Curso {codigo: 'PROG1', nombre: 'Programación de Computadores', creditos: 3, area: 'Computación'}),
  (edd:Curso   {codigo: 'EDD',   nombre: 'Estructuras de Datos',         creditos: 3, area: 'Computación'}),
  (bd:Curso    {codigo: 'BD',    nombre: 'Bases de Datos',               creditos: 3, area: 'Computación'}),
  (alg:Curso   {codigo: 'ALG',   nombre: 'Análisis de Algoritmos',       creditos: 3, area: 'Computación'}),
  (ia:Curso    {codigo: 'IA',    nombre: 'Inteligencia Artificial',      creditos: 3, area: 'Inteligencia Artificial'}),
  (ml:Curso    {codigo: 'ML',    nombre: 'Aprendizaje de Máquina',       creditos: 3, area: 'Inteligencia Artificial'}),

  // ---- Prerrequisitos (propiedad de la relación: tipo) ----
  (cal2)-[:REQUIERE {tipo: 'obligatorio'}]->(cal1),
  (edd)-[:REQUIERE  {tipo: 'obligatorio'}]->(prog1),
  (bd)-[:REQUIERE   {tipo: 'obligatorio'}]->(edd),
  (alg)-[:REQUIERE  {tipo: 'obligatorio'}]->(edd),
  (ia)-[:REQUIERE   {tipo: 'obligatorio'}]->(alg),
  (ia)-[:REQUIERE   {tipo: 'recomendado'}]->(cal2),
  (ml)-[:REQUIERE   {tipo: 'obligatorio'}]->(ia),
  (ml)-[:REQUIERE   {tipo: 'recomendado'}]->(cal2),

  // ---- Quién dicta qué (propiedades de la relación: semestre, grupo) ----
  (rojas)-[:DICTA  {semestre: '2026-2', grupo: 1}]->(cal1),
  (rojas)-[:DICTA  {semestre: '2026-2', grupo: 1}]->(cal2),
  (pena)-[:DICTA   {semestre: '2026-2', grupo: 1}]->(prog1),
  (pena)-[:DICTA   {semestre: '2026-2', grupo: 1}]->(edd),
  (pena)-[:DICTA   {semestre: '2026-2', grupo: 1}]->(alg),
  (vargas)-[:DICTA {semestre: '2026-2', grupo: 1}]->(bd),
  (vargas)-[:DICTA {semestre: '2026-2', grupo: 1}]->(ia),
  (vargas)-[:DICTA {semestre: '2026-2', grupo: 1}]->(ml),
  (vargas)-[:DICTA {semestre: '2026-2', grupo: 2}]->(edd),

  // ---- Inscripciones (propiedades de la relación: semestre, nota). Sin nota = cursando ----
  (ana)-[:INSCRITO_EN {semestre: '2024-1', nota: 4.5}]->(prog1),
  (ana)-[:INSCRITO_EN {semestre: '2024-1', nota: 4.0}]->(cal1),
  (ana)-[:INSCRITO_EN {semestre: '2024-2', nota: 4.2}]->(edd),
  (ana)-[:INSCRITO_EN {semestre: '2024-2', nota: 3.8}]->(cal2),
  (ana)-[:INSCRITO_EN {semestre: '2025-1', nota: 4.8}]->(bd),
  (ana)-[:INSCRITO_EN {semestre: '2025-1', nota: 4.0}]->(alg),
  (ana)-[:INSCRITO_EN {semestre: '2025-2', nota: 4.6}]->(ia),
  (ana)-[:INSCRITO_EN {semestre: '2026-2'}]->(ml),

  (luis)-[:INSCRITO_EN {semestre: '2024-1', nota: 3.5}]->(prog1),
  (luis)-[:INSCRITO_EN {semestre: '2024-1', nota: 3.0}]->(cal1),
  (luis)-[:INSCRITO_EN {semestre: '2024-2', nota: 3.9}]->(edd),
  (luis)-[:INSCRITO_EN {semestre: '2025-1', nota: 4.1}]->(bd),
  (luis)-[:INSCRITO_EN {semestre: '2025-2', nota: 3.2}]->(alg),
  (luis)-[:INSCRITO_EN {semestre: '2026-2'}]->(ia),

  (eva)-[:INSCRITO_EN {semestre: '2025-1', nota: 4.9}]->(prog1),
  (eva)-[:INSCRITO_EN {semestre: '2025-1', nota: 4.5}]->(cal1),
  (eva)-[:INSCRITO_EN {semestre: '2025-2', nota: 4.7}]->(edd),
  (eva)-[:INSCRITO_EN {semestre: '2026-1', nota: 5.0}]->(bd),
  (eva)-[:INSCRITO_EN {semestre: '2026-1', nota: 4.4}]->(alg),

  (pedro)-[:INSCRITO_EN {semestre: '2025-2', nota: 3.2}]->(prog1),
  (pedro)-[:INSCRITO_EN {semestre: '2025-2', nota: 3.5}]->(cal1),
  (pedro)-[:INSCRITO_EN {semestre: '2026-1', nota: 3.0}]->(edd),

  (marta)-[:INSCRITO_EN {semestre: '2025-1', nota: 4.0}]->(prog1),
  (marta)-[:INSCRITO_EN {semestre: '2025-1', nota: 4.1}]->(cal1),
  (marta)-[:INSCRITO_EN {semestre: '2025-2', nota: 4.3}]->(cal2),
  (marta)-[:INSCRITO_EN {semestre: '2025-2', nota: 4.4}]->(edd),
  (marta)-[:INSCRITO_EN {semestre: '2026-1', nota: 4.2}]->(bd),

  (camila)-[:INSCRITO_EN {semestre: '2026-1', nota: 4.7}]->(prog1),
  (camila)-[:INSCRITO_EN {semestre: '2026-1', nota: 4.2}]->(cal1),
  (camila)-[:INSCRITO_EN {semestre: '2026-2'}]->(edd),

  // ---- Amistades (propiedad de la relación: desde) ----
  (ana)-[:AMIGO_DE   {desde: 2024}]->(luis),
  (ana)-[:AMIGO_DE   {desde: 2025}]->(eva),
  (luis)-[:AMIGO_DE  {desde: 2025}]->(pedro),
  (eva)-[:AMIGO_DE   {desde: 2025}]->(marta),
  (marta)-[:AMIGO_DE {desde: 2026}]->(camila),
  (pedro)-[:AMIGO_DE {desde: 2026}]->(camila);
