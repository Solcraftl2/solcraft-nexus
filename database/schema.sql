-- SolCraft Nexus Database Schema
-- Complete database structure for RWA tokenization platform

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    wallet_address TEXT,
    wallet_type TEXT CHECK (wallet_type IN ('xumm', 'crossmark', 'trust_wallet', 'web3auth')),
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Asset categories
CREATE TABLE public.asset_categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets table (tokenized assets)
CREATE TABLE public.assets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT UNIQUE NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES asset_categories(id),
    owner_id UUID REFERENCES auth.users(id),
    total_value DECIMAL(15,2) NOT NULL,
    token_price DECIMAL(10,2) NOT NULL,
    total_tokens INTEGER NOT NULL,
    available_tokens INTEGER NOT NULL,
    minimum_investment DECIMAL(10,2) DEFAULT 100,
    expected_yield DECIMAL(5,2),
    location TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed')),
    featured BOOLEAN DEFAULT FALSE,
    documents_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset details (flexible JSON storage)
CREATE TABLE public.asset_details (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    details JSONB NOT NULL,
    financials JSONB,
    highlights TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User portfolios
CREATE TABLE public.portfolios (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    asset_id INTEGER REFERENCES assets(id),
    tokens_owned INTEGER NOT NULL DEFAULT 0,
    purchase_price DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(12,2),
    total_invested DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, asset_id)
);

-- Transactions
CREATE TABLE public.transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    asset_id INTEGER REFERENCES assets(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'dividend', 'fee')),
    tokens INTEGER NOT NULL,
    price_per_token DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Orders (buy/sell orders)
CREATE TABLE public.orders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    asset_id INTEGER REFERENCES assets(id),
    order_type TEXT NOT NULL CHECK (order_type IN ('buy', 'sell')),
    tokens INTEGER NOT NULL,
    price_per_token DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Watchlist
CREATE TABLE public.watchlist (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    asset_id INTEGER REFERENCES assets(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, asset_id)
);

-- Notifications
CREATE TABLE public.notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default asset categories
INSERT INTO public.asset_categories (name, description, icon) VALUES
('real_estate', 'Immobiliare', '🏠'),
('startup_equity', 'Equity Startup', '🚀'),
('art_collectibles', 'Arte e Collezioni', '🎨'),
('commodities', 'Commodities', '⚡');

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own portfolio" ON public.portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own watchlist" ON public.watchlist
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Public read access for assets
CREATE POLICY "Anyone can view active assets" ON public.assets
    FOR SELECT USING (status = 'active');

CREATE POLICY "Anyone can view asset categories" ON public.asset_categories
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view asset details" ON public.asset_details
    FOR SELECT USING (true);

