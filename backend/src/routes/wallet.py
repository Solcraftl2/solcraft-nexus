from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db, User
from src.models.transaction import Transaction
from src.services.wallet_service import xrpl_service
from src.services.secure_wallet_service import secure_wallet_service
from src.services.ethereum_service import ethereum_service
from src.config import Config
from src.services.transaction_optimization_service import transaction_optimization_service
from src.services.blockchain_notification_service import blockchain_notification_service
from decimal import Decimal
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
wallet_bp = Blueprint('wallet', __name__)

@wallet_bp.route('/wallet/create', methods=['POST'])
@jwt_required()
def create_wallet():
    """Create a custodial wallet for the user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.wallet_address:
            return jsonify({'error': 'User already has a wallet'}), 409
        
        # Create custodial wallet
        wallet_data = wallet_service.create_custodial_wallet(current_user_id)
        
        # Update user record
        user.wallet_address = wallet_data['address']
        user.wallet_type = wallet_data['wallet_type']
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Wallet created successfully',
            'wallet': {
                'address': wallet_data['address'],
                'type': wallet_data['wallet_type']
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating wallet: {str(e)}")
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/wallet/connect', methods=['POST'])
@jwt_required()
def connect_wallet():
    """Connect an external wallet to user account"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        if not data.get('address'):
            return jsonify({'error': 'Wallet address is required'}), 400
        
        # Connect external wallet
        wallet_data = wallet_service.connect_external_wallet(current_user_id, data['address'])
        
        # Update user record
        user.wallet_address = wallet_data['address']
        user.wallet_type = wallet_data['wallet_type']
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Wallet connected successfully',
            'wallet': {
                'address': wallet_data['address'],
                'type': wallet_data['wallet_type']
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error connecting wallet: {str(e)}")
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/wallet/balance', methods=['GET'])
@jwt_required()
def get_wallet_balance():
    """Get wallet balance and token holdings"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.wallet_address:
            return jsonify({'error': 'User has no wallet'}), 404
        
        # Get wallet balance
        balance_data = wallet_service.get_wallet_balance(user.wallet_address)
        
        return jsonify({
            'wallet': balance_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting wallet balance: {str(e)}")
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/wallet/transactions', methods=['GET'])
@jwt_required()
def get_wallet_transactions():
    """Get wallet transaction history"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.wallet_address:
            return jsonify({'error': 'User has no wallet'}), 404
        
        limit = min(request.args.get('limit', 20, type=int), 100)
        
        # Get transaction history
        transactions = wallet_service.get_transaction_history(user.wallet_address, limit)
        
        return jsonify({
            'transactions': transactions,
            'count': len(transactions)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting wallet transactions: {str(e)}")
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/crypto/send', methods=['POST'])
@jwt_required()
def send_crypto():
    """Send cryptocurrency to another address"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.wallet_address:
            return jsonify({'error': 'User has no wallet'}), 404
        
        if user.wallet_type != 'custodial':
            return jsonify({'error': 'Only custodial wallets can send via API'}), 403
        
        data = request.get_json()
        required_fields = ['destination', 'amount', 'currency']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        destination = data['destination']
        amount = Decimal(str(data['amount']))
        currency = data['currency'].upper()
        destination_tag = data.get('destination_tag')
        memo = data.get('memo')
        
        transaction = Transaction(
            transaction_type='send',
            status='pending',
            user_id=current_user_id,
            amount=amount,
            total_value=amount,
            notes=f"Sending {amount} {currency} to {destination}",
            executed_at=datetime.utcnow(),
            transaction_metadata={
                'destination': destination,
                'currency': currency,
                'destination_tag': destination_tag,
                'memo': memo
            }
        )
        db.session.add(transaction)
        db.session.commit()

        if currency == 'XRP':
            if not xrpl_service.validate_address(destination):
                transaction.status = 'failed'
                db.session.commit()
                return jsonify({'error': 'Invalid destination address'}), 400

            wallet = secure_wallet_service.get_wallet_for_transaction(current_user_id)
            sender_info = xrpl_service.get_account_info(wallet.address)
            if sender_info['available_balance'] < amount:
                transaction.status = 'failed'
                db.session.commit()
                return jsonify({'error': 'Insufficient balance'}), 400

            tx_result = xrpl_service.send_xrp(wallet, destination, amount, destination_tag, memo)
            transaction.fee = tx_result.get('fee', Decimal('0'))
            transaction.xrpl_transaction_hash = tx_result['hash']
            transaction.xrpl_ledger_index = tx_result.get('ledger_index')
            transaction.status = 'completed' if tx_result['success'] else 'failed'
            transaction.confirmed_at = datetime.utcnow()
            transaction.notes = f"Sent {amount} XRP to {destination}"
            db.session.commit()
            transaction_result = tx_result
        elif currency == 'ETH':
            if not ethereum_service.web3.is_address(destination):
                transaction.status = 'failed'
                db.session.commit()
                return jsonify({'error': 'Invalid destination address'}), 400

            eth_pk = Config.ETH_PRIVATE_KEY
            eth_address = Config.ETH_ADDRESS
            if not eth_pk or not eth_address:
                transaction.status = 'failed'
                db.session.commit()
                return jsonify({'error': 'Ethereum wallet not configured'}), 500

            balance = ethereum_service.get_balance(eth_address)
            est_fee = Decimal(ethereum_service.web3.from_wei(21000 * ethereum_service.web3.eth.gas_price, 'ether'))
            if balance < amount + est_fee:
                transaction.status = 'failed'
                db.session.commit()
                return jsonify({'error': 'Insufficient ETH balance'}), 400

            tx_result = ethereum_service.send_eth(eth_pk, destination, amount)
            transaction.fee = tx_result.get('fee', Decimal('0'))
            transaction.xrpl_transaction_hash = tx_result['hash']
            transaction.status = 'completed' if tx_result['success'] else 'failed'
            transaction.confirmed_at = datetime.utcnow()
            transaction.notes = f"Sent {amount} ETH to {destination}"
            db.session.commit()
            transaction_result = tx_result
        else:
            transaction.status = 'failed'
            db.session.commit()
            return jsonify({'error': 'Unsupported currency'}), 400

        return jsonify({
            'message': 'Transaction sent successfully',
            'transaction': transaction_result
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error sending crypto: {str(e)}")
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/crypto/receive', methods=['POST'])
@jwt_required()
def generate_receive_address():
    """Generate receive address and QR code for receiving crypto"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.wallet_address:
            return jsonify({'error': 'User has no wallet'}), 404
        
        data = request.get_json() or {}
        currency = data.get('currency', 'XRP').upper()
        amount = data.get('amount')
        destination_tag = data.get('destination_tag')
        
        # Generate receive information
        receive_info = {
            'address': user.wallet_address,
            'currency': currency,
            'destination_tag': destination_tag,
            'qr_data': f"xrpl:{user.wallet_address}"
        }
        
        if amount:
            receive_info['amount'] = str(amount)
            receive_info['qr_data'] += f"?amount={amount}"
        
        if destination_tag:
            separator = '&' if '?' in receive_info['qr_data'] else '?'
            receive_info['qr_data'] += f"{separator}dt={destination_tag}"
        
        return jsonify({
            'receive_info': receive_info
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating receive address: {str(e)}")
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/crypto/estimate-fee', methods=['GET'])
@jwt_required()
def estimate_transaction_fee():
    """Estimate transaction fee"""
    try:
        currency = request.args.get('currency', 'XRP').upper()
        
        if currency == 'XRP':
            fee = xrpl_service.estimate_fee()
        else:
            # Token transfers typically have the same base fee
            fee = xrpl_service.estimate_fee()
        
        return jsonify({
            'currency': currency,
            'estimated_fee': str(fee),
            'fee_currency': 'XRP'  # Fees are always paid in XRP
        }), 200
        
    except Exception as e:
        logger.error(f"Error estimating fee: {str(e)}")
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/crypto/validate-address', methods=['POST'])
@jwt_required()
def validate_address():
    """Validate a cryptocurrency address"""
    try:
        data = request.get_json()
        if not data.get('address'):
            return jsonify({'error': 'Address is required'}), 400
        
        address = data['address']
        is_valid = xrpl_service.validate_address(address)
        
        return jsonify({
            'address': address,
            'is_valid': is_valid,
            'network': 'XRP Ledger'
        }), 200
        
    except Exception as e:
        logger.error(f"Error validating address: {str(e)}")
        return jsonify({'error': str(e)}), 500

