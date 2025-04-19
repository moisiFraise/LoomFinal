document.addEventListener('DOMContentLoaded', function() {
    const clubeId = window.location.pathname.split('/').pop();
    
    carregarInformacoesClube(clubeId);
    
    verificarPermissoesCriador(clubeId);
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const secao = this.dataset.secao;
            mudarSecaoClube(secao);
        });
    });    
    mudarSecaoClube('discussao');
    
    // Inicializar a data de início com a data atual
    const hoje = new Date().toISOString().split('T')[0];
    if (document.getElementById('data-inicio')) {
        document.getElementById('data-inicio').value = hoje;
    }
    if (document.getElementById('data-inicio-manual')) {
        document.getElementById('data-inicio-manual').value = hoje;
    }
    
    // Adicionar evento de tecla Enter para busca
    const buscaInput = document.getElementById('busca-livro');
    if (buscaInput) {
        buscaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarLivros();
            }
        });
    }
    
    // Carregar leituras ao mudar para a seção de livros
    const menuItemLivros = document.querySelector('.menu-item[data-secao="livros-anteriores"]');
    if (menuItemLivros) {
        menuItemLivros.addEventListener('click', function() {
            carregarLeiturasClube(clubeId);
        });
    }
});

// Variáveis globais para a seleção de livros
let livroSelecionado = null;
let resultadosBusca = [];

async function carregarInformacoesClube(clubeId) {
    try {
        document.getElementById('clube-titulo').textContent = 'Carregando...';
        
        const response = await fetch(`/api/clube/${clubeId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.erro || 'Erro ao carregar informações do clube');
        }
        
        const clube = await response.json();
        
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
        
        carregarMembrosClube(clubeId);
        
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
    const secoes = document.querySelectorAll('.clube-secao');
    if (secoes) {
        secoes.forEach(el => {
            el.style.display = 'none';
        });
    }
    
    const menuItems = document.querySelectorAll('.menu-item');
    if (menuItems) {
        menuItems.forEach(el => {
            el.classList.remove('menu-item-ativo');
        });
    }
    
    const secaoAtual = document.getElementById(`secao-${secao}`);
    if (secaoAtual) {
        secaoAtual.style.display = 'block';
    }
    
    const menuItem = document.querySelector(`.menu-item[data-secao="${secao}"]`);
    if (menuItem) {
        menuItem.classList.add('menu-item-ativo');
    }
}

function voltarParaTelaAnterior() {
    window.history.back();
}

function abrirModalSelecaoLeitura() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('modal-selecao-leitura').style.display = 'block';
    document.getElementById('busca-livro').focus();
}
function fecharModalSelecaoLeitura() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('modal-selecao-leitura').style.display = 'none';
    document.getElementById('busca-livro').value = '';
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('selected-book-container').style.display = 'none';
    livroSelecionado = null;
}

function mudarTabSelecaoLeitura(tab) {
    const tabContents = document.querySelectorAll('.tab-content');
    if (tabContents) {
        tabContents.forEach(el => {
            el.style.display = 'none';
        });
    }
    
    const tabItems = document.querySelectorAll('.tab-item');
    if (tabItems) {
        tabItems.forEach(el => {
            el.classList.remove('tab-ativo');
        });
    }
    
    const tabContent = document.getElementById(`tab-${tab}`);
    if (tabContent) {
        tabContent.style.display = 'block';
    }
    
    const tabItem = document.querySelector(`.tab-item[data-tab="${tab}"]`);
    if (tabItem) {
        tabItem.classList.add('tab-ativo');
    }
    
    document.getElementById('selected-book-container').style.display = 'none';
    livroSelecionado = null;
}

async function carregarLeiturasClube(clubeId) {
    try {
        const livroAtualContainer = document.getElementById('livro-atual-info-completo');
        const leiturasAnterioresGrid = document.getElementById('leituras-anteriores-grid');
        
        livroAtualContainer.innerHTML = '<p class="carregando">Carregando leitura atual...</p>';
        leiturasAnterioresGrid.innerHTML = '<p class="carregando">Carregando leituras anteriores...</p>';
        
        const response = await fetch(`/api/clube/${clubeId}/leituras`);
        if (!response.ok) {
            throw new Error('Erro ao carregar leituras do clube');
        }
        
        const data = await response.json();
        
        if (data.leituraAtual) {
            const leitura = data.leituraAtual;
            const dataInicio = new Date(leitura.data_inicio).toLocaleDateString('pt-BR');
            const dataFim = leitura.data_fim ? new Date(leitura.data_fim).toLocaleDateString('pt-BR') : 'Não definida';
            
            livroAtualContainer.innerHTML = `
                <div class="leitura-card">
                    <div class="leitura-imagem" style="background-image: url('${leitura.imagemUrl || '/img/capa-padrao.jpg'}')"></div>
                    <div class="leitura-info">
                        <span class="leitura-status atual">Atual</span>
                        <h4>${leitura.titulo}</h4>
                        <p>Autor: ${leitura.autor || 'Não informado'}</p>
                        ${leitura.paginas ? `<p>Páginas: ${leitura.paginas}</p>` : ''}
                        <div class="leitura-datas">
                            <span>Início: ${dataInicio}</span>
                            <span>Término previsto: ${dataFim}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            livroAtualContainer.innerHTML = '<p class="mensagem-vazia">Nenhum livro selecionado para leitura atual.</p>';
        }
        if (data.leiturasAnteriores && data.leiturasAnteriores.length > 0) {
            leiturasAnterioresGrid.innerHTML = '';          
            data.leiturasAnteriores.forEach(leitura => {
                const dataInicio = new Date(leitura.data_inicio).toLocaleDateString('pt-BR');
                const dataFim = leitura.data_fim ? new Date(leitura.data_fim).toLocaleDateString('pt-BR') : 'Não finalizada';    
                const leituraCard = document.createElement('div');
                    leituraCard.className = 'leitura-card';
                    leituraCard.innerHTML = `
                        <div class="leitura-imagem" style="background-image: url('${leitura.imagemUrl || '/img/capa-padrao.jpg'}')"></div>
                        <div class="leitura-info">
                        <span class="leitura-status anterior">Anterior</span>
                        <h4>${leitura.titulo}</h4>
                        <p>Autor: ${leitura.autor || 'Não informado'}</p>
                        ${leitura.paginas ? `<p>Páginas: ${leitura.paginas}</p>` : ''}
                        <div class="leitura-datas">
                            <span>Início: ${dataInicio}</span>
                            <span>Término: ${dataFim}</span>
                             </div>
                        </div>`;      
                        leiturasAnterioresGrid.appendChild(leituraCard);});
            } else {
                leiturasAnterioresGrid.innerHTML = '<p class="mensagem-vazia">Nenhuma leitura anterior registrada.</p>';
            }
                            
            } catch (error) {
                console.error('Erro:', error);
                document.getElementById('livro-atual-info-completo').innerHTML = '<p class="erro-carregamento">Erro ao carregar leitura atual.</p>';
                document.getElementById('leituras-anteriores-grid').innerHTML = '<p class="erro-carregamento">Erro ao carregar leituras anteriores.</p>';
                }
            }
                    
async function buscarLivros() {
    const termoBusca = document.getElementById('busca-livro').value.trim();
    const resultadosContainer = document.getElementById('search-results');       
    if (!termoBusca) {
        resultadosContainer.innerHTML = '<p class="mensagem-vazia">Digite um termo para buscar.</p>';
        return;
    }       
    resultadosContainer.innerHTML = '<p class="carregando">Buscando livros...</p>';      
        try {
            const response = await fetch(`/api/livros/buscar?q=${encodeURIComponent(termoBusca)}`);
            if (!response.ok) {
            throw new Error('Erro ao buscar livros');
        }       
        const data = await response.json();
        resultadosBusca = data.items || [];          
        if (resultadosBusca.length === 0) {
            resultadosContainer.innerHTML = '<p class="mensagem-vazia">Nenhum livro encontrado.</p>';
            return;
        }    
        resultadosContainer.innerHTML = '';       
        resultadosBusca.forEach((livro, index) => {
            const volumeInfo = livro.volumeInfo || {};
            const titulo = volumeInfo.title || 'Sem título';
            const autores = volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Autor desconhecido';
            const imagemUrl = volumeInfo.imageLinks?.thumbnail || '/img/capa-padrao.jpg';       
            const livroElement = document.createElement('div');
            livroElement.className = 'book-result';
            livroElement.innerHTML = `
                <div class="book-cover" style="background-image: url('${imagemUrl}')"></div>
                    <div class="book-info">
                        <h4 title="${titulo}">${titulo}</h4>
                        <p>${autores}</p>
                    </div>
                `;    
                livroElement.addEventListener('click', () => selecionarLivro(index));
                resultadosContainer.appendChild(livroElement);});
                } catch (error) {
                    console.error('Erro:', error);
                    resultadosContainer.innerHTML = '<p class="erro-carregamento">Erro ao buscar livros. Tente novamente.</p>';
                    }
                }
                    
function selecionarLivro(index) {
    const livro = resultadosBusca[index];
    if (!livro) return;
        const volumeInfo = livro.volumeInfo || {};
        livroSelecionado = {
            titulo: volumeInfo.title || 'Sem título',
            autor: volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Autor desconhecido',
            paginas: volumeInfo.pageCount || null,
            imagemUrl: volumeInfo.imageLinks?.thumbnail || null,
            descricao: volumeInfo.description || null
        };
                        
        const containerLivroSelecionado = document.getElementById('selected-book-container');
        const capaLivro = document.getElementById('selected-book-cover');
        const tituloLivro = document.getElementById('selected-book-title');
        const autorLivro = document.getElementById('selected-book-author');
        const paginasLivro = document.getElementById('selected-book-pages');
                        
        capaLivro.style.backgroundImage = `url('${livroSelecionado.imagemUrl || '/img/capa-padrao.jpg'}')`;
        tituloLivro.textContent = livroSelecionado.titulo;
        autorLivro.textContent = `Autor: ${livroSelecionado.autor}`;
        paginasLivro.textContent = livroSelecionado.paginas ? `Páginas: ${livroSelecionado.paginas}` : ''; 
        containerLivroSelecionado.style.display = 'flex';
        containerLivroSelecionado.scrollIntoView({ behavior: 'smooth' });
}
                    
async function salvarNovaLeitura() {
    try {
        const tabAtiva = document.querySelector('.tab-item.tab-ativo').dataset.tab;
        let dadosLeitura = {};
                            
        if (tabAtiva === 'buscar') {
            if (!livroSelecionado) {
                alert('Selecione um livro para continuar.');
                return;
            }
                                
            const dataInicio = document.getElementById('data-inicio').value;
            const dataFim = document.getElementById('data-fim').value;
                                
            if (!dataInicio) {
                alert('A data de início é obrigatória.');
                return;
            }
                                
        dadosLeitura = {
            ...livroSelecionado,
            dataInicio,
            dataFim: dataFim || null
        };
    } else {
        const tituloManual = document.getElementById('titulo-manual').value.trim();
        const autorManual = document.getElementById('autor-manual').value.trim();
        const paginasManual = document.getElementById('paginas-manual').value;
        const imagemUrlManual = document.getElementById('imagem-url-manual').value.trim();
        const dataInicioManual = document.getElementById('data-inicio-manual').value;
        const dataFimManual = document.getElementById('data-fim-manual').value;
                            
        if (!tituloManual || !autorManual || !dataInicioManual) {
            alert('Título, autor e data de início são obrigatórios.');
            return;
        }
                                
        dadosLeitura = {
            titulo: tituloManual,
            autor: autorManual,
            paginas: paginasManual || null,
            imagemUrl: imagemUrlManual || null,
            dataInicio: dataInicioManual,
             dataFim: dataFimManual || null
            };
    }
                            
    const response = await fetch(`/api/clube/${clubeId}/leituras`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosLeitura)
            });
                            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.erro || 'Erro ao salvar leitura');
                }
                            
        fecharModalSelecaoLeitura();
        carregarLeiturasClube(clubeId);
        carregarInformacoesClube(clubeId);
                            
        alert('Leitura adicionada com sucesso!');
                            
        } catch (error) {
            console.error('Erro:', error);
             alert(`Erro ao salvar leitura: ${error.message}`);
        }
    }
                    
