import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";

import PageContainer from "../components/layout/PageContainer";

import ProfileHeader from "../components/animalProfile/ProfileHeader";
import AnimalInfo from "../components/animalProfile/AnimalInfo";
import ProfileTabs from "../components/animalProfile/ProfileTabs";

import WeightHistory from "../components/animalProfile/WeightHistory";
import HealthHistory from "../components/animalProfile/HealthHistory";
import BreedingHistory from "../components/animalProfile/BreedingHistory";
import FinanceTab from "../components/animalProfile/FinanceTab";
import NotesCard from "../components/animalProfile/NotesCard";

import WeightSummary from "../components/weight/WeightSummary";
import WeightChart from "../components/weight/WeightChart";
import WeightAnalytics from "../components/weight/WeightAnalytics";
import GrowthInsights from "../components/weight/GrowthInsights";
import WeightEntryModal from "../components/weight/WeightEntryModal";

import HealthEntryModal from "../components/health/HealthEntryModal";
import BreedingEntryModal from "../components/breeding/BreedingEntryModal";
import PregnancySummary from "../components/breeding/PregnancySummary";

import { getAnimals } from "../services/livestockService";
import { getWeightHistory } from "../services/weightService";
import { getHealthHistory } from "../services/healthService";
import { getBreedingHistory } from "../services/breedingService";
import StatusChangeDialog from "../components/livestock/StatusChangeDialog";
import StatusBadge from "../components/livestock/StatusBadge";
import LifecycleBadge from "../components/livestock/LifecycleBadge";
import { getLifecycleStage } from "../services/livestockLifecycle";

export default function AnimalProfile() {
  const { id } = useParams();
  const location = useLocation();

  const [animal, setAnimal] = useState(null);

  const [weightHistory, setWeightHistory] = useState([]);
  const [healthHistory, setHealthHistory] = useState([]);
  const [breedingHistory, setBreedingHistory] = useState([]);

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showBreedingModal, setShowBreedingModal] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  // Determine initial tab from navigation state or default to "weight"
  const sectionFromState = location.state?.section;
  const validTabs = ["weight", "health", "breeding", "finance", "notes"];
  const initialTab = validTabs.includes(sectionFromState) ? sectionFromState : "weight";

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    loadAnimal();
  }, [id]);

  // Update active tab when navigation state changes
  useEffect(() => {
    if (sectionFromState && validTabs.includes(sectionFromState)) {
      setActiveTab(sectionFromState);
    }
  }, [location.state]);

  async function loadAnimal() {
    try {
      const animals = await getAnimals();

      const selected = animals.find(
        (a) => String(a.id) === String(id)
      );

      if (!selected) return;

      setAnimal(selected);

      await Promise.all([
        loadWeightHistory(selected.id),
        loadHealthHistory(selected.id),
        loadBreedingHistory(selected.id),
      ]);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadWeightHistory(animalId) {
    try {
      const data = await getWeightHistory(animalId);
      setWeightHistory(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadHealthHistory(animalId) {
    try {
      const data = await getHealthHistory(animalId);
      setHealthHistory(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadBreedingHistory(animalId) {
    try {
      const data = await getBreedingHistory(animalId);
      setBreedingHistory(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  if (!animal) {
    return (
      <PageContainer
        title="🐄 Animal Profile"
        subtitle="Loading..."
      >
        <p>Loading animal...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="🐄 Animal Profile"
      subtitle={`Viewing ${animal.tag}`}
    >
      <ProfileHeader animal={animal} />

      {/* Status & Lifecycle */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0 8px", flexWrap: "wrap" }}>
        <StatusBadge status={animal.status || "Active"} size="medium" onClick={() => setShowStatusDialog(true)} />
        <LifecycleBadge animal={animal} size="medium" />
        {(() => {
          const lc = getLifecycleStage(animal);
          return lc.ageLabel && lc.ageLabel !== "Birth date not set" ? (
            <span style={{ fontSize: "0.8rem", color: "#64748B" }}>{lc.ageLabel}</span>
          ) : null;
        })()}
        <button
          onClick={() => setShowStatusDialog(true)}
          style={{ border: "none", background: "none", color: "#3B82F6", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", padding: "4px 8px" }}
        >
          Change Status
        </button>
      </div>

      <AnimalInfo animal={animal} />

      <ProfileTabs
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "weight" && (
        <>
          <WeightSummary records={weightHistory} />

          <WeightChart records={weightHistory} />

          <WeightAnalytics records={weightHistory} />

          <GrowthInsights records={weightHistory} />

          <WeightHistory
            records={weightHistory}
            onAddWeight={() =>
              setShowWeightModal(true)
            }
          />
        </>
      )}

      {activeTab === "health" && (
        <HealthHistory
          records={healthHistory}
          onAddTreatment={() =>
            setShowHealthModal(true)
          }
        />
      )}

      {activeTab === "breeding" && (
        <>
          <PregnancySummary
            records={breedingHistory}
          />

          <BreedingHistory
            records={breedingHistory}
            onAddBreeding={() =>
              setShowBreedingModal(true)
            }
          />
        </>
      )}

      {activeTab === "finance" && (
        <FinanceTab
          animal={animal}
        />
      )}

      {activeTab === "notes" && (
        <NotesCard animal={animal} />
      )}

      <WeightEntryModal
        animal={animal}
        open={showWeightModal}
        onClose={() =>
          setShowWeightModal(false)
        }
        onSaved={() => {
          loadWeightHistory(animal.id);
          setShowWeightModal(false);
        }}
      />

      <HealthEntryModal
        open={showHealthModal}
        onClose={() =>
          setShowHealthModal(false)
        }
        animalId={animal.id}
        refreshRecords={() => {
          loadHealthHistory(animal.id);
          setShowHealthModal(false);
        }}
      />

      <BreedingEntryModal
        open={showBreedingModal}
        onClose={() =>
          setShowBreedingModal(false)
        }
        animalId={animal.id}
        refreshRecords={async () => {
          await loadBreedingHistory(animal.id);
          setShowBreedingModal(false);
        }}
      />

      <StatusChangeDialog
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        animal={animal}
        onStatusChanged={loadAnimal}
      />
    </PageContainer>
  );
}
