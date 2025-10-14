import React, { useMemo } from "react";

export default function SearchResults({ uploadedImageSrc, results, similarityFilter, setSimilarityFilter }) {
  const filtered = useMemo(() => results.filter(r => (typeof r.similarityScore === "number" ? r.similarityScore : 0) >= similarityFilter), [results, similarityFilter]);

  return (
    <div className="card results-card">
      <div className="results-header">
        <div className="uploaded-preview">
          {uploadedImageSrc ? <img src={uploadedImageSrc} alt="uploaded" /> : <div className="no-preview">No image uploaded yet</div>}
        </div>

        <div className="controls">
          <h3>Results</h3>
          <div className="stats">{filtered.length} / {results.length} shown</div>

          <label className="slider-label">Min similarity: {(similarityFilter*100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={similarityFilter}
            onChange={(e) => setSimilarityFilter(parseFloat(e.target.value))}
            className="similarity-slider"
          />
        </div>
      </div>

      <div className="grid">
        {filtered.length === 0 && <div className="no-results">No matches found. Try a different photo or lower the similarity.</div>}

        {filtered.map((p, i) => (
          <article key={p.id ?? i} className="product-card">
            <div className="thumb">
              <img src={p.image_url} alt={p.name} onError={(e)=> e.currentTarget.src = '/fallback-image.png'} />
            </div>
            <div className="info">
              <h4 className="prod-name" title={p.name}>{p.name}</h4>
              <div className="prod-cat">{p.category}</div>
              <div className="bottom">
                <div className="score">{(p.similarityScore * 100).toFixed(1)}%</div>
                {p.price != null && <div className="price">₹{p.price}</div>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
