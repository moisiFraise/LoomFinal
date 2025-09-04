const estadoCurtidas = {};

// Sistema de sincronização de curtidas entre páginas
const CurtidasSyncManager = {
    storageKey: 'loom_curtidas_sync',
    
    // Salvar estado no localStorage
    salvarEstado(atualizacaoId, curtido, total) {
        const estadoAtual = this.lerEstado();
        estadoAtual[atualizacaoId] = {
            curtido,
            total,
            timestamp: Date.now()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(estadoAtual));
        
        // Disparar evento customizado para outras abas
        window.dispatchEvent(new CustomEvent('curtidaAtualizada', {
            detail: { atualizacaoId, curtido, total }
        }));
    },
    
    // Ler estado do localStorage
    lerEstado() {
        try {
            const estado = localStorage.getItem(this.storageKey);
            return estado ? JSON.parse(estado) : {};
        } catch (error) {
            console.error('Erro ao ler estado das curtidas:', error);
            return {};
        }
    },
    
    // Inicializar listeners de sincronização
    inicializar() {
        // Listener para mudanças no localStorage (entre abas)
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                try {
                    const novoEstado = JSON.parse(e.newValue);
                    const estadoAnterior = e.oldValue ? JSON.parse(e.oldValue) : {};
                    
                    // Verificar quais curtidas mudaram
                    Object.keys(novoEstado).forEach(atualizacaoId => {
                        const estadoNovo = novoEstado[atualizacaoId];
                        const estadoAntigo = estadoAnterior[atualizacaoId];
                        
                        if (!estadoAntigo || 
                            estadoNovo.curtido !== estadoAntigo.curtido || 
                            estadoNovo.total !== estadoAntigo.total) {
                            this.atualizarUI(atualizacaoId, estadoNovo.curtido, estadoNovo.total);
                        }
                    });
                } catch (error) {
                    console.error('Erro ao processar mudança de estado:', error);
                }
            }
        });
        
        // Listener para eventos customizados na mesma aba
        window.addEventListener('curtidaAtualizada', (e) => {
            const { atualizacaoId, curtido, total } = e.detail;
            this.atualizarUI(atualizacaoId, curtido, total);
        });
    },
    
    // Atualizar interface do usuário
    atualizarUI(atualizacaoId, curtido, total) {
        const botaoCurtir = document.querySelector(`.botao-curtir[data-id="${atualizacaoId}"]`);
        const contador = document.querySelector(`.contador-curtidas[data-id="${atualizacaoId}"]`);
        
        if (botaoCurtir) {
            const icone = botaoCurtir.querySelector('i');
            if (curtido) {
                botaoCurtir.classList.add('curtido');
                icone.className = 'fas fa-heart';
            } else {
                botaoCurtir.classList.remove('curtido');
                icone.className = 'far fa-heart';
            }
        }
        
        if (contador) {
            contador.textContent = total > 0 ? total : '';
            contador.style.display = total > 0 ? 'inline-block' : 'none';
        }
    }
};

async function alternarCurtida(atualizacaoId) {
    try {
        const botaoCurtir = document.querySelector(`.botao-curtir[data-id="${atualizacaoId}"]`);
        if (botaoCurtir.disabled) return;
        botaoCurtir.disabled = true;
        
        // Tentar diferentes endpoints dependendo do contexto
        let response;
        if (typeof clubeId !== 'undefined') {
            // Página do clube
            response = await fetch(`/api/clube/${clubeId}/atualizacoes/${atualizacaoId}/curtir`, {
                method: 'POST'
            });
        } else {
            // Páginas de perfil
            response = await fetch(`/api/curtidas/${atualizacaoId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        
        if (!response.ok) throw new Error('Erro ao processar curtida');
        
        const data = await response.json();
        
        // Atualizar estado local e sincronizar
        const curtido = data.curtido || data.curtiu;
        const total = data.total;
        
        CurtidasSyncManager.atualizarUI(atualizacaoId, curtido, total);
        CurtidasSyncManager.salvarEstado(atualizacaoId, curtido, total);
        
        botaoCurtir.disabled = false;
    } catch (error) {
        console.error('Erro ao alternar curtida:', error);
        
        const botaoCurtir = document.querySelector(`.botao-curtir[data-id="${atualizacaoId}"]`);
        if (botaoCurtir) botaoCurtir.disabled = false;
        
        alert('Não foi possível processar sua curtida. Tente novamente.');
    }
}
function atualizarBotaoCurtida(idAtualizacao, curtido, totalCurtidas) {
    const botaoCurtir = document.querySelector(`.botao-curtir[data-id="${idAtualizacao}"]`);
    const contadorCurtidas = document.querySelector(`.contador-curtidas[data-id="${idAtualizacao}"]`);
    
    if (botaoCurtir) {
        if (curtido) {
            botaoCurtir.classList.add('curtido');
            botaoCurtir.innerHTML = '<i class="far fa-heart"></i>';
        } else {
            botaoCurtir.classList.remove('curtido');
            botaoCurtir.innerHTML = '<i class="fas fa-heart"></i>';
        }
    }
    
    if (contadorCurtidas) {
        contadorCurtidas.textContent = totalCurtidas > 0 ? totalCurtidas : '';
        contadorCurtidas.style.display = totalCurtidas > 0 ? 'inline-block' : 'none';
    }
}
async function carregarEstadoCurtidas(atualizacaoId) {
    try {
        // Primeiro verificar se há estado cached no localStorage
        const estadoLocal = CurtidasSyncManager.lerEstado();
        if (estadoLocal[atualizacaoId]) {
            const { curtido, total } = estadoLocal[atualizacaoId];
            CurtidasSyncManager.atualizarUI(atualizacaoId, curtido, total);
            return;
        }
        
        // Se não há cache, buscar do servidor
        let response;
        if (typeof clubeId !== 'undefined') {
            // Página do clube
            response = await fetch(`/api/clube/${clubeId}/atualizacoes/${atualizacaoId}/curtidas`);
        } else {
            // Páginas de perfil
            response = await fetch(`/api/curtidas/${atualizacaoId}/status`);
        }
        
        if (!response.ok) {
            console.warn('Rota de curtidas não encontrada, ignorando...'); 
            return; // Não gerar erro, apenas ignorar
        }
        
        const data = await response.json();
        const curtido = data.curtido || data.curtiu;
        const total = data.total;
        
        // Atualizar UI e salvar no cache
        CurtidasSyncManager.atualizarUI(atualizacaoId, curtido, total);
        CurtidasSyncManager.salvarEstado(atualizacaoId, curtido, total);
        
    } catch (error) {
        console.error('Erro ao carregar estado das curtidas:', error);
    }
}

// Inicializar o sistema de sincronização quando o script for carregado
document.addEventListener('DOMContentLoaded', () => {
    CurtidasSyncManager.inicializar();
});