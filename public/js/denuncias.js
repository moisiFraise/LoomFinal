document.addEventListener('DOMContentLoaded', () => {
    carregarDenuncias();
});

let todasDenuncias = [];

async function carregarDenuncias() {
    try {
        const response = await fetch('/api/admin/denuncias');
        if (!response.ok) throw new Error('Erro ao carregar denúncias');
        
        const data = await response.json();
        todasDenuncias = data.denuncias;
        
        atualizarEstatisticas(data.contadores);
        renderizarDenuncias(todasDenuncias);
    } catch (error) {
        console.error('Erro ao carregar denúncias:', error);
        document.getElementById('denuncias-lista').innerHTML = 
            `<div class="erro-carregamento">Erro ao carregar denúncias. Tente novamente mais tarde.</div>`;
    }
}

function atualizarEstatisticas(contadores) {
    document.getElementById('stat-pendente').textContent = contadores.pendente || 0;
    document.getElementById('stat-analisada').textContent = contadores.analisada || 0;
    document.getElementById('stat-rejeitada').textContent = contadores.rejeitada || 0;
}

function renderizarDenuncias(denuncias) {
    const container = document.getElementById('denuncias-lista');
    
    if (!denuncias || denuncias.length === 0) {
        container.innerHTML = `
            <div class="sem-denuncias">
                <i class="fa fa-flag"></i>
                <h3>Nenhuma denúncia encontrada</h3>
                <p>Não há denúncias para exibir no momento</p>
            </div>`;
        return;
    }
    
    container.innerHTML = denuncias.map(denuncia => {
        const data = new Date(denuncia.data_denuncia);
        const dataFormatada = data.toLocaleDateString('pt-BR') + ' às ' + 
                             data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        
        const motivoTexto = {
            'spam': 'Spam',
            'conteudo_inadequado': 'Conteúdo inadequado',
            'assedio': 'Assédio',
            'discurso_odio': 'Discurso de ódio',
            'outro': 'Outro'
        };
        
        const statusClass = `status-${denuncia.status}`;
        const statusTexto = {
            'pendente': 'Pendente',
            'analisada': 'Analisada',
            'rejeitada': 'Rejeitada'
        };
        
        const botoesAcao = denuncia.status === 'pendente' ? `
            <div class="denuncia-acoes">
                <button class="btn-acao btn-detalhes" onclick="verDetalhes(${denuncia.id})">
                    <i class="fa fa-eye"></i> Ver Detalhes
                </button>
                <button class="btn-acao btn-suspender" onclick="processarDenuncia(${denuncia.id}, 'suspender_usuario')">
                    <i class="fa fa-user-times"></i> Suspender Usuário
                </button>
                <button class="btn-acao btn-remover" onclick="processarDenuncia(${denuncia.id}, 'remover_atualizacao')">
                    <i class="fa fa-trash"></i> Remover Comentário
                </button>
                <button class="btn-acao btn-rejeitar" onclick="processarDenuncia(${denuncia.id}, 'rejeitar')">
                    <i class="fa fa-times"></i> Rejeitar
                </button>
            </div>` : `
            <div class="denuncia-acoes">
                <button class="btn-acao btn-detalhes" onclick="verDetalhes(${denuncia.id})">
                    <i class="fa fa-eye"></i> Ver Detalhes
                </button>
            </div>`;
        
        return `
            <div class="denuncia-item" data-status="${denuncia.status}" data-motivo="${denuncia.motivo}">
                <div class="denuncia-header">
                    <div class="denuncia-info">
                        <div class="denuncia-motivo">${motivoTexto[denuncia.motivo]}</div>
                        <div class="denuncia-status ${statusClass}">${statusTexto[denuncia.status]}</div>
                        <p><strong>Data:</strong> ${dataFormatada}</p>
                        <p><strong>Clube:</strong> ${denuncia.nome_clube}</p>
                    </div>
                </div>
                
                <div class="denuncia-usuarios">
                    <div class="usuario-info">
                        <h4>Denunciante</h4>
                        <p>${denuncia.nome_denunciante}</p>
                        <small>${denuncia.email_denunciante}</small>
                    </div>
                    <div class="usuario-info">
                        <h4>Denunciado</h4>
                        <p>${denuncia.nome_denunciado}</p>
                        <small>${denuncia.email_denunciado}</small>
                        ${denuncia.estado_denunciado === 'suspenso' ? '<span class="status-suspenso">SUSPENSO</span>' : ''}
                    </div>
                </div>
                
                <div class="denuncia-conteudo">
                    <h4>Comentário denunciado:</h4>
                    <p>"${denuncia.conteudo_atualizacao}"</p>
                </div>
                
                ${denuncia.descricao ? `
                    <div class="denuncia-conteudo">
                        <h4>Descrição da denúncia:</h4>
                        <p>${denuncia.descricao}</p>
                    </div>` : ''}
                
                ${denuncia.observacoes_admin ? `
                    <div class="denuncia-conteudo">
                        <h4>Observações do administrador:</h4>
                        <p>${denuncia.observacoes_admin}</p>
                        <small>Analisado por: ${denuncia.nome_admin_analise}</small>
                    </div>` : ''}
                
                ${botoesAcao}
            </div>`;
    }).join('');
}

function filtrarDenuncias() {
    const statusFiltro = document.getElementById('filtro-status').value;
    const motivoFiltro = document.getElementById('filtro-motivo').value;
    
    let denunciasFiltradas = todasDenuncias;
    
    if (statusFiltro) {
        denunciasFiltradas = denunciasFiltradas.filter(d => d.status === statusFiltro);
    }
    
    if (motivoFiltro) {
        denunciasFiltradas = denunciasFiltradas.filter(d => d.motivo === motivoFiltro);
    }
    
    renderizarDenuncias(denunciasFiltradas);
}

async function verDetalhes(denunciaId) {
    try {
        const response = await fetch(`/api/admin/denuncias/${denunciaId}`);
        if (!response.ok) throw new Error('Erro ao carregar detalhes');
        
        const denuncia = await response.json();
        mostrarModalDetalhes(denuncia);
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        alert('Erro ao carregar detalhes da denúncia');
    }
}

function mostrarModalDetalhes(denuncia) {
    const data = new Date(denuncia.data_denuncia);
    const dataFormatada = data.toLocaleDateString('pt-BR') + ' às ' + 
                         data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    
    const dataAnalise = denuncia.data_analise ? 
        new Date(denuncia.data_analise).toLocaleDateString('pt-BR') + ' às ' + 
        new Date(denuncia.data_analise).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : 
        'Não analisada';
    
    const motivoTexto = {
        'spam': 'Spam',
        'conteudo_inadequado': 'Conteúdo inadequado',
        'assedio': 'Assédio',
        'discurso_odio': 'Discurso de ódio',
        'outro': 'Outro'
    };
    
    const statusTexto = {
        'pendente': 'Pendente',
        'analisada': 'Analisada',
        'rejeitada': 'Rejeitada'
    };
    
    const modalHTML = `
        <div id="overlay-detalhes" class="overlay" onclick="fecharModalDetalhes()"></div>
        <div id="modal-detalhes" class="modal modal-detalhes">
            <div class="modal-header">
                <h3>Detalhes da Denúncia #${denuncia.id}</h3>
                <button class="modal-close" onclick="fecharModalDetalhes()">
                    <i class="fa fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="detalhe-grupo">
                    <h4>Informações Gerais</h4>
                    <p><strong>Status:</strong> ${statusTexto[denuncia.status]}</p>
                    <p><strong>Motivo:</strong> ${motivoTexto[denuncia.motivo]}</p>
                    <p><strong>Data da denúncia:</strong> ${dataFormatada}</p>
                    <p><strong>Data da análise:</strong> ${dataAnalise}</p>
                    <p><strong>Clube:</strong> ${denuncia.nome_clube}</p>
                </div>
                
                <div class="detalhe-grupo">
                    <h4>Denunciante</h4>
                    <p><strong>Nome:</strong> ${denuncia.nome_denunciante}</p>
                    <p><strong>Email:</strong> ${denuncia.email_denunciante}</p>
                </div>
                
                <div class="detalhe-grupo">
                    <h4>Usuário Denunciado</h4>
                    <p><strong>Nome:</strong> ${denuncia.nome_denunciado}</p>
                    <p><strong>Email:</strong> ${denuncia.email_denunciado}</p>
                    <p><strong>Estado da conta:</strong> ${denuncia.estado_denunciado}</p>
                </div>
                
                <div class="detalhe-grupo">
                    <h4>Comentário Denunciado</h4>
                    <p>"${denuncia.conteudo_atualizacao}"</p>
                    <small>Postado em: ${new Date(denuncia.data_atualizacao).toLocaleDateString('pt-BR')}</small>
                </div>
                
                ${denuncia.descricao ? `
                    <div class="detalhe-grupo">
                        <h4>Descrição da Denúncia</h4>
                        <p>${denuncia.descricao}</p>
                    </div>` : ''}
                
                ${denuncia.observacoes_admin ? `
                    <div class="detalhe-grupo">
                        <h4>Observações do Administrador</h4>
                        <p>${denuncia.observacoes_admin}</p>
                        <small>Analisado por: ${denuncia.nome_admin_analise}</small>
                    </div>` : ''}
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-cancelar" onclick="fecharModalDetalhes()">Fechar</button>
            </div>
        </div>
    `;
    
    // Remover modal existente se houver
    const modalExistente = document.getElementById('modal-detalhes');
    if (modalExistente) {
        modalExistente.remove();
        document.getElementById('overlay-detalhes').remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function fecharModalDetalhes() {
    const modal = document.getElementById('modal-detalhes');
    const overlay = document.getElementById('overlay-detalhes');
    if (modal) modal.remove();
    if (overlay) overlay.remove();
}

async function processarDenuncia(denunciaId, acao) {
    const acaoTexto = {
        'suspender_usuario': 'suspender o usuário e remover do clube',
        'remover_atualizacao': 'remover apenas o comentário',
        'rejeitar': 'rejeitar a denúncia'
    };
    
    const observacoes = prompt(`Observações sobre a decisão de ${acaoTexto[acao]}:`);
    if (observacoes === null) return; // Usuário cancelou
    
    if (!confirm(`Tem certeza que deseja ${acaoTexto[acao]}?`)) return;
    
    try {
        const response = await fetch(`/api/admin/denuncias/${denunciaId}/processar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                acao: acao,
                observacoes: observacoes
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.erro || 'Erro ao processar denúncia');
        }
        
        // Recarregar denúncias
        carregarDenuncias();
        
        // Mostrar mensagem de sucesso
        const mensagem = document.createElement('div');
        mensagem.className = 'mensagem-sucesso';
        mensagem.textContent = 'Denúncia processada com sucesso!';
        document.body.appendChild(mensagem);
        setTimeout(() => {
            if (document.body.contains(mensagem)) {
                document.body.removeChild(mensagem);
            }
        }, 5000);
        
    } catch (error) {
        console.error('Erro ao processar denúncia:', error);
        alert(error.message || 'Erro ao processar denúncia. Tente novamente.');
    }
}
