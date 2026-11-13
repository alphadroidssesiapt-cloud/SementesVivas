import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// NAVEGAÇÃO
window.switchView = (viewId) => {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById(viewId);
    if(view) view.classList.add('active');
};

window.showDashboard = () => window.switchView('dashboard-view');
window.showLearn = () => window.switchView('learn-view');
window.showDonate = () => {
    document.getElementById('donate-seed-name').value = '';
    document.getElementById('donate-seed-photo').value = '';
    document.getElementById('camera-label').innerText = '📷 Clique aqui para tirar a foto';
    document.getElementById('camera-label').className = 'camera-btn';
    window.switchView('donate-view');
};
window.showAvailable = () => { window.switchView('available-view'); window.renderSeeds(); };
window.showProfile = () => { window.switchView('profile-view'); window.renderMyProfile(); };

// SISTEMA DE LOGIN / CADASTRO
window.login = async () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        errorMsg.style.display = 'none';
    } catch (error) {
        errorMsg.innerText = "Erro ao entrar: Verifique o email e senha.";
        errorMsg.style.display = 'block';
    }
};

window.register = async () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        errorMsg.style.display = 'none';
        alert("Conta criada com sucesso!");
    } catch (error) {
        errorMsg.innerText = "Erro ao criar conta. A senha deve ter 6+ caracteres.";
        errorMsg.style.display = 'block';
    }
};

window.logout = async () => {
    await signOut(auth);
};

// CONTROLO DE SESSÃO
onAuthStateChanged(auth, (user) => {
    const header = document.getElementById('main-header');
    const greeting = document.getElementById('user-greeting');
    
    if (user) {
        header.style.display = 'flex';
        greeting.innerText = `Olá, ${user.email.split('@')[0]}`;
        window.showDashboard();
    } else {
        header.style.display = 'none';
        window.switchView('login-view');
    }
});

// FUNÇÃO PARA REDUZIR TAMANHO DA IMAGEM E CONVERTER PARA BASE64
const comprimirEConverterBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const max_size = 600; 
                let width = img.width, height = img.height;
                if (width > height) {
                    if (width > max_size) { height *= max_size / width; width = max_size; }
                } else {
                    if (height > max_size) { width *= max_size / height; height = max_size; }
                }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
        reader.onerror = error => reject(error);
    });
};

// OCR - IA Lê a imagem
document.getElementById('donate-seed-photo').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const lbl = document.getElementById('camera-label');
    lbl.innerText = '🔄 A processar imagem... aguarde';
    try {
        const result = await Tesseract.recognize(file, 'por');
        if (result.data.text.trim()) {
            document.getElementById('donate-seed-name').value = result.data.text.trim().split('\n')[0].substring(0, 30);
        }
        lbl.innerText = '✅ Foto processada com sucesso!';
        lbl.className = 'camera-btn success';
    } catch (e) {
        lbl.innerText = '✅ Foto adicionada!';
        lbl.className = 'camera-btn success';
    }
});

// SALVAR NOVA SEMENTE NO BANCO DE DADOS
window.processDonation = async () => {
    const name = document.getElementById('donate-seed-name').value;
    const photoInput = document.getElementById('donate-seed-photo');
    const user = auth.currentUser;

    if (!name || photoInput.files.length === 0) return alert('Nome e foto são obrigatórios.');

    const btn = document.getElementById('btn-donate');
    const loading = document.getElementById('upload-loading');
    btn.disabled = true; loading.style.display = 'block';

    try {
        const fotoBase64Texto = await comprimirEConverterBase64(photoInput.files[0]);
        await addDoc(collection(db, "seeds"), {
            name: name,
            fotoBase64: fotoBase64Texto, 
            author: user.email.split('@')[0],
            authorEmail: user.email, // Salva o email para controlo de dono
            userId: user.uid,        // Salva o ID para controlo
            status: 'disponível',    // Novo status para reserva
            timestamp: serverTimestamp()
        });
        alert('Semente cadastrada com sucesso!');
        window.showAvailable();
    } catch (error) {
        alert('Erro ao guardar na base de dados.');
    } finally {
        btn.disabled = false; loading.style.display = 'none';
    }
};

// RENDERIZAR SEMENTES DISPONÍVEIS GERAIS
window.renderSeeds = async () => {
    const container = document.getElementById('seeds-grid-container');
    container.innerHTML = '<p>A carregar...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "seeds"));
        container.innerHTML = ''; 
        if(querySnapshot.empty) return container.innerHTML = '<p>Nenhuma semente cadastrada.</p>';

        querySnapshot.forEach((docSnap) => {
            const seed = docSnap.data();
            const seedId = docSnap.id;
            const user = auth.currentUser;
            
            // Só mostra botões de reservar se a semente não for do próprio utilizador e estiver disponível
            let actionHtml = '';
            if (seed.status === 'reservada') {
                actionHtml = `<p style="color: #f57c00; font-weight: bold; text-align: center;">Reservada por ${seed.reservadoPor}</p>`;
            } else if (user && seed.userId !== user.uid) {
                actionHtml = `<button class="btn-reserve" onclick="window.reservarSemente('${seedId}')">📦 Reservar / Contatar Doador</button>`;
            } else if (user && seed.userId === user.uid) {
                 actionHtml = `<p style="color: #666; text-align: center;">Esta é a sua semente.</p>`;
            }

            const box = document.createElement('div');
            box.className = 'seed-box'; 
            box.innerHTML = `
                <div>
                    ${seed.fotoBase64 ? `<img src="${seed.fotoBase64}">` : ''}
                    <h3 style="margin-top: 10px; color: #2c4c3b;">${seed.name}</h3>
                    <p style="font-size: 14px; color: #666;"><strong>Doador:</strong> ${seed.author}</p>
                </div>
                <div>${actionHtml}</div>
            `;
            container.appendChild(box);
        });
    } catch (error) {
        container.innerHTML = '<p style="color:red;">Erro ao carregar sementes.</p>';
    }
};

// RESERVAR SEMENTE
window.reservarSemente = async (id) => {
    const user = auth.currentUser;
    if(confirm("Deseja reservar esta semente e avisar o doador?")) {
        try {
            await updateDoc(doc(db, "seeds", id), {
                status: 'reservada',
                reservadoPor: user.email.split('@')[0]
            });
            alert("Semente reservada com sucesso! (Numa versão final, um email seria enviado ao doador).");
            window.renderSeeds();
        } catch(e) {
            alert("Erro ao reservar.");
        }
    }
};

// RENDERIZAR MEU PERFIL (EXCLUIR SEMENTES)
window.renderMyProfile = async () => {
    const container = document.getElementById('my-seeds-container');
    const user = auth.currentUser;
    container.innerHTML = '<p>A carregar o seu perfil...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "seeds"));
        container.innerHTML = ''; 
        let hasSeeds = false;

        querySnapshot.forEach((docSnap) => {
            const seed = docSnap.data();
            const seedId = docSnap.id;
            
            // Mostra apenas as sementes do utilizador logado
            if (seed.userId === user.uid || seed.authorEmail === user.email) {
                hasSeeds = true;
                const box = document.createElement('div');
                box.className = 'seed-box'; 
                
                let statusText = seed.status === 'reservada' ? `<span style="color: #f57c00;">Reservada por ${seed.reservadoPor}</span>` : `<span style="color: green;">Disponível</span>`;

                box.innerHTML = `
                    <div>
                        ${seed.fotoBase64 ? `<img src="${seed.fotoBase64}">` : ''}
                        <h3 style="margin-top: 10px; color: #2c4c3b;">${seed.name}</h3>
                        <p style="font-size: 14px; margin-bottom: 5px;"><strong>Status:</strong> ${statusText}</p>
                    </div>
                    <button class="btn-danger" onclick="window.excluirSemente('${seedId}')">🗑️ Excluir Semente</button>
                `;
                container.appendChild(box);
            }
        });

        if(!hasSeeds) container.innerHTML = '<p>Ainda não doou nenhuma semente.</p>';
    } catch (error) {
        container.innerHTML = '<p style="color:red;">Erro ao carregar o seu perfil.</p>';
    }
};

// EXCLUIR SEMENTE DO BANCO DE DADOS
window.excluirSemente = async (id) => {
    if(confirm("Tem certeza absoluta que deseja excluir esta semente?")) {
        try {
            await deleteDoc(doc(db, "seeds", id));
            alert("Semente excluída com sucesso!");
            window.renderMyProfile(); // Recarrega a lista
        } catch(e) {
            alert("Erro ao excluir. Verifique as suas permissões.");
        }
    }
};

// PESQUISA DE PLANTIO
// PESQUISA DE PLANTIO CONECTADA AO GOOGLE (GEMINI API)
window.searchSeedInfo = async () => {
    const queryInput = document.getElementById('search-seed-input').value.trim();
    const resultsContainer = document.getElementById('learn-results');

    if (!queryInput) {
        resultsContainer.innerHTML = '<p style="color: #d32f2f;">Por favor, digite o nome de uma semente para pesquisar.</p>';
        return;
    }

    resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #2c4c3b;">
            <p> A consultar a base de conhecimento para <strong>"${queryInput}"</strong>...</p>
        </div>
    `;

    try {
        // Substitua pela sua chave de API do Google Gemini real
        const apiKey = "SUA_CHAVE_DE_API_DO_GEMINI_AQUI"; 
        
        const prompt = `Crie um guia prático e curto de plantio para a planta/semente: "${queryInput}". 
        Responda em formato HTML simples (usando tags <strong>, <br>, etc.) contendo:
        - Nome comum e científico
        - Luz necessária
        - Rega ideal
        - Solo recomendado
        - Profundidade de plantio
        - Uma dica extra de cultivo.
        Mantenha a resposta limpa e sem blocos de markdown de código estranhos, apenas o HTML direto.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        const aiResponseText = data.candidates[0].content.parts[0].text;

        resultsContainer.innerHTML = `
            <div style="background: #e8f4ea; border-left: 5px solid #2c4c3b; padding: 20px; border-radius: 6px; color: #1e3629;">
                ${aiResponseText}
            </div>
        `;

    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        resultsContainer.innerHTML = `
            <div style="background: #fff3e0; border-left: 5px solid #f57c00; padding: 20px; border-radius: 6px; color: #e65100;">
                <h3 style="margin-top: 0;">Erro na pesquisa</h3>
                <p>Não foi possível ligar ao serviço neste momento. Verifique a sua chave de API ou tente novamente mais tarde.</p>
            </div>
        `;
    }
};
