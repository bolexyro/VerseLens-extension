const bookMap = {
  // Old Testament
  Genesis: "GEN",
  Gen: "GEN",
  Exodus: "EXO",
  Exo: "EXO",
  Leviticus: "LEV",
  Lev: "LEV",
  Numbers: "NUM",
  Num: "NUM",
  Deuteronomy: "DEU",
  Deu: "DEU",
  Joshua: "JOS",
  Josh: "JOS",
  Judges: "JDG",
  Jdg: "JDG",
  Ruth: "RUT",
  "1 Samuel": "1SA",
  "1 Sam": "1SA",
  "1 Saml": "1SA",
  "2 Samuel": "2SA",
  "2 Sam": "2SA",
  "2 Saml": "2SA",
  "1 Kings": "1KI",
  "1 Kgs": "1KI",
  "2 Kings": "2KI",
  "2 Kgs": "2KI",
  "1 Chronicles": "1CH",
  "1 Chron": "1CH",
  "2 Chronicles": "2CH",
  "2 Chron": "2CH",
  Ezra: "EZR",
  Nehemiah: "NEH",
  Neh: "NEH",
  Esther: "EST",
  Est: "EST",
  Job: "JOB",
  Psalms: "PSA",
  Ps: "PSA",
  Psa: "PSA",
  Proverbs: "PRO",
  Prov: "PRO",
  Ecclesiastes: "ECC",
  Ecc: "ECC",
  "Song of Solomon": "SNG",
  Song: "SNG",
  Isaiah: "ISA",
  Isa: "ISA",
  Jeremiah: "JER",
  Jer: "JER",
  Lamentations: "LAM",
  Lam: "LAM",
  Ezekiel: "EZK",
  Ezek: "EZK",
  Daniel: "DAN",
  Dan: "DAN",
  Hosea: "HOS",
  Joel: "JOL",
  Amos: "AMO",
  Obadiah: "OBA",
  Obad: "OBA",
  Jonah: "JON",
  Micah: "MIC",
  Nahum: "NAM",
  Habakkuk: "HAB",
  Hab: "HAB",
  Zephaniah: "ZEP",
  Zeph: "ZEP",
  Haggai: "HAG",
  Hag: "HAG",
  Zechariah: "ZEC",
  Zech: "ZEC",
  Malachi: "MAL",
  Mal: "MAL",

  // New Testament
  Matthew: "MAT",
  Matt: "MAT",
  Mark: "MRK",
  Luke: "LUK",
  John: "JHN",
  Jn: "JHN",
  Acts: "ACT",
  Romans: "ROM",
  Rom: "ROM",
  "1 Corinthians": "1CO",
  "1 Cor": "1CO",
  "2 Corinthians": "2CO",
  "2 Cor": "2CO",
  Galatians: "GAL",
  Gal: "GAL",
  Ephesians: "EPH",
  Eph: "EPH",
  Philippians: "PHP",
  Phil: "PHP",
  Colossians: "COL",
  Col: "COL",
  "1 Thessalonians": "1TH",
  "1 Thes": "1TH",
  "2 Thessalonians": "2TH",
  "2 Thes": "2TH",
  "1 Timothy": "1TI",
  "1 Tim": "1TI",
  "2 Timothy": "2TI",
  "2 Tim": "2TI",
  Titus: "TIT",
  Philemon: "PHM",
  Phlm: "PHM",
  Hebrews: "HEB",
  Heb: "HEB",
  James: "JAS",
  Jas: "JAS",
  "1 Peter": "1PE",
  "1 Pet": "1PE",
  "2 Peter": "2PE",
  "2 Pet": "2PE",
  "1 John": "1JN",
  "1 Jn": "1JN",
  "2 John": "2JN",
  "2 Jn": "2JN",
  "3 John": "3JN",
  "3 Jn": "3JN",
  Jude: "JUD",
  Revelation: "REV",
  Rev: "REV",
};

const fallbackUrl = "https://www.bible.com/bible/116/GEN.1.NLT"; // Default URL if parsing fails
function getBibleUrl(reference) {
  const partsRegex = /^(.*?)\s+(\d+)(:\d+(?:[-–]\d+)?)?$/;
  const parts = reference.match(partsRegex);

  if (!parts) {
    console.error(`Could not parse reference: ${reference}`);
    return fallbackUrl;
  }

  const [, book, chapter, verses] = parts;
  const formattedBook = bookMap[book.trim()];

  if (!formattedBook) {
    console.error(`Book not found in mapping: ${book.trim()}`);
    return fallbackUrl;
  }

  let formattedReference = chapter;
  if (verses) {
    // This line has been updated to handle both hyphens and em dashes
    formattedReference += verses.replace(/[:\s]/g, ".");
    formattedReference = formattedReference.replaceAll("–", "-");
  }

  console.log(`Formatted reference: ${formattedBook}.${formattedReference}`);

  return `https://www.bible.com/bible/116/${formattedBook}.${formattedReference}`;
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "open_side_panel" && message.verse) {
    const bibleFrame = document.getElementById("bibleFrame");
    if (bibleFrame) {
      const newUrl = getBibleUrl(message.verse);
      bibleFrame.src = newUrl;
      console.log("Updated iframe URL to:", newUrl);
    }
  }
});
