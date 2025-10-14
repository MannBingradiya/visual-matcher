import React, { useState } from "react";

export default function SearchInput({ onSearch, isLoading }) {
  const [file, setFile] = useState(null);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    console.log("SearchInput: file selected", f.name, f.type, f.size);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      alert("Please choose an image file to upload.");
      return;
    }
    onSearch(file, true);
  }

  return (
    <div className="card upload-card">
      <h2 className="card-title">Upload Search Image</h2>
      <p className="card-sub">Capture the product clearly (frontal / centered) for best results.</p>

      <form onSubmit={handleSubmit} className="upload-form">
        <label className="file-drop" htmlFor="fileInput" aria-hidden={isLoading}>
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLoading}
            className="file-input"
          />
          <div className="file-drop-inner">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3v12" stroke="#2b6cb0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 7l4-4 4 4" stroke="#2b6cb0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="3" y="13" width="18" height="8" rx="2" stroke="#2b6cb0" strokeWidth="1.5"/>
            </svg>
            <div>
              <strong>Click to upload</strong>
              <div className="muted">or drag & drop (jpg, png, webp)</div>
            </div>
          </div>
        </label>

        <div className="actions">
          <button type="submit" className="btn primary" disabled={isLoading || !file}>
            {isLoading ? "Searching..." : "Find Similar Products"}
          </button>

          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setFile(null);
              document.getElementById("fileInput").value = "";
            }}
            disabled={isLoading}
          >
            Clear
          </button>
        </div>

        <div className="hint">Tip: A clean, uncluttered image improves matches.</div>
      </form>
    </div>
  );
}
