document.addEventListener('DOMContentLoaded', function() {
    const btnsFiltro = document.querySelectorAll('.btn-filtro');
    const listaPublicacoes = document.querySelector('.lista-publicacoes');
    const publicacoes = document.querySelectorAll('.publicacao-item');

    // ============================
    // Configurar barras de progresso
    // ============================
    publicacoes.forEach(item => {
        const progressBar = item.querySelector('.progresso');
        const percentageText = item.querySelector('.porcentagem');

        try {
            const percentage = parseInt(item.getAttribute('data-porcentagem') || '0', 10);
            const safePercentage = isNaN(percentage) ? 0 : Math.max(0, Math.min(100, percentage));

            if (progressBar) progressBar.style.width = safePercentage + '%';
            if (percentageText) percentageText.textContent = safePercentage + '% concluído';
        } catch (e) {
            console.error('Erro ao configurar barra de progresso:', e);
            if (progressBar) progressBar.style.width = '0%';
            if (percentageText) percentageText.textContent = '0% concluído';
        }
    });

    // ============================
    // Configurar filtros de publicações
    // ============================
    if (btnsFiltro.length) {
        btnsFiltro.forEach(btn => {
            btn.addEventListener('click', function() {
                const filtro = this.dataset.filtro;

                btnsFiltro.forEach(b => b.classList.remove('ativo'));
                this.classList.add('ativo');

                publicacoes.forEach(pub => {
                    const mostrar =
                        filtro === 'todas' ||
                        (filtro === 'publicas' && pub.classList.contains('publico')) ||
                        (filtro === 'privadas' && pub.classList.contains('privado'));

                    pub.style.display = mostrar ? 'block' : 'none';
                });
            });
        });
    }

    // ============================
    // Carregar estado de curtidas e contadores
    // ============================
    publicacoes.forEach(item => {
        const atualizacaoId = item.getAttribute('data-id');
        if (!atualizacaoId) return;

        // Estado curtida (se a função já existir no sistema)
        if (typeof carregarEstadoCurtidas === 'function') {
            try {
                carregarEstadoCurtidas(atualizacaoId);
            } catch (e) {
                console.warn('Erro ao carregar estado da curtida:', e);
            }
        }

        // Contador de curtidas
        carregarContadorCurtidas(atualizacaoId);

        // Contador de comentários
        carregarContadorComentarios(atualizacaoId);
    });
});

// ============================
// Funções utilitárias
// ============================

// Voltar à página anterior
function voltarPagina() {
    window.history.back();
}

// Ir para o perfil do usuário
function irParaPerfil(idUsuario) {
    if (typeof userId !== 'undefined' && idUsuario === userId) {
        window.location.href = '/meuPerfil';
    } else {
        window.location.href = `/perfil/${idUsuario}`;
    }
}

// Carregar contador de comentários
async function carregarContadorComentarios(idAtualizacao) {
    try {
        const response = await fetch(`/api/comentarios/${idAtualizacao}/count`);
        if (response.ok) {
            const data = await response.json();
            const contador = document.querySelector(`[data-atualizacao-id="${idAtualizacao}"]`);
            if (contador) contador.textContent = data.total;
        }
    } catch (error) {
        console.error('Erro ao carregar contador de comentários:', error);
    }
}

// Carregar contador de curtidas
async function carregarContadorCurtidas(idAtualizacao) {
    try {
        const response = await fetch(`/api/curtidas/${idAtualizacao}/count`);
        if (response.ok) {
            const data = await response.json();
            const contador = document.querySelector(`.contador-curtidas[data-id="${idAtualizacao}"]`);
            if (contador) contador.textContent = data.total;
        }
    } catch (error) {
        console.error('Erro ao carregar contador de curtidas:', error);
    }
}

// ============================
// Funções seguras para interações
// ============================
function verificarPrivado(item, callback) {
    if (item.classList.contains('privado')) {
        Swal.fire('Para curtir ou comentar, entre no clube de leitura');
        return;
    }
    callback();
}

function alternarCurtidaSegura(idAtualizacao) {
    const item = document.querySelector(`.publicacao-item[data-id="${idAtualizacao}"]`);
    if (!item) return;

    verificarPrivado(item, async () => {
        await alternarCurtida(idAtualizacao); // sua função que curte/descurte
        await carregarContadorCurtidas(idAtualizacao); // recarrega o contador após curtir
    });
}

function abrirComentariosSegura(idAtualizacao) {
    const item = document.querySelector(`.publicacao-item[data-id="${idAtualizacao}"]`);
    if (!item) return;

    verificarPrivado(item, () => {
        comentariosManager.toggleComentarios(idAtualizacao, `comentarios-${idAtualizacao}`, userId);
    });
}

// ============================
// Função segura para entrar em clubes
// ============================
window.entrarNoClubeSegura = function(clubeId, visibilidade) {
    if (visibilidade === 'privado') {
        Swal.fire('Para acessar este clube, você precisa ser membro.');
        return;
    }
    window.location.href = `/clube/${clubeId}`;
};
