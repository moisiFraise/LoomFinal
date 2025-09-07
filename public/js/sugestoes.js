let livroSelecionadoSugestao = null;
let resultadosBuscaSugestao = [];
let sugestoesCarregadas = false;

function abrirModalNovaSugestao() {
    console.log('Abrindo modal de nova sugestão');
    
    const modal = document.getElementById('modal-nova-sugestao');
    const overlay = document.getElementById('overlay-sugestao');
    
    if (!modal || !overlay) {
        console.error('Elementos do modal não encontrados');
        return;
    }
    
    const form = document.getElementById('form-nova-sugestao');
    if (form) form.reset();
    
    const searchResults = document.getElementById('search-results-sugestao');
    if (searchResults) searchResults.innerHTML = '';
    
    const selectedContainer = document.getElementById('selected-book-container-sugestao');
    if (selectedContainer) selectedContainer.style.display = 'none';
    
    const botaoSugerir = document.querySelector('.botao-sugerir');
    if (botaoSugerir) botaoSugerir.style.display = 'none';
    
    const buscaContainer = document.getElementById('busca-container');
    if (buscaContainer) buscaContainer.style.display = 'block';
    
    livroSelecionadoSugestao = null;
    resultadosBuscaSugestao = [];
    
    modal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        const campoBusca = document.getElementById('busca-livro-sugestao');
        if (campoBusca) campoBusca.focus();
    }, 100);
}

function fecharModalNovaSugestao() {
    console.log('Fechando modal de nova sugestão');
    
    const modal = document.getElementById('modal-nova-sugestao');
    const overlay = document.getElementById('overlay-sugestao');
    
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
    
    livroSelecionadoSugestao = null;
    resultadosBuscaSugestao = [];
}

async function buscarLivrosSugestao() {
    console.log('Iniciando busca de livros para sugestão');
    
    const campoBusca = document.getElementById('busca-livro-sugestao');
    if (!campoBusca) {
        console.error('Campo de busca não encontrado');
        return;
    }
    
    const termoBusca = campoBusca.value.trim();
    if (!termoBusca) {
        mostrarAlerta('Por favor, digite um termo de busca', 'erro');
        return;
    }
    
    const resultsContainer = document.getElementById('search-results-sugestao');
    if (!resultsContainer) {
        console.error('Container de resultados não encontrado');
        return;
    }
    
    resultsContainer.innerHTML = '<div class="carregando"><i class="fa fa-spinner fa-spin"></i> Buscando livros...</div>';
    
    try {
        const response = await fetch(`/api/livros/buscar?q=${encodeURIComponent(termoBusca)}`);
        if (!response.ok) throw new Error('Erro na busca de livros');
        
        const data = await response.json();
        console.log('Resultados da busca:', data);
        
        resultsContainer.innerHTML = '';
        
        if (!data.items || data.items.length === 0) {
            resultsContainer.innerHTML = '<div class="sem-resultados">Nenhum livro encontrado. Tente outros termos de busca.</div>';
            return;
        }
        
        resultadosBuscaSugestao = data.items;
        
        data.items.forEach((livro, index) => {
            const volumeInfo = livro.volumeInfo;
            const titulo = volumeInfo.title || 'Título não disponível';
            const autores = volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Autor não informado';
            const capa = volumeInfo.imageLinks?.thumbnail || '/img/capa-padrao.jpg';
            const paginas = volumeInfo.pageCount || 'Não informado';
            
            const livroItem = document.createElement('div');
            livroItem.className = 'livro-resultado';
            livroItem.innerHTML = `
                <img src="${capa}" alt="${titulo}" class="livro-capa-pequena" onerror="this.src='/img/capa-padrao.jpg'">
                <div class="livro-info">
                    <h4>${escapeHtml(titulo)}</h4>
                    <p>Autor: ${escapeHtml(autores)}</p>
                    <p>Páginas: ${paginas}</p>
                </div>
                <button class="botao-selecionar" type="button" data-index="${index}">Selecionar</button>
            `;
            
            // Adicionar event listener diretamente ao botão
            const botaoSelecionar = livroItem.querySelector('.botao-selecionar');
            botaoSelecionar.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Botão selecionar clicado, índice:', index);
                selecionarLivroSugestao(index);
            });
            
            resultsContainer.appendChild(livroItem);
        });
        
        console.log('Resultados renderizados:', data.items.length, 'livros');
        
    } catch (error) {
        console.error('Erro na busca:', error);
        resultsContainer.innerHTML = '<div class="erro-busca">Erro ao buscar livros. Tente novamente.</div>';
    }
}

function selecionarLivroSugestao(index) {
    console.log('Selecionando livro, índice:', index);
    console.log('Resultados disponíveis:', resultadosBuscaSugestao.length);
    
    if (!resultadosBuscaSugestao[index]) {
        console.error('Livro não encontrado no índice:', index);
        return;
    }
    
    const livro = resultadosBuscaSugestao[index];
    livroSelecionadoSugestao = livro;
    
    console.log('Livro selecionado:', livro);
    
    const volumeInfo = livro.volumeInfo;
    
    const container = document.getElementById('selected-book-container-sugestao');
    const coverDiv = document.getElementById('selected-book-cover-sugestao');
    const titleElement = document.getElementById('selected-book-title-sugestao');
    const authorElement = document.getElementById('selected-book-author-sugestao');
    const pagesElement = document.getElementById('selected-book-pages-sugestao');
    const buscaContainer = document.getElementById('busca-container');
    const botaoSugerir = document.querySelector('.botao-sugerir');
    
    if (!container || !coverDiv || !titleElement || !authorElement || !pagesElement) {
        console.error('Elementos do livro selecionado não encontrados');
        return;
    }
    
    let imagemUrl = null;
    if (volumeInfo.imageLinks) {
        imagemUrl = volumeInfo.imageLinks.thumbnail || 
                   volumeInfo.imageLinks.smallThumbnail || 
                   volumeInfo.imageLinks.medium || 
                   volumeInfo.imageLinks.large || null;
        
        if (imagemUrl && imagemUrl.startsWith('http:')) {
            imagemUrl = imagemUrl.replace('http:', 'https:');
        }
    }
    
    const capa = imagemUrl || '/img/capa-padrao.jpg';
    coverDiv.innerHTML = `<img src="${capa}" alt="${escapeHtml(volumeInfo.title || '')}" onerror="this.src='/img/capa-padrao.jpg'">`;
    titleElement.textContent = volumeInfo.title || 'Título não disponível';
    authorElement.textContent = volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Autor não informado';
    pagesElement.textContent = volumeInfo.pageCount ? `${volumeInfo.pageCount} páginas` : 'Número de páginas não informado';
    
    livroSelecionadoSugestao.dadosAdicionais = {
        imagemUrl: imagemUrl,
        paginas: volumeInfo.pageCount || null,
        titulo: volumeInfo.title || '',
        autor: volumeInfo.authors ? volumeInfo.authors.join(', ') : ''
    };
    
    console.log('Dados do livro selecionado:', livroSelecionadoSugestao.dadosAdicionais);
    
    if (buscaContainer) buscaContainer.style.display = 'none';
    container.style.display = 'block';
    
    if (botaoSugerir) botaoSugerir.style.display = 'inline-block';
    
    setTimeout(() => {
        const campoJustificativa = document.getElementById('sugestao-justificativa-selected');
        if (campoJustificativa) campoJustificativa.focus();
    }, 100);
    
    document.querySelectorAll('.livro-resultado').forEach((item, i) => {
        if (i === index) {
            item.classList.add('selecionado');
        } else {
            item.classList.remove('selecionado');
        }
    });
    
    console.log('Livro selecionado com sucesso');
}

async function salvarNovaSugestao() {
    console.log('Salvando nova sugestão');
    
    if (!livroSelecionadoSugestao || !livroSelecionadoSugestao.dadosAdicionais) {
        mostrarAlerta('Por favor, selecione um livro primeiro', 'erro');
        return;
    }
    
    const campoJustificativa = document.getElementById('sugestao-justificativa-selected');
    if (!campoJustificativa) {
        console.error('Campo de justificativa não encontrado');
        return;
    }
    
    const justificativa = campoJustificativa.value.trim();
    
    if (!justificativa) {
        mostrarAlerta('Por favor, explique por que você sugere este livro', 'erro');
        campoJustificativa.focus();
        return;
    }
    
    try {
        const dadosSugestao = {
            titulo: livroSelecionadoSugestao.dadosAdicionais.titulo,
            autor: livroSelecionadoSugestao.dadosAdicionais.autor || null,
            justificativa: justificativa,
            imagemUrl: livroSelecionadoSugestao.dadosAdicionais.imagemUrl,
            paginas: livroSelecionadoSugestao.dadosAdicionais.paginas
        };
        
        console.log('Enviando dados da sugestão:', dadosSugestao);
        
        const botaoSugerir = document.querySelector('.botao-sugerir');
        const textoOriginal = botaoSugerir.innerHTML;
        botaoSugerir.disabled = true;
        botaoSugerir.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Criando...';
        
        const response = await fetch(`/api/clube/${clubeId}/sugestoes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosSugestao)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('Sugestão criada com sucesso:', data.sugestao);
            mostrarAlerta('Sugestão criada com sucesso!', 'sucesso');
            fecharModalNovaSugestao();
            sugestoesCarregadas = false;
            carregarSugestoes();
        } else {
            console.error('Erro do servidor:', data);
            mostrarAlerta(data.erro || 'Erro ao criar sugestão', 'erro');
        }
    } catch (error) {
        console.error('Erro ao criar sugestão:', error);
        mostrarAlerta('Erro ao conectar com o servidor', 'erro');
    } finally {
        const botaoSugerir = document.querySelector('.botao-sugerir');
        if (botaoSugerir) {
            botaoSugerir.disabled = false;
            botaoSugerir.innerHTML = '<i class="fa fa-check"></i> Criar Sugestão';
        }
    }
}

function voltarParaBusca() {
    console.log('Voltando para busca');
    
    const buscaContainer = document.getElementById('busca-container');
    const selectedContainer = document.getElementById('selected-book-container-sugestao');
    const botaoSugerir = document.querySelector('.botao-sugerir');
    
    if (buscaContainer) buscaContainer.style.display = 'block';
    if (selectedContainer) selectedContainer.style.display = 'none';
    if (botaoSugerir) botaoSugerir.style.display = 'none';
    
    livroSelecionadoSugestao = null;
    
    // Limpar seleção visual
    document.querySelectorAll('.livro-resultado').forEach(item => {
        item.classList.remove('selecionado');
    });
}
async function carregarSugestoes() {
    if (sugestoesCarregadas) return;
    
    try {
        const response = await fetch(`/api/clube/${clubeId}/sugestoes`);
        const data = await response.json();
        
        const container = document.getElementById('sugestoes-lista');
        
        if (response.ok && data.length > 0) {
            container.innerHTML = data.map(sugestao => `
                <div class="sugestao-card">
                    <div class="sugestao-header">
                        <div class="sugestao-info">
                            <h4>${escapeHtml(sugestao.titulo)}</h4>
                            ${sugestao.autor ? `<p class="sugestao-autor">por ${escapeHtml(sugestao.autor)}</p>` : ''}
                        </div>
                        ${sugestao.imagemUrl ? `
                            <div class="sugestao-capa">
                                <img src="${sugestao.imagemUrl}" alt="${escapeHtml(sugestao.titulo)}" onerror="this.style.display='none'">
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="sugestao-meta">
                        <div class="sugestao-usuario-info">
                            <div class="usuario-avatar" onclick="irParaPerfil(${sugestao.id_usuario})" title="Ver perfil de ${escapeHtml(sugestao.nome_usuario)}">
                                ${sugestao.foto_perfil ? 
                                    `<img src="${sugestao.foto_perfil}" alt="${escapeHtml(sugestao.nome_usuario)}" onerror="this.parentElement.innerHTML='<div class=\\'usuario-avatar-placeholder\\'>${sugestao.nome_usuario.charAt(0).toUpperCase()}</div>'">` :
                                    `<div class="usuario-avatar-placeholder">${sugestao.nome_usuario.charAt(0).toUpperCase()}</div>`
                                }
                            </div>
                            <div class="sugestao-usuario-data">
                                <span class="sugestao-usuario" onclick="irParaPerfil(${sugestao.id_usuario})" title="Ver perfil de ${escapeHtml(sugestao.nome_usuario)}">${escapeHtml(sugestao.nome_usuario)}</span>
                                <span class="sugestao-data">sugeriu ${formatarDataSugestao(sugestao.data_sugestao)}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${sugestao.paginas ? `
                        <div class="sugestao-detalhes">
                            <span class="sugestao-paginas">${sugestao.paginas} páginas</span>
                        </div>
                    ` : ''}
                    
                    ${sugestao.justificativa ? `
                        <div class="sugestao-justificativa">
                            <strong>Por que esta sugestão:</strong><br>
                            ${escapeHtml(sugestao.justificativa)}
                        </div>
                    ` : ''}
                    
                    ${sugestao.id_usuario === parseInt(userId) ? `
                    <div class="sugestao-acoes">
                        <button class="botao-pequeno botao-excluir" onclick="excluirSugestao(${sugestao.id})">
                            <i class="fa fa-trash"></i> Excluir
                        </button>
                    </div>
                ` : ''}
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="sem-sugestoes">
                    <i class="fa fa-lightbulb-o"></i>
                    <h4>Nenhuma sugestão ainda</h4>
                    <p>Seja o primeiro a sugerir um livro para o clube!</p>
                </div>
            `;
        }
        
        sugestoesCarregadas = true;
    } catch (error) {
        console.error('Erro ao carregar sugestões:', error);
        document.getElementById('sugestoes-lista').innerHTML = `
            <div class="loading-sugestoes">
                <i class="fa fa-exclamation-triangle"></i>
                <p>Erro ao carregar sugestões</p>
            </div>
        `;
    }
}

async function editarSugestao(sugestaoId) {
    mostrarAlerta('Funcionalidade de edição em desenvolvimento', 'info');
}

async function excluirSugestao(sugestaoId) {
    if (!confirm('Tem certeza que deseja excluir esta sugestão?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/clube/${clubeId}/sugestoes/${sugestaoId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('Sugestão excluída com sucesso!', 'sucesso');
            sugestoesCarregadas = false;
            carregarSugestoes();
        } else {
            mostrarAlerta(data.erro || 'Erro ao excluir sugestão', 'erro');
        }
    } catch (error) {
        console.error('Erro ao excluir sugestão:', error);
        mostrarAlerta('Erro ao conectar com o servidor', 'erro');
    }
}

function recarregarSugestoes() {
    sugestoesCarregadas = false;
    document.getElementById('sugestoes-lista').innerHTML = `
        <div class="loading-sugestoes">
            <i class="fa fa-spinner fa-spin"></i>
            <p>Carregando sugestões...</p>
        </div>
    `;
    carregarSugestoes();
}

function formatarDataSugestao(dataString) {
    const data = new Date(dataString);
    const agora = new Date();
    const diffMs = agora - data;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDias === 0) {
        return 'Hoje';
    } else if (diffDias === 1) {
        return 'Ontem';
    } else if (diffDias < 7) {
        return `${diffDias} dias atrás`;
    } else {
        return data.toLocaleDateString('pt-BR');
    }
}

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

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando event listeners de sugestões');
    
    document.addEventListener('click', function(e) {
        if (e.target.id === 'overlay-sugestao') {
            fecharModalNovaSugestao();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modal-nova-sugestao');
            if (modal && modal.style.display === 'block') {
                fecharModalNovaSugestao();
            }
        }
    });
    
    const campoBusca = document.getElementById('busca-livro-sugestao');
    if (campoBusca) {
        campoBusca.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarLivrosSugestao();
            }
        });
    }
    
    const selectedContainer = document.getElementById('selected-book-container-sugestao');
    if (selectedContainer) {
        if (!selectedContainer.querySelector('.botao-voltar-busca')) {
            const voltarButton = document.createElement('button');
            voltarButton.type = 'button';
            voltarButton.className = 'botao-voltar-busca botao-pequeno';
            voltarButton.innerHTML = '<i class="fa fa-arrow-left"></i> Voltar à busca';
            voltarButton.onclick = voltarParaBusca;
            
            // Inserir no início do container
            selectedContainer.insertBefore(voltarButton, selectedContainer.firstChild);
        }
    }
});


