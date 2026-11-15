import { FaHeartbeat, FaCalendarAlt, FaExclamationTriangle, FaBaby } from "react-icons/fa";
import { sireLabel } from "../../utils/breedingSire";

export default function BreedingAlerts({
  pregnant = 0,
  dueSoon = 0,
  overdue = 0,
  latestBreeding = null,
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 10px 30px rgba(15,23,42,.08)",
      }}
    >
      <div style={{marginBottom:20,borderBottom:"1px solid #E5E7EB",paddingBottom:14}}>
        <h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#0F172A"}}>
          🍼 Breeding Alerts
        </h2>
        <p style={{marginTop:6,fontSize:14,color:"#64748B"}}>
          Pregnancy overview and latest breeding activity.
        </p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
        {[
          ["Pregnant",pregnant,"#16A34A",FaHeartbeat],
          ["Due Soon",dueSoon,"#D97706",FaCalendarAlt],
          ["Overdue",overdue,"#DC2626",FaExclamationTriangle],
        ].map(([label,value,color,Icon])=>(
          <div key={label} style={{border:"1px solid #E2E8F0",borderRadius:16,padding:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <Icon color={color} size={24}/>
              <div style={{fontSize:28,fontWeight:800,color}}>{value}</div>
            </div>
            <div style={{marginTop:10,fontSize:13,fontWeight:600,color:"#64748B"}}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{borderTop:"1px solid #E5E7EB",paddingTop:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:700,fontSize:18,color:"#0F172A"}}>Latest Breeding</div>
            {latestBreeding ? (
              <>
                <div style={{marginTop:10}}>🐄 Female: {latestBreeding.female?.tag ?? "-"}</div>
                <div>🐂 Sire: {sireLabel(latestBreeding)}</div>
                <div style={{color:"#64748B",marginTop:6}}>
                  📅 {latestBreeding.breeding_date}
                </div>
              </>
            ) : (
              <div style={{marginTop:10,color:"#94A3B8"}}>No breeding records available.</div>
            )}
          </div>
          <FaBaby size={34} color="#EC4899"/>
        </div>
      </div>
    </div>
  );
}
