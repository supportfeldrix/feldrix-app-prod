import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";
import { format } from "date-fns";
import { kgToLb, unitLabel, isUsCustomary } from "../../utils/units";
import useFarmContext from "../../hooks/useFarmContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function WeightChart({ records = [] }) {
  const farmCtx = useFarmContext();
  if (!records || records.length === 0) return null;

  // Display unit: convert canonical kg -> lb for US farms; label accordingly.
  const us = isUsCustomary(farmCtx);
  const massUnit = unitLabel("mass", farmCtx);
  const toDisplay = (kg) => (us ? kgToLb(Number(kg)) : Number(kg));

  // Sort oldest to newest
  const sorted = [...records].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  const data = {
    labels: sorted.map((record) =>
      format(new Date(record.recorded_at), "dd MMM")
    ),
    datasets: [
      {
        label: `Weight (${massUnit})`,
        data: sorted.map((record) => toDisplay(record.weight)),
        borderColor: "#16a34a",
        backgroundColor: "#16a34a",
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.35,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,

    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          boxWidth: 14,
          usePointStyle: true,
        },
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
        },
      },

      y: {
        beginAtZero: false,
        grid: {
          color: "#f1f5f9",
        },
        ticks: {
          callback: (value) => `${value} ${massUnit}`,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          📈 Weight Growth
        </h3>
      </div>

      <div
        className="relative w-full"
        style={{ height: "220px" }}
      >
        <Line
          data={data}
          options={options}
        />
      </div>
    </div>
  );
}
