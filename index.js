import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyAk09upsnRkx8UsNrkGNry1Az0b_kcYdPU",
    authDomain: "indicacao-3bebe.firebaseapp.com",
    projectId: "indicacao-3bebe",
    storageBucket: "indicacao-3bebe.firebasestorage.app",
    messagingSenderId: "452320150448",
    appId: "1:452320150448:web:b9e0920f3d3ddf40dacc75",
    measurementId: "G-GQV52N33MN"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// DOM References
const container = document.getElementById('vagasContainer');
const modal = document.getElementById('indicationModal');
const closeModal = document.getElementById('closeModal');
const form = document.getElementById('indicationForm');
const feedback = document.getElementById('formFeedback');
const vagaIdHidden = document.getElementById('vagaId');
const vagaTituloModal = document.getElementById('vagaTituloModal');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const loader = document.getElementById('loader');
const searchInput = document.getElementById('searchInput');
const adminBtn = document.getElementById('adminBtn');

// State
let vagas = [];
let filteredVagas = [];

// ===== THEME =====
function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    themeIcon.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    themeIcon.textContent = '☀️';
}

themeToggle.addEventListener('click', toggleTheme);

// ===== ADMIN BUTTON =====
adminBtn.addEventListener('click', () => {
    window.location.href = 'admin.html';
});

// ===== INPUT MASKS =====
function applyCPFMask(value) {
    value = value.replace(/\D/g, '');
    if (value.length <= 3) return value;
    if (value.length <= 6) return value.replace(/(\d{3})(\d+)/, '$1.$2');
    if (value.length <= 9) return value.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    return value.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
}

function applyPhoneMask(value) {
    value = value.replace(/\D/g, '');
    if (value.length <= 2) return value;
    if (value.length <= 7) return value.replace(/(\d{2})(\d+)/, '($1) $2');
    return value.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
}

document.querySelectorAll('input[type="text"]').forEach(input => {
    if (input.id.includes('Cpf')) {
        input.addEventListener('input', (e) => {
            e.target.value = applyCPFMask(e.target.value);
        });
    } else if (input.id.includes('Telefone')) {
        input.addEventListener('input', (e) => {
            e.target.value = applyPhoneMask(e.target.value);
        });
    }
});

// ===== SEARCH =====
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
        filteredVagas = vagas.filter(v => v.status !== 'pausado');
    } else {
        filteredVagas = vagas.filter(vaga => {
            if (vaga.status === 'pausado') return false;
            const searchable = `${vaga.titulo} ${vaga.local} ${vaga.descricao} ${vaga.salario}`.toLowerCase();
            return searchable.includes(query);
        });
    }
    renderVagas(filteredVagas);
});

// ===== CARREGAR VAGAS =====
async function carregarVagas() {
    try {
        loader.classList.remove('hidden');
        const querySnapshot = await getDocs(collection(db, "vagas"));
        vagas = [];
        querySnapshot.forEach((doc) => {
            vagas.push({ id: doc.id, ...doc.data() });
        });
        
        if (vagas.length === 0) {
            vagas = getMockVagas();
        }
        
        filteredVagas = vagas.filter(v => v.status !== 'pausado');
        renderVagas(filteredVagas);
    } catch (error) {
        console.error("Erro ao carregar vagas:", error);
        vagas = getMockVagas();
        filteredVagas = vagas.filter(v => v.status !== 'pausado');
        renderVagas(filteredVagas);
    } finally {
        loader.classList.add('hidden');
    }
}

// ===== MOCK VAGAS =====
function getMockVagas() {
    return [
        {
            id: "v1",
            titulo: "Desenvolvedor Full Stack",
            local: "Remoto / Brasil",
            salario: "R$ 7.000,00",
            descricao: "Atuação com React, Node.js e bancos de dados. Experiência com metodologias ágeis e trabalho em equipe.",
            status: 'ativa'
        },
        {
            id: "v2",
            titulo: "Analista de Marketing",
            local: "São Paulo - SP",
            salario: "R$ 5.200,00",
            descricao: "Planejamento de campanhas, gestão de mídias sociais, análise de métricas e criação de conteúdo.",
            status: 'ativa'
        },
        {
            id: "v3",
            titulo: "Engenheiro de Dados",
            local: "Belo Horizonte - MG",
            salario: "R$ 9.800,00",
            descricao: "Pipeline de dados, ETL, SQL e Python. Modelagem de dados e arquitetura de soluções.",
            status: 'ativa'
        },
        {
            id: "v4",
            titulo: "UX/UI Designer",
            local: "Curitiba - PR",
            salario: "R$ 6.300,00",
            descricao: "Criação de interfaces, prototipagem, testes de usabilidade e design system.",
            status: 'ativa'
        },
        {
            id: "v5",
            titulo: "Suporte Técnico N2",
            local: "Rio de Janeiro - RJ",
            salario: "R$ 3.800,00",
            descricao: "Atendimento a clientes, resolução de problemas técnicos e registro de chamados.",
            status: 'ativa'
        }
    ];
}

// ===== RENDER VAGAS =====
function renderVagas(vagasList) {
    container.innerHTML = '';
    
    if (vagasList.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-light);">
                <p style="font-size: 1.1rem;">Nenhuma vaga disponível no momento.</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Volte em breve para novas oportunidades.</p>
            </div>
        `;
        return;
    }
    
    vagasList.forEach(vaga => {
        const card = document.createElement('div');
        card.className = 'vaga-card';
        card.dataset.id = vaga.id;

        card.innerHTML = `
            <div class="vaga-header">
                <div class="vaga-titulo">${vaga.titulo}</div>
                <span class="vaga-badge">${vaga.status === 'pausado' ? 'Pausada' : 'Aberto'}</span>
            </div>
            <div class="vaga-local">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 9C9.10457 9 10 8.10457 10 7C10 5.89543 9.10457 5 8 5C6.89543 5 6 5.89543 6 7C6 8.10457 6.89543 9 8 9Z" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M8 14C10 12 13 9.5 13 7C13 4.23858 10.7614 2 8 2C5.23858 2 3 4.23858 3 7C3 9.5 6 12 8 14Z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                ${vaga.local}
            </div>
            <div class="vaga-expand">
                <div class="vaga-details">
                    <div class="vaga-salario">
                        <span style="font-weight: 700; color: #C10404; margin-right: 4px;">$</span>
                        ${vaga.salario}
                    </div>
                    <div class="vaga-descricao">
                        <strong>Descrição:</strong> ${vaga.descricao}
                    </div>
                    <button class="btn-indicar" data-id="${vaga.id}">
                        <span>Indicar</span>
                        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                            <path d="M3 9L7 13L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-indicar')) return;
            
            document.querySelectorAll('.vaga-card.expandido').forEach(c => {
                if (c !== card) c.classList.remove('expandido');
            });
            
            card.classList.toggle('expandido');
        });

        const btnIndicar = card.querySelector('.btn-indicar');
        btnIndicar.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModal(vaga.id, vaga.titulo);
        });

        container.appendChild(card);
    });
}

// ===== MODAL =====
function abrirModal(vagaId, vagaTitulo) {
    vagaIdHidden.value = vagaId;
    vagaTituloModal.textContent = `Vaga: ${vagaTitulo}`;
    form.reset();
    feedback.style.display = 'none';
    feedback.className = 'alert';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

closeModal.addEventListener('click', fecharModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) fecharModal();
});

// ===== FORM SUBMIT =====
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dados = {
        indicador: {
            nome: document.getElementById('indicadorNome').value.trim(),
            cpf: document.getElementById('indicadorCpf').value.trim(),
            telefone: document.getElementById('indicadorTelefone').value.trim()
        },
        indicado: {
            nome: document.getElementById('indicadoNome').value.trim(),
            cpf: document.getElementById('indicadoCpf').value.trim(),
            telefone: document.getElementById('indicadoTelefone').value.trim()
        },
        vagaId: vagaIdHidden.value,
        timestamp: new Date().toISOString(),
        status: 'pendente'
    };

    if (!dados.indicador.nome || !dados.indicador.cpf || !dados.indicador.telefone ||
        !dados.indicado.nome || !dados.indicado.cpf || !dados.indicado.telefone) {
        feedback.textContent = 'Preencha todos os campos obrigatórios.';
        feedback.className = 'alert alert-error';
        feedback.style.display = 'block';
        return;
    }

    try {
        feedback.style.display = 'none';
        const docRef = await addDoc(collection(db, "indicacoes"), dados);
        console.log("Indicação salva com ID:", docRef.id);
        
        feedback.textContent = 'Indicação enviada com sucesso!';
        feedback.className = 'alert alert-success';
        feedback.style.display = 'block';
        
        setTimeout(() => {
            fecharModal();
            form.reset();
        }, 2000);
    } catch (error) {
        console.error("Erro ao salvar:", error);
        feedback.textContent = 'Erro ao enviar. Tente novamente.';
        feedback.className = 'alert alert-error';
        feedback.style.display = 'block';
    }
});

// ===== INIT =====
carregarVagas();

// ===== WEBSOCKET FIX =====
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        carregarVagas();
    }
});

if (window.WebSocket) {
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(...args) {
        if (args[0] && args[0].includes('127.0.0.1:5500')) {
            console.warn('WebSocket connection blocked');
            return null;
        }
        return new originalWebSocket(...args);
    };
}