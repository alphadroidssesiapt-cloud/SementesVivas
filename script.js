import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc, serverTimestamp, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
let unsubscribeCommunityChat = null;

window.addEventListener('DOMContentLoaded', () => {
    const frame = document.getElementById('device-frame');
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    if (isMobileDevice) {
        frame.className = 'device-mobile';
    } else {
        frame.className = 'device-desktop';
    }

    if (!localStorage.getItem('cookies_accepted')) {
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.style.display = 'block';
    }
});

window.acceptCookies = () => {
    localStorage.setItem('cookies_accepted', 'true');
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.style.display = 'none';
};

window.openTermsModal = (e) => {
    if (e) e.preventDefault();
    const modal = document.getElementById('terms-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeTermsModal = () => {
    const modal = document.getElementById('terms-modal');
    if (modal) modal.style.display = 'none';
};

const cityBiomeDatabase = {
    "Aparecida do Taboado": {
        state: "MS",
        biome: "Cerrado (Transição Mata Atlântica)",
        desc: "Região marcada por solos arenosos e vegetação típica de Cerrado, ideal para espécies como Ipê-Amarelo, Baru, Jatobá e Jatobá-do-Cerrado.",
        portalUrl: "https://www.imasul.ms.gov.br/",
        portalName: "Portal Ambiental do MS (IMASUL)",
        mapQuery: "Aparecida+do+Taboado,MS"
    },
    "Paranaíba": {
        state: "MS",
        biome: "Cerrado",
        desc: "Predominância de Cerrado típico e matas ciliares do rio Paranaíba. Sementes recomendadas: Pequi, Ipê-Roxo, Baru e Ingá.",
        portalUrl: "https://www.imasul.ms.gov.br/",
        portalName: "Portal Ambiental do MS (IMASUL)",
        mapQuery: "Paranaiba,MS"
    },
    "Três Lagoas": {
        state: "MS",
        biome: "Cerrado",
        desc: "Bacia do rio Paraná com grande diversidade de espécies melíferas e nativas do Cerrado sul-mato-grossense.",
        portalUrl: "https://www.imasul.ms.gov.br/",
        portalName: "Portal Ambiental do MS (IMASUL)",
        mapQuery: "Tres+Lagoas,MS"
    },
    "Campo Grande": {
        state: "MS",
        biome: "Cerrado",
        desc: "Coração do Cerrado em Mato Grosso do Sul, com rica presença de Guavira, Bocaiúva, Ipês e Figueiras.",
        portalUrl: "https://www.imasul.ms.gov.br/",
        portalName: "Portal Ambiental do MS (IMASUL)",
        mapQuery: "Campo+Grande,MS"
    },
    "Dourados": {
        state: "MS",
        biome: "Mata Atlântica e Cerrado",
        desc: "Zona de transição ecológica com solos férteis ideais para Peroba-Rosa, Erva-Mate nativa, Cedro e Araçá.",
        portalUrl: "https://www.imasul.ms.gov.br/",
        portalName: "Portal Ambiental do MS (IMASUL)",
        mapQuery: "Dourados,MS"
    },
    "Corumbá": {
        state: "MS",
        biome: "Pantanal",
        desc: "Maior planície alagável do mundo. Espécies adaptadas ao ciclo das águas como Piúva, Carandá, Acuri e Figueira-Branca.",
        portalUrl: "https://www.imasul.ms.gov.br/",
        portalName: "Portal Ambiental do MS (IMASUL)",
        mapQuery: "Corumba,MS"
    },
    "Bonito": {
        state: "MS",
        biome: "Cerrado e Mata Atlântica (Serra da Bodoquena)",
        desc: "Região calcária de águas cristalinas com florestas estacionais preservadas, rica em Aroeira, Angico e Jatobá.",
        portalUrl: "https://www.imasul.ms.gov.br/",
        portalName: "Portal Ambiental do MS (IMASUL)",
        mapQuery: "Bonito,MS"
    },
    "Santa Fé do Sul": {
        state: "SP",
        biome: "Mata Atlântica (Floresta Estacional Semidecidual)",
        desc: "Noroeste paulista na divisa com MS, propício para Jequitibá, Pau-Brasil, Pitanga, Grumixama e Ipês.",
        portalUrl: "https://semil.sp.gov.br/",
        portalName: "Secretaria de Meio Ambiente de SP (SEMIL)",
        mapQuery: "Santa+Fe+do+Sul,SP"
    },
    "Jales": {
        state: "SP",
        biome: "Mata Atlântica e Cerrado",
        desc: "Região paulista com remanescentes de mata nativa e pomares biodiversos de frutas do cerrado e mata atlântica.",
        portalUrl: "https://semil.sp.gov.br/",
        portalName: "Secretaria de Meio Ambiente de SP (SEMIL)",
        mapQuery: "Jales,SP"
    },
    "Fernandópolis": {
        state: "SP",
        biome: "Mata Atlântica e Cerrado",
        desc: "Ecótono entre o Cerrado e a Floresta Estacional de São Paulo, ideal para reflorestamento com espécies nativas regionais.",
        portalUrl: "https://semil.sp.gov.br/",
        portalName: "Secretaria de Meio Ambiente de SP (SEMIL)",
        mapQuery: "Fernandopolis,SP"
    }
};

window.toggleTheme = () => {
    const htmlEl = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    const currentTheme = htmlEl.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        htmlEl.setAttribute('data-theme', 'light');
        themeIcon.innerText = 'dark_mode';
    } else {
        htmlEl.setAttribute('data-theme', 'dark');
        themeIcon.innerText = 'light_mode';
    }
};

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

    document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
    const mapTab = {
        'dashboard-view': 'tab-dashboard-view',
        'available-view': 'tab-available-view',
        'private-chats-view': 'tab-private-chats-view',
        'chat-view': 'tab-chat-view',
        'encyclopedia-view': 'tab-encyclopedia-view',
        'learn-view': 'tab-learn-view',
        'profile-view': 'tab-profile-view'
    };
    if (mapTab[viewId]) {
        const btn = document.getElementById(mapTab[viewId]);
        if (btn) btn.classList.add('active');
    }
};

window.showDashboard = () => window.switchView('dashboard-view');
window.showLearn = () => window.switchView('learn-view');
window.showEncyclopedia = () => {
    window.switchView('encyclopedia-view');
    window.identifyBiomeByCity();
};
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

window.identifyBiomeByCity = () => {
    const city = userProfileCache?.community || currentCommunity || "Aparecida do Taboado";
    const info = cityBiomeDatabase[city] || cityBiomeDatabase["Aparecida do Taboado"];

    const resultBox = document.getElementById('biome-result-box');
    const titleEl = document.getElementById('biome-detected-title');
    const descEl = document.getElementById('biome-detected-desc');
    const gmapsLink = document.getElementById('gmaps-external-link');
    const portalLink = document.getElementById('state-portal-link');
    const portalLabel = document.getElementById('state-portal-label');
    const iframe = document.getElementById('google-maps-iframe');

    titleEl.innerText = `${city} (${info.state}) — Bioma: ${info.biome}`;
    descEl.innerText = info.desc;
    gmapsLink.href = `https://www.google.com/maps/search/?api=1&query=${info.mapQuery}`;
    portalLink.href = info.portalUrl;
    portalLabel.innerText = info.portalName;
    iframe.src = `https://maps.google.com/maps?q=${info.mapQuery}&t=k&z=11&ie=UTF8&iwloc=&output=embed`;

    resultBox.style.display = 'block';
};

window.detectBiomeWithMaps = () => {
    if (!navigator.geolocation) {
        alert("Geolocalização não suportada. A usar cidade do perfil.");
        return window.identifyBiomeByCity();
    }

    const titleEl = document.getElementById('biome-detected-title');
    const resultBox = document.getElementById('biome-result-box');
    resultBox.style.display = 'block';
    titleEl.innerText = "A obter coordenadas GPS...";

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            const iframe = document.getElementById('google-maps-iframe');
            const gmapsLink = document.getElementById('gmaps-external-link');
            iframe.src = `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=13&ie=UTF8&iwloc=&output=embed`;
            gmapsLink.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await res.json();
                const address = data.address || {};
                const stateName = address.state || "";
                const cityName = address.city || address.town || address.village || "Localização Atual";

                let biomeName = "Cerrado Brasileiro";
                let portalUrl = "https://www.gov.br/mma/pt-br";
                let portalLabel = "Ministério do Meio Ambiente";

                if (stateName.includes("Mato Grosso do Sul")) {
                    biomeName = (lng < -56.0) ? "Pantanal Sul-Mato-Grossense" : "Cerrado (Transição Mata Atlântica)";
                    portalUrl = "https://www.imasul.ms.gov.br/";
                    portalLabel = "Portal Ambiental do MS (IMASUL)";
                } else if (stateName.includes("São Paulo")) {
                    biomeName = "Mata Atlântica / Cerrado Paulista";
                    portalUrl = "https://semil.sp.gov.br/";
                    portalLabel = "Secretaria de Meio Ambiente de SP (SEMIL)";
                }

                titleEl.innerText = `${cityName} (${stateName || 'Brasil'}) — Bioma: ${biomeName}`;
                document.getElementById('biome-detected-desc').innerText = `Coordenadas identificadas (${lat.toFixed(4)}, ${lng.toFixed(4)}).`;
                document.getElementById('state-portal-link').href = portalUrl;
                document.getElementById('state-portal-label').innerText = portalLabel;
            } catch (e) {
                window.identifyBiomeByCity();
            }
        },
        () => {
            alert("Permissão de localização negada.");
            window.identifyBiomeByCity();
        }
    );
};

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

window.login = async () => {
    const emailField = document.getElementById('auth-email');
    const passField = document.getElementById('auth-password');
    const errorMsg = document.getElementById('auth-error');
    
    const email = emailField ? emailField.value.trim() : '';
    const pass = passField ? passField.value : '';

    if (!email || !pass) {
        errorMsg.innerText = "Por favor, preencha o e-mail e a senha.";
        errorMsg.style.display = 'block';
        return;
    }

    errorMsg.style.display = 'none';

    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);
        
        if (!userCred.user.emailVerified) {
            errorMsg.innerText = "Por favor, verifique a sua caixa de entrada e confirme o seu e-mail antes de entrar.";
            errorMsg.style.display = 'block';
            await signOut(auth);
            return;
        }
    } catch (error) {
        console.error("Erro Firebase Login:", error.code, error.message);
        let mensagemErro = `Erro (${error.code}): Verifique os dados.`;
        if (error.code === 'auth/user-not-found') mensagemErro = "Utilizador não encontrado.";
        else if (error.code === 'auth/wrong-password') mensagemErro = "Senha incorreta.";
        else if (error.code === 'auth/invalid-credential') mensagemErro = "E-mail ou senha incorretos.";
        
        errorMsg.innerText = mensagemErro;
        errorMsg.style.display = 'block';
    }
};

window.checkLoginEnter = (e) => {
    if (e.key === 'Enter') window.login();
};

window.register = async () => {
    const emailField = document.getElementById('auth-email');
    const passField = document.getElementById('auth-password');
    const errorMsg = document.getElementById('auth-error');
    
    const email = emailField ? emailField.value.trim() : '';
    const pass = passField ? passField.value : '';

    if (!email || !pass) {
        errorMsg.innerText = "Por favor, preencha o e-mail e a senha.";
        errorMsg.style.display = 'block';
        return;
    }

    errorMsg.style.display = 'none';

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        
        await sendEmailVerification(cred.user);

        await setDoc(doc(db, "users", cred.user.uid), {
            displayName: email.split('@')[0],
            community: "Aparecida do Taboado",
            avatarBase64: "",
            email: email
        });

        alert("Conta criada com sucesso! Enviámos um link de confirmação para o seu e-mail. Por favor, confirme-o antes de entrar.");
        await signOut(auth);
    } catch (error) {
        console.error("Erro Firebase Registro:", error.code, error.message);
        let mensagemErro = `Erro ao criar conta (${error.code}).`;
        if (error.code === 'auth/weak-password') mensagemErro = "A senha deve ter pelo menos 6 caracteres.";
        else if (error.code === 'auth/email-already-in-use') mensagemErro = "Este e-mail já está registado.";
        
        errorMsg.innerText = mensagemErro;
        errorMsg.style.display = 'block';
    }
};

window.logout = async () => { await signOut(auth); };

onAuthStateChanged(auth, async (user) => {
    const header = document.getElementById('main-header');
    const greeting = document.getElementById('user-greeting');
    const loginView = document.getElementById('login-view');
    
    if (user && user.emailVerified) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            userProfileCache = userDoc.data();
            currentCommunity = userProfileCache.community || "Aparecida do Taboado";
            if(greeting) greeting.innerText = `Olá, ${userProfileCache.displayName || user.email.split('@')[0]}`;
        } else {
            if(greeting) greeting.innerText = `Olá, ${user.email.split('@')[0]}`;
        }
        
        if (loginView) {
            loginView.classList.remove('active');
            loginView.style.display = 'none';
        }
        if (header) header.style.display = 'flex';
        window.showDashboard();
    } else {
        if (header) header.style.display = 'none';
        userProfileCache = null;
        if (loginView) loginView.style.display = 'flex';
        window.switchView('login-view');
    }
});

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

const seedPhotoInput = document.getElementById('donate-seed-photo');
if (seedPhotoInput) {
    seedPhotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const lbl = document.getElementById('camera-label');
        lbl.innerHTML = 'Foto adicionada com sucesso!';
        lbl.className = 'camera-btn success';
    });
}

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
                if (user && seed.reservadoPorId === user.uid) {
                    actionHtml = `
                        <p style="color: var(--earth); font-size: 12px; font-weight: 600; text-align: center; margin-top: 8px;">Reservada por você</p>
                        <button class="btn-cancel-reserve" onclick="window.removerReserva('${seedId}', 'explore')">Cancelar Minha Reserva</button>
                    `;
                } else {
                    actionHtml = `<p style="color: var(--earth); font-size: 13px; font-weight: 600; text-align: center; margin-top: 10px;">Reservada por ${seed.reservadoPor}</p>`;
                }
            } else if (user && seed.userId !== user.uid) {
                actionHtml = `<button class="btn-reserve" onclick="window.reservarSemente('${seedId}', '${seed.userId}', '${seed.author}', '${seed.name}')">Reservar e Abrir Chat</button>`;
            } else if (user && seed.userId === user.uid) {
                actionHtml = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; margin-top: 10px;">Esta semente é sua.</p>`;
            }

            const box = document.createElement('div');
            box.className = 'seed-box';
            box.innerHTML = `
                <div>
                    ${seed.fotoBase64 ? `<img src="${seed.fotoBase64}" alt="${seed.name}">` : '<div style="height:180px;background:var(--bg-light);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#888;">Sem imagem</div>'}
                    <span class="badge-tipo ${badgeClass}">${badgeText}</span>
                    <h4 style="color: var(--text-main); font-size: 16px; margin-bottom: 4px;">${seed.name}</h4>
                    <p style="font-size: 13px; color: var(--text-muted);">Doador: <strong>${seed.author}</strong></p>
                    <p style="font-size: 12px; color: var(--text-muted);">Comunidade: ${seed.community || 'Geral'}</p>
                </div>
                <div>${actionHtml}</div>
            `;
            container.appendChild(box);
        });
    } catch (error) {
        container.innerHTML = '<p style="color:red;">Erro ao carregar sementes.</p>';
    }
};

window.reservarSemente = async (seedId, ownerId, ownerName, seedName) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const myName = userProfileCache?.displayName || user.email.split('@')[0];

    if(confirm(`Deseja reservar a semente "${seedName}" e iniciar um chat com ${ownerName}?`)) {
        try {
            await updateDoc(doc(db, "seeds", seedId), {
                status: 'reservada',
                reservadoPor: myName,
                reservadoPorId: user.uid
            });
            
            const chatRoomRef = await addDoc(collection(db, "private_chats"), {
                seedId: seedId,
                seedName: seedName,
                ownerId: ownerId,
                ownerName: ownerName,
                requesterId: user.uid,
                requesterName: myName,
                participants: [ownerId, user.uid],
                createdAt: serverTimestamp()
            });

            await addDoc(collection(db, "private_chats", chatRoomRef.id, "messages"), {
                text: `Olá ${ownerName}! Acabei de reservar a semente "${seedName}". Como podemos combinar a entrega ou troca?`,
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

window.removerReserva = async (seedId, originView) => {
    if (confirm("Tem certeza que deseja remover a reserva desta semente?")) {
        try {
            await updateDoc(doc(db, "seeds", seedId), {
                status: 'disponível',
                reservadoPor: null,
                reservadoPorId: null
            });
            alert("Reserva removida com sucesso!");
            if (originView === 'profile') window.renderMyProfile();
            else window.renderSeeds();
        } catch (e) {
            alert("Erro ao remover a reserva.");
        }
    }
};

const formatTelegramDateTime = (timestamp) => {
    if (!timestamp) return 'Agora';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    const hora = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} às ${hora}:${min}`;
};

window.loadPrivateChatList = async (chatIdToOpen = null) => {
    const listContainer = document.getElementById('private-chat-list');
    const user = auth.currentUser;
    if (!user) return;

    listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; padding: 10px;">A carregar conversas...</p>';

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
            listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; padding: 10px;">Ainda não tem nenhuma conversa ativa.</p>';
            return;
        }

        threads.forEach(thread => {
            const isOwner = thread.ownerId === user.uid;
            const otherPersonName = isOwner ? thread.requesterName : thread.ownerName;
            const roleLabel = isOwner ? 'Interessado na sua semente' : 'Doador da semente';

            const item = document.createElement('div');
            item.className = `tg-thread-item ${activePrivateChatId === thread.id ? 'active' : ''}`;
            item.id = `thread-item-${thread.id}`;
            item.onclick = () => window.openPrivateChatRoom(thread.id, thread.seedName, otherPersonName);
            
            item.innerHTML = `
                <div style="font-weight: 700; color: var(--text-main); font-size: 14px; margin-bottom: 2px;">${thread.seedName}</div>
                <div style="font-size: 13px; color: var(--lime); font-weight: 600;">${otherPersonName}</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${roleLabel}</div>
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
        listContainer.innerHTML = '<p style="color: red; font-size: 13px; padding: 10px;">Erro ao carregar conversas.</p>';
    }
};

window.openPrivateChatRoom = async (chatId, seedName, otherPersonName) => {
    activePrivateChatId = chatId;
    
    document.querySelectorAll('.tg-thread-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.getElementById(`thread-item-${chatId}`);
    if (activeEl) activeEl.classList.add('active');

    document.getElementById('private-chat-header').style.display = 'flex';
    document.getElementById('private-chat-title').innerText = `Semente: ${seedName}`;
    document.getElementById('private-chat-subtitle').innerText = `A conversar com: ${otherPersonName}`;
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
            const dateTimeStr = formatTelegramDateTime(msg.timestamp);

            const div = document.createElement('div');
            div.className = `tg-msg-bubble ${isMine ? 'outgoing' : 'incoming'}`;
            div.innerHTML = `
                <div class="tg-msg-sender">${msg.senderName}</div>
                <div class="tg-msg-text">${msg.text}</div>
                <div class="tg-msg-time">${dateTimeStr}</div>
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
    if (e.key === 'Enter') window.sendPrivateMessage();
};

window.changeChatCommunity = () => {
    currentCommunity = document.getElementById('chat-community-select').value;
    window.renderChat();
};

window.renderChat = () => {
    const container = document.getElementById('chat-messages');
    const select = document.getElementById('chat-community-select');
    if (select) select.value = currentCommunity;

    container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">A carregar mensagens...</p>';

    if (unsubscribeCommunityChat) unsubscribeCommunityChat();

    const q = query(collection(db, "chat"), orderBy("timestamp", "asc"));

    unsubscribeCommunityChat = onSnapshot(q, (querySnapshot) => {
        container.innerHTML = '';
        let messages = [];

        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.community === currentCommunity) messages.push(data);
        });

        if (messages.length === 0) {
            container.innerHTML = `<p style="color: var(--text-muted); text-align: center;">Ainda não há mensagens na comunidade de ${currentCommunity}. Seja o primeiro a falar!</p>`;
            return;
        }

        const user = auth.currentUser;
        messages.forEach((msg) => {
            const isMine = user && msg.userId === user.uid;
            const dateTimeStr = formatTelegramDateTime(msg.timestamp);

            const div = document.createElement('div');
            div.className = `tg-msg-bubble ${isMine ? 'outgoing' : 'incoming'}`;
            div.innerHTML = `
                <div class="tg-msg-sender">${msg.author}</div>
                <div class="tg-msg-text">${msg.text}</div>
                <div class="tg-msg-time">${dateTimeStr}</div>
            `;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    }, (error) => {
        container.innerHTML = '<p style="color:red; text-align:center;">Erro ao sincronizar o chat.</p>';
    });
};

window.enviarMensagemChat = async () => {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    const user = auth.currentUser;
    if (!user) return alert('Precisa estar logado.');

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
    } catch (error) {
        alert('Erro ao enviar mensagem.');
    }
};

window.checkChatEnter = (e) => {
    if (e.key === 'Enter') window.enviarMensagemChat();
};

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
                
                let statusText = seed.status === 'reservada' 
                    ? `<span style="color: var(--earth); font-weight: 600;">Reservada por ${seed.reservadoPor}</span>` 
                    : `<span style="color: var(--lime); font-weight: 600;">Disponível</span>`;

                let removeReserveBtn = seed.status === 'reservada'
                    ? `<button class="btn-cancel-reserve" onclick="window.removerReserva('${seedId}', 'profile')">Remover Reserva</button>`
                    : '';

                box.innerHTML = `
                    <div>
                        ${seed.fotoBase64 ? `<img src="${seed.fotoBase64}" alt="${seed.name}">` : '<div style="height:180px;background:var(--bg-light);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#888;">Sem imagem</div>'}
                        <span class="badge-tipo ${badgeClass}">${badgeText}</span>
                        <h4 style="color: var(--text-main); font-size: 16px; margin-bottom: 4px;">${seed.name}</h4>
                        <p style="font-size: 13px; margin-bottom: 4px;"><strong>Status:</strong> ${statusText}</p>
                    </div>
                    <div>
                        ${removeReserveBtn}
                        <button class="btn-danger" onclick="window.excluirSemente('${seedId}')">Excluir Semente</button>
                    </div>
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

window.searchSeedInfo = async () => {
    const queryInput = document.getElementById('search-seed-input').value.trim();
    const resultsContainer = document.getElementById('learn-results');

    if (!queryInput) {
        resultsContainer.innerHTML = '<p style="color: #c53030;">Por favor, digite o nome de uma semente para pesquisar.</p>';
        return;
    }

    resultsContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--lime);"><p>A pesquisar informações para <strong>"${queryInput}"</strong>...</p></div>`;

    try {
        const response = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(queryInput)}`);
        if (!response.ok) throw new Error('Artigo não encontrado');
        const data = await response.json();

        resultsContainer.innerHTML = `
            <div style="background: var(--bg-light); border-left: 5px solid var(--lime); padding: 20px; border-radius: 8px; color: var(--text-main);">
                <h3 style="margin-top: 0; margin-bottom: 10px;">${data.title}</h3>
                <p style="line-height: 1.6; color: var(--text-main); font-size: 14px;">${data.extract}</p>
                ${data.thumbnail ? `<img src="${data.thumbnail.source}" alt="${data.title}" style="max-width: 150px; border-radius: 6px; margin-top: 15px; display: block;">` : ''}
                <p style="margin-top: 15px; font-size: 13px;">
                    <a href="${data.content_urls.desktop.page}" target="_blank" style="color: var(--lime); font-weight: 600; text-decoration: underline;">Ler artigo completo na Wikipédia</a>
                </p>
            </div>
        `;
    } catch (error) {
        resultsContainer.innerHTML = `
            <div style="background: var(--bg-light); border-left: 5px solid var(--earth); padding: 20px; border-radius: 8px; color: #99581a;">
                <h3 style="margin-top: 0;">Nenhum resultado encontrado</h3>
                <p style="font-size: 14px;">Não encontrámos um artigo exato para "${queryInput}".</p>
            </div>
        `;
    }
};

window.checkSearchEnter = (e) => {
    if (e.key === 'Enter') window.searchSeedInfo();
};
