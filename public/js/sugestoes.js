let livroSelecionadoSugestao = null;
let resultadosBuscaSugestao = [];
let sugestoesCarregadas = false;

function abrirModalNovaSugestao() {
    const modal = document.getElementById('modal-nova-sugestao');
    const overlay = document.getElementById('overlay-sugestao');
    
    document.getElementById('form-nova-sugestao').reset();
    document.getElementById('search-results-sugestao').innerHTML = '';
    document.getElementById('selected-book-container-sugestao').style.display = 'none';
    livroSelecionadoSugestao = null;
    resultadosBuscaSugestao = [];
    
    mudarTabSugestao('buscar');
    
    modal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function fecharModalNovaSugestao() {
    const modal = document.getElementById('modal-nova-sugestao');
    const overlay = document.getElementById('overlay-sugestao');
    
    modal.style.display = 'none';
    overlay.style.display = 'none';
    document.body.style.overflow = '';
}
function mudarTabSugestao(tab) {
    document.querySelectorAll('.tab-item-sugestao').forEach(el => el.classList.remove('tab-ativo'));
    document.querySelectorAll('.tab-content-sugestao').forEach(el => el.style.display = 'none');
    
    const tabElement = document.querySelector(`.tab-item-sugestao[data-tab="${tab}"]`);
    const contentElement = document.getElementById(`tab-sugestao-${tab}`);
    
    if (tabElement) tabElement.classList.add('tab-ativo');
    if (contentElement) contentElement.style.display = 'block';
    
    if (tab === 'buscar') {
        document.getElementById('selected-book-container-sugestao').style.display = 'none';
        livroSelecionadoSugestao = null;
    }
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
                                <img src="${sugestao.imagemUrl}" alt="${escapeHtml(sugestao.titulo)}">
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="sugestao-meta">
                        <div class="sugestao-usuario">
                            <div class="usuario-avatar">${sugestao.nome_usuario.charAt(0).toUpperCase()}</div>
                            <span>Sugerido por ${escapeHtml(sugestao.nome_usuario)}</span>
                        </div>
                        <span class="sugestao-data">${formatarDataSugestao(sugestao.data_sugestao)}</span>
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
                            <button class="botao-pequeno botao-editar" onclick="editarSugestao(${sugestao.id})">
                                <i class="fa fa-edit"></i> Editar
                            </button>
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

async function buscarLivrosSugestao() {
    const termoBusca = document.getElementById('busca-livro-sugestao').value.trim();
    if (!termoBusca) {
        mostrarAlerta('Por favor, digite um termo de busca', 'erro');
        return;
    }
    
    const resultsContainer = document.getElementById('search-results-sugestao');
    resultsContainer.innerHTML = '<div class="carregando"><i class="fa fa-spinner fa-spin"></i> Buscando livros...</div>';
    
    try {
        const response = await fetch(`/api/livros/buscar?q=${encodeURIComponent(termoBusca)}`);
        if (!response.ok) throw new Error('Erro na busca de livros');
        
        const data = await response.json();
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
                <img src="${capa}" alt="${titulo}" class="livro-capa-pequena">
                <div class="livro-info">
                    <h4>${titulo}</h4>
                    <p>Autor: ${autores}</p>
                    <p>Páginas: ${paginas}</p>
                </div>
                <button class="botao-selecionar" onclick="selecionarLivroSugestao(${index})">Selecionar</button>
            `;
            resultsContainer.appendChild(livroItem);
        });
    } catch (error) {
        console.error('Erro na busca:', error);
        resultsContainer.innerHTML = '<div class="erro-busca">Erro ao buscar livros. Tente novamente.</div>';
    }
}
function selecionarLivroSugestao(index) {
    if (!resultadosBuscaSugestao[index]) return;
    
    const livro = resultadosBuscaSugestao[index];
    livroSelecionadoSugestao = livro;
    
    const volumeInfo = livro.volumeInfo;
    const container = document.getElementById('selected-book-container-sugestao');
    const coverDiv = document.getElementById('selected-book-cover-sugestao');
    const titleElement = document.getElementById('selected-book-title-sugestao');
    const authorElement = document.getElementById('selected-book-author-sugestao');
    const pagesElement = document.getElementById('selected-book-pages-sugestao');
    
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
    coverDiv.innerHTML = `<img src="${capa}" alt="${volumeInfo.title}">`;
    titleElement.textContent = volumeInfo.title || 'Título não disponível';
    authorElement.textContent = volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Autor não informado';
    pagesElement.textContent = volumeInfo.pageCount ? `${volumeInfo.pageCount} páginas` : 'Número de páginas não informado';
    
    document.getElementById('sugestao-titulo').value = volumeInfo.title || '';
    document.getElementById('sugestao-autor').value = volumeInfo.authors ? volumeInfo.authors.join(', ') : '';
    
    livroSelecionadoSugestao.dadosAdicionais = {
        imagemUrl: imagemUrl,
        paginas: volumeInfo.pageCount || null
    };
    
    console.log('Livro selecionado com dados:', {
        titulo: volumeInfo.title,
        autor: volumeInfo.authors ? volumeInfo.authors.join(', ') : null,
        imagemUrl: imagemUrl,
        paginas: volumeInfo.pageCount,
        volumeInfo: volumeInfo
    });
    
    container.style.display = 'flex';
    
    document.querySelectorAll('.livro-resultado').forEach((item, i) => {
        if (i === index) {
            item.classList.add('selecionado');
        } else {
            item.classList.remove('selecionado');
        }
    });
    

    mudarTabSugestao('manual');
}
async function salvarNovaSugestao() {
    const titulo = document.getElementById('sugestao-titulo').value.trim();
    const autor = document.getElementById('sugestao-autor').value.trim();
    const justificativa = document.getElementById('sugestao-justificativa').value.trim();
    
    if (!titulo) {
        mostrarAlerta('Por favor, informe o título do livro', 'erro');
        document.getElementById('sugestao-titulo').focus();
        return;
    }
    
    try {
        const dadosSugestao = {
            titulo,
            autor: autor || null,
            justificativa: justificativa || null,
            imagemUrl: null,
            paginas: null
        };
        
        if (livroSelecionadoSugestao && livroSelecionadoSugestao.dadosAdicionais) {
            dadosSugestao.imagemUrl = livroSelecionadoSugestao.dadosAdicionais.imagemUrl;
            dadosSugestao.paginas = livroSelecionadoSugestao.dadosAdicionais.paginas;
            
            console.log('Usando dados adicionais do livro selecionado:', {
                imagemUrl: dadosSugestao.imagemUrl,
                paginas: dadosSugestao.paginas
            });
        }
        
        console.log('Enviando dados da sugestão:', dadosSugestao);
        
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

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        if (e.target.id === 'overlay-sugestao') {
            fecharModalNovaSugestao();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fecharModalNovaSugestao();
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
});


