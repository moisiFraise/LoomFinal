/**
 * Helper para buscar usuários de forma robusta
 * Trata variações de email (espaços, maiúsculas, etc)
 */

const pool = require('../config/database');

/**
 * Buscar usuário por email com normalização
 * Remove espaços, converte para minúsculas
 */
async function buscarPorEmailRobusto(email) {
  try {
    if (!email) {
      return null;
    }

    // Normalizar email
    const emailNormalizado = email.trim().toLowerCase();
    
    console.log('🔍 Buscando usuário...');
    console.log(`   Email original: "${email}"`);
    console.log(`   Email normalizado: "${emailNormalizado}"`);

    // Tentar busca exata primeiro
    let [usuarios] = await pool.safeQuery(
      'SELECT * FROM usuarios WHERE LOWER(TRIM(email)) = ?',
      [emailNormalizado]
    );

    if (usuarios.length > 0) {
      // Filtrar usuários deletados se a coluna existir
      const usuariosAtivos = usuarios.filter(u => !u.deletado_em);
      if (usuariosAtivos.length > 0) {
        console.log('✅ Usuário encontrado (busca normalizada)');
        return usuariosAtivos[0];
      }
    }

    // Se não encontrar, tentar busca LIKE (para variações)
    console.log('   Tentando busca flexível...');
    [usuarios] = await pool.safeQuery(
      'SELECT * FROM usuarios WHERE email LIKE ? LIMIT 1',
      [`%${emailNormalizado}%`]
    );

    if (usuarios.length > 0) {
      console.log('✅ Usuário encontrado (busca flexível)');
      return usuarios[0];
    }

    console.log('❌ Usuário não encontrado');
    
    // Buscar emails similares para debug
    const [similares] = await pool.safeQuery(
      'SELECT id, nome, email FROM usuarios WHERE email LIKE ? LIMIT 5',
      [`%${email.substring(0, 5)}%`]
    );
    
    if (similares.length > 0) {
      console.log('💡 Emails similares encontrados:');
      similares.forEach(u => {
        console.log(`   - ${u.email}`);
      });
    }

    return null;

  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error.message);
    throw error;
  }
}

/**
 * Listar todos os usuários (para debug)
 */
async function listarTodosEmails() {
  try {
    console.log('\n📋 Todos os usuários no banco:\n');
    
    const [usuarios] = await pool.safeQuery(
      'SELECT id, nome, email FROM usuarios ORDER BY id'
    );

    if (usuarios.length === 0) {
      console.log('   Nenhum usuário encontrado');
      return [];
    }

    usuarios.forEach(u => {
      console.log(`   [${u.id}] ${u.nome} - ${u.email}`);
    });

    console.log(`\n   Total: ${usuarios.length} usuários\n`);
    
    return usuarios;

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return [];
  }
}

/**
 * Verificar integridade do campo email
 */
async function verificarEmails() {
  try {
    console.log('\n🔎 Verificando integridade dos emails:\n');

    const [usuarios] = await pool.safeQuery(
      'SELECT id, nome, email, LENGTH(email) as tamanho FROM usuarios'
    );

    console.log(`Total de usuários: ${usuarios.length}\n`);

    let problemas = 0;

    usuarios.forEach(u => {
      console.log(`[${u.id}] ${u.nome}`);
      console.log(`    Email: "${u.email}" (${u.tamanho} chars)`);
      
      // Verificar problemas comuns
      if (u.email.includes(' ')) {
        console.log(`    ⚠️  AVISO: Email contém espaços`);
        problemas++;
      }
      
      if (!u.email.includes('@')) {
        console.log(`    ❌ ERRO: Email não contém @`);
        problemas++;
      }
      
      if (u.email !== u.email.trim()) {
        console.log(`    ⚠️  AVISO: Email tem espaços no início/fim`);
        problemas++;
      }
      
      console.log();
    });

    if (problemas === 0) {
      console.log('✅ Todos os emails estão OK\n');
    } else {
      console.log(`⚠️  ${problemas} problema(s) encontrado(s)\n`);
    }

  } catch (error) {
    console.error('Erro ao verificar emails:', error);
  }
}

/**
 * Corrigir emails (remover espaços extras)
 */
async function corrigirEmails() {
  try {
    console.log('\n🔧 Corrigindo emails...\n');

    // Remover espaços no início/fim
    const [result] = await pool.safeQuery(
      "UPDATE usuarios SET email = TRIM(email) WHERE email != TRIM(email)"
    );

    console.log(`✅ ${result.changedRows} email(s) corrigido(s)`);
    
    // Mostrar resultado
    await verificarEmails();

  } catch (error) {
    console.error('Erro ao corrigir emails:', error);
  }
}

/**
 * Criar script de teste
 */
async function testarBusca(email) {
  try {
    console.log('\n' + '='.repeat(50));
    console.log('🧪 TESTE DE BUSCA DE USUÁRIO');
    console.log('='.repeat(50) + '\n');

    // Mostrar todos os emails
    await listarTodosEmails();

    // Verificar integridade
    await verificarEmails();

    // Tentar buscar
    console.log(`🔍 Buscando por: "${email}"\n`);
    const usuario = await buscarPorEmailRobusto(email);

    if (usuario) {
      console.log('\n✅ SUCESSO! Usuário encontrado:');
      console.log(`   ID: ${usuario.id}`);
      console.log(`   Nome: ${usuario.nome}`);
      console.log(`   Email: ${usuario.email}`);
      console.log(`   Estado: ${usuario.estado || 'ativo'}`);
      console.log(`   Tipo: ${usuario.tipo || 'comum'}\n`);
    } else {
      console.log('\n❌ Usuário não encontrado\n');
    }

    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

module.exports = {
  buscarPorEmailRobusto,
  listarTodosEmails,
  verificarEmails,
  corrigirEmails,
  testarBusca
};
