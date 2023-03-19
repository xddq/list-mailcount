#!/usr/bin/env node
import fs from "fs";
import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import Imap from "imap";

import { readMailsForConnection } from "./list-mails";

const ImapConfig = Type.Array(
  Type.Object({
    user: Type.String(),
    password: Type.String(),
    host: Type.String(),
    tls: Type.Optional(Type.Boolean()),
  })
);

const main = () => {
  // something is wrong, default to display the help text to explain the usage.
  if (process.argv.length !== 2) {
    console.log("version: ", process.env.npm_package_version);
    console.log(`
list-mailcount is a tool to list all emails, group them by their domain and display the cumulated sum.

For this to work you need to specify the required config to get the emails of
your account in a file called 'imapconfig.json'.
An example imapconfig.json could look like:

[
  {
    "user": "me@example.com",
    "password": "thisIsThePasswordOfMyEmail",
    "host": "imap.example.com",
    "port": 993,
    "tls": true
  },
]

Then simply run list-mailcount to understand who sends you email and how often (the following is an arbitrary example output):
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

You can browse https://github.com/xddq/list-mailcount to read the source code.
`);
    process.exit(0);
  }

  let unparsedImapConfig;
  try {
    unparsedImapConfig = fs.readFileSync(
      process.cwd() + "/imapconfig.json",
      "utf8"
    );
  } catch (error) {
    console.log(
      "Sorry, got an error reading the imapconfig.json file! The error was:\n\n",
      error
    );
    process.exit(1);
  }

  const parsedImapConfig = JSON.parse(unparsedImapConfig) as unknown;
  const typeChecker = TypeCompiler.Compile(ImapConfig);
  if (!typeChecker.Check(parsedImapConfig)) {
    const errors = [...typeChecker.Errors(parsedImapConfig)];
    console.log(
      "Sorry, your imapconfig.json appears to be invalid. Validation errors:\n\n",
      errors
    );
    process.exit(1);
  }

  if (parsedImapConfig.length === 0) {
    console.log(
      "Sorry, your imapconfig.json file seems to not contain any configuration objects."
    );
    process.exit(1);
  }

  parsedImapConfig.forEach((imapConfig) => {
    const connection = new Imap(imapConfig);
    readMailsForConnection(connection, imapConfig.user);
  });
};

main();
