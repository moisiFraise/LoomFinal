const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');

class EmailService {
  constructor() {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('⚠️  SENDGRID_API_KEY não configurado. Sistema de email não funcionará.');
    }
    
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async enviarEmailResetSenha(email, nomeUsuario, token) {
    let baseUrl;
    if (process.env.NODE_ENV === 'production') {
      baseUrl = 'https://loom-final.vercel.app';
    } else if (process.env.BASE_URL) {
      baseUrl = process.env.BASE_URL;
    } else {
      const port = process.env.PORT || 3000;
      baseUrl = `http://localhost:${port}`;
    }
    
    const resetUrl = `${baseUrl}/reset-senha?token=${token}`;
    
    console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL de reset gerada: ${resetUrl}`);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo-container { margin-bottom: 20px; }
          .logo { width: 120px; height: auto; margin: 0 auto; display: block; }
          .brand-name { color: #6c5ce7; font-size: 28px; font-weight: bold; margin: 10px 0 5px; }
          .brand-subtitle { color: #888; font-size: 14px; margin: 0; }
          .content { line-height: 1.6; color: #333; }
          .button { display: inline-block; background-color: #6c5ce7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button:hover { background-color: #5a4fcf; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-container">
              <svg class="logo" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 30 Q100 20, 180 30 L180 90 Q100 80, 20 90 Z" fill="#6c5ce7" opacity="0.1"/>
                <path d="M100 25 L100 85" stroke="#6c5ce7" stroke-width="2"/>
                <path d="M20 30 Q100 20, 100 25 Q100 20, 180 30" stroke="#6c5ce7" stroke-width="2" fill="none"/>
                <path d="M20 90 Q100 80, 100 85 Q100 80, 180 90" stroke="#6c5ce7" stroke-width="2" fill="none"/>
                <path d="M20 30 L20 90" stroke="#6c5ce7" stroke-width="2"/>
                <path d="M180 30 L180 90" stroke="#6c5ce7" stroke-width="2"/>
                <path d="M30 40 L90 40" stroke="#8e7cc3" stroke-width="1"/>
                <path d="M30 50 L85 50" stroke="#8e7cc3" stroke-width="1"/>
                <path d="M30 60 L80 60" stroke="#8e7cc3" stroke-width="1"/>
                <path d="M110 40 L170 40" stroke="#8e7cc3" stroke-width="1"/>
                <path d="M115 50 L170 50" stroke="#8e7cc3" stroke-width="1"/>
                <path d="M120 60 L170 60" stroke="#8e7cc3" stroke-width="1"/>
              </svg>
            </div>
            <div class="brand-name">Loom</div>
            <div class="brand-subtitle">Clubes de Leitura</div>
            <h2>Redefinir sua senha</h2>
          </div>
          
          <div class="content">
            <p>Olá, <strong>${nomeUsuario}</strong>!</p>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no Loom. Se você fez essa solicitação, clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Redefinir Senha</a>
            </div>
            
            <div class="warning">
              <strong>Importante:</strong>
              <ul>
                <li>Este link é válido por apenas <strong>1 hora</strong></li>
                <li>Se você não solicitou esta alteração, ignore este email</li>
                <li>Sua senha atual permanecerá inalterada até que você complete o processo</li>
              </ul>
            </div>
            
            <p>Se o botão não funcionar, você também pode copiar e colar o link abaixo no seu navegador:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
              ${resetUrl}
            </p>
          </div>
          
          <div class="footer">
            <p>Este é um email automático do sistema Loom</p>
            <p><strong>loom.leitura@gmail.com</strong></p>
            <p style="font-size: 12px; color: #999;">
              Se você continuar tendo problemas, entre em contato conosco respondendo este email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const msg = {
      to: email,
      from: {
        email: 'loom.leitura@gmail.com',
        name: 'Loom - Clubes de Leitura'
      },
      subject: 'Redefinir senha - Loom',
      html: htmlContent
    };

    try {
      const response = await sgMail.send(msg);
      console.log('📧 Email de reset enviado via SendGrid');
      return { success: true, messageId: response[0].headers['x-message-id'] };
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error.response ? error.response.body : error);
      throw new Error(`Erro no envio de email: ${error.message}`);
    }
  }

  static gerarToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static verificarExpiracaoToken(dataToken) {
    const agora = new Date();
    const expiracao = new Date(dataToken);
    expiracao.setHours(expiracao.getHours() + 1);
    
    return agora <= expiracao;
  }
}

module.exports = EmailService;
