// ============================================================
// EMYRIS ONBOARD - EMAIL BRIDGE (Google Apps Script)
// Deploy this script under the emy.onboardapp@gmail.com account
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

    var attachmentsData = payload.attachments || [];
    var blobs = [];

    for (var i = 0; i < attachmentsData.length; i++) {
      var att = attachmentsData[i];
      var content = att.content;
      
      // Remove data:application/pdf;base64, prefix if present
      if (content.indexOf(",") > -1) {
        content = content.split(",")[1];
      }
      
      var decoded = Utilities.base64Decode(content);
      var blob = Utilities.newBlob(decoded, att.contentType || 'application/octet-stream', att.filename || "attachment_" + i);
      blobs.push(blob);
    }

    GmailApp.sendEmail(to, subject, "", {
      htmlBody: html,
      name: "Emyris HR",
      attachments: blobs
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

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", script: "Emyris Email Bridge", account: Session.getActiveUser().getEmail() }))
    .setMimeType(ContentService.MimeType.JSON);
}
