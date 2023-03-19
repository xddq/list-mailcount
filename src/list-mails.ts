import Imap, { Box } from "imap";

type ConnectedToMailBoxCallback = (error: Error, mailbox: Box) => void;

// a second level domain e.g. wikipedia.org, google.com
type Domain = string & { readonly __tag: unique symbol };

/**
 * Used to get the second level domain based on a given "From" string of an
 * email
 **/
// NOTE: have to use this to also capture emails from mails like
// "registrierung@bundesanzeige.de" which somehow don't contain the '<''>'.
const getDomainFromEmailRegex1 = /<.*@(.*)>"?/;
const getDomainFromEmailRegex2 = /.*@(.*)"?/;

const getDomain = (from: string): Domain | null => {
  // NOTE: for now just run both regexes, later try to find one matching regex
  // for all. Problem happened at my hi@pd-dev.xyz mail.
  const firstRegexResult = getDomainFromEmailRegex1.exec(from);
  let regexResult = null;
  if (firstRegexResult === null) {
    regexResult = getDomainFromEmailRegex2.exec(from);
  } else {
    regexResult = firstRegexResult;
  }

  if (regexResult === null) {
    return regexResult;
  }

  const domain = regexResult[regexResult.length - 1];
  // NOTE: any ccTLD containing two dots have to be added here.
  if (domain.includes(".co.uk")) {
    return domain.split(".").slice(-3).join(".") as Domain;
  }
  return domain.split(".").slice(-2).join(".") as Domain;
};

/**
 * Reads out all emails for the given imap connection and prints/logs the list
 * of emails based on domain and their cumulated count to stdout.
 **/
export const readMailsForConnection = (imap: Imap, email: string) => {
  // Tracks the domains we got the emails from and their cumulated count.
  const gotEmailsFrom = new Map<Domain, number>();

  function openInbox(callback: ConnectedToMailBoxCallback): void {
    imap.openBox("INBOX", true, callback);
  }

  const scanMailHeaders: ConnectedToMailBoxCallback = (error, _mailbox) => {
    if (error) {
      throw error;
    }
    var f = imap.seq.fetch("1:*", {
      bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)",
      struct: true,
    });
    f.on("message", function (msg, _seqno) {
      // console.log("Message #%d", seqno);
      // var prefix = "(#" + seqno + ") ";
      msg.on("body", function (stream, _info) {
        var buffer = "";
        stream.on("data", function (chunk) {
          buffer += chunk.toString("utf8");
        });
        stream.once("end", function () {
          const from = Imap.parseHeader(buffer).from;
          const domain = getDomain(from[0]);
          if (domain === null) {
            console.log(
              "Somehow we got an error parsing the domain from the header. Header was:",
              from[0]
            );
            return;
          }
          const count = gotEmailsFrom.get(domain);
          if (count === undefined) {
            gotEmailsFrom.set(domain, 1);
            return;
          }
          gotEmailsFrom.set(domain, count + 1);
        });
      });
      msg.once("attributes", function (_attrs) {
        // console.log(prefix + "Attributes: %s", inspect(attrs, false, 8));
      });
      msg.once("end", function () {
        // console.log(prefix + "Finished");
      });
    });
    f.once("error", function (err) {
      console.log("Fetch error: " + err);
    });
    f.once("end", function () {
      console.log("Done fetching all messages for:", email);
      const sortedMap = new Map(
        [...gotEmailsFrom.entries()].sort((a, b) => b[1] - a[1])
      );
      console.log("Resulting mail map (sorted by count):", sortedMap);
      imap.end();
    });
  };

  imap.once("ready", function () {
    openInbox(scanMailHeaders);
  });

  imap.once("error", function (err: unknown) {
    console.log(err);
  });

  imap.once("end", function () {
    console.log("Connection ended");
  });

  imap.connect();
};
