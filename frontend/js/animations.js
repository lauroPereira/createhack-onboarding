// Animação do background Matrix
class MatrixAnimation {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.columns = [];
        this.fontSize = 14;
        this.chars = '01';
        this.init();
    }

    init() {
        // Criar elemento de background matrix
        const matrixBg = document.createElement('div');
        matrixBg.className = 'matrix-bg';
        matrixBg.id = 'matrix-bg';
        document.body.appendChild(matrixBg);

        this.createMatrixColumns();
        this.startAnimation();
    }

    createMatrixColumns() {
        const matrixBg = document.getElementById('matrix-bg');
        const screenWidth = window.innerWidth;
        const columnWidth = 20;
        const numColumns = Math.floor(screenWidth / columnWidth);

        for (let i = 0; i < numColumns; i++) {
            const column = document.createElement('div');
            column.className = 'matrix-column';
            column.style.left = `${i * columnWidth}px`;
            column.style.animationDuration = `${Math.random() * 3 + 2}s`;
            column.style.animationDelay = `${Math.random() * 2}s`;
            
            // Gerar texto binário aleatório
            let text = '';
            const height = Math.floor(Math.random() * 50) + 20;
            for (let j = 0; j < height; j++) {
                text += Math.random() > 0.5 ? '1' : '0';
                if (j % 10 === 0) text += '<br>';
            }
            
            column.innerHTML = text;
            matrixBg.appendChild(column);
        }
    }

    startAnimation() {
        // Recriar colunas periodicamente para efeito contínuo
        setInterval(() => {
            const matrixBg = document.getElementById('matrix-bg');
            if (matrixBg) {
                matrixBg.innerHTML = '';
                this.createMatrixColumns();
            }
        }, 10000);
    }

    // Redimensionar ao mudar tamanho da tela
    resize() {
        const matrixBg = document.getElementById('matrix-bg');
        if (matrixBg) {
            matrixBg.innerHTML = '';
            this.createMatrixColumns();
        }
    }
}

// Efeitos de digitação para títulos
class TypingEffect {
    constructor(element, text, speed = 100) {
        this.element = element;
        this.text = text;
        this.speed = speed;
        this.currentIndex = 0;
    }

    start() {
        this.element.textContent = '';
        this.type();
    }

    type() {
        if (this.currentIndex < this.text.length) {
            this.element.textContent += this.text.charAt(this.currentIndex);
            this.currentIndex++;
            setTimeout(() => this.type(), this.speed);
        }
    }
}

// Efeito de glitch para elementos
class GlitchEffect {
    constructor(element) {
        this.element = element;
        this.originalText = element.textContent;
        this.glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }

    start(duration = 2000) {
        const startTime = Date.now();
        const glitchInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            
            if (elapsed > duration) {
                clearInterval(glitchInterval);
                this.element.textContent = this.originalText;
                return;
            }

            // Aplicar glitch aleatório
            let glitchedText = '';
            for (let i = 0; i < this.originalText.length; i++) {
                if (Math.random() < 0.1) {
                    glitchedText += this.glitchChars[Math.floor(Math.random() * this.glitchChars.length)];
                } else {
                    glitchedText += this.originalText[i];
                }
            }
            this.element.textContent = glitchedText;
        }, 50);
    }
}

// Partículas flutuantes
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.init();
    }

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.opacity = '0.3';
        
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        this.createParticles();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        const numParticles = 50;
        for (let i = 0; i < numParticles; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            // Atualizar posição
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Reposicionar se sair da tela
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // Desenhar partícula
            this.ctx.fillStyle = `rgba(0, 255, 65, ${particle.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// Inicializar animações quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Matrix background
    new MatrixAnimation();
    
    // Inicializar sistema de partículas
    new ParticleSystem();
    
    // Efeito de digitação para títulos principais
    const mainTitle = document.querySelector('h1');
    if (mainTitle) {
        const originalText = mainTitle.textContent;
        new TypingEffect(mainTitle, originalText, 150).start();
    }
    
    // Efeito de glitch para logo
    const logo = document.querySelector('.logo');
    if (logo) {
        setTimeout(() => {
            new GlitchEffect(logo).start(1000);
        }, 2000);
    }
});

// Redimensionar animações ao mudar tamanho da tela
window.addEventListener('resize', () => {
    const matrixAnimation = window.matrixAnimation;
    if (matrixAnimation) {
        matrixAnimation.resize();
    }
});

// Efeitos de hover para cards
document.addEventListener('DOMContentLoaded', () => {
    // Adicionar efeito de scan line aos cards
    const cards = document.querySelectorAll('.card, .participant-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.boxShadow = '0 0 30px rgba(0, 255, 65, 0.6), inset 0 0 30px rgba(0, 255, 65, 0.1)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = '0 0 15px rgba(0, 255, 65, 0.2)';
        });
    });
    
    // Efeito de pulse para botões
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            button.style.animation = 'pulse 0.3s ease-in-out';
            setTimeout(() => {
                button.style.animation = '';
            }, 300);
        });
    });
});

// Adicionar CSS para animação de pulse
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);