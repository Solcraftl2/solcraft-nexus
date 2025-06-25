from enum import Enum
from datetime import datetime, timedelta
from src.models.user import db, User
from src.models.asset import Asset
import logging

logger = logging.getLogger(__name__)

class RoleType(Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MANAGER = "manager"
    VIEWER = "viewer"
    AUDITOR = "auditor"

class PermissionType(Enum):
    # Asset permissions
    CREATE_ASSET = "create_asset"
    EDIT_ASSET = "edit_asset"
    DELETE_ASSET = "delete_asset"
    VIEW_ASSET = "view_asset"
    
    # Financial permissions
    MANAGE_DIVIDENDS = "manage_dividends"
    VIEW_FINANCIALS = "view_financials"
    APPROVE_TRANSACTIONS = "approve_transactions"
    
    # User management
    INVITE_USERS = "invite_users"
    MANAGE_ROLES = "manage_roles"
    REMOVE_USERS = "remove_users"
    
    # Governance
    CREATE_PROPOSALS = "create_proposals"
    VOTE_PROPOSALS = "vote_proposals"
    
    # System
    VIEW_AUDIT_LOGS = "view_audit_logs"
    SYSTEM_ADMIN = "system_admin"

class Organization(db.Model):
    __tablename__ = 'organizations'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Settings
    max_members = db.Column(db.Integer, default=50)
    subscription_tier = db.Column(db.String(20), default='basic')  # basic, professional, enterprise
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    memberships = db.relationship('OrganizationMembership', backref='organization', lazy=True, cascade='all, delete-orphan')
    assets = db.relationship('Asset', backref='organization', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'max_members': self.max_members,
            'subscription_tier': self.subscription_tier,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class OrganizationMembership(db.Model):
    __tablename__ = 'organization_memberships'
    
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    role = db.Column(db.Enum(RoleType), nullable=False)
    status = db.Column(db.String(20), default='active')  # active, suspended, pending
    
    # Metadata
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    invited_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Constraints
    __table_args__ = (
        db.UniqueConstraint('organization_id', 'user_id', name='unique_org_membership'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'user_id': self.user_id,
            'role': self.role.value,
            'status': self.status,
            'joined_at': self.joined_at.isoformat(),
            'invited_by': self.invited_by
        }

class UserPermission(db.Model):
    __tablename__ = 'user_permissions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'))
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'))
    
    permission = db.Column(db.Enum(PermissionType), nullable=False)
    granted_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    granted_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)  # Optional expiration
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'organization_id': self.organization_id,
            'asset_id': self.asset_id,
            'permission': self.permission.value,
            'granted_by': self.granted_by,
            'granted_at': self.granted_at.isoformat(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'))
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'))
    
    action = db.Column(db.String(100), nullable=False)
    resource_type = db.Column(db.String(50), nullable=False)
    resource_id = db.Column(db.String(50))
    
    details = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(500))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'organization_id': self.organization_id,
            'asset_id': self.asset_id,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'details': self.details,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.isoformat()
        }

class MultiUserService:
    def __init__(self):
        self.role_permissions = {
            RoleType.OWNER: [
                PermissionType.CREATE_ASSET, PermissionType.EDIT_ASSET, PermissionType.DELETE_ASSET, PermissionType.VIEW_ASSET,
                PermissionType.MANAGE_DIVIDENDS, PermissionType.VIEW_FINANCIALS, PermissionType.APPROVE_TRANSACTIONS,
                PermissionType.INVITE_USERS, PermissionType.MANAGE_ROLES, PermissionType.REMOVE_USERS,
                PermissionType.CREATE_PROPOSALS, PermissionType.VOTE_PROPOSALS,
                PermissionType.VIEW_AUDIT_LOGS
            ],
            RoleType.ADMIN: [
                PermissionType.CREATE_ASSET, PermissionType.EDIT_ASSET, PermissionType.VIEW_ASSET,
                PermissionType.MANAGE_DIVIDENDS, PermissionType.VIEW_FINANCIALS, PermissionType.APPROVE_TRANSACTIONS,
                PermissionType.INVITE_USERS, PermissionType.MANAGE_ROLES,
                PermissionType.CREATE_PROPOSALS, PermissionType.VOTE_PROPOSALS,
                PermissionType.VIEW_AUDIT_LOGS
            ],
            RoleType.MANAGER: [
                PermissionType.EDIT_ASSET, PermissionType.VIEW_ASSET,
                PermissionType.VIEW_FINANCIALS, PermissionType.APPROVE_TRANSACTIONS,
                PermissionType.CREATE_PROPOSALS, PermissionType.VOTE_PROPOSALS
            ],
            RoleType.VIEWER: [
                PermissionType.VIEW_ASSET, PermissionType.VIEW_FINANCIALS,
                PermissionType.VOTE_PROPOSALS
            ],
            RoleType.AUDITOR: [
                PermissionType.VIEW_ASSET, PermissionType.VIEW_FINANCIALS,
                PermissionType.VIEW_AUDIT_LOGS
            ]
        }
    
    def create_organization(self, name, description, creator_id):
        """Create a new organization"""
        try:
            organization = Organization(
                name=name,
                description=description
            )
            
            db.session.add(organization)
            db.session.flush()  # Get the ID
            
            # Add creator as owner
            membership = OrganizationMembership(
                organization_id=organization.id,
                user_id=creator_id,
                role=RoleType.OWNER
            )
            
            db.session.add(membership)
            db.session.commit()
            
            # Log the action
            self.log_action(
                user_id=creator_id,
                organization_id=organization.id,
                action="create_organization",
                resource_type="organization",
                resource_id=str(organization.id),
                details={'name': name}
            )
            
            logger.info(f"Organization created: {organization.id} by user {creator_id}")
            return organization.to_dict()
            
        except Exception as e:
            logger.error(f"Error creating organization: {str(e)}")
            db.session.rollback()
            raise
    
    def invite_user_to_organization(self, organization_id, user_email, role, inviter_id):
        """Invite a user to an organization"""
        try:
            # Check if inviter has permission
            if not self.has_permission(inviter_id, PermissionType.INVITE_USERS, organization_id=organization_id):
                raise ValueError("Insufficient permissions to invite users")
            
            # Find user by email
            user = User.query.filter_by(email=user_email).first()
            if not user:
                raise ValueError("User not found")
            
            # Check if user is already a member
            existing_membership = OrganizationMembership.query.filter_by(
                organization_id=organization_id,
                user_id=user.id
            ).first()
            
            if existing_membership:
                raise ValueError("User is already a member of this organization")
            
            # Create membership
            membership = OrganizationMembership(
                organization_id=organization_id,
                user_id=user.id,
                role=RoleType(role),
                status='pending',
                invited_by=inviter_id
            )
            
            db.session.add(membership)
            db.session.commit()
            
            # Log the action
            self.log_action(
                user_id=inviter_id,
                organization_id=organization_id,
                action="invite_user",
                resource_type="organization_membership",
                resource_id=str(membership.id),
                details={'invited_user_id': user.id, 'role': role}
            )
            
            logger.info(f"User {user.id} invited to organization {organization_id}")
            return membership.to_dict()
            
        except Exception as e:
            logger.error(f"Error inviting user: {str(e)}")
            db.session.rollback()
            raise
    
    def accept_organization_invitation(self, membership_id, user_id):
        """Accept an organization invitation"""
        try:
            membership = OrganizationMembership.query.filter_by(
                id=membership_id,
                user_id=user_id,
                status='pending'
            ).first()
            
            if not membership:
                raise ValueError("Invitation not found or already processed")
            
            membership.status = 'active'
            db.session.commit()
            
            # Log the action
            self.log_action(
                user_id=user_id,
                organization_id=membership.organization_id,
                action="accept_invitation",
                resource_type="organization_membership",
                resource_id=str(membership.id)
            )
            
            logger.info(f"User {user_id} accepted invitation to organization {membership.organization_id}")
            return membership.to_dict()
            
        except Exception as e:
            logger.error(f"Error accepting invitation: {str(e)}")
            db.session.rollback()
            raise
    
    def change_user_role(self, organization_id, user_id, new_role, changer_id):
        """Change a user's role in an organization"""
        try:
            # Check if changer has permission
            if not self.has_permission(changer_id, PermissionType.MANAGE_ROLES, organization_id=organization_id):
                raise ValueError("Insufficient permissions to manage roles")
            
            membership = OrganizationMembership.query.filter_by(
                organization_id=organization_id,
                user_id=user_id
            ).first()
            
            if not membership:
                raise ValueError("User is not a member of this organization")
            
            old_role = membership.role.value
            membership.role = RoleType(new_role)
            db.session.commit()
            
            # Log the action
            self.log_action(
                user_id=changer_id,
                organization_id=organization_id,
                action="change_user_role",
                resource_type="organization_membership",
                resource_id=str(membership.id),
                details={'user_id': user_id, 'old_role': old_role, 'new_role': new_role}
            )
            
            logger.info(f"User {user_id} role changed from {old_role} to {new_role}")
            return membership.to_dict()
            
        except Exception as e:
            logger.error(f"Error changing user role: {str(e)}")
            db.session.rollback()
            raise
    
    def has_permission(self, user_id, permission, organization_id=None, asset_id=None):
        """Check if a user has a specific permission"""
        try:
            # Check explicit permissions first
            query = UserPermission.query.filter_by(
                user_id=user_id,
                permission=permission
            )
            
            if organization_id:
                query = query.filter_by(organization_id=organization_id)
            if asset_id:
                query = query.filter_by(asset_id=asset_id)
            
            explicit_permission = query.first()
            if explicit_permission:
                # Check if permission has expired
                if explicit_permission.expires_at and explicit_permission.expires_at < datetime.utcnow():
                    return False
                return True
            
            # Check role-based permissions
            if organization_id:
                membership = OrganizationMembership.query.filter_by(
                    organization_id=organization_id,
                    user_id=user_id,
                    status='active'
                ).first()
                
                if membership and permission in self.role_permissions.get(membership.role, []):
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking permission: {str(e)}")
            return False
    
    def grant_permission(self, user_id, permission, granter_id, organization_id=None, asset_id=None, expires_at=None):
        """Grant a specific permission to a user"""
        try:
            # Check if granter has permission to grant permissions
            if not self.has_permission(granter_id, PermissionType.MANAGE_ROLES, organization_id=organization_id):
                raise ValueError("Insufficient permissions to grant permissions")
            
            # Check if permission already exists
            existing = UserPermission.query.filter_by(
                user_id=user_id,
                permission=permission,
                organization_id=organization_id,
                asset_id=asset_id
            ).first()
            
            if existing:
                # Update existing permission
                existing.granted_by = granter_id
                existing.granted_at = datetime.utcnow()
                existing.expires_at = expires_at
            else:
                # Create new permission
                permission_obj = UserPermission(
                    user_id=user_id,
                    permission=PermissionType(permission),
                    organization_id=organization_id,
                    asset_id=asset_id,
                    granted_by=granter_id,
                    expires_at=expires_at
                )
                db.session.add(permission_obj)
            
            db.session.commit()
            
            # Log the action
            self.log_action(
                user_id=granter_id,
                organization_id=organization_id,
                asset_id=asset_id,
                action="grant_permission",
                resource_type="user_permission",
                details={'target_user_id': user_id, 'permission': permission}
            )
            
            logger.info(f"Permission {permission} granted to user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error granting permission: {str(e)}")
            db.session.rollback()
            raise
    
    def log_action(self, user_id, action, resource_type, resource_id=None, organization_id=None, asset_id=None, details=None, ip_address=None, user_agent=None):
        """Log an action for audit purposes"""
        try:
            audit_log = AuditLog(
                user_id=user_id,
                organization_id=organization_id,
                asset_id=asset_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                details=details,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            db.session.add(audit_log)
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Error logging action: {str(e)}")
    
    def get_user_organizations(self, user_id):
        """Get all organizations a user belongs to"""
        try:
            memberships = OrganizationMembership.query.filter_by(
                user_id=user_id,
                status='active'
            ).all()
            
            organizations = []
            for membership in memberships:
                org_data = membership.organization.to_dict()
                org_data['user_role'] = membership.role.value
                org_data['joined_at'] = membership.joined_at.isoformat()
                organizations.append(org_data)
            
            return organizations
            
        except Exception as e:
            logger.error(f"Error getting user organizations: {str(e)}")
            return []
    
    def get_organization_members(self, organization_id, requester_id):
        """Get all members of an organization"""
        try:
            # Check if requester has permission to view members
            if not self.has_permission(requester_id, PermissionType.VIEW_ASSET, organization_id=organization_id):
                raise ValueError("Insufficient permissions to view organization members")
            
            memberships = OrganizationMembership.query.filter_by(
                organization_id=organization_id,
                status='active'
            ).all()
            
            members = []
            for membership in memberships:
                user_data = {
                    'id': membership.user.id,
                    'email': membership.user.email,
                    'first_name': membership.user.first_name,
                    'last_name': membership.user.last_name,
                    'role': membership.role.value,
                    'joined_at': membership.joined_at.isoformat()
                }
                members.append(user_data)
            
            return members
            
        except Exception as e:
            logger.error(f"Error getting organization members: {str(e)}")
            return []
    
    def get_audit_logs(self, organization_id=None, asset_id=None, user_id=None, limit=100, requester_id=None):
        """Get audit logs with proper permission checking"""
        try:
            # Check if requester has permission to view audit logs
            if requester_id and not self.has_permission(requester_id, PermissionType.VIEW_AUDIT_LOGS, organization_id=organization_id):
                raise ValueError("Insufficient permissions to view audit logs")
            
            query = AuditLog.query
            
            if organization_id:
                query = query.filter_by(organization_id=organization_id)
            if asset_id:
                query = query.filter_by(asset_id=asset_id)
            if user_id:
                query = query.filter_by(user_id=user_id)
            
            logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
            
            return [log.to_dict() for log in logs]
            
        except Exception as e:
            logger.error(f"Error getting audit logs: {str(e)}")
            return []

# Global multi-user service instance
multi_user_service = MultiUserService()

