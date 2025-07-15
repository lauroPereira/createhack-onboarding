import os, uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Configurações Supabase
env_url = os.environ.get("SUPABASE_URL")
env_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(env_url, env_key)

# Factory da aplicação
def create_app():
    app = Flask(__name__)
    CORS(app)

    @app.route('/api/check-email')
    def check_email():
        email = request.args.get('email')
        if not email:
            return jsonify(error='Email é obrigatório'), 400
        data = supabase.table('users').select('id').eq('email', email).execute()
        exists = bool(data.data)
        return jsonify(exists=exists)

    @app.route('/api/register', methods=['POST'])
    def register():
        payload = request.get_json() or {}
        email = payload.get('email')
        name = payload.get('name')
        if not email or not name:
            return jsonify(error='Nome e email são obrigatórios'), 400
        # Insere novo usuário
        user_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        record = {
            'id': user_id,
            'email': email,
            'name': name,
            'created_at': now
        }
        result = supabase.table('users').insert(record).execute()
        if result.error:
            return jsonify(error=result.error.message), 400
        return jsonify(message='Conta criada com sucesso', user=record)

    @app.route('/api/login', methods=['POST'])
    def login():
        payload = request.get_json() or {}
        email = payload.get('email')
        if not email:
            return jsonify(error='Email é obrigatório'), 400
        data = supabase.table('users').select('id,email,name').eq('email', email).single().execute()
        if data.error or not data.data:
            return jsonify(error='Email não cadastrado. Cadastre-se primeiro.'), 404
        return jsonify(message='Login realizado com sucesso', user=data.data)

    @app.route('/api/participants', methods=['GET', 'POST'])
    def participants():
        if request.method == 'GET':
            data = supabase.table('participants').select('*').execute()
            return jsonify(data.data)

        payload = request.get_json() or {}
        user_id = payload.get('user_id')
        if not user_id:
            return jsonify(error='ID do usuário é obrigatório'), 400
        now = datetime.utcnow().isoformat()
        record = {
            'user_id': user_id,
            'name': payload.get('name'),
            'city': payload.get('city'),
            'church': payload.get('church'),
            'age': payload.get('age'),
            'bio': payload.get('bio'),
            'skills': payload.get('skills', []),
            'photo': payload.get('photo'),
            'updated_at': now
        }
        # Verifica existência
        existing = supabase.table('participants').select('id').eq('user_id', user_id).single().execute()
        if existing.data:
            # Atualiza participante
            result = supabase.table('participants').update(record).eq('user_id', user_id).execute()
            if result.error:
                return jsonify(error=result.error.message), 400
            message = 'Participante atualizado com sucesso'
        else:
            # Cria participante
            record['id'] = str(uuid.uuid4())
            record['created_at'] = now
            result = supabase.table('participants').insert(record).execute()
            if result.error:
                return jsonify(error=result.error.message), 400
            message = 'Participante criado com sucesso'
        return jsonify(message=message, participant=record)

    @app.route('/api/participants/<user_id>')
    def get_participant(user_id):
        data = supabase.table('participants').select('*').eq('user_id', user_id).single().execute()
        if data.error or not data.data:
            return jsonify(error='Participante não encontrado'), 404
        return jsonify(data.data)

    @app.route('/health')
    def health():
        return {'status': 'ok'}

    return app

if __name__ == '__main__':
    create_app().run(host='0.0.0.0', port=5000, debug=True)
