import { Client } from '../src/index';

jest.setTimeout(10000);

describe('client integration tests', () => {
  let client;
  let leagueId;
  let seasonId;
  let scoringPeriodId;
  let playerId;

  beforeEach(() => {
    leagueId = process.env.LEAGUE_ID;
    seasonId = 2018;
    scoringPeriodId = 1;

    client = new Client({
      leagueId,
      espnS2: process.env.ESPN_S2,
      SWID: process.env.SWID
    });
  });

  describe('getBoxscoreForWeek', () => {
    test('returns a populated array of Boxscores', async () => {
      const boxscores = await client.getBoxscoreForWeek({
        seasonId, matchupPeriodId: scoringPeriodId, scoringPeriodId
      });

      expect(boxscores).toMatchSnapshot();
    });
  });

  describe('getHistoricalScoreboardForWeek', () => {
    beforeEach(() => {
      seasonId = 2016;
    });

    test('returns a populated array of Boxscores', async () => {
      const scoreboards = await client.getHistoricalScoreboardForWeek({
        seasonId, matchupPeriodId: scoringPeriodId, scoringPeriodId
      });

      expect(scoreboards).toMatchSnapshot();
    });
  });

  describe('getFreeAgents', () => {
    test('returns a populated array of FreeAgentPlayers', async () => {
      const players = await client.getFreeAgents({
        seasonId, scoringPeriodId
      });

      expect(players).toMatchSnapshot();
    });
  });

  describe('getTeamsAtWeek', () => {
    test('returns a populated array of Teams', async () => {
      const teams = await client.getTeamsAtWeek({
        seasonId, scoringPeriodId
      });

      expect(teams).toMatchSnapshot();
    });
  });

  describe('getNFLGamesForPeriod', () => {
    test('returns a populated array of NFLGames', async () => {
      const nflGames = await client.getNFLGamesForPeriod({
        startDate: '20181003', endDate: '20181008'
      });

      expect(nflGames).toMatchSnapshot();
    });
  });

  describe('getLeagueInfo', () => {
    test('returns a populated League instance', async () => {
      const league = await client.getLeagueInfo({ seasonId });

      expect(league).toMatchSnapshot();
    });
  });

  describe('getPlayerSeason', () => {
    beforeEach(() => {
      playerId = 16800; // Davante Adams
    });

    // TODO: Update after Week 17 2020 concludes
    test('returns stats for a player for 2020', async () => {
      seasonId = 2020
      const playerSeason = await client.getPlayerSeason({ seasonId, playerId });
      expect(playerSeason).toMatchSnapshot();
      expect(playerSeason.seasonActual.stats.receivingYards).toEqual(1328);
      expect(playerSeason.seasonActual.points.totalPoints).toEqual(232.8);
      expect(Object.keys(playerSeason.weeklyActual).length).toEqual(15);

      expect(playerSeason.weeklyActual[3].points.totalPoints).toEqual(0); // didn't play Week 3 2020 @ New Orleans

      // Per https://www.espn.com/nfl/game?gameId=401220300
      expect(playerSeason.weeklyActual[1].points.totalPoints).toEqual(27.6);
      expect(playerSeason.weeklyActual[1].stats.receivingYards).toEqual(156);
      expect(playerSeason.weeklyActual[1].stats.receivingReceptions).toEqual(14);
    });

    test('returns stats for a player for 2019', async () => {
      seasonId = 2019
      const playerSeason = await client.getPlayerSeason({ seasonId, playerId });
      expect(playerSeason).toMatchSnapshot();
      expect(playerSeason.seasonActual.stats.receivingYards).toEqual(997);
      expect(playerSeason.seasonActual.points.totalPoints).toEqual(129.7);
      expect(Object.keys(playerSeason.weeklyActual).length).toEqual(16);

      // Per https://www.espn.com/nfl/game?gameId=401128090
      expect(playerSeason.weeklyActual[9].stats.receivingYards).toEqual(41);
      expect(playerSeason.weeklyActual[9].stats.receivingReceptions).toEqual(7);
      expect(playerSeason.weeklyActual[5].points.totalPoints).toEqual(0); // didn't play Week 5 2019 @ Dallas
    });

    test('returns stats for a player for 2018', async () => {
      seasonId = 2018
      const playerSeason = await client.getPlayerSeason({ seasonId, playerId });
      expect(playerSeason).toMatchSnapshot();
      expect(playerSeason.seasonActual.stats.receivingYards).toEqual(1386);
      expect(playerSeason.seasonActual.points.totalPoints).toEqual(218.6);
      expect(Object.keys(playerSeason.weeklyActual).length).toEqual(16);
      expect(playerSeason.seasonProjected.points.totalPoints).toEqual(165.41359420199998);

      expect(playerSeason.weeklyActual[7]).toEqual(undefined); // bye week

      // Per https://www.espn.com/nfl/boxscore?gameId=401030893
      expect(playerSeason.weeklyActual[15].stats.receivingYards).toEqual(119);
      expect(playerSeason.weeklyActual[15].stats.receivingReceptions).toEqual(8);
      expect(playerSeason.weeklyActual[17].points.totalPoints).toEqual(0); // didn't play Week 17 vs. Detroit
    });

    test('returns stats for a player for 2017', async () => {
      seasonId = 2017
      const playerSeason = await client.getPlayerSeason({ seasonId, playerId });
      expect(playerSeason).toMatchSnapshot();
      expect(playerSeason.seasonActual.stats.receivingYards).toEqual(885);

      // Looks like we don't have projections this far back :(
      expect(playerSeason.seasonProjected.points).toEqual(null);

      // Looks like we don't have week-by-week stats this far back :(
      expect(Object.keys(playerSeason.weeklyActual).length).toEqual(0);
    });
  });

});
