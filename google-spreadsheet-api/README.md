### About
This is a way to pull data from a spreadsheet and write them into this basic card-layout front end.

This bit is not necessary to run the front-end on its own that stores data into `localStorage`.

### Requirements
This requires sharing a Google Spreadsheet with a service account (that you own/create).

You will need a service account `.json` file for the Google Auth JWT access info.

More info from this [tutorial](https://isd-soft.com/tech_blog/accessing-google-apis-using-service-account-node-js/) which is what I based this on.

### More on service accounts
You'll have to [make one](https://console.cloud.google.com/iam-admin/serviceaccounts), set a key and also share the spreadsheet to this email.

### Disclaimer

Please note that the spreadsheet's column structure maps to the front-end cards (order of creation) so it will more than likely not work for you.

This is due to avoiding disclosing my account names

You could come up with some dynamic column mapping process but I'm not interested in that right now. This is a lazy app I sometimes work on.