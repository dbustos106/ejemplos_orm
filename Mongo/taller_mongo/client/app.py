"""Aplicación de consola para modificar la base de datos del chat usando un ODM.

Uso:  python app.py
"""
import os

from dotenv import load_dotenv
from mongoengine import connect

from modelos import (
    Usuario, Participante, Conversacion, Mensaje, Respuesta, Reaccion, Adjunto, ahora,
)


def conectar():
    load_dotenv()
    uri = os.getenv("MONGODB_URI", "mongodb://admin:admin123@localhost:27017/?authSource=admin")
    connect(db=os.getenv("MONGODB_DB", "chat"), host=uri)


# ---------- utilidades ----------
def elegir(titulo, opciones, mostrar):
    """Muestra una lista numerada y devuelve el elemento elegido (o None)."""
    if not opciones:
        print("No hay elementos para elegir.")
        return None
    for i, o in enumerate(opciones, 1):
        print(f"  {i}. {mostrar(o)}")
    while True:
        try:
            n = int(input(f"{titulo} (1-{len(opciones)}): "))
            if 1 <= n <= len(opciones):
                return opciones[n - 1]
        except ValueError:
            pass
        print("Opción no válida.")


def nombre_conv(c):
    if c.titulo:
        return c.titulo
    return "Chat directo: " + ", ".join(p.nombre for p in c.participantes)


def elegir_mensaje():
    recientes = list(Mensaje.objects.order_by("-enviado_en").limit(10))
    return elegir("Mensaje", recientes, lambda m: f"{m.autor.nombre}: {m.texto[:45]}")


def como_participante(p):
    return Participante(usuario=p.usuario, nombre=p.nombre)


# ---------- operaciones ----------
def listar():
    for c in Conversacion.objects:
        print(f"\n# {nombre_conv(c)} [{c.tipo}]")
        for m in Mensaje.objects(conversacion=c).order_by("-enviado_en").limit(5):
            marca = " (editado)" if m.editado_en else ""
            print(f"  {m.autor.nombre}: {m.texto}{marca}")
            for r in m.respuestas:
                print(f"      ↳ {r.autor.nombre}: {r.texto}")
            if m.reacciones:
                print("      reacciones:", " ".join(x.emoji for x in m.reacciones))
            for a in m.adjuntos:
                print(f"      adjunto: {a.nombre}")


def enviar():
    conv = elegir("Conversación", list(Conversacion.objects), nombre_conv)
    if not conv:
        return
    autor = elegir("Autor", list(conv.participantes), lambda p: p.nombre)
    texto = input("Texto del mensaje: ").strip()
    if autor and texto:
        Mensaje(conversacion=conv, autor=como_participante(autor), texto=texto).save()
        print("Mensaje enviado.")


def responder():
    msg = elegir_mensaje()
    if not msg:
        return
    autor = elegir("Autor de la respuesta", list(msg.conversacion.participantes), lambda p: p.nombre)
    texto = input("Texto de la respuesta: ").strip()
    if autor and texto:
        # Se agrega al arreglo "respuestas" embebido en el mensaje padre ($push).
        msg.update(push__respuestas=Respuesta(autor=como_participante(autor), texto=texto))
        print("Respuesta agregada al hilo.")


def reaccionar():
    msg = elegir_mensaje()
    if not msg:
        return
    quien = elegir("Quién reacciona", list(msg.conversacion.participantes), lambda p: p.nombre)
    emoji = input("Emoji [👍]: ").strip() or "👍"
    if quien:
        msg.update(push__reacciones=Reaccion(usuario=quien.usuario, emoji=emoji))
        print("Reacción agregada.")


def editar():
    msg = elegir_mensaje()
    if not msg:
        return
    nuevo = input("Nuevo texto: ").strip()
    if nuevo:
        msg.update(set__texto=nuevo, set__editado_en=ahora())  # $set
        print("Mensaje editado.")


def eliminar():
    msg = elegir_mensaje()
    if msg and input(f"¿Eliminar «{msg.texto[:40]}»? (s/n): ").lower() == "s":
        msg.delete()
        print("Mensaje eliminado.")


def actividad():
    """Cruza varias colecciones: usuarios, conversaciones y mensajes."""
    print("\nActividad por usuario")
    for u in Usuario.objects:
        n_conv = Conversacion.objects(participantes__usuario=u).count()
        n_msg = Mensaje.objects(autor__usuario=u).count()
        print(f"  {u.nombre:<6} conversaciones: {n_conv}   mensajes: {n_msg}")

    print("\nMensajes por conversación (pipeline con $lookup)")
    pipeline = [
        {"$group": {"_id": "$conversacion_id", "mensajes": {"$sum": 1}}},
        {"$lookup": {"from": "conversaciones", "localField": "_id",
                     "foreignField": "_id", "as": "conv"}},
        {"$unwind": "$conv"},
        {"$sort": {"mensajes": -1}},
    ]
    for fila in Mensaje.objects.aggregate(pipeline):
        titulo = fila["conv"].get("titulo") or "Chat directo"
        print(f"  {titulo}: {fila['mensajes']}")


def sembrar():
    if Usuario.objects.count():
        print("Ya hay datos. Use la opción 9 para borrarlos primero.")
        return
    ana = Usuario(nombre="Ana", correo="ana@unal.edu.co").save()
    luis = Usuario(nombre="Luis", correo="luis@unal.edu.co").save()
    eva = Usuario(nombre="Eva", correo="eva@unal.edu.co").save()

    def p(u):
        return Participante(usuario=u, nombre=u.nombre)

    directa = Conversacion(tipo="directa", participantes=[p(ana), p(luis)]).save()
    grupo = Conversacion(tipo="grupo", titulo="Bases de Datos",
                         participantes=[p(ana), p(luis), p(eva)]).save()
    Mensaje(conversacion=grupo, autor=p(ana), texto="¿Quién tiene los apuntes de NoSQL?",
            respuestas=[Respuesta(autor=p(luis), texto="Yo los subo hoy"),
                        Respuesta(autor=p(eva), texto="Ya los tengo, adjunto el PDF")]).save()
    Mensaje(conversacion=grupo, autor=p(eva), texto="Aquí está el resumen",
            reacciones=[Reaccion(usuario=ana, emoji="👍"), Reaccion(usuario=luis, emoji="🎉")],
            adjuntos=[Adjunto(nombre="nosql.pdf", tipo="application/pdf", tamano_bytes=482133)]).save()
    Mensaje(conversacion=grupo, autor=p(luis), texto="¿Repasamos MongoDB mañana?").save()
    Mensaje(conversacion=directa, autor=p(luis), texto="¿Nos vemos mañana?").save()
    print("Datos de ejemplo cargados.")


def borrar_todo():
    if input("Esto borra TODAS las colecciones del chat. ¿Continuar? (s/n): ").lower() == "s":
        for modelo in (Mensaje, Conversacion, Usuario):
            modelo.drop_collection()
        print("Colecciones eliminadas.")


MENU = {
    "1": ("Ver conversaciones y mensajes", listar),
    "2": ("Enviar un mensaje", enviar),
    "3": ("Responder en el hilo de un mensaje", responder),
    "4": ("Reaccionar a un mensaje", reaccionar),
    "5": ("Editar un mensaje", editar),
    "6": ("Eliminar un mensaje", eliminar),
    "7": ("Actividad por usuario y conversación", actividad),
    "8": ("Cargar datos de ejemplo", sembrar),
    "9": ("Borrar todos los datos", borrar_todo),
}


def main():
    conectar()
    while True:
        print("\n=== Chat con MongoDB y ODM ===")
        for k, (texto, _) in MENU.items():
            print(f" {k}. {texto}")
        print(" 0. Salir")
        op = input("Opción: ").strip()
        if op == "0":
            break
        if op in MENU:
            MENU[op][1]()
        else:
            print("Opción no válida.")


if __name__ == "__main__":
    main()
