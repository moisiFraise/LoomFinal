document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('overlay-atualizacao').style.display = 'none';
    document.getElementById('modal-atualizacao').style.display = 'none';
    
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
    if (!leituraAtual || !document.getElementById('leitura-atual-imagem-container')) return;
    const imagemUrl = leituraAtual.imagemUrl || '/img/capa-padrao.jpg';
    const progressoGeral = await calcularProgressoGeral(leituraAtual);
    document.getElementById('leitura-atual-imagem-container').innerHTML = `
        <div class="leitura-atual-imagem">
            <img src="${imagemUrl}" alt="${leituraAtual.titulo}">
            <div class="progresso-geral">
                <div class="progresso-barra-container">
                    <div class="progresso-barra-geral" style="width: ${progressoGeral}%"></div>
                </div>
                <span class="progresso-texto-geral">${progressoGeral}% concluído</span>
            </div>
        </div>`;
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
        const botoesAcao = isAutor ? `
            <div class="atualizacao-acoes">
                <button class="botao-editar" onclick="editarAtualizacao(${a.id})"><i class="fa fa-edit"></i></button>
                <button class="botao-excluir" onclick="excluirAtualizacao(${a.id})"><i class="fa fa-trash"></i></button>
            </div>` : `
            <div class="atualizacao-acoes">
                <button class="botao-denunciar" onclick="abrirMenuDenuncia(${a.id})">
                    <i class="fa fa-ellipsis-v"></i>
                </button>
            </div>`;
        
        return `
            <div class="atualizacao-item" data-id="${a.id}">
                <div class="atualizacao-header">
                    <div class="atualizacao-usuario-info">
                        <span class="atualizacao-usuario">${a.nome_usuario}</span>
                        <span class="atualizacao-data">${dataFormatada}</span>
                    </div>
                    ${botoesAcao}
                </div>
                <div class="atualizacao-conteudo">${a.conteudo}</div>
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
                        <span class="contador-curtidas"data-id="${a.id}" onclick="alternarCurtida(${a.id})">
                            <i class="fa fa-heart-o"></i>
                        </button>
                        <span class="contador-curtidas" data-id="${a.id}"></span>
                    </div>
                </div>
            </div>`;
    }).join('');
    
    atualizacoes.forEach(a => {
        carregarEstadoCurtidas(a.id);
    });
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
    
    const modalTitulo = document.getElementById('modal-titulo');
    if (modalTitulo) modalTitulo.textContent = 'Nova Atualização de Leitura';
    
    const confirmarBtn = document.getElementById('confirmarAtualizacao');
    if (confirmarBtn) confirmarBtn.textContent = 'Publicar';
    
    document.getElementById('overlay-atualizacao').style.display = 'block';
    document.getElementById('modal-atualizacao').style.display = 'block';
    
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
            
            document.getElementById('overlay-atualizacao').style.display = 'block';
            document.getElementById('modal-atualizacao').style.display = 'block';
            
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
    document.getElementById('overlay-atualizacao').style.display = 'none';
    document.getElementById('modal-atualizacao').style.display = 'none';
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
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conteudo: comentario, paginaAtual })
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

