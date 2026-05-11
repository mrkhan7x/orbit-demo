import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { useNoteStore } from "@/stores/noteStore";
import { Plus, Inbox, Star, Paperclip, Mic, Book, Users, FileText, LayoutList, Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { NoteProperties } from "@/components/editor/NoteProperties";

const CATEGORIES = [
  { id: "all", label: "All Notes", icon: LayoutList },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "fav", label: "Favorites", icon: Star },
  { id: "clips", label: "Clips", icon: Paperclip },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "journal", label: "Journal", icon: Book },
  { id: "meetings", label: "Meetings", icon: Users },
] as const;

export function NotesPage() {
  const { notes, activeCategory, setActiveCategory, loadNotes, addNote, editNote, removeNote } = useNoteStore();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Clear selected note when switching categories to prevent showing ghost notes
  useEffect(() => {
    setSelectedNoteId(null);
  }, [activeCategory]);

  const filteredNotes = activeCategory === "all" 
    ? notes 
    : activeCategory === "fav" 
      ? notes.filter(n => n.is_favorite)
      : notes.filter(n => n.category === activeCategory);

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const handleCreateNote = () => {
    addNote({ 
      title: "New Note", 
      category: activeCategory === "all" || activeCategory === "fav" ? "notes" : activeCategory as any,
      is_favorite: activeCategory === "fav" ? 1 : 0
    });
  };

  return (
    <PageShell>
      <div className="flex h-full gap-4">
        {/* Categories Sidebar */}
        <div className="w-48 flex-shrink-0 flex flex-col gap-1">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Notes</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Your knowledge base</p>
          </div>
          {CATEGORIES.map((cat) => {
            const count = cat.id === "all" 
              ? notes.length 
              : cat.id === "fav" 
                ? notes.filter(n => n.is_favorite).length 
                : notes.filter(n => n.category === cat.id).length;
                
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeCategory === cat.id
                    ? "bg-[var(--accent)] text-white font-medium"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                <cat.icon size={16} />
                {cat.label}
                <span className="ml-auto text-xs opacity-50">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Notes List */}
        <div className="w-64 flex-shrink-0 card flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-secondary)]">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {CATEGORIES.find(c => c.id === activeCategory)?.label}
            </span>
            <button 
              onClick={handleCreateNote}
              className="w-7 h-7 rounded flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
            {filteredNotes.length === 0 ? (
              <div className="p-4 text-center text-xs text-[var(--text-muted)]">No notes found.</div>
            ) : (
              filteredNotes.map((note) => {
                // Extract plain text preview from HTML content
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = note.content || "";
                const preview = tempDiv.textContent || tempDiv.innerText || "Empty note";
                
                return (
                  <button
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`flex flex-col text-left p-3 rounded-lg transition-colors group relative ${
                      selectedNoteId === note.id ? "bg-[var(--bg-hover)] border border-[var(--border)]" : "hover:bg-[var(--bg-hover)] border border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate flex-1 pr-2">
                        {note.is_favorite && <Star size={10} className="inline text-yellow-400 mr-1 mb-0.5" fill="currentColor" />}
                        {note.title || "Untitled"}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNote(note.id);
                          if (selectedNoteId === note.id) setSelectedNoteId(null);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] mt-1 truncate w-full">{preview}</span>
                    {note.category === "meetings" && note.metadata && JSON.parse(note.metadata).participants && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[var(--text-muted)] w-fit mt-1.5">
                        {JSON.parse(note.metadata).participants}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Note Editor Area */}
        <div className="flex-1 card flex flex-col overflow-hidden bg-[var(--bg-app)]">
          {selectedNote ? (
            <div className="flex flex-col h-full overflow-hidden">
              <NoteProperties note={selectedNote} />
              <div className="flex-1 overflow-hidden relative">
                <RichTextEditor 
                  key={selectedNote.id} // Force re-mount on note switch
                  content={selectedNote.content || ""} 
                  onChange={(content) => editNote(selectedNote.id, { content })} 
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)]">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="text-sm">Select a note or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
