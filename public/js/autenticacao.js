document.addEventListener('DOMContentLoaded', () => {
    const botoesAba = document.querySelectorAll('.botao-aba');
    const conteudosAba = document.querySelectorAll('.conteudo-aba');
    
    botoesAba.forEach(botao => {
        botao.addEventListener('click', () => {
            botoesAba.forEach(b => b.classList.remove('ativo'));
            conteudosAba.forEach(c => c.classList.remove('ativo'));
            
            botao.classList.add('ativo');
            
            const idAba = botao.getAttribute('data-aba');
            document.getElementById(idAba).classList.add('ativo');
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
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, senha })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    mostrarMensagem(formularioLogin, 'erro', data.erro);
                    return;
                }
                
                mostrarMensagem(formularioLogin, 'sucesso', data.mensagem);
                
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
                
            } catch (error) {
                console.error('Erro ao fazer login:', error);
                mostrarMensagem(formularioLogin, 'erro', 'Erro ao conectar com o servidor. Tente novamente.');
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
            
            if (senha !== confirmarSenha) {
                mostrarMensagem(formularioRegistro, 'erro', 'As senhas não coincidem.');
                return;
            }
            
            if (senha.length < 6) {
                mostrarMensagem(formularioRegistro, 'erro', 'A senha deve ter pelo menos 6 caracteres.');
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
                    return;
                }
                
                mostrarMensagem(formularioRegistro, 'sucesso', data.mensagem);
                
                formularioRegistro.reset();
                
                setTimeout(() => {
                    document.querySelector('.botao-aba[data-aba="login"]').click();
                }, 2000);
                
            } catch (error) {
                console.error('Erro ao fazer cadastro:', error);
                mostrarMensagem(formularioRegistro, 'erro', 'Erro ao conectar com o servidor. Tente novamente.');
            }
        });
    }
});
