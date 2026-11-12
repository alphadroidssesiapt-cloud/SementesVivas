// 1. IMPORTAR FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// 2. CHAVES DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAZUFBGcCz0o0ZeSvXkdbwJXBzFFBemgt0",
  authDomain: "sementesvivas-7b21e.firebaseapp.com",
  projectId: "sementesvivas-7b21e",
  storageBucket: "sementesvivas-7b21e.firebasestorage.app",
  messagingSenderId: "800525003943",
  appId: "1:800525003943:web:1c05341ca393178a02ff82"
};

// 3. INICIALIZAR FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 

// 4. LÓGICA DE NAVEGAÇÃO DAS TELAS
window.switchView = (viewId) => {
    // Procura todas as divs com a classe 'view' e esconde-as
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    // Mostra apenas a que chamámos
    const view = document.getElementById(viewId);
    if(view) view.style.display = 'block';
};

window.showDashboard = () => window.switchView('dashboard-view');
window.showDonate = () => window.switchView('donate-view');
window.showLearn = () => alert("Módulo 'Aprender a Plantar' em desenvolvimento!");
window.showAvailable = () => {
    window.switchView('available-view');
    window.renderSeeds(); // Carrega as sementes quando abre esta tela
};

// 5. AUTENTICAÇÃO BÁSICA
onAuthStateChanged(auth, (user) => {
    const greeting = document.getElementById('user-greeting');
    if (user && greeting) {
        greeting.innerText = `Olá, ${user.email.split('@')[0]}`;
    }
});

window.logout = async () => {
    await signOut(auth);
    alert("Sessão terminada!");
};

// 6. CADASTRAR SEMENTE COM FOTO
window.processDonation = async () => {
    const name = document.getElementById('donate-seed-name').value;
    const photoInput = document.getElementById('donate-seed-photo');
    const user = auth.currentUser;

    if (!name) return alert('Por favor, informe o nome da semente.');
    if (photoInput.files.length === 0) return alert('Por favor, tire uma foto ou selecione uma imagem.');

    const btn = document.getElementById('btn-donate');
    const loading = document.getElementById('upload-loading');
    
    // Bloqueia o botão para não enviar 2 vezes seguidas
    btn.disabled = true;
    loading.style.display = 'block';

    try {
        const file = photoInput.files[0];
        const nomeArquivo = Date.now() + '_' + file.name;
        const storageRef = ref(storage, 'sementes/' + nomeArquivo);

        // Upload da foto para o Firebase Storage
        await uploadBytes(storageRef, file);
        const photoUrl = await getDownloadURL(storageRef);

        // Salvar dados de texto + link da foto no Firestore
        await addDoc(collection(db, "seeds"), {
            name: name,
            imageUrl: photoUrl,
            author: user ? user.email.split('@')[0] : 'Usuário Anónimo',
            timestamp: new Date()
        });

        alert('Semente doada com sucesso!');
        document.getElementById('donate-seed-name').value = '';
        photoInput.value = '';
        window.showAvailable();

    } catch (error) {
        alert('Erro ao guardar: ' + error.message);
        console.error(error);
    } finally {
        btn.disabled = false;
        loading.style.display = 'none';
    }
};

// 7. MOSTRAR SEMENTES NA TELA
window.renderSeeds = async () => {
    const container = document.getElementById('seeds-grid-container');
    if(!container) return;
    
    container.innerHTML = '<p>A carregar sementes da base de dados...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "seeds"));
        container.innerHTML = ''; 

        if(querySnapshot.empty) {
            container.innerHTML = '<p>Ainda não existem sementes cadastradas. Seja o primeiro a doar!</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const seed = doc.data();
            const box = document.createElement('div');
            box.className = 'seed-box'; // Usa o estilo CSS que colocámos no HTML
            
            const imageHtml = seed.imageUrl ? `<img src="${seed.imageUrl}" alt="Foto de ${seed.name}">` : '';

            box.innerHTML = `
                ${imageHtml}
                <h3 style="margin-top: 10px; color: #2c4c3b;">${seed.name}</h3>
                <p style="font-size: 14px; color: #666;">Doador: ${seed.author}</p>
            `;
            container.appendChild(box);
        });
    } catch (error) {
        container.innerHTML = '<p style="color:red;">Erro ao carregar sementes.</p>';
        console.error(error);
    }
};
