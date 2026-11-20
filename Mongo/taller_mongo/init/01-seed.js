// Datos de ejemplo del taller (base de datos "chat").
// Docker: se ejecuta solo la primera vez que arranca el contenedor.
// Atlas: ejecútelo en mongosh o en la pestaña MONGOSH de Compass.
db = db.getSiblingDB("chat");

db.mensajes.drop();
db.conversaciones.drop();
db.usuarios.drop();

const u = db.usuarios.insertMany([
  { nombre: "Ana",  correo: "ana@unal.edu.co",  creado_en: new Date("2026-01-10") },
  { nombre: "Luis", correo: "luis@unal.edu.co", creado_en: new Date("2026-01-12") },
  { nombre: "Eva",  correo: "eva@unal.edu.co",  creado_en: new Date("2026-01-15") }
]).insertedIds;

const ana  = { usuario_id: u[0], nombre: "Ana" };
const luis = { usuario_id: u[1], nombre: "Luis" };
const eva  = { usuario_id: u[2], nombre: "Eva" };

const c = db.conversaciones.insertMany([
  { tipo: "directa", participantes: [ana, luis], creada_en: new Date("2026-02-01") },
  { tipo: "grupo", titulo: "Bases de Datos", participantes: [ana, luis, eva], creada_en: new Date("2026-02-02") }
]).insertedIds;

db.mensajes.insertMany([
  { conversacion_id: c[1], autor: ana, texto: "¿Quién tiene los apuntes de NoSQL?",
    enviado_en: new Date("2026-11-18T10:00:00Z"), reacciones: [],
    respuestas: [
      { autor: luis, texto: "Yo los subo hoy", enviado_en: new Date("2026-11-18T10:03:00Z") },
      { autor: eva,  texto: "Ya los tengo, adjunto el PDF", enviado_en: new Date("2026-11-18T10:05:00Z") }
    ] },
  { conversacion_id: c[1], autor: eva, texto: "Aquí está el resumen",
    enviado_en: new Date("2026-11-18T10:06:00Z"),
    reacciones: [ { usuario_id: u[0], emoji: "👍" }, { usuario_id: u[1], emoji: "🎉" } ],
    respuestas: [],
    adjuntos: [ { nombre: "nosql.pdf", tipo: "application/pdf", tamano_bytes: 482133 } ] },
  { conversacion_id: c[1], autor: luis, texto: "¿Repasamos MongoDB mañana?",
    enviado_en: new Date("2026-11-18T10:30:00Z"), reacciones: [], respuestas: [] },
  { conversacion_id: c[0], autor: luis, texto: "¿Nos vemos mañana?",
    enviado_en: new Date("2026-11-18T11:00:00Z"), reacciones: [], respuestas: [] }
]);

db.mensajes.createIndex({ conversacion_id: 1, enviado_en: -1 });
db.usuarios.createIndex({ correo: 1 }, { unique: true });
print("Datos cargados en la base 'chat'.");
