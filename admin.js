import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

// ===== DOM REFERENCES =====
const loginContainer = document.getElementById('loginContainer');
const adminContainer = document.getElementById('adminContainer');
const loginForm = document.getElementById('loginForm');
const loginUser = document.getElementById('loginUser');
const loginPassword = document.getElementById('loginPassword');
const loginFeedback = document.getElementById('loginFeedback');
const togglePassword = document.getElementById('togglePassword');
const backToIndex = document.getElementById('backToIndex');
const logoutBtn = document.getElementById('logoutBtn');
const themeToggle = document.getElementById('themeToggle');

// Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const vagasTab = document.getElementById('vagasTab');
const indicacoesTab = document.getElementById('indicacoesTab');
const vagasList = document.getElementById('vagasList');
const indicacoesList = document.getElementById('indicacoesList');
const totalIndicacoes = document.getElementById('totalIndicacoes');

// Filtros
const filtroData = document.getElementById('filtroData');
const filtroStatus = document.getElementById('filtroStatus');
const limparFiltros = document.getElementById('limparFiltros');

// Vaga Modal
const vagaModal = document.getElementById('vagaModal');
const closeVagaModal = document.getElementById('closeVagaModal');
const vagaForm = document.getElementById('vagaForm');
const vagaModalTitle = document.getElementById('vagaModalTitle');
const vagaSubmitText = document.getElementById('vagaSubmitText');
const vagaEditId = document.getElementById('vagaEditId');
const vagaTitulo = document.getElementById('vagaTitulo');
const vagaLocal = document.getElementById('vagaLocal');
const vagaSalario = document.getElementById('vagaSalario');
const vagaDescricao = document.getElementById('vagaDescricao');
const vagaFormFeedback = document.getElementById('vagaFormFeedback');
const novaVagaBtn = document.getElementById('novaVagaBtn');

// Confirm Modal
const confirmModal = document.getElementById('confirmModal');
const closeConfirmModal = document.getElementById('closeConfirmModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmVagaNome = document.getElementById('confirmVagaNome');

// Loader
const loader = document.getElementById('loader');

// ===== STATE =====
let vagas = [];
let indicacoes = [];
let indicacoesFiltradas = [];
let deleteTargetId = null;
let isLoggingIn = false;

// ===== Mapeamento de status para exibição =====
const statusMap = {
    'pendente': { label: 'Pendente', color: '#f39c12', bg: 'rgba(243, 156, 18, 0.12)' },
    'descartado': { label: 'Descartado', color: '#e74c3c', bg: 'rgba(231, 76, 60, 0.12)' },
    'em_analise': { label: 'Em Análise', color: '#3498db', bg: 'rgba(52, 152, 219, 0.12)' },
    'aprovado': { label: 'Aprovado', color: '#2ecc71', bg: 'rgba(46, 204, 113, 0.12)' },
    'pago': { label: 'Pago', color: '#9b59b6', bg: 'rgba(155, 89, 182, 0.12)' }
};

// ===== THEME =====
function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    const svg = themeToggle.querySelector('svg');
    if (isDark) {
        svg.innerHTML = `
            <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
        `;
    } else {
        svg.innerHTML = `
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        `;
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    const svg = themeToggle.querySelector('svg');
    svg.innerHTML = `
        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
    `;
}

themeToggle.addEventListener('click', toggleTheme);

// ===== AUTH STATE =====
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginContainer.style.display = 'none';
        adminContainer.classList.remove('hidden');
        carregarDados();
        loginFeedback.style.display = 'none';
    } else {
        adminContainer.classList.add('hidden');
        loginContainer.style.display = 'flex';
        if (!isLoggingIn) {
            loginForm.reset();
        }
        loginFeedback.style.display = 'none';
    }
});

// ===== LOGIN =====
function showLoginFeedback(message, type = 'error') {
    loginFeedback.textContent = message;
    loginFeedback.className = `alert alert-${type}`;
    loginFeedback.style.display = 'block';
}

togglePassword.addEventListener('click', () => {
    const type = loginPassword.type === 'password' ? 'text' : 'password';
    loginPassword.type = type;
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (isLoggingIn) return;
    
    const email = loginUser.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
        showLoginFeedback('Preencha todos os campos');
        return;
    }

    isLoggingIn = true;
    loginFeedback.style.display = 'none';
    const submitBtn = loginForm.querySelector('.login-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Entrando...</span>';

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Erro de login:', error);
        let message = 'Credenciais inválidas. Tente novamente.';
        if (error.code === 'auth/user-not-found') {
            message = 'Usuário não encontrado.';
        } else if (error.code === 'auth/wrong-password') {
            message = 'Senha incorreta.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'E-mail inválido.';
        } else if (error.code === 'auth/too-many-requests') {
            message = 'Muitas tentativas. Aguarde um momento.';
        }
        showLoginFeedback(message);
        loginPassword.value = '';
        loginPassword.focus();
    } finally {
        isLoggingIn = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <span>Entrar</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
            </svg>
        `;
    }
});

// ===== LOGOUT =====
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Erro ao sair:', error);
    }
});

backToIndex.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// ===== TABS =====
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const tab = btn.dataset.tab;
        if (tab === 'vagas') {
            vagasTab.classList.add('active');
            indicacoesTab.classList.remove('active');
            renderVagas();
        } else {
            indicacoesTab.classList.add('active');
            vagasTab.classList.remove('active');
            aplicarFiltros();
        }
    });
});

// ===== FILTROS =====
filtroData.addEventListener('change', aplicarFiltros);
filtroStatus.addEventListener('change', aplicarFiltros);

limparFiltros.addEventListener('click', () => {
    filtroData.value = '';
    filtroStatus.value = 'todos';
    aplicarFiltros();
});

function aplicarFiltros() {
    let resultado = [...indicacoes];
    
    // Filtro por data
    const dataSelecionada = filtroData.value;
    if (dataSelecionada) {
        const [ano, mes, dia] = dataSelecionada.split('-');
        const dataInicio = new Date(ano, mes - 1, dia);
        const dataFim = new Date(ano, mes - 1, dia, 23, 59, 59);
        
        resultado = resultado.filter(ind => {
            if (!ind.timestamp) return false;
            const indData = new Date(ind.timestamp);
            return indData >= dataInicio && indData <= dataFim;
        });
    }
    
    // Filtro por status
    const statusSelecionado = filtroStatus.value;
    if (statusSelecionado !== 'todos') {
        resultado = resultado.filter(ind => {
            const status = ind.status || 'pendente';
            return status === statusSelecionado;
        });
    }
    
    indicacoesFiltradas = resultado;
    renderIndicacoes();
}

// ===== CARREGAR DADOS =====
async function carregarDados() {
    try {
        loader.classList.remove('hidden');
        await Promise.all([carregarVagas(), carregarIndicacoes()]);
        renderVagas();
        indicacoesFiltradas = [...indicacoes];
        renderIndicacoes();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    } finally {
        loader.classList.add('hidden');
    }
}

async function carregarVagas() {
    try {
        const querySnapshot = await getDocs(collection(db, "vagas"));
        vagas = [];
        querySnapshot.forEach((doc) => {
            vagas.push({ id: doc.id, ...doc.data() });
        });
    } catch (error) {
        console.error("Erro ao carregar vagas:", error);
        vagas = [];
    }
}

async function carregarIndicacoes() {
    try {
        const querySnapshot = await getDocs(collection(db, "indicacoes"));
        indicacoes = [];
        
        const vagasSnapshot = await getDocs(collection(db, "vagas"));
        const vagasMap = {};
        vagasSnapshot.forEach((doc) => {
            vagasMap[doc.id] = doc.data();
        });
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const vagaInfo = vagasMap[data.vagaId];
            if (vagaInfo) {
                data.vagaTitulo = `${vagaInfo.titulo} / ${vagaInfo.local}`;
            } else {
                data.vagaTitulo = data.vagaTitulo || 'ID: ' + data.vagaId;
            }
            // Garante que o status existe
            if (!data.status) {
                data.status = 'pendente';
            }
            indicacoes.push({ id: doc.id, ...data });
        });
        
        totalIndicacoes.textContent = indicacoes.length;
        indicacoesFiltradas = [...indicacoes];
    } catch (error) {
        console.error("Erro ao carregar indicações:", error);
        indicacoes = [];
    }
}

// ===== FUNÇÃO PARA CONTAR INDICAÇÕES POR CPF =====
function contarIndicacoesPorCPF(cpf) {
    if (!cpf) return { indicou: 0, foiIndicado: 0 };
    
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    let indicou = 0;
    let foiIndicado = 0;
    
    indicacoes.forEach(ind => {
        const indicadorCpf = ind.indicador?.cpf?.replace(/\D/g, '') || '';
        const indicadoCpf = ind.indicado?.cpf?.replace(/\D/g, '') || '';
        
        if (indicadorCpf === cpfLimpo) indicou++;
        if (indicadoCpf === cpfLimpo) foiIndicado++;
    });
    
    return { indicou, foiIndicado };
}

// ===== RENDER VAGAS =====
function renderVagas() {
    if (vagas.length === 0) {
        vagasList.innerHTML = `
            <div class="admin-item" style="justify-content: center; color: var(--text-light);">
                <p>Nenhuma vaga cadastrada. Clique em "Nova Vaga" para criar.</p>
            </div>
        `;
        return;
    }

    vagasList.innerHTML = vagas.map(vaga => {
        const status = vaga.status || 'ativa';
        const isPausado = status === 'pausado';
        
        return `
        <div class="admin-item">
            <div class="admin-item-info">
                <h3>
                    ${vaga.titulo}
                    <span class="status-badge ${isPausado ? 'pausada' : 'ativa'}">
                        ${isPausado ? '⏸ Pausada' : '✓ Ativa'}
                    </span>
                </h3>
                <p>${vaga.local} • ${vaga.salario}</p>
                <p style="font-size: 0.8rem; margin-top: 0.2rem; color: var(--text-muted);">${vaga.descricao ? vaga.descricao.substring(0, 80) + '...' : ''}</p>
            </div>
            <div class="admin-item-actions">
                <button class="action-btn ${isPausado ? 'active-btn' : 'pause-btn'}" data-id="${vaga.id}" data-action="toggle-status">
                    ${isPausado ? '▶ Ativar' : '⏸ Pausar'}
                </button>
                <button class="action-btn edit-btn" data-id="${vaga.id}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Editar
                </button>
                <button class="action-btn delete-btn" data-id="${vaga.id}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Excluir
                </button>
            </div>
        </div>
    `}).join('');

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const vaga = vagas.find(v => v.id === id);
            if (vaga) abrirModalEdicao(vaga);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const vaga = vagas.find(v => v.id === id);
            if (vaga) abrirConfirmDelete(vaga);
        });
    });

    document.querySelectorAll('[data-action="toggle-status"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const vaga = vagas.find(v => v.id === id);
            if (!vaga) return;
            
            const novoStatus = vaga.status === 'pausado' ? 'ativa' : 'pausado';
            
            try {
                loader.classList.remove('hidden');
                await updateDoc(doc(db, "vagas", id), { status: novoStatus });
                await carregarVagas();
                renderVagas();
            } catch (error) {
                console.error("Erro ao alterar status:", error);
                alert('Erro ao alterar status da vaga.');
            } finally {
                loader.classList.add('hidden');
            }
        });
    });
}

// ===== RENDER INDICAÇÕES =====
function renderIndicacoes() {
    const lista = indicacoesFiltradas || indicacoes;
    
    if (lista.length === 0) {
        indicacoesList.innerHTML = `
            <div class="admin-item" style="justify-content: center; color: var(--text-light);">
                <p>${(filtroData.value || filtroStatus.value !== 'todos') ? 'Nenhuma indicação encontrada com os filtros selecionados.' : 'Nenhuma indicação registrada ainda.'}</p>
            </div>
        `;
        return;
    }

    indicacoesList.innerHTML = lista.map(ind => {
        const contagens = contarIndicacoesPorCPF(ind.indicador?.cpf);
        const contagensIndicado = contarIndicacoesPorCPF(ind.indicado?.cpf);
        const statusInfo = statusMap[ind.status] || statusMap['pendente'];
        
        return `
        <div class="admin-item" style="flex-direction: column; align-items: stretch; gap: 0.8rem;">
            <div class="admin-item-info" style="width: 100%;">
                <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 1rem; width: 100%;">
                    <div style="background: var(--tab-bg); padding: 0.8rem; border-radius: 12px;">
                        <h4 style="font-size: 0.75rem; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.3rem;">Indicou</h4>
                        <p style="font-weight: 600; color: var(--text-color); font-size: 0.9rem;">${ind.indicador?.nome || 'Não informado'}</p>
                        <p style="font-size: 0.8rem; color: var(--text-light);"><strong>CPF:</strong> ${ind.indicador?.cpf || 'Não informado'}</p>
                        <p style="font-size: 0.8rem; color: var(--text-light);"><strong>Telefone:</strong> ${ind.indicador?.telefone || 'Não informado'}</p>
                        <p style="font-size: 0.75rem; color: var(--link-color); font-weight: 600; margin-top: 0.3rem;">Indicou: ${contagens.indicou} vez(es)</p>
                    </div>
                    <div style="background: var(--tab-bg); padding: 0.8rem; border-radius: 12px;">
                        <h4 style="font-size: 0.75rem; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.3rem;">Indicado</h4>
                        <p style="font-weight: 600; color: var(--text-color); font-size: 0.9rem;">${ind.indicado?.nome || 'Não informado'}</p>
                        <p style="font-size: 0.8rem; color: var(--text-light);"><strong>CPF:</strong> ${ind.indicado?.cpf || 'Não informado'}</p>
                        <p style="font-size: 0.8rem; color: var(--text-light);"><strong>Telefone:</strong> ${ind.indicado?.telefone || 'Não informado'}</p>
                        <p style="font-size: 0.75rem; color: var(--link-color); font-weight: 600; margin-top: 0.3rem;">Foi indicado: ${contagensIndicado.foiIndicado} vez(es)</p>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; justify-content: flex-start; min-width: 140px;">
                        <label style="font-size: 0.7rem; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px;">Status</label>
                        <select class="status-select" data-id="${ind.id}" style="padding: 0.4rem 0.6rem; border: 2px solid ${statusInfo.color}; border-radius: 12px; background: ${statusInfo.bg}; color: ${statusInfo.color}; font-family: 'Poppins', sans-serif; font-size: 0.8rem; font-weight: 600; outline: none; cursor: pointer; transition: all 0.3s ease;">
                            <option value="pendente" ${ind.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                            <option value="descartado" ${ind.status === 'descartado' ? 'selected' : ''}>Descartado</option>
                            <option value="em_analise" ${ind.status === 'em_analise' ? 'selected' : ''}>Em Análise</option>
                            <option value="aprovado" ${ind.status === 'aprovado' ? 'selected' : ''}>Aprovado</option>
                            <option value="pago" ${ind.status === 'pago' ? 'selected' : ''}>Pago</option>
                        </select>
                    </div>
                </div>
                
                <div style="margin-top: 0.8rem; padding-top: 0.8rem; border-top: 2px solid var(--input-border); display: flex; gap: 2rem; flex-wrap: wrap; align-items: center;">
                    <p style="font-size: 0.8rem; color: var(--text-light); margin: 0;">
                        <strong>Vaga:</strong> ${ind.vagaTitulo || 'ID: ' + ind.vagaId}
                    </p>
                    <p style="font-size: 0.8rem; color: var(--text-light); margin: 0;">
                        <strong>Data:</strong> ${ind.timestamp ? new Date(ind.timestamp).toLocaleDateString('pt-BR') : 'Não informada'}
                    </p>
                </div>
            </div>
        </div>
    `}).join('');

    // Event listeners para mudança de status
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const id = e.target.dataset.id;
            const novoStatus = e.target.value;
            
            try {
                loader.classList.remove('hidden');
                await updateDoc(doc(db, "indicacoes", id), { status: novoStatus });
                // Atualiza localmente
                const indice = indicacoes.findIndex(ind => ind.id === id);
                if (indice !== -1) {
                    indicacoes[indice].status = novoStatus;
                }
                // Reaplica os filtros
                aplicarFiltros();
            } catch (error) {
                console.error("Erro ao atualizar status:", error);
                alert('Erro ao atualizar status da indicação.');
                // Reverte o select
                aplicarFiltros();
            } finally {
                loader.classList.add('hidden');
            }
        });
    });
    
    totalIndicacoes.textContent = lista.length;
}

// ===== MODAL VAGA =====
function abrirModalEdicao(vaga) {
    vagaModalTitle.textContent = 'Editar Vaga';
    vagaSubmitText.textContent = 'Salvar Alterações';
    vagaEditId.value = vaga.id;
    vagaTitulo.value = vaga.titulo;
    vagaLocal.value = vaga.local;
    vagaSalario.value = vaga.salario;
    vagaDescricao.value = vaga.descricao || '';
    vagaFormFeedback.style.display = 'none';
    vagaModal.classList.add('active');
}

function abrirNovaVaga() {
    vagaModalTitle.textContent = 'Nova Vaga';
    vagaSubmitText.textContent = 'Criar Vaga';
    vagaEditId.value = '';
    vagaForm.reset();
    vagaFormFeedback.style.display = 'none';
    vagaModal.classList.add('active');
}

novaVagaBtn.addEventListener('click', abrirNovaVaga);
closeVagaModal.addEventListener('click', () => vagaModal.classList.remove('active'));
vagaModal.addEventListener('click', (e) => {
    if (e.target === vagaModal) vagaModal.classList.remove('active');
});

// ===== SALVAR VAGA =====
vagaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dados = {
        titulo: vagaTitulo.value.trim(),
        local: vagaLocal.value.trim(),
        salario: vagaSalario.value.trim(),
        descricao: vagaDescricao.value.trim(),
        status: 'ativa'
    };

    if (!dados.titulo || !dados.local || !dados.salario || !dados.descricao) {
        vagaFormFeedback.textContent = 'Preencha todos os campos.';
        vagaFormFeedback.className = 'alert alert-error';
        vagaFormFeedback.style.display = 'block';
        return;
    }

    const editId = vagaEditId.value;

    try {
        loader.classList.remove('hidden');
        if (editId) {
            await updateDoc(doc(db, "vagas", editId), dados);
        } else {
            await addDoc(collection(db, "vagas"), dados);
        }
        vagaModal.classList.remove('active');
        await carregarVagas();
        renderVagas();
        vagaFormFeedback.style.display = 'none';
    } catch (error) {
        console.error("Erro ao salvar vaga:", error);
        vagaFormFeedback.textContent = 'Erro ao salvar. Tente novamente.';
        vagaFormFeedback.className = 'alert alert-error';
        vagaFormFeedback.style.display = 'block';
    } finally {
        loader.classList.add('hidden');
    }
});

// ===== CONFIRMAR EXCLUSÃO =====
function abrirConfirmDelete(vaga) {
    deleteTargetId = vaga.id;
    confirmVagaNome.textContent = `"${vaga.titulo}"`;
    confirmModal.classList.add('active');
}

closeConfirmModal.addEventListener('click', () => confirmModal.classList.remove('active'));
cancelDeleteBtn.addEventListener('click', () => confirmModal.classList.remove('active'));
confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) confirmModal.classList.remove('active');
});

confirmDeleteBtn.addEventListener('click', async () => {
    if (!deleteTargetId) return;
    
    try {
        loader.classList.remove('hidden');
        await deleteDoc(doc(db, "vagas", deleteTargetId));
        confirmModal.classList.remove('active');
        await carregarVagas();
        renderVagas();
        deleteTargetId = null;
    } catch (error) {
        console.error("Erro ao excluir vaga:", error);
        alert('Erro ao excluir vaga. Tente novamente.');
    } finally {
        loader.classList.add('hidden');
    }
});

// ===== FECHAR MODAIS COM ESC =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        vagaModal.classList.remove('active');
        confirmModal.classList.remove('active');
    }
});