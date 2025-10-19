from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
from src.models.user import db, User
from src.models.asset import Asset, Portfolio
from src.models.transaction import Transaction
from src.services.multi_user_service import multi_user_service
import json
import logging

logger = logging.getLogger(__name__)

class ProposalType(Enum):
    ASSET_MANAGEMENT = "asset_management"
    DIVIDEND_POLICY = "dividend_policy"
    STRATEGIC_DECISION = "strategic_decision"
    EMERGENCY = "emergency"

class VoteChoice(Enum):
    YES = "yes"
    NO = "no"
    ABSTAIN = "abstain"

class Proposal(db.Model):
    __tablename__ = 'proposals'
    
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    proposal_type = db.Column(db.Enum(ProposalType), nullable=False)
    
    # Voting parameters
    voting_start = db.Column(db.DateTime, nullable=False)
    voting_end = db.Column(db.DateTime, nullable=False)
    quorum_required = db.Column(db.Decimal(5, 2), default=Decimal('50.00'))  # Percentage
    approval_threshold = db.Column(db.Decimal(5, 2), default=Decimal('50.00'))  # Percentage
    
    # Status
    status = db.Column(db.String(20), default='active')  # active, passed, rejected, expired
    
    # Results
    total_votes_cast = db.Column(db.Integer, default=0)
    total_voting_power = db.Column(db.Decimal(20, 8), default=Decimal('0'))
    yes_votes = db.Column(db.Decimal(20, 8), default=Decimal('0'))
    no_votes = db.Column(db.Decimal(20, 8), default=Decimal('0'))
    abstain_votes = db.Column(db.Decimal(20, 8), default=Decimal('0'))
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    votes = db.relationship('Vote', backref='proposal', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'creator_id': self.creator_id,
            'title': self.title,
            'description': self.description,
            'proposal_type': self.proposal_type.value,
            'voting_start': self.voting_start.isoformat(),
            'voting_end': self.voting_end.isoformat(),
            'quorum_required': float(self.quorum_required),
            'approval_threshold': float(self.approval_threshold),
            'status': self.status,
            'total_votes_cast': self.total_votes_cast,
            'total_voting_power': float(self.total_voting_power),
            'yes_votes': float(self.yes_votes),
            'no_votes': float(self.no_votes),
            'abstain_votes': float(self.abstain_votes),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Vote(db.Model):
    __tablename__ = 'votes'
    
    id = db.Column(db.Integer, primary_key=True)
    proposal_id = db.Column(db.Integer, db.ForeignKey('proposals.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    choice = db.Column(db.Enum(VoteChoice), nullable=False)
    voting_power = db.Column(db.Decimal(20, 8), nullable=False)  # Based on token holdings
    
    # Metadata
    voted_at = db.Column(db.DateTime, default=datetime.utcnow)
    transaction_hash = db.Column(db.String(100))  # Optional blockchain proof
    
    # Constraints
    __table_args__ = (
        db.UniqueConstraint('proposal_id', 'user_id', name='unique_vote_per_proposal'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'proposal_id': self.proposal_id,
            'user_id': self.user_id,
            'choice': self.choice.value,
            'voting_power': float(self.voting_power),
            'voted_at': self.voted_at.isoformat(),
            'transaction_hash': self.transaction_hash
        }

class GovernanceService:
    def __init__(self):
        self.min_proposal_threshold = Decimal('1.00')  # Minimum % of tokens to create proposal
    
    def create_proposal(self, asset_id, creator_id, title, description, proposal_type, 
                       voting_duration_days=7, quorum_required=50, approval_threshold=50):
        """Create a new governance proposal"""
        try:
            # Verify creator has enough tokens to create proposal
            portfolio = Portfolio.query.filter_by(
                asset_id=asset_id, 
                user_id=creator_id
            ).first()
            
            if not portfolio:
                raise ValueError("User does not hold tokens for this asset")
            
            asset = Asset.query.get(asset_id)
            if not asset:
                raise ValueError("Asset not found")
            
            # Check if user has minimum threshold to create proposal
            user_percentage = (Decimal(portfolio.token_balance) / Decimal(asset.total_supply)) * 100
            if user_percentage < self.min_proposal_threshold:
                raise ValueError(f"Minimum {self.min_proposal_threshold}% of tokens required to create proposal")
            
            # Create proposal
            voting_start = datetime.utcnow()
            voting_end = voting_start + timedelta(days=voting_duration_days)
            
            proposal = Proposal(
                asset_id=asset_id,
                creator_id=creator_id,
                title=title,
                description=description,
                proposal_type=ProposalType(proposal_type),
                voting_start=voting_start,
                voting_end=voting_end,
                quorum_required=Decimal(str(quorum_required)),
                approval_threshold=Decimal(str(approval_threshold))
            )
            
            db.session.add(proposal)
            db.session.commit()
            
            logger.info(f"Proposal created: {proposal.id} for asset {asset_id}")
            return proposal.to_dict()
            
        except Exception as e:
            logger.error(f"Error creating proposal: {str(e)}")
            db.session.rollback()
            raise
    
    def cast_vote(self, proposal_id, user_id, choice):
        """Cast a vote on a proposal"""
        try:
            proposal = Proposal.query.get(proposal_id)
            if not proposal:
                raise ValueError("Proposal not found")
            
            # Check if voting is active
            now = datetime.utcnow()
            if now < proposal.voting_start:
                raise ValueError("Voting has not started yet")
            if now > proposal.voting_end:
                raise ValueError("Voting has ended")
            if proposal.status != 'active':
                raise ValueError("Proposal is not active")
            
            # Check if user already voted
            existing_vote = Vote.query.filter_by(
                proposal_id=proposal_id,
                user_id=user_id
            ).first()
            
            if existing_vote:
                raise ValueError("User has already voted on this proposal")
            
            # Get user's voting power (token balance)
            portfolio = Portfolio.query.filter_by(
                asset_id=proposal.asset_id,
                user_id=user_id
            ).first()
            
            if not portfolio or portfolio.token_balance <= 0:
                raise ValueError("User does not hold tokens for this asset")
            
            voting_power = Decimal(portfolio.token_balance)
            
            # Create vote
            vote = Vote(
                proposal_id=proposal_id,
                user_id=user_id,
                choice=VoteChoice(choice),
                voting_power=voting_power
            )
            
            db.session.add(vote)
            
            # Update proposal vote counts
            proposal.total_votes_cast += 1
            proposal.total_voting_power += voting_power
            
            if choice == 'yes':
                proposal.yes_votes += voting_power
            elif choice == 'no':
                proposal.no_votes += voting_power
            elif choice == 'abstain':
                proposal.abstain_votes += voting_power
            
            db.session.commit()
            
            # Check if proposal should be finalized
            self.check_proposal_completion(proposal_id)
            
            logger.info(f"Vote cast: {vote.id} for proposal {proposal_id}")
            return vote.to_dict()
            
        except Exception as e:
            logger.error(f"Error casting vote: {str(e)}")
            db.session.rollback()
            raise
    
    def check_proposal_completion(self, proposal_id):
        """Check if a proposal should be finalized"""
        try:
            proposal = Proposal.query.get(proposal_id)
            if not proposal or proposal.status != 'active':
                return
            
            asset = Asset.query.get(proposal.asset_id)
            if not asset:
                return
            
            # Check if voting period has ended
            now = datetime.utcnow()
            if now > proposal.voting_end:
                self.finalize_proposal(proposal_id)
                return
            
            # Check if all tokens have voted (early completion)
            total_supply = Decimal(asset.total_supply)
            if proposal.total_voting_power >= total_supply:
                self.finalize_proposal(proposal_id)
                return
            
        except Exception as e:
            logger.error(f"Error checking proposal completion: {str(e)}")
    
    def finalize_proposal(self, proposal_id):
        """Finalize a proposal and determine the result"""
        try:
            proposal = Proposal.query.get(proposal_id)
            if not proposal or proposal.status != 'active':
                return
            
            asset = Asset.query.get(proposal.asset_id)
            if not asset:
                return
            
            total_supply = Decimal(asset.total_supply)
            
            # Calculate participation rate
            participation_rate = (proposal.total_voting_power / total_supply) * 100
            
            # Check quorum
            if participation_rate < proposal.quorum_required:
                proposal.status = 'rejected'
                logger.info(f"Proposal {proposal_id} rejected: quorum not met ({participation_rate}% < {proposal.quorum_required}%)")
            else:
                # Calculate approval rate (excluding abstentions)
                total_decisive_votes = proposal.yes_votes + proposal.no_votes
                if total_decisive_votes > 0:
                    approval_rate = (proposal.yes_votes / total_decisive_votes) * 100
                    
                    if approval_rate >= proposal.approval_threshold:
                        proposal.status = 'passed'
                        logger.info(f"Proposal {proposal_id} passed: {approval_rate}% approval")
                        
                        # Execute proposal if it passed
                        self.execute_proposal(proposal)
                    else:
                        proposal.status = 'rejected'
                        logger.info(f"Proposal {proposal_id} rejected: insufficient approval ({approval_rate}% < {proposal.approval_threshold}%)")
                else:
                    proposal.status = 'rejected'
                    logger.info(f"Proposal {proposal_id} rejected: no decisive votes")
            
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Error finalizing proposal: {str(e)}")
            db.session.rollback()
    
    def execute_proposal(self, proposal):
        """Execute a passed proposal"""
        try:
            logger.info(
                f"Executing proposal {proposal.id} of type {proposal.proposal_type.value}"
            )

            asset = Asset.query.get(proposal.asset_id)
            if not asset:
                logger.error(
                    f"Asset {proposal.asset_id} not found for proposal {proposal.id}"
                )
                return

            details = {}
            try:
                details = json.loads(proposal.description)
            except Exception:
                pass

            if proposal.proposal_type == ProposalType.DIVIDEND_POLICY:
                freq = details.get("dividend_frequency")
                next_date = details.get("next_dividend_date")
                if freq:
                    asset.dividend_frequency = freq
                if next_date:
                    try:
                        asset.next_dividend_date = datetime.fromisoformat(next_date)
                    except Exception:
                        logger.warning("Invalid next_dividend_date format")

                db.session.commit()
                multi_user_service.log_action(
                    user_id=proposal.creator_id,
                    action="update_dividend_policy",
                    resource_type="asset",
                    resource_id=asset.id,
                    asset_id=asset.id,
                    details=details,
                )

            elif proposal.proposal_type == ProposalType.ASSET_MANAGEMENT:
                status = details.get("status")
                price = details.get("current_price")
                if status:
                    asset.status = status
                if price is not None:
                    try:
                        asset.current_price = Decimal(str(price))
                        asset.calculate_market_cap()
                    except Exception:
                        logger.warning("Invalid current_price value")

                db.session.commit()
                multi_user_service.log_action(
                    user_id=proposal.creator_id,
                    action="asset_management_update",
                    resource_type="asset",
                    resource_id=asset.id,
                    asset_id=asset.id,
                    details=details,
                )

            elif proposal.proposal_type == ProposalType.STRATEGIC_DECISION:
                value = details.get("estimated_value")
                revenue = details.get("revenue_model")
                if value is not None:
                    try:
                        asset.estimated_value = Decimal(str(value))
                    except Exception:
                        logger.warning("Invalid estimated_value")
                if revenue:
                    asset.revenue_model = revenue

                db.session.commit()
                multi_user_service.log_action(
                    user_id=proposal.creator_id,
                    action="strategic_decision",
                    resource_type="asset",
                    resource_id=asset.id,
                    asset_id=asset.id,
                    details=details,
                )

            elif proposal.proposal_type == ProposalType.EMERGENCY:
                asset.status = "suspended"
                db.session.commit()
                multi_user_service.log_action(
                    user_id=proposal.creator_id,
                    action="emergency_action",
                    resource_type="asset",
                    resource_id=asset.id,
                    asset_id=asset.id,
                    details={"action": "suspend_asset"},
                )
            
        except Exception as e:
            logger.error(f"Error executing proposal: {str(e)}")
    
    def get_asset_proposals(self, asset_id, status=None, limit=50):
        """Get proposals for an asset"""
        try:
            query = Proposal.query.filter_by(asset_id=asset_id)
            
            if status:
                query = query.filter_by(status=status)
            
            proposals = query.order_by(
                Proposal.created_at.desc()
            ).limit(limit).all()
            
            return [proposal.to_dict() for proposal in proposals]
            
        except Exception as e:
            logger.error(f"Error getting asset proposals: {str(e)}")
            return []
    
    def get_user_votes(self, user_id, limit=50):
        """Get votes cast by a user"""
        try:
            votes = Vote.query.filter_by(
                user_id=user_id
            ).order_by(
                Vote.voted_at.desc()
            ).limit(limit).all()
            
            return [vote.to_dict() for vote in votes]
            
        except Exception as e:
            logger.error(f"Error getting user votes: {str(e)}")
            return []
    
    def get_proposal_details(self, proposal_id):
        """Get detailed information about a proposal"""
        try:
            proposal = Proposal.query.get(proposal_id)
            if not proposal:
                return None
            
            # Get vote breakdown
            votes = Vote.query.filter_by(proposal_id=proposal_id).all()
            vote_breakdown = {
                'yes': [],
                'no': [],
                'abstain': []
            }
            
            for vote in votes:
                vote_data = vote.to_dict()
                vote_breakdown[vote.choice.value].append(vote_data)
            
            proposal_data = proposal.to_dict()
            proposal_data['vote_breakdown'] = vote_breakdown
            
            return proposal_data
            
        except Exception as e:
            logger.error(f"Error getting proposal details: {str(e)}")
            return None
    
    def get_voting_power(self, user_id, asset_id):
        """Get user's voting power for an asset"""
        try:
            portfolio = Portfolio.query.filter_by(
                user_id=user_id,
                asset_id=asset_id
            ).first()
            
            if not portfolio:
                return 0
            
            return float(portfolio.token_balance)
            
        except Exception as e:
            logger.error(f"Error getting voting power: {str(e)}")
            return 0

# Global governance service instance
governance_service = GovernanceService()

