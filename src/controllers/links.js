import {
  incrementCounter,
  addShortenedLink,
  fetchLongLink,
  fetchShortLink,
  fetchAnalytics,
  fetchAllAnalytics,
  updateStatus,
} from "../models/links.js";
import { randomBytes } from "crypto";
import { URL } from "url";

export async function shorten(request, response) {
  let inputLink = request.body.originalLink;
  try {
    new URL(inputLink);
    let shortLink = await shortenLink(request.twirlUser.id, inputLink);
    shortLink.shortLink = "/l/" + shortLink.shortLink;
    return response.send(shortLink);
  } catch (e) {
    if (inputLink.startsWith("http")) {
      return response.send({ status: false });
    }
    request.body.originalLink = "http://" + inputLink;
    return await shorten(request, response);
  }
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
  const userRole = request.twirlUser.role;
  if (userRole !== "admin") {
    let data = await fetchAnalytics(request.twirlUser.id);
    data.map((row) => (row.short_link = "/l/" + row.short_link));
    return response.send({ data: data, userRole: userRole });
  }

  let data = await fetchAllAnalytics();
  data.map((row) => (row.short_link = "/l/" + row.short_link));
  return response.send({ data: data, userRole: userRole });
}

export async function disableLink(request, response) {
  let shortLink = request.params.id;
  let status = await updateStatus(request.twirlUser.id, shortLink, false);
  return response.send({ status: status });
}

export async function enableLink(request, response) {
  let shortLink = request.params.id;
  let status = await updateStatus(request.twirlUser.id, shortLink, true);
  return response.send({ status: status });
}
