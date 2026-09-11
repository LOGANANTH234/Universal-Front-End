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
        className={`rounded-xl shadow-sm hover:shadow-md transition-all border w-full cursor-pointer p-4 flex flex-col gap-3 ${
          isInside
            ? "bg-emerald-50/80 border-emerald-400 hover:border-emerald-500 dark:bg-emerald-950/25 dark:border-emerald-700/60 dark:hover:border-emerald-500"
            : "bg-rose-50/80 border-rose-300 hover:border-rose-400 dark:bg-rose-950/25 dark:border-rose-700/60 dark:hover:border-rose-500"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm"
            >
              {attendance.employeeName.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                {attendance.employeeName}
              </div>
              <div className={`text-xs mt-0.5 truncate font-semibold ${isClocked ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
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
          className={`border-t -mx-4 my-0.5 ${
            isInside
              ? "border-emerald-200 dark:border-emerald-800/40"
              : "border-rose-200 dark:border-rose-800/40"
          }`}
        />

        {/* Details */}
        <div className="grid grid-cols-2 gap-6 sm:gap-7">
          <div className="flex flex-col gap-4">
            {/* Shift */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Clock size={14} className="text-blue-500 dark:text-blue-400" />
                <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-slate-400">Shift Timing</div>
              </div>
              <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">
                {attendance.shiftStartTime} – {attendance.shiftEndTime}
              </div>
            </div>

            {/* Worked */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Briefcase size={14} className="text-pink-500 dark:text-pink-400" />
                <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-slate-400">Worked Hours</div>
              </div>
              <div className={`text-xs tracking-normal font-bold ${isClocked ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
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

                return (
                  <>
                    <div className="flex items-center gap-2 mb-1.5 justify-end">
                      {showOut ? (
                        <LogOut size={14} className="text-rose-500 dark:text-rose-400" />
                      ) : showIn ? (
                        <LogIn size={14} className="text-emerald-500 dark:text-emerald-400" />
                      ) : (
                        <LogOut size={14} className="text-gray-400 dark:text-slate-500" />
                      )}
                      <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-slate-400">
                        {showOut ? "Latest Out" : showIn ? "Latest In" : "Latest Out"}
                      </div>
                    </div>
                    <div className={`text-xs font-bold ${showOut ? "text-rose-600 dark:text-rose-400" : showIn ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-slate-500"}`}>
                      {showOut ? (
                        <>
                          {attendance.latestPunchTime}
                          {isLate && (
                            <span className="text-rose-500 dark:text-rose-400 font-semibold"> ({attendance.lateBy} late)</span>
                          )}
                        </>
                      ) : showIn ? (
                        <>
                          {attendance.clockInTime}
                          {isLate && (
                            <span className="text-rose-500 dark:text-rose-400 font-semibold"> ({attendance.lateBy} late)</span>
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
              <div className="flex items-center gap-2 mb-1.5 justify-end">
                <Hourglass size={14} className="text-blue-500 dark:text-blue-400" />
                <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-slate-400">Remaining</div>
              </div>
              <div className="text-orange-600 dark:text-orange-400 text-xs font-bold">
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
