import jsonpath from 'jsonpath';
import prefixedConsole from "../../common/prefixedConsole.mjs";
import { getXRankSeasonId } from '../../common/util.mjs';
import DataUpdater from "./DataUpdater.mjs";
import XRankDetailUpdater from "./XRankDetailUpdater.mjs";

export default class XRankUpdater extends DataUpdater
{
  name = 'X-Rank';
  filename = 'xrank/xrank';

  imagePaths = [
    '$..image.url',
    '$..image2d.url',
    '$..image2dThumbnail.url',
    '$..image3d.url',
    '$..image3dThumbnail.url',
  ];

  constructor(divisionName, divisionKey) {
    super();

    this.divisionName = divisionName;
    this.divisionKey = divisionKey;
    this.filename += `.${divisionName.toLowerCase()}`;
  }

  get console() {
    this._console ??= prefixedConsole('Updater', this.region, this.name, this.divisionName);

    return this._console;
  }

  async getData(locale) {
    let result = await this.splatnet(locale).getXRankingData(this.divisionKey);
    let seasons = this.getSeasons(result.data);

    for (let season of seasons) {
      this.deriveSeasonId(season);
      await this.updateSeasonDetail(season.id);
    }

    return result;
  }

  getSeasons(data) {
    let seasons = data.xRanking.pastSeasons?.nodes ?? [];
    seasons.unshift(data.xRanking.currentSeason);

    return seasons;
  }

  deriveSeasonId(season) {
    season.__splatoon3ink_id = getXRankSeasonId(season.id);
  }

  async updateSeasonDetail(seasonId) {
    for (let type of this.splatnet().getXRankingDetailQueryTypes()) {
      let updater = new XRankDetailUpdater(seasonId, type);
      await updater.updateIfNeeded();
    }
  }
}
