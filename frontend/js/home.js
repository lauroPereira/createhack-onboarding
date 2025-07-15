// Estado da aplicação
let allParticipants = [];
let filteredParticipants = [];
let currentFilters = {
    name: '',
    city: '',
    church: '',
    skill: ''
};

// API para participantes
const ParticipantsAPI = {
    getAll: async () => {
        const API_BASE_URL = window.location.hostname === 'localhost'
            ? 'http://localhost:5000/api'
            : '/api';
        const response = await fetch(`${API_BASE_URL}/participants`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao carregar participantes');
        }
        
        return data;
    }
};

// Utilitários para renderização
const Render = {
    participantCard: (participant) => {
        const photoSrc = participant.photo || 'frontend/assets/img/default-avatar.jpg';
        
        const phoneHtml = participant.phone ? `
            <div class="participant-phone">
                <img src="assets/img/phone-icon.svg" alt="Phone" class="icon" />
                <a href="https://wa.me/${participant.phone}" target="_blank">${participant.phone}</a>
            </div>
        ` : '';

        const linkedinHtml = participant.linkedin ? `
            <div class="participant-linkedin">
                <img src="assets/img/linkedin-icon.svg" alt="LinkedIn" class="icon" />
                <a href="${participant.linkedin}" target="_blank">LinkedIn</a>
            </div>
        ` : '';

        const skillsHtml = participant.skills && participant.skills.length > 0
            ? participant.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')
            : '<span class="text-gray">Nenhuma skill cadastrada</span>';
        
        const age = participant.age ? `${participant.age} anos` : '';
        const location = [participant.city, participant.church].filter(Boolean).join(' • ');
        
        
        return `
            <div class="participant-card fade-in">
                <img src="${photoSrc}" alt="${participant.name}" class="participant-photo" onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 100 100&quot;><circle cx=&quot;50&quot; cy=&quot;50&quot; r=&quot;40&quot; fill=&quot;%2300ff41&quot;/><text x=&quot;50&quot; y=&quot;60&quot; text-anchor=&quot;middle&quot; fill=&quot;black&quot; font-size=&quot;40&quot;>👤</text></svg>'">
                
                <div class="participant-name">${participant.name || 'Nome não informado'}</div>
                
                ${age ? `<div class="participant-info">${age}</div>` : ''}
                ${location ? `<div class="participant-info">${location}</div>` : ''}
                
                ${participant.bio ? `
                    <div class="participant-info" style="margin-top: 10px; font-style: italic;">
                        "${participant.bio}"
                    </div>
                ` : ''}
                
                <div class="skills-container">
                    ${skillsHtml}
                </div>
                ${phoneHtml}
                ${linkedinHtml}
            </div>
        `;
    },
    
    participantsGrid: (participants) => {
        const grid = document.getElementById('participantsGrid');
        
        if (participants.length === 0) {
            grid.classList.add('hidden');
            document.getElementById('noParticipants').classList.remove('hidden');
            return;
        }
        
        document.getElementById('noParticipants').classList.add('hidden');
        grid.classList.remove('hidden');
        grid.innerHTML = participants.map(Render.participantCard).join('');
    },
    
    updateStats: () => {
        document.getElementById('totalParticipants').textContent = allParticipants.length;
        document.getElementById('filteredCount').textContent = filteredParticipants.length;
    }
};

// Sistema de filtros
const Filters = {
    populateOptions: () => {
        // Extrair valores únicos para os filtros
        const cities = [...new Set(allParticipants.map(p => p.city).filter(Boolean))].sort();
        const churches = [...new Set(allParticipants.map(p => p.church).filter(Boolean))].sort();
        const skills = [...new Set(allParticipants.flatMap(p => p.skills || []))].sort();
        
        // Popular select de cidades
        const citySelect = document.getElementById('filterCity');
        citySelect.innerHTML = '<option value="">Todas as cidades</option>';
        cities.forEach(city => {
            citySelect.innerHTML += `<option value="${city}">${city}</option>`;
        });
        
        // Popular select de igrejas
        const churchSelect = document.getElementById('filterChurch');
        churchSelect.innerHTML = '<option value="">Todas as igrejas</option>';
        churches.forEach(church => {
            churchSelect.innerHTML += `<option value="${church}">${church}</option>`;
        });
        
        // Popular select de skills
        const skillSelect = document.getElementById('filterSkill');
        skillSelect.innerHTML = '<option value="">Todas as skills</option>';
        skills.forEach(skill => {
            skillSelect.innerHTML += `<option value="${skill}">${skill}</option>`;
        });
    },
    
    apply: () => {
        filteredParticipants = allParticipants.filter(participant => {
            // Filtro por nome
            if (currentFilters.name) {
                const nameMatch = participant.name.toLowerCase().includes(currentFilters.name.toLowerCase());
                if (!nameMatch) return false;
            }
            
            // Filtro por cidade
            if (currentFilters.city && participant.city !== currentFilters.city) {
                return false;
            }
            
            // Filtro por igreja
            if (currentFilters.church && participant.church !== currentFilters.church) {
                return false;
            }
            
            // Filtro por skill
            if (currentFilters.skill) {
                const hasSkill = participant.skills && participant.skills.includes(currentFilters.skill);
                if (!hasSkill) return false;
            }
            
            return true;
        });
        
        Render.participantsGrid(filteredParticipants);
        Render.updateStats();
    },
    
    clear: () => {
        currentFilters = {
            name: '',
            city: '',
            church: '',
            skill: ''
        };
        
        document.getElementById('searchName').value = '';
        document.getElementById('filterCity').value = '';
        document.getElementById('filterChurch').value = '';
        document.getElementById('filterSkill').value = '';
        
        Filters.apply();
    }
};

// Carregar participantes
const loadParticipants = async () => {
    try {
        document.getElementById('loadingParticipants').classList.remove('hidden');
        document.getElementById('participantsGrid').classList.add('hidden');
        document.getElementById('noParticipants').classList.add('hidden');
        
        allParticipants = await ParticipantsAPI.getAll();
        filteredParticipants = [...allParticipants];
        
        Filters.populateOptions();
        Render.participantsGrid(filteredParticipants);
        Render.updateStats();
        
    } catch (error) {
        console.error('Erro ao carregar participantes:', error);
        document.getElementById('noParticipants').classList.remove('hidden');
        document.getElementById('noParticipants').innerHTML = `
            <h3 class="text-gray">ERRO AO CARREGAR CREATORS</h3>
            <p class="text-gray">${error.message}</p>
            <button onclick="loadParticipants()" class="btn btn-primary mt-20">
                🔄 TENTAR NOVAMENTE
            </button>
        `;
    } finally {
        document.getElementById('loadingParticipants').classList.add('hidden');
    }
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Carregar participantes
    loadParticipants();
    
    // Filtro por nome (busca em tempo real)
    const searchName = document.getElementById('searchName');
    let searchTimeout;
    searchName.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        currentFilters.name = e.target.value.trim();
        
        searchTimeout = setTimeout(() => {
            Filters.apply();
        }, 300);
    });
    
    // Filtros por select
    document.getElementById('filterCity').addEventListener('change', (e) => {
        currentFilters.city = e.target.value;
        Filters.apply();
    });
    
    document.getElementById('filterChurch').addEventListener('change', (e) => {
        currentFilters.church = e.target.value;
        Filters.apply();
    });
    
    document.getElementById('filterSkill').addEventListener('change', (e) => {
        currentFilters.skill = e.target.value;
        Filters.apply();
    });
    
    // Botão limpar filtros
    document.getElementById('clearFilters').addEventListener('click', () => {
        Filters.clear();
    });
    
    // Botão perfil
    document.getElementById('profileBtn').addEventListener('click', () => {
        window.location.href = 'profile.html';
    });
    
    // Botão criar perfil (quando não há participantes)
    document.addEventListener('click', (e) => {
        if (e.target.id === 'createProfileBtn') {
            window.location.href = 'profile.html';
        }
    });
    
    // Efeito hover nos cards (será aplicado dinamicamente)
    document.addEventListener('mouseenter', (e) => {
        if (e.target.classList.contains('participant-card')) {
            e.target.style.transform = 'translateY(-5px) scale(1.02)';
        }
    }, true);
    
    document.addEventListener('mouseleave', (e) => {
        if (e.target.classList.contains('participant-card')) {
            e.target.style.transform = 'translateY(0) scale(1)';
        }
    }, true);
});

// Função para atualizar a lista (pode ser chamada após criar/editar perfil)
// window.refreshParticipants = () => {
//     loadParticipants();
// };

// // Auto-refresh a cada 30 segundos para pegar novos participantes
// setInterval(() => {
//     if (document.visibilityState === 'visible') {
//         loadParticipants();
//     }
// }, 30000);

// Animações de entrada escalonadas para os cards
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 100);
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observar novos cards quando forem adicionados
const observeNewCards = () => {
    const cards = document.querySelectorAll('.participant-card:not([data-observed])');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease';
        card.setAttribute('data-observed', 'true');
        observer.observe(card);
    });
};

// Observar cards após renderização
const originalRenderGrid = Render.participantsGrid;
Render.participantsGrid = function(participants) {
    originalRenderGrid.call(this, participants);
    setTimeout(observeNewCards, 100);
};