// Borra TODOS los nodos y relaciones de la base de datos.
// Ejecútelo solo si necesita volver a cargar los datos desde cero.
MATCH (n) DETACH DELETE n;
