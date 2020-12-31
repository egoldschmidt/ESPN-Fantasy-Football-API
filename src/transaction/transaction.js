import _ from 'lodash';

import BaseObject from '../base-classes/base-object/base-object.js';

/**
 * Represents a player changing teams, for example due to add/drop, draft, or trade.
 *
 * @augments {BaseObject}
 */
class Transaction extends BaseObject {
  constructor(options = {}) {
    super(options);
  }

  static displayName = 'Transaction';

  /**
   * @typedef {object} Transaction~TransactionMap
   *
   * @property {number} id The id of the transaction in the ESPN universe.
   * @property {number} cost The cost of the transaction, only if applicable.
   * @property {number} scoringPeriodId The period in which this transaction took place.
   * @property {number} action The means by which the transaction is taking place
   *                           (DRAFT|ADD|DROP|TRADE).
   * @property {number} fromTeamId The team the player is leaving, if applicable.
   *                    0 indicates the player was "un-signed".
   * @property {number} toTeamId The team the player is joining, if applicable.
   *                    0 indicates the player was "un-signed".
   * @property {number} isKeeper True if the player was drafted as a keeper from the previous year.
   */

  /**
   * @type {Transaction~TransactionMap}
   */
  static responseMap = {
    id: 'id',
    cost: 'bidAmount',
    scoringPeriodId: 'scoringPeriodId',
    action: {
      key: 'items',
      manualParse: (responseData, data, constructorParams) => {
        const item = _.find(responseData, { playerId: constructorParams.playerId });
        return item.type;
      }
    },
    fromTeamId: {
      key: 'items',
      manualParse: (responseData, data, constructorParams) => {
        const item = _.find(responseData, { playerId: constructorParams.playerId });
        return item.fromTeamId;
      }
    },
    toTeamId: {
      key: 'items',
      manualParse: (responseData, data, constructorParams) => {
        const item = _.find(responseData, { playerId: constructorParams.playerId });
        return item.toTeamId;
      }
    },
    isKeeper: {
      key: 'items',
      manualParse: (responseData, data, constructorParams) => {
        const item = _.find(responseData, { playerId: constructorParams.playerId });
        return item.isKeeper;
      }
    }
  };

  onPopulate() {
    // Some hacky cleanup :-/
    if (this.action === 'DROP' || this.action === 'TRADE') {
      delete this.cost;
    }
    if (this.action !== 'DRAFT') {
      delete this.isKeeper;
    }
  }
}

export default Transaction;
