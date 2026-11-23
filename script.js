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

// DICIONÁRIO DE IDIOMAS (PORTUGUÊS, INGLÊS E ESPANHOL) SEM TOCAR NAS IMAGENS
const translations = {
    pt: {
        brandTitle: "Sementes Vivas",
        brandSub: "REDE DE BIODIVERSIDADE",
        navHome: "Início",
        navExplore: "Explorar",
        navChats: "Meus Chats",
        navCommunity: "Comunidade",
        navEncyclopedia: "Bioma & Enciclopédia",
        navLearn: "Aprender",
        navAbout: "Sobre Nós",
        navProfile: "Perfil",
        btnRegister: "Cadastrar",
        btnLogout: "Sair",
        loginSub: "Conectando cultivadores, partilhando vida e biodiversidade.",
        labelEmail: "E-mail",
        labelPass: "Senha",
        btnLogin: "Entrar na Conta",
        btnRegisterAccount: "Criar Nova Conta",
        termsLink: "Termos de Condições e Política de Privacidade",
        cookieText: "Utilizamos cookies para melhorar a sua experiência na rede e garantir a segurança do login. Ao continuar, concorda com a nossa política.",
        cookieBtn: "Aceitar e Fechar",
        termsTitle: "Termos de Condições e Política de Privacidade",
        termsP1: "1. Aceitação dos Termos: Ao aceder e registar-se na plataforma Sementes Vivas, concorda com estes termos e com as diretrizes de partilha comunitária e preservação ambiental.",
        termsP2: "2. Privacidade e Dados (LGPD): Os seus dados de e-mail, nome e localização aproximada são utilizados estritamente para facilitar a troca de sementes e o contacto direto entre cultivadores da região.",
        termsP3: "3. Utilização de Cookies: Guardamos preferências locais para assegurar o funcionamento fluído da aplicação web.",
        termsP4: "4. Conduta na Comunidade: O chat comunitário e os chats privados devem ser utilizados exclusivamente para fins de troca, doação e aprendizagem.",
        termsClose: "Entendido",
        heroBadge: "Bem-vindo à comunidade",
        heroTitlePart1: "Partilha de sementes e",
        heroTitlePart2: "preservação da vida",
        heroTitlePart3: "em cada cultivo.",
        heroSubtitle: "Troque espécies crioulas, doe mudas nativas e fortaleça a biodiversidade local junto com cultivadores da sua região.",
        heroBtnExplore: "Explorar Sementes Disponíveis",
        heroBtnBiome: "Identificar Meu Bioma",
        quickAccessTitle: "Acesso Rápido",
        quickAccessSub: "Selecione uma área para começar a interagir com a rede",
        cardSeedsTitle: "Sementes Disponíveis",
        cardSeedsDesc: "Explore doações e trocas ativas na comunidade.",
        cardDonateTitle: "Cadastrar Semente",
        cardDonateDesc: "Publique novas sementes com leitura automática.",
        cardChatsTitle: "Meus Chats",
        cardChatsDesc: "Negocie reservas e combine entregas diretamente.",
        cardBiomeTitle: "Mapa do Bioma e Viveiros",
        cardBiomeDesc: "Identifique seu bioma no Google Maps e localize viveiros de mudas.",
        seedsHeaderTitle: "Sementes da Comunidade",
        seedsHeaderSub: "Reserve uma semente para abrir uma conversa direta com o doador.",
        donateCardTitle: "Cadastrar Nova Semente",
        donatePhotoLabel: "Fotografar Semente (A leitura automática preencherá o nome)",
        donateCameraBtn: "Clique para fotografar ou carregar imagem",
        donateNameLabel: "Nome da Semente",
        donateTypeLabel: "Finalidade do Anúncio",
        optDonation: "Doação (Gratuito)",
        optTrade: "Troca (Quero trocar por outra)",
        btnPublish: "Publicar Semente",
        uploadingText: "A processar e guardar semente... aguarde.",
        myChatsHeaderTitle: "Meus Chats de Sementes",
        myChatsHeaderSub: "Combine a entrega ou troca diretamente com os interessados.",
        activeThreadsTitle: "Conversas Ativas",
        loadingChats: "A carregar conversas...",
        emptyChatText: "Selecione uma conversa ao lado ou reserve uma semente para iniciar.",
        chatPlaceholder: "Escreva a sua mensagem...",
        communityChatTitle: "Chat Comunitário",
        communityChatSub: "Conversas gerais da região",
        loadingMessages: "A carregar mensagens...",
        encyclopediaHeaderTitle: "Identificação de Bioma, Viveiros e Espécies Nativas",
        encyclopediaHeaderSub: "Geolocalização para detecção de biomas, pinos de viveiros no mapa e catálogo completo de árvores, frutos e sementes via Wikipédia.",
        geoTag: "GEOLOCALIZAÇÃO E VIVEIROS",
        geoCardTitle: "Identificar Meu Bioma e Viveiros",
        geoCardDesc: "Detete seu bioma e clique nos viveiros abaixo para destacá-los diretamente no mapa ao lado.",
        btnGps: "Detectar por GPS",
        btnCity: "Usar Cidade do Perfil",
        btnGmaps: "Ver Todos no Google Maps",
        speciesSectionTitle: "Árvores, Frutos e Sementes do Bioma",
        speciesSectionSub: "Carregamento simultâneo de fotos e artigos oficiais da Wikipédia.",
        loadingSpecies: "A carregar espécies do bioma...",
        learnHeaderTitle: "Guia de Cultivo Inteligente",
        learnHeaderSub: "Pesquise qualquer planta ou semente na base botânica para ver detalhes.",
        searchPlaceholder: "Ex: Girassol, Alface, Tomate...",
        btnSearch: "Pesquisar",
        aboutHeaderTitle: "Sobre Nós",
        aboutHeaderSub: "Conheça a história, a equipe e a ciência por trás do projeto Sementes Vivas.",
        teamBadge: "EQUIPE ALPHADROID'S",
        aboutTitle: "Tecnologia e Natureza em Harmonia",
        aboutP1: "O projeto Sementes Vivas nasceu da união de ideias, criatividade e propósito da equipe ALPHADROID'S. Nosso grande objetivo sempre foi utilizar a tecnologia como uma ponte para aproximar as pessoas da natureza, incentivando a troca de sementes crioulas, o cultivo sustentável e o fortalecimento da biodiversidade local.",
        aboutP2: "Para transformar esse sonho em uma ferramenta verdadeiramente útil e confiável, unimos o pensamento inovador do nosso time a um rigoroso processo de pesquisas realizadas em conjunto com biólogos e especialistas ambientais. Cada funcionalidade — desde a identificação inteligente dos biomas até o mapeamento de viveiros e a enciclopédia de espécies nativas — foi pensada para respeitar os ciclos ecológicos de cada região.",
        pillar1Title: "Base Científica",
        pillar1Desc: "Desenvolvido com apoio e pesquisa junto a biólogos.",
        pillar2Title: "Pensamento Criativo",
        pillar2Desc: "Soluções digitais pensadas pelo time ALPHADROID'S.",
        pillar3Title: "Impacto Verde",
        pillar3Desc: "Fomento à partilha comunitária e reflorestamento.",
        teamPhotoTitle: "Nossa Equipe",
        teamPhotoFallback: "Certifique-se de que o ficheiro flltc oi.jpg está na mesma pasta do site.",
        subTabEdit: "Editar Dados e Avatar",
        subTabSeeds: "Minhas Sementes",
        profileEditTitle: "Personalizar Perfil",
        labelAvatar: "Alterar Foto de Perfil",
        labelNickname: "Nome / Apelido no Chat",
        labelCommunity: "Sua Comunidade / Cidade Principal",
        btnSaveProfile: "Guardar Alterações de Perfil",
        mySeedsTitle: "Minhas Sementes Cadastradas"
    },
    en: {
        brandTitle: "Living Seeds",
        brandSub: "BIODIVERSITY NETWORK",
        navHome: "Home",
        navExplore: "Explore",
        navChats: "My Chats",
        navCommunity: "Community",
        navEncyclopedia: "Biome & Encyclopedia",
        navLearn: "Learn",
        navAbout: "About Us",
        navProfile: "Profile",
        btnRegister: "Register",
        btnLogout: "Logout",
        loginSub: "Connecting growers, sharing life and biodiversity.",
        labelEmail: "Email",
        labelPass: "Password",
        btnLogin: "Sign In",
        btnRegisterAccount: "Create New Account",
        termsLink: "Terms of Conditions & Privacy Policy",
        cookieText: "We use cookies to improve your experience on the network and ensure login security. By continuing, you agree to our policy.",
        cookieBtn: "Accept & Close",
        termsTitle: "Terms of Conditions & Privacy Policy",
        termsP1: "1. Acceptance of Terms: By accessing and registering on the Living Seeds platform, you agree to these terms and community guidelines.",
        termsP2: "2. Privacy and Data: Your data is used strictly to facilitate seed exchange and direct contact among regional growers.",
        termsP3: "3. Cookie Usage: We store local preferences to ensure smooth web operation.",
        termsP4: "4. Community Conduct: Community and private chats must be used exclusively for exchange, donation, and learning.",
        termsClose: "Understood",
        heroBadge: "Welcome to the community",
        heroTitlePart1: "Seed sharing and",
        heroTitlePart2: "life preservation",
        heroTitlePart3: "in every crop.",
        heroSubtitle: "Trade heirloom species, donate native seedlings, and strengthen local biodiversity with growers in your region.",
        heroBtnExplore: "Explore Available Seeds",
        heroBtnBiome: "Identify My Biome",
        quickAccessTitle: "Quick Access",
        quickAccessSub: "Select an area to start interacting with the network",
        cardSeedsTitle: "Available Seeds",
        cardSeedsDesc: "Explore active donations and trades in the community.",
        cardDonateTitle: "Register Seed",
        cardDonateDesc: "Publish new seeds with automatic recognition.",
        cardChatsTitle: "My Chats",
        cardChatsDesc: "Negotiate reservations and coordinate deliveries directly.",
        cardBiomeTitle: "Biome Map & Nurseries",
        cardBiomeDesc: "Identify your biome on Google Maps and locate seedling nurseries.",
        seedsHeaderTitle: "Community Seeds",
        seedsHeaderSub: "Reserve a seed to open a direct chat with the donor.",
        donateCardTitle: "Register New Seed",
        donatePhotoLabel: "Photograph Seed (Automatic reading will fill the name)",
        donateCameraBtn: "Click to photograph or upload image",
        donateNameLabel: "Seed Name",
        donateTypeLabel: "Listing Purpose",
        optDonation: "Donation (Free)",
        optTrade: "Trade (Want to trade for another)",
        btnPublish: "Publish Seed",
        uploadingText: "Processing and saving seed... please wait.",
        myChatsHeaderTitle: "My Seed Chats",
        myChatsHeaderSub: "Coordinate delivery or trade directly with interested parties.",
        activeThreadsTitle: "Active Conversations",
        loadingChats: "Loading conversations...",
        emptyChatText: "Select a conversation on the left or reserve a seed to start.",
        chatPlaceholder: "Type your message...",
        communityChatTitle: "Community Chat",
        communityChatSub: "General region conversations",
        loadingMessages: "Loading messages...",
        encyclopediaHeaderTitle: "Biome, Nurseries & Native Species Identification",
        encyclopediaHeaderSub: "Geolocation for biome detection, map nursery pins, and complete catalog via Wikipedia.",
        geoTag: "GEOLOCATION & NURSERIES",
        geoCardTitle: "Identify My Biome & Nurseries",
        geoCardDesc: "Detect your biome and click the nurseries below to highlight them on the map.",
        btnGps: "Detect via GPS",
        btnCity: "Use Profile City",
        btnGmaps: "View All on Google Maps",
        speciesSectionTitle: "Trees, Fruits & Seeds of the Biome",
        speciesSectionSub: "Simultaneous loading of official Wikipedia photos and articles.",
        loadingSpecies: "Loading biome species...",
        learnHeaderTitle: "Smart Cultivation Guide",
        learnHeaderSub: "Search any plant or seed in the botanical database for details.",
        searchPlaceholder: "Ex: Sunflower, Lettuce, Tomato...",
        btnSearch: "Search",
        aboutHeaderTitle: "About Us",
        aboutHeaderSub: "Meet the history, team, and science behind the Living Seeds project.",
        teamBadge: "ALPHADROID'S TEAM",
        aboutTitle: "Technology and Nature in Harmony",
        aboutP1: "The Living Seeds project was born from the union of ideas, creativity, and purpose of the ALPHADROID'S team. Our main goal has always been to use technology as a bridge to bring people closer to nature, encouraging heirloom seed exchange and local biodiversity.",
        aboutP2: "To turn this dream into a useful tool, we combined our team's innovative thinking with rigorous research conducted alongside biologists and environmental specialists. Every feature was designed to respect ecological cycles.",
        pillar1Title: "Scientific Foundation",
        pillar1Desc: "Developed with support and research alongside biologists.",
        pillar2Title: "Creative Thinking",
        pillar2Desc: "Digital solutions designed by the ALPHADROID'S team.",
        pillar3Title: "Green Impact",
        pillar3Desc: "Fostering community sharing and reforestation.",
        teamPhotoTitle: "Our Team",
        teamPhotoFallback: "Make sure the file flltc oi.jpg is in the same folder as the site.",
        subTabEdit: "Edit Data & Avatar",
        subTabSeeds: "My Seeds",
        profileEditTitle: "Customize Profile",
        labelAvatar: "Change Profile Picture",
        labelNickname: "Name / Chat Nickname",
        labelCommunity: "Your Community / Main City",
        btnSaveProfile: "Save Profile Changes",
        mySeedsTitle: "My Registered Seeds"
    },
    es: {
        brandTitle: "Semillas Vivas",
        brandSub: "RED DE BIODIVERSIDAD",
        navHome: "Inicio",
        navExplore: "Explorar",
        navChats: "Mis Chats",
        navCommunity: "Comunidad",
        navEncyclopedia: "Bioma y Enciclopedia",
        navLearn: "Aprender",
        navAbout: "Sobre Nosotros",
        navProfile: "Perfil",
        btnRegister: "Registrar",
        btnLogout: "Salir",
        loginSub: "Conectando cultivadores, compartiendo vida y biodiversidad.",
        labelEmail: "Correo electrónico",
        labelPass: "Contraseña",
        btnLogin: "Iniciar Sesión",
        btnRegisterAccount: "Crear Nueva Cuenta",
        termsLink: "Términos de Condiciones y Política de Privacidad",
        cookieText: "Utilizamos cookies para mejorar su experiencia en la red y garantizar la seguridad del inicio de sesión.",
        cookieBtn: "Aceptar y Cerrar",
        termsTitle: "Términos de Condiciones y Política de Privacidad",
        termsP1: "1. Aceptación de los Términos: Al acceder y registrarse en Semillas Vivas, acepta estos términos.",
        termsP2: "2. Privacidad y Datos: Sus datos se utilizan estrictamente para facilitar el intercambio de semillas.",
        termsP3: "3. Uso de Cookies: Guardamos preferencias locales para asegurar el funcionamiento web.",
        termsP4: "4. Conducta Comunitaria: Los chats deben usarse exclusivamente para intercambio, donación y aprendizaje.",
        termsClose: "Entendido",
        heroBadge: "Bienvenido a la comunidad",
        heroTitlePart1: "Intercambio de semillas y",
        heroTitlePart2: "preservación de la vida",
        heroTitlePart3: "en cada cultivo.",
        heroSubtitle: "Intercambie especies criollas, done plántulas nativas y fortalezca la biodiversidad local.",
        heroBtnExplore: "Explorar Semillas Disponibles",
        heroBtnBiome: "Identificar Mi Bioma",
        quickAccessTitle: "Acceso Rápido",
        quickAccessSub: "Seleccione un área para comenzar a interactuar con la red",
        cardSeedsTitle: "Semillas Disponibles",
        cardSeedsDesc: "Explore donaciones e intercambios activos en la comunidad.",
        cardDonateTitle: "Registrar Semilla",
        cardDonateDesc: "Publique nuevas semillas con lectura automática.",
        cardChatsTitle: "Mis Chats",
        cardChatsDesc: "Negocie reservas y coordine entregas directamente.",
        cardBiomeTitle: "Mapa de Bioma y Viveros",
        cardBiomeDesc: "Identifique su bioma en Google Maps y localice viveros.",
        seedsHeaderTitle: "Semillas de la Comunidad",
        seedsHeaderSub: "Reserve una semilla para abrir un chat directo con el donante.",
        donateCardTitle: "Registrar Nueva Semilla",
        donatePhotoLabel: "Fotografiar Semilla (La lectura automática completará el nombre)",
        donateCameraBtn: "Haga clic para fotografiar o cargar imagen",
        donateNameLabel: "Nombre de la Semilla",
        donateTypeLabel: "Propósito del Anuncio",
        optDonation: "Donación (Gratis)",
        optTrade: "Intercambio (Quiero cambiar por otra)",
        btnPublish: "Publicar Semilla",
        uploadingText: "Procesando y guardando semilla... espere.",
        myChatsHeaderTitle: "Mis Chats de Semillas",
        myChatsHeaderSub: "Coordine la entrega o intercambio directamente con los interesados.",
        activeThreadsTitle: "Conversaciones Activas",
        loadingChats: "Cargando conversaciones...",
        emptyChatText: "Seleccione una conversación a la izquierda o reserve una semilla.",
        chatPlaceholder: "Escriba su mensaje...",
        communityChatTitle: "Chat Comunitario",
        communityChatSub: "Conversaciones generales de la región",
        loadingMessages: "Cargando mensajes...",
        encyclopediaHeaderTitle: "Identificación de Bioma, Viveros y Especies Nativas",
        encyclopediaHeaderSub: "Geolocalización para detección de biomas y catálogo vía Wikipedia.",
        geoTag: "GEOLOCALIZACIÓN Y VIVEROS",
        geoCardTitle: "Identificar Mi Bioma y Viveros",
        geoCardDesc: "Detecte su bioma y haga clic en los viveros para destacarlos en el mapa.",
        btnGps: "Detectar por GPS",
        btnCity: "Usar Ciudad del Perfil",
        btnGmaps: "Ver Todos en Google Maps",
        speciesSectionTitle: "Árboles, Frutos y Semillas del Bioma",
        speciesSectionSub: "Carga simultánea de fotos y artículos oficiales de Wikipedia.",
        loadingSpecies: "Cargando especies del bioma...",
        learnHeaderTitle: "Guía de Cultivo Inteligente",
        learnHeaderSub: "Busque cualquier planta o semilla en la base de datos botánica.",
        searchPlaceholder: "Ej: Girasol, Lechuga, Tomate...",
        btnSearch: "Buscar",
        aboutHeaderTitle: "Sobre Nosotros",
        aboutHeaderSub: "Conozca la historia, el equipo y la ciencia detrás del proyecto Semillas Vivas.",
        teamBadge: "EQUIPO ALPHADROID'S",
        aboutTitle: "Tecnología y Naturaleza en Armonía",
        aboutP1: "El proyecto Semillas Vivas nació de la unión de ideas, creatividad y propósito del equipo ALPHADROID'S. Nuestro gran objetivo siempre ha sido usar la tecnología como un puente para acercar a las personas a la naturaleza.",
        aboutP2: "Para transformar este sueño en una herramienta útil, unimos el pensamiento innovador de nuestro equipo a rigurosas investigaciones realizadas junto a biólogos y especialistas ambientales.",
        pillar1Title: "Base Científica",
        pillar1Desc: "Desarrollado con apoyo e investigación junto a biólogos.",
        pillar2Title: "Pensamiento Creativo",
        pillar2Desc: "Soluciones digitales diseñadas por el equipo ALPHADROID'S.",
        pillar3Title: "Impacto Verde",
        pillar3Desc: "Fomento de la compartición comunitaria y reforestación.",
        teamPhotoTitle: "Nuestro Equipo",
        teamPhotoFallback: "Asegúrese de que el archivo flltc oi.jpg esté en la misma carpeta.",
        subTabEdit: "Editar Datos y Avatar",
        subTabSeeds: "Mis Semillas",
        profileEditTitle: "Personalizar Perfil",
        labelAvatar: "Cambiar Foto de Perfil",
        labelNickname: "Nombre / Apodo en el Chat",
        labelCommunity: "Su Comunidad / Ciudad Principal",
        btnSaveProfile: "Guardar Cambios de Perfil",
        mySeedsTitle: "Mis Semillas Registradas"
    }
};

window.changeLanguage = (lang) => {
    localStorage.setItem('site_lang', lang);
    const t = translations[lang] || translations.pt;
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.innerHTML = t[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.placeholder = t[key];
    });
};

// CONTROLO DE COOKIES E TERMOS
window.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('site_lang') || 'pt';
    const langSelect = document.getElementById('language-selector');
    if (langSelect) langSelect.value = savedLang;
    window.changeLanguage(savedLang);

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

// CATÁLOGO EXPANDIDO DE ESPÉCIES POR BIOMA
const biomeSpeciesCatalog = {
    "Cerrado": [
        "Handroanthus albus", "Dipteryx alata", "Hymenaea courbaril", "Caryocar brasiliense",
        "Campomanesia adamantium", "Schinus terebinthifolia", "Mauritia flexuosa", "Handroanthus impetiginosus",
        "Inga edulis", "Annona crassiflora", "Eugenia dysenterica", "Hancornia speciosa",
        "Anadenanthera colubrina", "Tabebuia aurea", "Genipa americana", "Acrocomia aculeata"
    ],
    "Pantanal": [
        "Handroanthus heptaphyllus", "Copernicia alba", "Attalea phalerata", "Ficus insipida",
        "Mauritia flexuosa", "Tabebuia aurea", "Hymenaea courbaril", "Genipa americana",
        "Inga vera", "Vitex cymosa", "Erythrina dominguezii", "Triplaris americana"
    ],
    "Mata Atlântica": [
        "Paubrasilia echinata", "Cariniana legalis", "Eugenia uniflora", "Eugenia brasiliensis",
        "Aspidosperma polyneuron", "Cedrela fissilis", "Ilex paraguariensis", "Psidium cattleyanum",
        "Euterpe edulis", "Araucaria angustifolia", "Plinia cauliflora", "Schinus terebinthifolia",
        "Handroanthus chrysotrichus", "Syagrus romanzoffiana", "Jacaranda micrantha", "Lecythidaceae"
    ]
};

// BASE DE DADOS DE BIOMAS, VIVEIROS E ESPÉCIES
const cityBiomeDatabase = {
    "Aparecida do Taboado": {
        state: "MS",
        biome: "Cerrado (Transição Mata Atlântica)",
        desc: "Região de solos arenosos com viveiros municipais e particulares ativos para reflorestamento e cultivo regional.",
        portalUrl: "https://www.imasul.ms.gov.br/",
        portalName: "Portal Ambiental do MS (IMASUL)",
        mapQuery: "Aparecida+do+Taboado,MS",
        viveiros: ["Viveiro Municipal Verdejar", "Viveiro Sementes do Paraná", "Viveiro Nativo Taboado"],
        species: [...new Set([...biomeSpeciesCatalog["Cerrado"], "Cariniana legalis", "Eugenia uniflora"])]
    },
    "Paranaíba": {
        state: "MS",
        biome: "Cerrado",
        desc: "Predominância de Cerrado típico e matas ciliares do rio Paranaíba.",
        portalUrl: "https://www.imasul.ms.gov.br/",
        portalName: "Portal Ambiental do MS (IMASUL)",
        mapQuery: "Paranaiba,MS",
        viveiros: ["Viveiro Floresta Paranaíba", "Viveiro EcoMudas"],
        species: biomeSpeciesCatalog["Cerrado"]
    },
    "Três Lagoas": {
        state: "MS",
        biome: "Cerrado",
        desc: "Bacia do rio Paraná com grande diversidade florestal.",
        portalUrl: "https://www.imasul.ms.gov.br/",
        portalName: "Portal Ambiental do MS (IMASUL)",
        mapQuery: "Tres+Lagoas,MS",
        viveiros: ["Viveiro Municipal Três Lagoas", "Mudas Rio Paraná"],
        species: biomeSpeciesCatalog["Cerrado"]
    },
    "Campo Grande": {
        state: "MS",
        biome: "Cerrado",
        desc: "Capital do Cerrado com horto florestal e viveiros de referência.",
        portalUrl: "https://www.imasul.ms.gov.br/",
        portalName: "Portal Ambiental do MS (IMASUL)",
        mapQuery: "Campo+Grande,MS",
        viveiros: ["Horto Florestal Municipal", "Viveiro Campo Verde", "Viveiro Pantanal MS"],
        species: biomeSpeciesCatalog["Cerrado"]
    },
    "Dourados": {
        state: "MS",
        biome: "Mata Atlântica e Cerrado",
        desc: "Zona de transição ecológica com solos férteis e viveiros de árvores nobres.",
        portalUrl: "https://www.imasul.ms.gov.br/",
        portalName: "Portal Ambiental do MS (IMASUL)",
        mapQuery: "Dourados,MS",
        viveiros: ["Viveiro Floresta Dourados", "Mudas Nativas Sul-Mato-Grossenses"],
        species: [...new Set([...biomeSpeciesCatalog["Mata Atlântica"], ...biomeSpeciesCatalog["Cerrado"].slice(0, 8)])]
    },
    "Corumbá": {
        state: "MS",
        biome: "Pantanal",
        desc: "Planície alagável com espécies adaptadas ao ciclo das águas.",
        portalUrl: "https://www.imasul.ms.gov.br/",
        portalName: "Portal Ambiental do MS (IMASUL)",
        mapQuery: "Corumba,MS",
        viveiros: ["Viveiro Pantanal Sustentável", "Mudas Águas do Pantanal"],
        species: biomeSpeciesCatalog["Pantanal"]
    },
    "Bonito": {
        state: "MS",
        biome: "Cerrado e Mata Atlântica (Serra da Bodoquena)",
        desc: "Florestas estacionais preservadas e viveiros de preservação hídrica.",
        portalUrl: "https://www.imasul.ms.gov.br/",
        portalName: "Portal Ambiental do MS (IMASUL)",
        mapQuery: "Bonito,MS",
        viveiros: ["Viveiro Bodoquena Verde", "Mudas Águas Cristalinas"],
        species: [...new Set([...biomeSpeciesCatalog["Cerrado"].slice(0, 10), ...biomeSpeciesCatalog["Mata Atlântica"].slice(0, 8)])]
    },
    "Santa Fé do Sul": {
        state: "SP",
        biome: "Mata Atlântica (Floresta Estacional Semidecidual)",
        desc: "Noroeste paulista na divisa com MS com viveiros municipais de mudas frutíferas e nativas.",
        portalUrl: "https://semil.sp.gov.br/",
        portalName: "Secretaria de Meio Ambiente de SP (SEMIL)",
        mapQuery: "Santa+Fe+do+Sul,SP",
        viveiros: ["Viveiro Municipal Santa Fé", "Mudas Paulista Verde"],
        species: biomeSpeciesCatalog["Mata Atlântica"]
    },
    "Jales": {
        state: "SP",
        biome: "Mata Atlântica e Cerrado",
        desc: "Remanescentes de mata nativa e viveiros de reflorestamento.",
        portalUrl: "https://semil.sp.gov.br/",
        portalName: "Secretaria de Meio Ambiente de SP (SEMIL)",
        mapQuery: "Jales,SP",
        viveiros: ["Viveiro Jales Sustentável", "Mudas Noroeste SP"],
        species: [...new Set([...biomeSpeciesCatalog["Mata Atlântica"].slice(0, 10), ...biomeSpeciesCatalog["Cerrado"].slice(0, 6)])]
    },
    "Fernandópolis": {
        state: "SP",
        biome: "Mata Atlântica e Cerrado",
        desc: "Ecótono entre Cerrado e Floresta Estacional com viveiros especializados.",
        portalUrl: "https://semil.sp.gov.br/",
        portalName: "Secretaria de Meio Ambiente de SP (SEMIL)",
        mapQuery: "Fernandopolis,SP",
        viveiros: ["Viveiro Municipal Fernandópolis", "EcoMudas Fernandópolis"],
        species: [...new Set([...biomeSpeciesCatalog["Mata Atlântica"].slice(0, 10), ...biomeSpeciesCatalog["Cerrado"].slice(0, 6)])]
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
window.showChat = () => { 
    window.switchView('chat-view'); 
    window.initChatListener(); 
};
window.showPrivateChats = (chatIdToOpen = null) => {
    window.switchView('private-chats-view');
    window.initPrivateChatListListener(chatIdToOpen);
};

// CARREGAMENTO SIMULTÂNEO DE TODAS AS ESPÉCIES DO BIOMA VIA WIKIPÉDIA
window.loadWikipediaSpeciesCards = async (speciesList, biomeName) => {
    const grid = document.getElementById('encyclopedia-grid');
    const titleEl = document.getElementById('species-section-title');
    titleEl.innerText = `Todas as Árvores, Frutos e Sementes do Bioma: ${biomeName} (${speciesList.length} espécies)`;
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

window.focusViveiroOnMap = (viveiroName, cityQuery) => {
    const iframe = document.getElementById('google-maps-iframe');
    const query = encodeURIComponent(`${viveiroName} ${cityQuery}`);
    iframe.src = `https://maps.google.com/maps?q=${query}&t=m&z=15&ie=UTF8&iwloc=B&output=embed`;
};

window.identifyBiomeByCity = () => {
    const city = userProfileCache?.community || currentCommunity || "Aparecida do Taboado";
    const info = cityBiomeDatabase[city] || cityBiomeDatabase["Aparecida do Taboado"];

    const resultBox = document.getElementById('biome-result-box');
    const titleEl = document.getElementById('biome-detected-title');
    const descEl = document.getElementById('biome-detected-desc');
    const viveirosContainer = document.getElementById('viveiros-list-container');
    const gmapsLink = document.getElementById('gmaps-external-link');
    const portalLink = document.getElementById('state-portal-link');
    const portalLabel = document.getElementById('state-portal-label');
    const iframe = document.getElementById('google-maps-iframe');

    titleEl.innerText = `${city} (${info.state}) — Bioma: ${info.biome}`;
    descEl.innerText = info.desc;
    
    let viveirosHtml = `<div style="font-size: 12px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Viveiros destacados na região (clique para localizar no mapa):</div>`;
    info.viveiros.forEach(v => {
        viveirosHtml += `<button class="viveiro-pin-btn" onclick="window.focusViveiroOnMap('${v}', '${city}, ${info.state}')"><span class="material-icons" style="font-size: 14px; color: #c53030;">location_on</span> ${v}</button>`;
    });
    viveirosContainer.innerHTML = viveirosHtml;

    gmapsLink.href = `https://www.google.com/maps/search/?api=1&query=viveiro+de+mudas+${info.mapQuery}`;
    portalLink.href = info.portalUrl;
    portalLabel.innerText = info.portalName;
    iframe.src = `https://maps.google.com/maps?q=viveiro+de+mudas+${info.mapQuery}&t=m&z=13&ie=UTF8&iwloc=B&output=embed`;

    resultBox.style.display = 'block';

    window.loadWikipediaSpeciesCards(info.species, info.biome);
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
            iframe.src = `https://maps.google.com/maps?q=viveiro+de+mudas+${lat},${lng}&t=m&z=13&ie=UTF8&iwloc=B&output=embed`;
            gmapsLink.href = `https://www.google.com/maps/search/?api=1&query=viveiro+de+mudas+${lat},${lng}`;

            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await res.json();
                const address = data.address || {};
                const stateName = address.state || "";
                const cityName = address.city || address.town || address.village || "Localização Atual";

                let biomeName = "Cerrado Brasileiro";
                let portalUrl = "https://www.gov.br/mma/pt-br";
                let portalLabel = "Ministério do Meio Ambiente";
                let viveirosList = ["Viveiro Municipal Regional", "Horto Florestal de Mudas"];
                let speciesList = biomeSpeciesCatalog["Cerrado"];

                if (stateName.includes("Mato Grosso do Sul")) {
                    if (lng < -56.0) {
                        biomeName = "Pantanal Sul-Mato-Grossense";
                        speciesList = biomeSpeciesCatalog["Pantanal"];
                    } else {
                        biomeName = "Cerrado (Transição Mata Atlântica)";
                        speciesList = [...new Set([...biomeSpeciesCatalog["Cerrado"], "Cariniana legalis", "Eugenia uniflora"])];
                    }
                    portalUrl = "https://www.imasul.ms.gov.br/";
                    portalLabel = "Portal Ambiental do MS (IMASUL)";
                    viveirosList = ["Viveiro Verdejar MS", "Mudas Nativas Pantanal/Cerrado"];
                } else if (stateName.includes("São Paulo")) {
                    biomeName = "Mata Atlântica / Cerrado Paulista";
                    portalUrl = "https://semil.sp.gov.br/";
                    portalLabel = "Secretaria de Meio Ambiente de SP (SEMIL)";
                    viveirosList = ["Viveiro Ecológico Paulista", "Horto de Mudas SP"];
                    speciesList = biomeSpeciesCatalog["Mata Atlântica"];
                }

                titleEl.innerText = `${cityName} (${stateName || 'Brasil'}) — Bioma: ${biomeName}`;
                document.getElementById('biome-detected-desc').innerText = `Coordenadas GPS (${lat.toFixed(4)}, ${lng.toFixed(4)}).`;
                
                let viveirosHtml = `<div style="font-size: 12px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Viveiros próximos (clique para destacar):</div>`;
                viveirosList.forEach(v => {
                    viveirosHtml += `<button class="viveiro-pin-btn" onclick="window.focusViveiroOnMap('${v}', '${cityName}')"><span class="material-icons" style="font-size: 14px; color: #c53030;">location_on</span> ${v}</button>`;
                });
                document.getElementById('viveiros-list-container').innerHTML = viveirosHtml;

                document.getElementById('state-portal-link').href = portalUrl;
                document.getElementById('state-portal-label').innerText = portalLabel;

                window.loadWikipediaSpeciesCards(speciesList, biomeName);
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
