/** @format */
import EventEmitter from "events";
import { createHousesGetter, downloadHouseImage } from "./houses";

const eventEmitter = new EventEmitter();

// constants
const API_URL =
  "http://app-homevision-staging.herokuapp.com/api_project/houses";
const FIRST_N_PAGES = 10;
const REQUEST_TIMEOUT = 10000; //abort request after 10 seconds
const MAX_RETRIES = 10;
const FAILED_REQUEST_EVENT = "failed_request";

// progress bar setup
import ProgressBar from "progress";
const bar = new ProgressBar("Downloading Pages :bar :current/:total", {
  total: FIRST_N_PAGES,
  width: 20,
});

interface PageRetries {
  [key: string]: number;
}

const page_retries: PageRetries = {};

// Event Handler to retry failed requests
eventEmitter.on(FAILED_REQUEST_EVENT, (page: number) => {
  page_retries[page] = (page_retries[page] || 0) + 1;

  if (page_retries[page] <= MAX_RETRIES) {
    processPage(page);
  } else {
    console.error(
      `Could not process page ${page} after ${MAX_RETRIES} attempts!`
    );
  }
});

const getHousesByPage = createHousesGetter({
  api_url: API_URL,
  timeout: REQUEST_TIMEOUT,
  event_emitter: eventEmitter,
  failed_request_event: FAILED_REQUEST_EVENT,
});

async function processPage(page: number): Promise<void> {
  const houses = await getHousesByPage(page);

  if (houses.length) {
    const downloadPromises = houses.map(downloadHouseImage);

    await Promise.all(downloadPromises);

    bar.tick();

    if (bar.complete) {
      console.log("\nFinished!\n");
    }
  }
}

function getHouses(up_to_page: number = 10): Promise<void>[] {
  const responsePromises: Promise<void>[] = [];

  for (let i = 1; i <= up_to_page; i++) {
    responsePromises.push(processPage(i));
  }

  return responsePromises;
}

function main(): void {
  getHouses(FIRST_N_PAGES);
}

main();
