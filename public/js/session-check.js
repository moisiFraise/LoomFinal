// Verificação periódica de sessão para detectar suspensão
(function() {
    // Verificar a cada 30 segundos se o usuário ainda está ativo
    setInterval(async () => {
        try {
            const response = await fetch('/api/usuario/tipo', {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            // Se usuário foi suspenso
            if (!response.ok && data.suspenso) {
                // Mostrar mensagem
                Swal.fire({
                    icon: 'warning',
                    title: 'Conta Suspensa',
                    text: 'Sua conta foi suspensa por um administrador. Você será desconectado.',
                    allowOutsideClick: false,
                    confirmButtonText: 'OK'
                }).then(() => {
                    // Redirecionar para página de autenticação
                    window.location.href = '/autenticacao';
                });
            } else if (!response.ok && response.status === 401) {
                // Sessão expirada
                window.location.href = '/autenticacao';
            }
        } catch (error) {
            console.error('Erro ao verificar sessão:', error);
        }
    }, 30000); // 30 segundos

    // Interceptar erros 401 em todas as requisições
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch(...args);
        
        if (!response.ok && response.status === 401) {
            try {
                const data = await response.clone().json();
                if (data.suspenso) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Conta Suspensa',
                        text: 'Sua conta foi suspensa por um administrador.',
                        allowOutsideClick: false,
                        confirmButtonText: 'OK'
                    }).then(() => {
                        window.location.href = '/autenticacao';
                    });
                }
            } catch (e) {
                // Ignorar erros de parsing
            }
        }
        
        return response;
    };
})();
