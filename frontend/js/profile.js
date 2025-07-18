// Estado do perfil
let currentSkills = [];
let currentPhoto = '';
let isEditing = false;

// API para perfil
const ProfileAPI = {
    get: async (userId) => {
        console.log('Carregando perfil...');
        console.log(userId);
        const API_BASE_URL = window.location.hostname === 'localhost'
            ? 'http://localhost:5000/api'
            : '/api';
        const response = await fetch(`${API_BASE_URL}/participants/${userId}`, {
            method: 'GET'}
        );
        
        if (response.status === 404) {
            return null; // Participante não existe ainda
        }
        
        const data = await response.json();
        console.log('Perfil carregado com sucesso!');
        console.log(data);
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao carregar perfil');
        }
        
        return data;
    },
    
    save: async (participantData, userId) => {
        console.log('Salvando perfil...');
        console.log(participantData);
        const API_BASE_URL = window.location.hostname === 'localhost'
            ? 'http://localhost:5000/api'
            : '/api';
        const response = await fetch(`${API_BASE_URL}/participants/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(participantData)
        });
        
        const data = await response.json();
        console.log('Perfil salvo com sucesso!');
        console.log(data);
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao salvar perfil');
        }
        
        return data;
    }
};

// Utilitários para upload de foto
const PhotoUtils = {
    toBase64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },
    
    validateFile: (file) => {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        if (file.size > maxSize) {
            throw new Error('Arquivo muito grande. Máximo 5MB.');
        }
        
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Tipo de arquivo não suportado. Use JPG, PNG, GIF ou WebP.');
        }
        
        return true;
    },
    
    resizeImage: (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calcular dimensões mantendo proporção
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Desenhar imagem redimensionada
                ctx.drawImage(img, 0, 0, width, height);
                
                // Converter para base64
                const resizedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(resizedBase64);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }
};

// Sistema de Skills
const SkillsManager = {
    add: (skill) => {
        const trimmedSkill = skill.trim();
        
        if (!trimmedSkill) return false;
        
        if (currentSkills.includes(trimmedSkill)) {
            UI.showMessage('Skill já adicionada');
            return false;
        }
        
        if (currentSkills.length >= 10) {
            UI.showMessage('Máximo de 10 skills permitidas');
            return false;
        }
        
        currentSkills.push(trimmedSkill);
        SkillsManager.render();
        return true;
    },
    
    remove: (skill) => {
        currentSkills = currentSkills.filter(s => s !== skill);
        SkillsManager.render();
    },
    
    render: () => {
        const container = document.getElementById('skillsContainer');
        const placeholder = document.getElementById('skillsPlaceholder');
        
        if (currentSkills.length === 0) {
            placeholder.classList.remove('hidden');
            container.innerHTML = '<div id="skillsPlaceholder" class="text-gray">Nenhuma skill adicionada ainda</div>';
            return;
        }
        
        const skillsHtml = currentSkills.map(skill => `
            <span class="skill-tag" style="position: relative; padding-right: 25px;">
                ${skill}
                <button type="button" onclick="SkillsManager.remove('${skill}')" 
                        style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); 
                               background: none; border: none; color: var(--primary-green); 
                               cursor: pointer; font-size: 12px;">×</button>
            </span>
        `).join('');
        
        container.innerHTML = skillsHtml;
    }
};

// Carregar dados do perfil
const loadProfile = async () => {
    const user = Storage.getUser();
    if (!user) return;
    
    try {
        const profile = await ProfileAPI.get(user.id);
        
        if (profile) {
            isEditing = true;
            
            // Preencher formulário
            document.getElementById('name').value = profile.name || '';
            document.getElementById('ddd').value = profile.ddd || '';
            if (profile.phone) {
                const phoneNumber = profile.phone.replace(/\D/g, '');
                let formattedPhone = phoneNumber;
                if (phoneNumber.length > 5) {
                    formattedPhone = phoneNumber.substring(0, 5) + '-' + phoneNumber.substring(5);
                }
                document.getElementById('phone').value = formattedPhone;   
            } else {
                document.getElementById('phone').value = '';
            }

            document.getElementById('linkedin').value = profile.linkedin || '';
            document.getElementById('uf').value = profile.uf || '';
            document.getElementById('city').value = profile.city || '';
            document.getElementById('age').value = profile.age || '';
            document.getElementById('church').value = profile.church || '';
            document.getElementById('bio').value = profile.bio || '';
            
            
            
            
            // Carregar skills
            currentSkills = profile.skills || [];
            SkillsManager.render();
            
            // Carregar foto
            if (profile.photo) {
                currentPhoto = profile.photo;
                const previewImage = document.getElementById('previewImage');
                const placeholder = document.getElementById('photoPlaceholder');
                
                previewImage.src = profile.photo;
                previewImage.style.display = 'block';
                placeholder.style.display = 'none';
                document.getElementById('removePhotoBtn').classList.remove('hidden');
            }
            
            // Atualizar contador de bio
            updateBioCounter();
            
            // Atualizar texto do botão
            document.getElementById('saveText').textContent = '💾 ATUALIZAR PERFIL';
        }
        
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
};

// Atualizar contador de caracteres da bio
const updateBioCounter = () => {
    const bio = document.getElementById('bio');
    const counter = document.getElementById('bioCount');
    counter.textContent = bio.value.length;
    
    if (bio.value.length > 450) {
        counter.style.color = '#ff6b6b';
    } else {
        counter.style.color = 'var(--text-gray)';
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Carregar perfil existente
    loadProfile();
    
    // Botão home
    document.getElementById('homeBtn').addEventListener('click', () => {
        window.location.href = 'home.html';
    });
    
    // Upload de foto
    const photoInput = document.getElementById('photoInput');
    const photoBtn = document.getElementById('photoBtn');
    const removePhotoBtn = document.getElementById('removePhotoBtn');
    const previewImage = document.getElementById('previewImage');
    const placeholder = document.getElementById('photoPlaceholder');
    
    photoBtn.addEventListener('click', () => {
        photoInput.click();
    });
    
    photoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            PhotoUtils.validateFile(file);
            
            UI.showMessage('Processando imagem...', 'success');
            
            // Redimensionar e converter para base64
            const resizedBase64 = await PhotoUtils.resizeImage(file);
            currentPhoto = resizedBase64;
            
            // Mostrar preview
            previewImage.src = resizedBase64;
            previewImage.style.display = 'block';
            placeholder.style.display = 'none';
            removePhotoBtn.classList.remove('hidden');
            
            UI.hideMessage();
            
        } catch (error) {
            UI.showMessage(error.message);
            photoInput.value = '';
        }
    });
    
    removePhotoBtn.addEventListener('click', () => {
        currentPhoto = '';
        previewImage.style.display = 'none';
        placeholder.style.display = 'block';
        removePhotoBtn.classList.add('hidden');
        photoInput.value = '';
    });
    
    // Sistema de skills
    const skillInput = document.getElementById('skillInput');
    const addSkillBtn = document.getElementById('addSkillBtn');
    
    const addSkill = () => {
        const skill = skillInput.value.trim();
        if (SkillsManager.add(skill)) {
            skillInput.value = '';
        }
    };
    
    addSkillBtn.addEventListener('click', addSkill);
    
    skillInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    });
    
    // Skills sugeridas
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('skill-suggestion')) {
            const skill = e.target.textContent;
            SkillsManager.add(skill);
        }
    });
    
    // Contador de bio
    document.getElementById('bio').addEventListener('input', updateBioCounter);
    
    // Máscaras para DDD e telefone
    document.getElementById('ddd').addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) value = value.substring(0, 2);
        e.target.value = value;
    });
    
    document.getElementById('phone').addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 9) value = value.substring(0, 9);
        
        // Aplicar máscara 99999-9999
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5);
        }
        e.target.value = value;
    });
    
    // Formulário
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = Storage.getUser();
        if (!user) {
            UI.showMessage('Usuário não encontrado');
            return;
        }
        
        // Coletar dados do formulário
        const formData = {
            name: document.getElementById('name').value.trim(),
            city: document.getElementById('city').value.trim(),
            uf: document.getElementById('uf').value,
            age: document.getElementById('age').value,
            church: document.getElementById('church').value.trim(),
            bio: document.getElementById('bio').value.trim(),
            skills: currentSkills,
            photo: currentPhoto,
            ddd: document.getElementById('ddd').value.trim(),
            phone: document.getElementById('phone').value.trim().replace(/\D/g, ''),
            linkedin: document.getElementById('linkedin').value
        };
        
        UI.hideMessage();
        UI.setLoading('saveBtn', 'saveText', 'saveLoading', true);
        
        try {
            await ProfileAPI.save(formData, user.id);
            
            UI.showMessage(
                isEditing ? 'Perfil atualizado com sucesso!' : 'Perfil criado com sucesso!', 
                'success'
            );
            
            // Redirecionar para home após 2 segundos
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 2000);
            
        } catch (error) {
            UI.showMessage(error.message);
        } finally {
            UI.setLoading('saveBtn', 'saveText', 'saveLoading', false);
        }
    });
});

// Adicionar estilos para skills sugeridas e preview de foto
const additionalStyles = `
    .skill-suggestion {
        background: rgba(0, 255, 65, 0.1);
        color: var(--primary-green);
        border: 1px solid var(--primary-green);
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        cursor: pointer;
        margin: 2px;
        transition: all 0.3s ease;
    }
    
    .skill-suggestion:hover {
        background: rgba(0, 255, 65, 0.2);
        transform: translateY(-1px);
    }
    
    .suggested-skills-container {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
    }
    
    .photo-preview {
        width: 120px;
        height: 120px;
        border: 2px solid var(--primary-green);
        border-radius: 50%;
        margin: 0 auto;
        overflow: hidden;
        position: relative;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .photo-preview:hover {
        box-shadow: 0 0 20px var(--glow-green);
        transform: scale(1.05);
    }
    
    .photo-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .photo-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: rgba(0, 61, 16, 0.2);
        transition: all 0.3s ease;
    }
    
    .photo-placeholder:hover {
        background: rgba(0, 61, 16, 0.4);
    }
    
    .skills-input-container .form-input {
        margin-bottom: 0;
    }
    
    @media (max-width: 768px) {
        .form-container {
            padding: 20px;
        document.getElementById('phone').addEventListener('click', function() {
            const phone = this.value;
            if (phone) {
                const whatsappUrl = 'https://wa.me/${phone}';
                window.open(whatsappUrl, '_blank');
            }
        });
        
        .suggested-skills-container {
            justify-content: center;
        }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Tornar SkillsManager global para uso nos event handlers inline
window.SkillsManager = SkillsManager;
// Add functionality to redirect to WhatsApp when clicking on phone
document.getElementById('phone').addEventListener('click', function() {
    const phone = this.value;
    if (phone) {
        const whatsappUrl = `https://wa.me/${phone}`;
        window.open(whatsappUrl, '_blank');
    }
});

// Add functionality to redirect to WhatsApp when clicking on phone
document.getElementById('phone').addEventListener('click', function() {
    const phone = this.value;
    if (phone) {
        const whatsappUrl = `https://wa.me/${phone}`;
        window.open(whatsappUrl, '_blank');
    }
});
