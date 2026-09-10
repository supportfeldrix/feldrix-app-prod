import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Grid, Stack } from "@mui/material";
import BuildIcon from "@mui/icons-material/Build";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SpeedIcon from "@mui/icons-material/Speed";

import {
  PremiumPageLayout,
  PremiumKPIGrid,
  PremiumStatCard,
  PremiumDashboardSection,
  PremiumActionButton,
  PremiumWorkspaceToolbar,
  PremiumLoadingState,
  PremiumEmptyState,
  spacing,
} from "../design";

import MachineForm from "../components/Machinery/MachineForm";
import MachineCard from "../components/Machinery/MachineCard";
import MachineryInsights from "../components/Machinery/MachineryInsights";

import {
  getMachines,
  addMachine,
  updateMachine,
  getMachineServices,
  getAllMaintenancePlans,
} from "../services/machineryService";

import { generateMachineryAnalytics } from "../utils/machineryAnalytics";
import { formatCurrency } from "../utils/currency";
import useFarmContext from "../hooks/useFarmContext";

export default function Machinery() {
  const farmCtx = useFarmContext();
  const navigate = useNavigate();

  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [maintenancePlans, setMaintenancePlans] = useState([]);

  useEffect(() => {
    loadMachines();
  }, []);

  async function loadMachines() {
    try {
      const [data, plans] = await Promise.all([
        getMachines(),
        getAllMaintenancePlans(),
      ]);
      setMachines(data || []);
      setMaintenancePlans(plans || []);

      // Load service history for all machines
      const allServices = [];
      for (const machine of (data || [])) {
        try {
          const services = await getMachineServices(machine.id);
          allServices.push(...services);
        } catch { /* skip */ }
      }
      setServiceHistory(allServices);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }

  const analytics = useMemo(
    () => generateMachineryAnalytics({ machines, serviceHistory, maintenancePlans }),
    [machines, serviceHistory, maintenancePlans]
  );

  async function handleSaveMachine(machine) {
    try {
      if (machine.id) {
        await updateMachine(machine.id, machine);
      } else {
        await addMachine(machine);
      }
      setShowForm(false);
      setEditingMachine(null);
      await loadMachines();
    } catch (err) {
      console.error("Save Machine:", err);
    }
  }

  function handleViewMachine(machine) {
    navigate(`/machinery/${machine.id}`);
  }

  function handleEditMachine(machine) {
    setEditingMachine(machine);
    setShowForm(true);
  }

  function handleServiceMachine(machine) {
    navigate(`/machinery/${machine.id}`);
  }

  // Derived KPIs
  const totalMachines = machines.length;
  const active = machines.filter((m) => m.status === "Active").length;
  const inService = machines.filter((m) => m.status === "In Service").length;
  const fleetValue = machines.reduce((sum, m) => sum + (Number(m.purchase_price) || 0), 0);

  if (loading) {
    return (
      <PremiumPageLayout
        title="Machinery"
        subtitle="Manage your fleet, maintenance schedules and operational performance."
        icon={<BuildIcon sx={{ fontSize: 28 }} />}
      >
        <PremiumLoadingState message="Loading fleet data..." size={40} />
      </PremiumPageLayout>
    );
  }

  return (
    <PremiumPageLayout
      title="Machinery"
      subtitle="Manage your fleet, maintenance schedules and operational performance."
      icon={<BuildIcon sx={{ fontSize: 28 }} />}
    >
      <Stack spacing={4}>
        {/* KPI Cards */}
        <PremiumKPIGrid gap={3.5}>
          <PremiumStatCard
            label="Total Machines"
            value={totalMachines}
            subtitle="In your fleet"
            icon={<BuildIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(46,125,50,0.12)"
            iconColor="#2E7D32"
          />
          <PremiumStatCard
            label="Operational"
            value={active}
            subtitle="Active machines"
            icon={<CheckCircleIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(25,118,210,0.12)"
            iconColor="#1976D2"
          />
          <PremiumStatCard
            label="In Service"
            value={inService}
            subtitle="Currently servicing"
            icon={<SpeedIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(237,108,2,0.12)"
            iconColor="#ED6C02"
          />
          <PremiumStatCard
            label="Fleet Value"
            value={formatCurrency(fleetValue, farmCtx)}
            subtitle="Total asset value"
            icon={<AccountBalanceWalletIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(106,27,154,0.12)"
            iconColor="#6A1B9A"
          />
        </PremiumKPIGrid>

        {/* Fleet Intelligence */}
        <PremiumDashboardSection
          title="Fleet Intelligence"
          description="AI-powered maintenance monitoring and cost recommendations."
        >
          <MachineryInsights analytics={analytics} />
        </PremiumDashboardSection>

        {/* Machine Form (toggle) */}
        {showForm && (
          <MachineForm
            onSave={handleSaveMachine}
            onCancel={() => { setShowForm(false); setEditingMachine(null); }}
            initialValues={editingMachine || {}}
          />
        )}

        {/* Fleet Registry */}
        <PremiumDashboardSection
          title="Fleet Registry"
          description={`${totalMachines} machine${totalMachines !== 1 ? "s" : ""} in your fleet.`}
        >
          <PremiumWorkspaceToolbar
            primaryAction={
              <PremiumActionButton
                label="Add Machine"
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => { setEditingMachine(null); setShowForm((prev) => !prev); }}
              />
            }
          />

          {machines.length === 0 ? (
            <PremiumEmptyState
              title="No Machines Yet"
              message="Add your first tractor, vehicle or implement to start tracking maintenance and costs."
            />
          ) : (
            <Grid container spacing={3}>
              {machines.map((machine) => (
                <Grid key={machine.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <MachineCard
                    machine={machine}
                    onView={handleViewMachine}
                    onEdit={handleEditMachine}
                    onService={handleServiceMachine}
                    lastService={serviceHistory.find((s) => s.machine_id === machine.id)}
                    maintenancePlan={maintenancePlans.find((p) => p.machine_id === machine.id)}
                    serviceHistory={serviceHistory.filter((s) => s.machine_id === machine.id)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </PremiumDashboardSection>
      </Stack>
    </PremiumPageLayout>
  );
}
