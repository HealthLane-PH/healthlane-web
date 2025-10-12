const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const sgMail = require("@sendgrid/mail");

// 🔹 Initialize Firebase
initializeApp();
const db = getFirestore();

// 🔹 Set SendGrid API key from environment
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


// 🔹 Global options for Cloud Functions
setGlobalOptions({ maxInstances: 10 });

// --- Firestore Trigger: Doctor Verified ---
exports.notifyDoctorVerification = onDocumentWritten(
  { document: "doctors/{doctorId}", region: "asia-southeast1" },
  async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();

  // Skip if document was deleted or doesn’t exist
  if (!before || !after) return;

  // Only trigger when status changes from Pending → Active
  if (before.status !== "Active" && after.status === "Active") {
    const doctorEmail = after.email;
    const doctorName = `${after.firstName} ${after.lastName}`;

    const msg = {
      to: doctorEmail,
      from: {
        email: "info@healthlane.ph",
        name: "HealthLane PH",
      },
      subject: "🎉 Your HealthLane account has been verified!",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Hi Dr. ${doctorName},</h2>
          <p>Your verification has been completed successfully! You can now access your full HealthLane dashboard and start managing your clinic online.</p>
          <p>
            <a href="https://healthlane.ph/login"
              style="display:inline-block;background-color:#1bae69;color:white;
                     padding:10px 18px;text-decoration:none;border-radius:6px;">
              Go to Dashboard
            </a>
          </p>
          <p style="font-size:0.9em;color:#555;">If you’ve already created an account, you can log in right away using your registered email.</p>
          <p>— The HealthLane Team 💚</p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Verification email sent to ${doctorEmail}`);
    } catch (error) {
      console.error("❌ Error sending email:", error);
    }
  }
});

exports.sendStaffInvite = require("./staffInvite").sendStaffInvite;