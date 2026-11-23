import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
let chatUnsubscribe = null;
let privateChatUnsubscribe = null;
let privateListUnsubscribe = null;

window.changeLanguage = (lang) => {
    localStorage.setItem('site_lang', lang);
};

window.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('site_lang') || 'pt';
    const langSelect = document.getElementById('language-selector');
    if (langSelect) langSelect.value = savedLang;

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

// CATÁLOGO COMPLETO DOS 6 BIOMAS DO BRASIL
const biomeDataCatalog = {
    "Cerrado": {
        desc: "O segundo maior bioma do Brasil, conhecido como a savana brasileira. Apresenta rica biodiversidade com árvores de troncos tortuosos e raízes profundas.",
        species: [
            "Handroanthus albus", "Dipteryx alata", "Hymenaea courbaril", "Caryocar brasiliense",
            "Campomanesia adamantium", "Schinus terebinthifolia", "Mauritia flexuosa", "Handroanthus impetiginosus",
            "Inga edulis", "Annona crassiflora", "Eugenia dysenterica", "Hancornia speciosa"
        ]
    },
    "Pantanal": {
        desc: "A maior planície alagável contínua do planeta, com rica fauna e flora adaptada aos ciclos intensos de cheias e secas.",
        species: [
            "Handroanthus heptaphyllus", "Copernicia alba", "Attalea phalerata", "Ficus insipida",
            "Mauritia flexuosa", "Tabebuia aurea", "Genipa americana", "Vitex cymosa"
        ]
    },
    "Mata Atlântica": {
        desc: "Bioma de florestas tropicais com altíssima biodiversidade e endemismo, estendendo-se originalmente por grande parte da costa brasileira.",
        species: [
            "Paubrasilia echinata", "Cariniana legalis", "Eugenia uniflora", "Eugenia brasiliensis",
            "Aspidosperma polyneuron", "Cedrela fissilis", "Ilex paraguariensis", "Euterpe edulis"
        ]
    },
    "Amazônia": {
        desc: "A maior floresta tropical do mundo e a maior bacia hidrográfica da Terra, com imensa riqueza em biodiversidade e árvores gigantescas.",
        species: [
            "Bertholletia excelsa", "Hevea brasiliensis", "Swietenia macrophylla", "Ceiba pentandra",
            "Mauritia flexuosa", "Theobroma cacao", "Euterpe oleracea", "Carapa guianensis"
        ]
    },
    "Caatinga": {
        desc: "Bioma exclusivamente brasileiro caracterizado pelo clima semiárido, vegetação xerófila adaptada à seca e rica fauna endêmica.",
        species: [
            "Spondias tuberosa", "Schinopsis brasiliensis", "Mimosa tenuiflora", "Cereus jamacaru",
            "Pilosocereus gounellei", "Ziziphus joazeiro", "Amburana cearensis", "Combretum leprosum"
        ]
    },
    "Pampa": {
        desc: "Caracterizado por vastas planícies de campos nativos e vegetação rasteira, localizado na região sul do país.",
        species: [
            "Erythrina crista-galli", "Butia yatay", "Schinus molle", "Acca sellowiana",
            "Sebastiania commersoniana", "Blepharocalyx salicifolius"
        ]
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
        'about-view': 'tab-about-view',
        'profile-view': 'tab-profile-view'
    };
    if (mapTab[viewId]) {
        const btn = document.getElementById(mapTab[viewId]);
        if (btn) btn.classList.add('active');
    }
};

window.showDashboard = () => window.switchView('dashboard-view');
window.showLearn = () => window.switchView('learn-view');
window.showAbout = () => window.switchView('about-view');
window.showEncyclopedia = () => {
    window.switchView('encyclopedia-view');
    const select = document.getElementById('manual-biome-select');
    window.changeSelectedBiome(select ? select.value : 'Cerrado');
};
window.showDonate = () => {
    document.getElementById('donate-seed-name').value = '';
    document.getElementById('donate-seed-qty').value = '10';
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
window.showChat = () => { 
    window.switchView('chat-view'); 
    window.initChatListener(); 
};
window.showPrivateChats = (chatIdToOpen = null) => {
    window.switchView('private-chats-view');
    window.initPrivateChatListListener(chatIdToOpen);
};

window.loadWikipediaSpeciesCards = async (speciesList, biomeName) => {
    const grid = document.getElementById('encyclopedia-grid');
    const titleEl = document.getElementById('species-section-title');
    titleEl.innerText = `Espécies do Bioma: ${biomeName} (${speciesList.length} espécies)`;
    grid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1;">A carregar todas as espécies e fotos oficiais da Wikipédia ao mesmo tempo...</p>';

    const fetchPromises = speciesList.map(async (species) => {
        try {
            const res = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(species)}`);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    });

    const results = await Promise.all(fetchPromises);
    let htmlContent = '';

    results.forEach((data) => {
        if (data && data.title) {
            const title = data.title;
            const extract = data.extract ? data.extract.substring(0, 155) + '...' : 'Espécie nativa catalogada na região.';
            const imageUrl = data.thumbnail ? data.thumbnail.source : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80';
            const wikiUrl = data.content_urls && data.content_urls.desktop ? data.content_urls.desktop.page : '#';

            htmlContent += `
                <div class="encyclopedia-card">
                    <img src="${imageUrl}" alt="${title}" loading="lazy">
                    <span class="enc-tag">${biomeName}</span>
                    <h3>${title}</h3>
                    <p>${extract}</p>
                    <a href="${wikiUrl}" target="_blank" style="font-size: 12px; color: var(--lime); font-weight: 700; margin-top: 10px; text-decoration: underline; display: inline-block;">Ver artigo completo na Wikipédia</a>
                </div>
            `;
        }
    });

    grid.innerHTML = htmlContent || '<p style="color: var(--text-muted);">Nenhuma espécie encontrada.</p>';
};

window.changeSelectedBiome = (biomeName) => {
    const biome = biomeDataCatalog[biomeName] || biomeDataCatalog["Cerrado"];
    document.getElementById('biome-manual-desc').innerText = biome.desc;
    window.loadWikipediaSpeciesCards(biome.species, biomeName);
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
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        let mensagemErro = `Erro (${error.code}): Verifique os dados.`;
        if (error.code === 'auth/user-not-found') mensagemErro = "Utilizador não encontrado. Clique em 'Criar Nova Conta' primeiro.";
        else if (error.code === 'auth/wrong-password') mensagemErro = "Senha incorreta.";
        else if (error.code === 'auth/invalid-email') mensagemErro = "Formato de e-mail inválido.";
        else if (error.code === 'auth/invalid-credential') mensagemErro = "E-mail ou senha incorretos (ou conta ainda não criada).";
        
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
        await setDoc(doc(db, "users", cred.user.uid), {
            displayName: email.split('@')[0],
            community: "Aparecida do Taboado",
            avatarBase64: "",
            email: email
        });
        alert("Conta criada com sucesso!");
    } catch (error) {
        let mensagemErro = `Erro ao criar conta (${error.code}).`;
        if (error.code === 'auth/weak-password') mensagemErro = "A senha deve ter pelo menos 6 caracteres.";
        else if (error.code === 'auth/email-already-in-use') mensagemErro = "Este e-mail já está registado. Clique em 'Entrar na Conta'.";
        
        errorMsg.innerText = mensagemErro;
        errorMsg.style.display = 'block';
    }
};

window.logout = async () => { 
    if(chatUnsubscribe) chatUnsubscribe();
    if(privateChatUnsubscribe) privateChatUnsubscribe();
    if(privateListUnsubscribe) privateListUnsubscribe();
    await signOut(auth); 
};

onAuthStateChanged(auth, async (user) => {
    const header = document.getElementById('main-header');
    const greeting = document.getElementById('user-greeting');
    const loginView = document.getElementById('login-view');
    
    if (user) {
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

window.processDonation = async () => {
    const name = document.getElementById('donate-seed-name').value.trim();
    const qty = parseInt(document.getElementById('donate-seed-qty').value) || 1;
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
            totalQuantity: qty,
            availableQuantity: qty,
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
            
            const availableQty = seed.availableQuantity !== undefined ? seed.availableQuantity : (seed.totalQuantity || 10);
            const badgeClass = seed.type === 'Troca' ? 'badge-troca' : 'badge-doacao';
            const badgeText = seed.type || 'Doação';

            let actionHtml = '';
            if (availableQty <= 0) {
                actionHtml = `<p style="color: #c53030; font-size: 13px; font-weight: 600; text-align: center; margin-top: 10px;">Esgotado</p>`;
            } else if (user && seed.userId !== user.uid) {
                actionHtml = `
                    <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 6px;">
                        <span style="font-size: 12px; font-weight: 600; color: var(--text-muted); text-align: center;">Disponível: ${availableQty} un.</span>
                        <button class="btn-reserve" onclick="window.reservarSementeComQuantidade('${seedId}', '${seed.userId}', '${seed.author}', '${seed.name}', ${availableQty})">Reservar Quantidade</button>
                    </div>
                `;
            } else if (user && seed.userId === user.uid) {
                actionHtml = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; margin-top: 10px;">Esta semente é sua (${availableQty} un. disp.).</p>`;
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

window.reservarSementeComQuantidade = async (seedId, ownerId, ownerName, seedName, maxQty) => {
    const user = auth.currentUser;
    if (!user) return;

    const inputQtd = prompt(`Quantas unidades de "${seedName}" deseja reservar? (Disponível: ${maxQty})`, "1");
    if (inputQtd === null) return;

    const qtdReservada = parseInt(inputQtd);
    if (isNaN(qtdReservada) || qtdReservada <= 0 || qtdReservada > maxQty) {
        return alert("Quantidade inválida.");
    }

    const myName = userProfileCache?.displayName || user.email.split('@')[0];

    try {
        const newAvailable = maxQty - qtdReservada;
        const newStatus = newAvailable === 0 ? 'esgotado' : 'disponível';

        await updateDoc(doc(db, "seeds", seedId), {
            availableQuantity: newAvailable,
            status: newStatus
        });
        
        const chatRoomRef = await addDoc(collection(db, "private_chats"), {
            seedId: seedId,
            seedName: `${seedName} (${qtdReservada} un.)`,
            ownerId: ownerId,
            ownerName: ownerName,
            requesterId: user.uid,
            requesterName: myName,
            participants: [ownerId, user.uid],
            createdAt: serverTimestamp()
        });

        await addDoc(collection(db, "private_chats", chatRoomRef.id, "messages"), {
            text: `Olá ${ownerName}! Reservei ${qtdReservada} unidades da semente "${seedName}". Como combinamos a entrega?`,
            senderId: user.uid,
            senderName: myName,
            avatar: userProfileCache?.avatarBase64 || "",
            timestamp: serverTimestamp()
        });

        alert(`Reserva de ${qtdReservada} unidades efetuada com sucesso!`);
        window.showPrivateChats(chatRoomRef.id);
    } catch(e) {
        alert("Erro ao efetuar a reserva.");
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

window.initPrivateChatListListener = (chatIdToOpen = null) => {
    const listContainer = document.getElementById('private-chat-list');
    const user = auth.currentUser;
    if (!user) return;

    if (privateListUnsubscribe) privateListUnsubscribe();

    listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; padding: 10px;">A sincronizar conversas...</p>';

    privateListUnsubscribe = onSnapshot(collection(db, "private_chats"), (querySnapshot) => {
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
                chatIdToOpen = null;
            }
        }
    }, (error) => {
        listContainer.innerHTML = '<p style="color: red; font-size: 13px; padding: 10px;">Erro ao sincronizar conversas.</p>';
    });
};

window.openPrivateChatRoom = (chatId, seedName, otherPersonName) => {
    activePrivateChatId = chatId;
    
    document.querySelectorAll('.tg-thread-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.getElementById(`thread-item-${chatId}`);
    if (activeEl) activeEl.classList.add('active');

    document.getElementById('private-chat-header').style.display = 'flex';
    document.getElementById('private-chat-title').innerText = `Semente: ${seedName}`;
    document.getElementById('private-chat-subtitle').innerText = `A conversar com: ${otherPersonName}`;
    document.getElementById('private-chat-input-box').style.display = 'flex';

    const messagesContainer = document.getElementById('private-chat-messages');
    messagesContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center;">A sincronizar mensagens...</p>';

    if (privateChatUnsubscribe) privateChatUnsubscribe();

    privateChatUnsubscribe = onSnapshot(collection(db, "private_chats", chatId, "messages"), (msgsSnap) => {
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
    }, (error) => {
        messagesContainer.innerHTML = '<p style="color: red; text-align: center;">Erro ao sincronizar mensagens.</p>';
    });
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
    } catch (error) {
        alert('Erro ao enviar mensagem.');
    }
};

window.checkPrivateChatEnter = (e) => {
    if (e.key === 'Enter') window.sendPrivateMessage();
};

window.changeChatCommunity = () => {
    currentCommunity = document.getElementById('chat-community-select').value;
    window.initChatListener();
};

window.initChatListener = () => {
    const container = document.getElementById('chat-messages');
    const select = document.getElementById('chat-community-select');
    if (select) select.value = currentCommunity;

    if (chatUnsubscribe) chatUnsubscribe();

    container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">A sincronizar mensagens em tempo real...</p>';

    chatUnsubscribe = onSnapshot(collection(db, "chat"), (querySnapshot) => {
        container.innerHTML = '';
        
        let messages = [];
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.community === currentCommunity) messages.push(data);
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
                const availableQty = seed.availableQuantity !== undefined ? seed.availableQuantity : (seed.totalQuantity || 10);
                
                let statusText = `<span style="color: var(--lime); font-weight: 600;">Disponível: ${availableQty} / ${seed.totalQuantity || 10} un.</span>`;

                box.innerHTML = `
                    <div>
                        ${seed.fotoBase64 ? `<img src="${seed.fotoBase64}" alt="${seed.name}">` : '<div style="height:180px;background:var(--bg-light);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#888;">Sem imagem</div>'}
                        <span class="badge-tipo ${badgeClass}">${badgeText}</span>
                        <h4 style="color: var(--text-main); font-size: 16px; margin-bottom: 4px;">${seed.name}</h4>
                        <p style="font-size: 13px; margin-bottom: 4px;"><strong>Estoque:</strong> ${statusText}</p>
                    </div>
                    <div>
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
