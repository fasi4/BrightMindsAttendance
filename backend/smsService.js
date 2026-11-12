
const axios = require("axios");

function formatKenyanPhone(phone) {
  let number = String(phone).replace(/[\s-]/g, "");

  if (number.startsWith("0")) {
    number = "254" + number.substring(1);
  } else if (number.startsWith("+254")) {
    number = number.substring(1);
  }

  if (!/^254[17]\d{8}$/.test(number)) {
    throw new Error("Invalid Kenyan parent phone number: " + phone);
  }

  return number;
}

async function sendAbsenceSMS(phone, studentName, attendanceDate) {
  if (!phone) {
    throw new Error("Parent phone number is missing.");
  }

  const token = process.env.MOBILESASA_TOKEN;

  if (!token) {
    throw new Error("Mobile Sasa API token is missing.");
  }

  const formattedPhone = formatKenyanPhone(phone);

  const message =
    `Bright Minds Academy: Dear Parent, ${studentName} was marked ABSENT on ${attendanceDate}. Please contact the school if you need clarification.`;

  const response = await axios.post(
    "https://api.mobilesasa.com/v1/send/message",
    {
      senderID: "MOBILESASA",
      phone: formattedPhone,
      message: message
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.data.status) {
    throw new Error(response.data.message || "SMS sending failed.");
  }

  return response.data;
}

module.exports = { sendAbsenceSMS };

