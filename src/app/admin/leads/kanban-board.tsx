"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AdminLead } from "./leads-table";
import { updateLeadStatus } from "./actions";
import { Loader2 } from "lucide-react";

const COLUMNS = [
  { id: "new", label: "New", color: "bg-blue-100 dark:bg-blue-900/40" },
  { id: "contacted", label: "Contacted", color: "bg-yellow-100 dark:bg-yellow-900/40" },
  { id: "won", label: "Won", color: "bg-green-100 dark:bg-green-900/40" },
  { id: "lost", label: "Lost", color: "bg-red-100 dark:bg-red-900/40" },
];

export function KanbanBoard({ initialLeads }: { initialLeads: AdminLead[] }) {
  const [leads, setLeads] = useState<AdminLead[]>(initialLeads);
  const [isPending, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain");
    if (!leadId) return;

    setDraggingId(null);
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === status) return;

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status } : l))
    );

    // Server update
    startTransition(async () => {
      try {
        await updateLeadStatus(leadId, status);
      } catch (err) {
        console.error("Failed to update status", err);
        // Revert on error
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: lead.status } : l))
        );
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {COLUMNS.map((col) => (
        <div
          key={col.id}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
          className={`flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm min-h-[500px] ${
            isPending ? "opacity-70 pointer-events-none" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{col.label}</h3>
            <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${col.color} text-foreground`}>
              {leads.filter((l) => l.status === col.id).length}
            </span>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            {leads
              .filter((l) => l.status === col.id)
              .map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className={`group relative cursor-grab active:cursor-grabbing rounded-lg border border-border bg-background p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md ${
                    draggingId === lead.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {lead.name}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {lead.type.replace(/_/g, " ")}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-3 truncate">
                    {lead.vehicle_title !== "N/A" ? lead.vehicle_title : "General"}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                    <span>{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            
            {leads.filter((l) => l.status === col.id).length === 0 && (
              <div className="flex-1 border-2 border-dashed border-border rounded-lg flex items-center justify-center p-4">
                <span className="text-sm text-muted-foreground">Drop here</span>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {isPending && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </div>
      )}
    </div>
  );
}
