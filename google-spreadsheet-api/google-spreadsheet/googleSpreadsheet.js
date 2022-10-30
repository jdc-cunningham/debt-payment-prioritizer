// based on https://isd-soft.com/tech_blog/accessing-google-apis-using-service-account-node-js/
// requires service account configured with key
// also have to share spreadsheet with your service account email

require('dotenv').config({
  path: __dirname + '/.env'
});

const { google } = require('googleapis');
const privateKey = require(`./${process.env.PRIVATE_KEY_JSON_PATH}`);
const sheets = google.sheets('v4');

const jwtClient = new google.auth.JWT(
  privateKey.client_email,
  null,
  privateKey.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

const authenticate = async () => {
  return new Promise(resolve => {
    jwtClient.authorize(function (err, tokens) {
      resolve(!err);
    });
  });
};

// this returns for example A13
const getLastRow = async () => {
  return new Promise(resolve => {
    sheets.spreadsheets.values.get({
        auth: jwtClient,
        spreadsheetId: process.env.SHEET_ID,
        range: `${process.env.TAB_NAME}!A12:A1000` // future problem, past 1000 lol that's far like 27 years if ran thrice a month
    }, (err, res) => {
      if (err) {
        resolve(false);
      } else {
        if (res.data) {
          const lastRow = 11 + res.data.values.length; // not sure what the 11 is from but it does work
          resolve(`A${lastRow}`);
        } else {
          resolve(false);
        }
      }
    });
  });
}

/**
 * look at this, a docblock!
 * @param {array} payload the values to be entered matching spreadsheet column count
 * // reference: https://developers.google.com/sheets/api/guides/values
 */
const _getLatestRow = async () => {
  const authenticated = await authenticate();

  return new Promise(async (resolve) => {
    if (authenticated) {
      const lastRow =  await getLastRow(); // eg. A13
      const lastRowLetter = lastRow[0];
      const rowNum = lastRow.split(lastRowLetter)[1];

      // future problem, past 1000 lol that's far like 27 years if ran thrice a month
      const range = `${process.env.TAB_NAME}!${lastRow}:X${rowNum}`;

      sheets.spreadsheets.values.get({
        auth: jwtClient,
        spreadsheetId: process.env.SHEET_ID,
        range,
      }, (err, res) => {
        if (err) {
          // handle this err
          resolve(false);
        } else {
          resolve(res.data.values[0]);
        }
      });
    } else {
      resolve(false);
    }
  });
}

const getLatestRow = async (req, res) => {
  const latestRow = await _getLatestRow();

  if (!latestRow) {
    res.status(400).json({err: true});
  } else {
    res.status(200).json({data: latestRow, err: false});
  }
}

module.exports = {
  getLatestRow
};