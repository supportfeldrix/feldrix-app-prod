import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { useEffect, useState } from "react";
import { addAnimal, updateAnimal } from "../../services/livestockService";

export default function AnimalForm({
  refreshAnimals,
  animal = null,
  onSaved,
}) {
  const [form, setForm] = useState({
    tag: "",
    animal_type: "Cattle",
    breed: "",
    gender: "Cow",
    weight: "",
    status: "Active",
    date_of_birth: "",
    purchase_date: "",
    purchase_price: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  const inputStyle={width:"100%",padding:"12px 14px",fontSize:"15px",border:"1px solid #d0d7de",borderRadius:8,background:"#fff",minHeight:"46px",boxSizing:"border-box"};
  const selectStyle={...inputStyle,cursor:"pointer"};
  const textareaStyle={width:"100%",marginTop:18,padding:"14px",fontSize:"15px",border:"1px solid #d0d7de",borderRadius:8,boxSizing:"border-box",resize:"vertical"};

  useEffect(() => {
    if (animal) {
      setForm({
        tag: animal.tag || "",
        animal_type: animal.animal_type || "Cattle",
        breed: animal.breed || "",
        gender: animal.gender || "Cow",
        weight: animal.weight || "",
        status: animal.status || "Active",
        date_of_birth: animal.date_of_birth || "",
        purchase_date: animal.purchase_date || "",
        purchase_price: animal.purchase_price || "",
        notes: animal.notes || "",
      });
    }
  }, [animal]);

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "animal_type") {
      let defaultGender = "Cow";

      switch (value) {
        case "Sheep":
          defaultGender = "Ewe";
          break;

        case "Goats":
          defaultGender = "Doe";
          break;

        case "Pigs":
          defaultGender = "Sow";
          break;

        case "Poultry":
          defaultGender = "Hen";
          break;

        default:
          defaultGender = "Cow";
      }

      setForm({
        ...form,
        animal_type: value,
        gender: defaultGender,
      });

      return;
    }

    setForm({
      ...form,
      [name]: value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.tag.trim()) {
      alert("Tag Number is required.");
      return;
    }

    if (!form.breed.trim()) {
      alert("Breed is required.");
      return;
    }

    setSaving(true);

    try {
      if (animal) {
        await updateAnimal(animal.id, form);
      } else {
        await addAnimal(form);
      }

      setForm({
        tag: "",
        animal_type: "Cattle",
        breed: "",
        gender: "Cow",
        weight: "",
        status: "Active",
        purchase_date: "",
        purchase_price: "",
        notes: "",
      });

      if (refreshAnimals) {
        await refreshAnimals();
      }

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    }

    setSaving(false);
  }

  const genderOptions =
    form.animal_type === "Cattle"
      ? ["Cow", "Bull", "Heifer", "Calf"]
      : form.animal_type === "Sheep"
      ? ["Ewe", "Ram", "Lamb"]
      : form.animal_type === "Goats"
      ? ["Doe", "Buck", "Kid"]
      : form.animal_type === "Pigs"
      ? ["Sow", "Boar", "Piglet"]
      : ["Hen", "Rooster", "Chick"];

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#fff",
        padding: 25,
        borderRadius: 12,
        marginBottom: 25,
        boxShadow: "0 5px 15px rgba(0,0,0,.08)",
      }}
    >
      <h2 style={{ marginTop: 0 }}>
        {animal ? "Edit Animal" : "Add Animal"}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: 18,
        }}
      >
        <input
          style={inputStyle}
          name="tag"
          placeholder="Tag Number"
          value={form.tag}
          onChange={handleChange}
        />

        <select
          style={selectStyle}
          name="animal_type"
          value={form.animal_type}
          onChange={handleChange}
        >
          <option value="Cattle">🐄 Cattle</option>
          <option value="Sheep">🐑 Sheep</option>
          <option value="Goats">🐐 Goats</option>
          <option value="Pigs">🐖 Pigs</option>
          <option value="Poultry">🐔 Poultry</option>
        </select>

        <input
          style={inputStyle}
          name="breed"
          placeholder="Breed"
          value={form.breed}
          onChange={handleChange}
        />

        <select
          style={selectStyle}
          name="gender"
          value={form.gender}
          onChange={handleChange}
        >
          {genderOptions.map((gender) => (
            <option
              key={gender}
              value={gender}
            >
              {gender}
            </option>
          ))}
        </select>

        <input
          style={inputStyle}
          type="number"
          name="weight"
          placeholder="Weight (kg)"
          value={form.weight}
          onChange={handleChange}
        />

        <select
          style={selectStyle}
          name="status"
          value={form.status}
          onChange={handleChange}
        >
          <option>Healthy</option>
          <option>Pregnant</option>
          <option>Sick</option>
          <option>Sold</option>
        </select>

        <input
          style={inputStyle}
          type="date"
          name="date_of_birth"
          placeholder="Date of Birth"
          value={form.date_of_birth}
          onChange={handleChange}
          title="Date of Birth"
        />

        <input
          style={inputStyle}
          type="date"
          name="purchase_date"
          value={form.purchase_date}
          onChange={handleChange}
        />

        <input
          style={inputStyle}
          type="number"
          name="purchase_price"
          placeholder="Purchase Price"
          value={form.purchase_price}
          onChange={handleChange}
        />
      </div>

      <textarea
        name="notes"
        rows="4"
        placeholder="Notes..."
        value={form.notes}
        onChange={handleChange}
        style={textareaStyle}
      />

      <button
        disabled={saving}
        type="submit"
        style={{
          marginTop: 20,
          padding: "14px 36px",
          fontSize: "15px",
          fontWeight: "600",
          background: "#2E7D32",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving
          ? "Saving..."
          : animal
          ? "Update Animal"
          : "Save Animal"}
      </button>
    </form>
  );
}
