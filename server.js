require("dotenv").config();

const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

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
  const signature = makeSignature(timestamp, method, path);

  return {
    "Content-Type": "application/json; charset=UTF-8",
    "X-Timestamp": timestamp,
    "X-API-KEY": ACCESS_LICENSE,
    "X-Customer": String(CUSTOMER_ID),
    "X-Signature": signature,
  };
}

/**
 * 비즈머니 잔액 조회
 */
app.get("/api/summary", async (req, res) => {
  const path = "/billing/wallet/balance/cash";

  try {
    const { data } = await axios.get(
      "https://api.searchad.naver.com" + path,
      {
        headers: getHeaders("GET", path),
      }
    );

    res.json(data);
  } catch (e) {
    console.log("SUMMARY STATUS:", e.response ? e.response.status : "no response");
    console.log("SUMMARY DATA:", e.response ? JSON.stringify(e.response.data) : e.message);

    res.status(500).json({
      error: e.response ? e.response.data : e.message,
    });
  }
});

/**
 * 과거 날짜용: 일별 통계
 * 예:
 * /api/report/daily?since=2026-03-27&until=2026-03-27&id=cmp-a001-01-000000010552729
 */
app.get("/api/report/daily", async (req, res) => {
  const { since, until, id } = req.query;

  if (!since || !until || !id) {
    return res.status(400).json({
      error: "since, until, id 값이 모두 필요합니다.",
    });
  }

  const path = "/stats";

  const fields = ["impCnt", "clkCnt", "salesAmt", "cpc", "avgRnk"];

  const timeRange = {
    since,
    until,
  };

  const qs = [
    "id=" + encodeURIComponent(id),
    "fields=" + encodeURIComponent(JSON.stringify(fields)),
    "timeRange=" + encodeURIComponent(JSON.stringify(timeRange)),
    "timeIncrement=1",
  ].join("&");

  const fullPath = path + "?" + qs;

  try {
    const { data } = await axios.get(
      "https://api.searchad.naver.com" + fullPath,
      {
        headers: getHeaders("GET", path),
      }
    );

    res.json(data);
  } catch (e) {
    console.log("DAILY REQUEST:", fullPath);
    console.log("DAILY STATUS:", e.response ? e.response.status : "no response");
    console.log("DAILY DATA:", e.response ? JSON.stringify(e.response.data) : e.message);

    res.status(500).json({
      request: fullPath,
      error: e.response ? e.response.data : e.message,
    });
  }
});

/**
 * 최근 7일 이내용: 시간대별 통계
 * 예:
 * /api/report/hourly?since=2026-05-09&until=2026-05-09&id=cmp-a001-01-000000010552729
 */
app.get("/api/report/hourly", async (req, res) => {
  const { since, until, id } = req.query;

  if (!since || !until || !id) {
    return res.status(400).json({
      error: "since, until, id 값이 모두 필요합니다.",
    });
  }

  const path = "/stats";

  const fields = ["impCnt", "clkCnt", "salesAmt", "cpc", "avgRnk"];

  const timeRange = {
    since,
    until,
  };

  const qs = [
    "id=" + encodeURIComponent(id),
    "fields=" + encodeURIComponent(JSON.stringify(fields)),
    "timeRange=" + encodeURIComponent(JSON.stringify(timeRange)),
    "timeIncrement=1",
    "breakdown=hh24",
  ].join("&");

  const fullPath = path + "?" + qs;

  try {
    const { data } = await axios.get(
      "https://api.searchad.naver.com" + fullPath,
      {
        headers: getHeaders("GET", path),
      }
    );

    res.json(data);
  } catch (e) {
    console.log("HOURLY REQUEST:", fullPath);
    console.log("HOURLY STATUS:", e.response ? e.response.status : "no response");
    console.log("HOURLY DATA:", e.response ? JSON.stringify(e.response.data) : e.message);

    res.status(500).json({
      request: fullPath,
      error: e.response ? e.response.data : e.message,
    });
  }
});

app.listen(4000, () => {
  console.log("서버 실행중: http://localhost:4000");
});