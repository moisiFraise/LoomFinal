document.addEventListener('DOMContentLoaded', function() {
    carregarClubes();
    
    document.querySelectorAll('.fechar-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.closest('.modal').id;
            fecharModal(modalId);
        });
    });
    
    document.getElementById('form-visibilidade').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarVisibilidade();
    });
    
    document.getElementById('form-modelo').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarModelo();
    });
    
    document.getElementById('visibilidade').addEventListener('change', function() {
        const grupoSenha = document.getElementById('grupo-senha');
        if (this.value === 'privado') {
            grupoSenha.style.display = 'block';
            document.getElementById('senha').setAttribute('required', 'required');
        } else {
            grupoSenha.style.display = 'none';
            document.getElementById('senha').removeAttribute('required');
        }
    });
});

async function carregarClubes() {
    try {
        const response = await fetch('/api/admin/clubes');
        
        if (!response.ok) {
            throw new Error('Erro ao carregar clubes');
        }
        
        const clubes = await response.json();
        renderizarClubes(clubes);
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('tabela-clubes').innerHTML = `
            <tr>
                <td colspan="8" class="sem-dados">Erro ao carregar clubes. Tente novamente mais tarde.</td>
            </tr>
        `;
    }
}

function renderizarClubes(clubes) {
    const tbody = document.getElementById('tabela-clubes');
    
    if (!clubes || clubes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="sem-dados">Nenhum clube encontrado.</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = clubes.map(clube => {
        const dataFormatada = new Date(clube.data_criacao).toLocaleDateString('pt-BR');
        
        return `
            <tr>
                <td>${clube.id}</td>
                <td>${clube.nome}</td>
                <td>${clube.nome_criador}</td>
                <td>${clube.total_participantes}</td>
                <td>
                    <span class="badge badge-${clube.visibilidade}">
                        ${clube.visibilidade === 'publico' ? 'Público' : 'Privado'}
                    </span>
                </td>
                <td>
                    <span class="badge badge-${clube.modelo || 'presencial'}">
                        ${formatarModelo(clube.modelo || 'presencial')}
                    </span>
                </td>
                <td>${dataFormatada}</td>
                <td class="acoes">
                    <button class="btn-editar-visibilidade" onclick="abrirModalVisibilidade(${clube.id}, '${clube.visibilidade}', '${clube.senha_acesso || ''}')">
                        <i class="fas fa-lock"></i>
                    </button>
                    <button class="btn-editar-modelo" onclick="abrirModalModelo(${clube.id}, '${clube.modelo || 'presencial'}')">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button class="btn-ver-detalhes" onclick="abrirModalDetalhes(${JSON.stringify(clube).replace(/"/g, '&quot;')})">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function formatarModelo(modelo) {
    switch (modelo) {
        case 'presencial':
            return 'Presencial';
        case 'online':
            return 'Online';
        case 'hibrido':
            return 'Híbrido';
        default:
            return 'Presencial';
    }
}

function abrirModalVisibilidade(id, visibilidade, senha) {
    document.getElementById('clube-id-visibilidade').value = id;
    document.getElementById('visibilidade').value = visibilidade;
    document.getElementById('senha').value = senha;
    
    const grupoSenha = document.getElementById('grupo-senha');
    if (visibilidade === 'privado') {
        grupoSenha.style.display = 'block';
        document.getElementById('senha').setAttribute('required', 'required');
    } else {
        grupoSenha.style.display = 'none';
        document.getElementById('senha').removeAttribute('required');
    }
    
    document.getElementById('modal-visibilidade').classList.add('show');
}

function abrirModalModelo(id, modelo) {
    document.getElementById('clube-id-modelo').value = id;
    document.getElementById('modelo').value = modelo;
    
    document.getElementById('modal-modelo').classList.add('show');
}

function abrirModalDetalhes(clube) {
    document.getElementById('detalhe-nome').textContent = clube.nome;
    document.getElementById('detalhe-descricao').textContent = clube.descricao || 'Sem descrição';
    document.getElementById('detalhe-criador').textContent = clube.nome_criador;
    document.getElementById('detalhe-participantes').textContent = clube.total_participantes;
    document.getElementById('detalhe-visibilidade').textContent = clube.visibilidade === 'publico' ? 'Público' : 'Privado';
    document.getElementById('detalhe-modelo').textContent = formatarModelo(clube.modelo || 'presencial');
    
    const dataFormatada = new Date(clube.data_criacao).toLocaleDateString('pt-BR');
    document.getElementById('detalhe-data').textContent = dataFormatada;
    
    // Mostrar ou esconder senha dependendo da visibilidade
    const detalheSenha = document.getElementById('detalhe-grupo-senha');
    if (clube.visibilidade === 'privado') {
        detalheSenha.style.display = 'block';
        document.getElementById('detalhe-senha').textContent = clube.senha_acesso || 'Não definida';
    } else {
        detalheSenha.style.display = 'none';
    }
    
    document.getElementById('modal-detalhes').classList.add('show');
}

function fecharModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

async function salvarVisibilidade() {
    try {
        const id = document.getElementById('clube-id-visibilidade').value;
        const visibilidade = document.getElementById('visibilidade').value;
        const senha = document.getElementById('senha').value;
        
        if (visibilidade === 'privado' && !senha) {
            alert('Clubes privados precisam de uma senha de acesso');
            return;
        }
        
        const response = await fetch(`/api/admin/clubes/${id}/visibilidade`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ visibilidade, senha })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.erro || 'Erro ao atualizar visibilidade');
        }
        
        fecharModal('modal-visibilidade');
        carregarClubes();
        
        alert('Visibilidade atualizada com sucesso!');
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message || 'Erro ao atualizar visibilidade. Tente novamente.');
    }
}

async function salvarModelo() {
    try {
        const id = document.getElementById('clube-id-modelo').value;
        const modelo = document.getElementById('modelo').value;
        
        const response = await fetch(`/api/admin/clubes/${id}/modelo`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ modelo })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.erro || 'Erro ao atualizar modelo');
        }
        
        fecharModal('modal-modelo');
        carregarClubes();
        
        alert('Modelo atualizado com sucesso!');
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message || 'Erro ao atualizar modelo. Tente novamente.');
    }
}
s