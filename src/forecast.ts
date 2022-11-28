import { User } from "../mod.ts";
import { slugify } from "./utils.ts";

export interface ForecastUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  archived: boolean;
  login: "enabled" | "disabled";
  harvest_user_id: number;
}

export interface ForecastAssignment {
  id: number;
  start_date: string;
  end_date: string;
  allocation: number;
  notes: string | null;
  updated_at: string;
  updated_by_id: number;
  project_id: number;
  person_id: number;
  placeholder_id: number | null;
  repeated_assignment_set_id: number | null;
  active_on_days_off: boolean;
}

const BASE_API_URL = "https://api.forecastapp.com";
const API_KEY = Deno.env.get("HARVEST_KEY");
const ACCOUNT_ID = Deno.env.get("HARVEST_ACCOUNT_ID");
const options = {
  method: "GET",
  headers: {
    "content-type": "application/json",
    "Accept": "application/json",
    "Forecast-Account-Id": `${ACCOUNT_ID}`,
    "Authorization": `Bearer ${API_KEY}`,
  },
};

export async function fetchForecastAssignments(
  date: string,
  data: ForecastAssignment[] = [],
  nextLink?: string,
): Promise<ForecastAssignment[]> {
  let url: URL;

  if (nextLink) {
    url = new URL(nextLink);
  } else {
    url = new URL(`${BASE_API_URL}/assignments`);
    url.searchParams.set("start_date", date);
    url.searchParams.set("end_date", date);
  }

  const forecastRequest = new Request(url, options);

  try {
    const harvestResponse = await fetch(forecastRequest);
    const json = await harvestResponse.json();
    const assignments: ForecastAssignment[] = json.assignments;

    const requestResult = assignments.map((entry) => {
      const item: ForecastAssignment = {
        id: entry.id,
        start_date: entry.start_date,
        end_date: entry.end_date,
        notes: entry.notes,
        project_id: entry.project_id,
        person_id: entry.person_id,
        active_on_days_off: entry.active_on_days_off,
        placeholder_id: entry.placeholder_id,
        repeated_assignment_set_id: entry.repeated_assignment_set_id,
        updated_at: entry.updated_at,
        updated_by_id: entry.updated_by_id,
        allocation: entry.allocation,
      };

      return item;
    });

    const results = [...data, ...requestResult];

    if (json?.links?.next) {
      return await fetchForecastAssignments(date, results, json.links.next);
    } else {
      return results;
    }
  } catch (error) {
    console.error("fetching forecast data:", error);
    throw new Error("fetching forecast data!");
  }
}

export async function fetchForecastUsers() {
  const url = new URL(`${BASE_API_URL}/people`);
  //url.searchParams.set("is_active", "true");

  const forecastRequest = new Request(url, options);

  try {
    const harvestResponse = await fetch(forecastRequest);
    const json = await harvestResponse.json();
    const users: ForecastUser[] = json.people;

    return users
      .filter((u) => !u.archived || u.login === "enabled")
      .map((user: ForecastUser) => {
        const data: User = {
          workless: false,
          forecast_id: user.id,
          harvest_id: user.harvest_user_id,
          email: user.email.toLowerCase(),
          first_name: slugify(user.first_name),
          last_name: slugify(user.last_name),
        };

        return data;
      });
  } catch (error) {
    console.error("fetching harvest users:", error);
    throw new Error("fetching harvest users!");
  }
}

export function addForecastData(
  assignments: ForecastAssignment[],
  users: User[],
) {
  assignments.forEach((entry) => {
    // find user in users list
    const userIndex = users.findIndex((user) =>
      user.forecast_id === entry.person_id
    );
    // if not found then ignore
    if (userIndex === -1) return;

    users[userIndex].assignment = entry;
  });
}
