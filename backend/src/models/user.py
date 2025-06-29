from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    """User model for SolCraft Nexus platform"""
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Profile information
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    email_verified = db.Column(db.Boolean, default=False)
    
    # Account type and status
    account_type = db.Column(db.String(20), nullable=False, default='individual')  # individual, organization
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, active, suspended, closed
    
    # KYC and verification
    kyc_status = db.Column(db.String(20), nullable=False, default='not_started')  # not_started, pending, approved, rejected
    kyc_level = db.Column(db.String(20), default='basic')  # basic, enhanced, premium
    verification_documents = db.Column(db.JSON)
    
    # Wallet information
    wallet_address = db.Column(db.String(255), unique=True, index=True)
    wallet_type = db.Column(db.String(20), default='custodial')  # custodial, non_custodial
    
    # Security settings
    mfa_enabled = db.Column(db.Boolean, default=False)
    mfa_secret = db.Column(db.String(255))
    last_login = db.Column(db.DateTime)
    login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime)
    
    # Preferences
    language = db.Column(db.String(10), default='en')
    timezone = db.Column(db.String(50), default='UTC')
    notification_preferences = db.Column(db.JSON, default=lambda: {
        'email_notifications': True,
        'sms_notifications': False,
        'push_notifications': True
    })
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    portfolios = db.relationship('Portfolio', backref='user', lazy=True, cascade='all, delete-orphan')
    user_transactions = db.relationship('Transaction', foreign_keys='Transaction.user_id', backref='user', lazy=True)
    counterparty_transactions = db.relationship('Transaction', foreign_keys='Transaction.counterparty_id', backref='counterparty', lazy=True)
    
    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def is_active(self):
        """Check if user account is active"""
        return self.status == 'active'
    
    def is_kyc_approved(self):
        """Check if user KYC is approved"""
        return self.kyc_status == 'approved'
    
    def can_trade(self):
        """Check if user can perform trading operations"""
        return self.is_active() and self.is_kyc_approved()
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary"""
        data = {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'email_verified': self.email_verified,
            'account_type': self.account_type,
            'status': self.status,
            'kyc_status': self.kyc_status,
            'kyc_level': self.kyc_level,
            'wallet_address': self.wallet_address,
            'wallet_type': self.wallet_type,
            'language': self.language,
            'timezone': self.timezone,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_sensitive:
            data.update({
                'mfa_enabled': self.mfa_enabled,
                'last_login': self.last_login.isoformat() if self.last_login else None,
                'notification_preferences': self.notification_preferences
            })
        
        return data

class Organization(db.Model):
    """Organization model for business accounts"""
    __tablename__ = 'organizations'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    legal_name = db.Column(db.String(255), nullable=False)
    registration_number = db.Column(db.String(100))
    tax_id = db.Column(db.String(100))
    
    # Address information
    address_line1 = db.Column(db.String(255))
    address_line2 = db.Column(db.String(255))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    postal_code = db.Column(db.String(20))
    country = db.Column(db.String(100))
    
    # Contact information
    website = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    
    # Verification and compliance
    verification_status = db.Column(db.String(20), default='pending')  # pending, verified, rejected
    compliance_documents = db.Column(db.JSON)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    members = db.relationship('OrganizationMember', backref='organization', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Organization {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'legal_name': self.legal_name,
            'registration_number': self.registration_number,
            'website': self.website,
            'phone': self.phone,
            'verification_status': self.verification_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class OrganizationMember(db.Model):
    """Organization membership model"""
    __tablename__ = 'organization_members'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    organization_id = db.Column(db.String(36), db.ForeignKey('organizations.id'), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='member')  # admin, manager, member, viewer
    status = db.Column(db.String(20), nullable=False, default='active')  # active, inactive, pending
    
    # Permissions
    permissions = db.Column(db.JSON, default=lambda: {
        'can_view_assets': True,
        'can_create_assets': False,
        'can_edit_assets': False,
        'can_delete_assets': False,
        'can_manage_members': False,
        'can_view_financials': False
    })
    
    # Timestamps
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='organization_memberships')
    
    def __repr__(self):
        return f'<OrganizationMember {self.user_id} in {self.organization_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'organization_id': self.organization_id,
            'role': self.role,
            'status': self.status,
            'permissions': self.permissions,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None
        }

