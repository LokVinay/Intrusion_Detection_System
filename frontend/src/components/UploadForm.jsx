import React, { useState } from "react";
import "./UploadForm.css";

function UploadForm() {
  const [mode, setMode] = useState("file");
  const [selectedFile, setSelectedFile] = useState(null);
  const [manualInput, setManualInput] = useState({
    duration: "",
    protocol_type: "",
    src_bytes: "",
    dst_bytes: "",
    flag: "",
    count: "",
  });

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleInputChange = (e) => {
    setManualInput({ ...manualInput, [e.target.name]: e.target.value });
  };

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (mode === "file" && !selectedFile) {
      alert("Please select a file to analyze!");
      return;
    }
    if (mode === "manual") {
      console.log("Manual Input Submitted:", manualInput);
      alert("Manual input captured (backend integration later).");
    } else {
      console.log("File Uploaded:", selectedFile);
      alert("File upload captured (backend integration later).");
    }
  };

  return (
    <div className="upload-box">
      <h3>Upload or Enter Network Data</h3>

      {/* Toggle Buttons */}
      <div className="mode-switch">
        <button
          className={mode === "file" ? "active" : ""}
          onClick={() => setMode("file")}
        >
          File Upload
        </button>
        <button
          className={mode === "manual" ? "active" : ""}
          onClick={() => setMode("manual")}
        >
          Manual Entry
        </button>
      </div>

      {/* File Upload Mode */}
      {mode === "file" && (
        <form onSubmit={handleAnalyze}>
          <input type="file" onChange={handleFileChange} />
          <button type="submit" className="analyze-btn">
            Analyze
          </button>
        </form>
      )}

      {/* Manual Entry Mode */}
      {mode === "manual" && (
        <form onSubmit={handleAnalyze}>
          <div className="manual-inputs">
            
            <input
              type="text"
              name="protocol_type"
              autoComplete="off"
              placeholder="Protocol Type (e.g., tcp)"
              value={manualInput.protocol_type}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              name="src_bytes"
              placeholder="Source Bytes"
              value={manualInput.src_bytes}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              name="dst_bytes"
              placeholder="Destination Bytes"
              value={manualInput.dst_bytes}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="flag"
              autoComplete="off"
              placeholder="Flag"
              value={manualInput.flag}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              name="count"
              placeholder="Count"
              value={manualInput.count}
              onChange={handleInputChange}
              required
            />
          </div>

          <button type="submit" className="analyze-btn">
            Analyze
          </button>
        </form>
      )}
    </div>
  );
}

export default UploadForm;
