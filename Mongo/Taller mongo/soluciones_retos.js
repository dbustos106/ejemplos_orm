// Ejecutar en mongosh sobre la base "chat".
db = db.getSiblingDB("chat");

// Reto 1: mensajes que tienen al menos una respuesta
db.mensajes.find({ "respuestas.0": { $exists: true } });

// Reto 2: mensajes con adjuntos PDF (solo texto y nombre del adjunto)
db.mensajes.find({ "adjuntos.tipo": "application/pdf" }, { texto: 1, "adjuntos.nombre": 1, _id: 0 });

// Reto 3: mensajes de Luis o Eva enviados después de las 10:10 UTC
db.mensajes.find({
  "autor.nombre": { $in: ["Luis", "Eva"] },
  enviado_en: { $gt: new Date("2026-11-18T10:10:00Z") }
});

// Reto 4: crear a Pedro si no existe (upsert) y agregarlo al grupo
const pedro = db.usuarios.findOneAndUpdate(
  { correo: "pedro@unal.edu.co" },
  { $setOnInsert: { nombre: "Pedro", creado_en: new Date() } },
  { upsert: true, returnDocument: "after" }
);
db.conversaciones.updateOne(
  { titulo: "Bases de Datos" },
  { $addToSet: { participantes: { usuario_id: pedro._id, nombre: "Pedro" } } }
);

// Reto 5: número de respuestas por mensaje, de mayor a menor
db.mensajes.aggregate([
  { $project: { texto: 1, total_respuestas: { $size: { $ifNull: ["$respuestas", []] } } } },
  { $sort: { total_respuestas: -1 } }
]);

// Reto 6: cada mensaje con el nombre de su conversación
db.mensajes.aggregate([
  { $lookup: { from: "conversaciones", localField: "conversacion_id", foreignField: "_id", as: "conv" } },
  { $unwind: "$conv" },
  { $project: { _id: 0, texto: 1, conversacion: { $ifNull: ["$conv.titulo", "Chat directo"] } } }
]);

// Reto 7: quitar la reacción 🎉 de un mensaje
db.mensajes.updateOne({ texto: "Aquí está el resumen" }, { $pull: { reacciones: { emoji: "🎉" } } });

// Reto 8 (Python): en app.py, una función que busque mensajes por palabra
//   def buscar():
//       palabra = input("Palabra: ")
//       for m in Mensaje.objects(texto__icontains=palabra):
//           print(m.autor.nombre, ":", m.texto)
