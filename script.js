// Base de dados simulada (Firebase substituído para funcionar estático)
let currentUser = null;
let seedsDatabase = [
    { id: 1, name: "Araucária", biome: "Mata Atlântica", author: "Maria Silva", desc: "Árvore nativa do sul do Brasil, fundamental para a fauna local.", tips: "Plantar em solo profundo e húmido. Necessita de frio para germinar bem." },
    { id: 2, name: "Pequi", biome: "Cerrado", author: "João Souza", desc: "Fruto símbolo do Cerrado, muito resistente à seca.", tips: "Requer bastante sol. Solo bem drenado, não tolera encharcamento." }
];

// Controlo de Navegação Geral
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

// Lógica de Autenticação
function registerUser() {
    const name = document.getElementById('reg-name').value;
    if (!name) return alert('Por favor, preencha o nome de utilizador!');
    currentUser = name;
    loginSuccess();
}

function login() {
    const email = document.getElementById('login-email').value;
    if (!email) return alert('Por favor, insira o seu e-mail!');
    currentUser = email.split('@')[0]; // Usa o prefixo do e-mail como nome para a simulação
    loginSuccess();
}

function loginSuccess() {
    document.getElementById('user-greeting').innerText = `Olá, ${currentUser}`;
    showScreen('main-app');
    showDashboard();
}

function logout() {
    currentUser = null;
    showScreen('login-screen');
}

// Funções de Mudança de Vistas (App Interna)
function showDashboard() { switchView('dashboard-view'); }
function showDonate() { switchView('donate-view'); }
function showAvailable() {
    switchView('available-view');
    renderSeeds(); // Atualiza a grelha ao entrar
}

// Lógica de Doação com IA
function processAIDonation() {
    const photo = document.getElementById('seed-photo').files[0];
    const name = document.getElementById('donate-seed-name').value;

    if (!photo || !name) {
        return alert('Por favor, capte a foto da semente e insira o nome.');
    }

    const btn = document.getElementById('btn-donate');
    const loading = document.getElementById('ai-loading');
    
    btn.disabled = true;
    loading.classList.remove('hidden');

    // Simula o tempo de processamento da IA (2.5 segundos)
    setTimeout(() => {
        const biomes = ["Cerrado", "Mata Atlântica", "Amazónia", "Caatinga", "Pampa", "Pantanal"];
        const randomBiome = biomes[Math.floor(Math.random() * biomes.length)];
        
        // Dados criados "por IA" com base apenas no nome introduzido
        const newSeed = {
            id: Date.now(),
            name: name,
            biome: randomBiome,
            author: currentUser,
            desc: `(Gerado por IA) A semente de ${name} possui um alto índice de germinação quando armazenada corretamente. É essencial para a restauração ecológica do bioma ${randomBiome}.`,
            tips: `(Gerado por IA) Dica: Quebre a dormência da semente mergulhando-a em água morna durante 12 horas antes do plantio. Mantenha em luz indireta na fase inicial.`
        };

        seedsDatabase.push(newSeed);
        
        btn.disabled = false;
        loading.classList.add('hidden');
        
        // Limpa o formulário
        document.getElementById('seed-photo').value = '';
        document.getElementById('donate-seed-name').value = '';
        
        alert('Semente analisada pela IA e cadastrada com sucesso!');
        showAvailable(); // Redireciona para ver as sementes
        
    }, 2500);
}

// Renderizar Sementes e Lógica do Modal
function renderSeeds() {
    const container = document.getElementById('seeds-grid-container');
    container.innerHTML = '';

    seedsDatabase.forEach(seed => {
        const box = document.createElement('div');
        box.className = 'seed-box';
        // Passa o objeto semente para abrir o modal
        box.onclick = () => openModal(seed); 
        box.innerHTML = `
            <h4>${seed.name}</h4>
            <span class="badge">${seed.biome}</span>
            <p style="margin-top: 15px; font-size: 14px; color: #666;">Por: ${seed.author}</p>
        `;
        container.appendChild(box);
    });
}

function openModal(seed) {
    document.getElementById('modal-title').innerText = seed.name;
    document.getElementById('modal-biome').innerText = seed.biome;
    document.getElementById('modal-author').innerText = seed.author;
    document.getElementById('modal-desc').innerText = seed.desc;
    document.getElementById('modal-tips').innerText = seed.tips;
    document.getElementById('seed-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('seed-modal').classList.add('hidden');
}

// Inicializa a aplicação forçando a mostrar o ecrã de login
document.addEventListener('DOMContentLoaded', () => {
    showScreen('login-screen');
});
