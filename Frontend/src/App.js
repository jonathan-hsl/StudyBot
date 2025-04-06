// Adaptive-Study-Assistant/frontend/src/App.js
import React, { useState } from 'react';

function App() {
  const [sourceType, setSourceType] = useState("text");
  const [inputText, setInputText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use FormData if file upload is required
      const formData = new FormData();
      formData.append("sourceType", sourceType);
      if (sourceType === "text") {
        formData.append("inputText", inputText);
      } else if (sourceType === "url") {
        formData.append("url", url);
      } else if (sourceType === "pdf" || sourceType === "video") {
        if (!file) {
          alert("Please select a file.");
          setLoading(false);
          return;
        }
        formData.append("file", file);
      }
      const res = await fetch("http://localhost:5001/api/process-source", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResponseData(data);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Adaptive Study Assistant</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Select Input Type:{" "}
          <select
            value={sourceType}
            onChange={(e) => {
              setSourceType(e.target.value);
              setResponseData(null);
            }}
          >
            <option value="text">Text</option>
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
            <option value="url">URL</option>
          </select>
        </label>
        <br /><br />
        {sourceType === "text" && (
          <textarea
            rows="10"
            cols="50"
            placeholder="Paste your lecture notes here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        )}
        {sourceType === "url" && (
          <input
            type="text"
            placeholder="Enter a URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ width: "50%" }}
          />
        )}
        {(sourceType === "pdf" || sourceType === "video") && (
          <input
            type="file"
            accept={sourceType === "pdf" ? ".pdf" : "video/*"}
            onChange={(e) => setFile(e.target.files[0])}
          />
        )}
        <br /><br />
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Generate Study Materials"}
        </button>
      </form>
      <hr />
      {responseData && (
        <div>
          <section>
            <h2>Summary</h2>
            <p>{responseData.summary}</p>
          </section>
          <section>
            <h2>Detailed Study Guide/Notes</h2>
            <p>{responseData.detailedNotes}</p>
          </section>
          <section>
            <h2>Flashcards</h2>
            {responseData.flashcards && Array.isArray(responseData.flashcards) ? (
              <ul>
                {responseData.flashcards.map((card, index) => (
                  <li key={index}>
                    <strong>{card.term}</strong>: {card.definition}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No flashcards available.</p>
            )}
          </section>
          <section>
            <h2>Quizzes</h2>
            {responseData.quizzes && Array.isArray(responseData.quizzes) ? (
              <ul>
                {responseData.quizzes.map((q, index) => (
                  <li key={index}>
                    <strong>Q:</strong> {q.question} <br />
                    <strong>A:</strong> {q.answer}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No quiz questions available.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
