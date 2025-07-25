const cron = require("node-cron");
const AirQualityDevice = require("./models/airQualityModel");
const Customer = require("./models/customerModel");
const { connectToDatabase } = require("./config/db");
// const { sendMail } = require("./utils/mailer");

const sendMail = async (to, subject, text) => {
  console.log(to, "TO");
};

// // Function to check subscription expiry dates
async function checkSubscriptionExpiry() {
  const now = new Date();
  const reminders = [30, 15, 7, 3, 2, 1, 0];
  const adminEmail = "ekworthapp@gmail.com";

  const subscriptions = await AirQualityDevice.find({});

  try {
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
        let customers = await Customer.find({ company: sub.customerId });
        const emailSubject = `Subscription Expiry Reminder: Expiring ${
          days === 0 ? "Today" : "in" + days
        }`;
        const emailText = `
          Dear Customer,<br/>
          Your subscription is set to expire in ${
            days === 0 ? "Today" : days
          } day(s).<br/><br/>
          <b>Device: ${sub.deviceId}</b><br/><br/>
          Please renew your subscription to continue enjoying our services.<br/><br/>
          <b>Best regards,<br/>VG Team<b/>
        `;
        customers.forEach(async (cust) => {
          let email = cust.email;
          const toEmail = email;
          sendMail(toEmail, emailSubject, emailText);
        });
        sendMail(
          adminEmail,
          `Admin Alert: Subscription Expiry for ${sub.customerId}`,
          emailText
        );
      });
    }

    // Check for expired subscriptions (non-stop for 7 days after expiration)
    const expiredSince = new Date(now);
    expiredSince.setDate(now.getDate() - 7);
    console.log(expiredSince, now)
    const expiredSubscriptions = await AirQualityDevice.find({
      subsciptionExpiryDate: {
        $gte: expiredSince,
        $lt: now,
      },
    });
    console.log(expiredSubscriptions, 'expiredSubscriptions')
    expiredSubscriptions.forEach(async (sub) => {
      console.log(
        `Alert: Subscription for user ${sub.customerId} expired recently.`
      );
      let customers = await Customer.find({ company: sub.customerId });
      const emailSubject = "Subscription Expired";
      const emailText = `
          Dear Customer,<br/>
          Your subscription has expired. Please renew it to regain access to our services.<br/><br/>
          <b>Device: ${sub.deviceId}</b><br/><br/>
          Please renew your subscription to continue enjoying our services.<br/><br/>
          <b>Best regards,<br/>VG Team<b/>
        `;
      customers.forEach(async (cust) => {
        let email = cust.email;
        const toEmail = email;
        sendMail(toEmail, emailSubject, emailText);
      });
      sendMail(
        adminEmail,
        `Admin Alert: Subscription Expired for ${sub.customerId}`,
        emailText
      );
    });
  } catch (error) {
    console.log("Error checking subscription expiry:", error);
  }
}

connectToDatabase()
  .then((db) => {
    checkSubscriptionExpiry();
  })
  .catch((err) => {
    console.log(err);
  });
// cron.schedule('*/5 * * * * *', () => {
//     console.log('Cron job running every 5 seconds:', new Date().toLocaleTimeString());
//   });

module.exports = cron;
