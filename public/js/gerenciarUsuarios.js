document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const tabelaUsuarios = document.getElementById('tabela-usuarios');
    const modalEditar = document.getElementById('modal-editar');
    const modalClubes = document.getElementById('modal-clubes');
    const formUsuario = document.getElementById('form-usuario');
    const inputId = document.getElementById('usuario-id');
    const inputNome = document.getElementById('usuario-nome');
    const inputEmail = document.getElementById('usuario-email');
    const inputSenha = document.getElementById('usuario-senha');
    const listaClubesUsuario = document.getElementById('lista-clubes-usuario');
    
    // Carregar usuários ao iniciar a página
    carregarUsuarios();
    
    // Event listeners para fechar modais
    document.querySelectorAll('.fechar-modal, .btn-cancelar, #btn-fechar-clubes').forEach(elemento => {
        elemento.addEventListener('click', () => {
            modalEditar.classList.remove('show');
            modalClubes.classList.remove('show');
        });
    });
    
    // Event listener para o formulário de edição
    formUsuario.addEventListener('submit', function(e) {
        e.preventDefault();
        atualizarUsuario();
    });
    async function carregarUsuarios() {
        try {
            const response = await fetch('/api/admin/usuarios');
            
            if (!response.ok) {
                throw new Error('Erro ao carregar usuários');
            }
            
            const usuarios = await response.json();
            
            if (usuarios.length === 0) {
                tabelaUsuarios.innerHTML = '<tr><td colspan="8" class="sem-dados">Nenhum usuário encontrado</td></tr>';
                return;
            }
            
            tabelaUsuarios.innerHTML = '';
            
            usuarios.forEach(usuario => {
                const row = document.createElement('tr');
                
                // Formatar data
                const dataCriacao = new Date(usuario.data_criacao);
                const dataFormatada = dataCriacao.toLocaleDateString('pt-BR') + ' ' + 
                                     dataCriacao.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                
                // Tipo de usuário com classe para estilização
                const tipoUsuario = `<span class="tipo-usuario ${usuario.tipo}">${usuario.tipo}</span>`;
                
                // Estado do usuário com classe para estilização
                const estadoUsuario = `<span class="estado-usuario ${usuario.estado || 'ativo'}">${usuario.estado || 'ativo'}</span>`;
                
                // Contador de clubes
                const contadorClubes = `<span class="contador-clubes">${usuario.total_clubes || 0}</span>`;
                
                row.innerHTML = `
                    <td>${usuario.id}</td>
                    <td>${usuario.nome}</td>
                    <td>${usuario.email}</td>
                    <td>${tipoUsuario}</td>
                    <td>${estadoUsuario}</td>
                    <td>${dataFormatada}</td>
                    <td>${contadorClubes}</td>
                    <td class="acoes">
                        <button class="btn-editar" data-id="${usuario.id}" title="Editar usuário">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-ver-clubes" data-id="${usuario.id}" title="Ver clubes">
                            <i class="fas fa-book-reader"></i>
                        </button>
                    </td>
                `;
                
                tabelaUsuarios.appendChild(row);
            });
            
            // Adicionar event listeners aos botões de ação
            document.querySelectorAll('.btn-editar').forEach(btn => {
                btn.addEventListener('click', () => abrirModalEditar(btn.dataset.id));
            });
            
            document.querySelectorAll('.btn-ver-clubes').forEach(btn => {
                btn.addEventListener('click', () => abrirModalClubes(btn.dataset.id));
            });
            
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            tabelaUsuarios.innerHTML = '<tr><td colspan="8" class="sem-dados">Erro ao carregar usuários</td></tr>';
        }
    }    
    async function abrirModalEditar(id) {
        try {
            const response = await fetch(`/api/admin/usuarios/${id}`);
            
            if (!response.ok) {
                throw new Error('Erro ao carregar dados do usuário');
            }
            
            const usuario = await response.json();
            
            inputId.value = usuario.id;
            inputNome.value = usuario.nome;
            inputEmail.value = usuario.email;
            inputSenha.value = '';
            
            const selectEstado = document.getElementById('usuario-estado');
            selectEstado.value = usuario.estado || 'ativo';
            
            modalEditar.classList.add('show');
            
        } catch (error) {
            console.error('Erro ao abrir modal de edição:', error);
            alert('Erro ao carregar dados do usuário');
        }
    }
    async function atualizarUsuario() {
        try {
            const id = inputId.value;
            const email = inputEmail.value;
            const senha = inputSenha.value;
            const estado = document.getElementById('usuario-estado').value;
            
            if (!email) {
                alert('O email é obrigatório');
                return;
            }
            
            const dados = { email, estado };
            
            if (senha) {
                dados.senha = senha;
            }
            
            const response = await fetch(`/api/admin/usuarios/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            });
            
            if (!response.ok) {
                const erro = await response.json();
                throw new Error(erro.erro || 'Erro ao atualizar usuário');
            }
            
            alert('Usuário atualizado com sucesso!');
            modalEditar.classList.remove('show');
            carregarUsuarios();
            
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            alert(error.message || 'Erro ao atualizar usuário');
        }
    }
    async function abrirModalClubes(id) {
        try {
            const response = await fetch(`/api/admin/usuarios/${id}/clubes`);
            
            if (!response.ok) {
                throw new Error('Erro ao carregar clubes do usuário');
            }
            
            const { clubesCriados, clubesParticipando } = await response.json();
            
            listaClubesUsuario.innerHTML = '';
            
            if (clubesCriados.length > 0) {
                const secaoCriados = document.createElement('div');
                secaoCriados.innerHTML = `<h3>Clubes Criados (${clubesCriados.length})</h3>`;
                
                const listaCriados = document.createElement('ul');
                clubesCriados.forEach(clube => {
                    const item = document.createElement('li');
                    item.textContent = clube.nome;
                    listaCriados.appendChild(item);
                });
                
                secaoCriados.appendChild(listaCriados);
                listaClubesUsuario.appendChild(secaoCriados);
            }
            
            if (clubesParticipando.length > 0) {
                const secaoParticipando = document.createElement('div');
                secaoParticipando.innerHTML = `<h3>Clubes Participando (${clubesParticipando.length})</h3>`;
                
                const listaParticipando = document.createElement('ul');
                clubesParticipando.forEach(clube => {
                    const item = document.createElement('li');
                    item.textContent = clube.nome;
                    listaParticipando.appendChild(item);
                });
                
                secaoParticipando.appendChild(listaParticipando);
                listaClubesUsuario.appendChild(secaoParticipando);
            }
            
            if (clubesCriados.length === 0 && clubesParticipando.length === 0) {
                listaClubesUsuario.innerHTML = '<p class="sem-dados">Este usuário não participa de nenhum clube</p>';
            }
            
            modalClubes.classList.add('show');
            
        } catch (error) {
            console.error('Erro ao abrir modal de clubes:', error);
            alert('Erro ao carregar clubes do usuário');
        }
    }
});
