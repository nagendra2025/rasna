"use client";

interface Note {
  id: string;
  title: string;
  content: string;
  category: "emergency" | "health" | "school" | "general";
  is_readonly_for_kids: boolean;
}

interface NoteCardProps {
  note: Note;
  isParent: boolean;
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean;
}

const categoryColors = {
  emergency: "bg-red-100 text-red-800 border-red-300",
  health: "bg-pink-100 text-pink-800 border-pink-300",
  school: "bg-blue-100 text-blue-800 border-blue-300",
  general: "bg-gray-100 text-gray-800 border-gray-300",
};

const categoryLabels = {
  emergency: "Emergency",
  health: "Health",
  school: "School",
  general: "General",
};

export default function NoteCard({
  note,
  isParent,
  onEdit,
  onDelete,
  canEdit = false,
}: NoteCardProps) {

  return (
    <div
      className={`rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg border-2 ${
        categoryColors[note.category]
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            categoryColors[note.category]
          }`}
        >
          {categoryLabels[note.category]}
        </span>
        {note.is_readonly_for_kids && (
          <span className="text-xs text-gray-500">🔒 Read-only for kids</span>
        )}
      </div>

      <h3 className="mb-3 text-xl font-semibold text-gray-900">{note.title}</h3>

      <div className="mb-4">
        <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
          {note.content}
        </p>
      </div>

      {/* Actions (only for parents) */}
      {canEdit && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={onEdit}
            className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex-1 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      )}

      {!canEdit && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            View only - Parents can edit
          </p>
        </div>
      )}
    </div>
  );
}








