import React, { useRef, useState } from 'react';
import {
  Bold,
  Italic,
  List,
  Heading2,
  Code,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  ClipboardCheck,
  HelpCircle,
  Eye,
  Edit3
} from 'lucide-react';
import { Attachment, AttachmentTargetType, User } from '../types/pms';

interface RichTextEditorWithPasteProps {
  value: string;
  onChange: (val: string) => void;
  targetType: AttachmentTargetType;
  targetId: string;
  currentUser: User;
  onAddAttachment?: (attachment: Attachment) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  required?: boolean;
}

export const RichTextEditorWithPaste: React.FC<RichTextEditorWithPasteProps> = ({
  value,
  onChange,
  targetType,
  targetId,
  currentUser,
  onAddAttachment,
  placeholder = '支援 Markdown 語法，可在任何位置直接 Ctrl + V / Cmd + V 貼上剪貼簿截圖...',
  rows = 6,
  label,
  required,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  // Handle Clipboard Paste (Ctrl+V / Cmd+V image capture)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        // Intercepted image from clipboard!
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        setPasteNotice('⚡ 已偵測到剪貼簿截圖，正在生成預覽並上傳中...');

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Data = event.target?.result as string;
          const fileName = `clipboard_snap_${Date.now()}.png`;

          const newAtt: Attachment = {
            id: 'att-clip-' + Math.random().toString(36).substring(2, 9),
            targetType,
            targetId,
            fileName,
            fileSize: file.size,
            mimeType: file.type || 'image/png',
            storageKey: `projects/pms/${targetType.toLowerCase()}s/${targetId}/${fileName}`,
            publicUrl: base64Data,
            uploadedBy: currentUser.id,
            createdAt: new Date().toISOString(),
            isImage: true,
          };

          if (onAddAttachment) {
            onAddAttachment(newAtt);
          }

          // Insert markdown image tag into the textarea at cursor position
          const textarea = textareaRef.current;
          if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const imageMarkdown = `\n![${fileName}](${base64Data})\n`;
            const updated = value.substring(0, start) + imageMarkdown + value.substring(end);
            onChange(updated);

            // Re-focus
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
            }, 50);
          }

          setPasteNotice('✅ 剪貼簿截圖已直接貼上並加入附件清單！');
          setTimeout(() => setPasteNotice(null), 3500);
        };

        reader.readAsDataURL(file);
        break;
      }
    }
  };

  const insertFormatting = (syntaxStart: string, syntaxEnd = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || '文字';
    const replacement = `${syntaxStart}${selectedText}${syntaxEnd}`;

    const updated = value.substring(0, start) + replacement + value.substring(end);
    onChange(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + syntaxStart.length, start + syntaxStart.length + selectedText.length);
    }, 50);
  };

  return (
    <div className="space-y-1 font-mono">
      {label && (
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold text-[#33ff00]">
            &gt; {label} {required && <span className="text-[#ff3333]">*</span>}
          </label>
          <div className="flex items-center gap-1 text-[10px] text-[#ffb000]">
            <span className="border border-[#ffb000]/40 px-1 py-0.2 bg-[#050505]">
              [CLIPBOARD_CTRL+V_SUPPORTED]
            </span>
          </div>
        </div>
      )}

      {/* Editor toolbar */}
      <div className="border border-[#1f521f] bg-[#050505] focus-within:border-[#33ff00] transition-colors">
        <div className="flex items-center justify-between px-2 py-1 bg-[#0a0a0a] border-b border-[#1f521f] text-[#33ff00] text-xs">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**')}
              title="BOLD [**]"
              className="px-1.5 py-0.5 border border-[#1f521f] hover:border-[#33ff00] text-[10px] font-bold"
            >
              [B]
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*')}
              title="ITALIC [*]"
              className="px-1.5 py-0.5 border border-[#1f521f] hover:border-[#33ff00] text-[10px] italic"
            >
              [I]
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('### ')}
              title="HEADING [###]"
              className="px-1.5 py-0.5 border border-[#1f521f] hover:border-[#33ff00] text-[10px]"
            >
              [H3]
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('- ')}
              title="LIST [-]"
              className="px-1.5 py-0.5 border border-[#1f521f] hover:border-[#33ff00] text-[10px]"
            >
              [LIST]
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('`', '`')}
              title="CODE [`]"
              className="px-1.5 py-0.5 border border-[#1f521f] hover:border-[#33ff00] text-[10px]"
            >
              [`CODE`]
            </button>
            <span className="text-[#1f521f] mx-0.5">|</span>
            <button
              type="button"
              onClick={() => insertFormatting('[', '](https://)')}
              title="LINK [URL]"
              className="px-1.5 py-0.5 border border-[#1f521f] hover:border-[#33ff00] text-[10px]"
            >
              [LINK]
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('![photo](', ')')}
              title="IMG [![]()]"
              className="px-1.5 py-0.5 border border-[#1f521f] hover:border-[#33ff00] text-[10px]"
            >
              [IMG]
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMode(mode === 'write' ? 'preview' : 'write')}
              className={`px-2 py-0.5 border text-xs font-bold transition-colors ${
                mode === 'preview'
                  ? 'bg-[#33ff00] text-[#0a0a0a] border-[#33ff00]'
                  : 'bg-[#0a0a0a] text-[#33ff00] border-[#1f521f] hover:border-[#33ff00]'
              }`}
            >
              {mode === 'write' ? '[ VIEW_PREVIEW ]' : '[ EDIT_RAW ]'}
            </button>
          </div>
        </div>

        {/* Paste notification banner */}
        {pasteNotice && (
          <div className="bg-[#0a0a0a] border-b border-[#ffb000] px-2.5 py-1 text-xs text-[#ffb000] flex items-center gap-1.5 font-mono">
            <span>&gt;&gt; {pasteNotice}</span>
          </div>
        )}

        {/* Write or Preview */}
        {mode === 'write' ? (
          <textarea
            ref={textareaRef}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-xs bg-[#050505] text-[#33ff00] placeholder-[#1f521f] focus:outline-none font-mono resize-y"
          />
        ) : (
          <div className="px-3 py-2 min-h-[140px] text-xs text-[#33ff00] bg-[#050505] space-y-2 overflow-auto max-h-96 font-mono">
            {value ? (
              <div>
                {value.split('\n').map((line, idx) => {
                  if (line.startsWith('### ')) {
                    return <h3 key={idx} className="font-bold text-[#ffb000] mt-2 mb-1">{line.replace('### ', '')}</h3>;
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={idx} className="font-bold text-[#ffb000] text-sm mt-2 mb-1">{line.replace('## ', '')}</h2>;
                  }
                  if (line.startsWith('# ')) {
                    return <h1 key={idx} className="font-bold text-[#ffb000] text-base mt-2 mb-1">{line.replace('# ', '')}</h1>;
                  }
                  if (line.startsWith('- ')) {
                    return <li key={idx} className="ml-4 list-disc text-[#33ff00]">{line.replace('- ', '')}</li>;
                  }
                  const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
                  if (imgMatch) {
                    return (
                      <div key={idx} className="my-2 p-1 border border-[#1f521f] bg-[#0a0a0a] max-w-md">
                        <img src={imgMatch[2]} alt={imgMatch[1]} className="max-h-64 object-contain border border-[#1f521f]" />
                        <span className="text-[10px] text-[#ffb000] block mt-1">[{imgMatch[1]}]</span>
                      </div>
                    );
                  }
                  if (!line.trim()) {
                    return <div key={idx} className="h-1.5" />;
                  }
                  return <p key={idx} className="text-[#33ff00] my-0.5">{line}</p>;
                })}
              </div>
            ) : (
              <p className="text-[#1f521f] italic text-xs">[NO_PREVIEW_BUFFER]</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-[#1f521f] px-1 font-mono">
        <span>$ CLIPBOARD_SNAPSHOT_ACTIVE // MARKDOWN_FORMAT_ACCEPTED</span>
        <span>{value.length} BYTES</span>
      </div>
    </div>
  );
};
