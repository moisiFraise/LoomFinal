document.addEventListener('DOMContentLoaded', () => {
    const botoesAba = document.querySelectorAll('.botao-aba');
    const conteudosAba = document.querySelectorAll('.conteudo-aba');
    
    const urlParams = new URLSearchParams(window.location.search);
    const abaParam = urlParams.get('aba');
    
    if (abaParam === 'registro') {
        document.querySelector('.botao-aba[data-aba="registro"]').click();
    }
    
    botoesAba.forEach(botao => {
        botao.addEventListener('click', () => {
            botoesAba.forEach(b => b.classList.remove('ativo'));
            conteudosAba.forEach(c => c.classList.remove('ativo'));
            
            botao.classList.add('ativo');
            
            const idAba = botao.getAttribute('data-aba');
            document.getElementById(idAba).classList.add('ativo');
            
            const url = new URL(window.location);
            url.searchParams.set('aba', idAba);
            window.history.pushState({}, '', url);
        });
    });
    
    function mostrarMensagem(formulario, tipo, mensagem) {
        const mensagemAnterior = formulario.querySelector('.mensagem');
        if (mensagemAnterior) {
            mensagemAnterior.remove();
        }
        
        const divMensagem = document.createElement('div');
        divMensagem.className = `mensagem mensagem-${tipo}`;
        divMensagem.textContent = mensagem;
        
        const botao = formulario.querySelector('button[type="submit"]');
        formulario.insertBefore(divMensagem, botao);
        
        if (tipo === 'sucesso') {
            setTimeout(() => {
                divMensagem.remove();
            }, 5000);
        }
    }
   const formularioLogin = document.getElementById('formulario-login');
if (formularioLogin) {
    formularioLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const senha = document.getElementById('login-senha').value;
        
        const botaoSubmit = formularioLogin.querySelector('button[type="submit"]');
        botaoSubmit.disabled = true;
        botaoSubmit.textContent = 'Entrando...';
        
        try {
            console.log('Enviando requisição de login...');
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, senha }),
                credentials: 'same-origin'
            });
            
            console.log('Resposta recebida:', response.status);
            const data = await response.json();
            console.log('Dados da resposta:', data);
            
            if (!response.ok) {
                mostrarMensagem(formularioLogin, 'erro', data.erro);
                botaoSubmit.disabled = false;
                botaoSubmit.textContent = 'Entrar';
                return;
            }
            
            mostrarMensagem(formularioLogin, 'sucesso', 'Login realizado com sucesso! Redirecionando...');
            
            // Limpeza total antes de redirecionar
            localStorage.clear();
            sessionStorage.clear();
            
            // Redirecionamento imediato com cache bust
            setTimeout(() => {
                window.location.href = '/dashboard?cb=' + Date.now() + '&r=' + Math.random();
            }, 1000);
            
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            mostrarMensagem(formularioLogin, 'erro', 'Erro ao conectar com o servidor. Tente novamente.');
            botaoSubmit.disabled = false;
            botaoSubmit.textContent = 'Entrar';
        }
    });
}

    const formularioRegistro = document.getElementById('formulario-registro');
    if (formularioRegistro) {
        formularioRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nome = document.getElementById('registro-nome').value;
            const email = document.getElementById('registro-email').value;
            const senha = document.getElementById('registro-senha').value;
            const confirmarSenha = document.getElementById('registro-confirmar-senha').value;
            
            const botaoSubmit = formularioRegistro.querySelector('button[type="submit"]');
            botaoSubmit.disabled = true;
            botaoSubmit.textContent = 'Cadastrando...';
            
            if (senha !== confirmarSenha) {
                mostrarMensagem(formularioRegistro, 'erro', 'As senhas não coincidem.');
                botaoSubmit.disabled = false;
                botaoSubmit.textContent = 'Cadastrar';
                return;
            }
            
            if (senha.length < 6) {
                mostrarMensagem(formularioRegistro, 'erro', 'A senha deve ter pelo menos 6 caracteres.');
                botaoSubmit.disabled = false;
                botaoSubmit.textContent = 'Cadastrar';
                return;
            }
            
            try {
                const response = await fetch('/api/cadastro', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nome, email, senha })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    mostrarMensagem(formularioRegistro, 'erro', data.erro);
                    botaoSubmit.disabled = false;
                    botaoSubmit.textContent = 'Cadastrar';
                    return;
                }
                
                mostrarMensagem(formularioRegistro, 'sucesso', data.mensagem);
                
                formularioRegistro.reset();
                botaoSubmit.disabled = false;
                botaoSubmit.textContent = 'Cadastrar';
                
                setTimeout(() => {
                    document.querySelector('.botao-aba[data-aba="login"]').click();
                }, 2000);
                
            } catch (error) {
                console.error('Erro ao fazer cadastro:', error);
                mostrarMensagem(formularioRegistro, 'erro', 'Erro ao conectar com o servidor. Tente novamente.');
                botaoSubmit.disabled = false;
                botaoSubmit.textContent = 'Cadastrar';
            }
        });
    }
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('input-ativo');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('input-ativo');
            }
        });
    });

    // Funcionalidade "Esqueci minha senha"
    const linkEsqueciSenha = document.getElementById('link-esqueci-senha');
    const modalEsqueciSenha = document.getElementById('modal-esqueci-senha');
    const fecharModal = document.getElementById('fechar-modal');
    const cancelarRecuperacao = document.getElementById('cancelar-recuperacao');
    const formularioEsqueciSenha = document.getElementById('formulario-esqueci-senha');

    // Abrir modal
    if (linkEsqueciSenha) {
        linkEsqueciSenha.addEventListener('click', (e) => {
            e.preventDefault();
            modalEsqueciSenha.style.display = 'flex';
            document.getElementById('email-recuperacao').focus();
        });
    }

    // Fechar modal
    function fecharModalEsqueciSenha() {
        modalEsqueciSenha.style.display = 'none';
        formularioEsqueciSenha.reset();
        // Limpar mensagens
        const mensagemAnterior = formularioEsqueciSenha.querySelector('.mensagem');
        if (mensagemAnterior) {
            mensagemAnterior.remove();
        }
    }

    if (fecharModal) {
        fecharModal.addEventListener('click', fecharModalEsqueciSenha);
    }

    if (cancelarRecuperacao) {
        cancelarRecuperacao.addEventListener('click', fecharModalEsqueciSenha);
    }

    // Fechar modal ao clicar no overlay
    modalEsqueciSenha.addEventListener('click', (e) => {
        if (e.target === modalEsqueciSenha) {
            fecharModalEsqueciSenha();
        }
    });

    // Enviar solicitação de recuperação
    if (formularioEsqueciSenha) {
        formularioEsqueciSenha.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email-recuperacao').value;
            const botaoEnviar = document.getElementById('enviar-recuperacao');
            const loadingText = botaoEnviar.querySelector('.loading-text');
            const normalText = botaoEnviar.querySelector('.normal-text');
            
            // Validação básica
            if (!email || !email.includes('@')) {
                mostrarMensagemModal(formularioEsqueciSenha, 'erro', 'Por favor, digite um email válido.');
                return;
            }

            // Mostrar loading
            botaoEnviar.disabled = true;
            loadingText.style.display = 'inline';
            normalText.style.display = 'none';

            try {
                const response = await fetch('/api/esqueci-senha', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok) {
                    mostrarMensagemModal(formularioEsqueciSenha, 'sucesso', data.mensagem);
                    
                    // Fechar modal após 3 segundos
                    setTimeout(() => {
                        fecharModalEsqueciSenha();
                        mostrarToast('Verifique sua caixa de email (e pasta de spam) para as instruções de reset.', 'sucesso');
                    }, 3000);
                } else {
                    mostrarMensagemModal(formularioEsqueciSenha, 'erro', data.erro || 'Erro ao enviar email');
                }

            } catch (error) {
                console.error('Erro ao solicitar reset de senha:', error);
                mostrarMensagemModal(formularioEsqueciSenha, 'erro', 'Erro de conexão. Tente novamente.');
            } finally {
                // Esconder loading
                botaoEnviar.disabled = false;
                loadingText.style.display = 'none';
                normalText.style.display = 'inline';
            }
        });
    }

    // Função para mostrar mensagem no modal
    function mostrarMensagemModal(formulario, tipo, mensagem) {
        const mensagemAnterior = formulario.querySelector('.mensagem');
        if (mensagemAnterior) {
            mensagemAnterior.remove();
        }
        
        const divMensagem = document.createElement('div');
        divMensagem.className = `mensagem mensagem-${tipo}`;
        divMensagem.textContent = mensagem;
        
        const emailInput = formulario.querySelector('#email-recuperacao');
        formulario.insertBefore(divMensagem, emailInput.parentElement);
        
        if (tipo === 'sucesso') {
            setTimeout(() => {
                if (divMensagem.parentElement) {
                    divMensagem.remove();
                }
            }, 5000);
        }
    }

    // Função para mostrar toast notification
    function mostrarToast(mensagem, tipo) {
        const container = document.getElementById('mensagem-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `mensagem-toast ${tipo}`;
        toast.textContent = mensagem;

        container.appendChild(toast);

        // Auto remover após 5 segundos
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideOutToast 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    // Verificar parâmetros da URL para mostrar mensagens
    const erro = urlParams.get('erro');
    const sucesso = urlParams.get('sucesso');

    if (erro === 'token_invalido') {
        mostrarToast('Link de recuperação inválido ou expirado. Solicite um novo.', 'erro');
    }

    if (sucesso === 'senha_redefinida') {
        mostrarToast('Senha redefinida com sucesso! Você já pode fazer login.', 'sucesso');
    }
});
