### About

This is a basic debt payoff prioritizer app which is based on the APR/balance.

<img src="./ui-update-12072022.png" width="800"/>

### Live app
[View GitHub Pages app](https://jdc-cunningham.github.io/debt-payment-prioritizer/)

### Where is the code?

It's in the `docs` folder, otherwise have to use root and don't want to have API code readable, not a big deal but yeah.

### Bugs
* one weird one, after you enter data, need to refresh for the amount to work, otherwise the min $50 per card multiplication doesn't work correctly.
### Disclaimer
This app has no authentication and stores your data in plaintext on your computer (`localStorage`).

### Features
- [x] google spreadsheet sync
- [x] add card limit for usage color indicator
- [ ] edit mode add due date
- [ ] add ability to mark as paid (all local state so just add prop to obj)
- [x] edit entries (amount only)

### Icons from UXWing