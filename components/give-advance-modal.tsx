'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Advance } from '@/lib/advance-types';
import { MOCK_EMPLOYEES } from '@/lib/employee-mock-data';

interface GiveAdvanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (advance: Omit<Advance, 'id' | 'given' | 'deducted' | 'remaining' | 'status'>) => void;
}

export function GiveAdvanceModal({
  open,
  onOpenChange,
  onConfirm,
}: GiveAdvanceModalProps) {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!selectedEmployee || !amount || !date || !reason) {
      alert('Please fill in all fields');
      return;
    }

    const employee = MOCK_EMPLOYEES.find((emp) => emp.id === selectedEmployee);
    if (!employee) return;

    onConfirm({
      employeeId: employee.id,
      employeeName: employee.name,
      employeeCode: employee.id.toUpperCase(),
      amount: parseFloat(amount),
      date,
      reason,
    });

    setSelectedEmployee('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            Give advance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="employee" className="text-sm font-medium">
              Employee
            </Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger id="employee">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_EMPLOYEES.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id.toUpperCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount (₹)
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g. Medical emergency..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-24 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm advance
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
