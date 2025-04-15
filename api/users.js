import axios from "axios";

const redisUrl = "https://leading-toad-21759.upstash.io";
const redisToken = "AVT_AAIjcDE1Y2EwNmJkMDc5ODA0NjBkOTcyZGI2ZTg3YTdhMGIxNXAxMA";

const webhookUrl = "https://discord.com/api/webhooks/1361419716245323846/9kQ3BRexfJU8MOv15oayn5F9mRt58ODQKQ1LHRxks8ubGjAajfNA_NF4Rb5OELjNRJe9";
const messageIdKey = "webhook_message_id";
const userPrefix = "user_";
const timeoutMs = 3 * 60 * 1000; // 3 دقائق

async function setRedis(key, value) {
  await fetch(`${redisUrl}/set/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ value })
  });
}

async function getRedis(key) {
  const res = await fetch(`${redisUrl}/get/${key}`, {
    headers: {
      Authorization: `Bearer ${redisToken}`
    }
  });
  const data = await res.json();
  return data.result;
}

async function getAllKeys() {
  const res = await fetch(`${redisUrl}/keys?prefix=${userPrefix}`, {
    headers: {
      Authorization: `Bearer ${redisToken}`
    }
  });
  const data = await res.json();
  return data.result || [];
}

async function deleteRedis(key) {
  await fetch(`${redisUrl}/del/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`
    }
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { action, user } = req.body;
  if (!user || action !== "ping") {
    return res.status(400).json({ error: "Invalid Data" });
  }

  const now = Date.now();
  await setRedis(userPrefix + user, now);

  // تنظيف المستخدمين الخاملين
  const keys = await getAllKeys();
  const activeUsers = [];

  for (const key of keys) {
    const lastSeen = await getRedis(key);
    if (now - parseInt(lastSeen) <= timeoutMs) {
      activeUsers.push(key.replace(userPrefix, ""));
    } else {
      await deleteRedis(key);
    }
  }

  // تحديث رسالة الويبهوك
  const messageId = await getRedis(messageIdKey);
  const embed = {
    title: "المستخدمين النشطين",
    description: `العدد الحالي: **${activeUsers.length}** مستخدم`,
    color: 0x00b0f4,
    timestamp: new Date().toISOString()
  };

  try {
    if (!messageId) {
      // أول مرة: أرسل رسالة جديدة واحتفظ بـ ID
      const resp = await axios.post(`${webhookUrl}?wait=true`, {
        content: null,
        embeds: [embed]
      });
      await setRedis(messageIdKey, resp.data.id);
    } else {
      // عدّل الرسالة السابقة
      await axios.patch(`${webhookUrl}/messages/${messageId}`, {
        content: null,
        embeds: [embed]
      });
    }
  } catch (err) {
    console.error("Webhook update failed:", err.message);
  }

  return res.status(200).json({
    message: "تم التحديث",
    count: activeUsers.length,
    users: activeUsers
  });
}
