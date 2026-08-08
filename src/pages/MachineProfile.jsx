import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";

import MachineHeader from "../components/Machinery/MachineHeader";
import MachineInfo from "../components/Machinery/MachineInfo";
import MachineTabs from "../components/Machinery/MachineTabs";
import ServiceHistory from "../components/Machinery/ServiceHistory";
import ServiceEntryModal from "../components/Machinery/ServiceEntryModal";
import MaintenancePlan from "../components/Machinery/MaintenancePlan";
import PhotoSection from "../components/photos/PhotoSection";
import MaintenanceSummary from "../components/Machinery/MaintenanceSummary";
import RunningCosts from "../components/Machinery/RunningCosts";
import MachineNotes from "../components/Machinery/MachineNotes";

import {
  getMachine,
  getMachineServices,
  addMachineService,
  updateMachine,
  getMaintenancePlans,
  addMaintenancePlan,
  updateMaintenancePlan,
} from "../services/machineryService";

export default function MachineProfile() {
  const { id } = useParams();

  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("information");
  const [serviceHistory, setServiceHistory] = useState([]);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [maintenancePlans, setMaintenancePlans] = useState([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);

  useEffect(() => {
    loadMachine();
  }, [id]);

  async function loadMachine() {
    try {
      setLoading(true);
      const data = await getMachine(id);

      await loadServices(data.id);
      await loadMaintenancePlans(data.id);

      setMachine(data);
    } catch (err) {
      // Silently handle — loading state will show
    } finally {
      setLoading(false);
    }
  }

  async function loadServices(machineId) {
    try {
      setLoadingServices(true);
      const data = await getMachineServices(machineId);
      setServiceHistory(data);
    } catch (err) {
      // Service history will remain empty
    } finally {
      setLoadingServices(false);
    }
  }

  async function loadMaintenancePlans(machineId) {
    try {
      setLoadingMaintenance(true);
      const data = await getMaintenancePlans(machineId);
      setMaintenancePlans(data);
    } catch (err) {
      // Maintenance plans will remain empty
    } finally {
      setLoadingMaintenance(false);
    }
  }

  async function handleSaveService(service) {
    try {
      await addMachineService(service);

      const enteredHours = Number(service.hour_meter) || 0;
      if (enteredHours > (machine.hour_meter || 0)) {
        await updateMachine(machine.id, {
          hour_meter: enteredHours,
        });
        setMachine((prev) => ({
          ...prev,
          hour_meter: enteredHours,
        }));
      }

      setServiceModalOpen(false);
      await loadServices(machine.id);
    } catch (err) {
      // Insert failed — modal stays open
    }
  }

  async function handleSaveMaintenancePlan(plan) {
    try {
      if (plan.id) {
        await updateMaintenancePlan(plan.id, plan);
      } else {
        await addMaintenancePlan(plan);
      }
      await loadMaintenancePlans(machine.id);
    } catch (err) {
      // Save failed
    }
  }

  if (loading || !machine) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Loading machine...</Typography>
      </Box>
    );
  }

  function renderContent() {
    switch (activeTab) {
      case "information":
        return <MachineInfo machine={machine} />;

      case "service":
        return (
          <ServiceHistory
            records={serviceHistory}
            onAdd={() => setServiceModalOpen(true)}
          />
        );

      case "maintenance":
        if (loadingMaintenance) {
          return (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6">Loading maintenance plans...</Typography>
            </Box>
          );
        }
        return (
          <>
            <MaintenanceSummary
              machine={machine}
              serviceHistory={serviceHistory}
              maintenancePlan={maintenancePlans[0] || null}
            />
            <MaintenancePlan
              machine={machine}
              plan={maintenancePlans[0] || null}
              onSave={handleSaveMaintenancePlan}
            />
          </>
        );

      case "costs":
        return <RunningCosts serviceHistory={serviceHistory} />;

      case "notes":
        return <MachineNotes notes={machine.notes} serviceHistory={serviceHistory} />;

      default:
        return <MachineInfo machine={machine} />;
    }
  }

  return (
    <Box sx={{ p: 3 }}>

      <MachineHeader
        machine={machine}
        onEdit={() => {}}
        onService={() => setServiceModalOpen(true)}
      />

      <MachineTabs
        value={activeTab}
        onChange={setActiveTab}
      />

      {renderContent()}

      <ServiceEntryModal
        open={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onSave={handleSaveService}
        machine={machine}
      />

      <PhotoSection module="machinery" recordId={String(machine.id)} title="Machine Photos" />

    </Box>
  );
}
