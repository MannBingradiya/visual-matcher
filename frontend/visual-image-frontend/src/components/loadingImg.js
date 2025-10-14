import React from "react";

export default function LoadingState() {
  return (
    <div className="card loading-card">
      <div className="spinner" role="status" aria-label="loading"></div>
      <div className="loading-text">
        Processing image — extracting features...
      </div>
    </div>
  );
}
