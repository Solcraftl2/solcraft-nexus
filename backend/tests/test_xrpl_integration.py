from decimal import Decimal
import xrpl
from xrpl.wallet import Wallet
from src.services.wallet_service import XRPLService


class MockResponse:
    def __init__(self):
        self.result = {'hash': 'ABC123', 'Fee': '10', 'validated': True}

    def is_successful(self):
        return True


def test_send_xrp_with_mocked_wallet(monkeypatch):
    service = XRPLService()
    wallet = Wallet.create()

    def mock_get_account_info(address):
        return {'available_balance': Decimal('100'), 'balance': Decimal('100'), 'reserve': Decimal('10')}

    monkeypatch.setattr(service, 'get_account_info', mock_get_account_info)
    monkeypatch.setattr(xrpl.transaction, 'submit_and_wait', lambda tx, client, w: MockResponse())

    result = service.send_xrp(wallet, 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe', Decimal('1'))
    assert result['success'] is True
    assert result['hash'] == 'ABC123'
