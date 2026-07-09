import { MessageSquare } from "lucide-react";

export default function MessagesIndexPage() {
  return (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center h-full text-center p-8 bg-slate-50/50">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-200">
        <MessageSquare className="h-10 w-10 text-slate-300" />
      </div>
      <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Your Messages</h3>
      <p className="text-slate-500 mt-2 max-w-sm">
        Select a conversation from the sidebar to view the chat and start messaging.
      </p>
    </div>
  );
}
