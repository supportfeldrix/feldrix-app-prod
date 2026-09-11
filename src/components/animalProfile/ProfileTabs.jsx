export default function ProfileTabs({
  activeTab,
  onChange,
}) {
  const tabs = [
    {
      id: "weight",
      label: "⚖️ Weight",
    },
    {
      id: "health",
      label: "❤️ Health",
    },
    {
      id: "breeding",
      label: "🐄 Breeding",
    },
    {
      id: "finance",
      label: "💳 Finance",
    },
    {
      id: "notes",
      label: "📝 Notes",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginBottom: 24,
        flexWrap: "wrap",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: "10px 18px",
            borderRadius: 12,
            border:
              activeTab === tab.id
                ? "2px solid #2E7D32"
                : "1px solid #CBD5E1",
            background:
              activeTab === tab.id
                ? "#2E7D32"
                : "#FFFFFF",
            color:
              activeTab === tab.id
                ? "#FFFFFF"
                : "#334155",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all .2s ease",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
