from src.models.user import db
from datetime import datetime
import uuid
from decimal import Decimal

class Asset(db.Model):
    """Asset model for tokenized assets"""
    __tablename__ = 'assets'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    symbol = db.Column(db.String(50), nullable=False, unique=True, index=True)
    description = db.Column(db.Text)
    
    # Asset classification
    asset_type = db.Column(db.String(50), nullable=False)  # real_estate, commodity, energy, vehicle, art
    asset_subtype = db.Column(db.String(50))  # residential, commercial, gold, oil, solar, etc.
    
    # Financial information
    total_supply = db.Column(db.Numeric(20, 8), nullable=False)
    current_supply = db.Column(db.Numeric(20, 8), nullable=False, default=0)
    initial_price = db.Column(db.Numeric(20, 8), nullable=False)
    current_price = db.Column(db.Numeric(20, 8))
    market_cap = db.Column(db.Numeric(20, 8))
    
    # Asset valuation
    estimated_value = db.Column(db.Numeric(20, 8), nullable=False)
    last_valuation_date = db.Column(db.DateTime)
    valuation_method = db.Column(db.String(100))
    valuation_documents = db.Column(db.JSON)
    
    # Ownership and management
    issuer_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    custodian_info = db.Column(db.JSON)  # Information about asset custodian
    
    # Blockchain information
    xrpl_token_id = db.Column(db.String(255), unique=True, index=True)
    xrpl_issuer_address = db.Column(db.String(255))
    token_flags = db.Column(db.JSON)  # XRP Ledger token flags
    
    # Asset metadata
    asset_metadata = db.Column(db.JSON)  # Flexible metadata for different asset types
    images = db.Column(db.JSON)  # Array of image URLs
    documents = db.Column(db.JSON)  # Array of document references
    
    # Location information (for physical assets)
    location = db.Column(db.JSON)  # Address, coordinates, etc.
    
    # Status and lifecycle
    status = db.Column(db.String(20), nullable=False, default='draft')  # draft, pending, active, suspended, retired
    tokenization_status = db.Column(db.String(20), default='not_started')  # not_started, in_progress, completed, failed
    
    # Compliance and legal
    regulatory_status = db.Column(db.String(50))
    compliance_documents = db.Column(db.JSON)
    legal_structure = db.Column(db.String(100))
    
    # Revenue and dividends
    revenue_model = db.Column(db.String(100))  # rental, appreciation, production, etc.
    dividend_frequency = db.Column(db.String(20))  # monthly, quarterly, annually
    last_dividend_date = db.Column(db.DateTime)
    next_dividend_date = db.Column(db.DateTime)
    annual_yield = db.Column(db.Numeric(5, 4))  # Expected annual yield percentage
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tokenized_at = db.Column(db.DateTime)
    
    # Relationships
    issuer = db.relationship('User', backref='issued_assets')
    holdings = db.relationship('TokenHolding', backref='asset', lazy=True, cascade='all, delete-orphan')
    transactions = db.relationship('Transaction', backref='asset', lazy=True)
    dividends = db.relationship('DividendDistribution', backref='asset', lazy=True)
    
    def __repr__(self):
        return f'<Asset {self.symbol}: {self.name}>'
    
    def calculate_market_cap(self):
        """Calculate current market capitalization"""
        if self.current_price and self.current_supply:
            self.market_cap = self.current_price * self.current_supply
            return self.market_cap
        return Decimal('0')
    
    def get_total_holders(self):
        """Get total number of token holders"""
        return TokenHolding.query.filter_by(asset_id=self.id).filter(TokenHolding.amount > 0).count()
    
    def get_circulating_supply(self):
        """Get circulating supply (tokens held by users)"""
        total_held = db.session.query(db.func.sum(TokenHolding.amount)).filter_by(asset_id=self.id).scalar()
        return total_held or Decimal('0')
    
    def is_tradeable(self):
        """Check if asset tokens can be traded"""
        return self.status == 'active' and self.tokenization_status == 'completed'
    
    def to_dict(self, include_sensitive=False):
        """Convert asset to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'symbol': self.symbol,
            'description': self.description,
            'asset_type': self.asset_type,
            'asset_subtype': self.asset_subtype,
            'total_supply': str(self.total_supply),
            'current_supply': str(self.current_supply),
            'initial_price': str(self.initial_price),
            'current_price': str(self.current_price) if self.current_price else None,
            'market_cap': str(self.market_cap) if self.market_cap else None,
            'estimated_value': str(self.estimated_value),
            'last_valuation_date': self.last_valuation_date.isoformat() if self.last_valuation_date else None,
            'status': self.status,
            'tokenization_status': self.tokenization_status,
            'revenue_model': self.revenue_model,
            'dividend_frequency': self.dividend_frequency,
            'annual_yield': str(self.annual_yield) if self.annual_yield else None,
            'images': self.images,
            'location': self.location,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'tokenized_at': self.tokenized_at.isoformat() if self.tokenized_at else None,
            'total_holders': self.get_total_holders(),
            'circulating_supply': str(self.get_circulating_supply())
        }
        
        if include_sensitive:
            data.update({
                'issuer_id': self.issuer_id,
                'xrpl_token_id': self.xrpl_token_id,
                'xrpl_issuer_address': self.xrpl_issuer_address,
                'metadata': self.asset_metadata,
                'documents': self.documents,
                'compliance_documents': self.compliance_documents
            })
        
        return data

class TokenHolding(db.Model):
    """Token holding model for user portfolios"""
    __tablename__ = 'token_holdings'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    asset_id = db.Column(db.String(36), db.ForeignKey('assets.id'), nullable=False)
    
    # Holding information
    amount = db.Column(db.Numeric(20, 8), nullable=False, default=0)
    average_cost = db.Column(db.Numeric(20, 8))  # Average cost basis
    total_invested = db.Column(db.Numeric(20, 8), default=0)
    
    # Performance tracking
    unrealized_pnl = db.Column(db.Numeric(20, 8), default=0)
    realized_pnl = db.Column(db.Numeric(20, 8), default=0)
    total_dividends_received = db.Column(db.Numeric(20, 8), default=0)
    
    # Timestamps
    first_purchase_date = db.Column(db.DateTime)
    last_transaction_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Constraints
    __table_args__ = (db.UniqueConstraint('user_id', 'asset_id', name='unique_user_asset_holding'),)
    
    def calculate_current_value(self):
        """Calculate current value of holding"""
        if self.asset.current_price:
            return self.amount * self.asset.current_price
        return self.amount * self.asset.initial_price
    
    def calculate_percentage_ownership(self):
        """Calculate percentage ownership of the asset"""
        if self.asset.current_supply > 0:
            return (self.amount / self.asset.current_supply) * 100
        return Decimal('0')
    
    def update_pnl(self):
        """Update unrealized P&L"""
        current_value = self.calculate_current_value()
        self.unrealized_pnl = current_value - self.total_invested
    
    def __repr__(self):
        return f'<TokenHolding {self.user_id} holds {self.amount} of {self.asset.symbol}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'asset_id': self.asset_id,
            'asset_symbol': self.asset.symbol,
            'asset_name': self.asset.name,
            'amount': str(self.amount),
            'average_cost': str(self.average_cost) if self.average_cost else None,
            'total_invested': str(self.total_invested),
            'current_value': str(self.calculate_current_value()),
            'percentage_ownership': str(self.calculate_percentage_ownership()),
            'unrealized_pnl': str(self.unrealized_pnl),
            'realized_pnl': str(self.realized_pnl),
            'total_dividends_received': str(self.total_dividends_received),
            'first_purchase_date': self.first_purchase_date.isoformat() if self.first_purchase_date else None,
            'last_transaction_date': self.last_transaction_date.isoformat() if self.last_transaction_date else None
        }

class Portfolio(db.Model):
    """Portfolio model for user asset collections"""
    __tablename__ = 'portfolios'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False, default='Default Portfolio')
    description = db.Column(db.Text)
    
    # Portfolio metrics
    total_value = db.Column(db.Numeric(20, 8), default=0)
    total_invested = db.Column(db.Numeric(20, 8), default=0)
    total_pnl = db.Column(db.Numeric(20, 8), default=0)
    total_dividends = db.Column(db.Numeric(20, 8), default=0)
    
    # Portfolio settings
    is_default = db.Column(db.Boolean, default=True)
    is_public = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def calculate_metrics(self):
        """Calculate portfolio metrics from holdings"""
        holdings = TokenHolding.query.filter_by(user_id=self.user_id).all()
        
        self.total_value = sum(holding.calculate_current_value() for holding in holdings)
        self.total_invested = sum(holding.total_invested for holding in holdings)
        self.total_pnl = sum(holding.unrealized_pnl + holding.realized_pnl for holding in holdings)
        self.total_dividends = sum(holding.total_dividends_received for holding in holdings)
        
        db.session.commit()
    
    def get_asset_allocation(self):
        """Get asset allocation breakdown"""
        holdings = TokenHolding.query.filter_by(user_id=self.user_id).filter(TokenHolding.amount > 0).all()
        
        allocation = {}
        for holding in holdings:
            asset_type = holding.asset.asset_type
            current_value = holding.calculate_current_value()
            
            if asset_type not in allocation:
                allocation[asset_type] = {
                    'value': Decimal('0'),
                    'percentage': Decimal('0'),
                    'assets': []
                }
            
            allocation[asset_type]['value'] += current_value
            allocation[asset_type]['assets'].append({
                'symbol': holding.asset.symbol,
                'name': holding.asset.name,
                'value': str(current_value),
                'amount': str(holding.amount)
            })
        
        # Calculate percentages
        if self.total_value > 0:
            for asset_type in allocation:
                allocation[asset_type]['percentage'] = (allocation[asset_type]['value'] / self.total_value) * 100
                allocation[asset_type]['value'] = str(allocation[asset_type]['value'])
                allocation[asset_type]['percentage'] = str(allocation[asset_type]['percentage'])
        
        return allocation
    
    def __repr__(self):
        return f'<Portfolio {self.name} for user {self.user_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'total_value': str(self.total_value),
            'total_invested': str(self.total_invested),
            'total_pnl': str(self.total_pnl),
            'total_dividends': str(self.total_dividends),
            'is_default': self.is_default,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'asset_allocation': self.get_asset_allocation()
        }

