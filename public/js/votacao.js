let votacaoAtiva = null;
let sugestoesSelecionadasVotacao = [];
let meuVoto = null;

async function carregarVotacao() {
    try {
        const response = await fetch(`/api/clube/${clubeId}/votacao`);
        const data = await response.json();
        
        const container = document.getElementById('votacao-container');
        
        if (response.ok && data.votacao) {
            votacaoAtiva = data.votacao;
            meuVoto = data.meuVoto;
            renderizarVotacao(data.votacao, data.meuVoto);
        } else {
            container.innerHTML = `
                <div class="sem-votacao">
                    <i class="fa fa-vote-yea"></i>
                    <h4>Nenhuma votação ativa</h4>
                    <p>Não há votações em andamento no momento</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar votação:', error);
        document.getElementById('votacao-container').innerHTML = `
            <div class="erro-votacao">
                <i class="fa fa-exclamation-triangle"></i>
                <p>Erro ao carregar votação</p>
            </div>
        `;
    }
}

function renderizarVotacao(votacao, meuVoto) {
    const container = document.getElementById('votacao-container');
    const isEncerrada = votacao.encerrada;
    const totalVotos = votacao.total_votos || 0;
    
    let html = `
        <div class="votacao-header">
            <h3 class="votacao-titulo">${escapeHtml(votacao.titulo)}</h3>
            <div class="votacao-status">
                <span class="status-badge ${isEncerrada ? 'status-encerrada' : 'status-ativa'}">
                    ${isEncerrada ? 'Encerrada' : 'Ativa'}
                </span>
                <span class="total-votos">${totalVotos} ${totalVotos === 1 ? 'voto' : 'votos'}</span>
            </div>
        </div>
        
        <div class="votacao-info">
            ${votacao.descricao ? `<p class="votacao-descricao">${escapeHtml(votacao.descricao)}</p>` : ''}
            <div class="votacao-meta">
                <span><i class="fa fa-calendar"></i> Iniciada em ${new Date(votacao.data_inicio).toLocaleDateString('pt-BR')}</span>
                ${votacao.data_fim ? `<span><i class="fa fa-clock-o"></i> Termina em ${new Date(votacao.data_fim).toLocaleDateString('pt-BR')}</span>` : ''}
            </div>
        </div>
        
        <div class="opcoes-votacao">
    `;
    
    votacao.opcoes.forEach(opcao => {
        const porcentagem = totalVotos > 0 ? Math.round((opcao.votos / totalVotos) * 100) : 0;
        const isVotada = meuVoto && meuVoto == opcao.opcao_id;
        
        html += `
            <div class="opcao-votacao ${isVotada ? 'votada' : ''}" 
                 onclick="${!isEncerrada ? `votarOpcao(${opcao.opcao_id})` : ''}"
                 ${!isEncerrada ? 'style="cursor: pointer;"' : 'style="cursor: default;"'}>
                <div class="opcao-conteudo">
                    <div class="opcao-capa">
                        ${opcao.imagemUrl ? 
                            `<img src="${opcao.imagemUrl}" alt="${escapeHtml(opcao.titulo)}">` :
                            `<div class="opcao-capa-placeholder"><i class="fa fa-book"></i></div>`
                        }
                    </div>
                    <div class="opcao-info">
                        <h4 class="opcao-titulo">${escapeHtml(opcao.titulo)}</h4>
                        <p class="opcao-autor">por ${escapeHtml(opcao.autor || 'Autor não informado')}</p>
                        <div class="opcao-meta">
                            ${opcao.paginas ? `<span>${opcao.paginas} páginas</span>` : ''}
                            <span>Sugerido por ${escapeHtml(opcao.nome_usuario)}</span>
                        </div>
                    </div>
                    <div class="opcao-votos">
                        <span class="opcao-porcentagem">${porcentagem}%</span>
                        <span>${opcao.votos} ${opcao.votos === 1 ? 'voto' : 'votos'}</span>
                        ${isVotada ? '<i class="fa fa-check-circle" style="color: #27ae60;"></i>' : ''}
                    </div>
                </div>
                ${totalVotos > 0 ? `<div class="barra-progresso" style="width: ${porcentagem}%"></div>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    
    if (!isEncerrada) {
        html += `
            <div class="votacao-acoes">
                ${meuVoto ? 
                    '<p style="color: #27ae60; margin: 0;"><i class="fa fa-check"></i> Você já votou! Clique em uma opção para alterar seu voto.</p>' :
                    '<p style="color: #666; margin: 0;"><i class="fa fa-info-circle"></i> Clique em uma opção para votar</p>'
                }
        `;
        
        html += `
                <div id="acoes-criador-votacao" style="display: none;">
                    <button class="botao-encerrar" onclick="encerrarVotacao()">
                        <i class="fa fa-stop"></i> Encerrar Votação
                    </button>
                </div>
            </div>
        `;
    } else {
                if (votacao.opcoes.length > 0) {
            const vencedora = votacao.opcoes[0]; 
            html += `
                <div class="resultado-votacao">
                    <div class="resultado-header">
                        <i class="fa fa-trophy resultado-icone"></i>
                        <h4 class="resultado-titulo">Resultado da Votação</h4>
                    </div>
                    <div class="opcao-vencedora">
                        <div class="vencedora-capa">
                            ${vencedora.imagemUrl ? 
                                `<img src="${vencedora.imagemUrl}" alt="${escapeHtml(vencedora.titulo)}">` :
                                `<div class="opcao-capa-placeholder"><i class="fa fa-book"></i></div>`
                            }
                        </div>
                        <div class="vencedora-info">
                            <h4 class="vencedora-titulo">${escapeHtml(vencedora.titulo)}</h4>
                            <p class="vencedora-autor">por ${escapeHtml(vencedora.autor || 'Autor não informado')}</p>
                            <div class="vencedora-votos">
                                <i class="fa fa-trophy"></i>
                                <span>${vencedora.votos} ${vencedora.votos === 1 ? 'voto' : 'votos'} (${totalVotos > 0 ? Math.round((vencedora.votos / totalVotos) * 100) : 0}%)</span>
                            </div>
                        </div>
                    </div>
                    <div class="resultado-acoes" id="acoes-resultado-votacao" style="display: none;">
                        <button class="botao-selecionar-vencedora" onclick="selecionarVencedoraComoLeitura()">
                            <i class="fa fa-check"></i> Selecionar como Leitura
                        </button>
                        <button class="botao-nova-votacao" onclick="abrirModalNovaVotacao()">
                            <i class="fa fa-plus"></i> Nova Votação
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    container.innerHTML = html;
    
    verificarPermissoesVotacao();
}

async function verificarPermissoesVotacao() {
    try {
        const response = await fetch(`/api/clube/${clubeId}/permissoes`);
        const data = await response.json();
        
        if (response.ok && data.isCriador) {
            const acoesCreador = document.getElementById('acoes-criador-votacao');
            const acoesResultado = document.getElementById('acoes-resultado-votacao');
            
            if (acoesCreador) {
                acoesCreador.style.display = 'block';
            }
            if (acoesResultado) {
                acoesResultado.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
    }
}

async function votarOpcao(idOpcao) {
    if (!votacaoAtiva || votacaoAtiva.encerrada) {
        mostrarAlerta('Esta votação já foi encerrada', 'erro');
        return;
    }
    
    try {
      
        const opcaoElement = document.querySelector(`[onclick="votarOpcao(${idOpcao})"]`);
        if (opcaoElement) {
            opcaoElement.classList.add('votando');
        }
        
        const response = await fetch(`/api/clube/${clubeId}/votacao/votar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                idOpcao: idOpcao
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('Voto registrado com sucesso!', 'sucesso');
            meuVoto = idOpcao;
            // Recarregar votação para mostrar resultados atualizados
            await carregarVotacao();
        } else {
            mostrarAlerta(data.erro || 'Erro ao registrar voto', 'erro');
        }
    } catch (error) {
        console.error('Erro ao votar:', error);
        mostrarAlerta('Erro ao conectar com o servidor', 'erro');
    }
}

async function encerrarVotacao() {
    if (!votacaoAtiva) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Nenhuma votação ativa encontrada'
        });
        return;
    }
    
    const result = await Swal.fire({
        icon: 'warning',
        title: 'Encerrar Votação?',
        text: 'Tem certeza que deseja encerrar esta votação? Esta ação não pode ser desfeita.',
        showCancelButton: true,
        confirmButtonText: 'Sim, encerrar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
    });
    
    if (!result.isConfirmed) return;
    
    try {
        const response = await fetch(`/api/clube/${clubeId}/votacao/encerrar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            await carregarVotacao();
            console.log('📊 Votação recarregada. votacaoAtiva:', votacaoAtiva);
            
            // Perguntar se quer adicionar como leitura
            const resultLeitura = await Swal.fire({
                icon: 'success',
                title: 'Votação encerrada!',
                text: 'Deseja selecionar o livro com maior número de votos como leitura atual?',
                showCancelButton: true,
                confirmButtonText: 'Sim, adicionar como leitura',
                cancelButtonText: 'Não',
                confirmButtonColor: '#28a745',
                cancelButtonColor: '#6c757d'
            });
            
            if (resultLeitura.isConfirmed) {
                console.log('👤 Usuário confirmou. Chamando selecionarVencedoraComoLeitura()');
                selecionarVencedoraComoLeitura();
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: data.erro || 'Erro ao encerrar votação'
            });
        }
    } catch (error) {
        console.error('Erro ao encerrar votação:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Erro ao conectar com o servidor'
        });
    }
}

function abrirModalNovaVotacao() {
    const modal = document.getElementById('modal-nova-votacao');
    const overlay = document.getElementById('overlay-votacao');
    
    document.getElementById('form-nova-votacao').reset();
    sugestoesSelecionadasVotacao = [];
    
    carregarSugestoesParaVotacao();
    
    modal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function fecharModalNovaVotacao() {
    const modal = document.getElementById('modal-nova-votacao');
    const overlay = document.getElementById('overlay-votacao');
    
    modal.style.display = 'none';
    overlay.style.display = 'none';
    document.body.style.overflow = '';
}

// Carregar sugestões para votação
async function carregarSugestoesParaVotacao() {
    try {
        const response = await fetch(`/api/clube/${clubeId}/sugestoes`);
        const data = await response.json();
        
        const container = document.getElementById('sugestoes-votacao-lista');
        
        if (response.ok && data.length > 0) {
            container.innerHTML = data.map((sugestao, index) => `
                <div class="sugestao-checkbox-item">
                    <input type="checkbox" id="votacao-sugestao-${index}" 
                           value="${sugestao.id}" 
                           onchange="toggleSugestaoVotacao(${sugestao.id})">
                    <label for="votacao-sugestao-${index}" class="sugestao-checkbox-info">
                        <h5 class="sugestao-checkbox-titulo">${escapeHtml(sugestao.titulo)}</h5>
                        <p class="sugestao-checkbox-autor">por ${escapeHtml(sugestao.autor || 'Autor não informado')} - Sugerido por ${escapeHtml(sugestao.nome_usuario)}</p>
                    </label>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p style="text-align: center; color: #666;">Nenhuma sugestão disponível para votação</p>';
        }
        
        atualizarContadorSelecionadasVotacao();
    } catch (error) {
        console.error('Erro ao carregar sugestões:', error);
        document.getElementById('sugestoes-votacao-lista').innerHTML = '<p style="text-align: center; color: #e74c3c;">Erro ao carregar sugestões</p>';
    }
}

function toggleSugestaoVotacao(idSugestao) {
    const index = sugestoesSelecionadasVotacao.indexOf(idSugestao);
    
    if (index > -1) {
        sugestoesSelecionadasVotacao.splice(index, 1);
    } else {
        sugestoesSelecionadasVotacao.push(idSugestao);
    }
    
    atualizarContadorSelecionadasVotacao();
}

function atualizarContadorSelecionadasVotacao() {
    const contador = document.getElementById('contador-selecionadas-votacao');
    const botaoCriar = document.getElementById('botao-criar-votacao');
    
    const quantidade = sugestoesSelecionadasVotacao.length;
    
    if (contador) {
        contador.textContent = `${quantidade} ${quantidade === 1 ? 'sugestão selecionada' : 'sugestões selecionadas'}`;
    }
    
    if (botaoCriar) {
        botaoCriar.disabled = quantidade < 2; // Mínimo 2 opções para votação
    }
}

async function criarNovaVotacao() {
    const titulo = document.getElementById('titulo-votacao').value.trim();
    const descricao = document.getElementById('descricao-votacao').value.trim();
    const dataFim = document.getElementById('data-fim-votacao').value;
    
    if (!titulo) {
        mostrarAlerta('Por favor, informe o título da votação', 'erro');
        document.getElementById('titulo-votacao').focus();
        return;
    }
    
    if (sugestoesSelecionadasVotacao.length < 2) {
        mostrarAlerta('Selecione pelo menos 2 sugestões para a votação', 'erro');
        return;
    }
    
    try {
        const botaoCriar = document.getElementById('botao-criar-votacao');
        const textoOriginal = botaoCriar.innerHTML;
        botaoCriar.disabled = true;
        botaoCriar.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Criando...';
        
        const response = await fetch(`/api/clube/${clubeId}/votacao`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                titulo,
                descricao,
                dataFim,
                sugestoes: sugestoesSelecionadasVotacao
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('Votação criada com sucesso!', 'sucesso');
            fecharModalNovaVotacao();
            await carregarVotacao();
        } else {
            mostrarAlerta(data.erro || 'Erro ao criar votação', 'erro');
        }
    } catch (error) {
        console.error('Erro ao criar votação:', error);
        mostrarAlerta('Erro ao conectar com o servidor', 'erro');
    } finally {
        const botaoCriar = document.getElementById('botao-criar-votacao');
        if (botaoCriar) {
            botaoCriar.disabled = false;
            botaoCriar.innerHTML = '<i class="fa fa-check"></i> Criar Votação';
        }
    }
}

function selecionarVencedoraComoLeitura() {
    console.log('🔍 votacaoAtiva:', votacaoAtiva);
    
    if (!votacaoAtiva || !votacaoAtiva.opcoes || votacaoAtiva.opcoes.length === 0) {
        console.error('❌ Votação ativa inválida ou sem opções');
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Nenhuma opção vencedora encontrada'
        });
        return;
    }
    
    const vencedora = votacaoAtiva.opcoes[0];
    console.log('🏆 Vencedora:', vencedora);
    
    // Usar window para garantir acesso às variáveis globais
    window.sugestaoSelecionada = {
        id: vencedora.sugestao_id,
        titulo: vencedora.titulo,
        autor: vencedora.autor,
        imagemUrl: vencedora.imagemUrl,
        paginas: vencedora.paginas,
        nome_usuario: vencedora.nome_usuario
    };
    
    window.livroSelecionado = null;
    
    console.log('✅ sugestaoSelecionada configurada:', window.sugestaoSelecionada);
    
    const container = document.getElementById('selected-book-container');
    const coverDiv = document.getElementById('selected-book-cover');
    const titleElement = document.getElementById('selected-book-title');
    const authorElement = document.getElementById('selected-book-author');
    const pagesElement = document.getElementById('selected-book-pages');
    
    console.log('📦 Elementos encontrados:', {
        container: !!container,
        coverDiv: !!coverDiv,
        titleElement: !!titleElement,
        authorElement: !!authorElement,
        pagesElement: !!pagesElement
    });
    
    if (container && coverDiv && titleElement && authorElement && pagesElement) {
        coverDiv.innerHTML = vencedora.imagemUrl ? 
            `<img src="${vencedora.imagemUrl}" alt="${escapeHtml(vencedora.titulo)}">` : 
            `<div class="capa-placeholder"><i class="fa fa-book"></i></div>`;
        
        titleElement.textContent = vencedora.titulo;
        authorElement.textContent = vencedora.autor ? `Autor: ${vencedora.autor}` : 'Autor não informado';
        pagesElement.textContent = vencedora.paginas ? `${vencedora.paginas} páginas` : 'Número de páginas não informado';
        
        container.style.display = 'flex';
        
        console.log('✅ Abrindo modal com livro selecionado');
        abrirModalSelecaoLeitura(true); // true = manter seleção
        
        setTimeout(() => {
            if (typeof configurarValidacoesDatas === 'function') {
                configurarValidacoesDatas();
            }
        }, 100);
        
        Swal.fire({
            icon: 'success',
            title: 'Livro Selecionado!',
            text: 'Configure as datas e confirme a leitura.',
            timer: 3000
        });
    } else {
        console.error('❌ Elementos do modal não encontrados');
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Erro ao configurar livro selecionado. Tente usar a aba "Buscar Livros" no modal de seleção.'
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        if (e.target.id === 'overlay-votacao') {
            fecharModalNovaVotacao();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fecharModalNovaVotacao();
        }
    });
    
    const dataFimInput = document.getElementById('data-fim-votacao');
    if (dataFimInput) {
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        dataFimInput.min = amanha.toISOString().split('T')[0];
    }
});

function iniciarVotacao() {
    fecharModalSelecaoLeitura();
    
    abrirModalNovaVotacao();
}

if (typeof escapeHtml === 'undefined') {
    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
}

if (typeof mostrarAlerta === 'undefined') {
    function mostrarAlerta(mensagem, tipo = 'info') {
        const alerta = document.createElement('div');
        alerta.className = `alerta alerta-${tipo}`;
        alerta.innerHTML = `
            <div class="alerta-conteudo">
                <span class="alerta-mensagem">${mensagem}</span>
                <button class="alerta-fechar" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(alerta);
        
        setTimeout(() => {
            if (alerta.parentElement) {
                alerta.remove();
            }
        }, 5000);
        
        setTimeout(() => {
            alerta.classList.add('alerta-visivel');
        }, 10);
    }
}


