chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Bible books data will be populated from API
let bibleBooksWithChapters = {};
let versionIds = {}; // Maps abbreviation_local to bible_id
let currentBibleBooks = [];
let currentVersions = [];

// State
let selectedBook = null;
let selectedChapter = null;
let selectedVersion = null;
let searchQuery = "";

// Track previous state for render optimization
let prevBook = null;
let prevChapter = null;
let prevVersion = null;

// Keep track of loading states
let isLoadingBibleData = false;

// DOM elements
const bookDropdownContainer = document.getElementById("bookDropdownContainer");
const bookDropdownButton = document.getElementById("bookDropdownButton");
const bookDropdown = document.getElementById("bookDropdown");
const bookChevron = document.getElementById("bookChevron");
const selectedBookText = document.getElementById("selectedBookText");
const searchInput = document.getElementById("searchInput");
const clearButton = document.getElementById("clearButton");
const booksList = document.getElementById("booksList");
const booksListShimmer = document.getElementById("booksListShimmer");

const chapterSection = document.getElementById("chapterSection");
const chapterGrid = document.getElementById("chapterGrid");

const versionDropdownContainer = document.getElementById(
  "versionDropdownContainer"
);
const versionDropdownButton = document.getElementById("versionDropdownButton");
const versionDropdown = document.getElementById("versionDropdown");
const versionChevron = document.getElementById("versionChevron");
const selectedVersionText = document.getElementById("selectedVersionText");
const versionsList = document.getElementById("versionsList");
const versionsListShimmer = document.getElementById("versionsListShimmer");

const mainTitle = document.getElementById("mainTitle");
const chapterHeading = document.getElementById("chapterHeading");
const bibleTextContent = document.getElementById("bibleTextContent");

const welcomeMessage = document.getElementById("welcomeMessage");
const mainContentLoader = document.getElementById("mainContentLoader");

// Fetch books and versions from API
async function loadBibleData() {
  isLoadingBibleData = true;

  // Update book dropdown
  bookDropdownButton.classList.add("loading");
  bookDropdownButton.disabled = true;
  selectedBookText.textContent = "Select Version First";
  bookChevron.classList.add("hidden");
  booksListShimmer.classList.remove("hidden");
  booksList.classList.add("hidden");

  // Update version dropdown
  versionDropdownButton.classList.add("loading");
  selectedVersionText.textContent = "Loading Versions...";
  versionChevron.classList.add("hidden");
  versionsListShimmer.classList.remove("hidden");
  versionsList.classList.add("hidden");

  try {
    const response = await fetch("http://localhost:8000/bibles");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Process API response
    bibleBooksWithChapters = {};
    versionIds = {};
    currentVersions = data.map((version) => {
      bibleBooksWithChapters[version.abbreviation_local] = {};
      version.books.forEach((book) => {
        bibleBooksWithChapters[version.abbreviation_local][book.name] = {
          end_chapter: book.end_chapter,
          has_intro: book.has_intro,
          book_id: book.id,
        };
      });
      versionIds[version.abbreviation_local] = version.id;
      return version.abbreviation_local;
    });

    isLoadingBibleData = false;

    // Update version dropdown
    versionDropdownButton.classList.remove("loading");
    selectedVersionText.textContent = selectedVersion || "Select Version";
    versionChevron.classList.remove("hidden");
    versionsListShimmer.classList.add("hidden");
    versionsList.classList.remove("hidden");

    // Only update book dropdown if a version is selected
    if (selectedVersion) {
      currentBibleBooks = Object.keys(
        bibleBooksWithChapters[selectedVersion] || {}
      );
      bookDropdownButton.classList.remove("loading");
      bookDropdownButton.disabled = false;
      selectedBookText.textContent = selectedBook || "Select Book";
      bookChevron.classList.remove("hidden");
      booksListShimmer.classList.add("hidden");
      booksList.classList.remove("hidden");
    } else {
      bookDropdownButton.classList.remove("loading");
      bookDropdownButton.disabled = true;
      selectedBookText.textContent = "Select Version First";
      bookChevron.classList.add("hidden");
      booksListShimmer.classList.add("hidden");
      booksList.classList.remove("hidden");
      currentBibleBooks = [];
    }

    renderBooks();
    renderVersions();

    // If a book is already selected, update chapter grid
    if (selectedBook && selectedVersion) {
      populateChapterGrid(selectedBook);
    }
  } catch (error) {
    console.error("Error loading Bible data:", error);
    // Handle error gracefully
    bookDropdownButton.classList.remove("loading");
    bookDropdownButton.disabled = true;
    selectedBookText.textContent = "Error Loading Books";
    bookChevron.classList.add("hidden");
    booksListShimmer.classList.add("hidden");
    booksList.classList.remove("hidden");

    versionDropdownButton.classList.remove("loading");
    selectedVersionText.textContent = "Error Loading Versions";
    versionChevron.classList.remove("hidden");
    versionsListShimmer.classList.add("hidden");
    versionsList.classList.remove("hidden");
  }
}

// Initialize
async function init() {
  welcomeMessage.classList.remove("hidden");
  mainChapterContent.classList.add("hidden");
  mainContentLoader.classList.add("hidden");

  bookDropdownButton.disabled = true;
  selectedBookText.textContent = "Select Version First";

  // Load Bible data
  await loadBibleData();
}

// Helper function to get max chapters and intro status
function getBookInfo(bookName, version = selectedVersion) {
  const bookData = bibleBooksWithChapters[version]?.[bookName] || {
    end_chapter: 1,
    has_intro: false,
    book_id: "",
  };
  return {
    maxChapters: bookData.end_chapter,
    hasIntro: bookData.has_intro,
    bookId: bookData.book_id,
  };
}

// Render books list
function renderBooks() {
  if (isLoadingBibleData || !selectedVersion) {
    booksListShimmer.classList.remove("hidden");
    booksList.classList.add("hidden");
    return;
  }

  const filteredBooks = currentBibleBooks.filter((book) =>
    book.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredBooks.length === 0) {
    booksList.innerHTML = '<div class="no-results">No books found</div>';
    booksList.classList.remove("hidden");
    booksListShimmer.classList.add("hidden");
    return;
  }

  booksList.innerHTML = filteredBooks
    .map(
      (book) => `
      <button class="book-item ${
        book === selectedBook ? "selected" : ""
      }" data-book="${book}">
        ${book}
      </button>
    `
    )
    .join("");

  booksList.querySelectorAll(".book-item").forEach((item) => {
    item.addEventListener("click", () => {
      selectBookForChapterSelection(item.dataset.book);
    });
  });

  booksList.classList.remove("hidden");
  booksListShimmer.classList.add("hidden");
}

// Select book and show chapter grid
function selectBookForChapterSelection(book) {
  const oldSelected = booksList.querySelector(".book-item.selected");
  if (oldSelected) {
    oldSelected.classList.remove("selected");
  }
  const newSelected = booksList.querySelector(`[data-book="${book}"]`);
  if (newSelected) {
    newSelected.classList.add("selected");
  }

  // Only reset chapter if the book has changed
  if (book !== selectedBook) {
    selectedBook = book;
    selectedChapter = null; // Reset chapter selection for new book
  }

  chapterSection.classList.remove("hidden");
  populateChapterGrid(book);

  // Trigger render only if chapter was reset or book changed
  if (book !== selectedBook || selectedChapter === null) {
    renderChapter();
  }
}

// Populate the chapter grid
function populateChapterGrid(bookName) {
  chapterGrid.innerHTML = "";
  const { maxChapters, hasIntro } = getBookInfo(bookName);

  // Add intro chapter if present
  if (hasIntro) {
    const introItem = document.createElement("button");
    introItem.classList.add("chapter-item");
    introItem.textContent = "Intro";
    introItem.dataset.chapter = "0";
    if (bookName === selectedBook && selectedChapter === 0) {
      introItem.classList.add("selected");
    }
    introItem.addEventListener("click", (event) => {
      selectChapter(bookName, 0);
    });
    chapterGrid.appendChild(introItem);
  }

  // Add numbered chapters
  for (let i = 1; i <= maxChapters; i++) {
    const chapterItem = document.createElement("button");
    chapterItem.classList.add("chapter-item");
    chapterItem.textContent = i;
    chapterItem.dataset.chapter = i;
    if (bookName === selectedBook && i === selectedChapter) {
      chapterItem.classList.add("selected");
    }
    chapterItem.addEventListener("click", (event) => {
      selectChapter(bookName, parseInt(event.target.dataset.chapter));
    });
    chapterGrid.appendChild(chapterItem);
  }
}

// Final selection - book and chapter
function selectChapter(book, chapter) {
  selectedBook = book;
  selectedChapter = chapter;
  selectedBookText.textContent = book;
  closeBookDropdown();
  renderChapter();
}

// Render versions list
function renderVersions() {
  if (isLoadingBibleData) {
    versionsListShimmer.classList.remove("hidden");
    versionsList.classList.add("hidden");
    return;
  }

  versionsList.innerHTML = currentVersions
    .map(
      (version) => `
      <button class="version-item ${
        version === selectedVersion ? "selected" : ""
      }" data-version="${version}">
        ${version}
      </button>
    `
    )
    .join("");

  versionsList.querySelectorAll(".version-item").forEach((item) => {
    item.addEventListener("click", () => {
      selectVersion(item.dataset.version);
    });
  });

  versionsList.classList.remove("hidden");
  versionsListShimmer.classList.add("hidden");
}

// Select version
function selectVersion(version) {
  selectedVersion = version;
  selectedVersionText.textContent = version;
  closeVersionDropdown();

  // Update current books based on selected version
  currentBibleBooks = Object.keys(bibleBooksWithChapters[version] || {});
  bookDropdownButton.disabled = false;
  selectedBookText.textContent = selectedBook || "Select Book";
  bookChevron.classList.remove("hidden");
  renderBooks();

  // Update chapter grid if a book is selected
  if (selectedBook) {
    if (!currentBibleBooks.includes(selectedBook)) {
      selectedBook = null;
      selectedChapter = null;
      selectedBookText.textContent = "Select Book";
      chapterSection.classList.add("hidden");
    } else {
      populateChapterGrid(selectedBook);
    }
  }

  renderChapter();
}

// Renders the main chapter content or keeps welcome message/loader
async function renderChapter() {
  // Check if any selection has changed
  if (
    selectedBook === prevBook &&
    selectedChapter === prevChapter &&
    selectedVersion === prevVersion
  ) {
    console.log("No changes in selection, skipping renderChapter");
    return;
  }

  try {
    console.log(
      "renderChapter called with:",
      selectedBook,
      selectedChapter,
      selectedVersion
    );
    if (!selectedBook || selectedChapter === null || !selectedVersion) {
      console.log("Missing selection, showing welcome message");
      welcomeMessage.classList.remove("hidden");
      mainChapterContent.classList.add("hidden");
      mainContentLoader.classList.add("hidden");
      // Clear previous state if selections are incomplete
      prevBook = null;
      prevChapter = null;
      prevVersion = null;
      return;
    }

    console.log("Showing loader");
    welcomeMessage.classList.add("hidden");
    mainChapterContent.classList.add("hidden");
    mainContentLoader.classList.remove("hidden");

    mainTitle.textContent = `${selectedBook.toUpperCase()} ${
      selectedChapter === 0 ? "Intro" : selectedChapter
    }`;

    console.log("Fetching content...");
    await fetchChapterContent(selectedBook, selectedChapter, selectedVersion);

    console.log("Hiding loader, showing content");
    mainContentLoader.classList.add("hidden");
    mainChapterContent.classList.remove("hidden");

    // Update previous state only after successful render
    prevBook = selectedBook;
    prevChapter = selectedChapter;
    prevVersion = selectedVersion;
  } catch (error) {
    console.error("Error in renderChapter:", error);
    mainContentLoader.classList.add("hidden");
    welcomeMessage.classList.remove("hidden");
    // Do not update previous state on error
  }
}

// Fetch chapter content from API
async function fetchChapterContent(book, chapter, version) {
  try {
    const { bookId } = getBookInfo(book, version);
    if (!bookId) {
      throw new Error(`Book ID not found for ${book} in ${version}`);
    }
    const bibleId = versionIds[version];
    if (!bibleId) {
      throw new Error(`Bible ID not found for version ${version}`);
    }

    if (chapter === 0) {
      chapter = "intro.0";
    }
    const chapterId = `${bookId}.${chapter}`;

    const response = await fetch(
      `http://localhost:8000/bibles/${bibleId}/chapters/${chapterId}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Set chapter heading
    if (!data.header) {
      chapterHeading.classList.add("hidden");
    } else {
      chapterHeading.classList.remove("hidden");
      chapterHeading.textContent = data.header;
    }

    // Add intro-text class for intro chapters
    bibleTextContent.classList.remove("intro-text");
    if (chapter === "intro.0") {
      bibleTextContent.classList.add("intro-text");
    }

    // Format verses
    bibleTextContent.innerHTML = data.verses
      .map(
        (verse, index) => `
        <p><span class="verse-number">${index + 1}</span>${verse}</p>
      `
      )
      .join("");
  } catch (error) {
    console.error("Error fetching chapter content:", error);
    mainContentLoader.classList.add("hidden");
    welcomeMessage.classList.remove("hidden");
    throw error;
  }
}

// Toggle book dropdown
function toggleBookDropdown() {
  if (bookDropdownButton.disabled) return;
  const isOpen = !bookDropdown.classList.contains("hidden");
  if (isOpen) {
    closeBookDropdown();
  } else {
    openBookDropdown();
  }
}

// Open book dropdown
function openBookDropdown() {
  bookDropdown.classList.remove("hidden");
  bookChevron.classList.add("rotated");
  searchInput.focus();
  closeVersionDropdown();
  chapterSection.classList.add("hidden");

  if (isLoadingBibleData || !selectedVersion) {
    booksListShimmer.classList.remove("hidden");
    booksList.classList.add("hidden");
  } else {
    renderBooks();
  }
}

// Close book dropdown
function closeBookDropdown() {
  bookDropdown.classList.add("hidden");
  bookChevron.classList.remove("rotated");
  searchQuery = "";
  searchInput.value = "";
  clearButton.classList.add("hidden");
  chapterSection.classList.add("hidden");
  renderBooks();
}

// Toggle version dropdown
function toggleVersionDropdown() {
  const isOpen = !versionDropdown.classList.contains("hidden");
  if (isOpen) {
    closeVersionDropdown();
  } else {
    openVersionDropdown();
  }
}

// Open version dropdown
function openVersionDropdown() {
  versionDropdown.classList.remove("hidden");
  versionChevron.classList.add("rotated");
  closeBookDropdown();

  if (isLoadingBibleData) {
    versionsListShimmer.classList.remove("hidden");
    versionsList.classList.add("hidden");
  } else {
    renderVersions();
  }
}

// Close version dropdown
function closeVersionDropdown() {
  versionDropdown.classList.add("hidden");
  versionChevron.classList.remove("rotated");
}

// Event listeners
bookDropdownButton.addEventListener("click", toggleBookDropdown);
versionDropdownButton.addEventListener("click", toggleVersionDropdown);

searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  if (searchQuery) {
    clearButton.classList.remove("hidden");
  } else {
    clearButton.classList.add("hidden");
  }
  renderBooks();
  chapterSection.classList.add("hidden");
});

clearButton.addEventListener("click", () => {
  searchQuery = "";
  searchInput.value = "";
  clearButton.classList.add("hidden");
  renderBooks();
  searchInput.focus();
  chapterSection.classList.add("hidden");
});

// Click outside to close dropdowns
document.addEventListener("click", (e) => {
  if (
    !bookDropdownContainer.contains(e.target) &&
    !bookDropdown.classList.contains("hidden")
  ) {
    closeBookDropdown();
  }
  if (
    !versionDropdownContainer.contains(e.target) &&
    !versionDropdown.classList.contains("hidden")
  ) {
    closeVersionDropdown();
  }
});

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  init();
});
