let clubeInfo = null;
let leituraAtual = null;
let livroSelecionado = null;
let sugestaoSelecionada = null;
let resultadosBusca = [];
let atualizacaoEditando = null;
let sugestoesSorteio = []; // Nova variável para controlar sugestões do sorteio

document.addEventListener('DOMContentLoaded', function() {
    if (typeof clubeId !== 'undefined') {
        carregarInformacoesClube(clubeId);
        verificarPermissoesCriador(clubeId);
    }
    
    configurarValidacoesDatas();
});

function configurarValidacoesDatas() {
    const dataInicioInput = document.getElementById('data-inicio');
    const dataFimInput = document.getElementById('data-fim');
    
    if (dataInicioInput) {
        const hoje = new Date().toISOString().split('T')[0];
        dataInicioInput.min = hoje;
        
        dataInicioInput.value = hoje;
        
        dataInicioInput.addEventListener('change', function() {
            validarDataInicio();
            atualizarDataFimMinima();
        });
        
        dataInicioInput.addEventListener('blur', validarDataInicio);
    }
    
    if (dataFimInput) {
        dataFimInput.addEventListener('change', validarDataFim);
        dataFimInput.addEventListener('blur', validarDataFim);
    }
}

function validarDataInicio() {
    const dataInicioInput = document.getElementById('data-inicio');
    if (!dataInicioInput) return true;
    
    const dataInicio = new Date(dataInicioInput.value);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); 
    
    if (dataInicio < hoje) {
        mostrarAlerta('A data de início não pode ser anterior a hoje', 'erro');
        dataInicioInput.value = new Date().toISOString().split('T')[0];
        dataInicioInput.focus();
        return false;
    }
    
    return true;
}

function validarDataFim() {
    const dataInicioInput = document.getElementById('data-inicio');
    const dataFimInput = document.getElementById('data-fim');
    
    if (!dataInicioInput || !dataFimInput || !dataFimInput.value) return true;
    
    const dataInicio = new Date(dataInicioInput.value);
    const dataFim = new Date(dataFimInput.value);
    
    if (dataFim <= dataInicio) {
        mostrarAlerta('A data de término deve ser posterior à data de início', 'erro');
        dataFimInput.value = '';
        dataFimInput.focus();
        return false;
    }
    
    return true;
}

function atualizarDataFimMinima() {
    const dataInicioInput = document.getElementById('data-inicio');
    const dataFimInput = document.getElementById('data-fim');
    
    if (!dataInicioInput || !dataFimInput) return;
    
    if (dataInicioInput.value) {
        const dataInicio = new Date(dataInicioInput.value);
        dataInicio.setDate(dataInicio.getDate() + 1); // Mínimo um dia após o início
        dataFimInput.min = dataInicio.toISOString().split('T')[0];
        
        if (dataFimInput.value && new Date(dataFimInput.value) <= new Date(dataInicioInput.value)) {
            dataFimInput.value = '';
        }
    }
}

function mudarSecaoClube(secao) {
    document.querySelectorAll('.clube-secao').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('menu-item-ativo');
    });
    
    const secaoElement = document.getElementById(`secao-${secao}`);
    if (secaoElement) {
        secaoElement.style.display = 'block';
    }
    const menuItem = document.querySelector(`[data-secao="${secao}"]`);
    if (menuItem) {
        menuItem.classList.add('menu-item-ativo');
    }
    switch(secao) {
        case 'discussao':
            carregarAtualizacoes(clubeId);
            break;
        case 'livros-anteriores':
            carregarLeiturasClube(clubeId);
            break;
        case 'sugestoes-livros':
            carregarSugestoes();
            break;
        case 'encontros':
            carregarEncontros(clubeId);
            break;
        case 'membros':
            carregarMembrosCompleto(clubeId);
            break;
    }
}

async function carregarInformacoesClube(clubeId) {
    try {
        const response = await fetch(`/api/clube/${clubeId}`);
        if (!response.ok) throw new Error('Erro ao carregar clube');
        
        const clube = await response.json();
        clubeInfo = clube;
        
        document.getElementById('clube-titulo').textContent = clube.nome;
        document.getElementById('clube-nome').textContent = clube.nome;
        document.getElementById('clube-descricao').textContent = clube.descricao || 'Sem descrição';
        document.getElementById('clube-visibilidade').textContent = clube.visibilidade === 'publico' ? 'Público' : 'Privado';
        document.getElementById('clube-membros-count').textContent = `${clube.total_membros} membros`;
        
        const categoriasContainer = document.getElementById('clube-categorias');
        if (clube.categorias && clube.categorias.length > 0) {
            categoriasContainer.innerHTML = clube.categorias.map(cat => 
                `<span class="categoria-tag">${cat}</span>`
            ).join('');
        }
        
        if (clube.leitura_atual) {
            leituraAtual = clube.leitura_atual;
            atualizarLeituraAtual(clube.leitura_atual);
        } else {
            document.getElementById('livro-atual-info').innerHTML = '<p class="sem-leitura">Nenhum livro selecionado para leitura atual.</p>';
        }
        
        carregarAtualizacoes(clubeId);
        
    } catch (error) {
        console.error('Erro ao carregar informações do clube:', error);
        document.getElementById('clube-titulo').textContent = 'Erro ao carregar clube';
    }
}

function atualizarLeituraAtual(leitura) {
    const container = document.getElementById('livro-atual-info');
    const imagemContainer = document.getElementById('leitura-atual-imagem-container');
    
    container.innerHTML = `
        <h5>${leitura.titulo}</h5>
        <p><strong>Autor:</strong> ${leitura.autor || 'Não informado'}</p>
        ${leitura.paginas ? `<p><strong>Páginas:</strong> ${leitura.paginas}</p>` : ''}
        <p><strong>Início:</strong> ${new Date(leitura.data_inicio).toLocaleDateString('pt-BR')}</p>
        ${leitura.data_fim ? `<p><strong>Previsão de término:</strong> ${new Date(leitura.data_fim).toLocaleDateString('pt-BR')}</p>` : ''}
    `;
    
    if (leitura.imagemUrl) {
        imagemContainer.innerHTML = `<img src="${leitura.imagemUrl}" alt="${leitura.titulo}" class="livro-capa-atual">`;
    } else {
        imagemContainer.innerHTML = '';
    }
}

async function verificarPermissoesCriador() {
    try {
        const response = await fetch(`/api/clube/${clubeId}/permissoes`);
        const data = await response.json();
        
        if (response.ok) {
            const botaoSelecionar = document.getElementById('botao-selecionar-leitura-container');
            const botaoAgendar = document.getElementById('botao-agendar-encontro-container');
            const opcoesCreador = document.getElementById('opcoes-criador');
            
            const secaoVotacao = document.getElementById('secao-votacao');
            const menuVotacao = document.querySelector('[data-secao="votacao"]');
            
            if (data.isCriador) {
                if (botaoSelecionar) {
                    botaoSelecionar.style.display = 'block';
                }
                if (botaoAgendar) {
                    botaoAgendar.style.display = 'block';
                }
                if (opcoesCreador) {
                    opcoesCreador.style.display = 'block';
                }
            } else {
                if (botaoSelecionar) {
                    botaoSelecionar.style.display = 'none';
                }
                if (botaoAgendar) {
                    botaoAgendar.style.display = 'none';
                }
                if (opcoesCreador) {
                    opcoesCreador.style.display = 'none';
                }
            }
            if (secaoVotacao) {
                secaoVotacao.style.display = 'block';
            }
            if (menuVotacao) {
                menuVotacao.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
    }
}

function abrirModalSelecaoLeitura() {
    const modal = document.getElementById('modal-selecao-leitura');
    const overlay = document.getElementById('overlay');
    
    document.getElementById('form-selecao-leitura').reset();
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('selected-book-container').style.display = 'none';
    livroSelecionado = null;
    sugestaoSelecionada = null;
    resultadosBusca = [];
    sugestoesSorteio = []; // Limpar sugestões do sorteio
    
    mudarTabSelecaoLeitura('buscar');
    
    modal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        configurarValidacoesDatas();
    }, 100);
}

function fecharModalSelecaoLeitura() {
    const modal = document.getElementById('modal-selecao-leitura');
    const overlay = document.getElementById('overlay');
    
    modal.style.display = 'none';
    overlay.style.display = 'none';
    document.body.style.overflow = '';
}

function mudarTabSelecaoLeitura(tab) {
    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('tab-ativo'));
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    
    const tabElement = document.querySelector(`.tab-item[data-tab="${tab}"]`);
    const contentElement = document.getElementById(`tab-${tab}`);
    
    if (tabElement) tabElement.classList.add('tab-ativo');
    if (contentElement) contentElement.style.display = 'block';
    
    if (tab === 'sugestoes') {
        carregarSugestoesParaModal();
    } else if (tab === 'sorteio') {
        carregarSugestoesParaSorteio();
    }
    
    document.getElementById('selected-book-container').style.display = 'none';
    livroSelecionado = null;
    sugestaoSelecionada = null;
}

// Nova função para carregar sugestões para sorteio
async function carregarSugestoesParaSorteio() {
    try {
        const response = await fetch(`/api/clube/${clubeId}/sugestoes`);
        const data = await response.json();
        
        const container = document.getElementById('sugestoes-sorteio-lista');
        
        if (response.ok && data.length > 0) {
            window.sugestoesSorteioDisponiveis = data;
            container.innerHTML = data.map((sugestao, index) => `
                <div class="sugestao-sorteio-item" data-index="${index}">
                    <div class="sugestao-checkbox">
                        <input type="checkbox" id="sorteio-${index}" onchange="toggleSugestaoSorteio(${index})">
                    </div>
                    <div class="sugestao-info">
                        <h4>${escapeHtml(sugestao.titulo)}</h4>
                        <p>${sugestao.autor ? `por ${escapeHtml(sugestao.autor)}` : 'Autor não informado'}</p>
                        ${sugestao.paginas ? `<p>${sugestao.paginas} páginas</p>` : ''}
                        <small>Sugerido por ${escapeHtml(sugestao.nome_usuario)}</small>
                    </div>
                    ${sugestao.imagemUrl ? `<img src="${sugestao.imagemUrl}" alt="${escapeHtml(sugestao.titulo)}" class="sugestao-capa-pequena">` : ''}
                </div>
            `).join('');
            
            // Adicionar botões de controle
            container.innerHTML += `
                <div class="sorteio-controles">
                    <div class="sorteio-acoes">
                        <button type="button" class="botao-secundario" onclick="selecionarTodasSugestoes()">
                            <i class="fa fa-check-square-o"></i> Selecionar Todas
                        </button>
                        <button type="button" class="botao-secundario" onclick="desmarcarTodasSugestoes()">
                            <i class="fa fa-square-o"></i> Desmarcar Todas
                        </button>
                    </div>
                    <div class="contador-selecionadas">
                        <span id="contador-sugestoes">0 sugestões selecionadas</span>
                    </div>
                    <button type="button" class="botao-sorteio" onclick="realizarSorteio()" disabled>
                        <i class="fa fa-random"></i> Sortear Livro
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = '<div class="sem-sugestoes">Nenhuma sugestão disponível para sorteio</div>';
        }
    } catch (error) {
        console.error('Erro ao carregar sugestões para sorteio:', error);
        document.getElementById('sugestoes-sorteio-lista').innerHTML = '<div class="erro-sugestoes">Erro ao carregar sugestões</div>';
    }
}
// Função para alternar seleção de sugestão no sorteio
function toggleSugestaoSorteio(index) {
    const checkbox = document.getElementById(`sorteio-${index}`);
    const sugestao = window.sugestoesSorteioDisponiveis[index];
    
    if (checkbox.checked) {
        // Adicionar à lista de sorteio
        if (!sugestoesSorteio.find(s => s.id === sugestao.id)) {
            sugestoesSorteio.push(sugestao);
        }
    } else {
        // Remover da lista de sorteio
        sugestoesSorteio = sugestoesSorteio.filter(s => s.id !== sugestao.id);
    }
    
    atualizarContadorSugestoes();
}

// Função para selecionar todas as sugestões
function selecionarTodasSugestoes() {
    if (!window.sugestoesSorteioDisponiveis) return;
    
    window.sugestoesSorteioDisponiveis.forEach((sugestao, index) => {
        const checkbox = document.getElementById(`sorteio-${index}`);
        if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            if (!sugestoesSorteio.find(s => s.id === sugestao.id)) {
                sugestoesSorteio.push(sugestao);
            }
        }
    });
    
    atualizarContadorSugestoes();
}

// Função para desmarcar todas as sugestões
function desmarcarTodasSugestoes() {
    if (!window.sugestoesSorteioDisponiveis) return;
    
    window.sugestoesSorteioDisponiveis.forEach((sugestao, index) => {
        const checkbox = document.getElementById(`sorteio-${index}`);
        if (checkbox && checkbox.checked) {
            checkbox.checked = false;
        }
    });
    
    sugestoesSorteio = [];
    atualizarContadorSugestoes();
}

// Função para atualizar contador e botão de sorteio
function atualizarContadorSugestoes() {
    const contador = document.getElementById('contador-sugestoes');
    const botaoSorteio = document.querySelector('.botao-sorteio');
    
    if (contador) {
        const quantidade = sugestoesSorteio.length;
        contador.textContent = `${quantidade} ${quantidade === 1 ? 'sugestão selecionada' : 'sugestões selecionadas'}`;
    }
    
    if (botaoSorteio) {
        botaoSorteio.disabled = sugestoesSorteio.length === 0;
    }
}

// Função para realizar o sorteio
function realizarSorteio() {
    if (sugestoesSorteio.length === 0) {
        mostrarAlerta('Selecione pelo menos uma sugestão para o sorteio', 'erro');
        return;
    }
    
    // Mostrar modal de sorteio
    mostrarModalSorteio();
}

// Função para mostrar modal de sorteio com animação
function mostrarModalSorteio() {
    const modalSorteio = document.getElementById('modal-sorteio');
    const overlaySorteio = document.getElementById('overlay-sorteio');
    
    modalSorteio.style.display = 'block';
    overlaySorteio.style.display = 'block';
    
    // Iniciar animação de sorteio
    iniciarAnimacaoSorteio();
}

// Função para fechar modal de sorteio
function fecharModalSorteio() {
    const modalSorteio = document.getElementById('modal-sorteio');
    const overlaySorteio = document.getElementById('overlay-sorteio');
    
    modalSorteio.style.display = 'none';
    overlaySorteio.style.display = 'none';
}

// Função para iniciar animação de sorteio
function iniciarAnimacaoSorteio() {
    const resultadoContainer = document.getElementById('resultado-sorteio');
    const botaoConfirmarSorteio = document.getElementById('confirmar-sorteio');
    const botaoNovoSorteio = document.getElementById('novo-sorteio');
    
    // Resetar estado
    resultadoContainer.innerHTML = '';
    botaoConfirmarSorteio.style.display = 'none';
    botaoNovoSorteio.style.display = 'none';
    
    // Mostrar sugestões participantes
    const participantesContainer = document.getElementById('participantes-sorteio');
    participantesContainer.innerHTML = `
        <h4>Participantes do sorteio (${sugestoesSorteio.length}):</h4>
        <div class="participantes-lista">
            ${sugestoesSorteio.map(sugestao => `
                <div class="participante-item">
                    ${sugestao.imagemUrl ? `<img src="${sugestao.imagemUrl}" alt="${sugestao.titulo}" class="participante-capa">` : ''}
                    <div class="participante-info">
                        <strong>${escapeHtml(sugestao.titulo)}</strong>
                        <small>por ${escapeHtml(sugestao.autor || 'Autor não informado')}</small>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Iniciar sorteio após 2 segundos
    setTimeout(() => {
        executarSorteio();
    }, 2000);
}

// Função para executar o sorteio
function executarSorteio() {
    const resultadoContainer = document.getElementById('resultado-sorteio');
    
    // Mostrar animação de sorteio
    resultadoContainer.innerHTML = `
        <div class="sorteio-animacao">
            <div class="sorteio-spinner">
                <i class="fa fa-random fa-spin"></i>
            </div>
            <p>Sorteando...</p>
        </div>
    `;
    
    // Simular tempo de sorteio
    setTimeout(() => {
        // Selecionar sugestão aleatória
        const indiceSorteado = Math.floor(Math.random() * sugestoesSorteio.length);
        const sugestaoSorteada = sugestoesSorteio[indiceSorteado];
        
        // Mostrar resultado
        mostrarResultadoSorteio(sugestaoSorteada);
    }, 3000);
}

// Função para mostrar resultado do sorteio
function mostrarResultadoSorteio(sugestaoSorteada) {
    const resultadoContainer = document.getElementById('resultado-sorteio');
    const botaoConfirmarSorteio = document.getElementById('confirmar-sorteio');
    const botaoNovoSorteio = document.getElementById('novo-sorteio');
    
    resultadoContainer.innerHTML = `
        <div class="resultado-sorteio-card">
            <div class="resultado-header">
                <i class="fa fa-trophy resultado-icone"></i>
                <h3>Livro Sorteado!</h3>
            </div>
            <div class="livro-sorteado">
                ${sugestaoSorteada.imagemUrl ? `
                    <div class="livro-sorteado-capa">
                        <img src="${sugestaoSorteada.imagemUrl}" alt="${sugestaoSorteada.titulo}">
                    </div>
                ` : ''}
                <div class="livro-sorteado-info">
                    <h4>${escapeHtml(sugestaoSorteada.titulo)}</h4>
                    <p><strong>Autor:</strong> ${escapeHtml(sugestaoSorteada.autor || 'Não informado')}</p>
                    ${sugestaoSorteada.paginas ? `<p><strong>Páginas:</strong> ${sugestaoSorteada.paginas}</p>` : ''}
                    <p><strong>Sugerido por:</strong> ${escapeHtml(sugestaoSorteada.nome_usuario)}</p>
                </div>
            </div>
        </div>
    `;
    
    // Armazenar sugestão sorteada
    window.sugestaoSorteada = sugestaoSorteada;
    
    // Mostrar botões
    botaoConfirmarSorteio.style.display = 'inline-block';
    botaoNovoSorteio.style.display = 'inline-block';
}

// Função para confirmar sorteio e selecionar como leitura
function confirmarSorteio() {
    if (!window.sugestaoSorteada) {
        mostrarAlerta('Erro: nenhuma sugestão foi sorteada', 'erro');
        return;
    }
    
    // Fechar modal de sorteio
    fecharModalSorteio();
    
    // Selecionar a sugestão sorteada
    sugestaoSelecionada = window.sugestaoSorteada;
    livroSelecionado = null;
    
    // Mostrar no container de livro selecionado
    const container = document.getElementById('selected-book-container');
    const coverDiv = document.getElementById('selected-book-cover');
    const titleElement = document.getElementById('selected-book-title');
    const authorElement = document.getElementById('selected-book-author');
    const pagesElement = document.getElementById('selected-book-pages');
    
    coverDiv.innerHTML = sugestaoSelecionada.imagemUrl ? 
        `<img src="${sugestaoSelecionada.imagemUrl}" alt="${sugestaoSelecionada.titulo}">` : 
        `<div class="capa-placeholder"><i class="fa fa-book"></i></div>`;
    
    titleElement.textContent = sugestaoSelecionada.titulo;
    authorElement.textContent = sugestaoSelecionada.autor ? `Autor: ${sugestaoSelecionada.autor}` : 'Autor não informado';
    pagesElement.textContent = sugestaoSelecionada.paginas ? `${sugestaoSelecionada.paginas} páginas` : 'Número de páginas não informado';
    
    container.style.display = 'flex';
    
    // Configurar datas
    setTimeout(() => {
        configurarValidacoesDatas();
    }, 100);
    
    mostrarAlerta('Livro sorteado selecionado! Configure as datas e confirme a leitura.', 'sucesso');
}

async function carregarSugestoesParaModal() {
    try {
        const response = await fetch(`/api/clube/${clubeId}/sugestoes`);
        const data = await response.json();
        
        const container = document.getElementById('sugestoes-lista-modal');
        
        if (response.ok && data.length > 0) {
            window.sugestoesDisponiveis = data;
            container.innerHTML = data.map((sugestao, index) => `
                <div class="sugestao-item" onclick="selecionarSugestao(${index})">
                    <div class="sugestao-info">
                        <h4>${escapeHtml(sugestao.titulo)}</h4>
                        <p>${sugestao.autor ? `por ${escapeHtml(sugestao.autor)}` : 'Autor não informado'}</p>
                        <small>Sugerido por ${escapeHtml(sugestao.nome_usuario)}</small>
                    </div>
                    ${sugestao.imagemUrl ? `<img src="${sugestao.imagemUrl}" alt="${escapeHtml(sugestao.titulo)}" class="sugestao-capa-pequena">` : ''}
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="sem-sugestoes">Nenhuma sugestão disponível</div>';
        }
    } catch (error) {
        console.error('Erro ao carregar sugestões para modal:', error);
        document.getElementById('sugestoes-lista-modal').innerHTML = '<div class="erro-sugestoes">Erro ao carregar sugestões</div>';
    }
}

function selecionarSugestao(index) {
    if (!window.sugestoesDisponiveis || !window.sugestoesDisponiveis[index]) {
        console.error('Sugestão não encontrada');
        return;
    }
    
    const sugestao = window.sugestoesDisponiveis[index];
    sugestaoSelecionada = sugestao;
    livroSelecionado = null; 
    
    const container = document.getElementById('selected-book-container');
    const coverDiv = document.getElementById('selected-book-cover');
    const titleElement = document.getElementById('selected-book-title');
    const authorElement = document.getElementById('selected-book-author');
    const pagesElement = document.getElementById('selected-book-pages');
    
    coverDiv.innerHTML = sugestao.imagemUrl ? 
        `<img src="${sugestao.imagemUrl}" alt="${sugestao.titulo}">` : 
        `<div class="capa-placeholder"><i class="fa fa-book"></i></div>`;
    
    titleElement.textContent = sugestao.titulo;
    authorElement.textContent = sugestao.autor ? `Autor: ${sugestao.autor}` : 'Autor não informado';
    pagesElement.textContent = sugestao.paginas ? `${sugestao.paginas} páginas` : 'Número de páginas não informado';
    
    container.style.display = 'flex';
    
    setTimeout(() => {
        configurarValidacoesDatas();
    }, 100);
    
    document.querySelectorAll('.sugestao-item').forEach((item, i) => {
        if (i === index) {
            item.classList.add('selecionado');
        } else {
            item.classList.remove('selecionado');
        }
    });
}

async function buscarLivros() {
    const termoBusca = document.getElementById('busca-livro').value.trim();
    if (!termoBusca) {
        mostrarAlerta('Por favor, digite um termo de busca', 'erro');
        return;
    }
    
    const resultsContainer = document.getElementById('search-results');
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
        
        resultadosBusca = data.items;
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
                <button class="botao-selecionar" onclick="selecionarLivro(${index})">Selecionar</button>
            `;
            resultsContainer.appendChild(livroItem);
        });
    } catch (error) {
        console.error('Erro na busca:', error);
        resultsContainer.innerHTML = '<div class="erro-busca">Erro ao buscar livros. Tente novamente.</div>';
    }
}

function selecionarLivro(index) {
    if (!resultadosBusca[index]) return;
    
    const livro = resultadosBusca[index];
    livroSelecionado = livro;
    sugestaoSelecionada = null; 
    
    const volumeInfo = livro.volumeInfo;
    const container = document.getElementById('selected-book-container');
    const coverDiv = document.getElementById('selected-book-cover');
    const titleElement = document.getElementById('selected-book-title');
    const authorElement = document.getElementById('selected-book-author');
    const pagesElement = document.getElementById('selected-book-pages');
    
    const capa = volumeInfo.imageLinks?.thumbnail || '/img/capa-padrao.jpg';
    coverDiv.innerHTML = `<img src="${capa}" alt="${volumeInfo.title}">`;
    titleElement.textContent = volumeInfo.title || 'Título não disponível';
    authorElement.textContent = volumeInfo.authors ? `Autor: ${volumeInfo.authors.join(', ')}` : 'Autor não informado';
    pagesElement.textContent = volumeInfo.pageCount ? `${volumeInfo.pageCount} páginas` : 'Número de páginas não informado';
    
    container.style.display = 'flex';
    
    setTimeout(() => {
        configurarValidacoesDatas();
    }, 100);
    
    document.querySelectorAll('.livro-resultado').forEach((item, i) => {
        if (i === index) {
            item.classList.add('selecionado');
        } else {
            item.classList.remove('selecionado');
        }
    });
}

async function salvarNovaLeitura() {
    const dataInicio = document.getElementById('data-inicio').value;
    const dataFim = document.getElementById('data-fim').value;
    
    if (!dataInicio) {
        mostrarAlerta('Por favor, informe a data de início da leitura', 'erro');
        document.getElementById('data-inicio').focus();
        return;
    }
    
    if (!validarDataInicio()) {
        return;
    }
    
    if (dataFim && !validarDataFim()) {
        return;
    }
    
    if (!livroSelecionado && !sugestaoSelecionada) {
        mostrarAlerta('Por favor, selecione um livro ou sugestão', 'erro');
        return;
    }
    
    try {
        let dadosLeitura;
        
        if (sugestaoSelecionada) {
            dadosLeitura = {
                titulo: sugestaoSelecionada.titulo,
                autor: sugestaoSelecionada.autor,
                dataInicio,
                dataFim: dataFim || null,
                paginas: sugestaoSelecionada.paginas,
                imagemUrl: sugestaoSelecionada.imagemUrl,
                idCriador: userId
            };
        } else {
            const volumeInfo = livroSelecionado.volumeInfo;
            dadosLeitura = {
                titulo: volumeInfo.title,
                autor: volumeInfo.authors ? volumeInfo.authors.join(', ') : null,
                dataInicio,
                dataFim: dataFim || null,
                paginas: volumeInfo.pageCount,
                imagemUrl: volumeInfo.imageLinks?.thumbnail,
                idCriador: userId
            };
        }
        
        const botaoConfirmar = document.getElementById('confirmarLeitura');
        const textoOriginal = botaoConfirmar.textContent;
        botaoConfirmar.disabled = true;
        botaoConfirmar.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Salvando...';
        
        const response = await fetch(`/api/clube/${clubeId}/leituras`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosLeitura)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('Nova leitura definida com sucesso!', 'sucesso');
            fecharModalSelecaoLeitura();
            carregarInformacoesClube(clubeId);
            carregarLeiturasClube(clubeId);
        } else {
            mostrarAlerta(data.erro || 'Erro ao definir nova leitura', 'erro');
        }
    } catch (error) {
        console.error('Erro ao salvar nova leitura:', error);
        mostrarAlerta('Erro ao conectar com o servidor', 'erro');
    } finally {
        const botaoConfirmar = document.getElementById('confirmarLeitura');
        if (botaoConfirmar) {
            botaoConfirmar.disabled = false;
            botaoConfirmar.textContent = 'Confirmar';
        }
    }
}

async function carregarLeiturasClube(clubeId) {
    try {
        const response = await fetch(`/api/clube/${clubeId}/leituras`);
        const data = await response.json();
        
        if (response.ok) {
            const leituraAtualContainer = document.getElementById('livro-atual-info-completo');
            if (data.leituraAtual) {
                leituraAtualContainer.innerHTML = `
                    <div class="leitura-atual-detalhada">
                        ${data.leituraAtual.imagemUrl ? `
                            <div class="leitura-capa">
                                <img src="${data.leituraAtual.imagemUrl}" alt="${data.leituraAtual.titulo}">
                            </div>
                        ` : ''}
                        <div class="leitura-info">
                            <h4>${data.leituraAtual.titulo}</h4>
                            <p><strong>Autor:</strong> ${data.leituraAtual.autor || 'Não informado'}</p>
                            ${data.leituraAtual.paginas ? `<p><strong>Páginas:</strong> ${data.leituraAtual.paginas}</p>` : ''}
                            <p><strong>Início:</strong> ${new Date(data.leituraAtual.data_inicio).toLocaleDateString('pt-BR')}</p>
                            ${data.leituraAtual.data_fim ? `<p><strong>Previsão de término:</strong> ${new Date(data.leituraAtual.data_fim).toLocaleDateString('pt-BR')}</p>` : ''}
                        </div>
                    </div>
                `;
            } else {
                leituraAtualContainer.innerHTML = '<p class="sem-leitura">Nenhum livro selecionado para leitura atual.</p>';
            }
                        const leiturasAnterioresGrid = document.getElementById('leituras-anteriores-grid');
            if (data.leiturasAnteriores && data.leiturasAnteriores.length > 0) {
                leiturasAnterioresGrid.innerHTML = data.leiturasAnteriores.map(leitura => `
                    <div class="leitura-card">
                        ${leitura.imagemUrl ? `
                            <div class="leitura-capa-pequena">
                                <img src="${leitura.imagemUrl}" alt="${leitura.titulo}">
                            </div>
                        ` : ''}
                        <div class="leitura-info-pequena">
                            <h5>${leitura.titulo}</h5>
                            <p>${leitura.autor || 'Autor não informado'}</p>
                            <small>Lido em ${new Date(leitura.data_inicio).toLocaleDateString('pt-BR')}</small>
                        </div>
                    </div>
                `).join('');
            } else {
                leiturasAnterioresGrid.innerHTML = '<p class="sem-leituras">Nenhuma leitura anterior encontrada.</p>';
            }
        } else {
            console.error('Erro ao carregar leituras:', data.erro);
        }
    } catch (error) {
        console.error('Erro ao carregar leituras:', error);
    }
}

async function carregarMembrosCompleto(clubeId) {
    try {
        const response = await fetch(`/api/clube/${clubeId}/membros`);
        const data = await response.json();
        
        if (response.ok) {
            const container = document.getElementById('clube-membros-lista-completa');
            
            if (data.membros && data.membros.length > 0) {
                container.innerHTML = `
                    <div class="membros-grid">
                        ${data.membros.map(membro => `
                            <div class="membro-card ${membro.is_criador ? 'membro-criador' : ''}">
                                <div class="membro-avatar">
                                    ${membro.nome.charAt(0).toUpperCase()}
                                </div>
                                <div class="membro-info">
                                    <h4>${escapeHtml(membro.nome)}</h4>
                                    <p>${escapeHtml(membro.email)}</p>
                                    ${membro.is_criador ? '<span class="badge-criador">Criador</span>' : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                container.innerHTML = '<p class="sem-membros">Nenhum membro encontrado.</p>';
            }
        } else {
            console.error('Erro ao carregar membros:', data.erro);
            document.getElementById('clube-membros-lista-completa').innerHTML = '<p class="erro-membros">Erro ao carregar membros do clube.</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar membros:', error);
        document.getElementById('clube-membros-lista-completa').innerHTML = '<p class="erro-membros">Erro ao conectar com o servidor.</p>';
    }
}

function voltarParaTelaAnterior() {
    window.history.back();
}

document.addEventListener('DOMContentLoaded', function() {
    const buscaInput = document.getElementById('busca-livro');
    if (buscaInput) {
        buscaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarLivros();
            }
        });
    }
    
    document.addEventListener('click', function(e) {
        if (e.target.id === 'overlay') {
            fecharModalSelecaoLeitura();
        }
        if (e.target.id === 'overlay-sorteio') {
            fecharModalSorteio();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fecharModalSelecaoLeitura();
            fecharModalNovaSugestao();
            fecharModalSorteio();
        }
    });
});

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

async function carregarSugestoesModal() {
    try {
        const response = await fetch(`/api/clube/${clubeId}/sugestoes`);
        const data = await response.json();
        
        const container = document.getElementById('sugestoes-lista-modal');
        
        if (!response.ok) {
            container.innerHTML = '<div class="erro-carregamento">Erro ao carregar sugestões</div>';
            return;
        }
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="mensagem-vazia">Nenhuma sugestão disponível</div>';
            return;
        }
        
        container.innerHTML = data.map(sugestao => `
            <div class="sugestao-item" onclick="selecionarSugestaoComoLeitura(${JSON.stringify(sugestao).replace(/"/g, '&quot;')})">
                <div class="sugestao-capa">
                    ${sugestao.imagemUrl ? 
                        `<img src="${sugestao.imagemUrl}" alt="${sugestao.titulo}">` : 
                        '<div class="capa-placeholder"><i class="fa fa-book"></i></div>'
                    }
                </div>
                               <div class="sugestao-info">
                    <h4>${sugestao.titulo}</h4>
                    <p>por ${sugestao.autor || 'Autor não informado'}</p>
                    ${sugestao.paginas ? `<p>${sugestao.paginas} páginas</p>` : ''}
                    <p class="sugerido-por">Sugerido por ${sugestao.nome_usuario}</p>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar sugestões:', error);
        document.getElementById('sugestoes-lista-modal').innerHTML = 
            '<div class="erro-carregamento">Erro ao carregar sugestões</div>';
    }
}

function selecionarSugestaoComoLeitura(sugestao) {
    console.log('Selecionando sugestão:', sugestao);
    
    livroSelecionado = {
        volumeInfo: {
            title: sugestao.titulo,
            authors: sugestao.autor ? [sugestao.autor] : [],
            pageCount: sugestao.paginas,
            imageLinks: sugestao.imagemUrl ? { thumbnail: sugestao.imagemUrl } : null
        }
    };
    
    const container = document.getElementById('selected-book-container');
    const coverDiv = document.getElementById('selected-book-cover');
    const titleElement = document.getElementById('selected-book-title');
    const authorElement = document.getElementById('selected-book-author');
    const pagesElement = document.getElementById('selected-book-pages');
    
    if (sugestao.imagemUrl) {
        coverDiv.innerHTML = `<img src="${sugestao.imagemUrl}" alt="${sugestao.titulo}">`;
    } else {
        coverDiv.innerHTML = '<div class="capa-placeholder"><i class="fa fa-book"></i></div>';
    }
    
    titleElement.textContent = sugestao.titulo;
    authorElement.textContent = sugestao.autor || 'Autor não informado';
    pagesElement.textContent = sugestao.paginas ? `${sugestao.paginas} páginas` : 'Número de páginas não informado';
    
    container.style.display = 'flex';
    
    setTimeout(() => {
        configurarValidacoesDatas();
    }, 100);
    
    document.querySelectorAll('.sugestao-item').forEach(item => {
        item.classList.remove('selecionado');
    });
    event.currentTarget.classList.add('selecionado');
    
    console.log('Livro selecionado configurado:', livroSelecionado);
}


        

