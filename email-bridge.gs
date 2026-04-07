// ============================================================
// EMYRIS ONBOARD - EMAIL BRIDGE (Google Apps Script)
// Deploy this script under the hr@emyrisbio.com Google account
// so all emails arrive from hr@emyrisbio.com
// ============================================================

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var to      = payload.to;
    var subject = payload.subject;
    var html    = payload.html || payload.text || "";

    if (!to || !subject) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: "error", message: "Missing 'to' or 'subject'" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    GmailApp.sendEmail(to, subject, "", {
      htmlBody: html,
      name: "Emyris HR",
      // This will send FROM hr@emyrisbio.com automatically
      // because this script runs under that Google account
    });

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", sentTo: to }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test this by running doGet (optional health check)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", script: "Emyris Email Bridge", account: Session.getActiveUser().getEmail() }))
    .setMimeType(ContentService.MimeType.JSON);
}
