const estadoCurtidas = {};

async function alternarCurtida(atualizacaoId) {
    try {
        const botaoCurtir = document.querySelector(`.botao-curtir[data-id="${atualizacaoId}"]`);
        botaoCurtir.disabled = true;
        
        const response = await fetch(`/api/clube/${clubeId}/atualizacoes/${atualizacaoId}/curtir`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Erro ao processar curtida');
        
        const data = await response.json();
        
        const icone = botaoCurtir.querySelector('i');
        if (data.curtido) {
            botaoCurtir.classList.add('curtido');
            icone.className = 'fa fa-heart';
        } else {
            botaoCurtir.classList.remove('curtido');
            icone.className = 'fa fa-heart-o';
        }
        
        const contador = document.querySelector(`.contador-curtidas[data-id="${atualizacaoId}"]`);
        contador.textContent = data.total > 0 ? data.total : '';
        
        botaoCurtir.disabled = false;
    } catch (error) {
        console.error('Erro ao alternar curtida:', error);
        alert('Não foi possível processar sua curtida. Tente novamente.');
    }
}
function atualizarBotaoCurtida(idAtualizacao, curtido, totalCurtidas) {
    const botaoCurtir = document.querySelector(`.botao-curtir[data-id="${idAtualizacao}"]`);
    const contadorCurtidas = document.querySelector(`.contador-curtidas[data-id="${idAtualizacao}"]`);
    
    if (botaoCurtir) {
        if (curtido) {
            botaoCurtir.classList.add('curtido');
            botaoCurtir.innerHTML = '<i class="fa fa-heart"></i>';
        } else {
            botaoCurtir.classList.remove('curtido');
            botaoCurtir.innerHTML = '<i class="fa fa-heart-o"></i>';
        }
    }
    
    if (contadorCurtidas) {
        contadorCurtidas.textContent = totalCurtidas > 0 ? totalCurtidas : '';
        contadorCurtidas.style.display = totalCurtidas > 0 ? 'inline-block' : 'none';
    }
}
async function carregarEstadoCurtidas(atualizacaoId) {
    try {
        const response = await fetch(`/api/clube/${clubeId}/atualizacoes/${atualizacaoId}/curtidas`);
        if (!response.ok) throw new Error('Erro ao carregar estado das curtidas');
        
        const data = await response.json();
        
        const botaoCurtir = document.querySelector(`.botao-curtir[data-id="${atualizacaoId}"]`);
        const icone = botaoCurtir.querySelector('i');
        
        if (data.curtido) {
            botaoCurtir.classList.add('curtido');
            icone.className = 'fa fa-heart';
        } else {
            botaoCurtir.classList.remove('curtido');
            icone.className = 'fa fa-heart-o';
        }
        
        const contador = document.querySelector(`.contador-curtidas[data-id="${atualizacaoId}"]`);
        contador.textContent = data.total > 0 ? data.total : '';
    } catch (error) {
        console.error('Erro ao carregar estado das curtidas:', error);
    }
}