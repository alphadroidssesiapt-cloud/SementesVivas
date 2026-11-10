// 1. IMPORTAR FIREBASE (ES6 Modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// SUBSTITUA ESTE BLOCO PELAS SUAS CHAVES DO PASSO 1
const firebaseConfig = {
    // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZUFBGcCz0o0ZeSvXkdbwJXBzFFBemgt0",
  authDomain: "sementesvivas-7b21e.firebaseapp.com",
  projectId: "sementesvivas-7b21e",
  storageBucket: "sementesvivas-7b21e.firebasestorage.app",
  messagingSenderId: "800525003943",
  appId: "1:800525003943:web:1c05341ca393178a02ff82"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
};

// 2. INICIALIZAR FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 3. EXPOR FUNÇÕES PARA O HTML (Como o script é um module, o HTML precisa disto para acionar cliques)
window.showScreen = (screenId) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
};
window.switchView = (viewId) => {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
};
window.showDashboard = () => window.switchView('dashboard-view');
window.showDonate = () => window.switchView('donate-view');
window.showAvailable = () => {
    window.switchView('available-view');
    window.renderSeeds();
};

// 4. AUTENTICAÇÃO
window.registerUser = async () => {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const name = document.getElementById('reg-name').value;
    
    if (!email || !password || !name) return alert('Preencha todos os campos!');

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Conta criada com sucesso!');
        // O login é feito automaticamente após o registo no Firebase
    } catch (error) {
        alert('Erro ao registar: ' + error.message);
    }
};

window.login = async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert('Erro no login. Verifique as credenciais.');
    }
};

window.logout = async () => {
    await signOut(auth);
};

// Verificar estado da sessão em tempo real
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Se logado
        document.getElementById('user-greeting').innerText = `Olá, ${user.email.split('@')[0]}`;
        window.showScreen('main-app');
        window.showDashboard();
    } else {
        // Se não logado
        window.showScreen('login-screen');
    }
});

// 5. BASE DE DADOS (FIRESTORE)
window.processAIDonation = async () => {
    const name = document.getElementById('donate-seed-name').value;
    const user = auth.currentUser;

    if (!name) return alert('Por favor, informe o nome da semente.');
    if (!user) return alert('Precisa estar logado para doar.');

    const btn = document.getElementById('btn-donate');
    const loading = document.getElementById('ai-loading');
    btn.disabled = true;
    loading.classList.remove('hidden');

    try {
        const biomes = ["Cerrado", "Mata Atlântica", "Amazónia", "Caatinga", "Pampa", "Pantanal"];
        const randomBiome = biomes[Math.floor(Math.random() * biomes.length)];

        // Escrever no Firestore
        await addDoc(collection(db, "seeds"), {
            name: name,
            biome: randomBiome,
            author: user.email.split('@')[0], // Pega o nome antes do @
            desc: `(IA) Semente de ${name}, muito resiliente. Fundamental para o ecossistema do bioma ${randomBiome}.`,
            tips: `(IA) Dica: Mantenha em luz indireta na fase inicial e faça rega diária sem encharcar o solo.`,
            timestamp: new Date()
        });

        alert('Semente registada com sucesso!');
        document.getElementById('donate-seed-name').value = '';
        window.showAvailable();

    } catch (error) {
        alert('Erro ao guardar semente: ' + error.message);
        console.error(error);
    } finally {
        btn.disabled = false;
        loading.classList.add('hidden');
    }
};

window.renderSeeds = async () => {
    const container = document.getElementById('seeds-grid-container');
    container.innerHTML = '<p style="margin-left:20px;">A carregar sementes da base de dados global...</p>';

    try {
        // Ler do Firestore
        const querySnapshot = await getDocs(collection(db, "seeds"));
        container.innerHTML = ''; 

        if(querySnapshot.empty) {
            container.innerHTML = '<p style="margin-left:20px;">Ainda não existem sementes cadastradas.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const seed = doc.data();
            const box = document.createElement('div');
            box.className = 'seed-box';
            box.onclick = () => window.openModal(seed); 
            box.innerHTML = `
                <h4>${seed.name}</h4>
                <span class="badge">${seed.biome}</span>
                <p style="margin-top: 15px; font-size: 14px; color: #666;">Por: ${seed.author}</p>
            `;
            container.appendChild(box);
        });
    } catch (error) {
        container.innerHTML = '<p style="margin-left:20px;color:red;">Erro ao carregar do Firebase.</p>';
        console.error("Erro Firestore:", error);
    }
};

// 6. LÓGICA DO MODAL
window.openModal = (seed) => {
    document.getElementById('modal-title').innerText = seed.name;
    document.getElementById('modal-biome').innerText = seed.biome;
    document.getElementById('modal-author').innerText = seed.author;
    document.getElementById('modal-desc').innerText = seed.desc;
    document.getElementById('modal-tips').innerText = seed.tips;
    document.getElementById('seed-modal').classList.remove('hidden');
};
window.closeModal = () => document.getElementById('seed-modal').classList.add('hidden');
