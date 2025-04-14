document.addEventListener('DOMContentLoaded', function() {
    // Obter o ID do clube da URL
    const clubeId = window.location.pathname.split('/').pop();
    
    // Carregar informações do clube
    carregarInformacoesClube(clubeId);
    
    // Verificar permissões do criador
    verificarPermissoesCriador(clubeId);
    
    // Configurar eventos de clique para o menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const secao = this.dataset.secao;
            mudarSecaoClube(secao);
        });
    });
    
    // Mostrar a seção de discussão por padrão
    mudarSecaoClube('discussao');
});

async function carregarInformacoesClube(clubeId) {
    try {
        // Mostrar indicador de carregamento
        document.getElementById('clube-titulo').textContent = 'Carregando...';
        
        const response = await fetch(`/api/clube/${clubeId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.erro || 'Erro ao carregar informações do clube');
        }
        
        const clube = await response.json();
        
        // Atualizar elementos da página com os dados do clube
        document.getElementById('clube-titulo').textContent = clube.nome;
        document.getElementById('clube-nome').textContent = clube.nome;
        document.getElementById('clube-descricao').textContent = clube.descricao || 'Sem descrição';
        
        const visibilidadeBadge = document.getElementById('clube-visibilidade');
        visibilidadeBadge.textContent = clube.visibilidade;
        visibilidadeBadge.className = `visibilidade-badge ${clube.visibilidade}`;
        
        const categoriasContainer = document.getElementById('clube-categorias');
        categoriasContainer.innerHTML = '';
        
        if (clube.categorias && clube.categorias.length > 0) {
            clube.categorias.forEach(categoria => {
                const span = document.createElement('span');
                span.className = 'categoria-tag';
                span.textContent = categoria;
                categoriasContainer.appendChild(span);
            });
        } else {
            const span = document.createElement('span');
            span.className = 'categoria-tag sem-categoria';
            span.textContent = 'Sem categorias';
            categoriasContainer.appendChild(span);
        }
        
        document.getElementById('clube-membros-count').textContent = `${clube.total_membros} membros`;
        
        // Carregar membros do clube
        carregarMembrosClube(clubeId);
        
        // Verificar se há leitura atual
        const livroAtualInfo = document.getElementById('livro-atual-info');
        if (clube.leitura_atual) {
            livroAtualInfo.innerHTML = `
                <div class="livro-card">
                    <div class="livro-info">
                        <h4>${clube.leitura_atual.titulo}</h4>
                        <p>Autor: ${clube.leitura_atual.autor || 'Não informado'}</p>
                    </div>
                </div>
            `;
        } else {
            livroAtualInfo.innerHTML = '<p class="mensagem-vazia">Nenhum livro selecionado para leitura atual.</p>';
        }
        
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('clube-titulo').textContent = 'Erro ao carregar clube';
        alert('Não foi possível carregar as informações do clube. Tente novamente mais tarde.');
    }
}

async function carregarMembrosClube(clubeId) {
    try {
        const membrosLista = document.getElementById('clube-membros-lista-completa');
        membrosLista.innerHTML = '<p class="carregando">Carregando membros...</p>';
        
        const response = await fetch(`/api/clube/${clubeId}/membros`);
        if (!response.ok) {
            throw new Error('Erro ao carregar membros do clube');
        }
        
        const data = await response.json();
        membrosLista.innerHTML = '';
        
        if (data.membros.length === 0) {
            membrosLista.innerHTML = '<p class="mensagem-vazia">Nenhum membro encontrado.</p>';
            return;
        }
        
        data.membros.forEach(membro => {
            const membroItem = document.createElement('div');
            membroItem.className = 'membro-item';
            
            const isCriador = membro.id === data.idCriador;
            
            membroItem.innerHTML = `
                <div class="membro-avatar">
                    <i class="fa fa-user"></i>
                </div>
                <div class="membro-info">
                    <span class="membro-nome">${membro.nome}</span>
                    ${isCriador ? '<span class="badge-criador">Criador</span>' : ''}
                </div>
            `;
            
            membrosLista.appendChild(membroItem);
        });
        
    } catch (error) {
        console.error('Erro:', error);
        const membrosLista = document.getElementById('clube-membros-lista-completa');
        membrosLista.innerHTML = '<p class="erro-carregamento">Erro ao carregar membros do clube.</p>';
    }
}

async function verificarPermissoesCriador(clubeId) {
    try {
        const response = await fetch(`/api/clube/${clubeId}/permissoes`);
        if (!response.ok) {
            throw new Error('Erro ao verificar permissões');
        }
        
        const data = await response.json();
        
        // Mostrar ou ocultar elementos com base nas permissões
        const opcoesElementos = [
            { id: 'opcoes-criador', mostrar: data.isCriador },
            { id: 'botao-selecionar-leitura-container', mostrar: data.isCriador },
            { id: 'botao-agendar-encontro-container', mostrar: data.isCriador }
        ];
        
        opcoesElementos.forEach(elemento => {
            const el = document.getElementById(elemento.id);
            if (el) {
                el.style.display = elemento.mostrar ? 'block' : 'none';
            }
        });
        
        // Preencher formulário de edição se for o criador
        if (data.isCriador) {
            const formElementos = [
                { id: 'editar-nome-clube', valor: data.clube.nome },
                { id: 'editar-descricao-clube', valor: data.clube.descricao || '' }
            ];
            
            formElementos.forEach(elemento => {
                const el = document.getElementById(elemento.id);
                if (el) {
                    el.value = elemento.valor;
                }
            });
            
            // Configurar visibilidade
            if (data.clube.visibilidade === 'publico') {
                const radioPublico = document.getElementById('editar-visibilidade-publico');
                if (radioPublico) radioPublico.checked = true;
            } else {
                const radioPrivado = document.getElementById('editar-visibilidade-privado');
                if (radioPrivado) radioPrivado.checked = true;
                
                const senhaContainer = document.getElementById('editar-senha-container');
                if (senhaContainer) senhaContainer.style.display = 'block';
            }
        }
        
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
    }
}

function mudarSecaoClube(secao) {
    // Ocultar todas as seções
    const secoes = document.querySelectorAll('.clube-secao');
    if (secoes) {
        secoes.forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // Remover classe ativa de todos os itens do menu
    const menuItems = document.querySelectorAll('.menu-item');
    if (menuItems) {
        menuItems.forEach(el => {
            el.classList.remove('menu-item-ativo');
        });
    }
    
    // Mostrar a seção selecionada
    const secaoAtual = document.getElementById(`secao-${secao}`);
    if (secaoAtual) {
        secaoAtual.style.display = 'block';
    }
    
    // Adicionar classe ativa ao item do menu selecionado
    const menuItem = document.querySelector(`.menu-item[data-secao="${secao}"]`);
    if (menuItem) {
        menuItem.classList.add('menu-item-ativo');
    }
}

function voltarParaTelaAnterior() {
    window.history.back();
}

function abrirModalSelecaoLeitura() {
    const modal = document.getElementById('modal-selecao-leitura');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function fecharModalSelecaoLeitura() {
    const modal = document.getElementById('modal-selecao-leitura');
    if (modal) {
        modal.style.display = 'none';
    }
}

function mudarTabSelecaoLeitura(tab) {
    // Ocultar todos os conteúdos de tab
    const tabContents = document.querySelectorAll('.tab-content');
    if (tabContents) {
        tabContents.forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // Remover classe ativa de todas as tabs
    const tabItems = document.querySelectorAll('.tab-item');
    if (tabItems) {
        tabItems.forEach(el => {
            el.classList.remove('tab-ativo');
        });
    }
    
    // Mostrar o conteúdo da tab selecionada
    const tabContent = document.getElementById(`tab-${tab}`);
    if (tabContent) {
        tabContent.style.display = 'block';
    }
    
    // Adicionar classe ativa à tab selecionada
    const tabItem = document.querySelector(`.tab-item[data-tab="${tab}"]`);
    if (tabItem) {
        tabItem.classList.add('tab-ativo');
    }
}