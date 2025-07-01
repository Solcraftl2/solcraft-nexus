import jwt from 'jsonwebtoken';
import { supabase, getUserByEmail } from '../config/supabaseClient.js';
import { createWallet } from '../config/xrpl.js';

const JWT_SECRET = process.env.JWT_SECRET || 'solcraft-nexus-secret-key-2025';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { provider, token, walletAddress } = req.body;

    if (!provider || !token) {
      return res.status(400).json({ success: false, message: 'Provider e token richiesti' });
    }

    let userInfo = null;

    if (provider === 'google') {
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
      if (googleRes.ok) {
        const g = await googleRes.json();
        userInfo = {
          id: g.sub,
          email: g.email,
          name: g.name,
          picture: g.picture,
          verified: g.email_verified === 'true'
        };
      }
    } else if (provider === 'github') {
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'SolCraft-Nexus'
        }
      });
      if (userRes.ok) {
        const gh = await userRes.json();
        let email = gh.email;
        if (!email) {
          const emailRes = await fetch('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'SolCraft-Nexus' }
          });
          if (emailRes.ok) {
            const emails = await emailRes.json();
            const primary = emails.find(e => e.primary) || emails[0];
            email = primary?.email;
          }
        }
        userInfo = {
          id: gh.id,
          email,
          name: gh.name || gh.login,
          picture: gh.avatar_url,
          verified: true
        };
      }
    } else if (provider === 'discord') {
      const dRes = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (dRes.ok) {
        const d = await dRes.json();
        userInfo = {
          id: d.id,
          email: d.email,
          name: d.username,
          picture: d.avatar ? `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.png` : null,
          verified: d.verified
        };
      }
    } else {
      return res.status(400).json({ success: false, message: `Provider ${provider} non supportato` });
    }

    if (!userInfo || !userInfo.email) {
      return res.status(400).json({ success: false, message: 'Impossibile ottenere dati utente' });
    }

    let user = await getUserByEmail(userInfo.email.toLowerCase());

    if (user) {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: userInfo.name,
          avatar_url: userInfo.picture,
          last_login: new Date().toISOString(),
          provider,
          auth_method: 'web3auth'
        })
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      user = data;
    } else {
      const wallet = walletAddress || createWallet().address;
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userInfo.email.toLowerCase(),
          name: userInfo.name,
          avatar_url: userInfo.picture,
          wallet_address: wallet,
          provider,
          auth_method: 'web3auth',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      user = data;
    }

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, walletAddress: user.wallet_address, provider },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({ success: true, user, token: jwtToken });
  } catch (error) {
    console.error('Web3Auth error:', error);
    return res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
}
