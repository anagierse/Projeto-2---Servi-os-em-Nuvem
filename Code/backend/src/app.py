import os
import psycopg2
from flask import Flask, request, jsonify
from flask_cors import CORS 

app = Flask(__name__)
CORS(app) 

DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'port': os.getenv('DB_PORT', 5432),
    'dbname': os.getenv('DB_NAME'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD')
}

def get_db_connection():
    try:
        return psycopg2.connect(**DB_CONFIG)
    except Exception as e:
        print(f"[ERRO] Falha na conexão com o banco: {e}")
        return None



@app.route('/receitas', methods=['GET'])
def listar_receitas():
    conn = get_db_connection()
    if not conn:
        return jsonify({"erro": "Falha na conexão com o banco"}), 503
    
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, titulo, descricao, tempo_preparo_min, porcoes FROM receitas ORDER BY id;")
        colunas = [desc[0] for desc in cur.description]
        receitas = [dict(zip(colunas, row)) for row in cur.fetchall()]
        cur.close()
        conn.close()
        return jsonify(receitas)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500



@app.route('/receitas/<int:receita_id>', methods=['GET'])
def obter_receita(receita_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"erro": "Falha na conexão com o banco"}), 503
    
    cur = conn.cursor()
    cur.execute("SELECT id, titulo, descricao, tempo_preparo_min, porcoes FROM receitas WHERE id = %s;", (receita_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row:
        return jsonify({"mensagem": "Receita não encontrada"}), 404
    
    colunas = ["id", "titulo", "descricao", "tempo_preparo_min", "porcoes"]
    return jsonify(dict(zip(colunas, row)))


@app.route('/receitas', methods=['POST'])
def criar_receita():
    data = request.get_json()
    if not data or 'titulo' not in data:
        return jsonify({"erro": "Campo 'titulo' é obrigatório"}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({"erro": "Falha na conexão com o banco"}), 503
    
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO receitas (titulo, descricao, tempo_preparo_min, porcoes)
            VALUES (%s, %s, %s, %s)
            RETURNING id;
        """, (data['titulo'], data.get('descricao'), data.get('tempo_preparo_min'), data.get('porcoes')))
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"id": new_id, "mensagem": "Receita criada com sucesso"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"erro": str(e)}), 500


@app.route('/receitas/<int:receita_id>', methods=['PUT'])
def atualizar_receita(receita_id):
    data = request.get_json()
    if not data or 'titulo' not in data:
        return jsonify({"erro": "Campo 'titulo' é obrigatório"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"erro": "Falha na conexão com o banco"}), 503
    
    try:
        cur = conn.cursor()
        cur.execute("""
            UPDATE receitas
            SET titulo = %s, descricao = %s, tempo_preparo_min = %s, porcoes = %s
            WHERE id = %s;
        """, (data['titulo'], data.get('descricao'), data.get('tempo_preparo_min'), data.get('porcoes'), receita_id))
        atualizado = cur.rowcount
        conn.commit()
        cur.close()
        conn.close()
        if atualizado == 0:
            return jsonify({"mensagem": "Receita não encontrada"}), 404
        return jsonify({"mensagem": "Receita atualizada com sucesso"})
    except Exception as e:
        conn.rollback()
        return jsonify({"erro": str(e)}), 500


@app.route('/receitas/<int:receita_id>', methods=['DELETE'])
def deletar_receita(receita_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"erro": "Falha na conexão com o banco"}), 503

    cur = conn.cursor()
    cur.execute("DELETE FROM receitas WHERE id = %s;", (receita_id,))
    deletado = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()

    if deletado == 0:
        return jsonify({"mensagem": "Receita não encontrada"}), 404
    return '', 204



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)