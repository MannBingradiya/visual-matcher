import React, { useState } from "react";
import axios from "axios";
import SearchInput from "./components/searchInpImg";
import LoadingState from "./components/loadingImg";
import SearchResults from "./components/SearchRes";
import "./App.css";

const API_URL = "https://visual-matcher-backend-wiqj.onrender.com/api/search";

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [uploadedImageSrc, setUploadedImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [similarityFilter, setSimilarityFilter] = useState(0.0);

  const handleSearch = async (fileOrUrl, isFile) => {
    setSearchResults([]);
    setUploadedImageSrc(null);
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();

      if (isFile) {
        formData.append("imageFile", fileOrUrl);
        setUploadedImageSrc(URL.createObjectURL(fileOrUrl));
      } else {
        alert("Please use file upload for best results.");
        setIsLoading(false);
        return;
      }

      console.log("App: sending request to", API_URL);

      const response = await axios.post(API_URL, formData, {
         console.log("sending response");
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("App: response received", response.data);
      setSearchResults(response.data.results || []);
    } catch (err) {
      console.error("App: Search API Error:", err);
      setError(err.response?.data?.error || "Failed to connect to search service.");
      setUploadedImageSrc(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-root">
      <header className="header">
        <div className="brand">
          <img src="/VisualMatcherlogo-removebg.png" alt="logo" className="logo" />
          <div>
            <h1 className="title">Visual Product Matcher</h1>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="left-panel">
          <SearchInput onSearch={handleSearch} isLoading={isLoading} />
          {isLoading && <LoadingState />}
        </div>

        <div className="right-panel">
          {error && <div className="error-box">Error: {error}</div>}

          <SearchResults
            uploadedImageSrc={uploadedImageSrc}
            results={searchResults}
            similarityFilter={similarityFilter}
            setSimilarityFilter={setSimilarityFilter}
          />
        </div>
      </main>

      <footer className="footer">
        <small>Visual Product Matcher Demo Keep your dataset confidential</small>
      </footer>
    </div>
  );
}

export default App;
