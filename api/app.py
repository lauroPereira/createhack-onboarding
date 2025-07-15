import os, json, uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from postgrest.exceptions import APIError
import logging

# Configuração de logs
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
        email = request.args.get('email')
        logger.info("Checking email for %s", email)
        if not email:
            return jsonify(error='Email é obrigatório'), 400
        data = supabase.table('users').select('id').eq('email', email).execute()
        exists = bool(data.data)
        logger.info("Email exists: %s", exists)
        return jsonify(exists=exists)

    @app.route('/api/register', methods=['POST'])
    def register():
        payload = request.get_json() or {}
        logger.info("Registering user %s", payload)
        email = payload.get('email')
        name = payload.get('name')
        if not email or not name:
            return jsonify(error='Nome e email são obrigatórios'), 400

        user_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        record = {'id': user_id, 'email': email, 'name': name, 'created_at': now}

        try:
            response = supabase.table('users').insert(record).execute()
        except APIError as err:
            logger.error("Error inserting user: %s", err)
            return jsonify(error=str(err)), 400

        user_data = response.data[0] if response.data else record
        logger.info("User registered: %s", user_data)
        return jsonify(message='Conta criada com sucesso', user=user_data)

    @app.route('/api/login', methods=['POST'])
    def login():
        payload = request.get_json() or {}
        logger.info("Logging in user %s", payload)
        email = payload.get('email')
        if not email:
            return jsonify(error='Email é obrigatório'), 400
        data = supabase.table('users').select('id,email,name').eq('email', email).single().execute()
        if not data.data:
            logger.warning("Login failed for email: %s", email)
            return jsonify(error='Email não cadastrado. Cadastre-se primeiro.'), 404
        logger.info("User logged in: %s", data.data)
        return jsonify(message='Login realizado com sucesso', user=data.data)

    @app.route('/api/participants', methods=['GET', 'POST'])
    def participants():
        if request.method == 'GET':
            logger.info("Fetching participants list")
            data = supabase.table('participants').select('*').execute()
            logger.info("Participants response count: %d", len(data.data))
            return jsonify(data.data)

        payload = request.get_json() or {}
        logger.info("Participants request POST: %s", payload)
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
        existing = supabase.table('participants').select('id').eq('user_id', user_id).single().execute()
        logger.info("Participants existing: %s", existing.data)

        try:
            if existing.data:
                logger.info("Updating participant record: %s", record)
                result = supabase.table('participants').update(record).eq('user_id', user_id).execute()
                participant_data = result.data[0] if result.data else record
                message = 'Participante atualizado com sucesso'
                logger.info("Participants update result: %s", participant_data)
            else:
                record['id'] = str(uuid.uuid4())
                record['created_at'] = now
                logger.info("Inserting new participant: %s", record)
                result = supabase.table('participants').insert(record).execute()
                participant_data = result.data[0] if result.data else record
                message = 'Participante criado com sucesso'
                logger.info("Participants insert result: %s", participant_data)
        except APIError as err:
            logger.error("Error saving participant: %s", err)
            return jsonify(error=str(err)), 400

        return jsonify(message=message, participant=participant_data)

    @app.route('/api/participants/<user_id>')
    def get_participant(user_id):
        logger.info("Getting participant for user %s", user_id)
        data = supabase.table('participants').select('*').eq('user_id', user_id).single().execute()
        if not data.data:
            logger.warning("Participant not found: %s", user_id)
            return jsonify(error='Participante não encontrado'), 404
        logger.info("Participant response: %s", data.data)
        return jsonify(data.data)

    @app.route('/health')
    def health():
        logger.info("Health check")
        return {'status': 'ok'}

    return app

# Instância WSGI reconhecida pelo Vercel
app = create_app()

if __name__ == '__main__':
    logger.info("Starting server locally")
    app.run(host='0.0.0.0', port=5000, debug=True)
    