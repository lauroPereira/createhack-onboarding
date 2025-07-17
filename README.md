# Hackathon Creators

## Descrição
Este projeto é uma aplicação para registro de participantes em hackathons, permitindo autenticação de usuários e gerenciamento de perfis.

## Tecnologias Utilizadas
- **Frontend**: HTML, CSS (Tailwind), JavaScript
- **Backend**: Python, Flask
- **Banco de Dados**: JSON para armazenamento de dados

## Funcionalidades
- Registro de novos usuários
- Login de usuários
- Visualização de participantes registrados
- Upload de fotos de perfil
- Sistema de tags para habilidades

## Como Executar

### 1. Clone o repositório:
```bash
git clone git@github.com:lauroPereira/createhack-onboarding.git
cd createhack-onboarding
```

### 2. Crie e ative um ambiente virtual (se ainda não existir):
```bash
# Criação do ambiente virtual
python -m venv .venv

# Ativação do ambiente virtual
# No Windows
.venv\Scripts\activate
# No macOS/Linux
source .venv/bin/activate
```

### 3. Instale as dependências do backend:
```bash
pip install -r requirements.txt
```

### 4. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```
Substitua `your_supabase_url` e `your_supabase_key` pelas suas credenciais do Supabase.

### 5. Navegue até a pasta `api`:
```bash
cd api
```

### 6. Execute o servidor Flask:
```bash
python -m flask run
```

### 7. Acesse a aplicação em `http://127.0.0.1:5000`.

## Contribuição
Sinta-se à vontade para contribuir com melhorias ou novas funcionalidades!

## Licença

### 8. Navegue até a pasta `frontend`:
```bash
cd frontend
```

### 9. Execute o servidor HTTP:
```bash
python -m http.server 8000
```

### 10. Acesse a aplicação em `http://localhost:8000`.
Este projeto está licenciado sob a MIT License.