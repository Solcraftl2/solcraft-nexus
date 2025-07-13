# 🔑 CREDENZIALI SUPABASE - SOLCRAFT NEXUS

## 📊 **INFORMAZIONI PROGETTO**

### **🌐 Project Details:**
- **Project ID**: `dtzlkcqddjaoubrjnzjw`
- **Project URL**: `https://dtzlkcqddjaoubrjnzjw.supabase.co`
- **Dashboard**: `https://supabase.com/dashboard/project/dtzlkcqddjaoubrjnzjw`
- **Region**: US East (Virginia)
- **Piano**: Free Tier
- **Stato**: ⚠️ **PAUSED** (riattivazione richiesta)

## 🔐 **API KEYS**

### **🔓 Anon Key (Public):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0emxrY3FkZGphb3Vicmpuemp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzE1NDgsImV4cCI6MjA2NjUwNzU0OH0.eYJhbGc1OjJIUzI1NiIsInR5cCI6IkpXVCJ9
```

### **🔐 Service Role Key (Private):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0emxrY3FkZGphb3Vicmpuemp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDkzMTU0OCwiZXhwIjoyMDY2NTA3NTQ4fQ.tZg8eN3D6Jiy_L6u70DdQzdMA5CM8ix6VYcktnYYi7w
```

## 🔗 **CONNECTION STRINGS**

### **🌐 REST API:**
```
https://dtzlkcqddjaoubrjnzjw.supabase.co/rest/v1/
```

### **📡 Realtime:**
```
wss://dtzlkcqddjaoubrjnzjw.supabase.co/realtime/v1/websocket
```

### **🔐 Auth:**
```
https://dtzlkcqddjaoubrjnzjw.supabase.co/auth/v1/
```

### **📁 Storage:**
```
https://dtzlkcqddjaoubrjnzjw.supabase.co/storage/v1/
```

## ⚙️ **CONFIGURAZIONE AMBIENTE**

### **Frontend (.env):**
```env
REACT_APP_SUPABASE_URL=https://dtzlkcqddjaoubrjnzjw.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0emxrY3FkZGphb3Vicmpuemp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzE1NDgsImV4cCI6MjA2NjUwNzU0OH0.eYJhbGc1OjJIUzI1NiIsInR5cCI6IkpXVCJ9
```

### **Backend (.env):**
```env
SUPABASE_URL=https://dtzlkcqddjaoubrjnzjw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0emxrY3FkZGphb3Vicmpuemp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDkzMTU0OCwiZXhwIjoyMDY2NTA3NTQ4fQ.tZg8eN3D6Jiy_L6u70DdQzdMA5CM8ix6VYcktnYYi7w
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0emxrY3FkZGphb3Vicmpuemp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzE1NDgsImV4cCI6MjA2NjUwNzU0OH0.eYJhbGc1OjJIUzI1NiIsInR5cCI6IkpXVCJ9
```

### **Vercel Environment Variables:**
```
REACT_APP_SUPABASE_URL=https://dtzlkcqddjaoubrjnzjw.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0emxrY3FkZGphb3Vicmpuemp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzE1NDgsImV4cCI6MjA2NjUwNzU0OH0.eYJhbGc1OjJIUzI1NiIsInR5cCI6IkpXVCJ9
```

## 🚨 **SICUREZZA**

### **⚠️ IMPORTANTE:**
- **Service Role Key** = **ADMIN ACCESS** - Solo per backend!
- **Anon Key** = Sicuro per frontend/client
- **Mai esporre** Service Role Key nel frontend
- **Usa RLS** (Row Level Security) per proteggere dati

### **🔒 Row Level Security (RLS):**
```sql
-- Abilitare RLS su tutte le tabelle
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokenized_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
```

## 🔄 **RIATTIVAZIONE PROGETTO**

### **📋 Steps:**
1. **Login**: https://supabase.com/dashboard
2. **Seleziona**: Progetto `dtzlkcqddjaoubrjnzjw`
3. **Clicca**: "Restore project" o "Unpause"
4. **Attendi**: 1-2 minuti
5. **Test**: Connessione database

### **🎯 Post-Riattivazione:**
- ✅ Database accessibile
- ✅ API endpoints attivi
- ✅ Realtime funzionante
- ✅ Auth abilitato

## 📞 **SUPPORTO**

### **🆘 In caso di problemi:**
- **Dashboard**: https://supabase.com/dashboard/project/dtzlkcqddjaoubrjnzjw
- **Docs**: https://supabase.com/docs
- **Community**: https://github.com/supabase/supabase/discussions
- **Status**: https://status.supabase.com/

---

**🎯 STATO: Credenziali configurate, riattivazione progetto richiesta**
**📅 Ultimo aggiornamento: 13 Luglio 2025**

