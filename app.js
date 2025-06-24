let editor, bookmarkletButton;
bookmarkletButton = document.getElementById("bookmarklet-button");

// Get initial state from URL if available
const initialState = getStateFromURL();

// Initialize bookmarklet code on page load
updateBookmarkletCode(initialState.code || "");

// Load the Monaco Editor
require.config({
  paths: { vs: "https://unpkg.com/monaco-editor@0.52.2/min/vs" },
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
    updateBookmarkletCode(code); // This is now async but we don't need to await
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
async function updateBookmarkletCode(code) {
  let cleanedCode = code;
  
  // Try to minify with Terser if available
  if (typeof Terser !== 'undefined') {
    try {
      const result = await Terser.minify(code, {
        compress: {
          drop_console: false,    // Keep console.log for debugging
          drop_debugger: false,   // Keep debugger statements
          expression: true        // Important for bookmarklets - preserves completion values
        },
        mangle: false,            // Don't mangle names to keep them readable
        format: {
          comments: false,        // Remove all comments
          beautify: false,        // Minify output
          semicolons: true        // Always use semicolons for safety
        }
      });
      
      if (result.code && !result.error) {
        cleanedCode = result.code;
        console.log('✓ Minified with Terser');
      } else {
        console.warn('Terser returned error:', result.error);
      }
    } catch (error) {
      console.warn('Terser failed:', error);
    }
  } else {
    console.warn('Terser not available, using original code');
  }
  
  const bookmarkletCode = `javascript:(function(){${cleanedCode}})();`;
  bookmarkletButton.setAttribute("href", bookmarkletCode);
}

// Function to encode the state to base64
function encodeStateToBase64(state) {
  const jsonState = JSON.stringify(state);
  return btoa(jsonState);
}

// Function to decode the base64 state
function decodeBase64ToState(base64State) {
  try {
    // Convert URL-safe base64 back to regular base64
    let regularBase64 = base64State
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    while (regularBase64.length % 4) {
      regularBase64 += '=';
    }
    
    const jsonState = atob(regularBase64);
    return JSON.parse(jsonState);
  } catch (error) {
    console.error("Error decoding base64 state:", error);
    return {};
  }
}

// Update URL with base64-encoded state
function updateURL(state) {
  const base64State = encodeStateToBase64({
    ...getStateFromURL(),
    ...state,
  });
  const currentURL = window.location.href.split("#")[0];
  window.history.replaceState(
    {},
    "",
    `${currentURL}#${base64State}`
  );
}

// Decode URL hash to retrieve state
function getStateFromURL() {
  const hash = window.location.hash.substring(1); // Remove the # character
  
  if (hash !== null && hash.trim() !== "") {
    return decodeBase64ToState(hash);
  }

  return {};
}

// Update bookmarklet button text based on the title input
function updateBookmarkletButtonText() {
  const titleInput = document.getElementById('title-input');
  const buttonTitle = titleInput.value;
  bookmarkletButton.innerText = buttonTitle;
}