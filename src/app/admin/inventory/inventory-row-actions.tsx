"use client";

import { useTransition } from "react";
import Link from "next/link";
import { MoreHorizontal, Edit, Trash2, CheckCircle, Clock, Archive } from "lucide-react";
import { setVehicleStatus, deleteVehicle } from "./actions";

export function InventoryRowActions({ vehicleId, currentStatus }: { vehicleId: string; currentStatus: string }) {
  const [pending, startTransition] = useTransition();

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;
    
    startTransition(async () => {
      const res = await setVehicleStatus(vehicleId, newStatus);
      if (res?.error) {
        alert("Failed to change status: " + res.error);
      }
    });
  }

  function handleDelete() {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      startTransition(async () => {
        const res = await deleteVehicle(vehicleId, false);
        if (res?.error) {
          alert("Failed to delete vehicle: " + res.error);
        }
      });
    }
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <select
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={pending}
        className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground disabled:opacity-50"
      >
        <option value="draft">Draft</option>
        <option value="available">Available</option>
        <option value="reserved">Reserved</option>
        <option value="sold">Sold</option>
        <option value="archived">Archived</option>
      </select>
      
      <Link 
        href={`/admin/inventory/${vehicleId}`} 
        className="text-primary hover:underline"
        title="Edit"
      >
        <Edit className="size-4" />
      </Link>
      
      <button 
        disabled={pending} 
        onClick={handleDelete} 
        className="text-danger hover:opacity-70 disabled:opacity-50"
        title="Delete"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
