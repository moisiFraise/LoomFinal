document.addEventListener('DOMContentLoaded', function() {
    const btnsFiltro = document.querySelectorAll('.btn-filtro');
    const listaPublicacoes = document.querySelector('.lista-publicacoes');
    
    // Configurar barras de progresso
    document.querySelectorAll('.publicacao-item').forEach(item => {
        const progressBar = item.querySelector('.progresso');
        const percentageText = item.querySelector('.porcentagem');
        
        try {
            const percentage = parseInt(item.getAttribute('data-porcentagem') || '0');
            const safePercentage = isNaN(percentage) ? 0 : Math.max(0, Math.min(100, percentage));
            
            if (progressBar) progressBar.style.width = safePercentage + '%';
            if (percentageText) percentageText.textContent = safePercentage + '% concluído';
        } catch (e) {
            console.error('Erro ao configurar barra de progresso:', e);
            if (progressBar) progressBar.style.width = '0%';
            if (percentageText) percentageText.textContent = '0% concluído';
        }
    });

    // Configurar filtros
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
                    } else {
                        pub.style.display = 'none';
                    }
                });
            });
        });
    }

    // Carregar estado das curtidas para cada publicação
    document.querySelectorAll('.publicacao-item').forEach(item => {
        const atualizacaoId = item.querySelector('[data-atualizacao-id]')?.getAttribute('data-atualizacao-id');
        if (atualizacaoId) {
            carregarEstadoCurtidas(atualizacaoId);
            carregarContadorComentarios(atualizacaoId);
        }
    });
});

function voltarPagina() {
    window.history.back();
}

// Função para ir ao perfil do usuário
function irParaPerfil(idUsuario) {
    if (idUsuario == userId) {
        // Se for o próprio usuário, vai para "Meu Perfil"
        window.location.href = '/meuPerfil';
    } else {
        // Se for outro usuário, vai para o perfil público
        window.location.href = `/perfil/${idUsuario}`;
    }
}



// Função para carregar contador de comentários
async function carregarContadorComentarios(idAtualizacao) {
    try {
        const response = await fetch(`/api/comentarios/${idAtualizacao}/count`);
        if (response.ok) {
            const data = await response.json();
            const contador = document.querySelector(`[data-atualizacao-id="${idAtualizacao}"]`);
            if (contador) {
                contador.textContent = data.total;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar contador de comentários:', error);
    }
}
