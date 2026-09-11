import { SPECIES_CATALOG_GROUPS } from "../../constants/livestockSpecies";

export default function LivestockFilters({
  search,
  setSearch,
  species,
  setSpecies,
  status,
  setStatus,
  gender,
  setGender,
  sort,
  setSort,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr repeat(4,1fr)",
        gap: 16,
        marginBottom: 24,
      }}
    >
      {/* Search */}

      <input
        type="text"
        placeholder="🔍 Search by tag, breed or species..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={inputStyle}
      />

      {/* Species */}

      <select
        value={species}
        onChange={(e) => setSpecies(e.target.value)}
        style={inputStyle}
      >
        <option value="All">All Species</option>
        {SPECIES_CATALOG_GROUPS.map((grp) => (
          <optgroup key={grp.group} label={grp.group}>
            {grp.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Status */}

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={inputStyle}
      >
        <option value="All">All Status</option>
        <option>Healthy</option>
        <option>Pregnant</option>
        <option>Sick</option>
        <option>Sold</option>
      </select>

      {/* Gender */}

      <select
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        style={inputStyle}
      >
        <option value="All">All Gender</option>
        <option>Male</option>
        <option>Female</option>
        <option>Cow</option>
        <option>Bull</option>
        <option>Ram</option>
        <option>Ewe</option>
        <option>Piglet</option>
      </select>

      {/* Sort */}

      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        style={inputStyle}
      >
        <option value="Newest">Newest</option>
        <option value="Oldest">Oldest</option>
        <option value="Heaviest">Heaviest</option>
        <option value="Lightest">Lightest</option>
        <option value="Tag">Tag</option>
      </select>
    </div>
  );
}

const inputStyle = {
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #CBD5E1",
  fontSize: 14,
  background: "#FFFFFF",
};
