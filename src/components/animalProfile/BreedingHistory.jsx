import { sireLabel } from "../../utils/breedingSire";
import { breedingEvents } from "../../utils/breedingEvents";
export default function BreedingHistory({
  records = [],
  onAddBreeding,
}) {
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
          🐂 Breeding History
        </h2>

        <button
          onClick={onAddBreeding}
          style={{
            background: "#F59E0B",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          ➕ Add Breeding Record
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
            🐂
          </div>

          <h3>No Breeding Records</h3>

          <p
            style={{
              color: "#64748B",
            }}
          >
            Breeding events, pregnancies and births will appear here.
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
                background: "#F59E0B",
                color: "#FFFFFF",
              }}
            >
              <th style={header}>Breeding Date</th>
              <th style={header}>Bull / Sire</th>
              <th style={header}>Expected Birth</th>
              <th style={header}>Status</th>
              <th style={header}>History</th>
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
                  {record.breeding_date || "-"}
                </td>
                <td style={cell}>
                  {sireLabel(record)}
                </td>
                <td style={cell}>
                  {record.expected_birth || "-"}
                </td>
                <td style={cell}>
                  {record.status || "Pending"}
                </td>
                <td style={cell}>
                  {breedingEvents(record).length === 0 ? "-" : (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {breedingEvents(record).map((ev) => (
                        <li key={ev.type} style={{ marginBottom: 4 }}>
                          <span style={{ color: "#64748B", marginRight: 6 }}>{ev.date}</span>
                          {ev.label}
                        </li>
                      ))}
                    </ul>
                  )}
                  {record.notes && (
                    <div style={{ color: "#64748B", fontSize: 13, marginTop: 6, whiteSpace: "pre-line" }}>
                      {record.notes}
                    </div>
                  )}
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
