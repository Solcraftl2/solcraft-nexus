import { tokenizationService } from '../../frontend/src/services/xrplTokenizationService.js';

describe('validateAssetData', () => {
  test('throws on missing required fields', () => {
    expect(() => tokenizationService.validateAssetData({})).toThrow('Campo obbligatorio mancante');
  });

  test('throws on invalid supply', () => {
    const data = { name: 'House', symbol: 'HSE', location: 'Rome', faceValue: 100, totalSupply: 0 };
    expect(() => tokenizationService.validateAssetData(data)).toThrow('Total supply');
  });

  test('accepts valid data', () => {
    const data = { name: 'House', symbol: 'HSE', location: 'Rome', faceValue: 100, totalSupply: 10 };
    expect(() => tokenizationService.validateAssetData(data)).not.toThrow();
  });
});

describe('extractMPTIssuanceId', () => {
  test('throws when id missing', () => {
    const res = { result: { meta: { CreatedNodes: [] } } };
    expect(() => tokenizationService.extractMPTIssuanceId(res)).toThrow();
  });
});
