let editor, bookmarkletButton;
bookmarkletButton = document.getElementById("bookmarklet-button");

// Get initial state from URL if available
const initialState = getStateFromURL();

// Initialize bookmarklet code on page load
updateBookmarkletCode(initialState.code || "");

// Load the Monaco Editor
require.config({
  paths: { vs: "https://unpkg.com/monaco-editor@latest/min/vs" },
});
require(["vs/editor/editor.main"], () => {
  // Create the editor instance
  editor = monaco.editor.create(
    document.getElementById("editor-container"),
    {
      value: initialState.code || "// Type your code here",
      language: "javascript",
      automaticLayout: true,
      theme: "vs-dark",
      autoIndent: true,
      formatOnPaste: true,
      formatOnType: true,
      minimap: {
        enabled: false,
      },
    }
  );

  // Linting configuration
  monaco.languages.register({ id: "javascript" });

  // Update state and URL on code change
  editor.onDidChangeModelContent(() => {
    const code = editor.getValue();
    updateURL({ code });
    updateBookmarkletCode(code);
  });

  // Initialize title input value from URL
  const titleInput = document.getElementById("title-input");
  // titleInput.value = initialState.title || "";
  // updateBookmarkletButtonText(titleInput.value);

  // Update state and URL on title input change
  titleInput.addEventListener("input", () => {
    // const title = titleInput.value;
    // updateURL({ title });
    updateBookmarkletButtonText();
  });
});

// Generate bookmarklet code and update button href
function updateBookmarkletCode(code) {

  const bookmarkletCode = `javascript:(function(){${code}})();`;
  bookmarkletButton.setAttribute("href", bookmarkletCode);
}

// Function to encode the state to base64
function encodeStateToBase64(state) {
  const jsonState = JSON.stringify(state);
  return btoa(jsonState);
}

// Function to decode the base64 state
function decodeBase64ToState(base64State) {
  const jsonState = atob(base64State);
  return JSON.parse(jsonState);
}

// Update URL with base64-encoded state
function updateURL(state) {
  const base64State = encodeStateToBase64({
    ...getStateFromURL(),
    ...state,
  });
  const currentURL = window.location.href.split("?")[0];
  window.history.replaceState(
    {},
    "",
    `${currentURL}?state=${base64State}`
  );
}

// Decode URL to retrieve state
function getStateFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const base64State = urlParams.get("state");
  try {
    if (base64State !== null) {
      return decodeBase64ToState(base64State);
    }
  } catch (error) {
    console.error("Error decoding URL state:", error);
  }

  return {};
}

// Update bookmarklet button text based on the title input
function updateBookmarkletButtonText() {
  const titleInput = document.getElementById('title-input');
  const buttonTitle = titleInput.value;
  bookmarkletButton.innerText = buttonTitle;
}

// Minify code using the TopTal JavaScript Minifier API
async function minifyCode(code) {
  const response = await fetch(
    "https://www.toptal.com/developers/javascript-minifier/api/raw",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `input=${encodeURIComponent(code)}`,
    }
  );

  if (response.ok) {
    const minifiedCode = await response.text();
    return minifiedCode;
  } else {
    throw new Error("Failed to minify code");
  }
}