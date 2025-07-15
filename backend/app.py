from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)

# Configuração de diretórios para Vercel
DATA_DIR = '/tmp/data'
UPLOAD_DIR = '/tmp/uploads'

# Criar diretórios se não existirem
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Arquivos de dados
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
PARTICIPANTS_FILE = os.path.join(DATA_DIR, 'participants.json')

def load_json_file(filename):
    """Carrega dados de um arquivo JSON"""
    if os.path.exists(filename):
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    return []

def save_json_file(filename, data):
    """Salva dados em um arquivo JSON"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# Rotas de autenticação
@app.route('/api/register', methods=['POST'])
def register():
    """Registra um novo usuário"""
    data = request.get_json()
    
    # Validação básica
    if not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'error': 'Email, senha e nome são obrigatórios'}), 400
    
    # Carregar usuários existentes
    users = load_json_file(USERS_FILE)
    
    # Verificar se email já existe
    if any(user['email'] == data['email'] for user in users):
        return jsonify({'error': 'Email já cadastrado'}), 400
    
    # Criar novo usuário
    new_user = {
        'id': str(uuid.uuid4()),
        'email': data['email'],
        'password': data['password'],  # Em produção, usar hash
        'name': data['name'],
        'created_at': datetime.now().isoformat()
    }
    
    users.append(new_user)
    save_json_file(USERS_FILE, users)
    
    return jsonify({
        'message': 'Usuário criado com sucesso',
        'user': {
            'id': new_user['id'],
            'email': new_user['email'],
            'name': new_user['name']
        }
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    """Autentica um usuário"""
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email e senha são obrigatórios'}), 400
    
    users = load_json_file(USERS_FILE)
    
    # Buscar usuário
    user = next((u for u in users if u['email'] == data['email'] and u['password'] == data['password']), None)
    
    if not user:
        return jsonify({'error': 'Email ou senha inválidos'}), 401
    
    return jsonify({
        'message': 'Login realizado com sucesso',
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name']
        }
    }), 200

@app.route('/api/check-email', methods=['GET'])
def check_email():
    """Verifica se email já existe"""
    email = request.args.get('email')
    if not email:
        return jsonify({'error': 'Email é obrigatório'}), 400
    
    users = load_json_file(USERS_FILE)
    exists = any(user['email'] == email for user in users)
    
    return jsonify({'exists': exists}), 200

# Rotas de participantes
@app.route('/api/participants', methods=['GET'])
def get_participants():
    """Lista todos os participantes"""
    participants = load_json_file(PARTICIPANTS_FILE)
    return jsonify(participants), 200

@app.route('/api/participants', methods=['POST'])
def create_participant():
    """Cria ou atualiza um participante"""
    data = request.get_json()
    
    if not data.get('user_id'):
        return jsonify({'error': 'ID do usuário é obrigatório'}), 400
    
    participants = load_json_file(PARTICIPANTS_FILE)
    
    # Verificar se participante já existe
    existing_index = next((i for i, p in enumerate(participants) if p['user_id'] == data['user_id']), None)
    
    participant_data = {
        'user_id': data['user_id'],
        'name': data.get('name', ''),
        'city': data.get('city', ''),
        'church': data.get('church', ''),
        'age': data.get('age', ''),
        'bio': data.get('bio', ''),
        'skills': data.get('skills', []),
        'photo': data.get('photo', ''),
        'updated_at': datetime.now().isoformat()
    }
    
    if existing_index is not None:
        # Atualizar participante existente
        participants[existing_index] = participant_data
        message = 'Participante atualizado com sucesso'
    else:
        # Criar novo participante
        participant_data['id'] = str(uuid.uuid4())
        participant_data['created_at'] = datetime.now().isoformat()
        participants.append(participant_data)
        message = 'Participante criado com sucesso'
    
    save_json_file(PARTICIPANTS_FILE, participants)
    
    return jsonify({
        'message': message,
        'participant': participant_data
    }), 200

@app.route('/api/participants/<user_id>', methods=['GET'])
def get_participant(user_id):
    """Busca um participante específico"""
    participants = load_json_file(PARTICIPANTS_FILE)
    participant = next((p for p in participants if p['user_id'] == user_id), None)
    
    if not participant:
        return jsonify({'error': 'Participante não encontrado'}), 404
    
    return jsonify(participant), 200

# Handler para Vercel (função serverless)
def handler(request):
    return app(request.environ, lambda status, headers: None)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)