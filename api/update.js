import { MongoClient } from "mongodb";

// رابط الاتصال المباشر بقاعدة البيانات (استبدله برابطك الحقيقي)
const uri = "mongodb+srv://cekode8509:kkbRwgxcJJZwmpuW@cluster0.sfdrr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

const webhookUrl = "https://discord.com/api/webhooks/1361419716245323846/9kQ3BRexfJU8MOv15oayn5F9mRt58ODQKQ1LHRxks8ubGjAajfNA_NF4Rb5OELjNRJe9"; // استبدل برابط ويبهوك ديسكورد

async function updateEmbed(users) {
  const data = {
    embeds: [
      {
        title: "المستخدمين الحاليين للسكربت",
        description: `العدد: ${users.length}`,
        fields: users.map((user) => ({
          name: user,
          value: "نشط",
          inline: true,
        })),
        color: 0x00ff00,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  await fetch(webhookUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST فقط مدعوم" });
  }

  const { action, user } = req.body;
  if (!user || (action !== "join" && action !== "leave")) {
    return res.status(400).json({ error: "بيانات غير صحيحة" });
  }

  try {
    await client.connect();
    const db = client.db("robloxTracker");
    const collection = db.collection("users");

    if (action === "join") {
      await collection.updateOne({ user }, { $set: { user } }, { upsert: true });
    } else if (action === "leave") {
      await collection.deleteOne({ user });
    }

    const allUsers = await collection.find().toArray();
    const usernames = allUsers.map((u) => u.user);

    await updateEmbed(usernames);

    res.status(200).json({ message: "تم التحديث" });
  } catch (error) {
    console.error("خطأ:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  } finally {
    await client.close();
  }
}
