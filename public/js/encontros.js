let encontrosCarregados = false;

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('[data-secao="encontros"]')) {
            setTimeout(() => {
                carregarEncontros();
                verificarPermissoesCriador();
            }, 100); 
        }
    });
});
async function carregarEncontros() {
    console.log('Carregando encontros para o clube:', clubeId);
    
    const container = document.getElementById('encontros-lista');
    if (!container) {
        console.error('Elemento encontros-lista não encontrado');
        return;
    }
    
    if (encontrosCarregados) return;
    
    try {
        const response = await fetch(`/api/clube/${clubeId}/encontros`);
        const data = await response.json();
        
        if (response.ok) {
            exibirEncontros(data.encontros, data.isCriador, data.participacoes);
            encontrosCarregados = true;
        } else {
            console.error('Erro ao carregar encontros:', data.erro);
            container.innerHTML = `
                <div class="erro-encontros">
                    <i class="fa fa-exclamation-triangle"></i>
                    <p>${data.erro}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar encontros:', error);
        container.innerHTML = `
            <div class="erro-encontros">
                <i class="fa fa-exclamation-triangle"></i>
                <p>Erro ao conectar com o servidor</p>
            </div>
        `;
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
function exibirEncontros(encontros, isCriador, participacoes) {
    const container = document.getElementById('encontros-lista');
    if (!container) {
        console.error('Container encontros-lista não encontrado');
        return;
    }
    
    if (!encontros || encontros.length === 0) {
        container.innerHTML = `
            <div class="sem-encontros">
                <i class="fa fa-calendar"></i>
                <h4>Nenhum encontro agendado</h4>
                <p>Quando houver encontros marcados, eles aparecerão aqui.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = encontros.map(encontro => {
        const dataEncontro = new Date(encontro.data_encontro);
        const hoje = new Date();
        const isPassado = dataEncontro < hoje;
        
        const participacao = participacoes.find(p => p.id_encontro === encontro.id);
        const statusParticipacao = participacao ? participacao.status : null;
        
        return `
            <div class="encontro-card ${isPassado ? 'encontro-passado' : ''}">
                <div class="encontro-header">
                    <div class="encontro-info">
                        <h4>${escapeHtml(encontro.titulo)}</h4>
                        <div class="encontro-meta">
                            <span class="encontro-data">
                                <i class="fa fa-calendar"></i>
                                ${formatarDataEncontro(encontro.data_encontro)}
                            </span>
                            <span class="encontro-hora">
                                <i class="fa fa-clock-o"></i>
                                ${encontro.hora_inicio}${encontro.hora_fim ? ` - ${encontro.hora_fim}` : ''}
                            </span>
                            <span class="encontro-tipo tipo-${encontro.tipo}">
                                <i class="fa fa-${getTipoIcon(encontro.tipo)}"></i>
                                ${encontro.tipo.charAt(0).toUpperCase() + encontro.tipo.slice(1)}
                            </span>
                        </div>
                    </div>
                    
                    ${isCriador && !isPassado ? `
                        <div class="encontro-acoes">
                            <button class="botao-pequeno botao-editar" onclick="editarEncontro(${encontro.id})">
                                <i class="fa fa-edit"></i>
                            </button>
                            <button class="botao-pequeno botao-excluir" onclick="excluirEncontro(${encontro.id})">
                                <i class="fa fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                ${encontro.descricao ? `
                    <div class="encontro-descricao">
                        ${escapeHtml(encontro.descricao)}
                    </div>
                ` : ''}
                
                <div class="encontro-detalhes">
                    ${encontro.local ? `
                        <div class="encontro-local">
                            <i class="fa fa-map-marker"></i>
                            ${escapeHtml(encontro.local)}
                        </div>
                    ` : ''}
                    
                    ${encontro.link ? `
                        <div class="encontro-link">
                            <i class="fa fa-link"></i>
                            <a href="${encontro.link}" target="_blank" rel="noopener noreferrer">
                                Acessar encontro online
                            </a>
                        </div>
                    ` : ''}
                </div>
                
                <div class="encontro-participantes">
                    <div class="participantes-info">
                        <i class="fa fa-users"></i>
                        <span>${encontro.participantes ? encontro.participantes.length : 0} participante(s)</span>
                    </div>
                    
                    ${!isPassado ? `
                        <div class="participacao-acoes">
                            <button class="botao-participacao ${statusParticipacao === 'confirmado' ? 'ativo' : ''}" 
                                    onclick="confirmarParticipacao(${encontro.id}, 'confirmado')">
                                <i class="fa fa-check"></i> Vou participar
                            </button>
                            <button class="botao-participacao ${statusParticipacao === 'talvez' ? 'ativo' : ''}" 
                                    onclick="confirmarParticipacao(${encontro.id}, 'talvez')">
                                <i class="fa fa-question"></i> Talvez
                            </button>
                            <button class="botao-participacao ${statusParticipacao === 'recusado' ? 'ativo' : ''}" 
                                    onclick="confirmarParticipacao(${encontro.id}, 'recusado')">
                                <i class="fa fa-times"></i> Não vou
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}
function abrirModalCriarEncontro() {
    const modal = document.getElementById('modal-encontro');
    const overlay = document.getElementById('overlay');
    
    if (!modal || !overlay) {
        console.error('Modal ou overlay de encontro não encontrado');
        return;
    }
    
    document.getElementById('form-encontro').reset();
    document.getElementById('encontro-id').value = '';
    document.getElementById('modal-titulo-encontro').textContent = 'Agendar Novo Encontro';
    
    configurarCamposEncontro();
    
    modal.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}
function fecharModalEncontro() {
    const modal = document.getElementById('modal-encontro');
    const overlay = document.getElementById('overlay');
    
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
}

function configurarCamposEncontro() {
    const tipoRadios = document.querySelectorAll('input[name="tipo-encontro"]');
    const camposLocal = document.querySelector('.campos-local');
    const camposLink = document.querySelector('.campos-link');
    
    if (!camposLocal || !camposLink) return;
    
    tipoRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const tipo = this.value;
            
            switch(tipo) {
                case 'presencial':
                    camposLocal.style.display = 'block';
                    camposLink.style.display = 'none';
                    document.getElementById('local-encontro').required = true;
                    document.getElementById('link-encontro').required = false;
                    break;
                case 'online':
                    camposLocal.style.display = 'none';
                    camposLink.style.display = 'block';
                    document.getElementById('local-encontro').required = false;
                    document.getElementById('link-encontro').required = true;
                    break;
                case 'hibrido':
                    camposLocal.style.display = 'block';
                    camposLink.style.display = 'block';
                    document.getElementById('local-encontro').required = true;
                    document.getElementById('link-encontro').required = true;
                    break;
            }
        });
    });
    
    const radioSelecionado = document.querySelector('input[name="tipo-encontro"]:checked');
    if (radioSelecionado) {
        radioSelecionado.dispatchEvent(new Event('change'));
    }
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
    
    const encontroId = document.getElementById('encontro-id').value;
    const titulo = document.getElementById('titulo-encontro').value.trim();
    const descricao = document.getElementById('descricao-encontro').value.trim();
    const dataEncontro = document.getElementById('data-encontro').value;
    const horaInicio = document.getElementById('hora-inicio').value;
    const horaFim = document.getElementById('hora-fim').value;
    const local = document.getElementById('local-encontro').value.trim();
    const link = document.getElementById('link-encontro').value.trim();
    const tipo = document.querySelector('input[name="tipo-encontro"]:checked').value;
    
    if (!titulo || !dataEncontro || !horaInicio || !tipo) {
        mostrarAlerta('Por favor, preencha todos os campos obrigatórios', 'erro');
        return;
    }
    
    try {
        const url = encontroId ? 
            `/api/clube/${clubeId}/encontros/${encontroId}` : 
            `/api/clube/${clubeId}/encontros`;
        
        const method = encontroId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                titulo,
                descricao: descricao || null,
                dataEncontro,
                horaInicio,
                horaFim: horaFim || null,
                local: local || null,
                link: link || null,
                tipo
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta(encontroId ? 'Encontro atualizado com sucesso!' : 'Encontro agendado com sucesso!', 'sucesso');
            fecharModalEncontro();
            encontrosCarregados = false;
            carregarEncontros();
        } else {
            mostrarAlerta(data.erro || 'Erro ao salvar encontro', 'erro');
        }
    } catch (error) {
        console.error('Erro ao salvar encontro:', error);
        mostrarAlerta('Erro ao conectar com o servidor', 'erro');
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
async function editarEncontro(encontroId) {
    try {
        const response = await fetch(`/api/clube/${clubeId}/encontros/${encontroId}`);
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('encontro-id').value = encontroId;
            document.getElementById('titulo-encontro').value = data.titulo;
            document.getElementById('descricao-encontro').value = data.descricao || '';
            document.getElementById('data-encontro').value = data.data_encontro.split('T')[0];
            document.getElementById('hora-inicio').value = data.hora_inicio;
            document.getElementById('hora-fim').value = data.hora_fim || '';
            document.getElementById('local-encontro').value = data.local || '';
            document.getElementById('link-encontro').value = data.link || '';
            
            const tipoRadio = document.querySelector(`input[name="tipo-encontro"][value="${data.tipo}"]`);
            if (tipoRadio) {
                tipoRadio.checked = true;
                tipoRadio.dispatchEvent(new Event('change'));
            }
            
            document.getElementById('modal-titulo-encontro').textContent = 'Editar Encontro';
            
            const modal = document.getElementById('modal-encontro');
            const overlay = document.getElementById('overlay');
            
            if (modal && overlay) {
                modal.style.display = 'block';
                overlay.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        } else {
            mostrarAlerta(data.erro || 'Erro ao carregar dados do encontro', 'erro');
        }
    } catch (error) {
        console.error('Erro ao editar encontro:', error);
        mostrarAlerta('Erro ao conectar com o servidor', 'erro');
    }
}
async function excluirEncontro(encontroId) {
    if (!confirm('Tem certeza que deseja excluir este encontro?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/clube/${clubeId}/encontros/${encontroId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('Encontro excluído com sucesso!', 'sucesso');
            encontrosCarregados = false;
            carregarEncontros();
        } else {
            mostrarAlerta(data.erro || 'Erro ao excluir encontro', 'erro');
        }
    } catch (error) {
        console.error('Erro ao excluir encontro:', error);
        mostrarAlerta('Erro ao conectar com o servidor', 'erro');
    }
}
async function confirmarParticipacao(encontroId, status) {
    try {
        const response = await fetch(`/api/clube/${clubeId}/encontros/${encontroId}/participacao`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('Participação atualizada com sucesso!', 'sucesso');
            encontrosCarregados = false;
            carregarEncontros();
        } else {
            mostrarAlerta(data.erro || 'Erro ao confirmar participação', 'erro');
        }
    }catch (error) {
        console.error('Erro ao confirmar participação:', error);
        mostrarAlerta('Erro ao conectar com o servidor', 'erro');
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
function formatarDataEncontro(dataString) {
    const data = new Date(dataString);
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);
    
    const dataEncontro = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    const hojeNormalizado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const amanhaNormalizado = new Date(amanha.getFullYear(), amanha.getMonth(), amanha.getDate());
    
    if (dataEncontro.getTime() === hojeNormalizado.getTime()) {
        return 'Hoje';
    } else if (dataEncontro.getTime() === amanhaNormalizado.getTime()) {
        return 'Amanhã';
    } else {
        return data.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

function getTipoIcon(tipo) {
    switch(tipo) {
        case 'online':
            return 'video-camera';
        case 'presencial':
            return 'map-marker';
        case 'hibrido':
            return 'globe';
        default:
            return 'calendar';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        if (e.target.id === 'overlay') {
            fecharModalEncontro();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fecharModalEncontro();
        }
    });
});