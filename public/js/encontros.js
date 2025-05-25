document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash === '#encontros') {
        mudarSecaoClube('encontros');
        carregarEncontros(clubeId);
    }
    const menuItemEncontros = document.querySelector('.menu-item[data-secao="encontros"]');
    if (menuItemEncontros) {
        menuItemEncontros.addEventListener('click', () => {
            carregarEncontros(clubeId);
            verificarPermissoesCriador(clubeId);
        });
    }
    configurarTipoEncontro();
    console.log('Script de encontros carregado');
});
async function carregarEncontros(clubeId) {
    try {
        console.log('Carregando encontros para o clube:', clubeId);
        const encontrosLista = document.getElementById('encontros-lista');
        if (!encontrosLista) {
            console.error('Elemento encontros-lista não encontrado');
            return;
        }
        
        encontrosLista.innerHTML = '<p class="carregando">Carregando encontros...</p>';
        
        const response = await fetch(`/api/clube/${clubeId}/encontros`);
        if (!response.ok) {
            console.error('Resposta da API não ok:', response.status);
            throw new Error('Erro ao carregar encontros');
        }
        
        const data = await response.json();
        console.log('Dados de encontros recebidos:', data);
        
        if (!data.encontros || data.encontros.length === 0) {
            encontrosLista.innerHTML = '<div class="sem-encontros">Nenhum encontro agendado.</div>';
            return;
        }
        
        encontrosLista.innerHTML = '';
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const encontrosFuturos = data.encontros.filter(e => {
            const dataEncontro = new Date(e.data_encontro);
            dataEncontro.setHours(0, 0, 0, 0);
            return dataEncontro >= hoje;
        });
        
        const encontrosPassados = data.encontros.filter(e => {
            const dataEncontro = new Date(e.data_encontro);
            dataEncontro.setHours(0, 0, 0, 0);
            return dataEncontro < hoje;
        });
        
        if (encontrosFuturos.length > 0) {
            const tituloFuturos = document.createElement('h3');
            tituloFuturos.textContent = 'Próximos Encontros';
            tituloFuturos.className = 'encontros-secao-titulo';
            encontrosLista.appendChild(tituloFuturos);
            
            encontrosFuturos.forEach(encontro => {
                encontrosLista.appendChild(criarCardEncontro(encontro, data.isCriador, data.participacoes));
            });
        }
        
        if (encontrosPassados.length > 0) {
            const tituloPassados = document.createElement('h3');
            tituloPassados.textContent = 'Encontros Anteriores';
            tituloPassados.className = 'encontros-secao-titulo';
            encontrosLista.appendChild(tituloPassados);
            
            encontrosPassados.forEach(encontro => {
                encontrosLista.appendChild(criarCardEncontro(encontro, data.isCriador, data.participacoes, true));
            });
        }
    } catch (error) {
        console.error('Erro ao carregar encontros:', error);
        const encontrosLista = document.getElementById('encontros-lista');
        if (encontrosLista) {
            encontrosLista.innerHTML = 
                '<p class="erro-carregamento">Erro ao carregar encontros. Tente novamente mais tarde.</p>';
        }
    }
}
function criarCardEncontro(encontro, isCriador, participacoes, isPassado = false) {
    const dataFormatada = formatarData(encontro.data_encontro);
    const horaInicio = formatarHora(encontro.hora_inicio);
    const horaFim = encontro.hora_fim ? formatarHora(encontro.hora_fim) : null;
    
    const participacaoUsuario = participacoes.find(p => p.id_encontro === encontro.id);
    const statusParticipacao = participacaoUsuario ? participacaoUsuario.status : null;
    
    const card = document.createElement('div');
    card.className = `encontro-card ${isPassado ? 'encontro-passado' : ''}`;
    card.dataset.id = encontro.id;
    
    let botoesParticipacao = '';
    if (!isPassado) {
        botoesParticipacao = `
            <div class="encontro-botoes">
                <button class="botao-participar ${statusParticipacao === 'confirmado' ? 'ativo' : ''}" 
                        onclick="confirmarParticipacao(${encontro.id}, 'confirmado')">
                    <i class="fa fa-check"></i> Participar
                </button>
                <button class="botao-talvez ${statusParticipacao === 'talvez' ? 'ativo' : ''}" 
                        onclick="confirmarParticipacao(${encontro.id}, 'talvez')">
                    <i class="fa fa-question"></i> Talvez
                </button>
                <button class="botao-recusar ${statusParticipacao === 'recusado' ? 'ativo' : ''}" 
                        onclick="confirmarParticipacao(${encontro.id}, 'recusado')">
                    <i class="fa fa-times"></i> Não vou
                </button>
            </div>
        `;
    }
    
    let botoesAdmin = '';
    if (isCriador && !isPassado) {
        botoesAdmin = `
            <div class="encontro-acoes-admin">
                <button class="botao-editar-encontro" onclick="abrirModalEditarEncontro(${encontro.id})">
                    <i class="fa fa-pencil"></i>
                </button>
                <button class="botao-excluir-encontro" onclick="excluirEncontro(${encontro.id})">
                    <i class="fa fa-trash"></i>
                </button>
            </div>
        `;
    }
    
    let detalhesLocal = '';
    if (encontro.tipo === 'presencial' || encontro.tipo === 'hibrido') {
        detalhesLocal = `
            <div class="encontro-detalhe">
                <i class="fa fa-map-marker"></i>
                <span>${encontro.local || 'Local não informado'}</span>
            </div>
        `;
    }
    
    let detalhesLink = '';
    if (encontro.tipo === 'online' || encontro.tipo === 'hibrido') {
        detalhesLink = `
            <div class="encontro-detalhe">
                <i class="fa fa-link"></i>
                <a href="${encontro.link}" target="_blank" class="encontro-link">${encontro.link || 'Link não informado'}</a>
            </div>
        `;
    }
    
    const participantes = Array.isArray(encontro.participantes) ? encontro.participantes : [];
    
    card.innerHTML = `
        <div class="encontro-header">
            <div>
                <h3 class="encontro-titulo">${encontro.titulo}</h3>
                <div class="encontro-data">
                    <i class="fa fa-calendar"></i>
                    <span>${dataFormatada} às ${horaInicio}${horaFim ? ` até ${horaFim}` : ''}</span>
                </div>
                <span class="encontro-tipo tipo-${encontro.tipo}">${traduzirTipoEncontro(encontro.tipo)}</span>
                ${statusParticipacao ? `<span class="encontro-status status-${statusParticipacao}">${traduzirStatusParticipacao(statusParticipacao)}</span>` : ''}
            </div>
            ${botoesAdmin}
        </div>
        
        <div class="encontro-descricao">${encontro.descricao || 'Sem descrição'}</div>
        
        <div class="encontro-detalhes">
            ${detalhesLocal}
            ${detalhesLink}
        </div>
        
        <div class="encontro-acoes">
            <div class="encontro-participantes">
                <div class="encontro-participantes-avatars">
                    ${gerarAvatarsParticipantes(participantes)}
                </div>
                <span class="participante-count">${participantes.length} participantes</span>
            </div>
            ${botoesParticipacao}
        </div>
    `;
    
    return card;
}

function gerarAvatarsParticipantes(participantes) {
    if (!Array.isArray(participantes) || participantes.length === 0) {
        return '';
    }
    
    const maxAvatars = 3;
    let html = '';
    
    for (let i = 0; i < Math.min(participantes.length, maxAvatars); i++) {
        if (participantes[i] && participantes[i].nome) {
            const iniciais = participantes[i].nome.split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase();
            html += `<div class="participante-avatar" title="${participantes[i].nome}">${iniciais}</div>`;
        }
    }
    
    if (participantes.length > maxAvatars) {
        html += `<div class="participante-avatar" title="Mais participantes">+${participantes.length - maxAvatars}</div>`;
    }
    
    return html;
}

function gerarAvatarsParticipantes(participantes) {
    const maxAvatars = 3;
    let html = '';
    
    for (let i = 0; i < Math.min(participantes.length, maxAvatars); i++) {
        const iniciais = participantes[i].nome.split(' ').map(n => n[0]).join('').toUpperCase();
        html += `<div class="participante-avatar">${iniciais}</div>`;
    }
    
    if (participantes.length > maxAvatars) {
        html += `<div class="participante-avatar">+${participantes.length - maxAvatars}</div>`;
    }
    
    return html;
}

function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

function formatarHora(horaString) {
    return horaString.substring(0, 5);
}

function traduzirTipoEncontro(tipo) {
    const tipos = {
        'presencial': 'Presencial',
        'online': 'Online',
        'hibrido': 'Híbrido'
    };
    return tipos[tipo] || tipo;
}

function traduzirStatusParticipacao(status) {
    const statusMap = {
        'confirmado': 'Confirmado',
        'talvez': 'Talvez',
        'recusado': 'Não vou'
    };
    return statusMap[status] || status;
}

function abrirModalCriarEncontro() {
    const modal = document.getElementById('modal-encontro');
    const overlay = document.getElementById('overlay');
    
    document.getElementById('form-encontro').reset();
    document.getElementById('encontro-id').value = '';
    document.getElementById('modal-titulo-encontro').textContent = 'Agendar Novo Encontro';
    
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('data-encontro').setAttribute('min', hoje);
    document.getElementById('data-encontro').value = hoje;
    
    modal.style.display = 'block';
    overlay.style.display = 'block';
    
    atualizarCamposTipoEncontro();
}

function fecharModalEncontro() {
    document.getElementById('modal-encontro').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function configurarTipoEncontro() {
    const radioTipos = document.querySelectorAll('input[name="tipo-encontro"]');
    radioTipos.forEach(radio => {
        radio.addEventListener('change', atualizarCamposTipoEncontro);
    });
}
function atualizarCamposTipoEncontro() {
    const tipoSelecionado = document.querySelector('input[name="tipo-encontro"]:checked')?.value || 'online';
    const camposLocal = document.querySelector('.campos-local');
    const camposLink = document.querySelector('.campos-link');
    
    camposLocal.classList.remove('ativo');
    camposLink.classList.remove('ativo');
    
    if (tipoSelecionado === 'presencial' || tipoSelecionado === 'hibrido') {
        camposLocal.classList.add('ativo');
    }
    
    if (tipoSelecionado === 'online' || tipoSelecionado === 'hibrido') {
        camposLink.classList.add('ativo');
    }
}
async function salvarEncontro(event) {
    event.preventDefault();
    
    try {
        console.log('Iniciando salvamento de encontro...');
        const form = document.getElementById('form-encontro');
        const encontroId = document.getElementById('encontro-id').value;
        const isEdicao = !!encontroId;
        
        console.log('Modo:', isEdicao ? 'Edição' : 'Criação', 'ID:', encontroId);
        
        const titulo = document.getElementById('titulo-encontro').value.trim();
        const descricao = document.getElementById('descricao-encontro').value.trim();
        const dataEncontro = document.getElementById('data-encontro').value;
        const horaInicio = document.getElementById('hora-inicio').value;
        const horaFim = document.getElementById('hora-fim').value;
        const tipoEncontro = document.querySelector('input[name="tipo-encontro"]:checked')?.value;
        const local = document.getElementById('local-encontro').value.trim();
        const link = document.getElementById('link-encontro').value.trim();
        
        console.log('Dados coletados do formulário:', {
            titulo, descricao, dataEncontro, horaInicio, horaFim, tipoEncontro, local, link
        });
        
        if (!titulo) {
            console.error('Título não informado');
            alert('Por favor, informe o título do encontro.');
            return;
        }
        
        if (!dataEncontro) {
            console.error('Data não informada');
            alert('Por favor, selecione a data do encontro.');
            return;
        }
        
        if (!horaInicio) {
            console.error('Hora de início não informada');
            alert('Por favor, informe o horário de início.');
            return;
        }
        
        if (!tipoEncontro) {
            console.error('Tipo de encontro não selecionado');
            alert('Por favor, selecione o tipo de encontro.');
            return;
        }
        
        if ((tipoEncontro === 'presencial' || tipoEncontro === 'hibrido') && !local) {
            console.error('Local não informado para encontro presencial/híbrido');
            alert('Por favor, informe o local do encontro.');
            return;
        }
        
        if ((tipoEncontro === 'online' || tipoEncontro === 'hibrido') && !link) {
            console.error('Link não informado para encontro online/híbrido');
            alert('Por favor, informe o link do encontro.');
            return;
        }
        
        if (horaFim && horaFim <= horaInicio) {
            console.error('Hora de término inválida:', horaFim, '<=', horaInicio);
            alert('O horário de término deve ser posterior ao horário de início.');
            return;
        }
        
    const encontroData = {
    titulo: titulo,
    descricao: descricao,
    dataEncontro: dataEncontro,
    horaInicio: horaInicio,
    horaFim: horaFim || null,
    tipo: tipoEncontro,
    local: (tipoEncontro === 'presencial' || tipoEncontro === 'hibrido') ? local : null,
    link: (tipoEncontro === 'online' || tipoEncontro === 'hibrido') ? link : null
};
        
        console.log('Enviando dados do encontro:', encontroData);
        
        const url = isEdicao 
            ? `/api/clube/${clubeId}/encontros/${encontroId}` 
            : `/api/clube/${clubeId}/encontros`;
        
        const method = isEdicao ? 'PUT' : 'POST';
        
        console.log('Enviando requisição para:', url, 'Método:', method);
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(encontroData)
        });
        
        console.log('Status da resposta:', response.status);
        const responseData = await response.json();
        console.log('Dados da resposta:', responseData);
        
        if (!response.ok) {
            console.error('Erro na resposta da API:', responseData);
            throw new Error(responseData.erro || responseData.mensagem || 'Erro ao salvar encontro');
        }
        
        fecharModalEncontro();
        carregarEncontros(clubeId);
        
        alert(isEdicao ? 'Encontro atualizado com sucesso!' : 'Encontro agendado com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar encontro:', error);
        alert(`Erro ao salvar encontro: ${error.message}`);
    }
}

async function abrirModalEditarEncontro(encontroId) {
    try {
        const response = await fetch(`/api/clube/${clubeId}/encontros/${encontroId}`);
        if (!response.ok) throw new Error('Erro ao carregar dados do encontro');
        
        const encontro = await response.json();
        
        document.getElementById('encontro-id').value = encontro.id;
        document.getElementById('titulo-encontro').value = encontro.titulo;
        document.getElementById('descricao-encontro').value = encontro.descricao || '';
        document.getElementById('data-encontro').value = encontro.data_encontro;
        document.getElementById('hora-inicio').value = encontro.hora_inicio.substring(0, 5);
        document.getElementById('hora-fim').value = encontro.hora_fim ? encontro.hora_fim.substring(0, 5) : '';
        
        document.querySelector(`input[name="tipo-encontro"][value="${encontro.tipo}"]`).checked = true;
        
        if (encontro.local) {
            document.getElementById('local-encontro').value = encontro.local;
        }
        
        if (encontro.link) {
            document.getElementById('link-encontro').value = encontro.link;
        }
        
        atualizarCamposTipoEncontro();
        
        document.getElementById('modal-titulo-encontro').textContent = 'Editar Encontro';
        
        document.getElementById('modal-encontro').style.display = 'block';
        document.getElementById('overlay').style.display = 'block';
    } catch (error) {
        console.error('Erro:', error);
        alert(`Erro ao carregar dados do encontro: ${error.message}`);
    }
}

async function excluirEncontro(encontroId) {
    if (!confirm('Tem certeza que deseja excluir este encontro?')) return;
    
    try {
        const response = await fetch(`/api/clube/${clubeId}/encontros/${encontroId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.erro || 'Erro ao excluir encontro');
        }
        
        carregarEncontros(clubeId);
        alert('Encontro excluído com sucesso!');
    } catch (error) {
        console.error('Erro:', error);
        alert(`Erro ao excluir encontro: ${error.message}`);
    }
}
async function confirmarParticipacao(encontroId, status) {
    try {
        const response = await fetch(`/api/clube/${clubeId}/encontros/${encontroId}/participacao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.erro || 'Erro ao confirmar participação');
        }
        
        await carregarEncontros(clubeId);
    } catch (error) {
        console.error('Erro:', error);
        alert(`Erro ao confirmar participação: ${error.message}`);
    }
}

async function verParticipantes(encontroId) {
    try {
        const response = await fetch(`/api/clube/${clubeId}/encontros/${encontroId}/participantes`);
        if (!response.ok) throw new Error('Erro ao carregar participantes');
        
        const participantes = await response.json();
        
        console.log('Participantes:', participantes);
    } catch (error) {
        console.error('Erro:', error);
        alert(`Erro ao carregar participantes: ${error.message}`);
    }
}
