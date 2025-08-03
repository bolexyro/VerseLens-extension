function prepareBibleReferences() {
  const regex =
    /\b(?:[123]\s)?(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Proverbs|Ecclesiastes|Song\s?of\s?Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|John|Jude|Revelation|Gen|Ex|Lev|Num|Deut|Josh|Jdg|Ruth|1\s?Sam|2\s?Sam|1\s?Kgs|2\s?Kgs|1\s?Chr|2\s?Chr|Ezra|Neh|Est|Job|Psa|Ps|Prov|Eccl|Song|Isa|Jer|Lam|Ezek|Dan|Hos|Joel|Amos|Obad|Jonah|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Matt|Mk|Lk|Jn|Acts|Rom|1\s?Cor|2\s?Cor|Gal|Eph|Phil|Col|1\s?Thes|2\s?Thes|1\s?Tim|2\s?Tim|Titus|Phlm|Heb|Jas|1\s?Pet|2\s?Pet|1\s?Jn|2\s?Jn|3\s?Jn|Jude|Rev)\s+\d{1,3}(?::\d{1,3}(?:(?:-|–)\d{1,3})?)?\b/g;
  const className = "bible-reference-link";
  let pageContent = document.body.innerHTML;

  const newContent = pageContent.replace(regex, (match) => {
    return `<span class="${className}" style="text-decoration: underline; color: blue; cursor: pointer;">${match}</span>`;
  });

  document.body.innerHTML = newContent;
}

function addClickHandlers() {
  const className = "bible-reference-link";
  const links = document.querySelectorAll(`.${className}`);

  links.forEach((link) => {
    link.addEventListener("click", () => {
      const verse = link.textContent;
      chrome.runtime.sendMessage({
        action: "open_side_panel",
        verse: verse,
      });
    });
  });
}

prepareBibleReferences();
addClickHandlers();
