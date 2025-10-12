const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const userId = req.session.usuario.id;
  const subscription = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Subscription inválida' });
  }

  PushSubscription.create(userId, subscription, (err, result) => {
    if (err) {
      console.error('Erro ao salvar subscription:', err);
      return res.status(500).json({ error: 'Erro ao salvar subscription' });
    }
    res.json({ success: true, message: 'Subscription salva com sucesso' });
  });
});

router.post('/unsubscribe', (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const userId = req.session.usuario.id;
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint inválido' });
  }

  PushSubscription.delete(userId, endpoint, (err, result) => {
    if (err) {
      console.error('Erro ao remover subscription:', err);
      return res.status(500).json({ error: 'Erro ao remover subscription' });
    }
    res.json({ success: true, message: 'Subscription removida com sucesso' });
  });
});

module.exports = router;
