class GiphyManager {
    constructor() {
        this.apiKey = null; // Será carregada do backend
        this.baseUrl = 'https://api.giphy.com/v1/gifs';
        this.selectedGif = null;
        this.currentContext = null; // 'atualizacao' ou 'comentario'
        this.init();
    }

    async init() {
        await this.carregarApiKey();
        this.createGiphyModal();
    }

    async carregarApiKey() {
        try {
            const response = await fetch('/api/config/giphy');
            if (response.ok) {
                const config = await response.json();
                this.apiKey = config.apiKey;
            } else {
                console.error('Erro ao carregar configuração do Giphy');
                this.apiKey = null;
            }
        } catch (error) {
            console.error('Erro ao carregar API key do Giphy:', error);
            this.apiKey = null;
        }
    }

    createGiphyModal() {
        const modalHTML = `
            <div id="overlay-giphy" class="overlay-giphy" onclick="giphyManager.fecharModal()"></div>
            <div id="modal-giphy" class="modal-giphy">
                <div class="modal-header-giphy">
                <h3>Escolher GIF</h3>
                <button class="modal-close-giphy" onclick="giphyManager && giphyManager.fecharModal()">
                <i class="fa fa-times"></i>
                </button>
                </div>
                <div class="modal-body-giphy">
                    <div class="giphy-search">
                        <input type="text" id="giphy-search-input" placeholder="Pesquisar GIFs..." maxlength="50">
                        <button id="giphy-search-btn" onclick="giphyManager && giphyManager.pesquisarGifs()">
                            <i class="fa fa-search"></i>
                        </button>
                    </div>
                    <div class="giphy-trending">
                        <h4>GIFs em alta</h4>
                        <div id="giphy-results" class="giphy-grid">
                            <div class="loading-giphy">Carregando GIFs...</div>
                        </div>
                    </div>
                    <div class="selected-gif-preview" id="selected-gif-preview" style="display: none;">
                        <h4>GIF selecionado:</h4>
                        <div class="selected-gif-container">
                            <img id="selected-gif-img" src="" alt="GIF selecionado">
                        </div>
                    </div>
                </div>
                <div class="modal-footer-giphy">
                    <button class="btn-cancelar-giphy" onclick="giphyManager && giphyManager.fecharModal()">Cancelar</button>
                    <button class="btn-remover-gif" onclick="giphyManager && giphyManager.removerGif()" style="display: none;">Remover GIF</button>
                    <button class="btn-confirmar-giphy" onclick="giphyManager && giphyManager.confirmarSelecao()" disabled>Usar GIF</button>
                </div>
            </div>
        `;
        
        // Remove modal existente se houver
        const existingModal = document.getElementById('modal-giphy');
        if (existingModal) {
            existingModal.remove();
        }
        const existingOverlay = document.getElementById('overlay-giphy');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Adicionar event listeners
        document.getElementById('giphy-search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.pesquisarGifs();
            }
        });
    }

    async abrirModal(context = 'atualizacao', gifAtual = null) {
        // Verificar se a API key foi carregada
        if (!this.apiKey) {
            alert('Serviço de GIFs temporariamente indisponível. Tente novamente mais tarde.');
            return;
        }

        this.currentContext = context;
        this.selectedGif = null;
        
        const overlay = document.getElementById('overlay-giphy');
        const modal = document.getElementById('modal-giphy');
        
        if (overlay && modal) {
            overlay.style.display = 'block';
            modal.style.display = 'block';
            
            // Limpar pesquisa anterior
            document.getElementById('giphy-search-input').value = '';
            document.getElementById('selected-gif-preview').style.display = 'none';
            document.getElementById('giphy-results').innerHTML = '<div class="loading-giphy">Carregando GIFs...</div>';
            
            // Mostrar/esconder botão de remover
            const btnRemover = document.querySelector('.btn-remover-gif');
            if (gifAtual) {
                btnRemover.style.display = 'inline-block';
                // Mostrar GIF atual
                this.mostrarGifAtual(gifAtual);
            } else {
                btnRemover.style.display = 'none';
            }
            
            // Carregar GIFs em alta
            await this.carregarTrending();
            
            // Focar no input de pesquisa
            setTimeout(() => {
                document.getElementById('giphy-search-input').focus();
            }, 300);
        }
    }

    mostrarGifAtual(gifUrl) {
        const preview = document.getElementById('selected-gif-preview');
        const img = document.getElementById('selected-gif-img');
        
        img.src = gifUrl;
        preview.style.display = 'block';
        
        this.selectedGif = { url: gifUrl };
        document.querySelector('.btn-confirmar-giphy').disabled = false;
        document.querySelector('.btn-confirmar-giphy').textContent = 'Manter GIF';
    }

    fecharModal() {
        const overlay = document.getElementById('overlay-giphy');
        const modal = document.getElementById('modal-giphy');
        
        if (overlay && modal) {
            overlay.style.display = 'none';
            modal.style.display = 'none';
        }
        
        this.selectedGif = null;
        this.currentContext = null;
    }

    async carregarTrending() {
        if (!this.apiKey) {
            document.getElementById('giphy-results').innerHTML = '<div class="error-gifs">Configuração do Giphy indisponível</div>';
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/trending?api_key=${this.apiKey}&limit=20&rating=g`);
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                this.renderizarGifs(data.data);
            } else {
                document.getElementById('giphy-results').innerHTML = '<div class="no-gifs">Nenhum GIF encontrado</div>';
            }
        } catch (error) {
            console.error('Erro ao carregar GIFs em alta:', error);
            document.getElementById('giphy-results').innerHTML = '<div class="error-gifs">Erro ao carregar GIFs</div>';
        }
    }

    async pesquisarGifs() {
        if (!this.apiKey) {
            document.getElementById('giphy-results').innerHTML = '<div class="error-gifs">Configuração do Giphy indisponível</div>';
            return;
        }

        const query = document.getElementById('giphy-search-input').value.trim();
        
        if (!query) {
            await this.carregarTrending();
            return;
        }

        document.getElementById('giphy-results').innerHTML = '<div class="loading-giphy">Pesquisando...</div>';
        
        try {
            const response = await fetch(`${this.baseUrl}/search?api_key=${this.apiKey}&q=${encodeURIComponent(query)}&limit=20&rating=g`);
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                this.renderizarGifs(data.data);
            } else {
                document.getElementById('giphy-results').innerHTML = '<div class="no-gifs">Nenhum GIF encontrado para esta pesquisa</div>';
            }
        } catch (error) {
            console.error('Erro ao pesquisar GIFs:', error);
            document.getElementById('giphy-results').innerHTML = '<div class="error-gifs">Erro ao pesquisar GIFs</div>';
        }
    }

    renderizarGifs(gifs) {
        const container = document.getElementById('giphy-results');
        
        const gifsHtml = gifs.map(gif => {
            const previewUrl = gif.images.fixed_width_small.webp || gif.images.fixed_width_small.url;
            const fullUrl = gif.images.fixed_width.webp || gif.images.fixed_width.url;
            
            return `
                <div class="gif-item" onclick="giphyManager.selecionarGif('${fullUrl}', '${gif.title}')">
                    <img src="${previewUrl}" alt="${gif.title}" loading="lazy">
                    <div class="gif-overlay">
                        <i class="fa fa-check"></i>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = gifsHtml;
    }

    selecionarGif(url, title) {
        this.selectedGif = { url, title };
        
        // Mostrar preview
        const preview = document.getElementById('selected-gif-preview');
        const img = document.getElementById('selected-gif-img');
        
        img.src = url;
        img.alt = title;
        preview.style.display = 'block';
        
        // Habilitar botão de confirmar
        const btnConfirmar = document.querySelector('.btn-confirmar-giphy');
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = 'Usar GIF';
        
        // Destacar GIF selecionado
        document.querySelectorAll('.gif-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        event.currentTarget.classList.add('selected');
    }

    removerGif() {
        this.selectedGif = null;
        
        // Esconder preview
        document.getElementById('selected-gif-preview').style.display = 'none';
        
        // Limpar seleção visual
        document.querySelectorAll('.gif-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Configurar botão para remoção
        const btnConfirmar = document.querySelector('.btn-confirmar-giphy');
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = 'Remover GIF';
    }

    confirmarSelecao() {
        if (this.currentContext === 'atualizacao') {
            this.aplicarGifAtualizacao();
        } else if (this.currentContext === 'comentario') {
            this.aplicarGifComentario();
        }
        
        this.fecharModal();
    }

    aplicarGifAtualizacao() {
        // Encontrar o campo hidden para o GIF
        let gifInput = document.getElementById('atualizacao-gif-url');
        if (!gifInput) {
            // Criar campo hidden se não existir
            gifInput = document.createElement('input');
            gifInput.type = 'hidden';
            gifInput.id = 'atualizacao-gif-url';
            gifInput.name = 'gifUrl';
            document.getElementById('form-atualizacao').appendChild(gifInput);
        }
        
        gifInput.value = this.selectedGif ? this.selectedGif.url : '';
        
        // Atualizar preview na interface
        this.atualizarPreviewAtualizacao();
    }

    aplicarGifComentario() {
        // Para comentários, vamos armazenar em uma variável global temporária
        window.selectedCommentGif = this.selectedGif;
        
        // Atualizar preview na interface de comentário
        this.atualizarPreviewComentario();
    }

    atualizarPreviewAtualizacao() {
        let preview = document.getElementById('gif-preview-atualizacao');
        
        if (!preview) {
            // Criar preview se não existir
            const previewHtml = `
                <div id="gif-preview-atualizacao" class="gif-preview">
                    <div class="gif-preview-header">
                        <span>GIF selecionado:</span>
                        <button type="button" onclick="giphyManager && giphyManager.removerGifPreview('atualizacao')" class="btn-remover-preview">
                            <i class="fa fa-times"></i>
                        </button>
                    </div>
                    <img id="gif-preview-img-atualizacao" src="" alt="GIF selecionado">
                </div>
            `;
            
            // Inserir após o textarea
            const textarea = document.getElementById('atualizacao-comentario');
            textarea.insertAdjacentHTML('afterend', previewHtml);
            preview = document.getElementById('gif-preview-atualizacao');
        }
        
        if (this.selectedGif) {
            document.getElementById('gif-preview-img-atualizacao').src = this.selectedGif.url;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    }

    atualizarPreviewComentario() {
        // Implementar quando integrarmos com os comentários
        console.log('Preview do comentário atualizado:', this.selectedGif);
    }

    removerGifPreview(context) {
        if (context === 'atualizacao') {
            const gifInput = document.getElementById('atualizacao-gif-url');
            if (gifInput) {
                gifInput.value = '';
            }
            
            const preview = document.getElementById('gif-preview-atualizacao');
            if (preview) {
                preview.style.display = 'none';
            }
        }
        
        this.selectedGif = null;
    }
}

// Instância global do gerenciador de GIFs
let giphyManager = null;

// Inicializar o gerenciador quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    giphyManager = new GiphyManager();
});
