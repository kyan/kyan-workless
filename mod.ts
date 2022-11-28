import { format, serve } from "./deps.ts";
import {
  addForecastData,
  fetchForecastAssignments,
  fetchForecastUsers,
  ForecastAssignment,
} from "./src/forecast.ts";
import {
  Absence,
  addTimetasticData,
  fetchTimetasticHolidays,
  fetchTimetasticUsers,
} from "./src/timetastic.ts";
import { calculateWorkless, mergeUsers } from "./src/utils.ts";

export interface User {
  workless: boolean;
  email: string;
  timetastic_id?: number;
  forecast_id?: number;
  harvest_id?: number;
  first_name: string;
  last_name: string;
  absence?: Absence;
  assignment?: ForecastAssignment;
}

async function handler(req: Request) {
  const url = new URL(req.url);
  const checkDate = url.searchParams.get("date") ||
    format(new Date(), "yyyy-MM-dd");
  const token = req.headers.get("Authorization");

  if (token != `Bearer ${Deno.env.get("API_TOKEN")}`) {
    return new Response("Not authorized", { status: 401 });
  }

  try {
    const forecastUsers = await fetchForecastUsers();
    const timetasticUsers = await fetchTimetasticUsers();
    const timetasticHolidays = await fetchTimetasticHolidays(checkDate);
    const forecastAssignments = await fetchForecastAssignments(checkDate);

    const userLookup = mergeUsers(forecastUsers, timetasticUsers);
    addTimetasticData(timetasticHolidays, userLookup);
    addForecastData(forecastAssignments, userLookup);
    calculateWorkless(userLookup);

    const result = {
      date: checkDate,
      users: userLookup,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  } catch (error) {
    return new Response(error, { status: 500 });
  }
}

serve(handler);
