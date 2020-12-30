import BaseObject from '../base-classes/base-object/base-object.js';

import Transaction from './transaction.js';
import stafford from './testdata/stafford.json';
import mixon from './testdata/mixon.json';

describe('Transaction', () => {
  test('extends BaseObject', () => {
    const instance = new Transaction();
    expect(instance).toBeInstanceOf(BaseObject);
  });

  describe('responseMap', () => {
    describe('buildFromServer', () => {
      test('non-keeper draft', () => {
        const transaction = Transaction.buildFromServer(
          stafford.transactions[0],
          { playerId: stafford.playerId }
        );
        expect(transaction).toEqual({
          id: 'b286e9e8-e8f3-445b-90c8-eed71719e265',
          action: 'DRAFT',
          cost: 2,
          isKeeper: false,
          scoringPeriodId: 1,
          fromTeamId: 0,
          toTeamId: 2
        });
      });

      test('keeper draft', () => {
        const transaction = Transaction.buildFromServer(mixon.transactions[0], {
          playerId: mixon.playerId
        });
        expect(transaction).toEqual({
          id: 'cb0cd39a-8abe-4448-80f1-4fece3a4628f',
          action: 'DRAFT',
          cost: 38,
          isKeeper: true,
          scoringPeriodId: 1,
          fromTeamId: 0,
          toTeamId: 6
        });
      });

      test('waiver drop', () => {
        const transaction = Transaction.buildFromServer(mixon.transactions[1], {
          playerId: mixon.playerId
        });
        expect(transaction).toEqual({
          id: 'd7e9dc4f-9b55-49eb-aa9c-5719505648e0',
          action: 'DROP',
          scoringPeriodId: 15,
          fromTeamId: 6,
          toTeamId: 0
        });
      });

      test('free-agent add', () => {
        const transaction = Transaction.buildFromServer(mixon.transactions[2], {
          playerId: mixon.playerId
        });
        expect(transaction).toEqual({
          id: 'cfe3c723-800e-4761-8654-b0c7e2f01eee',
          action: 'ADD',
          cost: 0,
          scoringPeriodId: 16,
          fromTeamId: 0,
          toTeamId: 10
        });
      });

      test('trade', () => {
        const transaction = Transaction.buildFromServer(stafford.transactions[5], {
          playerId: stafford.playerId
        });
        expect(transaction).toEqual({
          id: '4f525632-bf58-4799-8596-926a6c6b8cdd',
          action: 'TRADE',
          scoringPeriodId: 6,
          fromTeamId: 2,
          toTeamId: 1
        });
      });
    });
  });
});
