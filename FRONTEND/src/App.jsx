import { useState } from "react";
import "./index.css";

const API_BASE = import.meta.env.VITE_API_BASE;


export default function App() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [expiry, setExpiry] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // ✅ URL validation helper
  const isValidUrl = (value) => {
    try {
      const parsed = new URL(value);
      return (
        parsed.protocol === "http:" || parsed.protocol === "https:"
      );
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!url) {
      alert("Please enter a URL");
      return;
    }

    if (!isValidUrl(url)) {
      alert("Please enter a valid URL starting with http or https");
      return;
    }

    setLoading(true);
    setResult("");
    setCopied(false);

    try {
      const res = await fetch(`${API_BASE}/api/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          alias: alias || undefined,
          expiresInDays: expiry || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(`${API_BASE}/${data.short_url}`);
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="page">
      <div className="card">
        <h1>🔗 URL Shortener</h1>
        <p className="subtitle">
          Shorten links • Track clicks • Built for scale
        </p>

        <input
          placeholder="Paste your long URL here"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <div className="row">
          <input
            placeholder="Custom alias (optional)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
          />
          <input
            type="number"
            placeholder="Expiry (days)"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </div>

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Shortening..." : "Shorten URL"}
        </button>

        {result && (
          <div className="result">
            <span>Short URL</span>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <a href={result} target="_blank" rel="noreferrer">
                {result}
              </a>

              <button
                style={{
                  padding: "6px 10px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
                onClick={handleCopy}
              >
                Copy
              </button>
            </div>

            {copied && (
              <small style={{ color: "#d1fae5" }}>
                ✅ Copied to clipboard
              </small>
            )}
          </div>
        )}

        <footer>
          Built with React • Node • MongoDB • Redis • Kafka
        </footer>
      </div>
    </div>
  );
}
