import {
  incrementCounter,
  addShortenedLink,
  fetchLongLink,
  fetchShortLink,
} from "../models/links.js";
import { randomBytes } from "crypto";

export async function shortenLink(userID, link) {
  let counter = await incrementCounter();
  let shortLink = randomBytes(2).toString("base64") + counter.toString(36);
  shortLink = shortLink.replace(/[\-+\/=]/g, "");
  
  let status = await addShortenedLink(userID, link, shortLink);
  if (status) {
    return { shortLink, status };
  }
  let existingShortLink = await fetchShortLink(userID, link);
  if (existingShortLink) {
    return { shortLink: existingShortLink, status: true };
  }
  return { status: false };
}

export async function expandLink(link) {
  let longLink = await fetchLongLink(link);
  if (longLink) {
    return { longLink, status: true };
  }
  return { status: false };
}
