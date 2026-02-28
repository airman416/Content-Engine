import { useState, useEffect } from "react";
import { db, type TrashEntry } from "@/lib/db";
import { useHopperStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";
import { X, Trash2 as TrashIcon, RotateCcw, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Trash() {
  const { showTrash, setShowTrash } = useHopperStore();
  const [entries, setEntries] = useState<TrashEntry[]>([]);

  useEffect(() => {
    if (showTrash) {
      db.trash
        .orderBy("rejectedAt")
        .reverse()
        .toArray()
        .then(setEntries);
    }
  }, [showTrash]);

  const handleRestore = async (entry: TrashEntry) => {
    await db.drafts.add({
      sourcePostId: entry.sourcePostId,
      platform: entry.platform as any,
      content: entry.content,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await db.trash.delete(entry.id!);
    setEntries(entries.filter((e) => e.id !== entry.id));
    const allDrafts = await db.drafts.toArray();
    useHopperStore.getState().setDrafts(allDrafts);
  };

  const handleDelete = async (id: number) => {
    await db.trash.delete(id);
    setEntries(entries.filter((e) => e.id !== id));
  };

  if (!showTrash) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"
        onClick={() => setShowTrash(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="bg-white border border-[#E5E5E5] w-full max-w-2xl max-h-[70vh] flex flex-col"
          style={{
            borderRadius: "3px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-2">
              <TrashIcon className="w-4 h-4 text-[#666]" />
              <h2 className="text-[15px] font-semibold text-[#111827]">
                Trash
              </h2>
              <span className="text-[12px] font-mono text-[#999] ml-1">
                {entries.length} rejected
              </span>
            </div>
            <button
              data-testid="button-close-trash"
              onClick={() => setShowTrash(false)}
              className="text-[#999] hover:text-[#666] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {entries.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-[13px] text-[#999]">
                No rejected drafts yet
              </div>
            ) : (
              <div className="divide-y divide-[#F0F0F0]">
                {entries.map((entry) => (
                  <div key={entry.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[#999] uppercase tracking-wider">
                          {entry.platform}
                        </span>
                        <span className="text-[11px] text-[#CCC]">·</span>
                        <span className="text-[11px] text-[#999]">
                          {formatDistanceToNow(new Date(entry.rejectedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          data-testid={`button-restore-${entry.id}`}
                          onClick={() => handleRestore(entry)}
                          className="inline-flex items-center gap-1 h-6 px-2 text-[11px] font-medium text-[#666] bg-white border border-[#E5E5E5] hover:border-green-300 hover:text-green-600 transition-colors"
                          style={{ borderRadius: "2px" }}
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore
                        </button>
                        <button
                          data-testid={`button-delete-${entry.id}`}
                          onClick={() => handleDelete(entry.id!)}
                          className="inline-flex items-center justify-center h-6 w-6 text-[#CCC] hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[13px] leading-[1.6] text-[#333] line-clamp-4">
                      {entry.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
