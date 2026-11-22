"""Script mínimo para conectarse a Neo4j (Aura o local) desde Python.

Uso:  python app.py
"""
import os

from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()
driver = GraphDatabase.driver(
    os.environ["NEO4J_URI"],
    auth=(os.environ["NEO4J_USER"], os.environ["NEO4J_PASSWORD"]),
)


def cursos(nombre):
    """Lectura: cursos de un estudiante, con las propiedades de la relación."""
    registros, _, _ = driver.execute_query(
        "MATCH (:Estudiante {nombre: $nombre})-[r:INSCRITO_EN]->(c:Curso) "
        "RETURN c.nombre AS curso, r.semestre AS semestre, r.nota AS nota "
        "ORDER BY r.semestre",
        nombre=nombre,
        routing_="r",
    )
    for r in registros:
        nota = r["nota"] if r["nota"] is not None else "cursando"
        print(f"  {r['semestre']}  {r['curso']:<30} {nota}")


def recomendar(nombre):
    """Lectura: cursos que sus amigos aprobaron con nota >= 4.0 y el estudiante aún no tiene."""
    registros, _, _ = driver.execute_query(
        "MATCH (yo:Estudiante {nombre: $nombre})-[:AMIGO_DE]-(a:Estudiante)-[r:INSCRITO_EN]->(c:Curso) "
        "WHERE r.nota >= 4.0 AND NOT (yo)-[:INSCRITO_EN]->(c) "
        "RETURN c.nombre AS curso, count(DISTINCT a) AS amigos, round(avg(r.nota), 2) AS promedio "
        "ORDER BY amigos DESC, promedio DESC",
        nombre=nombre,
        routing_="r",
    )
    if not registros:
        print("  Sin recomendaciones.")
    for r in registros:
        print(f"  {r['curso']:<30} amigos: {r['amigos']}  nota promedio: {r['promedio']}")


def registrar_nota(nombre, codigo, nota):
    """Escritura: modifica la propiedad nota de una relación INSCRITO_EN."""
    _, resumen, _ = driver.execute_query(
        "MATCH (:Estudiante {nombre: $nombre})-[r:INSCRITO_EN]->(:Curso {codigo: $codigo}) "
        "SET r.nota = $nota",
        nombre=nombre,
        codigo=codigo,
        nota=nota,
    )
    print(f"  Propiedades modificadas: {resumen.counters.properties_set}")


def main():
    driver.verify_connectivity()
    print("Conectado a Neo4j.")
    while True:
        print("\n1. Ver los cursos de un estudiante")
        print("2. Recomendar cursos a un estudiante")
        print("3. Registrar una nota")
        print("0. Salir")
        op = input("Opción: ").strip()
        if op == "0":
            break
        if op == "1":
            cursos(input("Estudiante: ").strip())
        elif op == "2":
            recomendar(input("Estudiante: ").strip())
        elif op == "3":
            registrar_nota(
                input("Estudiante: ").strip(),
                input("Código del curso (por ejemplo ML): ").strip().upper(),
                float(input("Nota: ")),
            )
        else:
            print("Opción no válida.")
    driver.close()


if __name__ == "__main__":
    main()
