document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('explorar').style.display = 'block';
    
    buscarTodosClubes();
    
    configurarDialogoSenha();
});
window.addEventListener('pageshow', function(event) {
    const botoesAcesso = document.querySelectorAll('.botao-padrao');
    botoesAcesso.forEach(botao => {
        if (botao.innerHTML.includes('Acessando')) {
            botao.innerHTML = 'Acessar';
            botao.disabled = false;
        }
    });
});
async function buscarTodosClubes() {
    try {
        const response = await fetch('/api/explorar/clubes');
        if (!response.ok) {
            throw new Error('Erro ao buscar clubes');
        }
        
        const data = await response.json();
        renderizarClubes(data.clubes, data.participacoes);
    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível carregar os clubes. Tente novamente mais tarde.');
    }
}

function renderizarClubes(clubes, participacoes) {
    const listaElement = document.getElementById('lista-clubes');
    listaElement.innerHTML = '';
    
    if (clubes.length === 0) {
        listaElement.innerHTML = '<p class="sem-clubes">Nenhum clube encontrado.</p>';
        return;
    }
    
    clubes.forEach(clube => {
        const isParticipante = participacoes.includes(clube.id);
        const card = criarCardClube(clube, isParticipante);
        listaElement.appendChild(card);
    });
}
function criarCardClube(clube, isParticipante) {
    const card = document.createElement('div');
    card.className = 'clube-card';
    card.dataset.id = clube.id;
    
    // Verificar se há leitura atual e formatá-la corretamente
    const leituraAtual = clube.leitura_atual 
        ? clube.leitura_atual 
        : 'Nenhuma leitura definida';
    
    const modelo = clube.modelo || 'online';
    
    card.innerHTML = `
        <div class="clube-header">
            <h3 class="clube-titulo">${clube.nome}</h3>
            <span class="clube-visibilidade ${clube.visibilidade}">${clube.visibilidade}</span>
        </div>
        <p class="clube-descricao">${clube.descricao || 'Sem descrição'}</p>
        <div class="clube-info">
            <span class="clube-modelo ${modelo}">${modelo}</span>
            <span class="clube-membros"><i class="fas fa-users"></i> ${clube.total_membros} membros</span>
        </div>
        <p class="clube-leitura">Leitura atual: ${leituraAtual}</p>
        <div class="clube-acoes">
            ${isParticipante 
                ? `<button class="botao-padrao" onclick="acessarClube(${clube.id})">Acessar</button>` 
                : clube.visibilidade === 'privado'
                    ? `<button class="btn-senha" onclick="solicitarSenha(${clube.id})">Entrar (Requer Senha)</button>`
                    : `<button class="btn-entrar" onclick="entrarNoClube(${clube.id})">Entrar no Clube</button>`
            }
        </div>
    `;
    
    return card;
}
function verClube(clubeId) {
    window.location.href = `/clube/${clubeId}`;
}

async function entrarNoClube(clubeId) {
    try {
        const response = await fetch('/api/explorar/entrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clubeId })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.erro || 'Erro ao entrar no clube');
        }
        
        const result = await response.json();
        alert(result.mensagem);
        
        // Recarregar a lista de clubes
        buscarTodosClubes();
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message || 'Não foi possível entrar no clube. Tente novamente.');
    }
}

// Funções para lidar com clubes privados
function solicitarSenha(clubeId) {
    const dialog = document.getElementById('senha-dialog');
    const form = document.getElementById('senha-form');
    
    form.dataset.clubeId = clubeId;
    dialog.style.display = 'flex';
    document.getElementById('senha-input').focus();
}

function configurarDialogoSenha() {
    // Criar o diálogo de senha se não existir
    if (!document.getElementById('senha-dialog')) {
        const dialog = document.createElement('div');
        dialog.id = 'senha-dialog';
        dialog.className = 'senha-dialog';
        
        dialog.innerHTML = `
            <div class="senha-content">
                <h3>Digite a senha do clube</h3>
                <form id="senha-form">
                    <input type="password" id="senha-input" placeholder="Senha do clube" required>
                    <div class="senha-buttons">
                        <button type="button" class="senha-cancelar" onclick="fecharDialogoSenha()">Cancelar</button>
                        <button type="submit" class="senha-confirmar">Confirmar</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        document.getElementById('senha-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const clubeId = this.dataset.clubeId;
            const senha = document.getElementById('senha-input').value;
            
            await entrarNoClubeSenha(clubeId, senha);
        });
    }
}

function fecharDialogoSenha() {
    const dialog = document.getElementById('senha-dialog');
    dialog.style.display = 'none';
    document.getElementById('senha-input').value = '';
}

async function entrarNoClubeSenha(clubeId, senha) {
    try {
        const response = await fetch('/api/explorar/entrar-privado', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clubeId, senha })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.erro || 'Erro ao entrar no clube');
        }
        
        alert(result.mensagem);
        fecharDialogoSenha();
        
        buscarTodosClubes();
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message || 'Não foi possível entrar no clube. Verifique a senha e tente novamente.');
    }
}
function acessarClube(clubeId) {
    const botao = event.target;
    const textoOriginal = botao.innerHTML;
    botao.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Acessando...';
    botao.disabled = true;
    
    setTimeout(() => {
        window.location.href = `/clube/${clubeId}`;
    }, 500);
}