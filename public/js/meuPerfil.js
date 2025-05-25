document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const btnEditarPerfil = document.getElementById('btn-editar-perfil');
    const modalEditarPerfil = document.getElementById('modal-editar-perfil');
    const modalConfirmarExclusao = document.getElementById('modal-confirmar-exclusao');
    const btnExcluirConta = document.getElementById('btn-excluir-conta');
    const btnConfirmarExclusao = document.getElementById('btn-confirmar-exclusao');
    const btnCancelarExclusao = document.getElementById('btn-cancelar-exclusao');
    const formEditarPerfil = document.getElementById('form-editar-perfil');
    const uploadFoto = document.getElementById('upload-foto');
    const fotoPerfil = document.getElementById('foto-perfil');
    const btnsFiltro = document.querySelectorAll('.btn-filtro');
    const listaPublicacoes = document.querySelector('.lista-publicacoes');
    const fecharModais = document.querySelectorAll('.fechar-modal');
    
    document.querySelectorAll('.publicacao-item').forEach(item => {
        const progressBar = item.querySelector('.progresso');
        const percentageText = item.querySelector('.porcentagem');
        
        try {
            const percentage = parseInt(item.getAttribute('data-porcentagem') || '0');
            const safePercentage = isNaN(percentage) ? 0 : Math.max(0, Math.min(100, percentage));
            
            progressBar.style.width = safePercentage + '%';
            percentageText.textContent = safePercentage + '% concluído';
        } catch (e) {
            console.error('Erro ao configurar barra de progresso:', e);
            progressBar.style.width = '0%';
            percentageText.textContent = '0% concluído';
        }
    });
    if (btnEditarPerfil) {
        btnEditarPerfil.addEventListener('click', function() {
            modalEditarPerfil.classList.add('ativo');
        });
    }
    if (btnExcluirConta) {
        btnExcluirConta.addEventListener('click', function(e) {
            e.preventDefault();
            modalEditarPerfil.classList.remove('ativo');
            modalConfirmarExclusao.classList.add('ativo');
        });
    }
    if (btnCancelarExclusao) {
        btnCancelarExclusao.addEventListener('click', function() {
            modalConfirmarExclusao.classList.remove('ativo');
            modalEditarPerfil.classList.add('ativo');
        });
    }
    if (fecharModais) {
        fecharModais.forEach(btn => {
            btn.addEventListener('click', function() {
                modalEditarPerfil.classList.remove('ativo');
                modalConfirmarExclusao.classList.remove('ativo');
            });
        });
    }
if (uploadFoto) {
    uploadFoto.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            const maxSize = 5 * 1024 * 1024; // 5MB
            
            if (!validTypes.includes(file.type)) {
                mostrarNotificacao('Apenas imagens JPEG, PNG e GIF são permitidas.', 'erro');
                return;
            }
            
            if (file.size > maxSize) {
                mostrarNotificacao('O tamanho máximo da imagem é 5MB.', 'erro');
                return;
            }
            
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            document.querySelector('.foto-perfil-container').appendChild(loadingIndicator);
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'loom_perfil');
            
            fetch(`https://api.cloudinary.com/v1_1/dhz1cbipj/image/upload`, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error.message);
                }
                
                return fetch('/api/perfil/atualizar-foto', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ fotoUrl: data.secure_url })
                });
            })
            .then(response => response.json())
            .then(data => {
                document.querySelector('.loading-indicator')?.remove();
                
                fotoPerfil.src = data.fotoNome;
                mostrarNotificacao('Foto de perfil atualizada com sucesso!', 'sucesso');
            })
            .catch(error => {
                document.querySelector('.loading-indicator')?.remove();
                
                console.error('Erro completo:', error);
                mostrarNotificacao(error.message || 'Erro ao atualizar foto de perfil.', 'erro');
            });
        }
    });
}

function mostrarNotificacao(mensagem, tipo) {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    notificacao.textContent = mensagem;
    
    document.querySelectorAll('.notificacao').forEach(n => n.remove());
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.classList.add('mostrar');
    }, 10);
    
    setTimeout(() => {
        notificacao.classList.remove('mostrar');
        setTimeout(() => {
            notificacao.remove();
        }, 300);
    }, 3000);
}

document.head.insertAdjacentHTML('beforeend', `
<style>
.loading-indicator {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
}

.notificacao {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 4px;
    color: white;
    font-weight: bold;
    z-index: 1000;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s, transform 0.3s;
}

.notificacao.mostrar {
    opacity: 1;
    transform: translateY(0);
}

.notificacao.sucesso {
    background-color: #2ecc71;
}

.notificacao.erro {
    background-color: #e74c3c;
}
</style>
`);

    if (formEditarPerfil) {
        formEditarPerfil.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nome = document.getElementById('editar-nome').value;
            const email = document.getElementById('editar-email').value;
            const biografia = document.getElementById('editar-biografia').value;
            const senha = document.getElementById('editar-senha').value;
            const confirmarSenha = document.getElementById('confirmar-senha').value;
            
            if (senha && senha !== confirmarSenha) {
                mostrarNotificacao('As senhas não coincidem.', 'erro');
                return;
            }
            
            const dadosPerfil = {
                nome,
                email,
                biografia,
                senha: senha || undefined
            };
            
            fetch('/api/perfil', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosPerfil)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao atualizar perfil');
                }
                return response.json();
            })
            .then(data => {
                document.getElementById('nome-usuario').textContent = data.nome;
                document.getElementById('email-usuario').textContent = data.email;
                document.getElementById('biografia-texto').textContent = data.biografia || 'Adicione uma biografia para que outros usuários conheçam você melhor.';
                
                modalEditarPerfil.classList.remove('ativo');
                mostrarNotificacao('Perfil atualizado com sucesso!', 'sucesso');
            })
            .catch(error => {
                console.error('Erro:', error);
                mostrarNotificacao('Erro ao atualizar perfil.', 'erro');
            });
        });
    }
    
    if (btnConfirmarExclusao) {
        btnConfirmarExclusao.addEventListener('click', function() {
            fetch('/api/perfil', {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao excluir conta');
                }
                return response.json();
            })
            .then(data => {
                window.location.href = '/autenticacao';
            })
            .catch(error => {
                console.error('Erro:', error);
                mostrarNotificacao('Erro ao excluir conta.', 'erro');
                modalConfirmarExclusao.classList.remove('ativo');
            });
        });
    }
    
    if (btnsFiltro) {
        btnsFiltro.forEach(btn => {
            btn.addEventListener('click', function() {
                const filtro = this.dataset.filtro;
                
                btnsFiltro.forEach(b => b.classList.remove('ativo'));
                this.classList.add('ativo');
                
                const publicacoes = document.querySelectorAll('.publicacao-item');
                
                publicacoes.forEach(pub => {
                    if (filtro === 'todas') {
                        pub.style.display = 'block';
                    } else if (filtro === 'publicas' && pub.classList.contains('publico')) {
                        pub.style.display = 'block';
                    } else if (filtro === 'privadas' && pub.classList.contains('privado')) {
                        pub.style.display = 'block';
                    } else {
                        pub.style.display = 'none';
                    }
                });
            });
        });
    }
    
    document.querySelectorAll('.btn-editar-publicacao').forEach(btn => {
        btn.addEventListener('click', function() {
            const publicacaoId = this.dataset.id;
            const clubeId = this.closest('.publicacao-item').dataset.clubeId;
            
            window.location.href = `/clube/${clubeId}/atualizacoes/${publicacaoId}/editar`;
        });
    });
    
    document.querySelectorAll('.btn-excluir-publicacao').forEach(btn => {
        btn.addEventListener('click', function() {
            const publicacaoId = this.dataset.id;
            const clubeId = this.closest('.publicacao-item').dataset.clubeId;
            const publicacaoItem = this.closest('.publicacao-item');
            
            if (confirm('Tem certeza que deseja excluir esta publicação?')) {
                fetch(`/api/clube/${clubeId}/atualizacoes/${publicacaoId}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao excluir publicação');
                    }
                    return response.json();
                })
                .then(data => {
                    publicacaoItem.remove();
                    mostrarNotificacao('Publicação excluída com sucesso!', 'sucesso');
                    
                    const numeroPublicacoes = document.querySelector('.estatistica .numero');
                    if (numeroPublicacoes) {
                        numeroPublicacoes.textContent = parseInt(numeroPublicacoes.textContent) - 1;
                    }
                    
                    if (listaPublicacoes && listaPublicacoes.querySelectorAll('.publicacao-item').length === 0) {
                        const semPublicacoes = document.createElement('div');
                        semPublicacoes.className = 'sem-publicacoes';
                        semPublicacoes.innerHTML = '<p>Você ainda não fez nenhuma publicação.</p>';
                        listaPublicacoes.appendChild(semPublicacoes);
                    }
                })
                .catch(error => {
                    console.error('Erro:', error);
                    mostrarNotificacao('Erro ao excluir publicação.', 'erro');
                });
            }
        });
    });
    
    function mostrarNotificacao(mensagem, tipo) {
        let notificacao = document.querySelector('.notificacao');
        
        if (!notificacao) {
            notificacao = document.createElement('div');
            notificacao.className = 'notificacao';
            document.body.appendChild(notificacao);
        }
        
        notificacao.className = 'notificacao';
        notificacao.classList.add(tipo);
        notificacao.textContent = mensagem;
        notificacao.style.display = 'block';
        
        setTimeout(() => {
            notificacao.classList.add('mostrar');
        }, 10);
        
        setTimeout(() => {
            notificacao.classList.remove('mostrar');
            setTimeout(() => {
                notificacao.style.display = 'none';
            }, 300);
        }, 3000);
    }
});