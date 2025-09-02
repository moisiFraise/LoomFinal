document.addEventListener('DOMContentLoaded', () => {
    carregarEmocoes();
    
    // Event listener para o formulário
    document.getElementById('form-emocao').addEventListener('submit', salvarEmocao);
});

let emocaoParaEditar = null;

async function carregarEmocoes() {
    try {
        const response = await fetch('/api/admin/emocoes');
        
        if (!response.ok) {
            throw new Error('Erro ao carregar emoções');
        }
        
        const emocoes = await response.json();
        renderizarEmocoes(emocoes);
        
    } catch (error) {
        console.error('Erro ao carregar emoções:', error);
        document.getElementById('emocoes-grid').innerHTML = 
            '<div class="erro">Erro ao carregar emoções. Tente novamente.</div>';
    }
}

function renderizarEmocoes(emocoes) {
    const grid = document.getElementById('emocoes-grid');
    
    if (emocoes.length === 0) {
        grid.innerHTML = '<div class="sem-emocoes">Nenhuma emoção cadastrada ainda.</div>';
        return;
    }
    
    grid.innerHTML = emocoes.map(emocao => {
        const statusClass = emocao.ativo ? 'ativo' : 'inativo';
        const cardClass = emocao.ativo ? '' : 'inativa';
        
        return `
            <div class="emocao-card ${cardClass}" data-id="${emocao.id}">
                <div class="emocao-header">
                    <div style="display: flex; align-items: center;">
                        <span class="emocao-emoji">${emocao.emoji}</span>
                        <div class="emocao-info">
                            <h3>${emocao.nome}</h3>
                        </div>
                    </div>
                    <div class="emocao-status">
                        <div class="emocao-cor" style="background-color: ${emocao.cor}"></div>
                        <span class="status-badge ${statusClass}">
                            ${emocao.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                </div>
                
                <div class="emocao-actions">
                    <button class="btn-action btn-editar" onclick="editarEmocao(${emocao.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-action btn-toggle" onclick="toggleEmocao(${emocao.id}, ${!emocao.ativo})">
                        <i class="fas fa-${emocao.ativo ? 'eye-slash' : 'eye'}"></i>
                        ${emocao.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button class="btn-action btn-remover" onclick="removerEmocao(${emocao.id})">
                        <i class="fas fa-trash"></i> Remover
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function abrirModalNovaEmocao() {
    emocaoParaEditar = null;
    document.getElementById('modal-titulo').textContent = 'Nova Emoção';
    document.getElementById('emocao-id').value = '';
    document.getElementById('emocao-nome').value = '';
    document.getElementById('emocao-emoji').value = '';
    document.getElementById('emocao-cor').value = '#6c5ce7';
    document.getElementById('emocao-ativa').checked = true;
    
    mostrarModal();
}

async function editarEmocao(id) {
    try {
        const response = await fetch(`/api/admin/emocoes`);
        const emocoes = await response.json();
        const emocao = emocoes.find(e => e.id === id);
        
        if (!emocao) {
            alert('Emoção não encontrada');
            return;
        }
        
        emocaoParaEditar = emocao;
        document.getElementById('modal-titulo').textContent = 'Editar Emoção';
        document.getElementById('emocao-id').value = emocao.id;
        document.getElementById('emocao-nome').value = emocao.nome;
        document.getElementById('emocao-emoji').value = emocao.emoji;
        document.getElementById('emocao-cor').value = emocao.cor;
        
        if (emocao.ativo) {
            document.getElementById('emocao-ativa').checked = true;
        } else {
            document.getElementById('emocao-inativa').checked = true;
        }
        
        mostrarModal();
        
    } catch (error) {
        console.error('Erro ao carregar emoção para edição:', error);
        alert('Erro ao carregar dados da emoção');
    }
}

async function salvarEmocao(event) {
    event.preventDefault();
    
    const id = document.getElementById('emocao-id').value;
    const nome = document.getElementById('emocao-nome').value.trim();
    const emoji = document.getElementById('emocao-emoji').value.trim();
    const cor = document.getElementById('emocao-cor').value;
    const ativo = document.getElementById('emocao-ativa').checked;
    
    if (!nome || !emoji) {
        alert('Nome e emoji são obrigatórios');
        return;
    }
    
    try {
        const isEdicao = id && id !== '';
        const url = isEdicao ? `/api/admin/emocoes/${id}` : '/api/admin/emocoes';
        const method = isEdicao ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, emoji, cor, ativo })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.erro || 'Erro ao salvar emoção');
        }
        
        fecharModal();
        carregarEmocoes();
        
        mostrarMensagem(
            isEdicao ? 'Emoção atualizada com sucesso!' : 'Emoção criada com sucesso!',
            'sucesso'
        );
        
    } catch (error) {
        console.error('Erro ao salvar emoção:', error);
        alert(error.message || 'Erro ao salvar emoção');
    }
}

async function toggleEmocao(id, novoStatus) {
    try {
        const response = await fetch(`/api/admin/emocoes/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ativo: novoStatus })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.erro || 'Erro ao alterar status');
        }
        
        carregarEmocoes();
        mostrarMensagem(
            `Emoção ${novoStatus ? 'ativada' : 'desativada'} com sucesso!`,
            'sucesso'
        );
        
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        alert(error.message || 'Erro ao alterar status da emoção');
    }
}

async function removerEmocao(id) {
    if (!confirm('Tem certeza que deseja remover esta emoção?\n\nEsta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/emocoes/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.erro || 'Erro ao remover emoção');
        }
        
        carregarEmocoes();
        mostrarMensagem('Emoção removida com sucesso!', 'sucesso');
        
    } catch (error) {
        console.error('Erro ao remover emoção:', error);
        alert(error.message || 'Erro ao remover emoção');
    }
}

function mostrarModal() {
    document.getElementById('modal-emocao').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function fecharModal() {
    document.getElementById('modal-emocao').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
    document.body.style.overflow = '';
}

function fecharModalEmocao() {
    fecharModal();
}

function mostrarMensagem(texto, tipo) {
    const mensagem = document.createElement('div');
    mensagem.className = `mensagem mensagem-${tipo}`;
    mensagem.textContent = texto;
    
    mensagem.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background: ${tipo === 'sucesso' ? '#28a745' : '#dc3545'};
    `;
    
    document.body.appendChild(mensagem);
    
    setTimeout(() => {
        mensagem.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(mensagem)) {
                document.body.removeChild(mensagem);
            }
        }, 300);
    }, 3000);
}

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .sem-emocoes, .erro {
        text-align: center;
        color: var(--texto-secundario);
        font-style: italic;
        grid-column: 1 / -1;
        padding: 40px;
        background: var(--card-bg);
        border-radius: 12px;
        border: 2px dashed var(--border-color);
    }
`;
document.head.appendChild(style);
