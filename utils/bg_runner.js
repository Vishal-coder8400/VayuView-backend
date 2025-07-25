const cron = require("node-cron");
const AirQualityDevice = require("../models/airQualityModel");
const Customer = require("../models/customerModel");
const { sendMail } = require("./mailer"); // ✅ Make sure you have this utility

async function checkSubscriptionExpiry() {
  const now = new Date();
  const reminders = [30, 15, 7, 3, 2, 1];
  const adminEmail = "ekworthapp@gmail.com";

  try {
    // Reminder loop
    for (let days of reminders) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + days);

      const subscriptions = await AirQualityDevice.find({
        subsciptionExpiryDate: {
          $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          $lt: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
      });

      subscriptions.forEach(async (sub) => {
        console.log(`Reminder: Subscription for user ${sub.customerId} expires in ${days} days.`);

        const customer = await Customer.findOne({ customerId: sub.customerId });
        const toEmail = customer?.email || sub.email;
        const emailSubject = "Subscription Expiry Reminder";
        const emailText = `
          Dear Customer,<br/>
          Your subscription is set to expire in ${days} day(s).<br/><br/>
          Please renew your subscription to continue enjoying our services.<br/><br/>
          <b>Best regards,<br/>VG Team<b/>
        `;

        sendMail(toEmail, emailSubject, emailText);
        sendMail(adminEmail, `Admin Alert: Subscription Expiry for ${sub.customerId}`, emailText);
      });
    }

    // Recently expired (within 7 days)
    const expiredSince = new Date(now);
    expiredSince.setDate(now.getDate() - 7);

    const expiredSubscriptions = await AirQualityDevice.find({
      subsciptionExpiryDate: {
        $gte: expiredSince,
        $lt: now,
      },
    });

    expiredSubscriptions.forEach(async (sub) => {
      console.log(`Alert: Subscription for user ${sub.customerId} expired recently.`);

      const customer = await Customer.findOne({ customerId: sub.customerId });
      const toEmail = customer?.email || sub.email;
      const emailSubject = "Subscription Expired";
      const emailText = `
        Dear Customer,<br/>
        Your subscription has expired. Please renew it to regain access to our services.<br/><br/>
        <b>Best regards,<br/>VG Team<b/>
      `;

      sendMail(toEmail, emailSubject, emailText);
      sendMail(adminEmail, `Admin Alert: Subscription Expired for ${sub.customerId}`, emailText);
    });
  } catch (error) {
    console.error("Error checking subscription expiry:", error);
  }
}

// Run once immediately (optional)
checkSubscriptionExpiry();

// You can uncomment this for scheduled checks (e.g., every day at midnight):
// cron.schedule("0 0 * * *", checkSubscriptionExpiry);

module.exports = cron;
