import BaseObject from '../base-classes/base-object/base-object';

import Player from '../player/player';
import PlayerStats from '../player-stats/player-stats';

import PlayerSeason from './player-season';

describe('PlayerSeason', () => {
  test('extends BaseObject', () => {
    const instance = new PlayerSeason();
    expect(instance).toBeInstanceOf(BaseObject);
  });

  describe('responseMap', () => {
    const buildPlayerSeason = (data, options) => PlayerSeason.buildFromServer(data, options);

    let data;
    let seasonActualStats;
    let seasonProjectedStats;
    let weeklyActualStats1;
    let weeklyActualStats2;
    let seasonId;

    beforeEach(() => {
      seasonId = 2018;
      seasonActualStats = {
        appliedStats: {
          24: 2.3,
          25: 6
        },
        seasonId,
        stats: {
          24: 3,
          25: 6.4
        },
        statSourceId: 0,
        statSplitTypeId: 0
      };
      seasonProjectedStats = {
        appliedStats: {
          24: 4.2,
          25: 1
        },
        seasonId,
        stats: {
          24: 3.2,
          25: 4
        },
        statSourceId: 1,
        statSplitTypeId: 0
      };
      weeklyActualStats1 = {
        appliedTotal: 3.1,
        appliedStats: {
          24: 1.1,
          25: 2,
        },
        seasonId,
        stats: {
          24: 1.4,
          25: 3,
        },
        scoringPeriodId: 15,
        statSourceId: 0,
        statSplitTypeId: 1,
      };
      weeklyActualStats2 = {
        appliedTotal: 5.2,
        appliedStats: {
          24: 2.2,
          25: 3,
        },
        seasonId,
        stats: {
          24: 1.8,
          25: 1,
        },
        scoringPeriodId: 16,
        statSourceId: 0,
        statSplitTypeId: 1,
      };

      data = {
        player: {
          stats: [
            seasonProjectedStats,
            seasonActualStats,
            weeklyActualStats1,
            weeklyActualStats2,
          ]
        }
      };
    });

    describe('player', () => {
      describe('manualParse', () => {
        test('returns a Player', () => {
          const player = buildPlayerSeason(data, { seasonId });
          expect(player.player).toBeInstanceOf(Player);
        });
      });
    });

    describe('seasonActual', () => {
      describe('manualParse', () => {
        test('maps actual points and stats to a PlayerStatsBundle instance', () => {
          const player = buildPlayerSeason(data, { seasonId });
          const expectedStats = PlayerStats.buildFromServer(
            seasonActualStats.stats, { usesPoints: false, seasonId }
          );
          const expectedPoints = PlayerStats.buildFromServer(
            seasonActualStats.appliedStats, { usesPoints: true, seasonId }
          );
          expect(player.seasonActual.stats).toEqual(expectedStats);
          expect(player.seasonActual.points).toEqual(expectedPoints);
        });
      });
    });

    describe('seasonProjected', () => {
      describe('manualParse', () => {
        test('maps projected points and stats to a PlayerStatsBundle instance', () => {
          const player = buildPlayerSeason(data, { seasonId });
          const expectedStats = PlayerStats.buildFromServer(
            seasonProjectedStats.stats, { usesPoints: false, seasonId }
          );
          const expectedPoints = PlayerStats.buildFromServer(
            seasonProjectedStats.appliedStats, { usesPoints: true, seasonId }
          );
          expect(player.seasonProjected.stats).toEqual(expectedStats);
          expect(player.seasonProjected.points).toEqual(expectedPoints);
        });
      });
    });

    describe('weeklyActual', () => {
      describe('manualParse', () => {
        test('maps weekly actual points and stats to an array of PlayerStatsBundle instances', () => {
          const player = buildPlayerSeason(data, { seasonId });
          expect(Object.keys(player.weeklyActual).length).toEqual(2);
          expect(player.weeklyActual[15].points.totalPoints).toEqual(3.1);
          expect(player.weeklyActual[16].points.totalPoints).toEqual(5.2);
        });
      });
    });
  });
});
