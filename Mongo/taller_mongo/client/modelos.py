"""Modelos ODM (MongoEngine) del chat.

Cada clase Document corresponde a una colección de MongoDB; cada
EmbeddedDocument es un documento que vive DENTRO de otro (embebido).
"""
from datetime import datetime, timezone

from mongoengine import (
    Document, EmbeddedDocument,
    StringField, EmailField, DateTimeField, IntField,
    ReferenceField, EmbeddedDocumentField, EmbeddedDocumentListField,
)


def ahora():
    return datetime.now(timezone.utc)


class Usuario(Document):
    nombre = StringField(required=True)
    correo = EmailField(required=True, unique=True)
    creado_en = DateTimeField(default=ahora)
    meta = {"collection": "usuarios"}


class Participante(EmbeddedDocument):
    """Copia reducida del usuario (referencia + nombre desnormalizado)."""
    usuario = ReferenceField(Usuario, required=True, db_field="usuario_id")
    nombre = StringField(required=True)


class Conversacion(Document):
    tipo = StringField(choices=["directa", "grupo"], required=True)
    titulo = StringField()  # solo los grupos lo tienen
    participantes = EmbeddedDocumentListField(Participante)  # EMBEBIDO
    creada_en = DateTimeField(default=ahora)
    meta = {"collection": "conversaciones"}


class Reaccion(EmbeddedDocument):
    usuario = ReferenceField(Usuario, required=True, db_field="usuario_id")
    emoji = StringField(required=True)


class Adjunto(EmbeddedDocument):
    nombre = StringField(required=True)
    tipo = StringField()
    tamano_bytes = IntField()


class Respuesta(EmbeddedDocument):
    """Respuesta dentro del hilo de un mensaje (embebida en el mensaje padre)."""
    autor = EmbeddedDocumentField(Participante, required=True)
    texto = StringField(required=True)
    enviado_en = DateTimeField(default=ahora)


class Mensaje(Document):
    conversacion = ReferenceField(  # REFERENCIA a otra colección
        Conversacion, required=True, db_field="conversacion_id"
    )
    autor = EmbeddedDocumentField(Participante, required=True)
    texto = StringField(required=True)
    enviado_en = DateTimeField(default=ahora)
    editado_en = DateTimeField()
    reacciones = EmbeddedDocumentListField(Reaccion)  # EMBEBIDO
    respuestas = EmbeddedDocumentListField(Respuesta)  # EMBEBIDO (hilo)
    adjuntos = EmbeddedDocumentListField(Adjunto)  # EMBEBIDO
    meta = {
        "collection": "mensajes",
        "indexes": [("conversacion", "-enviado_en")],
    }
