const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

export default async function handler(req, res) {
  // Gestione CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validazione input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e password sono obbligatori'
      });
    }

    // Simula la verifica dell'utente nel database
    // In produzione, qui faresti una query a Supabase per verificare le credenziali
    const mockUsers = [
      {
        id: 1,
        email: 'admin@solcraft.com',
        password: await bcrypt.hash('admin123', 10),
        firstName: 'Admin',
        lastName: 'SolCraft',
        isVerified: true
      },
      {
        id: 2,
        email: 'demo@solcraft.com',
        password: await bcrypt.hash('demo123', 10),
        firstName: 'Demo',
        lastName: 'User',
        isVerified: true
      }
    ];

    // Trova l'utente
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    // Verifica la password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    // Genera JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'solcraft-nexus-secret-key-2025';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Rimuovi la password dalla risposta
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: 'Login completato con successo',
      token: token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Errore login:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
}

