// Configuração da API
const API_BASE_URL = 'http://localhost:5000/api';

// Utilitários para localStorage
const Storage = {
    setUser: (user) => {
        localStorage.setItem('hackathon_user', JSON.stringify(user));
    },
    
    getUser: () => {
        const user = localStorage.getItem('hackathon_user');
        return user ? JSON.parse(user) : null;
    },
    
    removeUser: () => {
        localStorage.removeItem('hackathon_user');
    },
    
    isLoggedIn: () => {
        return Storage.getUser() !== null;
    }
};

// Utilitários para UI
const UI = {
    showMessage: (message, type = 'error') => {
        const messageEl = document.getElementById('message');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `message ${type}`;
            messageEl.classList.remove('hidden');
            
            // Auto-hide após 5 segundos
            setTimeout(() => {
                messageEl.classList.add('hidden');
            }, 5000);
        }
    },
    
    hideMessage: () => {
        const messageEl = document.getElementById('message');
        if (messageEl) {
            messageEl.classList.add('hidden');
        }
    },
    
    setLoading: (buttonId, textId, loadingId, isLoading) => {
        const button = document.getElementById(buttonId);
        const text = document.getElementById(textId);
        const loading = document.getElementById(loadingId);
        
        if (button && text && loading) {
            button.disabled = isLoading;
            if (isLoading) {
                text.classList.add('hidden');
                loading.classList.remove('hidden');
            } else {
                text.classList.remove('hidden');
                loading.classList.add('hidden');
            }
        }
    }
};

// Funções de API
const API = {
    login: async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro no login');
        }
        
        return data;
    },
    
    register: async (email, password, name) => {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro no registro');
        }
        
        return data;
    },
    
    checkEmail: async (email) => {
        const response = await fetch(`${API_BASE_URL}/check-email?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao verificar email');
        }
        
        return data;
    }
};

// Validações
const Validation = {
    email: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    password: (password) => {
        return password.length >= 6;
    },
    
    name: (name) => {
        return name.trim().length >= 2;
    }
};

// Login Form Handler
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Validações básicas
        if (!email || !password) {
            UI.showMessage('Por favor, preencha todos os campos');
            return;
        }
        
        if (!Validation.email(email)) {
            UI.showMessage('Por favor, insira um email válido');
            return;
        }
        
        UI.hideMessage();
        UI.setLoading('loginBtn', 'loginText', 'loginLoading', true);
        
        try {
            const response = await API.login(email, password);
            
            // Salvar usuário no localStorage
            Storage.setUser(response.user);
            
            UI.showMessage('Login realizado com sucesso!', 'success');
            
            // Redirecionar para home após 1 segundo
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
            
        } catch (error) {
            UI.showMessage(error.message);
        } finally {
            UI.setLoading('loginBtn', 'loginText', 'loginLoading', false);
        }
    });
}

// Register Form Handler
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validações
        if (!name || !email || !password || !confirmPassword) {
            UI.showMessage('Por favor, preencha todos os campos');
            return;
        }
        
        if (!Validation.name(name)) {
            UI.showMessage('Nome deve ter pelo menos 2 caracteres');
            return;
        }
        
        if (!Validation.email(email)) {
            UI.showMessage('Por favor, insira um email válido');
            return;
        }
        
        if (!Validation.password(password)) {
            UI.showMessage('Senha deve ter pelo menos 6 caracteres');
            return;
        }
        
        if (password !== confirmPassword) {
            UI.showMessage('Senhas não coincidem');
            return;
        }
        
        UI.hideMessage();
        UI.setLoading('registerBtn', 'registerText', 'registerLoading', true);
        
        try {
            const response = await API.register(email, password, name);
            
            // Salvar usuário no localStorage
            Storage.setUser(response.user);
            
            UI.showMessage('Conta criada com sucesso!', 'success');
            
            // Redirecionar para home após 1 segundo
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
            
        } catch (error) {
            UI.showMessage(error.message);
        } finally {
            UI.setLoading('registerBtn', 'registerText', 'registerLoading', false);
        }
    });
    
    // Verificação de email em tempo real
    const emailInput = document.getElementById('email');
    if (emailInput) {
        let emailTimeout;
        emailInput.addEventListener('input', (e) => {
            clearTimeout(emailTimeout);
            const email = e.target.value.trim();
            
            if (email && Validation.email(email)) {
                emailTimeout = setTimeout(async () => {
                    try {
                        const result = await API.checkEmail(email);
                        if (result.exists) {
                            UI.showMessage('Este email já está cadastrado');
                        } else {
                            UI.hideMessage();
                        }
                    } catch (error) {
                        // Ignorar erros de verificação de email
                    }
                }, 500);
            }
        });
    }
}

// Verificar se usuário já está logado
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isLoggedIn = Storage.isLoggedIn();
    
    // Redirecionar se já estiver logado e estiver na página de login/registro
    if (isLoggedIn && (currentPage === 'index.html' || currentPage === 'register.html' || currentPage === '')) {
        window.location.href = 'home.html';
        return;
    }
    
    // Redirecionar se não estiver logado e estiver em página protegida
    if (!isLoggedIn && (currentPage === 'home.html' || currentPage === 'profile.html')) {
        window.location.href = 'index.html';
        return;
    }
    
    // Mostrar informações do usuário se estiver logado
    if (isLoggedIn) {
        const user = Storage.getUser();
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = user.name;
        }
    }
});

// Função de logout
const logout = () => {
    Storage.removeUser();
    window.location.href = 'index.html';
};

// Adicionar event listener para botão de logout se existir
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});

// Efeitos visuais para inputs
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
        // Efeito de focus
        input.addEventListener('focus', () => {
            input.style.borderColor = 'var(--primary-green)';
            input.style.boxShadow = '0 0 10px var(--glow-green)';
        });
        
        // Efeito de blur
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.style.borderColor = 'var(--dark-green)';
                input.style.boxShadow = 'none';
            }
        });
        
        // Validação em tempo real visual
        input.addEventListener('input', () => {
            const value = input.value.trim();
            
            if (input.type === 'email' && value) {
                if (Validation.email(value)) {
                    input.style.borderColor = 'var(--light-green)';
                } else {
                    input.style.borderColor = '#ff6b6b';
                }
            }
            
            if (input.type === 'password' && value) {
                if (Validation.password(value)) {
                    input.style.borderColor = 'var(--light-green)';
                } else {
                    input.style.borderColor = '#ff6b6b';
                }
            }
        });
    });
});