document.addEventListener('DOMContentLoaded', function() {
    const btnNovaCategoria = document.getElementById('btn-nova-categoria');
    const modalCategoria = document.getElementById('modal-categoria');
    const modalClubes = document.getElementById('modal-clubes');
    const modalConfirmar = document.getElementById('modal-confirmar');
    const formCategoria = document.getElementById('form-categoria');
    const fecharModals = document.querySelectorAll('.fechar-modal, .btn-cancelar, .btn-fechar-modal');
    const btnConfirmarExcluir = document.getElementById('btn-confirmar-excluir');
    
    let categoriaIdParaExcluir = null;
    
    carregarCategorias();
    
    btnNovaCategoria.addEventListener('click', abrirModalNovaCategoria);
    
    fecharModals.forEach(btn => {
        btn.addEventListener('click', function() {
            modalCategoria.classList.remove('show');
            modalClubes.classList.remove('show');
            modalConfirmar.classList.remove('show');
        });
    });
    
    formCategoria.addEventListener('submit', salvarCategoria);
    
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('overlay')) {
            modalCategoria.classList.remove('show');
            modalClubes.classList.remove('show');
            modalConfirmar.classList.remove('show');
        }
    });
    
    btnConfirmarExcluir.addEventListener('click', confirmarExclusao);
    
    async function carregarCategorias() {
        try {
            const response = await fetch('/api/categorias');
            if (!response.ok) {
                throw new Error('Erro ao carregar categorias');
            }
            
            const categorias = await response.json();
            renderizarCategorias(categorias);
        } catch (error) {
    console.error('Erro:', error);
    Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Não foi possível carregar as categorias. Por favor, tente novamente.'
    });
        }
    }
    
    function renderizarCategorias(categorias) {
        const tbody = document.getElementById('categorias-lista');
        tbody.innerHTML = '';
        
        if (categorias.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="4" class="sem-dados">Nenhuma categoria encontrada</td>`;
            tbody.appendChild(tr);
            return;
        }
        
        categorias.forEach(categoria => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${categoria.id}</td>
                <td>${categoria.nome}</td>
                <td>
                    <span class="contador-clubes">${categoria.total_clubes}</span>
                    ${categoria.total_clubes > 0 ? 
                        `<button class="btn-ver-clubes" data-id="${categoria.id}" data-nome="${categoria.nome}">
                            <i class="fas fa-eye"></i>
                        </button>` : ''}
                </td>
                <td class="acoes">
                    <button class="btn-editar" data-id="${categoria.id}" data-nome="${categoria.nome}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-excluir" data-id="${categoria.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', () => abrirModalEditarCategoria(btn.dataset.id, btn.dataset.nome));
        });
        
        document.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', () => abrirModalConfirmarExclusao(btn.dataset.id));
        });
        
        document.querySelectorAll('.btn-ver-clubes').forEach(btn => {
            btn.addEventListener('click', () => verClubesDaCategoria(btn.dataset.id, btn.dataset.nome));
        });
    }
    
    function abrirModalNovaCategoria() {
        document.getElementById('modal-titulo').textContent = 'Nova Categoria';
        document.getElementById('categoria-id').value = '';
        document.getElementById('categoria-nome').value = '';
        modalCategoria.classList.add('show');
        document.getElementById('categoria-nome').focus();
    }
    
    function abrirModalEditarCategoria(id, nome) {
        document.getElementById('modal-titulo').textContent = 'Editar Categoria';
        document.getElementById('categoria-id').value = id;
        document.getElementById('categoria-nome').value = nome;
        modalCategoria.classList.add('show');
        document.getElementById('categoria-nome').focus();
    }
    async function salvarCategoria(event) {
        event.preventDefault();
        
        const id = document.getElementById('categoria-id').value;
        const nome = document.getElementById('categoria-nome').value;
        
       if (!nome.trim()) {
    Swal.fire({
        icon: 'warning',
        title: 'Ops!',
        text: 'O nome da categoria é obrigatório'
    });
    return;
}
        
        try {
            let url = '/api/categorias';
            let method = 'POST';
            
            if (id) {
                url = `/api/categorias/${id}`;
                method = 'POST'; 
            }
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.erro || 'Erro ao salvar categoria');
            }
            
            modalCategoria.classList.remove('show');
            carregarCategorias();
            
           Swal.fire({
    icon: 'success',
    title: 'Sucesso!',
    text: id ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!',
    timer: 3000,
    showConfirmButton: false
});
        }catch (error) {
    console.error('Erro:', error);
    Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: error.message || 'Erro ao salvar categoria. Por favor, tente novamente.'
    });
}
    }
    
    function abrirModalConfirmarExclusao(id) {
        categoriaIdParaExcluir = id;
        modalConfirmar.classList.add('show');
    }
    
    async function confirmarExclusao() {
        if (!categoriaIdParaExcluir) return;
        
        try {
            const response = await fetch(`/api/categorias/${categoriaIdParaExcluir}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.erro || 'Erro ao excluir categoria');
            }
            
            modalConfirmar.classList.remove('show');
            carregarCategorias();
            
            Swal.fire({
    icon: 'success',
    title: 'Sucesso!',
    text: 'Categoria excluída com sucesso!',
    timer: 3000,
    showConfirmButton: false
});
        } catch (error) {
    console.error('Erro:', error);
    Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: error.message || 'Erro ao excluir categoria. Por favor, tente novamente.'
    });
} finally {
    categoriaIdParaExcluir = null;
}
    }
    
    async function verClubesDaCategoria(id, nome) {
        try {
            const response = await fetch(`/api/categorias/${id}/clubes`);
            
            if (!response.ok) {
                throw new Error('Erro ao carregar clubes da categoria');
            }
            
            const clubes = await response.json();
            
            document.getElementById('modal-clubes-titulo').textContent = `Clubes da Categoria: ${nome}`;
            
            const listaContainer = document.getElementById('lista-clubes-categoria');
            listaContainer.innerHTML = '';
            
            if (clubes.length === 0) {
                listaContainer.innerHTML = '<p class="sem-dados">Nenhum clube encontrado para esta categoria</p>';
            } else {
                const ul = document.createElement('ul');
                ul.className = 'lista-clubes';
                
                clubes.forEach(clube => {
                    const li = document.createElement('li');
                    li.className = 'clube-item';
                    li.innerHTML = `
                        <div class="clube-info">
                            <h3>${clube.nome}</h3>
                            <p>${clube.descricao || 'Sem descrição'}</p>
                        </div>
                    `;
                    ul.appendChild(li);
                });
                
                listaContainer.appendChild(ul);
            }
            
            modalClubes.classList.add('show');
        } catch (error) {
    console.error('Erro:', error);
    Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Não foi possível carregar os clubes desta categoria. Por favor, tente novamente.'
    });
}
    }
});
