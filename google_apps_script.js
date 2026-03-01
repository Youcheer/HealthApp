// Copy and paste this code into your Google Apps Script editor (Extensions -> Apps Script from your Google Sheet).
// This is required to make the syncing work with your Health App.
// Important: Replace the existing code with this.
// Then click "Deploy" -> "New deployment", choose "Web app", execute as "Me", and access "Anyone".
// Use the new Web App URL in your Health App settings.

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var action = data.action;

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'export') {
       // Save config
       var configSheet = getOrCreateSheet(ss, 'Config');
       configSheet.clear();
       configSheet.appendRow(['Key', 'Value']);
       configSheet.appendRow(['config', JSON.stringify(data.config || {})]);
       
       // Save claims
       var claimsSheet = getOrCreateSheet(ss, 'Claims');
       claimsSheet.clear();
       claimsSheet.appendRow(['id', 'policyYear', 'date', 'category', 'amount', 'hospital', 'description', 'days', 'timestamp']); 
       
       if (data.claims && data.claims.length > 0) {
         var claimRows = data.claims.map(function(c) {
            return [c.id, c.policyYear, c.date, c.category, c.amount, c.hospital, c.description, c.days, c.timestamp];
         });
         claimsSheet.getRange(2, 1, claimRows.length, claimRows[0].length).setValues(claimRows);
       }

       // Save premiums
       var premiumsSheet = getOrCreateSheet(ss, 'Premiums');
       premiumsSheet.clear();
       premiumsSheet.appendRow(['id', 'policyYear', 'paidDate', 'dueDate', 'amount', 'timestamp']);
       
       if (data.premiums && data.premiums.length > 0) {
         var premiumRows = data.premiums.map(function(p) {
            return [p.id, p.policyYear, p.paidDate, p.dueDate, p.amount, p.timestamp];
         });
         premiumsSheet.getRange(2, 1, premiumRows.length, premiumRows[0].length).setValues(premiumRows);
       }

       var output = ContentService.createTextOutput(JSON.stringify({status: 'success'}));
       output.setMimeType(ContentService.MimeType.JSON);
       return output;
    }
  } catch(err) {
    var errOut = ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()}));
    errOut.setMimeType(ContentService.MimeType.JSON);
    return errOut;
  }
}

function doGet(e) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var result = {
         config: null,
         claims: [],
         premiums: []
      };
      
      var configSheet = ss.getSheetByName('Config');
      if (configSheet) {
         var v = configSheet.getRange(2, 2).getValue();
         if (v) result.config = JSON.parse(v);
      }

      var claimsSheet = ss.getSheetByName('Claims');
      if (claimsSheet && claimsSheet.getLastRow() > 1) {
         var rows = claimsSheet.getRange(2, 1, claimsSheet.getLastRow()-1, 9).getValues();
         result.claims = rows.map(function(r) {
            return {
               id: r[0], policyYear: r[1], date: r[2], category: r[3], amount: r[4], hospital: r[5], description: r[6], days: r[7] === "" ? null : r[7], timestamp: r[8]
            };
         });
      }

      var premiumsSheet = ss.getSheetByName('Premiums');
      if (premiumsSheet && premiumsSheet.getLastRow() > 1) {
         var rows = premiumsSheet.getRange(2, 1, premiumsSheet.getLastRow()-1, 6).getValues();
         result.premiums = rows.map(function(r) {
            return {
               id: r[0], policyYear: r[1], paidDate: r[2], dueDate: r[3], amount: r[4], timestamp: r[5]
            };
         });
      }

      var output = ContentService.createTextOutput(JSON.stringify({status: 'success', data: result}));
      output.setMimeType(ContentService.MimeType.JSON);
      return output;

    } catch(err) {
      var errOut = ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()}));
      errOut.setMimeType(ContentService.MimeType.JSON);
      return errOut;
    }
}

function getOrCreateSheet(ss, name) {
   var sheet = ss.getSheetByName(name);
   if (!sheet) {
     sheet = ss.insertSheet(name);
   }
   return sheet;
}

// Optional Setup
function InitialSetup() {
  getOrCreateSheet(SpreadsheetApp.getActiveSpreadsheet(), 'Config');
}
