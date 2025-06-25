from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db, User
from src.models.asset import Asset, TokenHolding, Portfolio
from src.models.transaction import Transaction
from src.services.tokenization_service import tokenization_service
from decimal import Decimal
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
tokenization_bp = Blueprint('tokenization', __name__)

@tokenization_bp.route('/assets', methods=['POST'])
@jwt_required()
def create_asset():
    """Create a new asset for tokenization"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        required_fields = ['name', 'symbol', 'asset_type', 'total_supply', 'estimated_value']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create new asset
        asset = Asset(
            name=data['name'],
            symbol=data['symbol'].upper(),
            description=data.get('description', ''),
            asset_type=data['asset_type'],
            total_supply=Decimal(str(data['total_supply'])),
            estimated_value=Decimal(str(data['estimated_value'])),
            revenue_model=data.get('revenue_model'),
            location=data.get('location'),
            issuer_id=current_user_id,
            status='draft',
            tokenization_status='pending',
            asset_metadata=data.get('metadata', {}),
            images=data.get('images', []),
            documents=data.get('documents', [])
        )
        
        db.session.add(asset)
        db.session.commit()
        
        return jsonify({
            'message': 'Asset created successfully',
            'asset': asset.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating asset: {str(e)}")
        return jsonify({'error': str(e)}), 500

@tokenization_bp.route('/assets', methods=['GET'])
@jwt_required()
def list_assets():
    """List user's assets"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        asset_type = request.args.get('asset_type')
        status = request.args.get('status')
        
        # Build query
        query = Asset.query.filter_by(issuer_id=current_user_id)
        
        if asset_type:
            query = query.filter_by(asset_type=asset_type)
        
        if status:
            query = query.filter_by(status=status)
        
        # Paginate results
        assets = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'assets': [asset.to_dict() for asset in assets.items],
            'pagination': {
                'page': assets.page,
                'pages': assets.pages,
                'per_page': assets.per_page,
                'total': assets.total,
                'has_next': assets.has_next,
                'has_prev': assets.has_prev
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing assets: {str(e)}")
        return jsonify({'error': str(e)}), 500

@tokenization_bp.route('/assets/<asset_id>', methods=['GET'])
@jwt_required()
def get_asset(asset_id):
    """Get specific asset details"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        asset = Asset.query.get(asset_id)
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404
        
        # Check if user has permission to view this asset
        if asset.issuer_id != current_user_id:
            # In the future, you might allow viewing of public assets
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({
            'asset': asset.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting asset: {str(e)}")
        return jsonify({'error': str(e)}), 500

@tokenization_bp.route('/assets/<asset_id>/tokenize', methods=['POST'])
@jwt_required()
def tokenize_asset(asset_id):
    """Tokenize an asset on XRP Ledger"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        asset = Asset.query.get(asset_id)
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404
        
        # Check permissions
        if asset.issuer_id != current_user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Check if already tokenized
        if asset.tokenization_status == 'completed':
            return jsonify({'error': 'Asset already tokenized'}), 409
        
        # Perform tokenization
        result = tokenization_service.tokenize_asset(asset_id, current_user_id)
        
        return jsonify({
            'message': 'Asset tokenized successfully',
            'tokenization': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error tokenizing asset: {str(e)}")
        return jsonify({'error': str(e)}), 500

@tokenization_bp.route('/tokens/<mpt_id>/mint', methods=['POST'])
@jwt_required()
def mint_tokens(mpt_id):
    """Mint additional tokens (issuer only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        required_fields = ['recipient', 'amount']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Find asset by MPT ID
        asset = Asset.query.filter_by(xrpl_token_id=mpt_id).first()
        if not asset:
            return jsonify({'error': 'Token not found'}), 404
        
        # Check if user is the issuer
        if asset.issuer_id != current_user_id:
            return jsonify({'error': 'Only token issuer can mint tokens'}), 403
        
        recipient = data['recipient']
        amount = Decimal(str(data['amount']))
        memo = data.get('memo')
        
        # For demo purposes, simulate minting
        result = {
            'success': True,
            'transaction_hash': f'demo_mint_{current_user_id}_{datetime.utcnow().timestamp()}',
            'mpt_id': mpt_id,
            'recipient': recipient,
            'amount_minted': amount
        }
        
        # Record transaction
        transaction = Transaction(
            transaction_type='mint',
            status='completed',
            user_id=current_user_id,
            asset_id=asset.id,
            amount=amount,
            xrpl_transaction_hash=result['transaction_hash'],
            notes=f"Minted {amount} {asset.symbol} to {recipient}",
            executed_at=datetime.utcnow(),
            confirmed_at=datetime.utcnow(),
            transaction_metadata={
                'recipient': recipient,
                'memo': memo
            }
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Tokens minted successfully',
            'mint_result': result
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error minting tokens: {str(e)}")
        return jsonify({'error': str(e)}), 500

@tokenization_bp.route('/tokens/<mpt_id>/transfer', methods=['POST'])
@jwt_required()
def transfer_tokens(mpt_id):
    """Transfer tokens to another address"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.wallet_address:
            return jsonify({'error': 'User has no wallet'}), 404
        
        data = request.get_json()
        required_fields = ['recipient', 'amount']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Find asset by MPT ID
        asset = Asset.query.filter_by(xrpl_token_id=mpt_id).first()
        if not asset:
            return jsonify({'error': 'Token not found'}), 404
        
        recipient = data['recipient']
        amount = Decimal(str(data['amount']))
        memo = data.get('memo')
        
        # For demo purposes, simulate transfer
        result = {
            'success': True,
            'transaction_hash': f'demo_transfer_{current_user_id}_{datetime.utcnow().timestamp()}',
            'mpt_id': mpt_id,
            'sender': user.wallet_address,
            'recipient': recipient,
            'amount_transferred': amount
        }
        
        # Record transaction
        transaction = Transaction(
            transaction_type='transfer',
            status='completed',
            user_id=current_user_id,
            asset_id=asset.id,
            amount=amount,
            xrpl_transaction_hash=result['transaction_hash'],
            notes=f"Transferred {amount} {asset.symbol} to {recipient}",
            executed_at=datetime.utcnow(),
            confirmed_at=datetime.utcnow(),
            transaction_metadata={
                'recipient': recipient,
                'memo': memo
            }
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Tokens transferred successfully',
            'transfer_result': result
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error transferring tokens: {str(e)}")
        return jsonify({'error': str(e)}), 500

@tokenization_bp.route('/tokens/<mpt_id>/info', methods=['GET'])
def get_token_info(mpt_id):
    """Get token information"""
    try:
        # Find asset by MPT ID
        asset = Asset.query.filter_by(xrpl_token_id=mpt_id).first()
        if not asset:
            return jsonify({'error': 'Token not found'}), 404
        
        # Get token info from blockchain (simulated for demo)
        token_info = {
            'mpt_id': mpt_id,
            'name': asset.name,
            'symbol': asset.symbol,
            'description': asset.description,
            'asset_type': asset.asset_type,
            'issuer': asset.xrpl_issuer_address,
            'total_supply': str(asset.total_supply),
            'estimated_value': str(asset.estimated_value),
            'created_at': asset.created_at.isoformat(),
            'tokenized_at': asset.tokenized_at.isoformat() if asset.tokenized_at else None
        }
        
        return jsonify({
            'token': token_info
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting token info: {str(e)}")
        return jsonify({'error': str(e)}), 500

@tokenization_bp.route('/portfolio/tokens', methods=['GET'])
@jwt_required()
def get_portfolio_tokens():
    """Get user's token holdings"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user's default portfolio
        portfolio = Portfolio.query.filter_by(user_id=current_user_id, is_default=True).first()
        if not portfolio:
            return jsonify({'error': 'Portfolio not found'}), 404
        
        # Get token holdings
        holdings = TokenHolding.query.filter_by(portfolio_id=portfolio.id).all()
        
        holdings_data = []
        for holding in holdings:
            asset = holding.asset
            holdings_data.append({
                'asset_id': asset.id,
                'mpt_id': asset.xrpl_token_id,
                'name': asset.name,
                'symbol': asset.symbol,
                'asset_type': asset.asset_type,
                'balance': str(holding.balance),
                'average_cost': str(holding.average_cost),
                'total_cost': str(holding.total_cost),
                'current_value': str(holding.current_value),
                'unrealized_pnl': str(holding.unrealized_pnl),
                'last_updated': holding.last_updated.isoformat()
            })
        
        return jsonify({
            'portfolio_id': portfolio.id,
            'holdings': holdings_data,
            'total_holdings': len(holdings_data)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting portfolio tokens: {str(e)}")
        return jsonify({'error': str(e)}), 500

@tokenization_bp.route('/marketplace/tokens', methods=['GET'])
def list_marketplace_tokens():
    """List available tokens in marketplace"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        asset_type = request.args.get('asset_type')
        
        # Build query for active, tokenized assets
        query = Asset.query.filter_by(status='active', tokenization_status='completed')
        
        if asset_type:
            query = query.filter_by(asset_type=asset_type)
        
        # Paginate results
        assets = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        marketplace_tokens = []
        for asset in assets.items:
            marketplace_tokens.append({
                'asset_id': asset.id,
                'mpt_id': asset.xrpl_token_id,
                'name': asset.name,
                'symbol': asset.symbol,
                'description': asset.description,
                'asset_type': asset.asset_type,
                'total_supply': str(asset.total_supply),
                'estimated_value': str(asset.estimated_value),
                'revenue_model': asset.revenue_model,
                'location': asset.location,
                'images': asset.images,
                'tokenized_at': asset.tokenized_at.isoformat() if asset.tokenized_at else None
            })
        
        return jsonify({
            'tokens': marketplace_tokens,
            'pagination': {
                'page': assets.page,
                'pages': assets.pages,
                'per_page': assets.per_page,
                'total': assets.total,
                'has_next': assets.has_next,
                'has_prev': assets.has_prev
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing marketplace tokens: {str(e)}")
        return jsonify({'error': str(e)}), 500

