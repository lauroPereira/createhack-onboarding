import os
import pprint
import uuid
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


# --- Utils ---
def remove_photo(resultset : dict | list):
    
    if type(resultset) == dict:
        new_resultset = resultset.copy()
        del new_resultset['photo']
        return new_resultset
    
    elif type(resultset) == list:
        new_resultset = []
        for row in resultset:
            new_row = row.copy()
            del new_row['photo']
            new_resultset.append(new_row)
        return new_resultset
    else:
        return resultset
        
        


# --- Factory da aplicação ---

def create_app():
    app = Flask(__name__)
    CORS(app)


    @app.route('/api/check-email')
    def check_email():
        """
        Verifica se um email ja esta cadastrado no banco de dados

        Args:
            email (str): Email a ser verificado

        Returns:
            bool: True se o email ja esta cadastrado, False caso contrario
        """
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
        """
        Cadastra um novo usuario no banco de dados

        Args:
            email (str): Email do usuario
            name (str): Nome do usuario

        Returns:
            dict: Dados do usuario cadastrado
        """
        payload = request.get_json() or {}
        logger.info("Registering user %s", payload)
        email = payload.get('email')
        name = payload.get('name')
        
        if not email or not name:
            return jsonify(error='Nome e email são obrigatórios'), 400

        user_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        record = {'id': user_id, 'email': email,
                  'name': name, 'created_at': now}

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
        """
        Realiza login de um usuario no banco de dados

        Args:
            email (str): Email do usuario

        Returns:
            dict: Dados do usuario logado
        """
        payload = request.get_json() or {}
        logger.info("Logging in user %s", payload)
        email = payload.get('email')
        if not email:
            return jsonify(error='Email é obrigatório'), 400
        try:
            data = supabase.table('users').select(
                'id,email,name').eq('email', email).single().execute()
            user = data.data
        except APIError:
            user = None
        if not user:
            logger.warning("Login failed for email: %s", email)
            return jsonify(error='Email não cadastrado. Cadastre-se primeiro.'), 404
        logger.info("User logged in: %s", user)
        return jsonify(message='Login realizado com sucesso', user=user)


    @app.route('/api/participants', methods=['GET'])
    def get_participants():
        """
        Obtem todos os participantes do banco de dados

        Returns:
            dict: Dados do participante
        """

        logger.info("Fetching participants list")
        data = supabase.table('participants').select('*').execute()
        logger.info("Participants response count: %d", len(data.data))
        
        if not data.data:
            logger.warning("Participants not found")
            return jsonify(error='Participantes não encontrados'), 404
        return jsonify(data.data)


    @app.route('/api/participants/<user_id>', methods=['GET'])
    def get_participant(user_id):
        """
            Obtem um participante pelo respectivo userId

            Args:
                user_id (str): ID do usuario

            Returns:
                dict: Dados do participante
        """
        logger.info("Fetching participant for user %s", user_id)
        data = supabase.table('participants').select(
            '*').eq('user_id', user_id).execute()
        
        logger.info("Participant response: %s", remove_photo(data.data))
        
        if not data.data:
            logger.warning("Participant not found: %s", user_id)
            return jsonify(error='Participante não encontrado'), 404

        return jsonify(data.data[0])
    

    @app.route('/api/participants/<user_id>', methods=['POST'])
    def save_participant(user_id):
        """
        Salva um participante no banco de dados

        Args:
            user_id (str): ID do usuario

        Returns:
            dict: Dados do participante
        """
        logger.info("Saving participant for user %s", user_id)

        payload = request.get_json()
        
        logger.info("Participant payload: %s", remove_photo(payload))

        try:
            data = supabase.table('participants').select(
                '*').eq('user_id', user_id).execute()
            logger.info("Participant response: %s", remove_photo(data.data))

        except APIError as err:
            logger.error("Error fetching participant: %s", err)
            return jsonify(error='Erro ao buscar participante'), 500

        if data.data:
            logger.info("Participant found: %s", user_id)

            #UPDATE
            try:
                logger.info("Tipo de skills no payload: %s", type(payload.get("skills")))
                data_in = supabase.table('participants').update({
                    'name': payload.get('name'),
                    'city': payload.get('city'),
                    'age': payload.get('age'),
                    'church': payload.get('church'),
                    'bio': payload.get('bio'),
                    'skills': payload.get('skills'),
                    'photo': payload.get('photo'),
                    'phone': payload.get('phone'),
                    'linkedin': payload.get('linkedin')
                }).eq('user_id', user_id).execute()
                logger.info("Participant updated: %s", remove_photo(data_in.data))

                return jsonify(data_in.data), 200
            
            except APIError as err:
                logger.error("Error updating participant: %s", err)
                return jsonify(error='Erro ao atualizar participante'), 500

        else:
            logger.info("Participant not found: %s", user_id)

            #INSERT
            try:
                data_in = supabase.table('participants').insert({
                'name': payload.get('name'),
                'city': payload.get('city'),
                'age': payload.get('age'),
                'church': payload.get('church'),
                'bio': payload.get('bio'),
                'skills': payload.get('skills'),
                'photo': payload.get('photo'),
                'phone': payload.get('phone'),
                'linkedin': payload.get('linkedin'),
                'user_id': user_id
                }).execute()
                logger.info("Participant inserted: %s", remove_photo(data_in.data))
            
                return jsonify(data_in.data), 201
                
            except APIError as err:
                logger.error("Error inserting participant: %s", err)
                return jsonify(error='Erro ao inserir participante'), 500


    @app.route('/health')
    def health():
        """
        Verifica se o servidor esta funcionando

        Returns:
            dict: Status do servidor
        """
        logger.info("Health check")
        return {'status': 'ok'}

    return app


# Instância WSGI reconhecida pelo Vercel
app = create_app()

if __name__ == '__main__':
    logger.info("Starting server locally")
