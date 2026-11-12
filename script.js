// 1. IMPORTAR FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

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
const storage = getStorage(app); // Necessário para salvar as fotos

// 3. LÓGICA DOS BOTÕES DE NAVEGAÇÃO
window.switchView = (viewId) => {
    // Esconde todas as views
    document.getElementById('dashboard-view').style.display = 'none';
    document.getElementById('donate-view').style.display = 'none';
    document.getElementById('available-view').style.display = 'none';
    
    // Mostra apenas a que foi clicada
    document.getElementById(viewId).style.display = 'block';
};

window.showDashboard = () => window.switchView('dashboard-view');
window.showDonate = () => window.switchView('donate-view');
window.showLearn = () => alert("Módulo 'Aprender a Plantar' em desenvolvimento!");
window.showAvailable = () => {
    window.switchView('available-view');
    window.renderSeeds();
};

window.logout = async () => {
    await signOut(auth);
    location.reload(); // Recarrega a página para voltar ao login
};

// 4. CADASTRAR SEMENTE COM FOTO (BANDO DE DADOS)
window.processDonation = async () => {
    const name = document.getElementById('donate-seed-name').value;
    const photoInput = document.getElementById('donate-seed-photo');
    const user = auth.currentUser;

    if (!name) return alert('Por favor, informe o nome da semente.');
    if (photoInput.files.length === 0) return alert('Por favor, tire uma foto ou selecione uma imagem.');
    if (!user) return alert('Precisa estar logado para doar.');

    const btn = document.getElementById('btn-donate');
    const loading = document.getElementById('upload-loading');
    btn.disabled = true;
    loading.style.display = 'block';

    try {
        const file = photoInput.files[0];
        // Criar uma referência única para a imagem no Storage
        const storageRef = ref(storage, 'sementes/' + Date.now() + '_' + file.name);

        // 1. Fazer upload da foto
        await uploadBytes(storageRef, file);
        
        // 2. Obter o link público da foto
        const photoUrl = await getDownloadURL(storageRef);

        // 3. Salvar os dados e o link da foto no Firestore
        await addDoc(collection(db, "seeds"), {
            name: name,
            imageUrl: photoUrl,
            author: user.email.split('@')[0],
            timestamp: new Date()
        });

        alert('Semente e foto salvas com sucesso!');
        document.getElementById('donate-seed-name').value = '';
        photoInput.value = '';
        window.showAvailable(); // Vai para a tela de sementes ver o resultado

    } catch (error) {
        alert('Erro ao guardar: ' + error.message);
        console.error(error);
    } finally {
        btn.disabled = false;
        loading.style.display = 'none';
    }
};

// 5. MOSTRAR SEMENTES DOADAS DE TODOS OS UTILIZADORES
window.renderSeeds = async () => {
    const container = document.getElementById('seeds-grid-container');
    container.innerHTML = '<p>A carregar sementes da base de dados...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "seeds"));
        container.innerHTML = ''; 

        if(querySnapshot.empty) {
            container.innerHTML = '<p>Ainda não existem sementes cadastradas.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const seed = doc.data();
            const box = document.createElement('div');
            box.style.border = "1px solid #ccc";
            box.style.padding = "10px";
            box.style.margin = "10px 0";
            
            // Exibe a imagem se ela existir, caso contrário não mostra nada
            const imageHtml = seed.imageUrl ? `<img src="${seed.imageUrl}" style="width: 100%; max-width: 200px; border-radius: 8px;">` : '';

            box.innerHTML = `
                ${imageHtml}
                <h3>${seed.name}</h3>
                <p>Doador: ${seed.author}</p>
            `;
            container.appendChild(box);
        });
    } catch (error) {
        container.innerHTML = '<p style="color:red;">Erro ao carregar sementes.</p>';
        console.error(error);
    }
};
