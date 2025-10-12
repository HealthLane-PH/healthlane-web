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
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // expires in 7 days

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
                subject: "Set up your HealthLane Staff Account",
                html: `
  <div style="background-color:#f4f8f7;padding:40px 0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background-color:#ffffff;border-radius:12px;
              box-shadow:0 4px 12px rgba(0,0,0,0.05);overflow:hidden;">
    
    <!-- Header -->
    <div style="text-align:center;padding:32px 24px 16px;">
      <img src="https://firebasestorage.googleapis.com/v0/b/healthlane-55504.firebasestorage.app/o/assets%2Fhealthlane-colored-smaller.png?alt=media&token=8ba92fed-1d35-4805-add9-f038d9efb758"
           alt="HealthLane Logo"
           width="160"
           style="margin-bottom:8px;">
      <h2 style="font-size:20px;color:#1bae69;margin:0;font-weight:600;">
        Welcome, ${userData.firstName || ""}!
      </h2>
    </div>

    <!-- Body -->
    <div style="padding: 30px 70px;text-align:left;color:#333;">

      <p style="font-size:15px;line-height:1.6;margin-bottom:28px;">
        You’ve been added as a <b>staff member</b> on <b>HealthLane</b> — a trusted space where clinics and patients connect seamlessly.  
        To activate your account, please set your password below.
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${inviteLink}"
           style="display:inline-block;background-color:#1bae69;color:white;
                  font-weight:600;padding:12px 26px;text-decoration:none;
                  border-radius:8px;font-size:15px;">
          Set Your Password
        </a>
      </div>

      <p style="font-size:14px;color:#777;">
        Once your account is set, you can log in anytime at  
        <a href="https://www.healthlane.ph/staff-login" style="color:#1bae69;text-decoration:none;">healthlane.ph/staff-login</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color:#f8faf9;padding:20px 24px;text-align:center;font-size:13px;color:#666;">
      <p style="margin:0 0 6px;">The HealthLane Team</p>
      <p style="margin:0;font-size:12px;color:#999;">
        © ${new Date().getFullYear()} HealthLane PH. All rights reserved.
      </p>
    </div>

  </div>
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