// ./utils/currenttime.js
const fetch = require("node-fetch");
const moment = require("moment-timezone");

const getCurrentTimeInIndia = async () => {
  try {
    const response = await fetch(
      "http://worldtimeapi.org/api/timezone/Asia/Kolkata"
    );
    const data = await response.json();
    const indiaTime = moment.tz(data.datetime, "Asia/Kolkata");
    return indiaTime.format("hh:mm A");
  } catch (error) {
    console.error("Error fetching time:", error);
    return null;
  }
};

module.exports = getCurrentTimeInIndia;
