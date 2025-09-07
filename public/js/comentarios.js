class ComentariosManager {
    constructor() {
        this.comentarios = new Map();
        this.init();
    }

    init() {
        console.log('ComentariosManager inicializado');
    }

    async carregarComentarios(idAtualizacao) {
        try {
            const response = await fetch(`/api/comentarios/${idAtualizacao}`);
            
            if (!response.ok) {
                throw new Error('Erro ao carregar comentários');
            }
            
            const comentarios = await response.json();
            this.comentarios.set(idAtualizacao, comentarios);
            
            return comentarios;
        } catch (error) {
            console.error('Erro ao carregar comentários:', error);
            throw error;
        }
    }

    async adicionarComentario(idAtualizacao, conteudo) {
        try {
            if (!conteudo.trim()) {
                throw new Error('Comentário não pode estar vazio');
            }

            const response = await fetch('/api/comentarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idAtualizacao: idAtualizacao,
                    conteudo: conteudo.trim()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.erro || 'Erro ao adicionar comentário');
            }

            const result = await response.json();
            
            // Recarregar comentários para atualizar a lista
            await this.carregarComentarios(idAtualizacao);
            
            return result;
        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
            throw error;
        }
    }

    async editarComentario(idComentario, novoConteudo) {
        try {
            if (!novoConteudo.trim()) {
                throw new Error('Comentário não pode estar vazio');
            }

            const response = await fetch(`/api/comentarios/${idComentario}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conteudo: novoConteudo.trim()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.erro || 'Erro ao editar comentário');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao editar comentário:', error);
            throw error;
        }
    }

    async excluirComentario(idComentario) {
        try {
            const response = await fetch(`/api/comentarios/${idComentario}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.erro || 'Erro ao excluir comentário');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao excluir comentário:', error);
            throw error;
        }
    }

    async contarComentarios(idAtualizacao) {
        try {
            const response = await fetch(`/api/comentarios/${idAtualizacao}/count`);
            
            if (!response.ok) {
                throw new Error('Erro ao contar comentários');
            }
            
            const result = await response.json();
            return result.total;
        } catch (error) {
            console.error('Erro ao contar comentários:', error);
            return 0;
        }
    }

    renderizarComentarios(idAtualizacao, containerId, currentUserId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container de comentários não encontrado:', containerId);
            return;
        }

        const comentarios = this.comentarios.get(idAtualizacao) || [];
        
        container.innerHTML = `
            <div class="comentarios-section">
                <h4 class="comentarios-titulo">
                    <i class="far fa-comment"></i>
                    Comentários (${comentarios.length})
                </h4>
                
                <div class="comentario-form">
                    <textarea 
                        id="comentario-input-${idAtualizacao}" 
                        class="comentario-textarea" 
                        placeholder="Escreva um comentário..."
                        rows="3"
                    ></textarea>
                    <div class="comentario-actions">
                        <button 
                            class="btn-comentar" 
                            onclick="comentariosManager.adicionarComentarioHandler(${idAtualizacao}, '${containerId}', ${currentUserId})"
                        >
                            <i class="fas fa-paper-plane"></i>
                            Comentar
                        </button>
                    </div>
                </div>

                <div class="comentarios-lista" id="comentarios-lista-${idAtualizacao}">
                    ${comentarios.map(comentario => this.renderizarComentario(comentario, currentUserId, idAtualizacao, containerId)).join('')}
                </div>
            </div>
        `;
    }

    renderizarComentario(comentario, currentUserId, idAtualizacao, containerId) {
    const dataFormatada = new Date(comentario.data_comentario).toLocaleString('pt-BR');
    const podeEditarOuExcluir = 
        comentario.id_usuario === currentUserId || comentario.id_autor_atualizacao === currentUserId;

    const avatarHtml = comentario.foto_perfil 
        ? `<img src="${comentario.foto_perfil}" alt="${comentario.nome_usuario}" 
                 onerror="this.parentElement.innerHTML='<div class=\\'usuario-avatar-placeholder\\'>${comentario.nome_usuario.charAt(0).toUpperCase()}</div>'">`
        : `<div class="usuario-avatar-placeholder">${comentario.nome_usuario.charAt(0).toUpperCase()}</div>`;
    
    return `
        <div class="comentario-item" id="comentario-${comentario.id}">
            <div class="comentario-header">
                <div class="comentario-avatar" onclick="irParaPerfil(${comentario.id_usuario})" title="Ver perfil de ${comentario.nome_usuario}">
                    ${avatarHtml}
                </div>
                <div class="comentario-info">
                    <span class="comentario-autor" onclick="irParaPerfil(${comentario.id_usuario})" title="Ver perfil de ${comentario.nome_usuario}">${comentario.nome_usuario}</span>
                    <span class="comentario-data">${dataFormatada}</span>
                </div>
                ${podeEditarOuExcluir ? `
                    <div class="comentario-menu">
                        <button class="btn-menu-comentario" onclick="this.nextElementSibling.classList.toggle('show')">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="comentario-menu-dropdown">
    <button onclick="comentariosManager.excluirComentarioHandler(${comentario.id}, ${idAtualizacao}, '${containerId}', ${currentUserId})">
        <i class="fas fa-trash"></i> Excluir
    </button>
</div>
                    </div>
                ` : ''}
            </div>
            <div class="comentario-conteudo" id="comentario-conteudo-${comentario.id}">
                ${comentario.conteudo}
            </div>
            ${comentario.gif_url ? `<div class="gif-container"><img src="${comentario.gif_url}" alt="GIF" loading="lazy"></div>` : ''}
        </div>
    `;
}


    async adicionarComentarioHandler(idAtualizacao, containerId, currentUserId) {
        try {
            const input = document.getElementById(`comentario-input-${idAtualizacao}`);
            const conteudo = input.value.trim();
            
           if (!conteudo) {
    Swal.fire({
        icon: 'warning',
        title: 'Ops!',
        text: 'Por favor, escreva um comentário antes de enviar.'
    });
    return;
}
            const btn = event.target.closest('.btn-comentar');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            btn.disabled = true;

            await this.adicionarComentario(idAtualizacao, conteudo);
            input.value = '';
            this.renderizarComentarios(idAtualizacao, containerId, currentUserId);
            
            // Atualizar contador na interface
            this.atualizarContadorComentarios(idAtualizacao);

        } catch (error) {
    Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao adicionar comentário: ' + error.message
    });
} finally {
            const btn = document.querySelector('.btn-comentar');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Comentar';
                btn.disabled = false;
            }
        }
    }

    async editarComentarioHandler(idComentario, idAtualizacao, containerId, currentUserId) {
        try {
            const comentarioElement = document.getElementById(`comentario-conteudo-${idComentario}`);
            const conteudoAtual = comentarioElement.textContent.trim();
            
            const novoConteudo = prompt('Editar comentário:', conteudoAtual);
            
            if (novoConteudo === null) return; // Usuário cancelou
            
            if (!novoConteudo.trim()) {
    Swal.fire({
        icon: 'warning',
        title: 'Ops!',
        text: 'Comentário não pode estar vazio.'
    });
    return;
}

            await this.editarComentario(idComentario, novoConteudo);
            await this.carregarComentarios(idAtualizacao);
            this.renderizarComentarios(idAtualizacao, containerId, currentUserId);
            
       } catch (error) {
    Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao editar comentário: ' + error.message
    });
}
    }
async excluirComentarioHandler(idComentario, idAtualizacao, containerId, currentUserId) {
    try {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: 'Você não poderá reverter esta ação!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) {
            return;
        }

        await this.excluirComentario(idComentario);
        await this.carregarComentarios(idAtualizacao);
        this.renderizarComentarios(idAtualizacao, containerId, currentUserId);

        // Atualizar contador na interface
        this.atualizarContadorComentarios(idAtualizacao);

        Swal.fire({
            icon: 'success',
            title: 'Excluído!',
            text: 'O comentário foi removido com sucesso.',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Erro ao excluir comentário: ' + error.message
        });
    }
}

    async atualizarContadorComentarios(idAtualizacao) {
        try {
            const total = await this.contarComentarios(idAtualizacao);
            const contador = document.querySelector(`[data-atualizacao-id="${idAtualizacao}"] .comentarios-count`);
            if (contador) {
                contador.textContent = total;
            }
        } catch (error) {
            console.error('Erro ao atualizar contador de comentários:', error);
        }
    }

    async initComentariosParaAtualizacao(idAtualizacao, containerId, currentUserId) {
        try {
            await this.carregarComentarios(idAtualizacao);
            this.renderizarComentarios(idAtualizacao, containerId, currentUserId);
        } catch (error) {
            console.error('Erro ao inicializar comentários:', error);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '<p class="erro-comentarios">Erro ao carregar comentários.</p>';
            }
        }
    }

    toggleComentarios(idAtualizacao, containerId, currentUserId) {
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.error('Container de comentários não encontrado');
            return;
        }

        if (container.style.display === 'none' || !container.style.display) {
            container.style.display = 'block';
            if (!this.comentarios.has(idAtualizacao)) {
                this.initComentariosParaAtualizacao(idAtualizacao, containerId, currentUserId);
            }
        } else {
            container.style.display = 'none';
        }
    }
}

// Função para ir ao perfil do usuário (igual às atualizações)
function irParaPerfil(idUsuario) {
    if (typeof userId !== 'undefined' && idUsuario == userId) {
        // Se for o próprio usuário, vai para "Meu Perfil"
        window.location.href = '/meuPerfil';
    } else {
        // Se for outro usuário, vai para o perfil público
        window.location.href = `/perfil/${idUsuario}`;
    }
}

// Fechar menus dropdown quando clicar fora
document.addEventListener('click', function(event) {
    if (!event.target.closest('.comentario-menu')) {
        document.querySelectorAll('.comentario-menu-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

// Instância global do gerenciador de comentários
const comentariosManager = new ComentariosManager();
