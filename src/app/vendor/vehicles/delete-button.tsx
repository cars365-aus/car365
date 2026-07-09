"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { deleteVehicle } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteVehicleButtonProps {
  vehicleId: string;
  organizationId: string;
}

export function DeleteVehicleButton({ vehicleId, organizationId }: DeleteVehicleButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this vehicle? This action cannot be undone.")) return;

    setIsDeleting(true);
    const formData = new FormData();
    formData.append("vehicleId", vehicleId);
    formData.append("organizationId", organizationId);

    try {
      const result = await deleteVehicle(formData);
      if (result.success) {
        toast.success("Vehicle deleted successfully");
        router.refresh(); // Force a hard refresh of the current route to update the UI
      } else {
        toast.error(result.error || "Failed to delete vehicle");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex items-center justify-center h-9 w-9 rounded-lg border border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title="Delete"
    >
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}
