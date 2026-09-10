import { formatMass } from "../../utils/units";
import useFarmContext from "../../hooks/useFarmContext";

export default function WeightHistory({
  records = [],
  onAddWeight,
}) {
  const farmCtx = useFarmContext();
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 18,
        padding: 24,
        boxShadow: "0 8px 20px rgba(15,23,42,.08)",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#0F172A",
          }}
        >
          ⚖️ Weight History
        </h2>

        <button
          onClick={onAddWeight}
          style={{
            background: "#2E7D32",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ➕ Record Weight
        </button>
      </div>

      {records.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 50,
            border: "2px dashed #CBD5E1",
            borderRadius: 14,
            background: "#F8FAFC",
          }}
        >
          <div style={{ fontSize: 52 }}>
            ⚖️
          </div>

          <h3>No Weight Records</h3>

          <p
            style={{
              color: "#64748B",
            }}
          >
            Record your first weight to begin tracking growth.
          </p>
        </div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#2E7D32",
                color: "#FFFFFF",
              }}
            >
              <th style={header}>Date</th>
              <th style={header}>Weight</th>
              <th style={header}>Notes</th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <tr
                key={record.id}
                style={{
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                <td style={cell}>
                  {record.recorded_at}
                </td>

                <td style={cell}>
                  <strong>{formatMass(record.weight, farmCtx)}</strong>
                </td>

                <td style={cell}>
                  {record.notes || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const header = {
  padding: 14,
  textAlign: "left",
};

const cell = {
  padding: 14,
};
