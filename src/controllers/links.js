import {
  incrementCounter,
  addShortenedLink,
  fetchLongLink,
  fetchShortLink,
  fetchAnalytics,
} from "../models/links.js";
import { randomBytes } from "crypto";
import { SESSION_COOKIE } from "../constants.js";

export async function shorten(request, response) {
  let inputLink = request.body.originalLink;
  let shortLink = await shortenLink(request.twirlUser.id, inputLink);
  shortLink.shortLink = "/l/" + shortLink.shortLink;
  return response.send(shortLink);
}

export async function goToLink(request, response) {
  let inputLink = request.params.id;
  let outputLink = await expandLink(inputLink);
  if (outputLink.status) {
    return response.redirect(outputLink.longLink);
  }
  return response.status(404).send(`This is not a valid page`);
}

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

export async function analytics(request, response) {
  let data = await fetchAnalytics(request.twirlUser.id);
  data.map((row) => (row.short_link = "/l/" + row.short_link));

  return response.send({ data: data });
}
