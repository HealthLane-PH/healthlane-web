const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const sgMail = require("@sendgrid/mail");
const crypto = require("crypto");

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Set SendGrid API key (reuse what worked in index.js)
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


// Global options
setGlobalOptions({ maxInstances: 10 });

exports.sendStaffInvite = onDocumentCreated(
  { document: "users/{userId}", region: "asia-southeast1" },
  async (event) => {
    const userData = event.data.data();
    const userId = event.params.userId;

    if (!userData || userData.role !== "staff") return null;

    try {
      // 1️⃣ Generate token + hash + expiry
      const token = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // 2️⃣ Save hashed token & expiry
      await db.collection("users").doc(userId).update({
        inviteToken: hashedToken,
        inviteExpires: expiresAt,
      });

      // 3️⃣ Build invite link
      const inviteLink = `https://healthlane.ph/set-password?email=${encodeURIComponent(
        userData.email
      )}&token=${token}`;

      // 4️⃣ Compose email
      const msg = {
        to: userData.email,
        from: {
          email: "info@healthlane.ph",
          name: "HealthLane PH",
        },
        subject: "👋 Set up your HealthLane Staff Account",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Hi ${userData.firstName || ""},</h2>
            <p>You've been added as a staff member on <b>HealthLane</b>.</p>
            <p>To activate your account, please set your password below:</p>
            <p>
              <a href="${inviteLink}"
                style="display:inline-block;background-color:#1bae69;color:white;
                       padding:10px 18px;text-decoration:none;border-radius:6px;">
                Set Your Password
              </a>
            </p>
            <p style="font-size:0.9em;color:#555;">This link will expire in 1 hour.</p>
            <p>— The HealthLane Team 💚</p>
          </div>
        `,
      };

      await sgMail.send(msg);
      console.log(`✅ Staff invite sent to ${userData.email}`);
    } catch (err) {
      console.error("❌ Error sending staff invite:", err);
    }

    return null;
  }
);