import axios from "axios";

const webhookUrl = "https://discord.com/api/webhooks/1361419716245323846/9kQ3BRexfJU8MOv15oayn5F9mRt58ODQKQ1LHRxks8ubGjAajfNA_NF4Rb5OELjNRJe9"; // ضع رابط الويبهوك هنا

const redisUrl = "https://leading-toad-21759.upstash.io";
const redisToken = "AVT_AAIjcDE1Y2EwNmJkMDc5ODA0NjBkOTcyZGI2ZTg3YTdhMGIxNXAxMA";

async function getUsers() {
  const res = await fetch(`${redisUrl}/get/users`, {
    headers: { Authorization: `Bearer ${redisToken}` }
  });
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : [];
}

async function saveUsers(users) {
  await fetch(`${redisUrl}/set/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ value: JSON.stringify(users) })
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { action, user } = req.body;
  if (!user || (action !== "join" && action !== "leave")) {
    return res.status(400).json({ error: "Invalid Data" });
  }

  try {
    let users = await getUsers();

    if (action === "join") {
      if (!users.includes(user)) users.push(user);
    } else {
      users = users.filter((u) => u !== user);
    }

    await saveUsers(users);

    await axios.post(webhookUrl, {
      embeds: [
        {
          title: "تحديث المستخدمين",
          description: `**${user}** قام بـ **${action === "join" ? "الدخول" : "الخروج"}**\n**العدد الحالي:** ${users.length}`,
          color: action === "join" ? 0x2ecc71 : 0xe74c3c,
          timestamp: new Date().toISOString()
        }
      ]
    });

    res.status(200).json({ message: "تم التحديث", users, count: users.length });
  } catch (err) {
    console.error("Redis/Webhook Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
}
