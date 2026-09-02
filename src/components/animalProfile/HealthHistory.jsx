export default function HealthHistory({
  records = [],
  onAddTreatment,
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
          ❤️ Health History
        </h2>

        <button
          onClick={onAddTreatment}
          style={{
            background: "#DC2626",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          ➕ Add Treatment
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
            ❤️
          </div>

          <h3>No Health Records</h3>

          <p
            style={{
              color: "#64748B",
            }}
          >
            Treatments, vaccinations and veterinary visits will appear here.
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
                background: "#DC2626",
                color: "#FFFFFF",
              }}
            >
              <th style={header}>Date</th>
              <th style={header}>Treatment</th>
              <th style={header}>Medication</th>
              <th style={header}>Veterinarian</th>
              <th style={header}>Next Due</th>
              <th style={header}>Status</th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => {
              // Completed takes precedence: a completed treatment is never
              // "Overdue", regardless of its (preserved) next_due date.
              const completed = !!record.completed_at;

              const overdue =
                !completed &&
                record.next_due &&
                new Date(record.next_due) < new Date();

              const statusLabel = completed
                ? "Completed"
                : overdue
                ? "Overdue"
                : "Up to Date";

              const statusColor = completed
                ? "#16A34A"
                : overdue
                ? "#DC2626"
                : "#16A34A";

              return (
                <tr
                  key={record.id}
                  style={{
                    borderBottom:
                      "1px solid #E2E8F0",
                  }}
                >
                  <td style={cell}>
                    {record.treatment_date}
                  </td>

                  <td style={cell}>
                    {record.treatment_type}
                  </td>

                  <td style={cell}>
                    {record.medication || "-"}
                  </td>

                  <td style={cell}>
                    {record.veterinarian || "-"}
                  </td>

                  <td style={cell}>
                    {record.next_due || "-"}
                  </td>

                  <td style={cell}>
                    <span
                      style={{
                        background: statusColor,
                        color: "#FFFFFF",
                        padding:
                          "6px 12px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {statusLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
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
