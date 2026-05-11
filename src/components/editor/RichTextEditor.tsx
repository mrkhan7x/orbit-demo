import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import { AudioNode, VideoNode, IframeNode } from './MediaExtensions';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Mic, Play, Square } from 'lucide-react';
import { useState, useRef } from 'react';
import { saveMediaBlob, importMediaFile } from '@/services/mediaService';
// No tauri imports

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}
export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatRecTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Youtube.configure({ inline: false }),
      AudioNode,
      VideoNode,
      IframeNode,
      Placeholder.configure({ placeholder: 'Start writing your notes... Type / for commands (coming soon)' })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] text-[var(--text-primary)] relative',
      },
    },
  });

  if (!editor) return null;

  // ─────────────────────────────────────────────────────────
  // MEDIA UPLOADS & RECORDING
  // ─────────────────────────────────────────────────────────

  const handleAttachMedia = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*,audio/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const assetUrl = URL.createObjectURL(file);
        const ext = file.name.split('.').pop()?.toLowerCase();
        
        if (['png', 'jpg', 'jpeg', 'gif'].includes(ext!)) {
          editor.chain().focus().setImage({ src: assetUrl }).run();
        } else if (['mp4', 'webm'].includes(ext!)) {
          editor.chain().focus().insertContent({ type: 'video', attrs: { src: assetUrl } }).run();
        } else if (['mp3', 'wav', 'ogg'].includes(ext!)) {
          editor.chain().focus().insertContent({ type: 'audio', attrs: { src: assetUrl } }).run();
        }
      } catch (e) {
        console.error("Failed to attach media:", e);
      }
    };
    input.click();
  };

  const handleEmbedLink = () => {
    const url = window.prompt("Enter Media or Website URL to embed:");
    if (url) {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        editor.chain().focus().setYoutubeVideo({ src: url }).run();
      } else {
        editor.chain().focus().insertContent({ type: 'iframe', attrs: { src: url } }).run();
      }
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    } else {
      // Start
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Detect best supported codec — webm may not work on all Windows audio setups
        const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4', '']
          .find(m => m === '' || MediaRecorder.isTypeSupported(m)) || '';
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        audioChunksRef.current = [];
        setRecordingTime(0);
        
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        
        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const assetUrl = await saveMediaBlob(audioBlob, 'webm');
          editor.chain().focus().insertContent({ type: 'audio', attrs: { src: assetUrl } }).run();
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorderRef.current = recorder;
        recorder.start(250); // timeslice 250ms ensures chunks are emitted
        setIsRecording(true);
        timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      } catch (err) {
        console.error("Microphone access denied or error:", err);
        alert("Could not access microphone.");
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-6 relative">
      {/* Formatting Toolbar */}
      <div className="flex items-center flex-wrap gap-1 py-3 border-b border-[var(--border)] mb-4 bg-[var(--bg-app)] sticky top-0 z-10">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={<Bold size={14} />} title="Bold" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={<Italic size={14} />} title="Italic" />
        
        <div className="w-px h-4 bg-white/10 mx-1" />
        
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={<List size={14} />} title="Bullet List" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} icon={<ListOrdered size={14} />} title="Numbered List" />
        
        <div className="w-px h-4 bg-white/10 mx-1" />
        
        <ToolbarButton onClick={() => {
          const url = window.prompt("URL:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }} active={editor.isActive('link')} icon={<LinkIcon size={14} />} title="Add Link" />
        
        <div className="flex-1" />
        
        {/* Media Tools */}
        <ToolbarButton onClick={handleEmbedLink} icon={<Play size={14} />} title="Embed Link/Video" />
        <ToolbarButton onClick={handleAttachMedia} icon={<ImageIcon size={14} />} title="Attach Image/Video/Audio" />
        
        <button
          onClick={toggleRecording}
          className={`flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium transition-colors ${
            isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 hover:bg-white/10 text-[var(--text-primary)]'
          }`}
        >
          {isRecording ? <Square size={12} fill="currentColor" /> : <Mic size={14} />}
          {isRecording ? formatRecTime(recordingTime) : "Record"}
        </button>
      </div>

      {/* Recording Overlay */}
      {isRecording && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-8">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Recording Voice Memo...</span>
          <span className="text-sm font-mono text-[var(--text-muted)] w-12">{formatRecTime(recordingTime)}</span>
          <button 
            onClick={toggleRecording}
            className="ml-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white p-1.5 rounded-full transition-colors"
          >
            <Square size={14} fill="currentColor" />
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto pb-32 custom-scrollbar">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

function ToolbarButton({ onClick, active = false, icon, title }: { onClick: () => void, active?: boolean, icon: React.ReactNode, title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
        active 
          ? "bg-[var(--accent)] text-white" 
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
      }`}
    >
      {icon}
    </button>
  );
}
