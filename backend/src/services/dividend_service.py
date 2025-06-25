import schedule
import time
from datetime import datetime, timedelta
from decimal import Decimal
from src.models.user import db, User
from src.models.asset import Asset, Portfolio
from src.models.transaction import Transaction, DividendDistribution
from src.services.wallet_service import xrpl_service
import logging

logger = logging.getLogger(__name__)

class DividendService:
    def __init__(self):
        self.distribution_schedule = {}
        self.setup_scheduler()
    
    def setup_scheduler(self):
        """Setup automatic dividend distribution scheduler"""
        # Schedule monthly dividend distributions
        schedule.every().month.do(self.distribute_monthly_dividends)
        
        # Schedule quarterly distributions
        schedule.every(3).months.do(self.distribute_quarterly_dividends)
        
        # Schedule annual distributions
        schedule.every().year.do(self.distribute_annual_dividends)
        
        logger.info("Dividend scheduler initialized")
    
    def calculate_dividend_per_token(self, asset_id, total_revenue, distribution_percentage=80):
        """Calculate dividend amount per token for an asset"""
        try:
            asset = Asset.query.get(asset_id)
            if not asset:
                raise ValueError(f"Asset {asset_id} not found")
            
            # Calculate total dividend pool
            dividend_pool = Decimal(total_revenue) * (Decimal(distribution_percentage) / 100)
            
            # Calculate dividend per token
            if asset.total_supply > 0:
                dividend_per_token = dividend_pool / Decimal(asset.total_supply)
            else:
                dividend_per_token = Decimal('0')
            
            logger.info(f"Calculated dividend per token for asset {asset_id}: {dividend_per_token}")
            return dividend_per_token
            
        except Exception as e:
            logger.error(f"Error calculating dividend per token: {str(e)}")
            raise
    
    def distribute_dividends(self, asset_id, dividend_per_token, distribution_type='monthly'):
        """Distribute dividends to all token holders"""
        try:
            asset = Asset.query.get(asset_id)
            if not asset:
                raise ValueError(f"Asset {asset_id} not found")
            
            # Get all portfolios holding this asset
            portfolios = Portfolio.query.filter_by(asset_id=asset_id).all()
            
            total_distributed = Decimal('0')
            distributions = []
            
            for portfolio in portfolios:
                if portfolio.token_balance > 0:
                    # Calculate dividend amount for this holder
                    dividend_amount = Decimal(portfolio.token_balance) * dividend_per_token
                    
                    if dividend_amount > 0:
                        # Create dividend distribution record
                        distribution = DividendDistribution(
                            asset_id=asset_id,
                            user_id=portfolio.user_id,
                            amount=dividend_amount,
                            distribution_type=distribution_type,
                            status='pending',
                            distribution_date=datetime.utcnow()
                        )
                        
                        db.session.add(distribution)
                        distributions.append(distribution)
                        total_distributed += dividend_amount
            
            # Commit all distributions
            db.session.commit()
            
            # Process actual payments
            for distribution in distributions:
                self.process_dividend_payment(distribution)
            
            logger.info(f"Distributed {total_distributed} in dividends for asset {asset_id}")
            return total_distributed
            
        except Exception as e:
            logger.error(f"Error distributing dividends: {str(e)}")
            db.session.rollback()
            raise
    
    def process_dividend_payment(self, distribution):
        """Process actual dividend payment to user's wallet"""
        try:
            user = User.query.get(distribution.user_id)
            if not user or not user.wallet_address:
                logger.warning(f"User {distribution.user_id} has no wallet address")
                distribution.status = 'failed'
                distribution.failure_reason = 'No wallet address'
                db.session.commit()
                return False
            
            # Send XRP dividend to user's wallet
            result = xrpl_service.send_xrp(
                to_address=user.wallet_address,
                amount=float(distribution.amount),
                memo=f"Dividend from asset {distribution.asset_id}"
            )
            
            if result.get('success'):
                # Update distribution status
                distribution.status = 'completed'
                distribution.transaction_hash = result.get('transaction_hash')
                
                # Create transaction record
                transaction = Transaction(
                    user_id=distribution.user_id,
                    transaction_type='dividend_received',
                    amount=distribution.amount,
                    currency='XRP',
                    status='completed',
                    transaction_hash=result.get('transaction_hash'),
                    description=f"Dividend from asset {distribution.asset_id}"
                )
                
                db.session.add(transaction)
                db.session.commit()
                
                logger.info(f"Dividend payment completed for user {distribution.user_id}")
                return True
            else:
                distribution.status = 'failed'
                distribution.failure_reason = result.get('error', 'Payment failed')
                db.session.commit()
                return False
                
        except Exception as e:
            logger.error(f"Error processing dividend payment: {str(e)}")
            distribution.status = 'failed'
            distribution.failure_reason = str(e)
            db.session.commit()
            return False
    
    def distribute_monthly_dividends(self):
        """Distribute monthly dividends for all eligible assets"""
        try:
            # Get all assets with monthly dividend schedule
            assets = Asset.query.filter_by(dividend_frequency='monthly', status='active').all()
            
            for asset in assets:
                # Calculate revenue for the month (this would come from real data)
                monthly_revenue = self.get_asset_monthly_revenue(asset.id)
                
                if monthly_revenue > 0:
                    dividend_per_token = self.calculate_dividend_per_token(
                        asset.id, 
                        monthly_revenue, 
                        asset.dividend_percentage or 80
                    )
                    
                    self.distribute_dividends(asset.id, dividend_per_token, 'monthly')
            
            logger.info("Monthly dividend distribution completed")
            
        except Exception as e:
            logger.error(f"Error in monthly dividend distribution: {str(e)}")
    
    def distribute_quarterly_dividends(self):
        """Distribute quarterly dividends for all eligible assets"""
        try:
            assets = Asset.query.filter_by(dividend_frequency='quarterly', status='active').all()
            
            for asset in assets:
                quarterly_revenue = self.get_asset_quarterly_revenue(asset.id)
                
                if quarterly_revenue > 0:
                    dividend_per_token = self.calculate_dividend_per_token(
                        asset.id, 
                        quarterly_revenue, 
                        asset.dividend_percentage or 80
                    )
                    
                    self.distribute_dividends(asset.id, dividend_per_token, 'quarterly')
            
            logger.info("Quarterly dividend distribution completed")
            
        except Exception as e:
            logger.error(f"Error in quarterly dividend distribution: {str(e)}")
    
    def distribute_annual_dividends(self):
        """Distribute annual dividends for all eligible assets"""
        try:
            assets = Asset.query.filter_by(dividend_frequency='annual', status='active').all()
            
            for asset in assets:
                annual_revenue = self.get_asset_annual_revenue(asset.id)
                
                if annual_revenue > 0:
                    dividend_per_token = self.calculate_dividend_per_token(
                        asset.id, 
                        annual_revenue, 
                        asset.dividend_percentage or 80
                    )
                    
                    self.distribute_dividends(asset.id, dividend_per_token, 'annual')
            
            logger.info("Annual dividend distribution completed")
            
        except Exception as e:
            logger.error(f"Error in annual dividend distribution: {str(e)}")
    
    def get_asset_monthly_revenue(self, asset_id):
        """Get monthly revenue for an asset (placeholder - would integrate with real data)"""
        # This would integrate with real revenue tracking systems
        # For now, return simulated data
        return Decimal('1000.00')  # Simulated monthly revenue
    
    def get_asset_quarterly_revenue(self, asset_id):
        """Get quarterly revenue for an asset"""
        return Decimal('3000.00')  # Simulated quarterly revenue
    
    def get_asset_annual_revenue(self, asset_id):
        """Get annual revenue for an asset"""
        return Decimal('12000.00')  # Simulated annual revenue
    
    def get_user_dividend_history(self, user_id, limit=50):
        """Get dividend history for a user"""
        try:
            distributions = DividendDistribution.query.filter_by(
                user_id=user_id
            ).order_by(
                DividendDistribution.distribution_date.desc()
            ).limit(limit).all()
            
            return [dist.to_dict() for dist in distributions]
            
        except Exception as e:
            logger.error(f"Error getting dividend history: {str(e)}")
            return []
    
    def get_asset_dividend_summary(self, asset_id):
        """Get dividend summary for an asset"""
        try:
            total_distributed = db.session.query(
                db.func.sum(DividendDistribution.amount)
            ).filter_by(
                asset_id=asset_id,
                status='completed'
            ).scalar() or Decimal('0')
            
            distribution_count = DividendDistribution.query.filter_by(
                asset_id=asset_id,
                status='completed'
            ).count()
            
            last_distribution = DividendDistribution.query.filter_by(
                asset_id=asset_id,
                status='completed'
            ).order_by(
                DividendDistribution.distribution_date.desc()
            ).first()
            
            return {
                'total_distributed': float(total_distributed),
                'distribution_count': distribution_count,
                'last_distribution_date': last_distribution.distribution_date.isoformat() if last_distribution else None,
                'last_distribution_amount': float(last_distribution.amount) if last_distribution else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting dividend summary: {str(e)}")
            return {}
    
    def run_scheduler(self):
        """Run the dividend scheduler (should be called in a background process)"""
        while True:
            schedule.run_pending()
            time.sleep(3600)  # Check every hour

# Global dividend service instance
dividend_service = DividendService()

