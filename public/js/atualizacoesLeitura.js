let todasAtualizacoes = [];
let atualizacoesFiltradas = [];
let filtroAtual = 'todos';
let ordenacaoAtual = 'recente';

document.addEventListener('DOMContentLoaded', function() {
    carregarInformacoesLeitura();
    carregarAtualizacoesLeitura();
});

async function carregarInformacoesLeitura() {
    try {
        const response = await fetch(`/api/clube/${clubeId}/leitura/${idLeitura}`);
        if (!response.ok) throw new Error('Erro ao carregar informações da leitura');
        
        const leitura = await response.json();
        renderizarInformacoesLeitura(leitura);
    } catch (error) {
        console.error('Erro ao carregar informações da leitura:', error);
        document.getElementById('leitura-info-card').innerHTML = 
            '<div class="erro-carregamento">Erro ao carregar informações da leitura</div>';
    }
}

function renderizarInformacoesLeitura(leitura) {
    const container = document.getElementById('leitura-info-card');
    
    container.innerHTML = `
        ${leitura.imagemUrl ? `
            <div class="leitura-capa-info">
                <img src="${leitura.imagemUrl}" alt="${leitura.titulo}">
            </div>
        ` : ''}
        <div class="leitura-detalhes">
            <h4>${leitura.titulo}</h4>
            <p><strong>Autor:</strong> ${leitura.autor || 'Não informado'}</p>
            ${leitura.paginas ? `<p><strong>Páginas:</strong> ${leitura.paginas}</p>` : ''}
            <p><strong>Início:</strong> ${new Date(leitura.data_inicio).toLocaleDateString('pt-BR')}</p>
            ${leitura.data_fim ? `<p><strong>Previsão de término:</strong> ${new Date(leitura.data_fim).toLocaleDateString('pt-BR')}</p>` : ''}
            
            <div class="estatisticas-leitura">
                <div class="estatistica-item">
                    <span class="estatistica-numero" id="total-atualizacoes">0</span>
                    <span class="estatistica-label">Atualizações</span>
                </div>
                <div class="estatistica-item">
                    <span class="estatistica-numero" id="membros-participando">0</span>
                    <span class="estatistica-label">Participantes</span>
                </div>
                <div class="estatistica-item">
                    <span class="estatistica-numero" id="progresso-medio">0%</span>
                    <span class="estatistica-label">Progresso Médio</span>
                </div>
            </div>
        </div>
    `;
}

async function carregarAtualizacoesLeitura() {
    try {
        const response = await fetch(`/api/clube/${clubeId}/leitura/${idLeitura}/atualizacoes`);
        if (!response.ok) throw new Error('Erro ao carregar atualizações');
        
        const data = await response.json();
        todasAtualizacoes = data.atualizacoes || [];
        
        atualizarEstatisticas(data);
        aplicarFiltroEOrdenacao();
        
    } catch (error) {
        console.error('Erro ao carregar atualizações:', error);
        document.getElementById('atualizacoes-lista').innerHTML = 
            '<div class="erro-carregamento">Erro ao carregar atualizações. Tente novamente mais tarde.</div>';
    }
}
function atualizarEstatisticas(data) {
    const totalAtualizacoes = data.atualizacoes ? data.atualizacoes.length : 0;
    const membrosParticipando = data.estatisticas ? data.estatisticas.membros_participando : 0;
    const progressoMedio = data.estatisticas ? Math.round(data.estatisticas.progresso_medio) : 0;
    
    document.getElementById('total-atualizacoes').textContent = totalAtualizacoes;
    document.getElementById('membros-participando').textContent = membrosParticipando;
    document.getElementById('progresso-medio').textContent = `${progressoMedio}%`;
}

function filtrarAtualizacoes(filtro) {
    filtroAtual = filtro;
    
    // Atualizar botões de filtro
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('ativo');
    });
    document.querySelector(`[data-filtro="${filtro}"]`).classList.add('ativo');
    
    aplicarFiltroEOrdenacao();
}

function ordenarAtualizacoes() {
    ordenacaoAtual = document.getElementById('ordenacao').value;
    aplicarFiltroEOrdenacao();
}

function aplicarFiltroEOrdenacao() {
    // Aplicar filtro
    switch(filtroAtual) {
        case 'meus':
            atualizacoesFiltradas = todasAtualizacoes.filter(a => a.id_usuario == userId);
            break;
        case 'outros':
            atualizacoesFiltradas = todasAtualizacoes.filter(a => a.id_usuario != userId);
            break;
        default:
            atualizacoesFiltradas = [...todasAtualizacoes];
    }
    
    // Aplicar ordenação
    switch(ordenacaoAtual) {
        case 'antigo':
            atualizacoesFiltradas.sort((a, b) => new Date(a.data_postagem) - new Date(b.data_postagem));
            break;
        case 'progresso':
            atualizacoesFiltradas.sort((a, b) => b.porcentagem_leitura - a.porcentagem_leitura);
            break;
        default: // recente
            atualizacoesFiltradas.sort((a, b) => new Date(b.data_postagem) - new Date(a.data_postagem));
    }
    
    renderizarAtualizacoes();
}

function renderizarAtualizacoes() {
    const container = document.getElementById('atualizacoes-lista');
    
    if (!atualizacoesFiltradas || atualizacoesFiltradas.length === 0) {
        let mensagem = 'Nenhuma atualização encontrada.';
        if (filtroAtual === 'meus') {
            mensagem = 'Você ainda não fez nenhuma atualização para esta leitura.';
        } else if (filtroAtual === 'outros') {
            mensagem = 'Outros membros ainda não fizeram atualizações para esta leitura.';
        }
        
        container.innerHTML = `
            <div class="sem-atualizacoes">
                <i class="fa fa-comments-o"></i>
                <p>${mensagem}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = atualizacoesFiltradas.map(a => {
        const data = new Date(a.data_postagem);
        const dataFormatada = data.toLocaleDateString('pt-BR') + ' às ' + 
                             data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        const isAutor = a.id_usuario == userId;
        const usuarioSuspenso = a.estado_usuario === 'inativo';
        
        // Se usuário está suspenso, mostrar conteúdo diferente
        if (usuarioSuspenso) {
            return `
                <div class="atualizacao-item atualizacao-suspensa" data-id="${a.id}">
                    <div class="atualizacao-header">
                        <div class="atualizacao-usuario-info">
                            <div class="usuario-avatar">
                                <div class="usuario-avatar-placeholder suspensa">⚠</div>
                            </div>
                            <div class="atualizacao-usuario-data">
                                <span class="atualizacao-usuario suspensa">
                                    Usuário suspenso
                                </span>
                                <span class="atualizacao-data">${dataFormatada}</span>
                            </div>
                        </div>
                    </div>
                    <div class="atualizacao-conteudo-suspensa">
                        <p><em>Este conteúdo foi removido pois o usuário foi suspenso por violação das regras da comunidade.</em></p>
                    </div>
                </div>`;
        }
        
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
    atualizacoesFiltradas.forEach(a => {
        carregarEstadoCurtidas(a.id);
        carregarContadorComentarios(a.id);
    });
}

// Função para ir ao perfil do usuário
function irParaPerfil(idUsuario) {
    if (idUsuario == userId) {
        window.location.href = '/meuPerfil';
    } else {
        window.location.href = `/perfil/${idUsuario}`;
    }
}

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

function editarAtualizacao(id) {
    // Redirecionar de volta para o clube com modal de edição
    window.location.href = `/clube/${clubeId}?editarAtualizacao=${id}`;
}

async function excluirAtualizacao(id) {
    if (confirm('Tem certeza que deseja excluir esta atualização?')) {
        try {
            const response = await fetch(`/api/clube/${clubeId}/atualizacoes/${id}`, { 
                method: 'DELETE' 
            });
            
            if (!response.ok) throw new Error('Erro ao excluir atualização');
            
            mostrarMensagemSucesso('Atualização excluída com sucesso!');
            carregarAtualizacoesLeitura(); // Recarregar lista
            
        } catch (error) {
            console.error('Erro ao excluir atualização:', error);
            alert('Erro ao excluir atualização. Tente novamente.');
        }
    }
}

function abrirModalDenuncia(atualizacaoId, nomeUsuario) {
    // Usar a mesma função do arquivo atualizacoes.js
    if (typeof window.abrirModalDenuncia === 'function') {
        window.abrirModalDenuncia(atualizacaoId, nomeUsuario);
    } else {
        // Implementação básica se a função não estiver disponível
        alert('Funcionalidade de denúncia temporariamente indisponível');
    }
}

function voltarParaClube() {
    window.location.href = `/clube/${clubeId}`;
}

function mostrarMensagemSucesso(mensagem) {
    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = 'mensagem-sucesso';
    mensagemDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--verde);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    mensagemDiv.textContent = mensagem;
    document.body.appendChild(mensagemDiv);
    
    setTimeout(() => {
        if (document.body.contains(mensagemDiv)) {
            mensagemDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (document.body.contains(mensagemDiv)) {
                    document.body.removeChild(mensagemDiv);
                }
            }, 300);
        }
    }, 3000);
}

// Event listeners
document.addEventListener('click', (event) => {
    if (!event.target.closest('.menu-opcoes')) {
        document.querySelectorAll('.dropdown-opcoes').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
});

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

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

