import sqlite3

def init_db():
    """Initializa o banco de dados e cria as tabelas necessárias."""
    conn = sqlite3.connect('backend/data/database.db')
    cursor = conn.cursor()
    
    # Criar tabela de usuários
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    ''')
    
    # Criar tabela de participantes
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT,
        city TEXT,
        church TEXT,
        age TEXT,
        bio TEXT,
        skills TEXT,
        photo TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    conn.commit()
    conn.close()

# Chamar a função de inicialização do banco de dados
init_db()
from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime
import uuid
from urllib.parse import urlparse, parse_qs
import logging

logging.basicConfig(level=logging.INFO)

logging.info("Iniciando servidor HTTP")

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
                logging.info(f"Carregando dados de {filename}")
                return json.load(f)
        except:
            logging.error(f"Erro ao carregar dados de {filename}")
            return []
    return []

def save_json_file(filename, data):
    """Salva dados em um arquivo JSON"""
    with open(filename, 'w', encoding='utf-8') as f:
        logging.info(f"Salvando dados em {filename}")
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
        logging.info("Recebendo requisição POST")
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
            logging.info("Recebendo requisição POST para /api/register")
            # Validação básica - apenas email é obrigatório
            if not data.get('email'):
                response = {'error': 'Email é obrigatório'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            conn = sqlite3.connect('backend/data/database.db')
            cursor = conn.cursor()
            
            # Verificar se email já existe
            cursor.execute('SELECT * FROM users WHERE email = ?', (data['email'],))
            if cursor.fetchone():
                conn.close()
                response = {'error': 'Email já cadastrado'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Criar novo usuário
            new_user_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO users (id, email, password, created_at)
                VALUES (?, ?, ?, ?)
            ''', (new_user_id, data['email'], data.get('password', ''), datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            
            response = {
                'message': 'Email cadastrado com sucesso',
                'user': {
                    'id': new_user_id,
                    'email': data['email']
                }
            }
            
        elif path == '/api/login':
            logging.info("Recebendo requisição POST para /api/login")
            if not data.get('email'):
                response = {'error': 'Email é obrigatório'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            users = load_json_file(USERS_FILE)
            logging.info(f"Carregando dados de {USERS_FILE}")
            user = next((u for u in users if u['email'] == data['email']), None)
            
            if not user:
                logging.info("Email não cadastrado")
                response = {'error': 'Email não cadastrado. Cadastre-se primeiro.'}
            else:
                logging.info("Login realizado com sucesso")
                response = {
                    'message': 'Login realizado com sucesso',
                    'user': {
                        'id': user['id'],
                        'email': user['email']
                    }
                }
                
        elif path == '/api/participants':
            logging.info("Recebendo requisição POST para /api/participants")
            if not data.get('user_id'):
                logging.info("ID do usuário é obrigatório")
                response = {'error': 'ID do usuário é obrigatório'}
                self.wfile.write(json.dumps(response).encode())
                return
            
            conn = sqlite3.connect('backend/data/database.db')
            cursor = conn.cursor()
            
            # Verificar se participante já existe
            cursor.execute('SELECT * FROM participants WHERE user_id = ?', (data['user_id'],))
            existing_participant = cursor.fetchone()
            
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
            
            if existing_participant:
                logging.info("Participante atualizado com sucesso")
                cursor.execute('''
                    UPDATE participants SET name = ?, city = ?, church = ?, age = ?, bio = ?, skills = ?, photo = ?, updated_at = ?
                    WHERE user_id = ?
                ''', (participant_data['name'], participant_data['city'], participant_data['church'], participant_data['age'], participant_data['bio'], json.dumps(participant_data['skills']), participant_data['photo'], participant_data['updated_at'], data['user_id']))
                message = 'Participante atualizado com sucesso'
            else:
                participant_id = str(uuid.uuid4())
                participant_data['id'] = participant_id
                participant_data['created_at'] = datetime.now().isoformat()
                cursor.execute('''
                    INSERT INTO participants (id, user_id, name, city, church, age, bio, skills, photo, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (participant_id, data['user_id'], participant_data['name'], participant_data['city'], participant_data['church'], participant_data['age'], participant_data['bio'], json.dumps(participant_data['skills']), participant_data['photo'], participant_data['created_at'], participant_data['updated_at']))
                message = 'Participante criado com sucesso'
            
            conn.commit()
            conn.close()
            
            logging.info("Participante salvo com sucesso")
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