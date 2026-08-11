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
let deleteTargetId = null;
let isLoggingIn = false;

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
        // Usuário está logado
        loginContainer.style.display = 'none';
        adminContainer.classList.remove('hidden');
        carregarDados();
        loginFeedback.style.display = 'none';
    } else {
        // Usuário não está logado
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
        // O onAuthStateChanged vai cuidar da navegação
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
        // O onAuthStateChanged vai cuidar da navegação
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
            renderIndicacoes();
        }
    });
});

// ===== CARREGAR DADOS =====
async function carregarDados() {
    try {
        loader.classList.remove('hidden');
        await Promise.all([carregarVagas(), carregarIndicacoes()]);
        renderVagas();
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
        querySnapshot.forEach((doc) => {
            indicacoes.push({ id: doc.id, ...doc.data() });
        });
        totalIndicacoes.textContent = indicacoes.length;
    } catch (error) {
        console.error("Erro ao carregar indicações:", error);
        indicacoes = [];
    }
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

    vagasList.innerHTML = vagas.map(vaga => `
        <div class="admin-item">
            <div class="admin-item-info">
                <h3>${vaga.titulo}</h3>
                <p>${vaga.local} • ${vaga.salario}</p>
                <p style="font-size: 0.8rem; margin-top: 0.2rem; color: var(--text-muted);">${vaga.descricao ? vaga.descricao.substring(0, 80) + '...' : ''}</p>
            </div>
            <div class="admin-item-actions">
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
    `).join('');

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
}

// ===== RENDER INDICAÇÕES =====
// ===== RENDER INDICAÇÕES =====
function renderIndicacoes() {
    if (indicacoes.length === 0) {
        indicacoesList.innerHTML = `
            <div class="admin-item" style="justify-content: center; color: var(--text-light);">
                <p>Nenhuma indicação registrada ainda.</p>
            </div>
        `;
        return;
    }

    indicacoesList.innerHTML = indicacoes.map(ind => `
        <div class="admin-item" style="flex-direction: column; align-items: stretch; gap: 0.8rem;">
            <div class="admin-item-info" style="width: 100%;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; width: 100%;">
                    <div style="background: var(--tab-bg); padding: 0.8rem; border-radius: 12px;">
                        <h4 style="font-size: 0.75rem; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.3rem;">👤 Quem Indicou</h4>
                        <p style="font-weight: 600; color: var(--text-color); font-size: 0.9rem;">${ind.indicador?.nome || 'Não informado'}</p>
                        <p style="font-size: 0.8rem; color: var(--text-light);">CPF: ${ind.indicador?.cpf || 'Não informado'}</p>
                        <p style="font-size: 0.8rem; color: var(--text-light);">Telefone: ${ind.indicador?.telefone || 'Não informado'}</p>
                    </div>
                    <div style="background: var(--tab-bg); padding: 0.8rem; border-radius: 12px;">
                        <h4 style="font-size: 0.75rem; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.3rem;">👤 Quem foi Indicado</h4>
                        <p style="font-weight: 600; color: var(--text-color); font-size: 0.9rem;">${ind.indicado?.nome || 'Não informado'}</p>
                        <p style="font-size: 0.8rem; color: var(--text-light);">CPF: ${ind.indicado?.cpf || 'Não informado'}</p>
                        <p style="font-size: 0.8rem; color: var(--text-light);">Telefone: ${ind.indicado?.telefone || 'Não informado'}</p>
                    </div>
                </div>
                <div style="display: flex; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap;">
                    <p style="font-size: 0.8rem; color: var(--text-light);">
                        <strong>Vaga:</strong> ${ind.vagaTitulo || 'ID: ' + ind.vagaId}
                    </p>
                    <p style="font-size: 0.8rem; color: var(--text-light);">
                        <strong>Data:</strong> ${ind.timestamp ? new Date(ind.timestamp).toLocaleDateString('pt-BR') : 'Não informada'}
                    </p>
                    <p style="font-size: 0.8rem; color: var(--text-light);">
                        <strong>Status:</strong> 
                        <span style="padding: 0.2rem 0.6rem; background: var(--tab-bg); border-radius: 12px; font-weight: 600; color: var(--link-color);">
                            ${ind.status || 'Pendente'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    `).join('');
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
        descricao: vagaDescricao.value.trim()
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