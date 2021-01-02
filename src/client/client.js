import axios from 'axios';
import _ from 'lodash';

import Boxscore from '../boxscore/boxscore';
import FreeAgentPlayer from '../free-agent-player/free-agent-player';
import League from '../league/league';
import NFLGame from '../nfl-game/nfl-game';
import PlayerSeason from '../player-season/player-season';
import Player from '../player/player';
import Team from '../team/team';

axios.defaults.baseURL = 'https://fantasy.espn.com/apis/v3/games/ffl/seasons/';

/**
 * Provides functionality to make a variety of API calls to ESPN for a given fantasy football
 * league. This class should be used by consuming projects.
 *
 * @class
 */
class Client {
  constructor(options = {}) {
    this.leagueId = options.leagueId;

    this.setCookies({ espnS2: options.espnS2, SWID: options.SWID });
  }

  /**
   * Set cookies from ESPN for interacting with private leagues in NodeJS. Both cookie smust be
   * provided to be set. See the README for instructions on how to find these cookies.
   *
   * @param {object} options Required options object.
   * @param {string} options.espnS2 The value of the `espn_s2` cookie key:value pair to auth with.
   * @param {string} options.SWID The value of the `SWID` cookie key:value pair to auth with.
   */
  setCookies({ espnS2, SWID }) {
    if (espnS2 && SWID) {
      this.espnS2 = espnS2;
      this.SWID = SWID;
    }
  }

  /**
   * Returns all boxscores for a week.
   *
   * NOTE: Due to the way ESPN populates data, both the `scoringPeriodId` and `matchupPeriodId` are
   * required and must correspond with each other correctly.
   *
   * @param  {object} options Required options object.
   * @param  {number} options.seasonId The season in which the boxscore occurs.
   * @param  {number} options.matchupPeriodId The matchup period in which the boxscore occurs.
   * @param  {number} options.scoringPeriodId The scoring period in which the boxscore occurs.
   * @returns {Boxscore[]} All boxscores for the week
   */
  getBoxscoreForWeek({ seasonId, matchupPeriodId, scoringPeriodId }) {
    const route = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: `?view=mMatchup&view=mMatchupScore&scoringPeriodId=${scoringPeriodId}`
    });

    return axios.get(route, this._buildAxiosConfig()).then((response) => {
      const schedule = _.get(response.data, 'schedule');
      const data = _.filter(schedule, { matchupPeriodId });

      return _.map(data, (matchup) => (
        Boxscore.buildFromServer(matchup, { leagueId: this.leagueId, seasonId })
      ));
    });
  }

  /**
   * Returns boxscores WITHOUT ROSTERS for PREVIOUS seasons. Useful for pulling historical
   * scoreboards.
   *
   * NOTE: This route will error for the current season, as ESPN only exposes this data for previous
   * seasons.
   *
   * NOTE: Due to the way ESPN populates data, both the `scoringPeriodId` and `matchupPeriodId` are
   * required and must correspond with each other correctly.
   *
   * @param  {object} options Required options object.
   * @param  {number} options.seasonId The season in which the boxscore occurs.
   * @param  {number} options.matchupPeriodId The matchup period in which the boxscore occurs.
   * @param  {number} options.scoringPeriodId The scoring period in which the boxscore occurs.
   * @returns {Boxscore[]} All boxscores for the week
   */
  getHistoricalScoreboardForWeek({ seasonId, matchupPeriodId, scoringPeriodId }) {
    const route = this.constructor._buildRoute({
      base: `${this.leagueId}`,
      params: `?scoringPeriodId=${scoringPeriodId}&seasonId=${seasonId}` +
        '&view=mMatchupScore&view=mScoreboard&view=mSettings&view=mTopPerformers&view=mTeam'
    });

    const axiosConfig = this._buildAxiosConfig({
      baseURL: 'https://fantasy.espn.com/apis/v3/games/ffl/leagueHistory/'
    });
    return axios.get(route, axiosConfig).then((response) => {
      const schedule = _.get(response.data[0], 'schedule'); // Data is an array instead of object
      const data = _.filter(schedule, { matchupPeriodId });

      return _.map(data, (matchup) => (
        Boxscore.buildFromServer(matchup, { leagueId: this.leagueId, seasonId })
      ));
    });
  }

  /**
   * Returns all free agents (in terms of the league's rosters) for a given week.
   *
   * NOTE: `scoringPeriodId` of 0 corresponds to the preseason; `18` for after the season ends.
   *
   * @param  {object} options Required options object.
   * @param  {number} options.seasonId The season to grab data from.
   * @param  {number} options.scoringPeriodId The scoring period to grab free agents from.
   * @returns {FreeAgentPlayer[]} The list of free agents.
   */
  getFreeAgents({ seasonId, scoringPeriodId }) {
    const route = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: `?scoringPeriodId=${scoringPeriodId}&view=kona_player_info`
    });

    const config = this._buildAxiosConfig({
      headers: {
        'x-fantasy-filter': JSON.stringify({
          players: {
            filterStatus: {
              value: ['FREEAGENT', 'WAIVERS']
            },
            limit: 2000,
            sortPercOwned: {
              sortAsc: false,
              sortPriority: 1
            }
          }
        })
      }
    });

    return axios.get(route, config).then((response) => {
      const data = _.get(response.data, 'players');
      return _.map(data, (player) => (
        FreeAgentPlayer.buildFromServer(player, { leagueId: this.leagueId, seasonId })
      ));
    });
  }

  /**
   * Returns an array of Player objects representing each player in the FF league for a season.
   * This call fetches and returns a bunch of data. Expect about ~3-4mb of raw data loaded from
   * ESPN for the ~1000 offensive players in a given season.
   *
   * @param  {object} options Required options object.
   * @param  {number} options.seasonId The season to grab data from.
   * @param  {number} options.limit Optional number of players to return.
   * @param  {number} options.offset Optional offset.
   * @returns {Player[]} The list of players.
   */
  getAllPlayers({ seasonId, limit = 2000, offset = 0 }) {
    const route = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: '?view=kona_player_info'
    });

    const config = this._buildAxiosConfig({
      headers: {
        'x-fantasy-filter': JSON.stringify({
          players: {
            limit,
            offset,
            // It appears having *some* sort is a requirement, else 400
            sortDraftRanks: {
              sortPriority: 100,
              sortAsc: true,
              value: 'STANDARD'
            },
            // Decreases payload size by ~62% by minimizing rank data
            filterRanksForScoringPeriodIds: {
              value: [-1]
            },
            // Decreases payload size by ~27% by minimizing stat data
            filterStatsForTopScoringPeriodIds: {
              value: 1
            }
          }
        })
      }
    });

    return axios.get(route, config).then((response) => {
      const data = _.get(response.data, 'players');
      return _.map(data, (player) => (
        Player.buildFromServer(player, { leagueId: this.leagueId, seasonId })
      ));
    });
  }

  /**
   * Returns an array of Team object representing each fantasy football team in the FF league.
   *
   * @param  {object} options Required options object.
   * @param  {number} options.seasonId The season to grab data from.
   * @param  {number} options.scoringPeriodId The scoring period in which to grab teams from.
   * @returns {Team[]} The list of teams.
   */
  getTeamsAtWeek({ seasonId, scoringPeriodId }) {
    const route = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: `?scoringPeriodId=${scoringPeriodId}&view=mRoster&view=mTeam`
    });

    return axios.get(route, this._buildAxiosConfig()).then((response) => {
      const data = _.get(response.data, 'teams');
      return _.map(data, (team) => (
        Team.buildFromServer(team, { leagueId: this.leagueId, seasonId })
      ));
    });
  }

  /**
   * Returns all NFL games that occur in the passed timeframe. NOTE: Date format must be "YYYYMMDD".
   *
   * @param  {object} options Required options object.
   * @param  {string} options.startDate Must be in "YYYYMMDD" format.
   * @param  {string} options.endDate   Must be in "YYYYMMDD" format.
   * @returns {NFLGame[]} The list of NFL games.
   */
  getNFLGamesForPeriod({ startDate, endDate }) {
    const route = this.constructor._buildRoute({
      base: 'apis/fantasy/v2/games/ffl/games',
      params: `?dates=${startDate}-${endDate}&pbpOnly=true`
    });

    const axiosConfig = this._buildAxiosConfig({ baseURL: 'https://site.api.espn.com/' });

    return axios.get(route, axiosConfig).then((response) => {
      const data = _.get(response.data, 'events');
      return _.map(data, (game) => NFLGame.buildFromServer(game));
    });
  }

  /**
   * Returns info on an ESPN fantasy football league
   *
   * @param   {object} options Required options object.
   * @param   {number} options.seasonId The season to grab data from.
   * @returns {League} The league info.
   */
  getLeagueInfo({ seasonId }) {
    const route = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: '?view=mSettings'
    });

    return axios.get(route, this._buildAxiosConfig()).then((response) => {
      const data = _.get(response.data, 'settings');
      return League.buildFromServer(data, { leagueId: this.leagueId, seasonId });
    });
  }

  /**
   * Returns stats for a player over an entire season.
   *
   * There is some messiness here in how the ESPN data works for historical years.
   * Over time they've changed what they store, how they store it, and how they
   * expose it through APIs. This function attempts to use "old" and "new" endpoints
   * to maximize the amount and consistency of data across all years. That said,
   * there's only so much we can do. Caveats:
   *
   * - Transaction info is totally absent 2017 and earlier, and seems available but invalid in 2018
   *
   * @param   {object} options Required options object.
   * @param   {number} options.seasonId The season to grab data from.
   * @param   {number} options.playerId The player to grab data for.
   * @returns {PlayerSeason} The player's season stats.
   */
  async getPlayerSeason({ seasonId, playerId }) {
    // 2017 and earlier, there's only one game in town.
    if (seasonId <= 2017) {
      return this._getPlayerSeasonWithHistoricalAPI({ seasonId, playerId });
    }

    // For "modern" years, query both backends in parallel
    const modernPromise = this._getPlayerSeasonWithModernAPI({ seasonId, playerId });
    const historicalPromise = this._getPlayerSeasonWithHistoricalAPI({ seasonId, playerId }).catch(
      (error) => {
        if (error.response.status === 404) {
          // Assume this indicates that we're querying for the current season,
          // which does not exist in the historical backend. Carry on.
          return null;
        }
        throw error;
      }
    );

    const modernResult = await modernPromise;
    const historicalResult = await historicalPromise;

    // Combine results.
    if (modernResult && !historicalResult) {
      return modernResult;
    } else if (!modernResult && historicalResult) {
      return historicalResult;
    }

    // Ugh. The old endpoint only has transactions *with prices* for 2019 onward :(
    if (seasonId >= 2019) {
      historicalResult.transactions = modernResult.transactions;
    }
    return historicalResult;
  }

  _getPlayerSeasonWithModernAPI({ seasonId, playerId }) {
    const route = this.constructor._buildRoute({
      base: `${seasonId}/segments/0/leagues/${this.leagueId}`,
      params: '?view=kona_playercard'
    });

    const config = this._buildAxiosConfig({
      headers: {
        'x-fantasy-filter': JSON.stringify({
          players: {
            filterIds: { value: [playerId] },
            filterStatsForTopScoringPeriodIds: {
              value: 17, // Somehow this seems to request each week's data
              additionalValue: [
                `00${seasonId}`, // Season actuals
                `01${seasonId}` // Season projections
              ]
            }
          }
        })
      }
    });

    return axios.get(route, config).then((response) => (
      PlayerSeason.buildFromServer(response.data.players[0], { leagueId: this.leagueId, seasonId })
    ));
  }

  _getPlayerSeasonWithHistoricalAPI({ seasonId, playerId }) {
    const route = this.constructor._buildRoute({
      base: `/leagueHistory/${this.leagueId}`,
      params: `?view=kona_playercard&seasonId=${seasonId}`
    });

    const config = this._buildAxiosConfig({
      baseURL: 'https://fantasy.espn.com/apis/v3/games/ffl',
      headers: {
        'x-fantasy-filter': JSON.stringify({
          players: {
            filterIds: { value: [playerId] }
          }
        })
      }
    });

    return axios.get(route, config).then((response) => (
      PlayerSeason.buildFromServer(
        response.data[0].players[0], { leagueId: this.leagueId, seasonId }
      )
    ));
  }

  /**
   * Correctly builds an axios config with cookies, if set on the instance
   *
   * @param   {object} config An axios config.
   * @returns {object} An axios config with cookies added if set on instance
   * @private
   */
  _buildAxiosConfig(config) {
    if ((this.espnS2 && this.SWID)) {
      const headers = { Cookie: `espn_s2=${this.espnS2}; SWID=${this.SWID};` };
      return _.merge({}, config, { headers, withCredentials: true });
    }

    return config;
  }

  static _buildRoute({ base, params }) {
    return `${base}${params}`;
  }
}

export default Client;
