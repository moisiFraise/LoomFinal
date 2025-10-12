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
      const subscriptions = await PushSubscription.findByUserId(userId);

      if (!subscriptions || subscriptions.length === 0) {
        return { sent: 0, message: 'Nenhuma subscription encontrada' };
      }

      const promises = subscriptions.map(sub => {
        try {
          const subscription = JSON.parse(sub.dados_inscricao);
          return webpush.sendNotification(subscription, JSON.stringify(payload))
            .catch(err => {
              console.error('Erro ao enviar notificação:', err);
              if (err.statusCode === 410) {
                PushSubscription.delete(userId, subscription.endpoint);
              }
            });
        } catch (parseErr) {
          console.error('Erro ao parsear subscription:', parseErr);
          return Promise.resolve();
        }
      });

      await Promise.all(promises);
      return { sent: subscriptions.length };
    } catch (err) {
      console.error('Erro ao buscar subscriptions:', err);
      throw err;
    }
  },

  sendToClubMembers: async (clubeId, payload, excludeUserId = null) => {
    try {
      const subscriptions = await PushSubscription.findByClubMembers(clubeId);

      if (!subscriptions || subscriptions.length === 0) {
        return { sent: 0, message: 'Nenhuma subscription encontrada' };
      }

      let filteredSubs = subscriptions;
      if (excludeUserId) {
        filteredSubs = subscriptions.filter(sub => sub.id_usuario !== excludeUserId);
      }

      const promises = filteredSubs.map(sub => {
        try {
          const subscription = JSON.parse(sub.dados_inscricao);
          return webpush.sendNotification(subscription, JSON.stringify(payload))
            .catch(err => {
              console.error('Erro ao enviar notificação:', err);
              if (err.statusCode === 410) {
                PushSubscription.delete(sub.id_usuario, subscription.endpoint);
              }
            });
        } catch (parseErr) {
          console.error('Erro ao parsear subscription:', parseErr);
          return Promise.resolve();
        }
      });

      await Promise.all(promises);
      return { sent: filteredSubs.length };
    } catch (err) {
      console.error('Erro ao buscar subscriptions do clube:', err);
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
