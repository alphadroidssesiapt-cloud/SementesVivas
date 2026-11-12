import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZUFBGcCz0o0ZeSvXkdbwJXBzFFBemgt0",
  authDomain: "sementesvivas-7b21e.firebaseapp.com",
  projectId: "sementesvivas-7b21e",
  storageBucket: "sementesvivas-7b21e.firebasestorage.app",
  messagingSenderId: "800525003943",
  appId: "1:800525003943:web:1c05341ca393178a02ff82"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 

window.switchView = (viewId) => {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    const view = document.getElementById(viewId);
    if(view) view.style.display = 'block';
};

window.showDashboard = () => window.switchView('dashboard-view');
window.showDonate = () => {
    // Limpa o formulário sempre que a tela de doação é aberta
    document.getElementById('donate-seed-name').value = '';
    document.getElementById('donate-seed-photo').value = '';
    document.getElementById('camera-label').innerText = '📷 Clique aqui para tirar a foto';
    window.switchView('donate-view');
};
window.showLearn = () => alert("Módulo 'Aprender a Plantar' em desenvolvimento!");
window.showAvailable = () => {
    window.switchView('available-view');
    window.renderSeeds(); 
};

onAuthStateChanged(auth, (user) => {
    const greeting = document.getElementById('user-greeting');
    if (user && greeting) {
        greeting.innerText = `Olá, ${user.email.split('@')[0]}`;
    }
});

window.logout = async () => {
    await signOut(auth);
    alert("Sessão terminada!");
    // Redirecionaria para o login num ambiente completo
};

window.processDonation = async () => {
    const name = document.getElementById('donate-seed-name').value;
    const photoInput = document.getElementById('donate-seed-photo');
    const user = auth.currentUser;

    if (!name) return alert('Por favor, informe o nome da semente.');
    if (photoInput.files.length === 0) return alert('É obrigatório tirar uma foto da semente.');

    const btn = document.getElementById('btn-donate');
    const loading = document.getElementById('upload-loading');
    
    btn.disabled = true;
    loading.style.display = 'block';

    try {
        const file = photoInput.files[0];
        const nomeArquivo = Date.now() + '_' + file.name;
        const storageRef = ref(storage, 'sementes/' + nomeArquivo);

        // Upload da foto para o Firebase Storage usando uploadBytesResumable para maior estabilidade
        const uploadTask = await uploadBytesResumable(storageRef, file);
        const photoUrl = await getDownloadURL(uploadTask.ref);

        // Salvar dados no Firestore
        await addDoc(collection(db, "seeds"), {
            name: name,
            imageUrl: photoUrl,
            author: user ? user.email.split('@')[0] : 'Usuário Anónimo',
            timestamp: serverTimestamp()
        });

        alert('Semente cadastrada com sucesso!');
        window.showAvailable();

    } catch (error) {
        alert('Ocorreu um erro ao guardar na base de dados. Tente novamente.');
        console.error("Erro detalhado:", error);
    } finally {
        btn.disabled = false;
        loading.style.display = 'none';
    }
};

window.renderSeeds = async () => {
    const container = document.getElementById('seeds-grid-container');
    if(!container) return;
    
    container.innerHTML = '<p style="color: #666; font-style: italic;">A procurar sementes na base de dados global...</p>';

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
            box.className = 'seed-box'; 
            
            const imageHtml = seed.imageUrl ? `<img src="${seed.imageUrl}" alt="Foto de ${seed.name}">` : '';

            box.innerHTML = `
                ${imageHtml}
                <h3 style="margin-top: 10px; color: #2c4c3b;">${seed.name}</h3>
                <p style="font-size: 14px; color: #666;"><strong>Doador:</strong> ${seed.author}</p>
            `;
            container.appendChild(box);
        });
    } catch (error) {
        container.innerHTML = '<p style="color:red;">Não foi possível carregar as sementes. Verifique a ligação ao Firebase.</p>';
        console.error(error);
    }
};
