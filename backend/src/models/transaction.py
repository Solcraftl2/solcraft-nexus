from src.models.user import db
from datetime import datetime
import uuid
from decimal import Decimal

class Transaction(db.Model):
    """Transaction model for all platform transactions"""
    __tablename__ = 'transactions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Transaction type and details
    transaction_type = db.Column(db.String(50), nullable=False)  # buy, sell, transfer, dividend, mint, burn
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, completed, failed, cancelled
    
    # Parties involved
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    counterparty_id = db.Column(db.String(36), db.ForeignKey('users.id'))  # For transfers
    asset_id = db.Column(db.String(36), db.ForeignKey('assets.id'))
    
    # Transaction amounts
    amount = db.Column(db.Numeric(20, 8))  # Token amount
    price = db.Column(db.Numeric(20, 8))   # Price per token
    total_value = db.Column(db.Numeric(20, 8))  # Total transaction value
    fee = db.Column(db.Numeric(20, 8), default=0)  # Platform fee
    
    # Blockchain information
    xrpl_transaction_hash = db.Column(db.String(255), unique=True, index=True)
    xrpl_ledger_index = db.Column(db.Integer)
    xrpl_sequence = db.Column(db.Integer)
    
    # Additional metadata
    transaction_metadata = db.Column(db.JSON)  # Additional transaction data
    notes = db.Column(db.Text)     # User or admin notes
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    executed_at = db.Column(db.DateTime)
    confirmed_at = db.Column(db.DateTime)
    
    # Relationships are defined in User model
    
    def __repr__(self):
        return f'<Transaction {self.id}: {self.transaction_type} {self.amount} {self.asset.symbol if self.asset else ""}>'
    
    def calculate_total_value(self):
        """Calculate total transaction value"""
        if self.amount and self.price:
            self.total_value = self.amount * self.price
        return self.total_value
    
    def is_completed(self):
        """Check if transaction is completed"""
        return self.status == 'completed'
    
    def can_be_cancelled(self):
        """Check if transaction can be cancelled"""
        return self.status == 'pending' and not self.xrpl_transaction_hash
    
    def to_dict(self):
        return {
            'id': self.id,
            'transaction_type': self.transaction_type,
            'status': self.status,
            'user_id': self.user_id,
            'counterparty_id': self.counterparty_id,
            'asset_id': self.asset_id,
            'asset_symbol': self.asset.symbol if self.asset else None,
            'asset_name': self.asset.name if self.asset else None,
            'amount': str(self.amount) if self.amount else None,
            'price': str(self.price) if self.price else None,
            'total_value': str(self.total_value) if self.total_value else None,
            'fee': str(self.fee),
            'xrpl_transaction_hash': self.xrpl_transaction_hash,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'executed_at': self.executed_at.isoformat() if self.executed_at else None,
            'confirmed_at': self.confirmed_at.isoformat() if self.confirmed_at else None
        }

class DividendDistribution(db.Model):
    """Dividend distribution model"""
    __tablename__ = 'dividend_distributions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_id = db.Column(db.String(36), db.ForeignKey('assets.id'), nullable=False)
    
    # Distribution details
    total_amount = db.Column(db.Numeric(20, 8), nullable=False)  # Total dividend amount
    currency = db.Column(db.String(10), nullable=False, default='XRP')  # Distribution currency
    distribution_date = db.Column(db.DateTime, nullable=False)
    record_date = db.Column(db.DateTime, nullable=False)  # Snapshot date for eligibility
    
    # Distribution metadata
    description = db.Column(db.Text)
    distribution_type = db.Column(db.String(50), default='regular')  # regular, special, liquidation
    
    # Status tracking
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, processing, completed, failed
    total_recipients = db.Column(db.Integer, default=0)
    successful_payments = db.Column(db.Integer, default=0)
    failed_payments = db.Column(db.Integer, default=0)
    
    # Blockchain information
    xrpl_transactions = db.Column(db.JSON)  # Array of XRPL transaction hashes
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    payments = db.relationship('DividendPayment', backref='distribution', lazy=True, cascade='all, delete-orphan')
    
    def calculate_per_token_amount(self):
        """Calculate dividend amount per token"""
        if self.asset.current_supply > 0:
            return self.total_amount / self.asset.current_supply
        return Decimal('0')
    
    def get_eligible_holders(self):
        """Get list of eligible token holders at record date"""
        # In a real implementation, this would query historical holdings at record_date
        # For now, we'll use current holdings
        from src.models.asset import TokenHolding
        return TokenHolding.query.filter_by(asset_id=self.asset_id).filter(TokenHolding.amount > 0).all()
    
    def calculate_payment_amount(self, holding_amount):
        """Calculate dividend payment for a specific holding amount"""
        per_token_amount = self.calculate_per_token_amount()
        return holding_amount * per_token_amount
    
    def __repr__(self):
        return f'<DividendDistribution {self.id} for {self.asset.symbol}: {self.total_amount} {self.currency}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'asset_symbol': self.asset.symbol,
            'asset_name': self.asset.name,
            'total_amount': str(self.total_amount),
            'currency': self.currency,
            'per_token_amount': str(self.calculate_per_token_amount()),
            'distribution_date': self.distribution_date.isoformat(),
            'record_date': self.record_date.isoformat(),
            'description': self.description,
            'distribution_type': self.distribution_type,
            'status': self.status,
            'total_recipients': self.total_recipients,
            'successful_payments': self.successful_payments,
            'failed_payments': self.failed_payments,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class DividendPayment(db.Model):
    """Individual dividend payment model"""
    __tablename__ = 'dividend_payments'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    distribution_id = db.Column(db.String(36), db.ForeignKey('dividend_distributions.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Payment details
    amount = db.Column(db.Numeric(20, 8), nullable=False)
    currency = db.Column(db.String(10), nullable=False)
    holding_amount = db.Column(db.Numeric(20, 8), nullable=False)  # Token amount at record date
    
    # Payment status
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, sent, confirmed, failed
    
    # Blockchain information
    xrpl_transaction_hash = db.Column(db.String(255), unique=True, index=True)
    recipient_address = db.Column(db.String(255), nullable=False)
    
    # Error handling
    error_message = db.Column(db.Text)
    retry_count = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sent_at = db.Column(db.DateTime)
    confirmed_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', backref='dividend_payments')
    
    def __repr__(self):
        return f'<DividendPayment {self.id}: {self.amount} {self.currency} to {self.user.email}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'distribution_id': self.distribution_id,
            'user_id': self.user_id,
            'user_email': self.user.email,
            'amount': str(self.amount),
            'currency': self.currency,
            'holding_amount': str(self.holding_amount),
            'status': self.status,
            'xrpl_transaction_hash': self.xrpl_transaction_hash,
            'recipient_address': self.recipient_address,
            'error_message': self.error_message,
            'retry_count': self.retry_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'confirmed_at': self.confirmed_at.isoformat() if self.confirmed_at else None
        }

class MarketOrder(db.Model):
    """Market order model for trading"""
    __tablename__ = 'market_orders'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    asset_id = db.Column(db.String(36), db.ForeignKey('assets.id'), nullable=False)
    
    # Order details
    order_type = db.Column(db.String(20), nullable=False)  # buy, sell
    order_side = db.Column(db.String(20), nullable=False)  # market, limit, stop_loss
    amount = db.Column(db.Numeric(20, 8), nullable=False)
    price = db.Column(db.Numeric(20, 8))  # For limit orders
    stop_price = db.Column(db.Numeric(20, 8))  # For stop orders
    
    # Order status
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, partial, filled, cancelled, expired
    filled_amount = db.Column(db.Numeric(20, 8), default=0)
    remaining_amount = db.Column(db.Numeric(20, 8))
    average_fill_price = db.Column(db.Numeric(20, 8))
    
    # Order metadata
    time_in_force = db.Column(db.String(20), default='GTC')  # GTC (Good Till Cancelled), IOC (Immediate or Cancel), FOK (Fill or Kill)
    expires_at = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    filled_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', backref='market_orders')
    asset = db.relationship('Asset', backref='market_orders')
    fills = db.relationship('OrderFill', foreign_keys='OrderFill.order_id', backref='order', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.remaining_amount = self.amount
    
    def is_active(self):
        """Check if order is still active"""
        return self.status in ['pending', 'partial']
    
    def can_be_cancelled(self):
        """Check if order can be cancelled"""
        return self.status in ['pending', 'partial']
    
    def calculate_total_value(self):
        """Calculate total order value"""
        if self.price:
            return self.amount * self.price
        return None
    
    def __repr__(self):
        return f'<MarketOrder {self.id}: {self.order_type} {self.amount} {self.asset.symbol} at {self.price}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'asset_id': self.asset_id,
            'asset_symbol': self.asset.symbol,
            'asset_name': self.asset.name,
            'order_type': self.order_type,
            'order_side': self.order_side,
            'amount': str(self.amount),
            'price': str(self.price) if self.price else None,
            'stop_price': str(self.stop_price) if self.stop_price else None,
            'status': self.status,
            'filled_amount': str(self.filled_amount),
            'remaining_amount': str(self.remaining_amount),
            'average_fill_price': str(self.average_fill_price) if self.average_fill_price else None,
            'time_in_force': self.time_in_force,
            'total_value': str(self.calculate_total_value()) if self.calculate_total_value() else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'filled_at': self.filled_at.isoformat() if self.filled_at else None
        }

class OrderFill(db.Model):
    """Order fill model for tracking partial executions"""
    __tablename__ = 'order_fills'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = db.Column(db.String(36), db.ForeignKey('market_orders.id'), nullable=False)
    
    # Fill details
    amount = db.Column(db.Numeric(20, 8), nullable=False)
    price = db.Column(db.Numeric(20, 8), nullable=False)
    total_value = db.Column(db.Numeric(20, 8), nullable=False)
    fee = db.Column(db.Numeric(20, 8), default=0)
    
    # Counterparty information
    counterparty_order_id = db.Column(db.String(36), db.ForeignKey('market_orders.id'))
    
    # Blockchain information
    xrpl_transaction_hash = db.Column(db.String(255))
    
    # Timestamp
    executed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    counterparty_order = db.relationship('MarketOrder', foreign_keys=[counterparty_order_id])
    
    def __repr__(self):
        return f'<OrderFill {self.id}: {self.amount} at {self.price}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'amount': str(self.amount),
            'price': str(self.price),
            'total_value': str(self.total_value),
            'fee': str(self.fee),
            'counterparty_order_id': self.counterparty_order_id,
            'xrpl_transaction_hash': self.xrpl_transaction_hash,
            'executed_at': self.executed_at.isoformat() if self.executed_at else None
        }

