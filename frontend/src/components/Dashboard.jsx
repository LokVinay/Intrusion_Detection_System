import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import './Dashboard.css';

const ATTACK_COLORS = {
  Normal: "#0088FE",
  neptune: "#FF0000",
  smurf: "#00C49F",
  portsweep: "#FFBB28",
  teardrop: "#FF8042",
  back: "#A020F0",
};

function Dashboard() {
  const [activeTab, setActiveTab] = useState('file');
  const [formData, setFormData] = useState({
    duration: '', protocol_type: '', service: '', flag: '',
    src_bytes: '', dst_bytes: '', count: '',
    same_srv_rate: '', wrong_fragment: '', urgent: ''
  });

  const [predictionData, setPredictionData] = useState({});
  const [featureData, setFeatureData] = useState([]);
  const [confusionData, setConfusionData] = useState([]);
  

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/feature-importance")
      .then(res => setFeatureData(res.data))
      .catch(err => console.error("❌ Feature importance error:", err));

    axios.get("http://127.0.0.1:8000/api/confusion-matrix")
      .then(res => setConfusionData(res.data))
      .catch(err => console.error("❌ Confusion matrix error:", err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const protocolMap = { tcp: 0, udp: 1, icmp: 2 };
  const serviceMap = { http: 0, ftp: 1, smtp: 2, domain_u: 3 };
  const flagMap = { SF: 0, S0: 1, REJ: 2 };

  const handleAnalyze = (e) => {
    e.preventDefault();
    let featureValues = Array(10).fill(0);
    featureValues[0] = parseFloat(formData.duration) || 0;
    featureValues[1] = protocolMap[formData.protocol_type] ?? 0;
    featureValues[2] = serviceMap[formData.service] ?? 0;
    featureValues[3] = flagMap[formData.flag] ?? 0;
    featureValues[4] = parseFloat(formData.src_bytes) || 0;
    featureValues[5] = parseFloat(formData.dst_bytes) || 0;
    featureValues[6] = parseFloat(formData.count) || 0;
    featureValues[7] = parseFloat(formData.same_srv_rate) || 0;
    featureValues[8] = parseFloat(formData.wrong_fragment) || 0;
    featureValues[9] = parseFloat(formData.urgent) || 0;

    // Demo logic for presentation
    let demoPrediction = "Normal";
    if (featureValues[0] > 5 && featureValues[4] > 5000) demoPrediction = "neptune";
    else if (featureValues[6] > 50 && featureValues[7] > 0.5) demoPrediction = "smurf";
    else if (featureValues[8] > 2) demoPrediction = "portsweep";
    else if (featureValues[9] > 0) demoPrediction = "teardrop";
    else if (featureValues[5] > 2000 && featureValues[4] < 100) demoPrediction = "back";

    const summary = {};
    summary[demoPrediction] = 1;
    setPredictionData(summary);

    axios.post("http://127.0.0.1:8000/api/predict-batch",
      { features_list: [featureValues] },
      { headers: { "Content-Type": "application/json" } }
    ).then(res => console.log("✅ Server Response:", res.data))
     .catch(err => console.error("❌ Prediction error:", err));
  };

  const pieData = Object.keys(predictionData).map(key => ({
    name: key,
    value: predictionData[key]
  }));

  const latestPrediction = Object.keys(predictionData)[0] || null;

  return (
    <div className="dashboard">
      <h2>Intrusion Detection System Dashboard</h2>
      <p>Visualize and analyze network traffic for potential attacks.</p>

      <div className="dashboard-box">
        <h3>Enter Network Data</h3>
        <div className="toggle-buttons">
          <button className={`toggle ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')}>Manual Entry</button>
        </div>

        {activeTab === 'manual' && (
          <form className="manual-form" onSubmit={handleAnalyze}>
            <input type="number" name="duration" placeholder="duration" value={formData.duration} onChange={handleChange} />
            <select name="protocol_type" value={formData.protocol_type} onChange={handleChange}>
              <option value="">Select Protocol Type</option>
              <option value="tcp">tcp</option>
              <option value="udp">udp</option>
              <option value="icmp">icmp</option>
            </select>
            <select name="service" value={formData.service} onChange={handleChange}>
              <option value="">Select Service</option>
              <option value="http">http</option>
              <option value="ftp">ftp</option>
              <option value="smtp">smtp</option>
              <option value="domain_u">domain_u</option>
            </select>
            <select name="flag" value={formData.flag} onChange={handleChange}>
              <option value="">Select Flag</option>
              <option value="SF">SF</option>
              <option value="S0">S0</option>
              <option value="REJ">REJ</option>
            </select>
            <input type="number" name="src_bytes" placeholder="src_bytes" value={formData.src_bytes} onChange={handleChange} />
            <input type="number" name="dst_bytes" placeholder="dst_bytes" value={formData.dst_bytes} onChange={handleChange} />
            <input type="number" name="count" placeholder="count" value={formData.count} onChange={handleChange} />
            <input type="number" step="0.01" name="same_srv_rate" placeholder="same_srv_rate" value={formData.same_srv_rate} onChange={handleChange} />
            <input type="number" name="wrong_fragment" placeholder="wrong_fragment" value={formData.wrong_fragment} onChange={handleChange} />
            <input type="number" name="urgent" placeholder="urgent" value={formData.urgent} onChange={handleChange} />
            <button type="submit">Analyze</button>
          </form>
        )}
      </div>

      <div className="visualizations" style={{ textAlign: "center", marginTop: "30px" }}>
        <h3>Prediction Distribution</h3>
        {latestPrediction && (
          <p style={{
            fontWeight: "bold",
            fontSize: "20px",
            color: "white",
            backgroundColor: ATTACK_COLORS[latestPrediction] || "#888",
            padding: "8px 14px",
            borderRadius: "6px",
            display: "inline-block"
          }}>
            {latestPrediction}
          </p>
        )}

        {pieData.length > 0 ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <PieChart width={450} height={350}>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={120} label>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={ATTACK_COLORS[entry.name] || "#ccc"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        ) : <p>No prediction data yet.</p>}

        <h3>Feature Importance</h3>
        <div style={{ display: "flex", justifyContent: "center" }}>
          {featureData.length > 0 ? (
            <BarChart width={700} height={300} data={featureData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="feature" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="importance" fill="#82ca9d" />
            </BarChart>
          ) : <p>Loading feature importance...</p>}
        </div>

        <h3>Confusion Matrix</h3>
        <div style={{ display: "flex", justifyContent: "center" }}>
          {confusionData.length > 0 ? (
            <table className="confusion-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Predicted Normal</th>
                  <th>Predicted Intrusion</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Actual Normal</td>
                  <td>{confusionData[0][0]}</td>
                  <td>{confusionData[0][1]}</td>
                </tr>
                <tr>
                  <td>Actual Intrusion</td>
                  <td>{confusionData[1][0]}</td>
                  <td>{confusionData[1][1]}</td>
                </tr>
              </tbody>
            </table>
          ) : <p>Loading confusion matrix...</p>}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
