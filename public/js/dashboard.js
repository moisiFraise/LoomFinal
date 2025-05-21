window.addEventListener('pageshow', function(event) {
    const botoesAcesso = document.querySelectorAll('.botao-padrao');
    botoesAcesso.forEach(botao => {
        if (botao.innerHTML.includes('Acessando')) {
            botao.innerHTML = 'Acessar';
            botao.disabled = false;
        }
    });
});
async function formClubeDoLivro() {
    document.getElementById('overlay').style.display = 'block';
    const modalElement = document.getElementById('modal-criar-clube');
    modalElement.style.display = 'block';
    
    modalElement.scrollTop = 0;
    
    const categoriasContainer = document.getElementById('categorias-clube');
    categoriasContainer.innerHTML = '<p class="carregando"><i class="fas fa-spinner fa-spin"></i> Carregando categorias...</p>';
    
    try {
        const response = await fetch('/api/categorias');
        if (!response.ok) {
            throw new Error('Erro ao carregar categorias');
        }
        
        const categorias = await response.json();
        categoriasContainer.innerHTML = '';
        
        if (categorias.length === 0) {
            categoriasContainer.innerHTML = '<p>Nenhuma categoria disponível</p>';
        } else {
            categorias.forEach(categoria => {
                const div = document.createElement('div');
                div.className = 'categoria-item';
                div.dataset.id = categoria.id;
                div.dataset.nome = categoria.nome.toLowerCase();
                
                div.innerHTML = `
                    <input type="checkbox" id="cat-${categoria.id}" name="categorias" value="${categoria.id}">
                    <label for="cat-${categoria.id}">${categoria.nome}</label>
                `;
                
                div.addEventListener('click', function(e) {
                    if (e.target.tagName !== 'INPUT') {
                        const checkbox = this.querySelector('input[type="checkbox"]');
                        checkbox.checked = !checkbox.checked;
                    }
                    
                    if (this.querySelector('input[type="checkbox"]').checked) {
                        this.classList.add('selected');
                    } else {
                        this.classList.remove('selected');
                    }
                    
                    atualizarContadorCategorias();
                });
                
                categoriasContainer.appendChild(div);
            });
            
            document.getElementById('busca-categoria').addEventListener('input', filtrarCategorias);
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        categoriasContainer.innerHTML = '<p class="erro">Erro ao carregar categorias. Tente novamente.</p>';
    }
    
    document.getElementById('publico').checked = true;
    toggleSenhaClube();
    atualizarContadorCategorias();
}

function atualizarContadorCategorias() {
    const categoriasChecked = document.querySelectorAll('input[name="categorias"]:checked').length;
    document.getElementById('contador-categorias').textContent = `${categoriasChecked} selecionada${categoriasChecked !== 1 ? 's' : ''}`;
}
function filtrarCategorias() {
    const termoBusca = document.getElementById('busca-categoria').value.toLowerCase();
    const categorias = document.querySelectorAll('.categoria-item');
    
    categorias.forEach(categoria => {
        const nomeCategoria = categoria.dataset.nome;
        if (nomeCategoria.includes(termoBusca)) {
            categoria.style.display = 'flex';
        } else {
            categoria.style.display = 'none';
        }
    });
}
function toggleSenhaClube() {
    const visibilidade = document.querySelector('input[name="visibilidade"]:checked').value;
    const senhaContainer = document.getElementById('senha-clube-container');
    
    if (visibilidade === 'privado') {
        senhaContainer.style.display = 'block';
        document.getElementById('senha-clube').setAttribute('required', 'required');
        setTimeout(() => {
            senhaContainer.style.opacity = '1';
            senhaContainer.style.transform = 'translateY(0)';
        }, 10);
    } else {
        senhaContainer.style.opacity = '0';
        senhaContainer.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            senhaContainer.style.display = 'none';
            document.getElementById('senha-clube').removeAttribute('required');
        }, 300);
    }
}
function toggleSenhaVisibilidade() {
    const senhaInput = document.getElementById('senha-clube');
    const toggleBtn = document.getElementById('toggle-senha');
    
    if (senhaInput.type === 'password') {
        senhaInput.type = 'text';
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        senhaInput.type = 'password';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    carregarMeusClubes();
        const toggleSenhaBtn = document.getElementById('toggle-senha');
    if (toggleSenhaBtn) {
        toggleSenhaBtn.addEventListener('click', toggleSenhaVisibilidade);
    }
        const senhaContainer = document.getElementById('senha-clube-container');
    if (senhaContainer) {
        senhaContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        senhaContainer.style.opacity = '0';
        senhaContainer.style.transform = 'translateY(-10px)';
    }
});
function cancelarCriacaoClube() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('modal-criar-clube').style.display = 'none';
    
    document.getElementById('form-criar-clube').reset();
    
    document.querySelectorAll('.categoria-item').forEach(item => {
        item.classList.remove('selected');
    });
    atualizarContadorCategorias();
    document.getElementById('publico').checked = true;
    toggleSenhaClube();
    
    const buscaCategoria = document.getElementById('busca-categoria');
    if (buscaCategoria) {
        buscaCategoria.value = '';
        filtrarCategorias();
    }
}
document.addEventListener('DOMContentLoaded', function() {
    carregarMeusClubes();
    
    const toggleSenhaBtn = document.getElementById('toggle-senha');
    if (toggleSenhaBtn) {
        toggleSenhaBtn.addEventListener('click', toggleSenhaVisibilidade);
    }
    
    const senhaContainer = document.getElementById('senha-clube-container');
    if (senhaContainer) {
        senhaContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        senhaContainer.style.opacity = '0';
        senhaContainer.style.transform = 'translateY(-10px)';
    }
    
    const overlay = document.getElementById('overlay');
    const modal = document.getElementById('modal-criar-clube');
    
    if (overlay && modal) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                cancelarCriacaoClube();
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                cancelarCriacaoClube();
            }
        });
    }
});
async function criarClube() {
    const nome = document.getElementById('nome-clube').value;
    const descricao = document.getElementById('descricao-clube').value;
    const visibilidade = document.querySelector('input[name="visibilidade"]:checked').value;
    const modalidade = document.querySelector('input[name="modalidade"]:checked').value;
    
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
        categoriasSelecionadas.push(parseInt(checkbox.value));
    });
    
    if (!nome || !descricao) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    if (categoriasSelecionadas.length === 0) {
        alert('Por favor, selecione pelo menos uma categoria para o clube.');
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
                modelo: modalidade,
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
        
        document.getElementById('meus-clubes').innerHTML = '<p class="carregando">Carregando seus clubes...</p>';
        
        const response = await fetch(`/api/clubes/${userId}`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar clubes');
        }
        
        const data = await response.json();
        
        console.log('Dados recebidos:', data);
        
        renderizarMeusClubes(data.clubesCriados || [], data.clubesParticipando || []);
        
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
            
        let iconeModalidade = '';
        if (clube.modelo === 'online') {
            iconeModalidade = '<span class="modalidade-badge online"><i class="fas fa-laptop"></i> Online</span>';
        } else if (clube.modelo === 'presencial') {
            iconeModalidade = '<span class="modalidade-badge presencial"><i class="fas fa-users"></i> Presencial</span>';
        } else if (clube.modelo === 'hibrido') {
            iconeModalidade = '<span class="modalidade-badge hibrido"><i class="fas fa-sync-alt"></i> Híbrido</span>';
        }
        
        clubeCard.innerHTML = `
            <h3 class="clube-nome">${clube.nome} ${iconeVisibilidade}</h3>
            <p class="clube-descricao">${clube.descricao || 'Sem descrição'}</p>
            <div class="clube-info">
                ${iconeModalidade}
            </div>
            <div class="clube-tags">
                ${clube.categorias ? clube.categorias.map(cat => `<span class="tag">${cat}</span>`).join('') : ''}
            </div>
            ${ehCriador ? '<span class="criador-badge">Criador</span>' : ''}
            <div class="clube-acoes">
                <button class="botao-padrao" onclick="acessarClube(${clube.id})">Acessar</button>
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
    if (!clubeId) {
        console.error('ID do clube inválido:', clubeId);
        return;
    }
    const botao = event.target;
    botao.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Acessando...';
    botao.disabled = true;
    
    setTimeout(() => {
        window.location.href = `/clube/${clubeId}`;
    }, 500);
}
document.addEventListener('DOMContentLoaded', function() {
    carregarMeusClubes();
});
