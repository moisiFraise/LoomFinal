document.addEventListener('DOMContentLoaded', () => {
    // Garantir que os modals estejam ocultos ao carregar a página
    const overlay = document.getElementById('overlay-atualizacao');
    const modal = document.getElementById('modal-atualizacao');
    
    if (overlay) {
        overlay.classList.remove('show');
    }
    
    if (modal) {
        modal.classList.remove('show');
    }
    
    carregarAtualizacoes();
});
let leituraAtualInfo = null, atualizacaoParaEditar = null;

async function carregarAtualizacoes() {
    try {
        const response = await fetch(`/api/clube/${clubeId}/atualizacoes`);
        if (!response.ok) throw new Error('Erro ao carregar atualizações');
        const data = await response.json();
        leituraAtualInfo = data.leituraAtual;
        renderizarImagemLeituraAtual(data.leituraAtual);
        renderizarAtualizacoes(data.atualizacoes);
    } catch (error) {
        console.error('Erro ao carregar atualizações:', error);
        document.getElementById('atualizacoes-lista').innerHTML = 
            `<div class="erro-carregamento">Erro ao carregar atualizações. Tente novamente mais tarde.</div>`;
    }
}

async function renderizarImagemLeituraAtual(leituraAtual) {
    // Função removida - a imagem da leitura atual é agora gerenciada pelo clubePrincipal.js
    return;
}

async function calcularProgressoGeral(leituraAtual) {
    try {
        const response = await fetch(`/api/clube/${clubeId}/atualizacoes/usuario/${userId}/leitura/${leituraAtual.id}`);
        if (!response.ok) return 0;
        const data = await response.json();
        return data?.ultimaAtualizacao?.porcentagem_leitura || 0;
    } catch (error) {
        console.error('Erro ao calcular progresso geral:', error);
        return 0;
    }
}

function renderizarAtualizacoes(atualizacoes) {
    const container = document.getElementById('atualizacoes-lista');
    if (!atualizacoes || atualizacoes.length === 0) {
        container.innerHTML = `<div class="sem-atualizacoes">Nenhuma atualização de leitura disponível.</div>`;
        return;
    }
    
    container.innerHTML = atualizacoes.map(a => {
        const data = new Date(a.data_postagem);
        const dataFormatada = data.toLocaleDateString('pt-BR') + ' às ' + 
                             data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        const isAutor = a.id_usuario == userId;
        
        // Criar avatar do usuário
        const avatarHtml = a.foto_perfil ? 
            `<img src="${a.foto_perfil}" alt="${a.nome_usuario}" onerror="this.parentElement.innerHTML='<div class=\\'usuario-avatar-placeholder\\'>${a.nome_usuario.charAt(0).toUpperCase()}</div>'">` :
            `<div class="usuario-avatar-placeholder">${a.nome_usuario.charAt(0).toUpperCase()}</div>`;
        
        const botoesAcao = isAutor ? `
            <div class="atualizacao-acoes">
                <button class="botao-editar" onclick="editarAtualizacao(${a.id})" title="Editar">
                    <i class="fa fa-edit"></i>
                </button>
                <button class="botao-excluir" onclick="excluirAtualizacao(${a.id})" title="Excluir">
                    <i class="fa fa-trash"></i>
                </button>
            </div>` : `
            <div class="atualizacao-acoes">
                <div class="menu-opcoes" data-id="${a.id}">
                    <button class="botao-opcoes" onclick="toggleMenuOpcoes(${a.id})" title="Opções">
                        <i class="fa fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-opcoes" id="dropdown-${a.id}" style="display: none;">
                        <button onclick="abrirModalDenuncia(${a.id}, '${a.nome_usuario.replace(/'/g, "\\'")}'); event.stopPropagation();" class="opcao-denuncia">
                            <i class="fa fa-flag"></i> Denunciar
                        </button>
                    </div>
                </div>
            </div>`;
        
        return `
            <div class="atualizacao-item" data-id="${a.id}">
                <div class="atualizacao-header">
                    <div class="atualizacao-usuario-info">
                        <div class="usuario-avatar" onclick="irParaPerfil(${a.id_usuario})" title="Ver perfil de ${a.nome_usuario}">
                            ${avatarHtml}
                        </div>
                        <div class="atualizacao-usuario-data">
                            <span class="atualizacao-usuario" onclick="irParaPerfil(${a.id_usuario})" title="Ver perfil de ${a.nome_usuario}">
                                ${a.nome_usuario}
                                ${a.usuario_saiu_do_clube ? '<span class="usuario-saiu-clube">(não faz mais parte do clube)</span>' : ''}
                                ${a.emocao_emoji ? `<span class="atualizacao-emocao" style="background-color: ${a.emocao_cor}">${a.emocao_emoji} ${a.emocao_nome}</span>` : ''}
                            </span>
                            <span class="atualizacao-data">${dataFormatada}</span>
                        </div>
                    </div>
                    ${botoesAcao}
                </div>
                <div class="atualizacao-conteudo">${a.conteudo}</div>
                ${a.gif_url ? `<div class="gif-container"><img src="${a.gif_url}" alt="GIF" loading="lazy"></div>` : ''}
                <div class="atualizacao-footer">
                    <div class="atualizacao-progresso">
                        <div class="progresso-barra-container">
                            <div class="progresso-barra" style="width: ${a.porcentagem_leitura}%"></div>
                        </div>
                        <span class="progresso-texto">${a.porcentagem_leitura}%</span>
                    </div>
                    <div class="atualizacao-interacoes">
                        <button class="botao-curtir" data-id="${a.id}" onclick="alternarCurtida(${a.id})">
                            <i class="fa fa-heart-o"></i>
                        </button>
                        <span class="contador-curtidas" data-id="${a.id}"></span>
                        <button class="botao-comentar" onclick="comentariosManager.toggleComentarios(${a.id}, 'comentarios-${a.id}', ${userId})">
                            <i class="fa fa-comment-o"></i>
                            <span class="comentarios-count" data-atualizacao-id="${a.id}">0</span>
                        </button>
                    </div>
                </div>
                <div class="comentarios-container" id="comentarios-${a.id}" style="display: none;"></div>
                </div>
            </div>`;
    }).join('');
    
    // Carregar estado das curtidas e contadores de comentários
    atualizacoes.forEach(a => {
        if (typeof carregarEstadoCurtidas === 'function') {
            carregarEstadoCurtidas(a.id);
        }
        carregarContadorComentarios(a.id);
    });
}

// Função para ir ao perfil do usuário
function irParaPerfil(idUsuario) {
    if (idUsuario == userId) {
        // Se for o próprio usuário, vai para "Meu Perfil"
        window.location.href = '/meuPerfil';
    } else {
        // Se for outro usuário, vai para o perfil público
        window.location.href = `/perfil/${idUsuario}`;
    }
}

// Certifique-se de que o evento de clique fora do dropdown funcione corretamente
document.addEventListener('click', (event) => {
    if (!event.target.closest('.menu-opcoes')) {
        document.querySelectorAll('.dropdown-opcoes').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
});

function toggleMenuOpcoes(atualizacaoId) {
    const dropdown = document.getElementById(`dropdown-${atualizacaoId}`);
    const todosDropdowns = document.querySelectorAll('.dropdown-opcoes');
    
    todosDropdowns.forEach(d => {
        if (d.id !== `dropdown-${atualizacaoId}`) {
            d.style.display = 'none';
        }
    });
    
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', (event) => {
    if (!event.target.closest('.menu-opcoes')) {
        document.querySelectorAll('.dropdown-opcoes').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
});

function criarModalDenuncia() {
    const modalHTML = `
        <div id="overlay-denuncia" class="overlay-denuncia" onclick="fecharModalDenuncia()"></div>
        <div id="modal-denuncia" class="modal modal-denuncia" tabindex="-1">
            <div class="modal-header">
                <h3>Denunciar Comentário</h3>
                <button class="modal-close" onclick="fecharModalDenuncia()" type="button">
                    <i class="fa fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="denuncia-atualizacao-id">
                <p>Você está denunciando o comentário de: <strong id="denuncia-usuario-nome"></strong></p>
                
                <div class="form-group">
                    <label for="denuncia-motivo">Motivo da denúncia:</label>
                    <select id="denuncia-motivo" required>
                        <option value="">Selecione um motivo</option>
                        <option value="spam">Spam</option>
                        <option value="conteudo_inadequado">Conteúdo inadequado</option>
                        <option value="assedio">Assédio</option>
                        <option value="discurso_odio">Discurso de ódio</option>
                        <option value="outro">Outro</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="denuncia-descricao">Descrição (opcional):</label>
                    <textarea id="denuncia-descricao" placeholder="Descreva o problema com mais detalhes..." rows="4"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-cancelar" onclick="fecharModalDenuncia()">Cancelar</button>
                <button type="button" class="btn-confirmar" onclick="enviarDenuncia()">Enviar Denúncia</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('Modal HTML inserido no DOM');
}

function abrirModalDenuncia(atualizacaoId, nomeUsuario) {
    console.log('Abrindo modal de denúncia para:', atualizacaoId, nomeUsuario);
    
    const dropdown = document.getElementById(`dropdown-${atualizacaoId}`);
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    
    const modalExistente = document.getElementById('modal-denuncia');
    const overlayExistente = document.getElementById('overlay-denuncia');
    if (modalExistente) modalExistente.remove();
    if (overlayExistente) overlayExistente.remove();
    
    criarModalDenuncia();
    
    requestAnimationFrame(() => {
        const atualizacaoIdInput = document.getElementById('denuncia-atualizacao-id');
        const usuarioNomeSpan = document.getElementById('denuncia-usuario-nome');
        const motivoSelect = document.getElementById('denuncia-motivo');
        const descricaoTextarea = document.getElementById('denuncia-descricao');
        
        if (atualizacaoIdInput) atualizacaoIdInput.value = atualizacaoId;
        if (usuarioNomeSpan) usuarioNomeSpan.textContent = nomeUsuario;
        if (motivoSelect) motivoSelect.value = '';
        if (descricaoTextarea) descricaoTextarea.value = '';
        
        const overlay = document.getElementById('overlay-denuncia');
        const modal = document.getElementById('modal-denuncia');
        
        if (overlay && modal) {
            overlay.classList.add('show');
            modal.classList.add('show');
            
            const overlayStyles = window.getComputedStyle(overlay);
            const modalStyles = window.getComputedStyle(modal);
            
            console.log('Overlay display:', overlayStyles.display);
            console.log('Modal display:', modalStyles.display);
            console.log('Overlay z-index:', overlayStyles.zIndex);
            console.log('Modal z-index:', modalStyles.zIndex);
            
            modal.focus();
            
            console.log('Modal de denúncia aberto com classes');
        } else {
            console.error('Elementos do modal não encontrados após criação');
        }
    });
}

function fecharModalDenuncia() {
    const overlay = document.getElementById('overlay-denuncia');
    const modal = document.getElementById('modal-denuncia');
    
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 300);
    }
    
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 300);
    }
}

async function enviarDenuncia() {
    try {
        const atualizacaoId = document.getElementById('denuncia-atualizacao-id').value;
        const motivo = document.getElementById('denuncia-motivo').value;
        const descricao = document.getElementById('denuncia-descricao').value;
        
        if (!motivo) {
            alert('Por favor, selecione um motivo para a denúncia');
            return;
        }
        
        const botaoEnviar = document.querySelector('.btn-confirmar');
        const textoOriginal = botaoEnviar.textContent;
        botaoEnviar.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Enviando...';
        botaoEnviar.disabled = true;
        
        const response = await fetch('/api/denuncias', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                idAtualizacao: atualizacaoId,
                motivo: motivo,
                descricao: descricao
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.erro || 'Erro ao enviar denúncia');
        }
        
        fecharModalDenuncia();
        
        // Mostrar mensagem de sucesso
        mostrarMensagemSucesso('Denúncia enviada com sucesso! Será analisada em breve.');
        
    } catch (error) {
        console.error('Erro ao enviar denúncia:', error);
        alert(error.message || 'Erro ao enviar denúncia. Tente novamente.');
    } finally {
        const botaoEnviar = document.querySelector('.btn-confirmar');
        if (botaoEnviar) {
            botaoEnviar.textContent = 'Enviar Denúncia';
            botaoEnviar.disabled = false;
        }
    }
}

function mostrarMensagemSucesso(mensagem) {
    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = 'mensagem-sucesso';
    mensagemDiv.textContent = mensagem;
    document.body.appendChild(mensagemDiv);
    
    setTimeout(() => {
        if (document.body.contains(mensagemDiv)) {
            document.body.removeChild(mensagemDiv);
        }
    }, 5000);
}

async function abrirModalAtualizacao(event) {
    if (!event || event.type !== 'click' || !event.isTrusted) {
        console.log('Tentativa de abrir modal automaticamente bloqueada');
        return;
    }
    if (!leituraAtualInfo) {
        try {
            const response = await fetch(`/api/clube/${clubeId}/atualizacoes`);
            if (response.ok) leituraAtualInfo = (await response.json()).leituraAtual;
        } catch (error) {
            console.error('Erro ao carregar leitura atual:', error);
        }
    }
    
    if (!leituraAtualInfo) {
        alert('Não há leitura atual neste clube');
        return;
    }
    
    atualizacaoParaEditar = null;
    document.getElementById('atualizacao-comentario').value = '';
    document.getElementById('atualizacao-pagina').value = '';
    document.getElementById('porcentagem-valor').textContent = '0%';
    
    // Limpar seleção de emoção
    if (typeof emocaoSelecionada !== 'undefined') {
        emocaoSelecionada = null;
        document.querySelectorAll('.emocao-item').forEach(item => {
            item.classList.remove('selecionada');
        });
    }
    
    const modalTitulo = document.getElementById('modal-titulo');
    if (modalTitulo) modalTitulo.textContent = 'Nova Atualização de Leitura';
    
    const confirmarBtn = document.getElementById('confirmarAtualizacao');
    if (confirmarBtn) confirmarBtn.textContent = 'Publicar';
    
    const overlay = document.getElementById('overlay-atualizacao');
    const modal = document.getElementById('modal-atualizacao');
    
    if (overlay && modal) {
        overlay.classList.add('show');
        modal.classList.add('show');
    }
    
    setTimeout(() => {
        const comentarioInput = document.getElementById('atualizacao-comentario');
        if (comentarioInput) comentarioInput.focus();
    }, 300);
    
    const paginaInput = document.getElementById('atualizacao-pagina');
    if (paginaInput) {
        paginaInput.removeEventListener('input', calcularPorcentagem);
        paginaInput.addEventListener('input', calcularPorcentagem);
    }
}

function editarAtualizacao(id) {
    fetch(`/api/clube/${clubeId}/atualizacoes/${id}`)
        .then(response => {
            if (!response.ok) throw new Error('Erro ao buscar atualização');
            return response.json();
        })
        .then(atualizacao => {
            atualizacaoParaEditar = atualizacao;
            document.getElementById('atualizacao-comentario').value = atualizacao.conteudo;
            
            const paginaAtual = leituraAtualInfo && leituraAtualInfo.paginas 
                ? Math.round((atualizacao.porcentagem_leitura / 100) * leituraAtualInfo.paginas) : 0;
                
            document.getElementById('atualizacao-pagina').value = paginaAtual > 0 ? paginaAtual : '';
            document.getElementById('porcentagem-valor').textContent = `${atualizacao.porcentagem_leitura}%`;
            
            if (document.getElementById('modal-titulo')) 
                document.getElementById('modal-titulo').textContent = 'Editar Atualização';
            
            if (document.getElementById('confirmarAtualizacao'))
                document.getElementById('confirmarAtualizacao').textContent = 'Salvar Alterações';
            
            const overlay = document.getElementById('overlay-atualizacao');
            const modal = document.getElementById('modal-atualizacao');
            
            if (overlay && modal) {
                overlay.classList.add('show');
                modal.classList.add('show');
            }
            
            setTimeout(() => {
                const comentarioInput = document.getElementById('atualizacao-comentario');
                if (comentarioInput) {
                    comentarioInput.focus();
                    comentarioInput.selectionStart = comentarioInput.selectionEnd = comentarioInput.value.length;
                }
            }, 300);
            
            const paginaInput = document.getElementById('atualizacao-pagina');
            if (paginaInput) {
                paginaInput.removeEventListener('input', calcularPorcentagem);
                paginaInput.addEventListener('input', calcularPorcentagem);
            }
        })
        .catch(error => {
            console.error('Erro ao editar atualização:', error);
            alert('Erro ao carregar dados da atualização. Tente novamente.');
        });
}

function excluirAtualizacao(id) {
    if (confirm('Tem certeza que deseja excluir esta atualização?')) {
        fetch(`/api/clube/${clubeId}/atualizacoes/${id}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) throw new Error('Erro ao excluir atualização');
                return response.json();
            })
            .then(() => {
                carregarAtualizacoes();
                const mensagem = document.createElement('div');
                mensagem.className = 'mensagem-sucesso';
                mensagem.textContent = 'Atualização excluída com sucesso!';
                document.body.appendChild(mensagem);
                setTimeout(() => document.body.removeChild(mensagem), 3000);
            })
            .catch(error => {
                console.error('Erro ao excluir atualização:', error);
                alert('Erro ao excluir atualização. Tente novamente.');
            });
    }
}

function fecharModalAtualizacao() {
    const overlay = document.getElementById('overlay-atualizacao');
    const modal = document.getElementById('modal-atualizacao');
    
    if (overlay) {
        overlay.classList.remove('show');
    }
    
    if (modal) {
        modal.classList.remove('show');
    }
}

function calcularPorcentagem() {
    const paginaAtual = parseInt(document.getElementById('atualizacao-pagina').value) || 0;
    const totalPaginas = leituraAtualInfo?.paginas || 100;
    let porcentagem = Math.min(Math.round((paginaAtual / totalPaginas) * 100), 100);
    
    document.getElementById('porcentagem-valor').textContent = `${isNaN(porcentagem) ? 0 : porcentagem}%`;
    
    const porcentagemContainer = document.getElementById('porcentagem-container');
    if (porcentagemContainer) {
        if (porcentagem < 25) {
            porcentagemContainer.style.color = '#FF5733';
        } else if (porcentagem < 50) {
            porcentagemContainer.style.color = '#FFC107';
        } else if (porcentagem < 75) {
            porcentagemContainer.style.color = '#2196F3';
        } else {
            porcentagemContainer.style.color = '#4CAF50';
        }
    }
}

async function salvarAtualizacao() {
    try {
        const comentario = document.getElementById('atualizacao-comentario').value.trim();
        const paginaAtual = parseInt(document.getElementById('atualizacao-pagina').value);
        const gifUrl = document.getElementById('atualizacao-gif-url') ? document.getElementById('atualizacao-gif-url').value : '';
        
        if (!comentario) {
            alert('Por favor, compartilhe seus pensamentos sobre o livro');
            document.getElementById('atualizacao-comentario').focus();
            return;
        }
        
        if (!paginaAtual || paginaAtual <= 0) {
            alert('Por favor, informe uma página válida');
            document.getElementById('atualizacao-pagina').focus();
            return;
        }
        
        const botaoConfirmar = document.getElementById('confirmarAtualizacao');
        const textoOriginal = botaoConfirmar.textContent;
        botaoConfirmar.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Salvando...';
        botaoConfirmar.disabled = true;
        
        const url = atualizacaoParaEditar 
            ? `/api/clube/${clubeId}/atualizacoes/${atualizacaoParaEditar.id}`
            : `/api/clube/${clubeId}/atualizacoes`;
        
        // Obter emoção selecionada (se disponível)
        const idEmocao = emocaoSelecionada || null;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conteudo: comentario, paginaAtual, gifUrl, idEmocao })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.erro || data.mensagem || 'Erro ao publicar atualização');
        
        fecharModalAtualizacao();
        carregarAtualizacoes();
        
        const mensagem = document.createElement('div');
        mensagem.className = 'mensagem-sucesso';
        mensagem.textContent = atualizacaoParaEditar 
            ? 'Atualização editada com sucesso!' 
            : 'Atualização publicada com sucesso!';
        document.body.appendChild(mensagem);
        setTimeout(() => document.body.removeChild(mensagem), 3000);
        
    } catch (error) {
        alert(error.message || 'Erro ao publicar atualização. Tente novamente.');
        console.error('Erro ao salvar atualização:', error);
    } finally {
        const botaoConfirmar = document.getElementById('confirmarAtualizacao');
        if (botaoConfirmar) {
            botaoConfirmar.textContent = atualizacaoParaEditar ? 'Salvar Alterações' : 'Publicar';
            botaoConfirmar.disabled = false;
        }
    }
}

// Função para carregar contador de comentários
async function carregarContadorComentarios(idAtualizacao) {
    try {
        const response = await fetch(`/api/comentarios/${idAtualizacao}/count`);
        if (response.ok) {
            const data = await response.json();
            const contador = document.querySelector(`[data-atualizacao-id="${idAtualizacao}"]`);
            if (contador) {
                contador.textContent = data.total;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar contador de comentários:', error);
    }
}
