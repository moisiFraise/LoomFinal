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
            
            // Aguardar um momento para garantir que a sessão foi estabelecida
            setTimeout(() => {
                console.log('Redirecionando para o dashboard...');
                // Forçar reload completo para evitar cache adicionando timestamp
                const timestamp = new Date().getTime();
                window.location.replace(`/dashboard?t=${timestamp}`);
            }, 1500);
            
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
});
