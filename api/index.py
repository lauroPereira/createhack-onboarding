import os, json, uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurações Supabase
env_url = os.environ.get("SUPABASE_URL")
env_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(env_url, env_key)

# --- Factory da aplicação ---
def create_app():
    app = Flask(__name__)
    CORS(app)

    @app.route('/api/check-email')
    def check_email():
        logger.info("Checking email for %s", request.args.get('email'))
        email = request.args.get('email')
        if not email:
            return jsonify(error='Email é obrigatório'), 400
        data = supabase.table('users').select('id').eq('email', email).execute()
        logger.info("Email exists: %s", bool(data.data))
        return jsonify(exists=bool(data.data))

    @app.route('/api/register', methods=['POST'])
    def register():
        logger.info("Registering user %s", request.get_json())
        payload = request.get_json() or {}
        email = payload.get('email')
        name = payload.get('name')
        if not email or not name:
            return jsonify(error='Nome e email são obrigatórios'), 400
        user_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        record = {'id': user_id, 'email': email, 'name': name, 'created_at': now}
        result = supabase.table('users').insert(record).execute()
        logger.info("User registered: %s", result.data)
        if result.error:
            return jsonify(error=result.error.message), 400
        return jsonify(message='Conta criada com sucesso', user=record)

    @app.route('/api/login', methods=['POST'])
    def login():
        logger.info("Logging in user %s", request.get_json())
        payload = request.get_json() or {}
        email = payload.get('email')
        if not email:
            return jsonify(error='Email é obrigatório'), 400
        data = supabase.table('users').select('id,email,name').eq('email', email).single().execute()
        logger.info("User logged in: %s", data.data)
        if data.error or not data.data:
            return jsonify(error='Email não cadastrado. Cadastre-se primeiro.'), 404
        return jsonify(message='Login realizado com sucesso', user=data.data)

    @app.route('/api/participants', methods=['GET', 'POST'])
    def participants():
        logger.info("Participants request: %s", request.method)
        if request.method == 'GET':
            data = supabase.table('participants').select('*').execute()
            logger.info("Participants response: %s", data.data)
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
        # Atualiza ou cria
        existing = supabase.table('participants').select('id').eq('user_id', user_id).single().execute()
        logger.info("Participants existing: %s", existing.data)
        logger.info("Participants record: %s", record)
        if existing.data:
            result = supabase.table('participants').update(record).eq('user_id', user_id).execute()
            logger.info("Participants update result: %s", result.data)
            if result.error:
                return jsonify(error=result.error.message), 400
            message = 'Participante atualizado com sucesso'
        else:
            logger.info("Participants insert record: %s", record)
            record['id'] = str(uuid.uuid4())
            record['created_at'] = now
            result = supabase.table('participants').insert(record).execute()
            logger.info("Participants insert result: %s", result.data)
            if result.error:
                return jsonify(error=result.error.message), 400
            message = 'Participante criado com sucesso'
        return jsonify(message=message, participant=record)

    @app.route('/api/participants/<user_id>')
    def get_participant(user_id):
        logger.info("Getting participant for user %s", user_id)
        data = supabase.table('participants').select('*').eq('user_id', user_id).single().execute()
        logger.info("Participant response: %s", data.data)
        if data.error or not data.data:
            return jsonify(error='Participante não encontrado'), 404
        return jsonify(data.data)

    @app.route('/health')
    def health():
        logger.info("Health check")
        return {'status': 'ok'}

    return app

# Instância WSGI para Vercel
auth_app = create_app()

if __name__ == '__main__':
    logger.info("Starting server")
    auth_app.run(host='0.0.0.0', port=5000, debug=True)
