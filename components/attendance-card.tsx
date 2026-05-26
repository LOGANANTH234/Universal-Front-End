"use client"

import { Clock, LogIn, LogOut, Briefcase, Hourglass } from "lucide-react"
import type { LiveAttendanceData } from "@/lib/attendance-types"
import { useState } from "react"
import SimplePunchModal from "./simple-punch-modal"
import EditTimingModal from "./edit-timing-modal"

interface AttendanceCardProps {
  attendance: LiveAttendanceData
  canEditPunch?: boolean
}

export default function AttendanceCard({ attendance, canEditPunch = true }: AttendanceCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const isClocked = attendance.clockInTime !== "--"

  const isInside = attendance.inside === true
  const bgColor = isInside ? "#E8F8EF" : "#FDECEC"
  const borderColor = isInside ? "#10b981" : "#ef4444"

  const shiftColor = "#3b82f6"
  const workedColor = "#ec4899"

  const formatWorkedHours = () => {
    const hours = Number(attendance.workedHours) || 0
    const minutes = Number(attendance.workedMinutes) || 0
    if (hours === 0 && minutes === 0) return "0h"
    return `${hours}h ${minutes}m`
  }

  const formatRemainingHours = () => {
    const hours = Number(attendance.remainingHours) || 0
    const minutes = Number(attendance.remainingMinutes) || 0
    if (hours === 0 && minutes === 0) return "0h"
    return `${hours}h ${minutes}m`
  }

  const isLate =
    attendance.lateBy &&
    attendance.lateBy !== "--" &&
    attendance.lateBy !== "0m" &&
    attendance.lateBy !== "0h 0m"

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="rounded-lg shadow-sm hover:shadow-md transition-shadow border w-full max-w-[380px] cursor-pointer"
        style={{
          backgroundColor: bgColor,
          borderColor: borderColor,
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="flex-shrink-0"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #60a5fa, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              {attendance.employeeName.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-semibold text-secondary-foreground truncate">
                {attendance.employeeName}
              </div>
              <div className={`text-xs mt-0.5 truncate font-medium ${isClocked ? "text-green-600" : "text-red-600"}`}>
                {attendance.employeeRole}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-1 flex-shrink-0">
          </div>
        </div>

        {/* Divider */}
        <div
          className="opacity-20"
          style={{
            borderTop: `1px solid ${borderColor}`,
            marginLeft: "-1rem",
            marginRight: "-1rem",
            marginTop: "0.1rem",
            marginBottom: "0.5rem",
          }}
        ></div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-6 sm:gap-7">
          <div className="flex flex-col gap-4">
            {/* Shift */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} style={{ color: shiftColor }} />
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">Shift Timing</div>
              </div>
              <div className="text-xs font-medium">
                {attendance.shiftStartTime} – {attendance.shiftEndTime}
              </div>
            </div>

            {/* Worked */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={14} style={{ color: workedColor }} />
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">Worked Hours</div>
              </div>
              <div className={`text-xs tracking-normal font-bold ${isClocked ? "text-green-700" : "text-red-700"}`}>
                {formatWorkedHours()}
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex flex-col gap-4 items-end ml-auto">
            {/* Latest In / Out */}
            <div className="w-full text-right">
              {(() => {
                const hasLatestOut =
                  attendance.latestPunchTime &&
                  attendance.latestPunchTime !== "--" &&
                  attendance.latestPunchTime.trim() !== ""
                const hasLatestIn =
                  !hasLatestOut &&
                  attendance.clockInTime &&
                  attendance.clockInTime !== "--" &&
                  attendance.clockInTime.trim() !== ""

                const showOut = hasLatestOut
                const showIn = hasLatestIn

                console.log(`[v0] ${attendance.employeeName}: latestPunchTime="${attendance.latestPunchTime}", clockInTime="${attendance.clockInTime}", showOut=${showOut}, showIn=${showIn}`)

                return (
                  <>
                    <div className="flex items-center gap-2 mb-2 justify-end">
                      {showOut ? (
                        <LogOut size={14} style={{ color: "#ef4444" }} />
                      ) : showIn ? (
                        <LogIn size={14} style={{ color: "#10b981" }} />
                      ) : (
                        <LogOut size={14} style={{ color: "#9ca3af" }} />
                      )}
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                        {showOut ? "Latest Out" : showIn ? "Latest In" : "Latest Out"}
                      </div>
                    </div>
                    <div className={`text-xs font-bold ${showOut ? "text-red-600" : showIn ? "text-green-600" : "text-gray-400"}`}>
                      {showOut ? (
                        <>
                          {attendance.latestPunchTime}
                          {isLate && (
                            <span className="text-red-500 font-semibold"> ({attendance.lateBy} late)</span>
                          )}
                        </>
                      ) : showIn ? (
                        <>
                          {attendance.clockInTime}
                          {isLate && (
                            <span className="text-red-500 font-semibold"> ({attendance.lateBy} late)</span>
                          )}
                        </>
                      ) : (
                        "--"
                      )}
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Remaining Hours */}
            <div className="w-full text-right">
              <div className="flex items-center gap-2 mb-2 justify-end">
                <Hourglass size={14} className="text-blue-400" />
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">Remaining</div>
              </div>
              <div className="text-orange-600 text-xs font-bold">
                {formatRemainingHours()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Punch records modal */}
      <SimplePunchModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        employeeName={attendance.employeeName}
        punchDetails={attendance.punchDetails || []}
      />

      {/* Edit timing modal */}
      {canEditPunch && (
        <EditTimingModal attendance={attendance} open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
      )}
    </>
  )
}
