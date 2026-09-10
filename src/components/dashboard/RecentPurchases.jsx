import { formatCurrency } from "../../utils/currency";
import useFarmContext from "../../hooks/useFarmContext";

export default function RecentPurchases({ animals = [] }) {
  const farmCtx = useFarmContext();
  const recent = [...animals]
    .sort(
      (a, b) =>
        new Date(b.purchase_date || 0) -
        new Date(a.purchase_date || 0)
    )
    .slice(0, 5);

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 10px 30px rgba(15,23,42,.08)",
        height: "100%",
      }}
    >
      {/* Header */}

      <div
        style={{
          marginBottom: 20,
          borderBottom: "1px solid #E5E7EB",
          paddingBottom: 14,
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#0F172A",
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          💰 Recent Purchases
        </h2>

        <p
          style={{
            marginTop: 6,
            color: "#64748B",
            fontSize: 14,
          }}
        >
          Latest livestock purchases on your farm.
        </p>
      </div>

      {recent.length === 0 ? (
        <div
          style={{
            padding: 50,
            textAlign: "center",
            color: "#94A3B8",
          }}
        >
          <div
            style={{
              fontSize: 42,
              marginBottom: 10,
            }}
          >
            💰
          </div>

          <strong>No purchases recorded yet.</strong>

          <p
            style={{
              marginTop: 8,
              fontSize: 13,
            }}
          >
            Purchased animals will appear here.
          </p>
        </div>
      ) : (
        recent.map((animal, index) => (
          <div
            key={animal.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 0",
              borderBottom:
                index === recent.length - 1
                  ? "none"
                  : "1px solid #F1F5F9",
            }}
          >
            {/* Left */}

            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 17,
                  color: "#0F172A",
                }}
              >
                🐄 {animal.tag}
              </div>

              <div
                style={{
                  color: "#64748B",
                  fontSize: 14,
                  marginTop: 4,
                }}
              >
                {animal.breed}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: "#94A3B8",
                }}
              >
                {animal.animal_type}
              </div>
            </div>

            {/* Right */}

            <div
              style={{
                textAlign: "right",
              }}
            >
              <div
                style={{
                  color: "#16A34A",
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                {animal.purchase_price
                  ? formatCurrency(animal.purchase_price, farmCtx)
                  : "Not recorded"}
              </div>

              <div
                style={{
                  color: "#64748B",
                  fontSize: 13,
                  marginTop: 5,
                }}
              >
                📅 {animal.purchase_date || "-"}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
