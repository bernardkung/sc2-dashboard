"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
 import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

function capitalizeFirst(str: String) {
  if (!str) return ""; // Handle empty strings
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function Page() {

  const chartConfig = {
    desktop: {
      label: "Desktop",
      color: "#2563eb",
    },
    mobile: {
      label: "Mobile",
      color: "#60a5fa",
    },
  } satisfies ChartConfig

  const regions = ["us", "eu", "kr", "tw", "cn"];

  const queueIds: Record<number, string> = {
    // 1: "WoL 1v1",
    // 2: "WoL 2v2",
    // 3: "WoL 3v3",
    // 4: "WoL 4v4",
    // 101: "HotS 1v1",
    // 102: "HotS 2v2",
    // 103: "HotS 3v3",
    // 104: "HotS 4v4",
    201: "1v1",
    202: "2v2",
    203: "3v3",
    204: "4v4",
    206: "Archon",
  };

  const lotvQueueIds = [201, 202, 203, 204, 206];

  const teamTypes: Record<number, string> = {
    1: "solo",
    0: "team",
  };

  const leagueIds: Record<number, string> = {
    0: "Bronze",
    1: "Silver",
    2: "Gold",
    3: "Platinum",
    4: "Diamond",
    5: "Master",
    6: "Grandmaster"
  };



const leagues = [
  { name: "bronze",      icon: "/images/BronzeMedium.png",        id: 0},
  { name: "silver",      icon: "/images/SilverMedium.png",        id: 1},
  { name: "gold",        icon: "/images/GoldMedium.png",          id: 2},
  { name: "platinum",    icon: "/images/PlatinumMedium.png",      id: 3},
  { name: "diamond",     icon: "/images/DiamondMedium.png",       id: 4},
  { name: "master",      icon: "/images/MasterMedium.png",        id: 5},
  { name: "grandmaster", icon: "/images/GrandmasterMedium.png",   id: 6},
];
  
  const [region, setRegion] = useState("us");
  const [seasonId, setSeasonId] = useState(66);
  const [qId, setQueueId] = useState(201);
  const [tType, setTeamType] = useState(0);
  const [lId, setLeagueId] = useState(5);

  const [filters, setFilters] = useState({
    regions: ["us"],
    seasonIds: [66],
    queueId: 201,
    teamType: 0,
    leagueIds: [5]
  })

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allData, setAllData] = useState(null);
    


  function unpackLeague(resDict: any) {
    const key = resDict["key"];
    const divisions: any[] = [];

    resDict["tier"].forEach((tier: any, tierIndex: number) => {
      console.log("tier", tier, tierIndex)
      tier['division'].forEach((division: any, divisionIndex: number) => {
        divisions.push({
          league_id: key["league_id"],
          queue_id: key["queue_id"],
          team_type: key["team_type"],
          season_id: key["season_id"],
          tier: tier,
          ...division
        })
      });
    });

    return divisions;
  }

  function countLeaguePlayers(resDict: any) {
    return resDict["tier"].map((tier: any) => {
      return {
        league: capitalizeFirst(leagues[resDict["key"]["league_id"]].name) + " " + String(tier["id"] + 1),
        players: tier["division"].reduce((playerCount: number, division: any) => playerCount + division["member_count"], 0)
      }
    })
  }
  
  function handleToggle(leagueName: string) {
    const leagueId = Object.keys(leagueIds).find(key => leagueIds[key] === capitalizeFirst(leagueName));
    if (!leagueId) return;

    if (filters.leagueIds.length === 1 && filters.leagueIds[0] === Number(leagueId)) {
      // Prevent deselecting the last remaining league
      return;
    }

    setFilters(prevFilters => {
      const isSelected = prevFilters.leagueIds.includes(Number(leagueId));
      const newLeagueIds = isSelected
        ? prevFilters.leagueIds.filter(id => id !== Number(leagueId))
        : [...prevFilters.leagueIds, Number(leagueId)];

      return {
        ...prevFilters,
        leagueIds: newLeagueIds,
      };
    });
  }

  async function fetchLeague() {

    setLoading(true);
    try {
      const res = await fetch(
        // `https://${region}.api.blizzard.com/data/sc2/league/${seasonId}/${queueId}/${teamType}/${leagueId}?locale=en_US`
        `/api/blizzard/data/sc2/league/${seasonId}/${qId}/${tType}/${filters.leagueIds[0]}?locale=en_US`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      console.log(res);
      const json = await res.json();
      setData({...json, playerCount: countLeaguePlayers(json)});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllLeagues() {
    setLoading(true);
    try {
      const urls: string[] = [];
      for (const qId of lotvQueueIds) {
        for (const tType of Object.keys(teamTypes)) {
          for (const lId of Object.keys(leagueIds)) {
            urls.push(`/api/blizzard/data/sc2/league/${seasonId}/${qId}/${tType}/${lId}?locale=en_US`);
          }
        }
      }

      const BATCH_SIZE = 5;
      const DELAY_MS = 300;
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      const results = [];
      for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        const batch = urls.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(url => fetch(url).then(res => {
            if (res.status === 404) return null;  // league doesn't exist, skip
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          }))
        );
        results.push(...batchResults.filter(Boolean));  // drop nulls
        if (i + BATCH_SIZE < urls.length) await delay(DELAY_MS);
      }

      console.log("fetchAllLeagues results:", results);
      // setAllData(results.map(unpackLeague));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeague();
    // fetchAllLeagues();
  }, [filters]);


  useEffect(() => {
    if (data) {
      console.log("data:", data);
      console.log("filters:", filters);
    }
  }, [data, loading, error]);





  return (
    <div className="flex flex-col items-center min-h-svh p-6">
      {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
      <div>
        Season: {data ? data["key"]["season_id"] : "Loading..."}
      </div>
      <div>
        League: {data ? leagueIds[data["key"]["league_id"]] : "Loading..."}
      </div>
      <div>
        Queue ID: {data ? queueIds[filters.queueId]  + (filters.queueId===201 ? "" : " " + teamTypes[data["key"]["team_type"]]) : "Loading..."}
      </div>

      <ToggleGroup 
        variant="outline" 
        value={String(filters.queueId)}
        onValueChange={(value) => {
          if (!value) return;  // prevent deselecting
          setFilters(prev => ({ ...prev, queueId: Number(value) }));
        }}
      >
        {Object.entries(queueIds).map(([id, name]) => (
          <ToggleGroupItem 
            key={id} 
            value={id}           // "201", "202", etc. — converts back to number trivially
            variant="outline" 
            size="default" 
            className="w-24"
          >
            {name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <ToggleGroup 
        variant="outline" 
        value={filters.queueId===201 
          ? [] 
          : filters.queueId===206 
            ? ["0"] 
            : [String(filters.teamType)]}
        onValueChange={(value) => {
          if (value.length === 0) return;  // prevent deselecting
          setFilters(prev => ({ ...prev, teamType: Number(value[0]) }));
        }}
        disabled={filters.queueId === 201}
      >
        {Object.entries(teamTypes).map(([id, name]) => (
          <ToggleGroupItem 
            key={id} 
            value={id}           // "0", "1" — converts back to number trivially
            variant="outline" 
            size="default" 
            className="w-24"
          >
            { capitalizeFirst(name) }
          </ToggleGroupItem>
        ))}
      </ToggleGroup>


      { data && (
        <Card className="w-160">
          <CardHeader>
            <CardTitle>Player Distribution</CardTitle>
            {/* <CardDescription>{leagueIds[data["key"]["league_id"]]} League</CardDescription> */}
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart accessibilityLayer data={[...data['playerCount']].reverse()}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="league"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  // tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="players" fill="var(--color-desktop)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) }

    </div>
  );
}