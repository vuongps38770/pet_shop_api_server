// const Redis = require('ioredis');
// const redis = new Redis('redis://default:uUKeJfsBd4O9fkVBF6cem7iGgd55RCze@redis-15379.crce178.ap-east-1-1.ec2.redns.redis-cloud.com:15379'); // hoặc URL cloud của bạn

// async function main() {
//   let count = 0;
//   setInterval(async () => {
//     try {
//       await redis.set('foo', 'bar');
//       const value = await redis.get('foo');
//       console.log(`[${++count}] Value:`, value);
//     } catch (e) {
//       console.error(`[${++count}] Error:`, e);
//     }
//   }, 2000); // mỗi 2 giây gọi 1 lần
// }

// main();
const zaloPayConfig = {
  app_id: 2554,             // AppID test của bạn (nên để .env)
  key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",    // Key1 test của bạn
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
};
router.post("/zalopay", async (req, res) => {
  try {
    const { amount = 10000 } = req.body;
    const order = {
      app_id: zaloPayConfig.app_id,
      app_trans_id: `${new Date().getFullYear()}${("0" + (new Date().getMonth() + 1)).slice(-2)}${("0" + new Date().getDate()).slice(-2)}_${Date.now()}`,
      app_user: "user_test",
      app_time: Date.now(),
      amount: amount,
      item: JSON.stringify([]), // PHẢI stringify
      embed_data: JSON.stringify({}), // PHẢI stringify
      description: `ZaloPay test order`,
      bank_code: "zalopayapp",
      // callback_url: "https://zalopay.vn/", // URL hợp lệ
    };
    // MAC ký bảo mật
    const data =
      order.app_id +
      "|" +
      order.app_trans_id +
      "|" +
      order.app_user +
      "|" +
      order.amount +
      "|" +
      order.app_time +
      "|" +
      order.embed_data +
      "|" +
      order.item;
    order.mac = crypto.createHmac("sha256", zaloPayConfig.key1).update(data).digest("hex");

    // Gửi request
    const response = await axios.post(zaloPayConfig.endpoint, null, { params: order });
    res.json(response.data);
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});