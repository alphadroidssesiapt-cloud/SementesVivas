import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

let currentCommunity = "Aparecida do Taboado";
let userProfileCache = null;

// SISTEMA DE ABAS PRINCIPAIS
window.switchView = (viewId) => {
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });
    
    const view = document.getElementById(viewId);
    if(view) {
        view.classList.add('active');
        view.style.display = (viewId === 'login-view') ? 'flex' : 'block';
    }

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeTabBtn = document.getElementById(`tab-${viewId}`);
    if (activeTabBtn) activeTabBtn.classList.add('active');
};

window.showDashboard = () => window.switchView('dashboard-view');
window.showLearn = () => window.switchView('learn-view');
window.showDonate = () => {
    document.getElementById('donate-seed-name').value = '';
    document.getElementById('donate-seed-photo').value = '';
    document.getElementById('donate-seed-type').value = 'Doação';
    const lbl = document.getElementById('camera-label');
    lbl.innerHTML = '<span class="material-icons">camera_alt</span> Clique para fotografar ou carregar imagem';
    lbl.className = 'camera-btn';
    window.switchView('donate-view');
};
window.showAvailable = () => { window.switchView('available-view'); window.renderSeeds(); };
window.showProfile = () => { 
    window.switchView('profile-view'); 
    window.switchProfileSubTab('edit');
};
window.showChat = () => { window.switchView('chat-view'); window.renderChat(); };

// SUB-ABAS DENTRO DO PERFIL
window.switchProfileSubTab = (subTab) => {
    document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`subtab-${subTab}`).classList.add('active');

    if (subTab === 'edit') {
        document.getElementById('profile-sub-edit').style.display = 'block';
        document.getElementById('profile-sub-seeds').style.display = 'none';
        window.loadProfileData();
    } else {
        document.getElementById('profile-sub-edit').style.display = 'none';
        document.getElementById('profile-sub-seeds').style.display = 'block';
        window.renderMyProfile();
    }
};

// AUTENTICAÇÃO
window.login = async () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        errorMsg.style.display = 'none';
    } catch (error) {
        errorMsg.innerText = "Erro ao entrar: Verifique o e-mail e senha.";
        errorMsg.style.display = 'block';
    }
};

window.register = async () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", cred.user.uid), {
            displayName: email.split('@')[0],
            community: "Aparecida do Taboado",
            avatarBase64: "",
            email: email
        });
        errorMsg.style.display = 'none';
        alert("Conta criada com sucesso!");
    } catch (error) {
        errorMsg.innerText = "Erro ao criar conta. A senha deve ter pelo menos 6 caracteres.";
        errorMsg.style.display = 'block';
    }
};

window.logout = async () => { await signOut(auth); };

// CONTROLO DE SESSÃO COM REMOÇÃO DIRETA DO LOGIN
onAuthStateChanged(auth, async (user) => {
    const header = document.getElementById('main-header');
    const greeting = document.getElementById('user-greeting');
    const loginView = document.getElementById('login-view');
    
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            userProfileCache = userDoc.data();
            currentCommunity = userProfileCache.community || "Aparecida do Taboado";
            greeting.innerText = `Olá, ${userProfileCache.displayName || user.email.split('@')[0]}`;
        } else {
            greeting.innerText = `Olá, ${user.email.split('@')[0]}`;
        }
        
        // Esconde completamente a tela de login
        loginView.classList.remove('active');
        loginView.style.display = 'none';
        
        header.style.display = 'flex';
        window.showDashboard();
    } else {
        header.style.display = 'none';
        userProfileCache = null;
        loginView.style.display = 'flex';
        window.switchView('login-view');
    }
});

// COMPRESSÃO DE IMAGEM
const comprimirEConverterBase64 = (file, max_size = 600, quality = 0.7) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width, height = img.height;
                if (width > height) {
                    if (width > max_size) { height *= max_size / width; width = max_size; }
                } else {
                    if (height > max_size) { width *= max_size / height; height = max_size; }
                }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
        };
        reader.onerror = error => reject(error);
    });
};

// GESTÃO DE PERFIL
window.loadProfileData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
        const data = userDoc.data();
        document.getElementById('profile-name').value = data.displayName || '';
        document.getElementById('profile-community').value = data.community || 'Aparecida do Taboado';
        
        const preview = document.getElementById('profile-avatar-preview');
        const placeholder = document.getElementById('profile-avatar-placeholder');
        if (data.avatarBase64) {
            preview.src = data.avatarBase64;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            preview.style.display = 'none';
            placeholder.style.display = 'flex';
        }
    }
};

window.saveProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const name = document.getElementById('profile-name').value.trim();
    const community = document.getElementById('profile-community').value;
    const photoInput = document.getElementById('profile-photo-input');

    let avatarBase64 = userProfileCache?.avatarBase64 || "";

    if (photoInput.files.length > 0) {
        avatarBase64 = await comprimirEConverterBase64(photoInput.files[0], 200, 0.6);
    }

    try {
        await setDoc(doc(db, "users", user.uid), {
            displayName: name || user.email.split('@')[0],
            community: community,
            avatarBase64: avatarBase64,
            email: user.email
        }, { merge: true });

        userProfileCache = { displayName: name, community, avatarBase64, email: user.email };
        currentCommunity = community;
        document.getElementById('user-greeting').innerText = `Olá, ${name || user.email.split('@')[0]}`;
        alert("Perfil atualizado com sucesso!");
        window.loadProfileData();
    } catch (e) {
        alert("Erro ao atualizar o perfil.");
    }
};

// OCR - LER FOTO DA SEMENTE COM TESSERACT
document.getElementById('donate-seed-photo').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const lbl = document.getElementById('camera-label');
    lbl.innerHTML = '🔄 A ler texto da imagem...';
    try {
        const result = await Tesseract.recognize(file, 'por');
        if (result.data.text.trim()) {
            document.getElementById('donate-seed-name').value = result.data.text.trim().split('\n')[0].substring(0, 30);
        }
        lbl.innerHTML = '✅ Foto processada com sucesso!';
        lbl.className = 'camera-btn success';
    } catch (e) {
        lbl.innerHTML = '✅ Foto adicionada!';
        lbl.className = 'camera-btn success';
    }
});

// SALVAR SEMENTE
window.processDonation = async () => {
    const name = document.getElementById('donate-seed-name').value.trim();
    const type = document.getElementById('donate-seed-type').value;
    const photoInput = document.getElementById('donate-seed-photo');
    const user = auth.currentUser;

    if (!name || photoInput.files.length === 0) return alert('Nome e foto são obrigatórios.');

    const btn = document.getElementById('btn-donate');
    const loading = document.getElementById('upload-loading');
    btn.disabled = true; loading.style.display = 'block';

    try {
        const fotoBase64Texto = await comprimirEConverterBase64(photoInput.files[0], 600, 0.7);
        await addDoc(collection(db, "seeds"), {
            name: name,
            type: type,
            fotoBase64: fotoBase64Texto,
            author: userProfileCache?.displayName || user.email.split('@')[0],
            authorEmail: user.email,
            userId: user.uid,
            community: userProfileCache?.community || "Aparecida do Taboado",
            status: 'disponível',
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

// RENDERIZAR SEMENTES DISPONÍVEIS
window.renderSeeds = async () => {
    const container = document.getElementById('seeds-grid-container');
    container.innerHTML = '<p style="color: var(--text-muted);">A carregar sementes...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "seeds"));
        container.innerHTML = '';
        if(querySnapshot.empty) return container.innerHTML = '<p style="color: var(--text-muted);">Nenhuma semente cadastrada no momento.</p>';

        querySnapshot.forEach((docSnap) => {
            const seed = docSnap.data();
            const seedId = docSnap.id;
            const user = auth.currentUser;
            
            let actionHtml = '';
            const badgeClass = seed.type === 'Troca' ? 'badge-troca' : 'badge-doacao';
            const badgeText = seed.type || 'Doação';

            if (seed.status === 'reservada') {
                actionHtml = `<p style="color: #f57c00; font-size: 13px; font-weight: 600; text-align: center; margin-top: 10px;">🔒 Reservada por ${seed.reservadoPor}</p>`;
            } else if (user && seed.userId !== user.uid) {
                actionHtml = `<button class="btn-reserve" onclick="window.reservarSemente('${seedId}', '${seed.authorEmail}', '${seed.name}')">📦 Reservar / Notificar Doador</button>`;
            } else if (user && seed.userId === user.uid) {
                actionHtml = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; margin-top: 10px;">Esta semente é sua.</p>`;
            }

            const box = document.createElement('div');
            box.className = 'seed-box';
            box.innerHTML = `
                <div>
                    ${seed.fotoBase64 ? `<img src="${seed.fotoBase64}">` : ''}
                    <span class="badge-tipo ${badgeClass}">${badgeText}</span>
                    <h4 style="color: var(--primary); font-size: 16px; margin-bottom: 4px;">${seed.name}</h4>
                    <p style="font-size: 13px; color: var(--text-muted);">Doador: <strong>${seed.author}</strong></p>
                    <p style="font-size: 12px; color: var(--text-muted);">📍 ${seed.community || 'Geral'}</p>
                </div>
                <div>${actionHtml}</div>
            `;
            container.appendChild(box);
        });
    } catch (error) {
        container.innerHTML = '<p style="color:red;">Erro ao carregar sementes.</p>';
    }
};

window.reservarSemente = async (id, authorEmail, seedName) => {
    const user = auth.currentUser;
    if(confirm(`Deseja reservar a semente "${seedName}"? Isto abrirá o seu leitor de e-mail para notificar o doador (${authorEmail}).`)) {
        try {
            await updateDoc(doc(db, "seeds", id), {
                status: 'reservada',
                reservadoPor: userProfileCache?.displayName || user.email.split('@')[0]
            });
            
            const subject = encodeURIComponent(`Reserva da semente: ${seedName} - Sementes Vivas`);
            const body = encodeURIComponent(`Olá!\n\nO utilizador ${user.email} acabou de reservar a sua semente "${seedName}" na plataforma Sementes Vivas.\n\nPor favor, entre em contacto para combinar a entrega ou troca.`);
            window.location.href = `mailto:${authorEmail}?subject=${subject}&body=${body}`;

            window.renderSeeds();
        } catch(e) {
            alert("Erro ao efetuar a reserva.");
        }
    }
};

// CHAT COMUNITÁRIO
window.changeChatCommunity = () => {
    currentCommunity = document.getElementById('chat-community-select').value;
    window.renderChat();
};

window.renderChat = async () => {
    const container = document.getElementById('chat-messages');
    const select = document.getElementById('chat-community-select');
    if (select) select.value = currentCommunity;

    container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">A carregar mensagens...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "chat"));
        container.innerHTML = '';
        
        let messages = [];
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.community === currentCommunity) {
                messages.push(data);
            }
        });

        messages.sort((a, b) => {
            if (!a.timestamp || !b.timestamp) return 0;
            return a.timestamp.toMillis() - b.timestamp.toMillis();
        });

        if (messages.length === 0) {
            container.innerHTML = `<p style="color: var(--text-muted); text-align: center;">Ainda não há mensagens na comunidade de ${currentCommunity}. Seja o primeiro a falar!</p>`;
            return;
        }

        const user = auth.currentUser;
        messages.forEach((msg) => {
            const isMine = user && msg.userId === user.uid;
            const avatarHtml = msg.avatar 
                ? `<img src="${msg.avatar}" class="chat-avatar">` 
                : `<div class="chat-avatar" style="background:#e8f4ea; display:flex; align-items:center; justify-content:center; font-size:14px; color:var(--secondary);">🌱</div>`;

            const div = document.createElement('div');
            div.className = `chat-msg ${isMine ? 'mine' : ''}`;
            div.innerHTML = `
                ${avatarHtml}
                <div class="chat-msg-content">
                    <div class="chat-msg-author">${msg.author}</div>
                    <div class="chat-msg-text">${msg.text}</div>
                </div>
            `;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    } catch (error) {
        container.innerHTML = '<p style="color:red; text-align:center;">Erro ao carregar o chat.</p>';
    }
};

window.enviarMensagemChat = async () => {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    const user = auth.currentUser;
    if (!user) return alert('Precisa estar logado para enviar mensagens.');

    try {
        await addDoc(collection(db, "chat"), {
            text: text,
            author: userProfileCache?.displayName || user.email.split('@')[0],
            userId: user.uid,
            avatar: userProfileCache?.avatarBase64 || "",
            community: currentCommunity,
            timestamp: serverTimestamp()
        });
        input.value = '';
        window.renderChat();
    } catch (error) {
        alert('Erro ao enviar mensagem.');
    }
};

window.checkChatEnter = (e) => {
    if (e.key === 'Enter') {
        window.enviarMensagemChat();
    }
};

// MINHAS SEMENTES NO PERFIL
window.renderMyProfile = async () => {
    const container = document.getElementById('my-seeds-container');
    const user = auth.currentUser;
    container.innerHTML = '<p style="color: var(--text-muted);">A carregar as suas sementes...</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "seeds"));
        container.innerHTML = '';
        let hasSeeds = false;

        querySnapshot.forEach((docSnap) => {
            const seed = docSnap.data();
            const seedId = docSnap.id;
            
            if (seed.userId === user.uid || seed.authorEmail === user.email) {
                hasSeeds = true;
                const box = document.createElement('div');
                box.className = 'seed-box';
                
                const badgeClass = seed.type === 'Troca' ? 'badge-troca' : 'badge-doacao';
                const badgeText = seed.type || 'Doação';
                let statusText = seed.status === 'reservada' ? `<span style="color: #f57c00; font-weight: 600;">Reservada por ${seed.reservadoPor}</span>` : `<span style="color: #2e7d32; font-weight: 600;">Disponível</span>`;

                box.innerHTML = `
                    <div>
                        ${seed.fotoBase64 ? `<img src="${seed.fotoBase64}">` : ''}
                        <span class="badge-tipo ${badgeClass}">${badgeText}</span>
                        <h4 style="color: var(--primary); font-size: 16px; margin-bottom: 4px;">${seed.name}</h4>
                        <p style="font-size: 13px; margin-bottom: 4px;"><strong>Status:</strong> ${statusText}</p>
                    </div>
                    <button class="btn-danger" onclick="window.excluirSemente('${seedId}')">Excluir Semente</button>
                `;
                container.appendChild(box);
            }
        });

        if(!hasSeeds) container.innerHTML = '<p style="color: var(--text-muted);">Ainda não cadastrou nenhuma semente.</p>';
    } catch (error) {
        container.innerHTML = '<p style="color:red;">Erro ao carregar o seu perfil.</p>';
    }
};

window.excluirSemente = async (id) => {
    if(confirm("Tem certeza absoluta que deseja excluir esta semente?")) {
        try {
            await deleteDoc(doc(db, "seeds", id));
            alert("Semente excluída com sucesso!");
            window.renderMyProfile();
        } catch(e) {
            alert("Erro ao excluir.");
        }
    }
};

// PESQUISA VIA WIKIPÉDIA
window.searchSeedInfo = async () => {
    const queryInput = document.getElementById('search-seed-input').value.trim();
    const resultsContainer = document.getElementById('learn-results');

    if (!queryInput) {
        resultsContainer.innerHTML = '<p style="color: #d32f2f;">Por favor, digite o nome de uma semente para pesquisar.</p>';
        return;
    }

    resultsContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--secondary);"><p>🌱 A pesquisar informações para <strong>"${queryInput}"</strong>...</p></div>`;

    try {
        const response = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(queryInput)}`);
        if (!response.ok) throw new Error('Artigo não encontrado');
        const data = await response.json();

        resultsContainer.innerHTML = `
            <div style="background: #e8f4ea; border-left: 5px solid var(--primary); padding: 20px; border-radius: 8px; color: var(--primary);">
                <h3 style="margin-top: 0; margin-bottom: 10px;">${data.title}</h3>
                <p style="line-height: 1.6; color: var(--text-main); font-size: 14px;">${data.extract}</p>
                ${data.thumbnail ? `<img src="${data.thumbnail.source}" alt="${data.title}" style="max-width: 150px; border-radius: 6px; margin-top: 15px; display: block;">` : ''}
                <p style="margin-top: 15px; font-size: 13px;">
                    <a href="${data.content_urls.desktop.page}" target="_blank" style="color: var(--secondary); font-weight: 600; text-decoration: underline;">🔗 Ler artigo completo na Wikipédia</a>
                </p>
            </div>
        `;
    } catch (error) {
        resultsContainer.innerHTML = `
            <div style="background: #fff3e0; border-left: 5px solid #f57c00; padding: 20px; border-radius: 8px; color: #e65100;">
                <h3 style="margin-top: 0;">Nenhum resultado encontrado</h3>
                <p style="font-size: 14px;">Não encontrámos um artigo exato para "${queryInput}". Tente pesquisar pelo nome comum (ex: "Tomateiro", "Girassol").</p>
            </div>
        `;
    }
};
