"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [data, setData] = useState(null);

  const regions = ["us", "eu", "kr", "tw", "cn"];

  const queueIds = {
    1: "WoL 1v1",
    2: "WoL 2v2",
    3: "WoL 3v3",
    4: "WoL 4v4",
    101: "HotS 1v1",
    102: "HotS 2v2",
    103: "HotS 3v3",
    104: "HotS 4v4",
    201: "LotV 1v1",
    202: "LotV 2v2",
    203: "LotV 3v3",
    204: "LotV 4v4",
    206: "LotV Archon"
  }

  const teamTypes = {
    'arranged': 0,
    'random': 1
  }

  const leagueIds = {
    'Bronze': 0,
    'Silver': 1,
    'Gold': 2,
    'Platinum': 3,
    'Diamond': 4,
    'Master': 5,
    'Grandmaster': 6
}


  const seasonId = 37;
  const queueId = 201;
  const teamType = 0;
  const leagueId = 5;

  async function fetchLeague() {
    const res = await fetch(
      `/api/blizzard/data/sc2/league/${seasonId}/${queueId}/${teamType}/${leagueId}?locale=en_US`
    );
    console.log(res);
    const json = await res.json();
    setData(json);
  }

// url = "https://{region}.api.blizzard.com/data/sc2/league/{season}/{mode}/{team_type}/{league_id}?locale=en_US"
    //   url = "https://{}.api.blizzard.com/data/sc2/league/{}/{}/{}/{}?locale=en_US"

    // urls = []
    // for region in ["us", "eu", "kr"]:
    //     for season in [season_number]:
    //         # 1v1, 2v2, 3v3, 4v4, archon
    //         for mode in MODES:
    //             for team_type in ["0"]:
    //                 for league_id in map(str, range(6)):
    //                     urls.append(url.format(region, season, mode, team_type, league_id))

  useEffect(() => {
    fetchLeague();
  }, []);

  return (
    <div className="flex min-h-svh p-6">
      <Button onClick={fetchLeague}>Refresh</Button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}