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
let currentLanguage = "pt";

const translations = {
    pt: {
        menu_home: "Início",
        menu_explore: "Explorar Sementes",
        menu_donate: "Cadastrar Semente",
        menu_chats: "Meus Chats",
        menu_community: "Chat Comunitário",
        menu_biome: "Bioma & Enciclopédia",
        menu_learn: "Aprender a Plantar",
        menu_about: "Sobre Nós (Alphadroid's)",
        menu_profile: "Meu Perfil",
        btn_logout: "Sair da Conta",
        nav_register: "Cadastrar",
        nav_logout: "Sair",
        brand_sub: "REDE DE BIODIVERSIDADE",
        login_subtitle: "Conectando cultivadores, partilhando vida e biodiversidade.",
        label_email: "E-mail",
        label_password: "Senha",
        btn_login_account: "Entrar na Conta",
        btn_create_account: "Criar Nova Conta",
        terms_link: "Termos de Condições e Política de Privacidade",
        cookie_text: "Utilizamos cookies para melhorar a sua experiência na rede e garantir a segurança do login. Ao continuar, concorda com a nossa política.",
        cookie_btn: "Aceitar e Fechar",
        hero_badge: "Bem-vindo à comunidade",
        hero_title_1: "Partilha de sementes e",
        hero_title_2: "preservação da vida",
        hero_title_3: "em cada cultivo.",
        hero_subtitle: "Troque espécies crioulas, doe mudas nativas e fortaleça a biodiversidade local junto com cultivadores da sua região.",
        hero_btn_explore: "Explorar Sementes Disponíveis",
        hero_btn_biome: "Identificar Meu Bioma",
        quick_access_title: "Acesso Rápido",
        quick_access_desc: "Selecione uma área para começar a interagir com a rede",
        card_seeds_title: "Sementes Disponíveis",
        card_seeds_desc: "Explore doações e trocas ativas na comunidade.",
        card_donate_title: "Cadastrar Semente",
        card_donate_desc: "Publique novas sementes com fotos da semente e da planta.",
        card_chats_title: "Meus Chats",
        card_chats_desc: "Negocie reservas e combine entregas diretamente.",
        card_map_title: "Mapa do Bioma e Viveiros",
        card_map_desc: "Identifique seu bioma no Google Maps e localize viveiros de mudas.",
        avail_header_title: "Sementes da Comunidade",
        avail_header_desc: "Escolha a quantidade exata restante e reserve com segurança.",
        donate_form_title: "Cadastrar Nova Semente",
        donate_lbl_1: "1. Fotografia da Semente",
        donate_cam_seed: "Selecionar Foto da Semente",
        donate_lbl_2: "2. Fotografia da Planta (Árvore/Fruto adulto)",
        donate_cam_plant: "Selecionar Foto da Planta",
        donate_lbl_name: "Nome da Semente",
        donate_lbl_qty: "Quantidade de Sementes Disponíveis (Obrigatório)",
        donate_lbl_date: "Data em que a Semente estará Disponível (Obrigatório)",
        donate_lbl_type: "Finalidade do Anúncio",
        opt_donation: "Doação (Gratuito)",
        opt_exchange: "Troca (Quero trocar por outra)",
        btn_publish: "Publicar Semente",
        upload_loading: "A processar e guardar semente... aguarde.",
        chats_header_title: "Meus Chats de Sementes",
        chats_header_desc: "Combine a entrega ou troca diretamente com os interessados.",
        chats_active_conversations: "Conversas Ativas",
        loading_conversations: "A carregar conversas...",
        chat_select_prompt: "Selecione uma conversa ao lado ou reserve uma semente para iniciar.",
        comm_chat_title: "Chat Comunitário",
        comm_chat_desc: "Conversas gerais da região",
        loading_messages: "A carregar mensagens...",
        enc_header_title: "Identificação de Bioma, Viveiros e Espécies Nativas",
        enc_header_desc: "Geolocalização para detecção de biomas, pinos de viveiros no mapa e catálogo completo de árvores, frutos e sementes via Wikipédia.",
        enc_tag_geo: "GEOLOCALIZAÇÃO E VIVEIROS",
        enc_box_title: "Identificar Meu Bioma e Viveiros",
        enc_box_desc: "Detete seu bioma e clique nos viveiros abaixo para destacá-los diretamente no mapa ao lado.",
        btn_gps: "Detectar por GPS",
        btn_profile_city: "Usar Cidade do Perfil",
        gmaps_link_label: "Ver Todos no Google Maps",
        species_section_title: "Árvores, Frutos e Sementes do Bioma",
        species_section_desc: "Carregamento simultâneo de fotos e artigos oficiais da Wikipédia.",
        loading_species: "A carregar espécies do bioma...",
        learn_header_title: "Guia de Cultivo Inteligente",
        learn_header_desc: "Pesquise qualquer planta ou semente na base botânica para ver detalhes.",
        btn_search: "Pesquisar",
        about_title: "Sobre Nós & Ficha Técnica FLL",
        about_subtitle: "Conheça a história, o coração e a tecnologia por trás do projeto da equipe Alphadroid's.",
        about_team_badge: "EQUIPE ALPHADROID'S",
        about_heading: "Quando a Tecnologia Floresce a Natureza 🌿🤖",
        about_p1: "Sabe aquela vontade de ver a nossa cidade mais verde, cheia de vida e com árvores que realmente pertencem à nossa região? Foi exatamente a partir desse sonho — e de muita conversa na temporada da FIRST LEGO League (FLL) — que nós, da equipe ALPHADROID'S, criamos o projeto Sementes Vivas.",
        about_p2: "Percebemos que muitas pessoas têm sementes crioulas incríveis guardadas ou mudas sobrando, mas não sabiam com quem partilhar. Unimos a engenharia de software ao amor pela biodiversidade para criar uma ponte real entre cultivadores e o reflorestamento ativo.",
        tech_title: "Ficha Técnica e Arquitetura do Sistema",
        tech_1_title: "Frontend & Design",
        tech_1_desc: "HTML5, CSS3 Customizado com Modo Escuro/Claro inteligente, JavaScript ES6+ Modular e Google Material Icons.",
        tech_2_title: "Banco de Dados & Auth",
        tech_2_desc: "Google Firebase Firestore (NoSQL) em tempo real e Firebase Authentication para proteção e gestão de contas.",
        tech_3_title: "IA & Visão Computacional",
        tech_3_desc: "Integração com Tesseract.js (OCR) para leitura automática de rótulos e identificação de nomes de sementes por foto.",
        tech_4_title: "APIs & Geoprocessamento",
        tech_4_desc: "API REST da Wikipédia (Catálogo botânico), OpenStreetMap / Nominatim (Reverse Geocoding) e Google Maps Embed.",
        pillar_1_title: "Rigor Científico",
        pillar_1_desc: "Pesquisas e validações botânicas realizadas em conjunto com biólogos ambientais.",
        pillar_2_title: "Inventário Dinâmico",
        pillar_2_desc: "Controle de estoque automatizado que garante partilha justa sem desperdícios.",
        pillar_3_title: "Comunidade Ativa",
        pillar_3_desc: "Chats privados automáticos que transformam reservas em mutirões de plantio.",
        team_members_title: "Membros da Equipe Alphadroid's",
        profile_tab_edit: "Editar Dados e Avatar",
        profile_tab_seeds: "Minhas Sementes",
        profile_edit_title: "Personalizar Perfil",
        profile_lbl_photo: "Alterar Foto de Perfil",
        profile_lbl_name: "Nome / Apelido no Chat",
        profile_lbl_community: "Sua Comunidade / Cidade Principal",
        profile_btn_save: "Guardar Alterações de Perfil",
        profile_my_seeds_title: "Minhas Sementes Cadastradas"
    },
    en: {
        menu_home: "Home",
        menu_explore: "Explore Seeds",
        menu_donate: "Donate Seed",
        menu_chats: "My Chats",
        menu_community: "Community Chat",
        menu_biome: "Biome & Encyclopedia",
        menu_learn: "Learn to Plant",
        menu_about: "About Us (Alphadroid's)",
        menu_profile: "My Profile",
        btn_logout: "Log Out",
        nav_register: "Register",
        nav_logout: "Logout",
        brand_sub: "BIODIVERSITY NETWORK",
        login_subtitle: "Connecting growers, sharing life and biodiversity.",
        label_email: "E-mail",
        label_password: "Password",
        btn_login_account: "Sign In",
        btn_create_account: "Create New Account",
        terms_link: "Terms & Privacy Policy",
        cookie_text: "We use cookies to improve your network experience and ensure login security. By continuing, you agree to our policy.",
        cookie_btn: "Accept and Close",
        hero_badge: "Welcome to the community",
        hero_title_1: "Seed sharing and",
        hero_title_2: "life preservation",
        hero_title_3: "in every crop.",
        hero_subtitle: "Exchange heirloom varieties, donate native seedlings, and strengthen local biodiversity with growers in your region.",
        hero_btn_explore: "Explore Available Seeds",
        hero_btn_biome: "Identify My Biome",
        quick_access_title: "Quick Access",
        quick_access_desc: "Select an area to start interacting with the network",
        card_seeds_title: "Available Seeds",
        card_seeds_desc: "Explore active donations and exchanges in the community.",
        card_donate_title: "Donate Seed",
        card_donate_desc: "Publish new seeds with photos of both seed and plant.",
        card_chats_title: "My Chats",
        card_chats_desc: "Negotiate reservations and arrange deliveries directly.",
        card_map_title: "Biome & Nurseries Map",
        card_map_desc: "Identify your biome on Google Maps and locate seedling nurseries.",
        avail_header_title: "Community Seeds",
        avail_header_desc: "Choose the exact remaining quantity and reserve securely.",
        donate_form_title: "Register New Seed",
        donate_lbl_1: "1. Seed Photograph",
        donate_cam_seed: "Select Seed Photo",
        donate_lbl_2: "2. Plant Photograph (Adult tree/fruit)",
        donate_cam_plant: "Select Plant Photo",
        donate_lbl_name: "Seed Name",
        donate_lbl_qty: "Available Seed Quantity (Required)",
        donate_lbl_date: "Availability Date (Required)",
        donate_lbl_type: "Listing Purpose",
        opt_donation: "Donation (Free)",
        opt_exchange: "Exchange (Want to swap for another)",
        btn_publish: "Publish Seed",
        upload_loading: "Processing and saving seed... please wait.",
        chats_header_title: "My Seed Chats",
        chats_header_desc: "Arrange delivery or exchange directly with interested growers.",
        chats_active_conversations: "Active Conversations",
        loading_conversations: "Loading conversations...",
        chat_select_prompt: "Select a conversation on the side or reserve a seed to start.",
        comm_chat_title: "Community Chat",
        comm_chat_desc: "General regional discussions",
        loading_messages: "Loading messages...",
        enc_header_title: "Biome, Nurseries, and Native Species Identification",
        enc_header_desc: "Geolocation for biome detection, nursery pins on the map, and complete catalog of trees, fruits, and seeds via Wikipedia.",
        enc_tag_geo: "GEOLOCATION & NURSERIES",
        enc_box_title: "Identify My Biome and Nurseries",
        enc_box_desc: "Detect your biome and click the nurseries below to highlight them directly on the map.",
        btn_gps: "Detect via GPS",
        btn_profile_city: "Use Profile City",
        gmaps_link_label: "View All on Google Maps",
        species_section_title: "Biome Trees, Fruits, and Seeds",
        species_section_desc: "Simultaneous loading of Wikipedia official photos and articles.",
        loading_species: "Loading biome species...",
        learn_header_title: "Smart Cultivation Guide",
        learn_header_desc: "Search any plant or seed in the botanical database for details.",
        btn_search: "Search",
        about_title: "About Us & FLL Technical Sheet",
        about_subtitle: "Discover the story, heart, and technology behind the Alphadroid's team project.",
        about_team_badge: "ALPHADROID'S TEAM",
        about_heading: "When Technology Makes Nature Blossom 🌿🤖",
        about_p1: "You know that desire to see our city greener, full of life, and with trees that truly belong to our region? It was born from that dream — and countless conversations during the FIRST LEGO League (FLL) season — that we, the ALPHADROID'S team, created the Sementes Vivas project.",
        about_p2: "We noticed that many people have incredible heirloom seeds stored away or extra seedlings, but didn't know who to share them with. We combined software engineering with a love for biodiversity to build a real bridge between growers and active reforestation.",
        tech_title: "Technical Sheet & System Architecture",
        tech_1_title: "Frontend & Design",
        tech_1_desc: "HTML5, Custom CSS3 with smart Dark/Light Mode, Modular JavaScript ES6+, and Google Material Icons.",
        tech_2_title: "Database & Auth",
        tech_2_desc: "Real-time Google Firebase Firestore (NoSQL) and Firebase Authentication for account protection and management.",
        tech_3_title: "AI & Computer Vision",
        tech_3_desc: "Integration with Tesseract.js (OCR) for automatic label reading and seed name identification from photos.",
        tech_4_title: "APIs & Geoprocessing",
        tech_4_desc: "Wikipedia REST API (Botanical catalog), OpenStreetMap / Nominatim (Reverse Geocoding), and Google Maps Embed.",
        pillar_1_title: "Scientific Rigor",
        pillar_1_desc: "Research and botanical validations conducted alongside environmental biologists.",
        pillar_2_title: "Dynamic Inventory",
        pillar_2_desc: "Automated stock control ensuring fair sharing without waste.",
        pillar_3_title: "Active Community",
        pillar_3_desc: "Automatic private chats that turn seed reservations into planting drives.",
        team_members_title: "Alphadroid's Team Members",
        profile_tab_edit: "Edit Data & Avatar",
        profile_tab_seeds: "My Seeds",
        profile_edit_title: "Customize Profile",
        profile_lbl_photo: "Change Profile Photo",
        profile_lbl_name: "Chat Name / Nickname",
        profile_lbl_community: "Your Community / Main City",
        profile_btn_save: "Save Profile Changes",
        profile_my_seeds_title: "My Registered Seeds"
    },
    es: {
        menu_home: "Inicio",
        menu_explore: "Explorar Semillas",
        menu_donate: "Registrar Semilla",
        menu_chats: "Mis Chats",
        menu_community: "Chat Comunitario",
        menu_biome: "Bioma y Enciclopedia",
        menu_learn: "Aprender a Plantar",
        menu_about: "Sobre Nosotros (Alphadroid's)",
        menu_profile: "Mi Perfil",
        btn_logout: "Cerrar Sesión",
        nav_register: "Registrar",
        nav_logout: "Salir",
        brand_sub: "RED DE BIODIVERSIDAD",
        login_subtitle: "Conectando cultivadores, compartiendo vida y biodiversidad.",
        label_email: "Correo electrónico",
        label_password: "Contraseña",
        btn_login_account: "Iniciar Sesión",
        btn_create_account: "Crear Nueva Cuenta",
        terms_link: "Términos y Política de Privacidad",
        cookie_text: "Utilizamos cookies para mejorar su experiencia en la red y garantizar la seguridad del inicio de sesión. Al continuar, acepta nuestra política.",
        cookie_btn: "Aceptar y Cerrar",
        hero_badge: "Bienvenido a la comunidad",
        hero_title_1: "Intercambio de semillas y",
        hero_title_2: "preservación de la vida",
        hero_title_3: "en cada cultivo.",
        hero_subtitle: "Intercambia variedades criollas, dona plántulas nativas y fortalece la biodiversidad local junto con cultivadores de tu región.",
        hero_btn_explore: "Explorar Semillas Disponibles",
        hero_btn_biome: "Identificar Mi Bioma",
        quick_access_title: "Acceso Rápido",
        quick_access_desc: "Selecciona un área para comenzar a interactuar con la red",
        card_seeds_title: "Semillas Disponibles",
        card_seeds_desc: "Explora donaciones e intercambios activos en la comunidad.",
        card_donate_title: "Registrar Semilla",
        card_donate_desc: "Publica nuevas semillas con fotos de la semilla y la planta.",
        card_chats_title: "Mis Chats",
        card_chats_desc: "Negocia reservas y coordina entregas directamente.",
        card_map_title: "Mapa del Bioma y Viveros",
        card_map_desc: "Identifica tu bioma en Google Maps y localiza viveros de plántulas.",
        avail_header_title: "Semillas de la Comunidad",
        avail_header_desc: "Elige la cantidad exacta restante y reserva de forma segura.",
        donate_form_title: "Registrar Nueva Semilla",
        donate_lbl_1: "1. Fotografía de la Semilla",
        donate_cam_seed: "Seleccionar Foto de la Semilla",
        donate_lbl_2: "2. Fotografía de la Planta (Árbol/Fruto adulto)",
        donate_cam_plant: "Seleccionar Foto de la Planta",
        donate_lbl_name: "Nombre de la Semilla",
        donate_lbl_qty: "Cantidad de Semillas Disponibles (Obligatorio)",
        donate_lbl_date: "Fecha en que la Semilla estará Disponible (Obligatorio)",
        donate_lbl_type: "Finalidad del Anuncio",
        opt_donation: "Donación (Gratuito)",
        opt_exchange: "Intercambio (Quiero cambiar por otra)",
        btn_publish: "Publicar Semilla",
        upload_loading: "Procesando y guardando semilla... espere.",
        chats_header_title: "Mis Chats de Semillas",
        chats_header_desc: "Coordina la entrega o intercambio directamente con los interesados.",
        chats_active_conversations: "Conversaciones Activas",
        loading_conversations: "Cargando conversaciones...",
        chat_select_prompt: "Selecciona una conversación al lado o reserva una semilla para comenzar.",
        comm_chat_title: "Chat Comunitario",
        comm_chat_desc: "Conversaciones generales de la región",
        loading_messages: "Cargando mensajes...",
        enc_header_title: "Identificación de Bioma, Viveros y Especies Nativas",
        enc_header_desc: "Geolocalización para detección de biomas, pines de viveros en el mapa y catálogo completo de árboles, frutos y semillas vía Wikipedia.",
        enc_tag_geo: "GEOLOCALIZACIÓN Y VIVEROS",
        enc_box_title: "Identificar Mi Bioma y Viveros",
        enc_box_desc: "Detecta tu bioma y haz clic en los viveros abajo para destacarlos directamente en el mapa.",
        btn_gps: "Detectar por GPS",
        btn_profile_city: "Usar Ciudad del Perfil",
        gmaps_link_label: "Ver Todos en Google Maps",
        species_section_title: "Árboles, Frutos y Semillas del Bioma",
        species_section_desc: "Carga simultánea de fotos y artículos oficiales de Wikipedia.",
        loading_species: "Cargando especies del bioma...",
        learn_header_title: "Guía de Cultivo Inteligente",
        learn_header_desc: "Busca cualquier planta o semilla en la base botánica para ver detalles.",
        btn_search: "Buscar",
        about_title: "Sobre Nosotros & Ficha Técnica FLL",
        about_subtitle: "Conoce la historia, el corazón y la tecnología detrás del proyecto del equipo Alphadroid's.",
        about_team_badge: "EQUIPO ALPHADROID'S",
        about_heading: "Cuando la Tecnología Hace Florecer la Naturaleza 🌿🤖",
        about_p1: "¿Sabes ese deseo de ver nuestra ciudad más verde, llena de vida y con árboles que realmente pertenecen a nuestra región? Nació exactamente de ese sueño — y de muchas conversaciones en la temporada de la FIRST LEGO League (FLL) — que nosotros, el equipo ALPHADROID'S, creamos el proyecto Sementes Vivas.",
        about_p2: "Notamos que muchas personas tienen increíbles semillas criollas guardadas o plántulas sobrantes, pero no sabían con quién compartirlas. Unimos la ingeniería de software al amor por la biodiversidad para crear un puente real entre cultivadores y la reforestación activa.",
        tech_title: "Ficha Técnica y Arquitectura del Sistema",
        tech_1_title: "Frontend & Diseño",
        tech_1_desc: "HTML5, CSS3 Personalizado con Modo Oscuro/Claro inteligente, JavaScript ES6+ Modular y Google Material Icons.",
        tech_2_title: "Base de Datos & Auth",
        tech_2_desc: "Google Firebase Firestore (NoSQL) en tempo real y Firebase Authentication para protección y gestión de cuentas.",
        tech_3_title: "IA & Visión Computacional",
        tech_3_desc: "Integración con Tesseract.js (OCR) para lectura automática de etiquetas e identificación de nombres de semillas por foto.",
        tech_4_title: "APIs & Geoprocesamiento",
        tech_4_desc: "API REST de Wikipedia (Catálogo botánico), OpenStreetMap / Nominatim (Geocodificación inversa) y Google Maps Embed.",
        pillar_1_title: "Rigor Científico",
        pillar_1_desc: "Investigaciones y validaciones botánicas realizadas junto con biólogos ambientales.",
        pillar_2_title: "Inventario Dinámico",
        pillar_2_desc: "Control de stock automatizado que garantiza un intercambio justo sin desperdicios.",
        pillar_3_title: "Comunidad Activa",
        pillar_3_desc: "Chats privados automáticos que transforman las reservas de semillas en jornadas de siembra.",
        team_members_title: "Miembros del Equipo Alphadroid's",
        profile_tab_edit: "Editar Datos y Avatar",
        profile_tab_seeds: "Mis Semillas",
        profile_edit_title: "Personalizar Perfil",
        profile_lbl_photo: "Cambiar Foto de Perfil",
        profile_lbl_name: "Nombre / Apodo en el Chat",
        profile_lbl_community: "Tu Comunidad / Ciudad Principal",
        profile_btn_save: "Guardar Cambios de Perfil",
        profile_my_seeds_title: "Mis Semillas Registradas"
    }
};

window.changeLanguage = (lang) => {
    currentLanguage = lang;
    const dict = translations[lang] || translations.pt;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.innerText = dict[key];
    });
};

window.toggleTheme = () => {
    const htmlEl = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    const currentTheme = htmlEl.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        htmlEl.setAttribute('data-theme', 'light');
        if (themeIcon) themeIcon.innerText = 'dark_mode';
    } else {
        htmlEl.setAttribute('data-theme', 'dark');
        if (themeIcon) themeIcon.innerText = 'light_mode';
    }
};

window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('cookies_accepted')) {
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.style.display = 'block';
    }
});

window.toggleSlidingSidebar = () => {
    const sidebar = document.getElementById('sliding-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
    }
};

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

    document.querySelectorAll('.sidebar-link').forEach(btn => btn.classList.remove('active'));
    const mapTab = {
        'dashboard-view': 'menu-dashboard-view',
        'available-view': 'menu-available-view',
        'private-chats-view': 'menu-private-chats-view',
        'chat-view': 'menu-chat-view',
        'encyclopedia-view': 'menu-encyclopedia-view',
        'learn-view': 'menu-learn-view',
        'about-view': 'menu-about-view',
        'profile-view': 'menu-profile-view'
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
    document.getElementById('donate-seed-quantity').value = '';
    document.getElementById('donate-seed-date').value = '';
    document.getElementById('donate-seed-photo-seed').value = '';
    document.getElementById('donate-seed-photo-plant').value = '';
    document.getElementById('donate-seed-type').value = 'Doação';
    document.getElementById('camera-label-seed').innerHTML = '<span class="material-icons">photo_library</span> Selecionar Foto da Semente';
    document.getElementById('camera-label-plant').innerHTML = '<span class="material-icons">photo_library</span> Selecionar Foto da Planta';
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
    titleEl.innerText = `${biomeName} - Espécies`;
    grid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1;">A carregar espécies...</p>';

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
            const extract = data.extract ? data.extract.substring(0, 155) + '...' : '';
            const imageUrl = data.thumbnail ? data.thumbnail.source : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80';
            const wikiUrl = data.content_urls && data.content_urls.desktop ? data.content_urls.desktop.page : '#';

            htmlContent += `
                <div class="encyclopedia-card">
                    <img src="${imageUrl}" alt="${title}" loading="lazy">
                    <span class="enc-tag">${biomeName}</span>
                    <h3>${title}</h3>
                    <p>${extract}</p>
                    <a href="${wikiUrl}" target="_blank" style="font-size: 12px; color: var(--lime); font-weight: 700; margin-top: 10px; text-decoration: underline; display: inline-block;">Wikipedia</a>
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

    titleEl.innerText = `${city} (${info.state}) — ${info.biome}`;
    descEl.innerText = info.desc;
    
    let viveirosHtml = `<div style="font-size: 12px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Viveiros:</div>`;
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

window.detectCityByGPS = () => {
    if (!navigator.geolocation) return alert("GPS não suportado.");
    alert("Obtendo localização GPS...");
    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
            const data = await res.json();
            const cityName = data.address?.city || data.address?.town || data.address?.village || "";
            const select = document.getElementById('profile-community');
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].value.toLowerCase() === cityName.toLowerCase()) {
                    select.selectedIndex = i;
                    break;
                }
            }
            alert(`Cidade detectada: ${cityName}`);
        } catch (e) {
            alert("Erro ao identificar cidade.");
        }
    }, () => alert("Permissão negada."));
};

window.detectBiomeWithMaps = () => window.identifyBiomeByCity();

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
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');
    if (!email || !pass) {
        errorMsg.innerText = "Preencha e-mail e senha.";
        errorMsg.style.display = 'block';
        return;
    }
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        errorMsg.innerText = "Erro ao entrar. Verifique os dados.";
        errorMsg.style.display = 'block';
    }
};

window.checkLoginEnter = (e) => { if (e.key === 'Enter') window.login(); };

window.register = async () => {
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');
    if (!email || !pass) {
        errorMsg.innerText = "Preencha e-mail e senha.";
        errorMsg.style.display = 'block';
        return;
    }
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
        errorMsg.innerText = "Erro ao criar conta.";
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
        }
        if (loginView) { loginView.classList.remove('active'); loginView.style.display = 'none'; }
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
                if (width > height) { if (width > max_size) { height *= max_size / width; width = max_size; } }
                else { if (height > max_size) { width *= max_size / height; height = max_size; } }
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
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
        const data = snap.data();
        document.getElementById('profile-name').value = data.displayName || '';
        document.getElementById('profile-community').value = data.community || 'Aparecida do Taboado';
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
    await setDoc(doc(db, "users", user.uid), { displayName: name, community, avatarBase64, email: user.email }, { merge: true });
    userProfileCache = { displayName: name, community, avatarBase64, email: user.email };
    currentCommunity = community;
    alert("Perfil guardado!");
};

window.processDonation = async () => {
    const name = document.getElementById('donate-seed-name').value.trim();
    const quantity = Number(document.getElementById('donate-seed-quantity').value);
    const availableDate = document.getElementById('donate-seed-date').value;
    const type = document.getElementById('donate-seed-type').value;
    const photoSeed = document.getElementById('donate-seed-photo-seed');
    const photoPlant = document.getElementById('donate-seed-photo-plant');
    const user = auth.currentUser;

    if (!name || photoSeed.files.length === 0 || photoPlant.files.length === 0 || !quantity || !availableDate) {
        return alert('Preencha todos os campos e selecione ambas as fotos.');
    }

    try {
        const fotoSemente = await comprimirEConverterBase64(photoSeed.files[0], 600, 0.7);
        const fotoPlanta = await comprimirEConverterBase64(photoPlant.files[0], 600, 0.7);

        await addDoc(collection(db, "seeds"), {
            name, quantity, type, availableDate,
            fotoBase64: fotoSemente,
            fotoPlantaBase64: fotoPlanta,
            author: userProfileCache?.displayName || user.email.split('@')[0],
            authorEmail: user.email,
            userId: user.uid,
            community: userProfileCache?.community || "Aparecida do Taboado",
            status: 'disponível',
            timestamp: serverTimestamp()
        });
        alert('Semente cadastrada com sucesso!');
        window.showAvailable();
    } catch (e) {
        alert('Erro ao cadastrar.');
    }
};

window.renderSeeds = async () => {
    const container = document.getElementById('seeds-grid-container');
    container.innerHTML = '<p>A carregar...</p>';
    const snapshot = await getDocs(collection(db, "seeds"));
    container.innerHTML = '';
    if (snapshot.empty) return container.innerHTML = '<p>Nenhuma semente.</p>';

    snapshot.forEach((docSnap) => {
        const seed = docSnap.data();
        const seedId = docSnap.id;
        const user = auth.currentUser;
        const box = document.createElement('div');
        box.className = 'seed-box';
        box.innerHTML = `
            <div>
                <h4>${seed.name}</h4>
                <p>Qtd: ${seed.quantity}</p>
                <p>Doador: ${seed.author}</p>
            </div>
            ${user && seed.userId !== user.uid ? `<button class="btn-reserve" onclick="window.reservarSemente('${seedId}', '${seed.userId}', '${seed.author}', '${seed.name}')">Reservar</button>` : ''}
        `;
        container.appendChild(box);
    });
};

window.reservarSemente = async (seedId, ownerId, ownerName, seedName) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
        const ref = doc(db, "seeds", seedId);
        await updateDoc(ref, { quantity: 0, status: 'esgotada' });
        const chatRef = await addDoc(collection(db, "private_chats"), {
            seedId, seedName, ownerId, ownerName,
            requesterId: user.uid,
            requesterName: userProfileCache?.displayName || user.email.split('@')[0],
            participants: [ownerId, user.uid],
            createdAt: serverTimestamp()
        });
        window.showPrivateChats(chatRef.id);
    } catch (e) {
        alert('Erro ao reservar.');
    }
};

window.initPrivateChatListListener = (chatIdToOpen = null) => {
    const list = document.getElementById('private-chat-list');
    const user = auth.currentUser;
    if (!user) return;
    if (privateListUnsubscribe) privateListUnsubscribe();
    privateListUnsubscribe = onSnapshot(collection(db, "private_chats"), (snap) => {
        list.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            if (data.participants?.includes(user.uid)) {
                const item = document.createElement('div');
                item.className = 'tg-thread-item';
                item.onclick = () => window.openPrivateChatRoom(d.id, data.seedName, data.ownerId === user.uid ? data.requesterName : data.ownerName);
                item.innerHTML = `<strong>${data.seedName}</strong>`;
                list.appendChild(item);
            }
        });
    });
};

window.openPrivateChatRoom = (chatId, seedName, otherName) => {
    activePrivateChatId = chatId;
    document.getElementById('private-chat-header').style.display = 'flex';
    document.getElementById('private-chat-title').innerText = seedName;
    document.getElementById('private-chat-subtitle').innerText = otherName;
    document.getElementById('private-chat-input-box').style.display = 'flex';
};

window.sendPrivateMessage = async () => {
    const input = document.getElementById('private-chat-input');
    const text = input.value.trim();
    if (!text || !activePrivateChatId) return;
    const user = auth.currentUser;
    await addDoc(collection(db, "private_chats", activePrivateChatId, "messages"), {
        text, senderId: user.uid, senderName: userProfileCache?.displayName || user.email.split('@')[0], timestamp: serverTimestamp()
    });
    input.value = '';
};

window.checkPrivateChatEnter = (e) => { if (e.key === 'Enter') window.sendPrivateMessage(); };

window.changeChatCommunity = () => { currentCommunity = document.getElementById('chat-community-select').value; window.initChatListener(); };

window.initChatListener = () => {
    const container = document.getElementById('chat-messages');
    if (chatUnsubscribe) chatUnsubscribe();
    chatUnsubscribe = onSnapshot(collection(db, "chat"), (snap) => {
        container.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            if (data.community === currentCommunity) {
                const div = document.createElement('div');
                div.className = 'tg-msg-bubble';
                div.innerHTML = `<strong>${data.author}:</strong> ${data.text}`;
                container.appendChild(div);
            }
        });
    });
};

window.enviarMensagemChat = async () => {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    const user = auth.currentUser;
    await addDoc(collection(db, "chat"), {
        text, author: userProfileCache?.displayName || user.email.split('@')[0], userId: user.uid, community: currentCommunity, timestamp: serverTimestamp()
    });
    input.value = '';
};

window.checkChatEnter = (e) => { if (e.key === 'Enter') window.enviarMensagemChat(); };

window.renderMyProfile = async () => {
    const container = document.getElementById('my-seeds-container');
    container.innerHTML = '<p>Carregando...</p>';
    const user = auth.currentUser;
    const snapshot = await getDocs(collection(db, "seeds"));
    container.innerHTML = '';
    snapshot.forEach(d => {
        const seed = d.data();
        if (seed.userId === user.uid) {
            const box = document.createElement('div');
            box.className = 'seed-box';
            box.innerHTML = `<h4>${seed.name}</h4><button class="btn-danger" onclick="window.excluirSemente('${d.id}')">Excluir</button>`;
            container.appendChild(box);
        }
    });
};

window.excluirSemente = async (id) => {
    if (confirm("Excluir semente?")) {
        await deleteDoc(doc(db, "seeds", id));
        window.renderMyProfile();
    }
};

window.searchSeedInfo = async () => {
    const query = document.getElementById('search-seed-input').value.trim();
    const results = document.getElementById('learn-results');
    if (!query) return;
    try {
        const res = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
        const data = await res.json();
        results.innerHTML = `<div><h3>${data.title}</h3><p>${data.extract}</p></div>`;
    } catch (e) {
        results.innerHTML = '<p>Não encontrado.</p>';
    }
};

window.checkSearchEnter = (e) => { if (e.key === 'Enter') window.searchSeedInfo(); };
