let chatInterval = null;

function inicializarChat() {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    if (!messagesContainer || !messageInput || !sendButton) {
        console.error('Elementos do chat não encontrados');
        return;
    }

    carregarMensagens();

    sendButton.addEventListener('click', enviarMensagem);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            enviarMensagem();
        }
    });

    if (chatInterval) {
        clearInterval(chatInterval);
    }
    chatInterval = setInterval(carregarMensagens, 5000);
}

async function carregarMensagens() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    try {
        const response = await fetch(`/api/chat/${clubeId}/mensagens?limite=100`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar mensagens');
        }

        const mensagens = await response.json();
        exibirMensagens(mensagens);
    } catch (error) {
        console.error('Erro:', error);
        messagesContainer.innerHTML = '<div class="loading">Erro ao carregar mensagens</div>';
    }
}

function exibirMensagens(mensagens) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    if (mensagens.length === 0) {
        messagesContainer.innerHTML = '<div class="loading">Nenhuma mensagem ainda. Seja o primeiro a enviar!</div>';
        return;
    }

    messagesContainer.innerHTML = mensagens.map(msg => {
        const isOwn = msg.id_usuario === parseInt(userId);
        const isDeleted = msg.excluida;
        
        return `
            <div class="message ${isOwn ? 'own' : ''} ${isDeleted ? 'deleted' : ''}" data-msg-id="${msg.id}">
                <img 
                    src="${msg.foto_usuario || '/images/default-avatar.png'}" 
                    alt="${msg.nome_usuario}" 
                    class="message-avatar"
                >
                <div class="message-content">
                    <div class="message-author">${escapeHtml(msg.nome_usuario)}</div>
                    <div class="message-text">
                        ${isDeleted ? '<i class="fa fa-ban"></i> Mensagem excluída' : escapeHtml(msg.mensagem)}
                    </div>
                    <div class="message-footer">
                        <span class="message-time">
                            ${formatarDataChat(msg.data_envio)}
                            ${msg.editada && !isDeleted ? '<span class="message-edited">(editada)</span>' : ''}
                        </span>
                        ${isOwn && !isDeleted ? `
                            <button class="btn-delete-msg" onclick="excluirMensagemChat(${msg.id})" title="Excluir mensagem">
                                <i class="fa fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    scrollToBottom();
}

async function enviarMensagem() {
    const messageInput = document.getElementById('messageInput');
    const mensagem = messageInput.value.trim();

    if (!mensagem) return;

    try {
        const response = await fetch(`/api/chat/${clubeId}/mensagens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mensagem })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.erro || 'Erro ao enviar mensagem');
        }

        messageInput.value = '';
        await carregarMensagens();
    } catch (error) {
        console.error('Erro:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: error.message || 'Erro ao enviar mensagem. Tente novamente.'
        });
    }
}

function formatarDataChat(dataString) {
    const data = new Date(dataString);
    const agora = new Date();
    const diff = agora - data;

    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Agora';
    if (minutos < 60) return `${minutos}min`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;

    return data.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

async function excluirMensagemChat(idMensagem) {
    const confirmacao = await Swal.fire({
        title: 'Excluir mensagem?',
        text: 'A mensagem será marcada como excluída',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c5ce7',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacao.isConfirmed) return;

    try {
        const response = await fetch(`/api/chat/mensagens/${idMensagem}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.erro || 'Erro ao excluir mensagem');
        }

        await carregarMensagens();
        
        Swal.fire({
            icon: 'success',
            title: 'Mensagem excluída',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
    } catch (error) {
        console.error('Erro:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: error.message || 'Erro ao excluir mensagem'
        });
    }
}

function pararAtualizacaoChat() {
    if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
    }
}
