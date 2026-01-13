"use client";

import { format, parseISO } from "date-fns";
import Image from "next/image";

interface Memory {
  id: string;
  photo_url: string;
  note: string | null;
  created_at: string;
}

interface MemoryCardProps {
  memory: Memory;
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean;
}

export default function MemoryCard({
  memory,
  onEdit,
  onDelete,
  canEdit = true,
}: MemoryCardProps) {
  const timeStr = format(parseISO(memory.created_at), "h:mm a");

  return (
    <div className="group relative rounded-xl bg-white shadow-md transition-all hover:shadow-xl overflow-hidden">
      {/* Photo */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <Image
          src={memory.photo_url}
          alt={memory.note || "Family memory"}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      {/* Content Overlay */}
      <div className="p-4">
        {memory.note && (
          <p className="mb-2 text-gray-700 whitespace-pre-wrap">
            {memory.note}
          </p>
        )}
        <p className="text-sm text-gray-500">📅 {timeStr}</p>
      </div>

      {/* Action Buttons (shown on hover) */}
      {canEdit && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-md transition-colors hover:bg-white"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg bg-red-500/90 px-3 py-1.5 text-sm font-medium text-white shadow-md transition-colors hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}








