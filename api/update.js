let users = new Set(); // لحفظ المستخدمين الحاليين
const webhookUrl = "https://discord.com/api/webhooks/1361419716245323846/9kQ3BRexfJU8MOv15oayn5F9mRt58ODQKQ1LHRxks8ubGjAajfNA_NF4Rb5OELjNRJe9"; // رابط ويبهوك الخاص بك

async function updateEmbed() {
  const data = {
    embeds: [
      {
        title: "مستخدمو السكربت حالياً",
        description: `العدد: ${users.size}`,
        fields: [...users].map(user => ({
          name: user,
          value: "نشط",
          inline: true
        })),
        color: 0x00ff00,
        timestamp: new Date()
      }
    ]
  };

  await fetch(webhookUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { action, user } = req.body;

  if (action === "join") {
    users.add(user);
  } else if (action === "leave") {
    users.delete(user);
  }

  await updateEmbed();

  res.status(200).json({ message: "تم التحديث" });
}
