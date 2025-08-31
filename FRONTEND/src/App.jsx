import React, { useState } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");

  const handleShorten = async () => {
    if (!url) return;

    try {
      // 👇 Backend API endpoint ko apne backend ka URL se replace karo
      const res = await fetch("http://localhost:5000/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ longUrl: url }),
      });

      const data = await res.json();
      setShortUrl(data.shortUrl);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to shorten URL");
    }
  };

  return (
    <div className="container">
      <h1>🔗 URL Shortener</h1>
      <input
        type="text"
        placeholder="Enter your long URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={handleShorten}>Shorten</button>

      {shortUrl && (
        <p>
          Short URL:{" "}
          <a href={shortUrl} target="_blank" rel="noreferrer">
            {shortUrl}
          </a>
        </p>
      )}
    </div>
  );
}

export default App;
