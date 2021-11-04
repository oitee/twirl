import {
  incrementCounter,
  addShortenedLink,
  fetchLongLink,
  fetchShortLink,
} from "../models/links.js";
import { createHash } from "crypto";

export async function shortenLink(userID, link) {
  let counter = await incrementCounter();
  let shortLink =
    createHash("MD5")
      .update(link)
      .digest("base64")
      .replace(/[+\-\/=]/g, "")
      .substring(0, 8) + counter;

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
