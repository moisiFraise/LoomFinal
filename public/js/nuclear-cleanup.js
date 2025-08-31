// SCRIPT NUCLEAR DE LIMPEZA - EXECUTA AUTOMATICAMENTE
(function() {
    'use strict';
    
    // Verificar se é uma página de autenticação ou dashboard
    const isAuthPage = window.location.pathname.includes('/autenticacao');
    const isDashboard = window.location.pathname.includes('/dashboard');
    const isMeuPerfil = window.location.pathname.includes('/meuPerfil');
    
    // Se não for página de autenticação e há parâmetros indicando limpeza
    const urlParams = new URLSearchParams(window.location.search);
    const needsCleanup = urlParams.has('nuclear') || urlParams.has('clean') || urlParams.has('emergency');
    
    if (needsCleanup || (!isAuthPage && (isDashboard || isMeuPerfil))) {
        console.log('🧹 Executando limpeza nuclear automática...');
        
        // Limpeza imediata de storages
        try {
            localStorage.clear();
            sessionStorage.clear();
            console.log('✅ Storage limpo');
        } catch (e) {
            console.log('❌ Erro ao limpar storage:', e);
        }
        
        // Limpeza de cookies
        try {
            const cookies = document.cookie.split(";");
            for (let cookie of cookies) {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                if (name && name !== 'loom_session') { // Preservar apenas cookie de sessão válida
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                }
            }
            console.log('✅ Cookies limpos (exceto sessão atual)');
        } catch (e) {
            console.log('❌ Erro ao limpar cookies:', e);
        }
        
        // Verificar se Service Workers estão ativos e desabilitá-los
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister();
                    console.log('✅ Service Worker desregistrado:', registration.scope);
                });
            });
        }
        
        // Limpar caches
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                return Promise.all(cacheNames.map(name => caches.delete(name)));
            }).then(() => {
                console.log('✅ Cache do navegador limpo');
            });
        }
        
        console.log('🚀 Limpeza nuclear concluída!');
    }
    
    // Função global disponível no console
    window.limpezaNuclear = async function() {
        localStorage.clear();
        sessionStorage.clear();
        
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
        
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.unregister();
            }
        }
        
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        await fetch('/api/emergency-cleanup', { method: 'POST' }).catch(() => {});
        
        alert('🧹 LIMPEZA NUCLEAR REALIZADA! Redirecionando...');
        window.location.replace('/autenticacao?nuclear=' + Date.now());
    };
    
})();
