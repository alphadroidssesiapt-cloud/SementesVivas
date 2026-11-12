// 1. IMPORTAR FIREBASE (ES6 Modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// Adicionadas as funções query, orderBy e onSnapshot para o Chat funcionar
import { getFirestore, collection, addDoc, getDocs, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// SUAS CHAVES DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAZUFBGcCz0o0ZeSvXkdbwJXBzFFBemgt0",
  authDomain: "sementesvivas-7b21e.firebaseapp.com",
  projectId: "sementesvivas-7b21e",
  storageBucket: "sementesvivas-7b21e.firebasestorage.app",
  messagingSenderId: "800525003943",
  appId: "1:800525003943:web:1c05341ca393178a02ff82"
};

// 2. INICIALIZAR FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 3. EXPOR FUNÇÕES DE NAVEGAÇÃO PARA O HTML
window.showScreen = (screenId) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
};
window.switchView = (viewId) => {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
};

// Navegação dos botões
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
        document.getElementById('user-greeting').innerText = `Olá, ${user.email.split('@')[0]}`;
        window.showScreen('main-app');
        window.showDashboard();
        window.loadChat(); // Inicia o chat assim que o utilizador faz login
    } else {
        window.showScreen('login-screen');
    }
});

// 5. BASE DE DADOS: CADASTRAR E LISTAR SEMENTES (Com Imagem e Tipo)
window.registerSeed = async () => {
    const name = document.getElementById('seed-name').value;
    // O seu HTML precisa ter um <select id="seed-type"> com as opções "Doação" e "Troca"
    const type = document.getElementById('seed-type').value; 
    // O seu HTML precisa ter um <input id="seed-image-url"> para colar o link da imagem
    const imageUrl = document.getElementById('seed-image-url').value; 
    const user = auth.currentUser;

    if (!name) return alert('Por favor, informe o nome da semente.');
    if (!user) return alert('Precisa estar logado para registar.');

    const btn = document.getElementById('btn-submit-seed');
    btn.disabled = true;

    try {
        await addDoc(collection(db, "seeds"), {
            name: name,
            type: type, //
