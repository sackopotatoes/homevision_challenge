/** @format */
import axios from "axios";
import EventEmitter from "events";
import { createWriteStream, ReadStream } from "fs";

interface House {
  id: number;
  address: string;
  homeowner: string;
  price: number;
  photoURL: string;
}

interface HouseGetterOpts {
  api_url: string;
  event_emitter: EventEmitter;
  failed_request_event: string;
  timeout?: number;
}

export function createHousesGetter({
  api_url,
  timeout = 0,
  event_emitter,
  failed_request_event,
}: HouseGetterOpts) {
  return async function getHousesByPage(page: number): Promise<House[]> {
    try {
      const { data } = await axios.get(`${api_url}?page=${page}`, {
        timeout,
      });

      return data.houses;
    } catch (err) {
      event_emitter.emit(failed_request_event, page);
      return [];
    }
  };
}

function getHouseImage(img_url: string): Promise<ReadStream> {
  return axios
    .get(img_url, {
      responseType: "stream",
    })
    .then((res) => res.data);
}

export async function downloadHouseImage(house: House): Promise<void> {
  const { id, address, photoURL } = house;

  const img_stream = await getHouseImage(photoURL);
  const cleaned_address = address.replace(/\s/g, "-").replace(/,|\./g, "");
  const file_ext = photoURL.split(".").pop();
  const file_name = `id-${id}-${cleaned_address}.${file_ext}`.toLowerCase();

  img_stream.pipe(createWriteStream(file_name));
}
