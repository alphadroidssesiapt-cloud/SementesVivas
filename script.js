import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// CONTROLO DE ABAS / VISTAS
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
    document.getElementById('donate-seed-type').value = 'Doação';
    const lbl = document.getElementById('camera-label');
    lbl.innerHTML = '<span class="material-icons">camera_alt</span> Clique para fotografar ou carregar imagem';
    lbl.className = 'camera-btn';
    window.switchView('donate-view');
};
window.showAvailable = () => { window.switchView('available-view'); window.renderSeeds(); };
window.showProfile = () => { window.switchView('profile-view'); window.renderMyProfile(); };
window.showChat = () => { window.switchView('chat-view'); window.renderChat(); };

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
        await createUserWithEmailAndPassword(auth, email, pass);
        errorMsg.style.display = 'none';
        alert("Conta criada com sucesso!");
    } catch (error) {
        errorMsg.innerText = "Erro ao criar conta. A senha deve ter pelo menos 6 caracteres.";
        errorMsg.style.display = 'block';
    }
};

window.logout = async () => { await signOut(auth); };

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

// COMPRESSÃO DE IMAGEM
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

// OCR - LER FOTO COM TESSERACT
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

// SALVAR SEMENTE (DOAÇÃO OU TROCA)
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
        const fotoBase64Texto = await comprimirEConverterBase64(photoInput.files[0]);
        await addDoc(collection(db, "seeds"), {
            name: name,
            type: type, 
            fotoBase64: fotoBase64Texto,
            author: user.email.split('@')[0],
            authorEmail: user.email,
            userId: user.uid,
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
                </div>
                <div>${actionHtml}</div>
            `;
            container.appendChild(box);
        });
    } catch (error) {
        container.innerHTML = '<p style="color:red;">Erro ao carregar sementes.</p>';
    }
};

// RESERVAR SEMENTE E NOTIFICAR VIA E-MAIL
window.reservarSemente = async (id, authorEmail, seedName) => {
    const user = auth.currentUser;
    if(confirm(`Deseja reservar a semente "${seedName}"? Isto abrirá o seu leitor de e-mail para notificar o doador (${authorEmail}).`)) {
        try {
            await updateDoc(doc(db, "seeds", id), {
                status: 'reservada',
                reservadoPor: user.email.split('@')[0]
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
window.renderChat = async () => {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">A carregar mensagens...</p>';
    try {
        const q = query(collection(db, "chat"), orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);
        container.innerHTML = '';
        
        if (querySnapshot.empty) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Ainda não há mensagens no chat. Seja o primeiro a falar!</p>';
            return;
        }

        const user = auth.currentUser;
        querySnapshot.forEach((docSnap) => {
            const msg = docSnap.data();
            const isMine = user && msg.userId === user.uid;

            const div = document.createElement('div');
            div.className = `chat-msg ${isMine ? 'mine' : ''}`;
            div.innerHTML = `
                <div class="chat-msg-author">${msg.author}</div>
                <div class="chat-msg-text">${msg.text}</div>
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
            author: user.email.split('@')[0],
            userId: user.uid,
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

// MEU PERFIL
window.renderMyProfile = async () => {
    const container = document.getElementById('my-seeds-container');
    const user = auth.currentUser;
    container.innerHTML = '<p style="color: var(--text-muted);">A carregar o seu perfil...</p>';
    
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
