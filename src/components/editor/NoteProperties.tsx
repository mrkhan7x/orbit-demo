import { useNoteStore } from "@/stores/noteStore";
import { Star, Hash, Users, Book } from "lucide-react";
import { Note } from "@/services/noteService";
import { useRef, useState } from "react";

interface NotePropertiesProps {
  note: Note;
}

export function NoteProperties({ note }: NotePropertiesProps) {
  const { editNote } = useNoteStore();
  const titleDebounce = useRef<NodeJS.Timeout | null>(null);
  const participantsDebounce = useRef<NodeJS.Timeout | null>(null);

  // Local state for controlled inputs (immediate feedback, debounced save)
  const [localTitle, setLocalTitle] = useState(note.title);
  const [localParticipants, setLocalParticipants] = useState(() => {
    try { return note.metadata ? JSON.parse(note.metadata).participants || "" : ""; }
    catch { return ""; }
  });

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    editNote(note.id, { category: e.target.value as Note["category"] });
  };

  const toggleFavorite = () => {
    editNote(note.id, { is_favorite: note.is_favorite ? 0 : 1 });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalTitle(val);
    if (titleDebounce.current) clearTimeout(titleDebounce.current);
    titleDebounce.current = setTimeout(() => {
      editNote(note.id, { title: val });
    }, 400);
  };

  const handleParticipantsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalParticipants(val);
    if (participantsDebounce.current) clearTimeout(participantsDebounce.current);
    participantsDebounce.current = setTimeout(() => {
      let metadataObj: any = {};
      try { metadataObj = note.metadata ? JSON.parse(note.metadata) : {}; } catch {}
      editNote(note.id, { metadata: JSON.stringify({ ...metadataObj, participants: val }) });
    }, 400);
  };

  return (
    <div className="flex flex-col gap-3 py-3 px-6 border-b border-[var(--border)] bg-[var(--bg-app)]">
      {/* Title Input */}
      <div className="flex items-center justify-between">
        <input 
          type="text" 
          value={localTitle}
          onChange={handleTitleChange}
          className="bg-transparent text-2xl font-bold text-[var(--text-primary)] outline-none flex-1"
          placeholder="Untitled"
        />
        <button 
          onClick={toggleFavorite}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            note.is_favorite ? "text-yellow-400 bg-yellow-400/10" : "text-[var(--text-muted)] hover:bg-white/5 hover:text-yellow-400"
          }`}
          title={note.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Star size={18} fill={note.is_favorite ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Properties Table */}
      <div className="flex flex-col gap-2 mt-2 max-w-sm">
        
        {/* Category Property */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] w-28">
            <Hash size={14} /> Category
          </div>
          <select 
            value={note.category}
            onChange={handleCategoryChange}
            className="flex-1 bg-transparent text-[var(--text-secondary)] outline-none hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <option value="notes">Note</option>
            <option value="journal">Journal</option>
            <option value="meetings">Meeting</option>
            <option value="clips">Clip</option>
            <option value="voice">Voice</option>
          </select>
        </div>

        {/* Dynamic Properties based on Category */}
        {note.category === "meetings" && (
          <div className="flex items-center gap-4 text-sm animate-fade-in">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] w-28">
              <Users size={14} /> Participants
            </div>
            <input 
              type="text"
              value={localParticipants}
              onChange={handleParticipantsChange}
              placeholder="e.g. Alice, Bob"
              className="flex-1 bg-transparent text-[var(--text-secondary)] outline-none hover:text-[var(--text-primary)] transition-colors placeholder:text-white/20"
            />
          </div>
        )}

        {note.category === "journal" && (
          <div className="flex items-center gap-4 text-sm animate-fade-in">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] w-28">
              <Book size={14} /> Date
            </div>
            <span className="text-[var(--text-secondary)]">
              {new Date(note.created_at).toLocaleDateString()}
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
