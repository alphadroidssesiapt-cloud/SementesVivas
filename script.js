let currentUser = "";

// Inicializa algumas sementes de exemplo caso o localstorage esteja vazio
const defaultSeeds = [
    { name: "Semente de Pequi", biome: "Cerrado", qtd: "20 unidades", desc: "Ótimas sementes colhidas este mês.", author: "João Silva" },
    { name: "Muda de Pau-Brasil", biome: "Mata Atlântica", qtd: "5 mudas", desc: "Mudas prontas para plantio em áreas sombreadas.", author: "Comunidade SOS" }
];

document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("seeds")) {
        localStorage.setItem("seeds", JSON.stringify(defaultSeeds));
    }
    loadFeed("Todos");
});

function login() {
    const user = document.getElementById("username").value;
    if (user.trim() !== "") {
        currentUser = user;
        document.getElementById("user-greeting").innerText = `Olá, ${currentUser.split(" ")[0]}!`;
        showScreen("dashboard-screen");
    } else {
        alert("Por favor, insira um nome de usuário.");
    }
}

function showScreen(screenId) {
    // Esconde todas as telas
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });
    // Mostra a tela desejada
    document.getElementById(screenId).classList.add("active");
    
    if(screenId === 'feed-screen') {
        loadFeed("Todos");
    }
}

function publishSeed() {
    const name = document.getElementById("seed-name").value;
    const biome = document.getElementById("seed-biome").value;
    const qtd = document.getElementById("seed-qtd").value;
    const desc = document.getElementById("seed-desc").value;

    if (!name || !desc) {
        alert("Preencha o nome da semente e a descrição!");
        return;
    }

    const newSeed = {
        name: name,
        biome: biome,
        qtd: qtd || "Não especificado",
        desc: desc,
        author: currentUser || "Usuário Anônimo"
    };

    // Salva no LocalStorage
    let seeds = JSON.parse(localStorage.getItem("seeds"));
    seeds.push(newSeed);
    localStorage.setItem("seeds", JSON.stringify(seeds));

    alert("Semente publicada com sucesso no mural da comunidade!");
    
    // Limpa o formulário
    document.getElementById("seed-name").value = "";
    document.getElementById("seed-qtd").value = "";
    document.getElementById("seed-desc").value = "";

    // Vai para o mural
    showScreen("feed-screen");
}

function filterBiome(biomeName) {
    // Atualiza visual dos botões de filtro
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");
        if(btn.innerText === biomeName) btn.classList.add("active");
    });
    loadFeed(biomeName);
}

function loadFeed(filterValue) {
    const feedContainer = document.getElementById("seed-feed");
    feedContainer.innerHTML = "";
    
    let seeds = JSON.parse(localStorage.getItem("seeds")) || [];

    // Filtra pelo bioma selecionado
    if (filterValue !== "Todos") {
        seeds = seeds.filter(seed => seed.biome === filterValue);
    }

    if (seeds.length === 0) {
        feedContainer.innerHTML = "<p style='text-align:center; color:#777; margin-top:20px;'>Nenhuma semente encontrada para este bioma.</p>";
        return;
    }

    // Cria os cards de postagem invertendo o array para mostrar os mais recentes primeiro
    seeds.slice().reverse().forEach(seed => {
        const card = document.createElement("div");
        card.className = "post-card";
        card.innerHTML = `
            <span class="post-biome-tag">${seed.biome}</span>
            <h4>${seed.name}</h4>
            <p><strong>Quantidade:</strong> ${seed.qtd}</p>
            <p>${seed.desc}</p>
            <p class="author">Oferecido por: ${seed.author}</p>
        `;
        feedContainer.appendChild(card);
    });
}
