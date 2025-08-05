document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('explorar').style.display = 'block';
    
    carregarClubes();
    
    document.getElementById('btn-pesquisar').addEventListener('click', pesquisarClubes);
    document.getElementById('pesquisa-clubes').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            pesquisarClubes();
        }
    });
    
    document.getElementById('filtro-visibilidade').addEventListener('change', pesquisarClubes);
    document.getElementById('filtro-modelo').addEventListener('change', pesquisarClubes);
});

let todosClubes = [];
let participacoes = [];

async function carregarClubes() {
    try {
        const response = await fetch('/api/explorar/clubes');
        if (!response.ok) {
            throw new Error('Erro ao carregar clubes');
        }
        
        const data = await response.json();
        todosClubes = data.clubes;
        participacoes = data.participacoes;
        
        renderizarClubes(todosClubes);
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Não foi possível carregar os clubes. Tente novamente mais tarde.');
    }
}

function pesquisarClubes() {
    const termoPesquisa = document.getElementById('pesquisa-clubes').value.toLowerCase().trim();
    const filtroVisibilidade = document.getElementById('filtro-visibilidade').value;
    const filtroModelo = document.getElementById('filtro-modelo').value;
    
    let resultados = todosClubes;
    
    if (termoPesquisa) {
        resultados = resultados.filter(clube => 
            clube.nome.toLowerCase().includes(termoPesquisa) || 
            clube.descricao.toLowerCase().includes(termoPesquisa) ||
            (clube.leitura_atual && clube.leitura_atual.toLowerCase().includes(termoPesquisa))
        );
    }
    
    if (filtroVisibilidade !== 'todos') {
        resultados = resultados.filter(clube => clube.visibilidade === filtroVisibilidade);
    }
    
    if (filtroModelo !== 'todos') {
        resultados = resultados.filter(clube => clube.modelo === filtroModelo);
    }
    
    renderizarClubes(resultados);
}
function renderizarClubes(clubes) {
    const listaElement = document.getElementById('lista-clubes');
    const semResultadosElement = document.getElementById('sem-resultados');
    
    listaElement.innerHTML = '';
    
    if (clubes.length === 0) {
        semResultadosElement.style.display = 'block';
        return;
    }
    
    semResultadosElement.style.display = 'none';
    
    clubes.forEach(clube => {
        const jaParticipa = participacoes.includes(clube.id);
        
        const clubeElement = document.createElement('div');
        clubeElement.className = 'clube-card';
        
        let modeloClass = '';
        switch (clube.modelo) {
            case 'online': modeloClass = 'online'; break;
            case 'presencial': modeloClass = 'presencial'; break;
            case 'hibrido': modeloClass = 'hibrido'; break;
            default: modeloClass = 'online';
        }
        
        const iconeVisibilidade = clube.visibilidade === 'privado' 
            ? '<i class="fas fa-lock" title="Clube Privado"></i>' 
            : '<i class="fas fa-globe" title="Clube Público"></i>';
        
        clubeElement.innerHTML = `
            <h3 class="clube-nome">${clube.nome} ${iconeVisibilidade}</h3>
            <p class="clube-descricao">${clube.descricao || 'Sem descrição'}</p>
            <div class="clube-tags">
                ${clube.categorias ? clube.categorias.map(cat => `<span class="tag">${cat}</span>`).join('') : ''}
            </div>
            <div class="clube-info">
                <span class="clube-modelo ${modeloClass}">${clube.modelo.charAt(0).toUpperCase() + clube.modelo.slice(1)}</span>
                <span class="clube-membros"><i class="fas fa-users"></i> ${clube.total_membros} membros</span>
            </div>
            ${clube.leitura_atual ? `<div class="clube-leitura">Lendo: ${clube.leitura_atual}</div>` : '<div class="clube-leitura sem-leitura">Sem leitura atual</div>'}
            <div class="clube-acoes">
                ${jaParticipa 
                    ? `<button class="botao-padrao" onclick="verClube(${clube.id})">Ver Clube</button>` 
                    : clube.visibilidade === 'privado' 
                        ? `<button class="botao-editar" onclick="abrirDialogSenha(${clube.id})">Entrar com Senha</button>` 
                        : `<button class="botao-padrao" onclick="entrarClube(${clube.id})">Entrar</button>`
                }
            </div>
        `;
        
        listaElement.appendChild(clubeElement);
    });
}

function abrirDialogSenha(clubeId) {
    let senhaDialog = document.getElementById('senha-dialog');
    if (!senhaDialog) {
        senhaDialog = document.createElement('div');
        senhaDialog.id = 'senha-dialog';
        senhaDialog.className = 'senha-dialog';
        
        senhaDialog.innerHTML = `
            <div class="senha-content">
                <h3>Digite a senha do clube</h3>
                <input type="password" id="senha-clube" placeholder="Senha do clube">
                <div class="senha-buttons">
                    <button class="senha-cancelar" onclick="fecharDialogSenha()">Cancelar</button>
                    <button class="senha-confirmar" id="btn-confirmar-senha">Confirmar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(senhaDialog);
    }
    
    document.getElementById('btn-confirmar-senha').onclick = function() {
        confirmarSenha(clubeId);
    };
    
    senhaDialog.style.display = 'flex';
    
    document.getElementById('senha-clube').focus();
    
    document.getElementById('senha-clube').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmarSenha(clubeId);
        }
    });
}

function fecharDialogSenha() {
    const senhaDialog = document.getElementById('senha-dialog');
    if (senhaDialog) {
        senhaDialog.style.display = 'none';
        document.getElementById('senha-clube').value = '';
    }
}

async function confirmarSenha(clubeId) {
    const senha = document.getElementById('senha-clube').value;
    
    if (!senha) {
        alert('Por favor, digite a senha do clube.');
        return;
    }
    
    try {
        const response = await fetch('/api/explorar/entrar-privado', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clubeId, senha })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.erro || 'Erro ao entrar no clube');
        }
        
        fecharDialogSenha();
        alert(data.mensagem);
        
        participacoes.push(clubeId);
        renderizarClubes(todosClubes);
        
    } catch (error) {
        alert(error.message);
    }
}

async function entrarClube(clubeId) {
    try {
        const response = await fetch('/api/explorar/entrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clubeId })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.erro || 'Erro ao entrar no clube');
        }
        
        alert(data.mensagem);
        
        participacoes.push(clubeId);
        
        renderizarClubes(todosClubes);
        
    } catch (error) {
        alert(error.message);
    }
}

function verClube(clubeId) {
    window.location.href = `/clube/${clubeId}`;
}

function mostrarErro(mensagem) {
    const listaElement = document.getElementById('lista-clubes');
    listaElement.innerHTML = `<div class="erro-mensagem">${mensagem}</div>`;
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
