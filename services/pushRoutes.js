const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const userId = req.session.userId;
  const subscription = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Subscription inválida' });
  }

  try {
    await PushSubscription.create(userId, subscription);
    res.json({ success: true, message: 'Subscription salva com sucesso' });
  } catch (err) {
    console.error('Erro ao salvar subscription:', err);
    res.status(500).json({ error: 'Erro ao salvar subscription' });
  }
});

router.post('/unsubscribe', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const userId = req.session.userId;
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint inválido' });
  }

  try {
    await PushSubscription.delete(userId, endpoint);
    res.json({ success: true, message: 'Subscription removida com sucesso' });
  } catch (err) {
    console.error('Erro ao remover subscription:', err);
    res.status(500).json({ error: 'Erro ao remover subscription' });
  }
});

module.exports = router;
