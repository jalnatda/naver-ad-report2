import crypto from "crypto";
import axios from "axios";

const CUSTOMER_ID = process.env.CUSTOMER_ID;
const ACCESS_LICENSE = process.env.ACCESS_LICENSE;
const SECRET_KEY = process.env.SECRET_KEY;

function makeSignature(timestamp, method, path) {
  const hmac = crypto.createHmac("sha256", SECRET_KEY);
  hmac.update(timestamp + "." + method + "." + path);
  return hmac.digest("base64");
}

function getHeaders(method, path) {
  const timestamp = String(Date.now());
  return {
    "Content-Type": "application/json; charset=UTF-8",
    "X-Timestamp": timestamp,
    "X-API-KEY": ACCESS_LICENSE,
    "X-Customer": String(CUSTOMER_ID),
    "X-Signature": makeSignature(timestamp, method, path),
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { since, until, id } = req.query;
  if (!since || !until || !id) {
    return res.status(400).json({ error: "since, until, id 필요" });
  }

  const path = "/stats";
  const qs = [
    "id=" + encodeURIComponent(id),
    "fields=" + encodeURIComponent('["impCnt","clkCnt","salesAmt","cpc","avgRnk"]'),
    "timeRange=" + encodeURIComponent(JSON.stringify({ since, until })),
    "timeIncrement=1",
  ].join("&");

  try {
    const { data } = await axios.get(
      "https://api.searchad.naver.com" + path + "?" + qs,
      { headers: getHeaders("GET", path) }
    );
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.response ? e.response.data : e.message });
  }
}