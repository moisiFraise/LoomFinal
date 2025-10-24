const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL || 'admin@loom.com'),
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

const NotificationService = {
  sendToUser: async (userId, payload) => {
    try {
      console.log(`📤 Enviando notificação para usuário ${userId}:`, payload.title);
      const subscriptions = await PushSubscription.findByUserId(userId);

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`⚠️ Nenhuma subscription para usuário ${userId}`);
        return { sent: 0, message: 'Nenhuma subscription encontrada' };
      }

      console.log(`📱 ${subscriptions.length} subscription(s) encontrada(s)`);
      let successCount = 0;
      let failCount = 0;

      const promises = subscriptions.map(async sub => {
        try {
          const subscription = JSON.parse(sub.dados_inscricao);
          console.log(`🔔 Enviando para endpoint: ${subscription.endpoint.substring(0, 50)}...`);
          
          await webpush.sendNotification(subscription, JSON.stringify(payload), {
            TTL: 86400, // 24 horas
            urgency: 'high'
          });
          
          successCount++;
          console.log(`✅ Notificação enviada com sucesso`);
        } catch (err) {
          failCount++;
          console.error(`❌ Erro ao enviar notificação:`, err.message);
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`🗑️ Removendo subscription inválida`);
            await PushSubscription.delete(userId, subscription.endpoint);
          }
        }
      });

      await Promise.all(promises);
      console.log(`📊 Resultado: ${successCount} sucesso, ${failCount} falhas`);
      return { sent: successCount, failed: failCount };
    } catch (err) {
      console.error('❌ Erro ao buscar subscriptions:', err);
      throw err;
    }
  },

  sendToClubMembers: async (clubeId, payload, excludeUserId = null) => {
    try {
      console.log(`📤 Enviando notificação para clube ${clubeId}:`, payload.title);
      const subscriptions = await PushSubscription.findByClubMembers(clubeId);

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`⚠️ Nenhuma subscription para clube ${clubeId}`);
        return { sent: 0, message: 'Nenhuma subscription encontrada' };
      }

      let filteredSubs = subscriptions;
      if (excludeUserId) {
        filteredSubs = subscriptions.filter(sub => sub.id_usuario !== excludeUserId);
        console.log(`🚫 Excluindo usuário ${excludeUserId}, ${filteredSubs.length} restantes`);
      }

      console.log(`📱 Enviando para ${filteredSubs.length} membro(s) do clube`);
      let successCount = 0;
      let failCount = 0;

      const promises = filteredSubs.map(async sub => {
        try {
          const subscription = JSON.parse(sub.dados_inscricao);
          console.log(`🔔 Enviando para usuário ${sub.id_usuario}`);
          
          await webpush.sendNotification(subscription, JSON.stringify(payload), {
            TTL: 86400,
            urgency: 'high'
          });
          
          successCount++;
          console.log(`✅ Enviado para usuário ${sub.id_usuario}`);
        } catch (err) {
          failCount++;
          console.error(`❌ Falha para usuário ${sub.id_usuario}:`, err.message);
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`🗑️ Removendo subscription inválida do usuário ${sub.id_usuario}`);
            await PushSubscription.delete(sub.id_usuario, subscription.endpoint);
          }
        }
      });

      await Promise.all(promises);
      console.log(`📊 Clube ${clubeId}: ${successCount} sucesso, ${failCount} falhas`);
      return { sent: successCount, failed: failCount };
    } catch (err) {
      console.error('❌ Erro ao buscar subscriptions do clube:', err);
      throw err;
    }
  },

  notifyNewMessage: (clubeId, senderName, messagePreview, senderId) => {
    const payload = {
      title: `Nova mensagem - ${senderName}`,
      body: messagePreview,
      icon: '/logo-192.png',
      tag: `chat-${clubeId}`,
      url: `/clube/${clubeId}/chat`,
      data: { type: 'new_message', clubeId, senderId }
    };
    return NotificationService.sendToClubMembers(clubeId, payload, senderId);
  },

  notifyNewReading: (clubeId, bookTitle) => {
    const payload = {
      title: 'Nova leitura do clube',
      body: `"${bookTitle}" foi adicionado às leituras`,
      icon: '/logo-192.png',
      tag: `reading-${clubeId}`,
      url: `/clube/${clubeId}/leituras`,
      data: { type: 'new_reading', clubeId }
    };
    return NotificationService.sendToClubMembers(clubeId, payload);
  },

  notifyNewMeeting: (clubeId, meetingTitle, meetingDate) => {
    const payload = {
      title: 'Encontro agendado',
      body: `${meetingTitle} - ${new Date(meetingDate).toLocaleDateString('pt-BR')}`,
      icon: '/logo-192.png',
      tag: `meeting-${clubeId}`,
      requireInteraction: true,
      url: `/clube/${clubeId}/encontros`,
      data: { type: 'new_meeting', clubeId }
    };
    return NotificationService.sendToClubMembers(clubeId, payload);
  },

  notifyVotingCreated: (clubeId, votingTitle) => {
    const payload = {
      title: 'Nova votação criada',
      body: votingTitle,
      icon: '/logo-192.png',
      tag: `voting-${clubeId}`,
      url: `/clube/${clubeId}/votacoes`,
      data: { type: 'voting_created', clubeId }
    };
    return NotificationService.sendToClubMembers(clubeId, payload);
  },

  notifyVotingEnded: (clubeId, votingTitle, winnerOption) => {
    const payload = {
      title: 'Votação encerrada',
      body: `${votingTitle} - Vencedor: ${winnerOption}`,
      icon: '/logo-192.png',
      tag: `voting-end-${clubeId}`,
      url: `/clube/${clubeId}/votacoes`,
      data: { type: 'voting_ended', clubeId }
    };
    return NotificationService.sendToClubMembers(clubeId, payload);
  },

  notifyClubUpdate: (clubeId, updateTitle, updatePreview) => {
    const payload = {
      title: updateTitle,
      body: updatePreview,
      icon: '/logo-192.png',
      tag: `update-${clubeId}`,
      url: `/clube/${clubeId}`,
      data: { type: 'club_update', clubeId }
    };
    return NotificationService.sendToClubMembers(clubeId, payload);
  }
};

module.exports = NotificationService;
