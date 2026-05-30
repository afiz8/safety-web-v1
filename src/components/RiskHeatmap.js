import React, { useState, useEffect } from 'react';

const RiskHeatmap = ({ 
  data: propData,           // data langsung dari parent (opsional)
  riskEndpoint = '/api/risks',  // endpoint untuk mengambil data risiko
  likelihoodLabels = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'],
  consequenceLabels = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic']
}) => {
  const [data, setData] = useState(propData || []);
  const [loading, setLoading] = useState(!propData);
  const [error, setError] = useState('');
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Ambil data dari backend jika tidak ada propData
  useEffect(() => {
    if (propData) {
      setData(propData);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}${riskEndpoint}`);
        if (!res.ok) throw new Error(`Gagal mengambil data: ${res.status}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propData, riskEndpoint, API_BASE]);

  const levels = [1, 2, 3, 4, 5];
  const getColor = (likelihood, consequence) => {
    const riskScore = likelihood * consequence;
    if (riskScore <= 5) return 'bg-green-400 dark:bg-green-500';
    if (riskScore <= 10) return 'bg-yellow-400 dark:bg-yellow-500';
    if (riskScore <= 15) return 'bg-orange-400 dark:bg-orange-500';
    return 'bg-red-400 dark:bg-red-500';
  };

  const getRiskLevel = (likelihood, consequence) => {
    const score = likelihood * consequence;
    if (score <= 5) return 'Low';
    if (score <= 10) return 'Medium';
    if (score <= 15) return 'High';
    return 'Extreme';
  };

  if (loading) return <div className="text-center p-8">Memuat data risiko...</div>;
  if (error) return <div className="text-center p-8 text-red-500">❌ {error}</div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
          🔥 Risk Heatmap
        </h3>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Risks: {data.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 p-3 text-left font-bold bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Consequence →</th>
              {consequenceLabels.map((label, idx) => (
                <th key={idx} className="border border-gray-300 p-3 text-center font-bold bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                  {label}<br /><small className="text-blue-100">Level {idx + 1}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {levels.map((likelihood, rowIdx) => (
              <tr key={likelihood}>
                <td className="border border-gray-300 p-3 font-bold bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-right">
                  Likelihood {likelihood}<br />
                  <small className="text-gray-600 dark:text-gray-400">{likelihoodLabels[likelihood - 1]}</small>
                </td>
                {levels.map((consequence, colIdx) => {
                  const count = data.filter(item => 
                    (item.likelihood || 1) === likelihood && 
                    (item.consequence || 1) === consequence
                  ).length;
                  return (
                    <td 
                      key={colIdx}
                      className={`border border-gray-300 p-4 text-center font-bold cursor-pointer hover:scale-105 transition-all relative group ${getColor(likelihood, consequence)} text-white`}
                      title={`Count: ${count} | Level: ${getRiskLevel(likelihood, consequence)}`}
                    >
                      <div className="absolute inset-0 opacity-75 group-hover:opacity-100 transition-opacity"></div>
                      {count > 0 ? (
                        <div className="relative z-10">
                          <div className="text-lg font-black drop-shadow-md">{count}</div>
                          <div className="text-xs">{getRiskLevel(likelihood, consequence)}</div>
                        </div>
                      ) : (
                        <div className="h-12 w-16 bg-white/20 rounded flex items-center justify-center">
                          <span className="text-white/70 text-sm">–</span>
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 text-xs opacity-0 group-hover:opacity-100 transition-all bg-black/50 px-1 rounded text-white">
                        {getRiskLevel(likelihood, consequence)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-8 grid grid-cols-4 md:grid-cols-5 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-6 bg-green-400 dark:bg-green-500 rounded"></div>
          <span>Low (1-5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-6 bg-yellow-400 dark:bg-yellow-500 rounded"></div>
          <span>Medium (6-10)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-6 bg-orange-400 dark:bg-orange-500 rounded"></div>
          <span>High (11-15)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-6 bg-red-400 dark:bg-red-500 rounded"></div>
          <span>Extreme (16-25)</span>
        </div>
      </div>
    </div>
  );
};

export default RiskHeatmap;