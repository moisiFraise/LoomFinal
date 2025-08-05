let configuracoesOriginais = {};
let todasCategorias = [];
let categoriasClube = [];

async function carregarConfiguracoes() {
    try {
        const response = await fetch(`/api/clube/${clubeId}/configuracoes`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.erro || 'Erro ao carregar configurações');
        }
        
        configuracoesOriginais = data.clube;
        todasCategorias = data.todasCategorias;
        categoriasClube = data.categoriasClube;
        
        preencherFormularios(data.clube);
        renderizarCategorias();
        carregarMembrosGerenciar();
        
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        mostrarNotificacao('Erro ao carregar configurações do clube', 'erro');
    }
}

function preencherFormularios(clube) {
    document.getElementById('config-nome').value = clube.nome || '';
    document.getElementById('config-descricao').value = clube.descricao || '';
    
    const modalidadeRadio = document.querySelector(`input[name="config-modelo"][value="${clube.modelo}"]`);
    if (modalidadeRadio) {
        modalidadeRadio.checked = true;
    }
    
    const visibilidadeRadio = document.querySelector(`input[name="config-visibilidade"][value="${clube.visibilidade}"]`);
    if (visibilidadeRadio) {
        visibilidadeRadio.checked = true;
    }
    
    toggleSenhaContainer(clube.visibilidade === 'privado');
    
    document.querySelectorAll('input[name="config-visibilidade"]').forEach(radio => {
        radio.addEventListener('change', function() {
            toggleSenhaContainer(this.value === 'privado');
        });
    });
}

function toggleSenhaContainer(mostrar) {
    const container = document.getElementById('config-senha-container');
    const senhaInput = document.getElementById('config-senha');
    
    if (mostrar) {
        container.style.display = 'block';
        senhaInput.required = true;
    } else {
        container.style.display = 'none';
        senhaInput.required = false;
        senhaInput.value = '';
    }
}

function renderizarCategorias() {
    // Categorias atuais
    const categoriasAtuaisContainer = document.getElementById('categorias-atuais');
    if (categoriasClube.length === 0) {
        categoriasAtuaisContainer.innerHTML = '<p class="sem-categorias">Nenhuma categoria selecionada</p>';
    } else {
        categoriasAtuaisContainer.innerHTML = categoriasClube
            .map(cat => `<span class="categoria-atual">${cat.nome}</span>`)
            .join('');
    }
    
    const todasCategoriasContainer = document.getElementById('todas-categorias');
    todasCategoriasContainer.innerHTML = todasCategorias
        .map(categoria => {
            const isChecked = categoriasClube.some(cat => cat.id === categoria.id);
            return `
                <div class="categoria-checkbox">
                    <input type="checkbox" id="cat-${categoria.id}" value="${categoria.id}" ${isChecked ? 'checked' : ''}>
                    <label for="cat-${categoria.id}">${categoria.nome}</label>
                </div>
            `;
        })
        .join('');
}
async function salvarConfiguracaoBasica() {
    const secao = document.querySelector('.config-secao');
    secao.classList.add('salvando');
    
    try {
        const dados = {
            nome: document.getElementById('config-nome').value.trim(),
            descricao: document.getElementById('config-descricao').value.trim(),
            visibilidade: configuracoesOriginais.visibilidade,
            senha: configuracoesOriginais.senha_acesso,
            modelo: configuracoesOriginais.modelo
        };
        
        if (!dados.nome) {
            throw new Error('Nome do clube é obrigatório');
        }
        
        const response = await fetch(`/api/clube/${clubeId}/configuracoes`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.erro || 'Erro ao salvar configurações');
        }
        
        configuracoesOriginais = result.clube;
        secao.classList.add('sucesso');
        mostrarNotificacao('Informações básicas atualizadas com sucesso!', 'sucesso');
        
        document.getElementById('clube-titulo').textContent = dados.nome;
        document.getElementById('clube-nome').textContent = dados.nome;
        
        setTimeout(() => {
            secao.classList.remove('sucesso');
        }, 3000);
        
    } catch (error) {
        console.error('Erro ao salvar configurações básicas:', error);
        secao.classList.add('erro');
        mostrarNotificacao(error.message, 'erro');
        
        setTimeout(() => {
            secao.classList.remove('erro');
        }, 3000);
    } finally {
        secao.classList.remove('salvando');
    }
}
async function salvarConfiguracaoModalidade() {
    const secao = document.querySelector('.config-secao:nth-child(2)');
    secao.classList.add('salvando');
    
    try {
        const modeloSelecionado = document.querySelector('input[name="config-modelo"]:checked');
        
        if (!modeloSelecionado) {
            throw new Error('Selecione uma modalidade');
        }
        
        const dados = {
            nome: configuracoesOriginais.nome,
            descricao: configuracoesOriginais.descricao,
            visibilidade: configuracoesOriginais.visibilidade,
            senha: configuracoesOriginais.senha_acesso,
            modelo: modeloSelecionado.value
        };
        
        const response = await fetch(`/api/clube/${clubeId}/configuracoes`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.erro || 'Erro ao salvar modalidade');
        }
        
        configuracoesOriginais = result.clube;
        secao.classList.add('sucesso');
        mostrarNotificacao('Modalidade atualizada com sucesso!', 'sucesso');
        
        setTimeout(() => {
            secao.classList.remove('sucesso');
        }, 3000);
        
    } catch (error) {
        console.error('Erro ao salvar modalidade:', error);
        secao.classList.add('erro');
        mostrarNotificacao(error.message, 'erro');
        
        setTimeout(() => {
            secao.classList.remove('erro');
        }, 3000);
    } finally {
        secao.classList.remove('salvando');
    }
}
async function salvarConfiguracaoVisibilidade() {
    const secao = document.querySelector('.config-secao:nth-child(3)');
    secao.classList.add('salvando');
    
    try {
        const visibilidadeSelecionada = document.querySelector('input[name="config-visibilidade"]:checked');
        
        if (!visibilidadeSelecionada) {
            throw new Error('Selecione uma opção de visibilidade');
        }
        
        const senha = document.getElementById('config-senha').value.trim();
        
        if (visibilidadeSelecionada.value === 'privado' && !senha) {
            throw new Error('Senha é obrigatória para clubes privados');
        }
        
        const dados = {
            nome: configuracoesOriginais.nome,
            descricao: configuracoesOriginais.descricao,
            visibilidade: visibilidadeSelecionada.value,
            senha: visibilidadeSelecionada.value === 'privado' ? senha : null,
            modelo: configuracoesOriginais.modelo
        };
        
        const response = await fetch(`/api/clube/${clubeId}/configuracoes`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.erro || 'Erro ao salvar visibilidade');
        }
        
        configuracoesOriginais = result.clube;
        secao.classList.add('sucesso');
        mostrarNotificacao('Visibilidade atualizada com sucesso!', 'sucesso');
        
        document.getElementById('config-senha').value = '';
        
        setTimeout(() => {
            secao.classList.remove('sucesso');
        }, 3000);
        
    } catch (error) {
        console.error('Erro ao salvar visibilidade:', error);
        secao.classList.add('erro');
        mostrarNotificacao(error.message, 'erro');
        
        setTimeout(() => {
            secao.classList.remove('erro');
        }, 3000);
    } finally {
        secao.classList.remove('salvando');
    }
}

async function salvarConfiguracaoCategorias() {
    const secao = document.querySelector('.config-secao:nth-child(4)');
    secao.classList.add('salvando');
    
    try {
        const checkboxes = document.querySelectorAll('#todas-categorias input[type="checkbox"]:checked');
        const categoriasSelecionadas = Array.from(checkboxes).map(cb => parseInt(cb.value));
        
        const response = await fetch(`/api/clube/${clubeId}/categorias`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ categorias: categoriasSelecionadas })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.erro || 'Erro ao salvar categorias');
        }
        
        categoriasClube = result.categorias;
        renderizarCategorias();
        secao.classList.add('sucesso');
        mostrarNotificacao('Categorias atualizadas com sucesso!', 'sucesso');
        
        setTimeout(() => {
            secao.classList.remove('sucesso');
        }, 3000);
        
    } catch (error) {
        console.error('Erro ao salvar categorias:', error);
        secao.classList.add('erro');
        mostrarNotificacao(error.message, 'erro');
        
        setTimeout(() => {
            secao.classList.remove('erro');
        }, 3000);
    } finally {
        secao.classList.remove('salvando');
    }
}

async function carregarMembrosGerenciar() {
    try {
        const response = await fetch(`/api/clube/${clubeId}/membros`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.erro || 'Erro ao carregar membros');
        }
        
        renderizarMembrosGerenciar(data.membros, data.idCriador);
        
    } catch (error) {
        console.error('Erro ao carregar membros:', error);
        document.getElementById('membros-gerenciar').innerHTML = 
            '<p class="erro">Erro ao carregar membros do clube</p>';
    }
}

function renderizarMembrosGerenciar(membros, idCriador) {
    const container = document.getElementById('membros-gerenciar');
    
    if (membros.length === 0) {
        container.innerHTML = '<p class="sem-membros">Nenhum membro no clube</p>';
        return;
    }
    
    container.innerHTML = membros.map(membro => {
        const isCriador = membro.id === idCriador;
        const iniciais = membro.nome.split(' ').map(n => n[0]).join('').toUpperCase();
        
        return `
            <div class="membro-item">
                <div class="membro-info">
                    <div class="membro-avatar">${iniciais}</div>
                    <div class="membro-detalhes">
                        <h5>${membro.nome}</h5>
                        <p>${membro.email}</p>
                    </div>
                    ${isCriador ? '<span class="membro-badge">Criador</span>' : ''}
                </div>
                ${!isCriador ? `
                    <button class="botao-remover-membro" onclick="removerMembro(${membro.id}, '${membro.nome}')">
                        <i class="fa fa-times"></i> Remover
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');
}
async function removerMembro(membroId, nomeMembro) {
    if (!confirm(`Tem certeza que deseja remover ${nomeMembro} do clube?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/clube/${clubeId}/membros/${membroId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.erro || 'Erro ao remover membro');
        }
        
        mostrarNotificacao(`${nomeMembro} foi removido do clube`, 'sucesso');
        carregarMembrosGerenciar(); // Recarregar lista
        
    } catch (error) {
        console.error('Erro ao remover membro:', error);
        mostrarNotificacao(error.message, 'erro');
    }
}

function confirmarExclusaoClube() {
    document.getElementById('overlay-exclusao').style.display = 'block';
    document.getElementById('modal-confirmacao-exclusao').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    const inputNome = document.getElementById('confirmacao-nome');
    const botaoConfirmar = document.getElementById('botao-confirmar-exclusao');
    
    inputNome.addEventListener('input', function() {
        const nomeDigitado = this.value.trim();
        const nomeClube = configuracoesOriginais.nome;
        
        if (nomeDigitado === nomeClube) {
            botaoConfirmar.disabled = false;
        } else {
            botaoConfirmar.disabled = true;
        }
    });
    
    // Limpar campo
    inputNome.value = '';
    botaoConfirmar.disabled = true;
}

function fecharModalExclusao() {
    document.getElementById('overlay-exclusao').style.display = 'none';
    document.getElementById('modal-confirmacao-exclusao').style.display = 'none';
    document.body.style.overflow = '';
    
    document.getElementById('confirmacao-nome').value = '';
}

async function excluirClube() {
    const botaoConfirmar = document.getElementById('botao-confirmar-exclusao');
    botaoConfirmar.disabled = true;
    botaoConfirmar.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Excluindo...';
    
    try {
        const response = await fetch(`/api/clube/${clubeId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.erro || 'Erro ao excluir clube');
        }
        
        mostrarNotificacao('Clube excluído com sucesso', 'sucesso');
        
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 2000);
        
    } catch (error) {
        console.error('Erro ao excluir clube:', error);
        mostrarNotificacao(error.message, 'erro');
        
        botaoConfirmar.disabled = false;
        botaoConfirmar.innerHTML = '<i class="fa fa-trash"></i> Sim, Excluir Permanentemente';
    }
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modalExclusao = document.getElementById('modal-confirmacao-exclusao');
        if (modalExclusao.style.display === 'block') {
            fecharModalExclusao();
        }
    }
});

document.getElementById('overlay-exclusao').addEventListener('click', fecharModalExclusao);

function mostrarNotificacao(mensagem, tipo) {
    if (typeof mostrarNotificacao === 'undefined') {
        if (tipo === 'erro') {
            alert('Erro: ' + mensagem);
        } else {
            alert(mensagem);
        }
    }
}

function inicializarConfiguracoes() {
    carregarConfiguracoes();
}
window.carregarConfiguracoes = carregarConfiguracoes;
window.salvarConfiguracaoBasica = salvarConfiguracaoBasica;
window.salvarConfiguracaoModalidade = salvarConfiguracaoModalidade;
window.salvarConfiguracaoVisibilidade = salvarConfiguracaoVisibilidade;
window.salvarConfiguracaoCategorias = salvarConfiguracaoCategorias;
window.removerMembro = removerMembro;
window.confirmarExclusaoClube = confirmarExclusaoClube;
window.fecharModalExclusao = fecharModalExclusao;
window.excluirClube = excluirClube;
window.inicializarConfiguracoes = inicializarConfiguracoes;
