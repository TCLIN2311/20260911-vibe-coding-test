import React, { useRef, useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Paperclip,
  UploadCloud,
  Trash2,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { Attachment, AttachmentTargetType, User } from '../types/pms';
import { formatFileSize } from '../utils/storage';

interface AttachmentsListProps {
  attachments: Attachment[];
  targetType: AttachmentTargetType;
  targetId: string;
  currentUser: User;
  onAddAttachment: (attachment: Attachment) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  canEdit?: boolean;
}

export const AttachmentsList: React.FC<AttachmentsListProps> = ({
  attachments,
  targetType,
  targetId,
  currentUser,
  onAddAttachment,
  onDeleteAttachment,
  canEdit = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const filterAttachments = attachments.filter(
    (a) => a.targetType === targetType && a.targetId === targetId
  );

  const processFile = (file: File) => {
    // Check size limit: image 10MB, docs 100MB
    const isImg = file.type.startsWith('image/');
    const maxSize = isImg ? 10 * 1024 * 1024 : 100 * 1024 * 1024;

    if (file.size > maxSize) {
      alert(`檔案超過上限！${isImg ? '圖片上限 10MB' : '文件/圖紙上限 100MB'} (檔案大小: ${formatFileSize(file.size)})`);
      return;
    }

    setUploadStatus(`正在模擬簽署 S3/MinIO 預簽名 URL 並上傳: ${file.name}...`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newAttachment: Attachment = {
        id: 'att-' + Math.random().toString(36).substring(2, 9),
        targetType,
        targetId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        storageKey: `projects/pms/${targetType.toLowerCase()}s/${targetId}/${Date.now()}_${file.name}`,
        publicUrl: dataUrl,
        uploadedBy: currentUser.id,
        createdAt: new Date().toISOString(),
        isImage: isImg,
      };

      setTimeout(() => {
        onAddAttachment(newAttachment);
        setUploadStatus(null);
      }, 400);
    };

    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(processFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (canEdit) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canEdit) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(processFile);
    }
  };

  const getFileIcon = (mime: string, name: string) => {
    if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(name)) {
      return <ImageIcon className="w-5 h-5 text-indigo-600" />;
    }
    if (mime.includes('pdf') || /\.pdf$/i.test(name)) {
      return <FileText className="w-5 h-5 text-rose-600" />;
    }
    if (mime.includes('spreadsheet') || mime.includes('excel') || /\.(xlsx|xls|csv)$/i.test(name)) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (mime.includes('zip') || mime.includes('compressed') || /\.(zip|rar|7z)$/i.test(name)) {
      return <FileArchive className="w-5 h-5 text-amber-600" />;
    }
    if (/\.(dwg|dxf|ifc|rvt)$/i.test(name)) {
      return <FileCode className="w-5 h-5 text-cyan-600" />;
    }
    return <Paperclip className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="space-y-2 font-mono">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[#33ff00] flex items-center gap-1.5">
          <span>&gt; ATTACHMENTS_STREAM ({filterAttachments.length})</span>
        </h4>
        {canEdit && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs px-2 py-0.5 bg-[#0a0a0a] text-[#33ff00] hover:bg-[#1f521f] border border-[#1f521f] hover:border-[#33ff00] transition-colors"
          >
            [ + UPLOAD_ATTACHMENT ]
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.dwg,.dxf,.xlsx,.xls,.docx,.doc,.zip,.rar"
      />

      {/* Upload Drag zone */}
      {canEdit && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed p-3 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#33ff00] bg-[#1f521f]/30'
              : 'border-[#1f521f] hover:border-[#33ff00] bg-[#050505]'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1 text-xs">
            <p className="text-[#33ff00] font-bold">
              [ DROP FILES HERE OR CLICK TO BROWSE S3/STORAGE ]
            </p>
            <p className="text-[10px] text-[#1f521f]">
              DWG, PDF, XLSX, ZIP, PNG, JPG // MAX 10MB IMG, 100MB DOC
            </p>
          </div>
        </div>
      )}

      {uploadStatus && (
        <div className="text-xs bg-[#0a0a0a] text-[#ffb000] border border-[#ffb000] px-2 py-1 flex items-center gap-2">
          <span>&gt;&gt; {uploadStatus}</span>
        </div>
      )}

      {/* Attachments listing */}
      {filterAttachments.length === 0 ? (
        <p className="text-xs text-[#1f521f] italic py-1">[NO_ATTACHMENTS_LINKED]</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {filterAttachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between p-2 bg-[#050505] border border-[#1f521f] hover:border-[#33ff00] text-xs transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-[#ffb000] text-[10px] shrink-0 font-bold">[FILE]</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[#33ff00] truncate font-mono" title={att.fileName}>
                    {att.fileName}
                  </p>
                  <p className="text-[10px] text-[#1f521f]">
                    {formatFileSize(att.fileSize)} • {new Date(att.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                {att.isImage && (
                  <button
                    type="button"
                    onClick={() => setPreviewImage(att.publicUrl)}
                    title="PREVIEW"
                    className="px-1 py-0.5 border border-[#1f521f] text-[10px] text-[#33ff00] hover:border-[#33ff00]"
                  >
                    [VIEW]
                  </button>
                )}
                <a
                  href={att.publicUrl}
                  download={att.fileName}
                  title="DOWNLOAD"
                  className="px-1 py-0.5 border border-[#1f521f] text-[10px] text-[#ffb000] hover:border-[#ffb000]"
                >
                  [GET]
                </a>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onDeleteAttachment(att.id)}
                    title="DELETE"
                    className="px-1 py-0.5 border border-[#1f521f] text-[10px] text-[#ff3333] hover:border-[#ff3333]"
                  >
                    [DEL]
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-w-3xl max-h-[85vh] bg-[#0a0a0a] border border-[#33ff00] overflow-hidden p-2 relative text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-2 py-1 border-b border-[#1f521f] mb-2 text-[#33ff00]">
              <span className="font-bold">&gt;&gt; IMAGE_ATTACHMENT_VIEWER</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-[#ff3333] hover:bg-[#ff3333] hover:text-black px-1 font-bold"
              >
                [X]
              </button>
            </div>
            <img
              src={previewImage}
              alt="Attachment preview"
              className="w-full max-h-[75vh] object-contain border border-[#1f521f]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
