import { formatCurrency } from "../../utils/currency";
import useFarmContext from "../../hooks/useFarmContext";

export default function FinancialHistory({
  animal,
  transactions = [],
}) {
  const farmCtx = useFarmContext();
  const purchasePrice = Number(
    animal?.purchase_price || 0
  );

  const totalExpenses = transactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalIncome = transactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const profit = totalIncome - purchasePrice - totalExpenses;

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
      <h2
        style={{
          marginTop: 0,
          marginBottom: 24,
          color: "#0F172A",
        }}
      >
        💰 Financial Summary
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
          marginBottom: 28,
        }}
      >
        <FinanceCard
          title="Purchase Price"
          value={formatCurrency(purchasePrice, farmCtx)}
          color="#2563EB"
        />

        <FinanceCard
          title="Expenses"
          value={formatCurrency(totalExpenses, farmCtx)}
          color="#DC2626"
        />

        <FinanceCard
          title="Income"
          value={formatCurrency(totalIncome, farmCtx)}
          color="#16A34A"
        />

        <FinanceCard
          title="Profit / Loss"
          value={formatCurrency(profit, farmCtx)}
          color={profit >= 0 ? "#16A34A" : "#DC2626"}
        />
      </div>

      {transactions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 50,
            background: "#F8FAFC",
            borderRadius: 14,
            border: "2px dashed #CBD5E1",
          }}
        >
          <div style={{ fontSize: 52 }}>
            💰
          </div>

          <h3>No Financial Records</h3>

          <p
            style={{
              color: "#64748B",
            }}
          >
            Income and expenses related to this animal
            will appear here.
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
              <th style={header}>Type</th>
              <th style={header}>Description</th>
              <th style={header}>Amount</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                style={{
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                <td style={cell}>
                  {transaction.date}
                </td>

                <td style={cell}>
                  {transaction.type}
                </td>

                <td style={cell}>
                  {transaction.description}
                </td>

                <td
                  style={{
                    ...cell,
                    fontWeight: 700,
                    color:
                      transaction.type === "Income"
                        ? "#16A34A"
                        : "#DC2626",
                  }}
                >
                  {formatCurrency(transaction.amount || 0, farmCtx)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function FinanceCard({
  title,
  value,
  color,
}) {
  return (
    <div
      style={{
        background: "#F8FAFC",
        borderRadius: 14,
        border: "1px solid #E2E8F0",
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#64748B",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 24,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
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
