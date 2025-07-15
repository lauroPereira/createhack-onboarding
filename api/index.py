from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime
import uuid
from urllib.parse import urlparse, parse_qs

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

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query = parse_qs(parsed_path.query)
        
        # Headers CORS
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        if path == '/api/check-email':
            email = query.get('email', [None])[0]
            if not email:
                response = {'error': 'Email é obrigatório'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            users = load_json_file(USERS_FILE)
            exists = any(user['email'] == email for user in users)
            response = {'exists': exists}
            
        elif path == '/api/participants':
            participants = load_json_file(PARTICIPANTS_FILE)
            response = participants
            
        elif path.startswith('/api/participants/'):
            user_id = path.split('/')[-1]
            participants = load_json_file(PARTICIPANTS_FILE)
            participant = next((p for p in participants if p['user_id'] == user_id), None)
            
            if not participant:
                response = {'error': 'Participante não encontrado'}
            else:
                response = participant
                
        else:
            response = {'message': 'API funcionando'}
        
        self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Headers CORS
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        if path == '/api/register':
            # Validação básica
            if not data.get('email') or not data.get('password') or not data.get('name'):
                response = {'error': 'Email, senha e nome são obrigatórios'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Carregar usuários existentes
            users = load_json_file(USERS_FILE)
            
            # Verificar se email já existe
            if any(user['email'] == data['email'] for user in users):
                response = {'error': 'Email já cadastrado'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Criar novo usuário
            new_user = {
                'id': str(uuid.uuid4()),
                'email': data['email'],
                'password': data['password'],
                'name': data['name'],
                'created_at': datetime.now().isoformat()
            }
            
            users.append(new_user)
            save_json_file(USERS_FILE, users)
            
            response = {
                'message': 'Usuário criado com sucesso',
                'user': {
                    'id': new_user['id'],
                    'email': new_user['email'],
                    'name': new_user['name']
                }
            }
            
        elif path == '/api/login':
            if not data.get('email') or not data.get('password'):
                response = {'error': 'Email e senha são obrigatórios'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            users = load_json_file(USERS_FILE)
            user = next((u for u in users if u['email'] == data['email'] and u['password'] == data['password']), None)
            
            if not user:
                response = {'error': 'Email ou senha inválidos'}
            else:
                response = {
                    'message': 'Login realizado com sucesso',
                    'user': {
                        'id': user['id'],
                        'email': user['email'],
                        'name': user['name']
                    }
                }
                
        elif path == '/api/participants':
            if not data.get('user_id'):
                response = {'error': 'ID do usuário é obrigatório'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            participants = load_json_file(PARTICIPANTS_FILE)
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
                participants[existing_index] = participant_data
                message = 'Participante atualizado com sucesso'
            else:
                participant_data['id'] = str(uuid.uuid4())
                participant_data['created_at'] = datetime.now().isoformat()
                participants.append(participant_data)
                message = 'Participante criado com sucesso'
            
            save_json_file(PARTICIPANTS_FILE, participants)
            response = {
                'message': message,
                'participant': participant_data
            }
        else:
            response = {'error': 'Endpoint não encontrado'}
        
        self.wfile.write(json.dumps(response).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()