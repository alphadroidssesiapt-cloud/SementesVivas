import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// Nota: Removemos o import do Firebase Storage, pois já não será necessário com o Base64

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

window.switchView = (viewId) => {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    const view = document.getElementById(viewId);
    if(view) view.style.display = 'block';
};

window.showDashboard = () => window.switchView('dashboard-view');
window.showLearn = () => window.switchView('learn-view');

window.showDonate = () => {
    document.getElementById('donate-seed-name').value = '';
    document.getElementById('donate-seed-photo').value = '';
    const lbl = document.getElementById('camera-label');
    lbl.innerText = '📷 Clique aqui para tirar a foto';
    lbl.className = 'camera-btn';
    window.switchView('donate-view');
};

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
};

document.getElementById('donate-seed-photo').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const lbl = document.getElementById('camera-label');
    const nameInput = document.getElementById('donate-seed-name');
    
    lbl.innerText = '🔄 A IA está a ler a imagem... aguarde';
    lbl.className = 'camera-btn';

    try {
        const result = await Tesseract.recognize(file, 'por');
        const textoExtraido = result.data.text.trim();
        
        if (textoExtraido) {
            nameInput.value = textoExtraido.split('\n')[0].substring(0, 30);
            lbl.innerText = '✅ IA detetou texto! Verifique o nome abaixo.';
            lbl.className = 'camera-btn success';
        } else {
            lbl.innerText = '✅ Foto tirada! (Nenhum texto claro detetado)';
            lbl.className = 'camera-btn success';
        }
    } catch (error) {
        lbl.innerText = '✅ Foto tirada! (Falha ao ler texto)';
        lbl.className = 'camera-btn success';
    }
});

// Função para converter o ficheiro de imagem em texto Base64
const converterParaBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

// SALVAR NO BANCO DE DADOS EM FORMATO TEXTO (BASE64)
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
        // Converte a imagem em texto
        const fotoBase64Texto = await converterParaBase64(file);

        // Salva diretamente no Firestore sem usar o Storage
        await addDoc(collection(db, "seeds"), {
            name: name,
            fotoBase64: fotoBase64Texto, // Mesmo formato da imagem enviada
            author: user ? user.email.split('@')[0] : 'Usuário Anónimo',
            timestamp: serverTimestamp()
        });

        alert('Semente cadastrada com sucesso!');
        window.showAvailable();

    } catch (error) {
        alert('Erro ao guardar na base de dados.');
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
            
            // O navegador consegue ler o texto Base64 diretamente na tag <img>
            const imageHtml = seed.fotoBase64 ? `<img src="${seed.fotoBase64}" alt="Foto de ${seed.name}">` : '';

            box.innerHTML = `
                ${imageHtml}
                <h3 style="margin-top: 10px; color: #2c4c3b;">${seed.name}</h3>
                <p style="font-size: 14px; color: #666;"><strong>Doador:</strong> ${seed.author}</p>
            `;
            container.appendChild(box);
        });
    } catch (error) {
        container.innerHTML = '<p style="color:red;">Não foi possível carregar as sementes.</p>';
        console.error(error);
    }
};

const baseDeDadosPlantio = {
    "feijão": "Plante a semente a cerca de 3 cm de profundidade num solo bem drenado. Germina em 3 a 8 dias. Mantenha o solo levemente húmido.",
    "girassol": "Plante a 2 cm de profundidade. Necessita de exposição solar direta (pelo menos 6 horas por dia). Espaçamento ideal de 30 a 50 cm entre as plantas.",
    "milho": "Plante a 3 a 5 cm de profundidade. É uma planta que consome muitos nutrientes, por isso, adube o solo com azoto. Gosta de sol intenso.",
    "tomate": "As sementes são pequenas, plante superficialmente (0,5 cm). Após a planta ter 4 folhas verdadeiras, transplante para o local definitivo.",
    "alface": "As sementes de alface precisam de luz para germinar. Pressione-as levemente contra o solo húmido sem as enterrar totalmente.",
    "abóbora": "Plante as sementes em 'covas' (pequenos montes de terra) a 2 cm de profundidade, colocando 2 a 3 sementes por cova. Exige muito espaço para a rama crescer."
};

window.searchSeedInfo = () => {
    const input = document.getElementById('search-seed-input').value.toLowerCase().trim();
    const resultDiv = document.getElementById('learn-results');

    if (!input) {
        resultDiv.innerHTML = '<p style="color:red; font-weight:bold;">Por favor, digite o nome de uma semente para pesquisar.</p>';
        return;
    }

    let plantaEncontrada = false;

    for (const [nomeSemente, instrucoes] of Object.entries(baseDeDadosPlantio)) {
        if (input.includes(nomeSemente) || nomeSemente.includes(input)) {
            resultDiv.innerHTML = `
                <div style="background:#fff; border-left: 5px solid #2e7d32; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-radius: 4px;">
                    <h3 style="color:#2e7d32; margin-top:0;">📖 Como plantar: ${nomeSemente.toUpperCase()}</h3>
                    <p style="font-size: 16px; line-height: 1.6; color: #444;">${instrucoes}</p>
                </div>
            `;
            plantaEncontrada = true;
            break;
        }
    }

    if (!plantaEncontrada) {
        resultDiv.innerHTML = `
            <div style="background:#fff; padding: 20px; border-radius: 4px; border: 1px solid #ddd;">
                <p>Ainda não temos instruções detalhadas no nosso sistema para <strong>"${input}"</strong>.</p>
                <p><strong>Sugestão:</strong> Siga as regras gerais acima (Rega, Luz e Profundidade) que funcionam para mais de 80% das sementes comuns!</p>
            </div>
        `;
    }
};
