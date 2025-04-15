import { MongoClient } from "mongodb";

// رابط الاتصال بقاعدة البيانات
const uri = "mongodb://dryfd009:paiwhdkdjwjw@db.wick.ink:27017/db_dryfd009?authSource=admin";
const client = new MongoClient(uri);

// رابط الـ Webhook ثابت داخل الكود
const webhookUrl = "https://discord.com/api/webhooks/1361419716245323846/9kQ3BRexfJU8MOv15oayn5F9mRt58ODQKQ1LHRxks8ubGjAajfNA_NF4Rb5OELjNRJe9";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { action, user } = req.body;

  if (!user || (action !== "join" && action !== "leave")) {
    return res.status(400).json({ error: "Invalid Data" });
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

    res.status(200).json({
      message: "تم التحديث",
      users: usernames,
      count: usernames.length,
      webhook: webhookUrl
    });
  } catch (error) {
    console.error("خطأ:", error);
    res.status(500).json({ error: "Server Error" });
  } finally {
    await client.close();
  }
}