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
let activePrivateChatId = null;

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
    const activeTabBtn = document.getElementById(`tab-\${viewId}`);
    if (activeTabBtn) activeTabBtn.classList.add('active');
};

window.showDashboard = () => window.switchView('dashboard-view');
window.showLearn = () => window.switchView('learn-view');
window.showDonate = () => {
    document.getElementById('donate-seed-name').value = '';
    document.getElementById('donate-seed-photo').value = '';
    document.getElementById('donate-seed-type').value = 'Doação';
    const lbl = document.getElementById('camera-label');
    lbl.innerHTML = 'Clique para fotografar ou carregar imagem';
    lbl.className = 'camera-btn';
    window.switchView('donate-view');
};
window.showAvailable = () => { window.switchView('available-view'); window.renderSeeds(); };
window.showProfile = () => { 
    window.switchView('profile-view'); 
    window.switchProfileSubTab('edit');
};
window.showChat = () => { window.switchView('chat-view'); window.renderChat(); };
window.showPrivateChats = (chatIdToOpen = null) => {
    window.switchView('private-chats-view');
    window.loadPrivateChatList(chatIdToOpen);
};

// SUB-ABAS DENTRO DO PERFIL
window.switchProfileSubTab = (subTab) => {
    document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`subtab-${subTab}`).classList.add('active');  if (subTab === 'edit') { document.getElementById('profile-sub-edit').style.display = 'block'; document.getElementById('profile-sub-seeds').style.display = 'none'; window.loadProfileData(); } else { document.getElementById('profile-sub-edit').style.display = 'none'; document.getElementById('profile-sub-seeds').style.display = 'block'; window.renderMyProfile(); } };  // AUTENTICAÇÃO COM TRATAMENTO DE ERRO DETALHADO window.login = async () => { const emailField = document.getElementById('auth-email'); const passField = document.getElementById('auth-password'); const errorMsg = document.getElementById('auth-error');  const email = emailField ? emailField.value.trim() : ''; const pass = passField ? passField.value : '';  if (!email \vert{}\vert{} !pass) { errorMsg.innerText = "Por favor, preencha o e-mail e a senha."; errorMsg.style.display = 'block'; return; }  try { await signInWithEmailAndPassword(auth, email, pass); errorMsg.style.display = 'none'; } catch (error) { console.error("Erro detalhado no login:", error); let mensagemErro = "Erro ao entrar. Verifique os dados."; if (error.code === 'auth/user-not-found') { mensagemErro = "Utilizador não encontrado. Crie uma conta primeiro."; } else if (error.code === 'auth/wrong-password') { mensagemErro = "Senha incorreta."; } else if (error.code === 'auth/invalid-email') { mensagemErro = "E-mail inválido."; } else if (error.code === 'auth/invalid-credential') { mensagemErro = "Credenciais inválidas ou e-mail/senha incorretos."; } errorMsg.innerText = mensagemErro; errorMsg.style.display = 'block'; } };  window.register = async () => { const emailField = document.getElementById('auth-email'); const passField = document.getElementById('auth-password'); const errorMsg = document.getElementById('auth-error');  const email = emailField ? emailField.value.trim() : ''; const pass = passField ? passField.value : '';  if (!email \vert{}\vert{} !pass) { errorMsg.innerText = "Por favor, preencha o e-mail e a senha."; errorMsg.style.display = 'block'; return; }  try { const cred = await createUserWithEmailAndPassword(auth, email, pass); await setDoc(doc(db, "users", cred.user.uid), { displayName: email.split('@')[0], community: "Aparecida do Taboado", avatarBase64: "", email: email }); errorMsg.style.display = 'none'; alert("Conta criada com sucesso!"); } catch (error) { errorMsg.innerText = "Erro ao criar conta. A senha deve ter pelo menos 6 caracteres."; errorMsg.style.display = 'block'; } };  window.logout = async () => { await signOut(auth); };  // CONTROLO DE SESSÃO onAuthStateChanged(auth, async (user) => { const header = document.getElementById('main-header'); const greeting = document.getElementById('user-greeting'); const loginView = document.getElementById('login-view');  if (user) { const userDoc = await getDoc(doc(db, "users", user.uid)); if (userDoc.exists()) { userProfileCache = userDoc.data(); currentCommunity = userProfileCache.community \vert{}\vert{} "Aparecida do Taboado"; greeting.innerText = `Olá, ${userProfileCache.displayName || user.email.split('@')[0]}`;
        } else {
            greeting.innerText = `Olá, ${user.email.split('@')[0]}`; }  if (loginView) { loginView.classList.remove('active'); loginView.style.display = 'none'; } if (header) header.style.display = 'flex'; window.showDashboard(); } else { if (header) header.style.display = 'none'; userProfileCache = null; if (loginView) loginView.style.display = 'flex'; window.switchView('login-view'); } });  // COMPRESSÃO DE IMAGEM const comprimirEConverterBase64 = (file, max_size = 600, quality = 0.7) => { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = (event) => { const img = new Image(); img.src = event.target.result; img.onload = () => { const canvas = document.createElement('canvas'); let width = img.width, height = img.height; if (width > height) { if (width > max_size) { height *= max_size / width; width = max_size; } } else { if (height > max_size) { width *= max_size / height; height = max_size; } } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', quality)); }; }; reader.onerror = error => reject(error); }); };  // GESTÃO DE PERFIL window.loadProfileData = async () => { const user = auth.currentUser; if (!user) return; const userDoc = await getDoc(doc(db, "users", user.uid)); if (userDoc.exists()) { const data = userDoc.data(); document.getElementById('profile-name').value = data.displayName \vert{}\vert{} ''; document.getElementById('profile-community').value = data.community \vert{}\vert{} 'Aparecida do Taboado';  const preview = document.getElementById('profile-avatar-preview'); const placeholder = document.getElementById('profile-avatar-placeholder'); if (data.avatarBase64) { preview.src = data.avatarBase64; preview.style.display = 'block'; placeholder.style.display = 'none'; } else { preview.style.display = 'none'; placeholder.style.display = 'flex'; } } };  window.saveProfile = async () => { const user = auth.currentUser; if (!user) return;  const name = document.getElementById('profile-name').value.trim(); const community = document.getElementById('profile-community').value; const photoInput = document.getElementById('profile-photo-input');  let avatarBase64 = userProfileCache?.avatarBase64 \vert{}\vert{} "";  if (photoInput.files.length > 0) { avatarBase64 = await comprimirEConverterBase64(photoInput.files[0], 200, 0.6); }  try { await setDoc(doc(db, "users", user.uid), { displayName: name \vert{}\vert{} user.email.split('@')[0], community: community, avatarBase64: avatarBase64, email: user.email }, { merge: true });  userProfileCache = { displayName: name, community, avatarBase64, email: user.email }; currentCommunity = community; document.getElementById('user-greeting').innerText = `Olá, ${name || user.email.split('@')[0]}`;
        alert("Perfil atualizado com sucesso!");
        window.loadProfileData();
    } catch (e) {
        alert("Erro ao atualizar o perfil.");
    }
};

// OCR - LER FOTO DA SEMENTE COM TESSERACT
const seedPhotoInput = document.getElementById('donate-seed-photo');
if (seedPhotoInput) {
    seedPhotoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const lbl = document.getElementById('camera-label');
        lbl.innerHTML = 'A ler texto da imagem...';
        try {
            const result = await Tesseract.recognize(file, 'por');
            if (result.data.text.trim()) {
                document.getElementById('donate-seed-name').value = result.data.text.trim().split('\n')[0].substring(0, 30);
            }
            lbl.innerHTML = 'Foto processada com sucesso!';
            lbl.className = 'camera-btn success';
        } catch (e) {
            lbl.innerHTML = 'Foto adicionada!';
            lbl.className = 'camera-btn success';
        }
    });
}

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
                actionHtml = `<p style="color: #bc6c25; font-size: 13px; font-weight: 600; text-align: center; margin-top: 10px;">Reservada por \${seed.reservadoPor}</p>`;
            } else if (user && seed.userId !== user.uid) {
                actionHtml = `<button class="btn-reserve" onclick="window.reservarSemente('${seedId}', '${seed.userId}', '${seed.author}', '${seed.name}')">Reservar e Abrir Chat</button>`;
            } else if (user && seed.userId === user.uid) {
                actionHtml = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; margin-top: 10px;">Esta semente é sua.</p>`;
            }

            const box = document.createElement('div');
            box.className = 'seed-box';
            box.innerHTML = `
                <div>
                    \${seed.fotoBase64 ? `<img src="${seed.fotoBase64}">` : ''}
                    <span class="badge-tipo ${badgeClass}">${badgeText}</span>
                    <h4 style="color: var(--primary); font-size: 16px; margin-bottom: 4px;">\${seed.name}</h4>
                    <p style="font-size: 13px; color: var(--text-muted);">Doador: <strong>\${seed.author}</strong></p>
                    <p style="font-size: 12px; color: var(--text-muted);">Comunidade: \${seed.community || 'Geral'}</p>
                </div>
                <div>\${actionHtml}</div>
            `;
            container.appendChild(box);
        });
    } catch (error) {
        container.innerHTML = '<p style="color:red;">Erro ao carregar sementes.</p>';
    }
};

// RESERVAR SEMENTE E CRIAR CHAT PRIVADO
window.reservarSemente = async (seedId, ownerId, ownerName, seedName) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const myName = userProfileCache?.displayName || user.email.split('@')[0];

    if(confirm(`Deseja reservar a semente "\${seedName}" e iniciar um chat com ${ownerName}?`)) { try { await updateDoc(doc(db, "seeds", seedId), { status: 'reservada', reservadoPor: myName });  const chatRoomRef = await addDoc(collection(db, "private_chats"), { seedId: seedId, seedName: seedName, ownerId: ownerId, ownerName: ownerName, requesterId: user.uid, requesterName: myName, participants: [ownerId, user.uid], createdAt: serverTimestamp() });  await addDoc(collection(db, "private_chats", chatRoomRef.id, "messages"), { text: `Olá ${ownerName}! Acabei de reservar a semente "\${seedName}". Como podemos combinar a entrega ou troca?`,
                senderId: user.uid,
                senderName: myName,
                avatar: userProfileCache?.avatarBase64 || "",
                timestamp: serverTimestamp()
            });

            window.showPrivateChats(chatRoomRef.id);
        } catch(e) {
            alert("Erro ao efetuar a reserva e abrir o chat.");
        }
    }
};

// GESTÃO DOS CHATS PRIVADOS
window.loadPrivateChatList = async (chatIdToOpen = null) => {
    const listContainer = document.getElementById('private-chat-list');
    const user = auth.currentUser;
    if (!user) return;

    listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">A carregar conversas...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "private_chats"));
        listContainer.innerHTML = '';
        let threads = [];

        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.participants && data.participants.includes(user.uid)) {
                threads.push({ id: docSnap.id, ...data });
            }
        });

        threads.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.toMillis() - a.createdAt.toMillis();
        });

        if (threads.length === 0) {
            listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">Ainda não tem nenhuma conversa ativa.</p>';
            return;
        }

        threads.forEach(thread => {
            const isOwner = thread.ownerId === user.uid;
            const otherPersonName = isOwner ? thread.requesterName : thread.ownerName;
            const roleLabel = isOwner ? 'Interessado na sua semente' : 'Doador da semente';

            const item = document.createElement('div');
            item.className = `chat-thread-item ${activePrivateChatId === thread.id ? 'active' : ''}`; item.id = `thread-item-${thread.id}`;
            item.onclick = () => window.openPrivateChatRoom(thread.id, thread.seedName, otherPersonName);
            
            item.innerHTML = `
                <div style="font-weight: 700; color: var(--primary); font-size: 14px; margin-bottom: 3px;">\${thread.seedName}</div>
                <div style="font-size: 12px; color: var(--secondary); font-weight: 600;">\${otherPersonName}</div>
                <div style="font-size: 11px; color: var(--text-muted);">\${roleLabel}</div>
            `;
            listContainer.appendChild(item);
        });

        if (chatIdToOpen) {
            const targetThread = threads.find(t => t.id === chatIdToOpen);
            if (targetThread) {
                const otherName = targetThread.ownerId === user.uid ? targetThread.requesterName : targetThread.ownerName;
                window.openPrivateChatRoom(targetThread.id, targetThread.seedName, otherName);
            }
        }
    } catch (error) {
        listContainer.innerHTML = '<p style="color: red; font-size: 13px;">Erro ao carregar conversas.</p>';
    }
};

window.openPrivateChatRoom = async (chatId, seedName, otherPersonName) => {
    activePrivateChatId = chatId;
    
    document.querySelectorAll('.chat-thread-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.getElementById(`thread-item-${chatId}`); if (activeEl) activeEl.classList.add('active');  document.getElementById('private-chat-header').style.display = 'block'; document.getElementById('private-chat-title').innerText = `Semente: ${seedName}`;
    document.getElementById('private-chat-subtitle').innerText = `A conversar com: \${otherPersonName}`;
    document.getElementById('private-chat-input-box').style.display = 'flex';

    const messagesContainer = document.getElementById('private-chat-messages');
    messagesContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center;">A carregar mensagens...</p>';

    try {
        const msgsSnap = await getDocs(collection(db, "private_chats", chatId, "messages"));
        messagesContainer.innerHTML = '';
        let msgs = [];

        msgsSnap.forEach(docSnap => msgs.push(docSnap.data()));
        msgs.sort((a, b) => {
            if (!a.timestamp || !b.timestamp) return 0;
            return a.timestamp.toMillis() - b.timestamp.toMillis();
        });

        const user = auth.currentUser;
        msgs.forEach(msg => {
            const isMine = user && msg.senderId === user.uid;
            const avatarHtml = msg.avatar 
                ? `<img src="\${msg.avatar}" class="chat-avatar">` 
                : `<div class="chat-avatar" style="background:#edf6ed; display:flex; align-items:center; justify-content:center; font-size:14px; color:var(--secondary);">U</div>`;

            const div = document.createElement('div');
            div.className = `chat-msg \${isMine ? 'mine' : ''}`;
            div.innerHTML = `
                \${avatarHtml}
                <div class="chat-msg-content">
                    <div class="chat-msg-author">\${msg.senderName}</div>
                    <div class="chat-msg-text">\${msg.text}</div>
                </div>
            `;
            messagesContainer.appendChild(div);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        messagesContainer.innerHTML = '<p style="color: red; text-align: center;">Erro ao carregar mensagens.</p>';
    }
};

window.sendPrivateMessage = async () => {
    if (!activePrivateChatId) return;
    const input = document.getElementById('private-chat-input');
    const text = input.value.trim();
    if (!text) return;

    const user = auth.currentUser;
    if (!user) return;

    const myName = userProfileCache?.displayName || user.email.split('@')[0];

    try {
        await addDoc(collection(db, "private_chats", activePrivateChatId, "messages"), {
            text: text,
            senderId: user.uid,
            senderName: myName,
            avatar: userProfileCache?.avatarBase64 || "",
            timestamp: serverTimestamp()
        });
        input.value = '';
        const titleText = document.getElementById('private-chat-title').innerText.replace('Semente: ', '');
        const subText = document.getElementById('private-chat-subtitle').innerText.replace('A conversar com: ', '');
        window.openPrivateChatRoom(activePrivateChatId, titleText, subText);
    } catch (error) {
        alert('Erro ao enviar mensagem.');
    }
};

window.checkPrivateChatEnter = (e) => {
    if (e.key === 'Enter') {
        window.sendPrivateMessage();
    }
};

// CHAT COMUNITÁRIO GERAL
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
            container.innerHTML = `<p style="color: var(--text-muted); text-align: center;">Ainda não há mensagens na comunidade de \${currentCommunity}. Seja o primeiro a falar!</p>`;
            return;
        }

        const user = auth.currentUser;
        messages.forEach((msg) => {
            const isMine = user && msg.userId === user.uid;
            const avatarHtml = msg.avatar 
                ? `<img src="\${msg.avatar}" class="chat-avatar">` 
                : `<div class="chat-avatar" style="background:#edf6ed; display:flex; align
