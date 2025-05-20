document.addEventListener('DOMContentLoaded', () => {
    const clubeId = window.location.pathname.split('/').pop();
    carregarInformacoesClube(clubeId);
    verificarPermissoesCriador(clubeId);
    document.querySelectorAll('.menu-item').forEach(item => 
        item.addEventListener('click', () => mudarSecaoClube(item.dataset.secao)));
    mudarSecaoClube('discussao');
    const hoje = new Date().toISOString().split('T')[0];
    const camposData = ['data-inicio', 'data-fim', 'data-inicio-manual', 'data-fim-manual'];
    camposData.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.setAttribute('min', hoje);

            if (id === 'data-inicio' || id === 'data-inicio-manual') {
                campo.value = hoje;
            }
        }
    });
    const camposInicio = ['data-inicio', 'data-inicio-manual'];
    camposInicio.forEach(id => {
        const campoInicio = document.getElementById(id);
        if (campoInicio) {
            campoInicio.addEventListener('change', () => {
                const idFim = id === 'data-inicio' ? 'data-fim' : 'data-fim-manual';
                const campoFim = document.getElementById(idFim);
                if (campoFim) {
                    campoFim.setAttribute('min', campoInicio.value);
                    if (campoFim.value && campoFim.value < campoInicio.value) {
                        campoFim.value = campoInicio.value;
                    }
                }
            });
        }
    });
    const buscaInput = document.getElementById('busca-livro');
    if (buscaInput) buscaInput.addEventListener('keypress', e => { if (e.key === 'Enter') { e.preventDefault(); buscarLivros(); }});
    
    const menuItemLivros = document.querySelector('.menu-item[data-secao="livros-anteriores"]');
    if (menuItemLivros) menuItemLivros.addEventListener('click', () => carregarLeiturasClube(clubeId));
});

let livroSelecionado = null, resultadosBusca = [];

async function carregarInformacoesClube(clubeId) {
    try {
        document.getElementById('clube-titulo').textContent = 'Carregando...';
        const response = await fetch(`/api/clube/${clubeId}`);
        if (!response.ok) throw new Error((await response.json()).erro || 'Erro ao carregar informações do clube');
        
        const clube = await response.json();
        document.getElementById('clube-titulo').textContent = clube.nome;
        document.getElementById('clube-nome').textContent = clube.nome;
        document.getElementById('clube-descricao').textContent = clube.descricao || 'Sem descrição';
        
        const visibilidadeBadge = document.getElementById('clube-visibilidade');
        visibilidadeBadge.textContent = clube.visibilidade;
        visibilidadeBadge.className = `visibilidade-badge ${clube.visibilidade}`;
        
        const categoriasContainer = document.getElementById('clube-categorias');
        categoriasContainer.innerHTML = '';
        
        if (clube.categorias?.length > 0) {
            clube.categorias.forEach(categoria => {
                const span = document.createElement('span');
                span.className = 'categoria-tag';
                span.textContent = categoria;
                categoriasContainer.appendChild(span);
            });
        } else {
            categoriasContainer.innerHTML = '<span class="categoria-tag sem-categoria">Sem categorias</span>';
        }
        
        document.getElementById('clube-membros-count').textContent = `${clube.total_membros} membros`;
        carregarMembrosClube(clubeId);
        
        const livroAtualInfo = document.getElementById('livro-atual-info');
        const livroAtualImagemContainer = document.getElementById('leitura-atual-imagem-container');
        
        if (clube.leitura_atual) {
            livroAtualInfo.innerHTML = `
                <div class="livro-card">
                    <div class="livro-info">
                        <h4>${clube.leitura_atual.titulo}</h4>
                        <p>Autor: ${clube.leitura_atual.autor || 'Não informado'}</p>
                    </div>
                </div>`;
            
            if (livroAtualImagemContainer) {
                livroAtualImagemContainer.innerHTML = `<img src="${clube.leitura_atual.imagemUrl || '/img/capa-padrao.jpg'}" 
                     alt="${clube.leitura_atual.titulo}" class="livro-capa">`;
            }
            atualizarProgressoLeitura(clube.leitura_atual.pagina_atual || 0, clube.leitura_atual.paginas || 100);
        } else {
            livroAtualInfo.innerHTML = '<p class="mensagem-vazia">Nenhum livro selecionado para leitura atual.</p>';
            if (livroAtualImagemContainer) livroAtualImagemContainer.innerHTML = '';
            atualizarProgressoLeitura(0, 100);
        }
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('clube-titulo').textContent = 'Erro ao carregar clube';
        alert('Não foi possível carregar as informações do clube. Tente novamente mais tarde.');
    }
}

function atualizarProgressoLeitura(paginaAtual, totalPaginas) {
    const porcentagem = totalPaginas > 0 ? Math.min(Math.round((paginaAtual / totalPaginas) * 100), 100) : 0;
    const progressoElement = document.querySelector('.progresso-preenchimento');
    if (progressoElement) progressoElement.style.width = `${porcentagem}%`;
    const progressoTexto = document.querySelector('.progresso-texto');
    if (progressoTexto) progressoTexto.textContent = `${porcentagem}% concluído`;
}

async function carregarMembrosClube(clubeId) {
    try {
        const membrosLista = document.getElementById('clube-membros-lista-completa');
        membrosLista.innerHTML = '<p class="carregando">Carregando membros...</p>';
        
        const response = await fetch(`/api/clube/${clubeId}/membros`);
        if (!response.ok) throw new Error('Erro ao carregar membros do clube');
        
        const data = await response.json();
        membrosLista.innerHTML = '';
        
        if (data.membros.length === 0) {
            membrosLista.innerHTML = '<p class="mensagem-vazia">Nenhum membro encontrado.</p>';
            return;
        }
        
        data.membros.forEach(membro => {
            const membroItem = document.createElement('div');
            membroItem.className = 'membro-item';
            membroItem.innerHTML = `
                <div class="membro-avatar"><i class="fa fa-user"></i></div>
                <div class="membro-info">
                    <span class="membro-nome">${membro.nome}</span>
                    ${membro.id === data.idCriador ? '<span class="badge-criador">Criador</span>' : ''}
                </div>`;
            membrosLista.appendChild(membroItem);
        });
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('clube-membros-lista-completa').innerHTML = 
            '<p class="erro-carregamento">Erro ao carregar membros do clube.</p>';
    }
}

async function verificarPermissoesCriador(clubeId) {
    try {
        const response = await fetch(`/api/clube/${clubeId}/permissoes`);
        if (!response.ok) throw new Error('Erro ao verificar permissões');
        
        const data = await response.json();
        
        ['opcoes-criador', 'botao-selecionar-leitura-container', 'botao-agendar-encontro-container']
            .forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = data.isCriador ? 'block' : 'none';
            });
        
        if (data.isCriador) {
            if (document.getElementById('editar-nome-clube')) 
                document.getElementById('editar-nome-clube').value = data.clube.nome;
            if (document.getElementById('editar-descricao-clube')) 
                document.getElementById('editar-descricao-clube').value = data.clube.descricao || '';
            
            if (data.clube.visibilidade === 'publico') {
                if (document.getElementById('editar-visibilidade-publico')) 
                    document.getElementById('editar-visibilidade-publico').checked = true;
            } else {
                if (document.getElementById('editar-visibilidade-privado')) 
                    document.getElementById('editar-visibilidade-privado').checked = true;
                if (document.getElementById('editar-senha-container')) 
                    document.getElementById('editar-senha-container').style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
    }
}

function mudarSecaoClube(secao) {
    document.querySelectorAll('.clube-secao').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('menu-item-ativo'));
    
    if (document.getElementById(`secao-${secao}`)) 
        document.getElementById(`secao-${secao}`).style.display = 'block';
    if (document.querySelector(`.menu-item[data-secao="${secao}"]`))
        document.querySelector(`.menu-item[data-secao="${secao}"]`).classList.add('menu-item-ativo');
}

function voltarParaTelaAnterior() { window.history.back(); }

function abrirModalSelecaoLeitura() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('modal-selecao-leitura').style.display = 'block';
    document.getElementById('busca-livro').focus();
    
    const hoje = new Date().toISOString().split('T')[0];
    
    const dataInicio = document.getElementById('data-inicio');
    const dataFim = document.getElementById('data-fim');
    
    if (dataInicio) {
        dataInicio.setAttribute('min', hoje);
        dataInicio.value = hoje;
    }
    
    if (dataFim) {
        dataFim.setAttribute('min', hoje);
    }
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
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('tab-ativo'));
    
    if (document.getElementById(`tab-${tab}`)) document.getElementById(`tab-${tab}`).style.display = 'block';
    if (document.querySelector(`.tab-item[data-tab="${tab}"]`)) 
        document.querySelector(`.tab-item[data-tab="${tab}"]`).classList.add('tab-ativo');
    
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
        if (!response.ok) throw new Error('Erro ao carregar leituras do clube');
        
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
                </div>`;
        } else {
            livroAtualContainer.innerHTML = '<p class="mensagem-vazia">Nenhum livro selecionado para leitura atual.</p>';
        }
        
        if (data.leiturasAnteriores?.length > 0) {
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
                leiturasAnterioresGrid.appendChild(leituraCard);
            });
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
        if (!response.ok) throw new Error('Erro ao buscar livros');
        
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
                </div>`;
            livroElement.addEventListener('click', () => selecionarLivro(index));
            resultadosContainer.appendChild(livroElement);
        });
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
    document.getElementById('selected-book-cover').style.backgroundImage = 
        `url('${livroSelecionado.imagemUrl || '/img/capa-padrao.jpg'}')`;
    document.getElementById('selected-book-title').textContent = livroSelecionado.titulo;
    document.getElementById('selected-book-author').textContent = `Autor: ${livroSelecionado.autor}`;
    document.getElementById('selected-book-pages').textContent = 
        livroSelecionado.paginas ? `Páginas: ${livroSelecionado.paginas}` : '';
    
    containerLivroSelecionado.style.display = 'flex';
    containerLivroSelecionado.scrollIntoView({behavior: 'smooth'});
}

async function salvarNovaLeitura() {
    try {
        const tabAtiva = document.querySelector('.tab-item.tab-ativo')?.dataset.tab || 'buscar';
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
            
            const hoje = new Date().toISOString().split('T')[0];
            if (dataInicio < hoje) {
                alert('A data de início não pode ser anterior a hoje.');
                return;
            }
            
            if (dataFim && dataFim < hoje) {
                alert('A data de término não pode ser anterior a hoje.');
                return;
            }
            
            if (dataFim && dataFim < dataInicio) {
                alert('A data de término deve ser posterior à data de início.');
                return;
            }
            
            dadosLeitura = {...livroSelecionado, dataInicio, dataFim: dataFim || null};
        } else {
        }
        
        const response = await fetch(`/api/clube/${clubeId}/leituras`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
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
function abrirModalAtualizacao() {
    document.getElementById('atualizacao-comentario').value = '';
    document.getElementById('atualizacao-pagina').value = '';
    document.getElementById('porcentagem-valor').textContent = '0%';
    document.getElementById('overlay-atualizacao').style.display = 'block';
    document.getElementById('modal-atualizacao').style.display = 'block';
    const paginaInput = document.getElementById('atualizacao-pagina');
    if (paginaInput) paginaInput.addEventListener('input', calcularPorcentagemLeitura);
}

function fecharModalAtualizacao() {
    document.getElementById('overlay-atualizacao').style.display = 'none';
    document.getElementById('modal-atualizacao').style.display = 'none';
}

function calcularPorcentagemLeitura() {
    const paginaAtual = parseInt(document.getElementById('atualizacao-pagina').value) || 0;
    const totalPaginas = 100;
    const porcentagem = Math.min(Math.round((paginaAtual / totalPaginas) * 100), 100);
    document.getElementById('porcentagem-valor').textContent = `${porcentagem}%`;
}

async function salvarAtualizacao() {
    const comentario = document.getElementById('atualizacao-comentario').value.trim();
    const paginaAtual = parseInt(document.getElementById('atualizacao-pagina').value);
    
    if (!comentario) {
        alert('Por favor, compartilhe seus pensamentos sobre o livro.');
        return;
    }
    
    if (!paginaAtual || paginaAtual <= 0) {
        alert('Por favor, informe a página atual de leitura.');
        return;
    }
    
    try {
        const response = await fetch(`/api/clube/${clubeId}/atualizacoes`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({idLeitura: 0, conteudo: comentario, paginaAtual})
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.erro || 'Erro ao salvar atualização');
        }
        
        fecharModalAtualizacao();
        carregarAtualizacoes(clubeId);
        atualizarProgressoLeitura(paginaAtual, 100);
        alert('Atualização publicada com sucesso!');
    } catch (error) {
        console.error('Erro:', error);
        alert(`Erro ao publicar atualização: ${error.message}`);
    }
}
async function carregarAtualizacoes(clubeId) {
    try {
        const atualizacoesLista = document.getElementById('atualizacoes-lista');
        atualizacoesLista.innerHTML = '<p class="carregando">Carregando atualizações...</p>';
        
        const response = await fetch(`/api/clube/${clubeId}/atualizacoes`);
        if (!response.ok) throw new Error('Erro ao carregar atualizações');
        
        const data = await response.json();
        
        if (!data.atualizacoes || data.atualizacoes.length === 0) {
            atualizacoesLista.innerHTML = '<div class="sem-atualizacoes">Nenhuma atualização de leitura disponível.</div>';
            return;
        }
        
        atualizacoesLista.innerHTML = '';
        
        data.atualizacoes.forEach(a => {
            const dataFormatada = new Date(a.data_postagem).toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            
            const atualizacaoItem = document.createElement('div');
            atualizacaoItem.className = 'atualizacao-item';
            atualizacaoItem.innerHTML = `
                <div class="atualizacao-header">
                    <div class="atualizacao-usuario-data">
                        <span class="atualizacao-usuario">${a.nome_usuario}</span>
                        <span class="atualizacao-data">${dataFormatada}</span>
                    </div>
                    ${a.id_usuario == userId ? `
                    <div class="atualizacao-acoes">
                        <button class="botao-excluir" onclick="excluirAtualizacao(${a.id})">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>` : `
                    <div class="atualizacao-acoes">
                        <button class="botao-denunciar" onclick="abrirMenuDenuncia(${a.id})">
                            <i class="fa fa-ellipsis-v"></i>
                        </button>
                    </div>`}
                </div>
                <div class="atualizacao-conteudo">${a.conteudo}</div>
                <div class="atualizacao-footer">
                    <div class="atualizacao-progresso">
                        <div class="progresso-barra-container">
                            <div class="progresso-barra" style="width: ${a.porcentagem_leitura}%"></div>
                        </div>
                        <span class="progresso-texto">${a.porcentagem_leitura}% concluído</span>
                    </div>
                    <div class="atualizacao-interacoes">
                        <button class="botao-curtir" data-id="${a.id}" onclick="alternarCurtida(${a.id})">
                            <i class="fa fa-heart-o"></i>
                        </button>
                        <span class="contador-curtidas" data-id="${a.id}"></span>
                    </div>
                </div>`;
            atualizacoesLista.appendChild(atualizacaoItem);
            
            carregarEstadoCurtidas(a.id);
        });
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('atualizacoes-lista').innerHTML = 
            '<p class="erro-carregamento">Erro ao carregar atualizações. Tente novamente mais tarde.</p>';
    }
}
async function excluirAtualizacao(idAtualizacao) {
    if (!confirm('Tem certeza que deseja excluir esta atualização?')) return;
    
    try {
        const response = await fetch(`/api/clube/${clubeId}/atualizacoes/${idAtualizacao}`, {method: 'DELETE'});
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.erro || 'Erro ao excluir atualização');
        }
        
        carregarAtualizacoes(clubeId);
        alert('Atualização excluída com sucesso!');
    } catch (error) {
        console.error('Erro:', error);
        alert(`Erro ao excluir atualização: ${error.message}`);
    }
}
