# list-mailcount

Simple cli tool to list all emails, group them by their domain and display the
cumulated sum.

## Use cases

- Migrating to another email account and getting a simple checklist of important
  services you should adapt to your new email.
- Simply know who sends you emails and how often. Does any service spam you? Do
  you want to get rid of some old accounts?

## Usage

- Install list-mailcount cli `npm i -g list-mailcount`
- Create a configuration file `imapconfig.json` containing the required
  information to read your mails.
- Run list-mailcount `list-mailcount` 🎉
- An example output could be

```
  Done fetching all messages for: me@example.com
  Resulting mail map (sorted by count): Map(16) {
  'linkedin.com' => 28,
  'gmail.com' => 17,
  'JOIN.com' => 13,
  '1password.com' => 12,
  'quastor.org' => 11,
  'amazon.de' => 5,
  'npmjs.com' => 5,
  'youtube.com' => 4,
  'audible.de' => 3,
  'udemy.com' => 2,
  'expo.io' => 2,
  'paypal.de' => 1,
  'indeed.com' => 1,
  'deutschebahn.com' => 1,
  'airbnb.com' => 1,
  'medium.com' => 1,
}
```

## imapconfig.json

- The config matches the one required for the
  [imap](https://www.npmjs.com/package/imap) package.
- It is suggested to use the default secure port 993 and using tls. An arbitrary
  example config would be:

```json
[
  {
    "user": "me@example.com",
    "password": "thisIsThePasswordOfMyEmail",
    "host": "imap.example.com",
    "port": 993,
    "tls": true
  }
]
```

- If you want to check the mails for multiple accounts, simply add another
  object to the array.
