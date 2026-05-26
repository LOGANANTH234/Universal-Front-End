'use client' 
import { useState } from 'react'
import { MoreVertical, Clock, LogIn, LogOut, Zap, DollarSign } from 'lucide-react'
import type { LiveAttendanceData } from "@/lib/attendance-types" 
import SimplePunchModal from './simple-punch-modal'

interface LiveAttendanceCardProps { 
  attendance: LiveAttendanceData 
} 

export default function LiveAttendanceCard({ attendance }: LiveAttendanceCardProps) {
  const [showPunchDetails, setShowPunchDetails] = useState(false) 
  // Use 'inside' flag: if inside is true, use green color, else red
  const isInside = attendance.inside === true
  const bgColor = isInside ? "#E8F8EF" : "#FDECEC" 
  const borderColor = isInside ? "#10B981" : "#EF4444"
  const isClocked = attendance.clockInTime !== null
  
  // Display logic per requirements:
  // If latestOut has value (not null, not "--") → Show "Latest Out" in red + latestOut time
  // Else if latestIn has value → Show "Latest In" in green + latestIn time
  // Else → Show "Latest Out" label + empty value (--)
  // Note: clockInTime maps to latestIn, latestPunchTime maps to latestOut
  const hasLatestOut = attendance.latestPunchTime && attendance.latestPunchTime !== null && attendance.latestPunchTime.toString() !== "--" && attendance.latestPunchTime.toString().trim() !== ""
  const hasLatestIn = !hasLatestOut && attendance.clockInTime && attendance.clockInTime !== null && attendance.clockInTime.toString() !== "--" && attendance.clockInTime.toString().trim() !== ""
  
  const displayTime = hasLatestOut ? attendance.latestPunchTime : (hasLatestIn ? attendance.clockInTime : "--")
  const displayLabel = hasLatestOut ? "Latest Out" : (hasLatestIn ? "Latest In" : "Latest Out")
  const displayColor = hasLatestOut ? "#EF4444" : (hasLatestIn ? "#10B981" : "#6B7280")
  
  // DEBUG LOGGING
  console.log(`[v0] ${attendance.employeeName} (${attendance.employeeId}):`, {
    latestPunchTime: attendance.latestPunchTime,
    clockInTime: attendance.clockInTime,
    hasLatestOut,
    hasLatestIn,
    displayLabel,
    displayTime,
    displayColor
  })

  return ( 
    <div 
      onClick={() => setShowPunchDetails(true)}
      className="rounded-lg cursor-pointer transition-shadow hover:shadow-md" 
      style={{ 
      backgroundColor: bgColor, 
      width: "480px", 
      padding: "18px", 
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      border: `2px solid ${borderColor}`,
      fontFamily: "system-ui, -apple-system, sans-serif" 
    }}> 
      {/* Header with Avatar, Name, and Icons */} 
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}> 
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flex: 1 }}> 
          {/* Avatar */} 
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "18px", flexShrink: 0 }}> 
            {attendance.employeeName.charAt(0)} 
          </div> 
          {/* Name and Role */} 
          <div style={{ flex: 1, minWidth: 0 }}> 
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#000", lineHeight: "1.2" }}> 
              {attendance.employeeName} ({attendance.employeeId}) 
            </div> 
            <div style={{ fontSize: "12px", color: isInside ? "#10B981" : "#EF4444", lineHeight: "1.2" }}> 
              {attendance.employeeRole} 
            </div> 
          </div> 
        </div> 
        {/* Action Icons */} 
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}> 
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: "0" }}> 
            <MoreVertical size={20} color="#999" /> 
          </button> 
        </div> 
      </div> 

      <div style={{ height: "1px", backgroundColor: isClocked ? "#D1F0E4" : "#F5D5D5", margin: "12px 0" }}></div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginTop: "14px" }}> 
        {/* Row 1 - Shift with Icon */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <Clock size={16} color="#3B82F6" />
            <div style={{ fontSize: "11px", color: "#666", fontWeight: "500" }}>
              Shift
            </div>
          </div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#000", whiteSpace: "nowrap", lineHeight: "1.4", paddingLeft: "22px" }}>
            {attendance.shiftStartTime} – {attendance.shiftEndTime}
          </div>
        </div>

        {/* Row 1 - Latest In/Out with Icon */}
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", justifyContent: "flex-end" }}>
            {displayLabel === "Latest In" ? (
              <LogIn size={16} color="#10B981" />
            ) : (
              <LogOut size={16} color="#EF4444" />
            )}
            <div style={{ fontSize: "11px", color: "#666", fontWeight: "500" }}>
              {displayLabel}
            </div>
          </div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: displayColor, lineHeight: "1.4", paddingRight: "22px" }}>
            {displayTime}
          </div>
        </div>

        {/* Row 2 - Worked with Icon */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <Zap size={16} color="#F59E0B" />
            <div style={{ fontSize: "11px", color: "#666", fontWeight: "500" }}>
              Worked
            </div>
          </div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#000", whiteSpace: "nowrap", lineHeight: "1.4", paddingLeft: "22px" }}>
            {attendance.workedHours}h {attendance.workedMinutes}m
          </div>
        </div>

        {/* Row 2 - Late By */}
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", justifyContent: "flex-end" }}>
            <div style={{ fontSize: "11px", color: "#666", fontWeight: "500" }}>
              Late by
            </div>
          </div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#EF4444", lineHeight: "1.4", paddingRight: "22px" }}>
            {attendance.lateBy}
          </div>
        </div>
      </div> 
      
      {/* Punch Details Modal */}
      <SimplePunchModal
        open={showPunchDetails}
        onOpenChange={setShowPunchDetails}
        employeeName={attendance.employeeName}
        punchDetails={attendance.punchDetails || []}
      />
    </div> 
  ) 
}
