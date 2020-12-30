import BaseObject from '../base-classes/base-object/base-object';

import Player from '../player/player';
import { parsePlayerStats } from '../player-stats/player-stats';

import {
  statSplitTypes,
  statSources,
  maxScoringPeriodId
} from '../constants.js';
import Transaction from '../transaction/transaction';

/* global PlayerStatsBundle */

/**
 * Represents the performance of a player over the course of a season.
 *
 * @augments {BaseObject}
 */
class PlayerSeason extends BaseObject {
  static displayName = 'PlayerSeason';

  /**
   * @typedef {object} PlayerSeason~PlayerSeasonMap
   *
   * @property {Player} player The player model representing the NFL player.
   * @property {number} seasonId The season during which this player played.
   * @property {PlayerStatsBundle} seasonActual The actual stats accrued this season.
   * @property {PlayerStatsBundle} seasonProjected The projected stats for this season.
   * @property {object.<string, PlayerStatsBundle>} weeklyActual The actual stats accrued this
   *                                                season, broken down by week.
   */

  /**
   * @type {PlayerSeason~PlayerSeasonMap}
   */
  static responseMap = {
    player: {
      key: 'player',
      manualParse: (responseData, data, constructorParams) => (
        Player.buildFromServer(data, constructorParams)
      )
    },
    seasonId: {
      key: 'player',
      manualParse: (responseData, data, constructorParams) => (
        constructorParams.seasonId
      )
    },
    seasonActual: {
      key: 'player',
      manualParse: (responseData, data, constructorParams) => {
        const params = {
          responseData: data,
          constructorParams,
          seasonId: constructorParams.seasonId,
          statSourceId: statSources.real,
          statSplitTypeId: statSplitTypes.season
        };
        return {
          points: parsePlayerStats({
            usesPoints: true,
            statKey: 'appliedStats',
            ...params
          }),
          stats: parsePlayerStats({
            usesPoints: false,
            statKey: 'stats',
            ...params
          })
        };
      }
    },
    seasonProjected: {
      key: 'player',
      manualParse: (responseData, data, constructorParams) => {
        const params = {
          responseData: data,
          constructorParams,
          seasonId: constructorParams.seasonId,
          statSourceId: statSources.projected,
          statSplitTypeId: statSplitTypes.season
        };
        return {
          points: parsePlayerStats({
            usesPoints: true,
            statKey: 'appliedStats',
            ...params
          }),
          stats: parsePlayerStats({
            usesPoints: false,
            statKey: 'stats',
            ...params
          })
        };
      }
    },
    weeklyActual: {
      key: 'player',
      manualParse: (responseData, data, constructorParams) => {
        const weeklyData = {};
        for (let i = 1; i <= maxScoringPeriodId; i += 1) {
          const params = {
            responseData: data,
            constructorParams,
            seasonId: constructorParams.seasonId,
            scoringPeriodId: i,
            statSourceId: statSources.real,
            statSplitTypeId: statSplitTypes.game
          };
          const points = parsePlayerStats({
            usesPoints: true,
            statKey: 'appliedStats',
            ...params
          });
          const stats = parsePlayerStats({
            usesPoints: false,
            statKey: 'stats',
            ...params
          });
          if (points || stats) {
            weeklyData[i] = { points, stats };
          }
        }
        return weeklyData;
      }
    },
    transactions: {
      key: 'transactions',
      manualParse: (responseData, data) => {
        if (!responseData) {
          return null;
        }
        return responseData.map((transaction) => (
          Transaction.buildFromServer(transaction, { playerId: data.player.id })
        ));
      }
    }
  };
}

export default PlayerSeason;
