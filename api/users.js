import axios from 'axios';

const webhookUrl = "https://discord.com/api/webhooks/1361419716245323846/9kQ3BRexfJU8MOv15oayn5F9mRt58ODQKQ1LHRxks8ubGjAajfNA_NF4Rb5OELjNRJe9";
const redisUrl = "https://leading-toad-21759.upstash.io";
const redisToken = "AVT_AAIjcDE1Y2EwNmJkMDc5ODA0NjBkOTcyZGI2ZTg3YTdhMGIxNXAxMA";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { user } = req.body;
  if (!user) return res.status(400).json({ error: "user is required" });

  try {
    // حفظ آخر ظهور للمستخدم
    await fetch(`${redisUrl}/set/user:${user}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        value: Date.now(),
        EX: 180 // صلاحية 3 دقائق
      }),
    });

    // جلب عدد المفاتيح
    const keysRes = await fetch(`${redisUrl}/keys/user:*`, {
      headers: {
        Authorization: `Bearer ${redisToken}`
      }
    });

    const keysData = await keysRes.json();
    const count = Array.isArray(keysData.result) ? keysData.result.length : 0;

    // إرسال رسالة إلى الـ Webhook
    const embed = {
      title: "مستخدمين السكربت الآن",
      description: `العدد الحالي: **${count}**`,
      color: 0x00ff00,
      timestamp: new Date().toISOString()
    };

    await axios.post(`${webhookUrl}?wait=true`, {
      embeds: [embed]
    });

    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
