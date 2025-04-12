
function formClubeDoLivro() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('modal-criar-clube').style.display = 'block';
    
    const categoriasContainer = document.getElementById('categorias-clube');
    categoriasContainer.innerHTML = '';
    
    const categorias = [
        'Ficção', 'Não-Ficção', 'Romance', 'Fantasia', 
        'Sci-Fi', 'Terror', 'Biografia', 'História', 
        'Autoajuda', 'Negócios'
    ];
    
    categorias.forEach(categoria => {
        const div = document.createElement('div');
        div.className = 'categoria-item';
        div.innerHTML = `
            <input type="checkbox" id="cat-${categoria}" name="categorias" value="${categoria}">
            <label for="cat-${categoria}">${categoria}</label>
        `;
        categoriasContainer.appendChild(div);
    });
    
    document.getElementById('publico').checked = true;
    toggleSenhaClube();
}

function toggleSenhaClube() {
    const visibilidade = document.querySelector('input[name="visibilidade"]:checked').value;
    const senhaContainer = document.getElementById('senha-clube-container');
    
    if (visibilidade === 'privado') {
        senhaContainer.style.display = 'block';
        document.getElementById('senha-clube').setAttribute('required', 'required');
    } else {
        senhaContainer.style.display = 'none';
        document.getElementById('senha-clube').removeAttribute('required');
    }
}

function cancelarCriacaoClube() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('modal-criar-clube').style.display = 'none';
    document.getElementById('form-criar-clube').reset();
}

async function criarClube() {
    const nome = document.getElementById('nome-clube').value;
    const descricao = document.getElementById('descricao-clube').value;
    const visibilidade = document.querySelector('input[name="visibilidade"]:checked').value;
    
    let senha = null;
    if (visibilidade === 'privado') {
        senha = document.getElementById('senha-clube').value;
        if (!senha) {
            alert('Clubes privados precisam de uma senha de acesso.');
            return;
        }
    }
    
    const categoriasSelecionadas = [];
    document.querySelectorAll('input[name="categorias"]:checked').forEach(checkbox => {
        categoriasSelecionadas.push(checkbox.value);
    });
    
    if (!nome || !descricao) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    try {
        const response = await fetch('/api/clubes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome,
                descricao,
                idCriador: userId,
                visibilidade,
                senha,
                categorias: categoriasSelecionadas
            })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.erro || 'Erro ao criar clube');
        }
        
        const data = await response.json();
                cancelarCriacaoClube();
                carregarMeusClubes();
                alert('Clube criado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao criar clube:', error);
        alert(error.message || 'Erro ao criar clube. Tente novamente.');
    }
}
async function carregarMeusClubes() {
    try {
        if (!userId) {
            console.error('ID de usuário não definido');
            const clubesGrid = document.getElementById('meus-clubes');
            clubesGrid.innerHTML = '<p class="mensagem-erro">Não foi possível carregar seus clubes. ID de usuário não definido.</p>';
            return;
        }
        
        const response = await fetch(`/api/clubes/${userId}`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar clubes');
        }
        
        const data = await response.json();
        renderizarMeusClubes(data.clubesCriados, data.clubesParticipando);
        
    } catch (error) {
        console.error('Erro ao carregar clubes:', error);
        const clubesGrid = document.getElementById('meus-clubes');
        clubesGrid.innerHTML = '<p class="mensagem-erro">Não foi possível carregar seus clubes.</p>';
    }
}

function renderizarMeusClubes(clubesCriados, clubesParticipando) {
    const clubesGrid = document.getElementById('meus-clubes');
    clubesGrid.innerHTML = '';
    
    const todosClubes = [...clubesCriados, ...clubesParticipando];
    
    if (todosClubes.length === 0) {
        clubesGrid.innerHTML = '<p class="mensagem-vazio">Você ainda não participa de nenhum clube. Crie seu primeiro clube!</p>';
        return;
    }
    
    todosClubes.forEach(clube => {
        const ehCriador = clubesCriados.some(c => c.id === clube.id);
        
        const clubeCard = document.createElement('div');
        clubeCard.className = 'clube-card';
        
        const iconeVisibilidade = clube.visibilidade === 'privado' 
            ? '<i class="fas fa-lock" title="Clube Privado"></i>' 
            : '<i class="fas fa-globe" title="Clube Público"></i>';
        
        clubeCard.innerHTML = `
            <h3 class="clube-nome">${clube.nome} ${iconeVisibilidade}</h3>
            <p class="clube-descricao">${clube.descricao || 'Sem descrição'}</p>
            <div class="clube-tags">
                ${clube.categorias ? clube.categorias.map(cat => `<span class="tag">${cat}</span>`).join('') : ''}
            </div>
            ${ehCriador ? '<span class="criador-badge">Criador</span>' : ''}
            <div class="clube-acoes">
                <button class="botao-acessar" onclick="acessarClube(${clube.id})">Acessar</button>
                ${ehCriador ? `<button class="botao-editar" onclick="editarClube(${clube.id})">Editar</button>` : ''}
            </div>
        `;
        
        clubesGrid.appendChild(clubeCard);
    });
}
function editarClube(clubeId) {
    const botao = event.target.closest('.botao-editar');
    const textoOriginal = botao.innerHTML;
    botao.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
    botao.disabled = true;
    
    setTimeout(() => {
        alert(`Funcionalidade de edição do clube ${clubeId} a ser implementada`);
        botao.innerHTML = textoOriginal;
        botao.disabled = false;
    }, 500);
}
function acessarClube(clubeId) {
    const botao = event.target.closest('.botao-acessar');
    const textoOriginal = botao.innerHTML;
    botao.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Acessando...';
    botao.disabled = true;
    
    setTimeout(() => { //delay para impressionar
        window.location.href = `/clube/${clubeId}`;
    }, 500);
}


