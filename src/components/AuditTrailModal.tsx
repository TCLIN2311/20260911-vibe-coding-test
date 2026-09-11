import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User as UserIcon,
  FileText,
  HelpCircle,
  FolderKanban,
  Paperclip,
  CheckCircle
} from 'lucide-react';
import { AuditLog, User } from '../types/pms';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLog[];
  users: User[];
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  users,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  if (!isOpen) return null;

  const filteredLogs = auditLogs.filter((log) => {
    if (filterType !== 'all' && log.targetType !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchTarget = log.targetName.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      if (!matchAction && !matchTarget && !matchDetails) return false;
    }
    return true;
  });

  const getTargetTag = (type: string) => {
    switch (type) {
      case 'RFI':
        return <span className="text-[#ffb000] font-bold">[RFI]</span>;
      case 'TASK':
        return <span className="text-[#33ff00] font-bold">[TASK]</span>;
      case 'ATTACHMENT':
        return <span className="text-[#00ffff] font-bold">[ATTACH]</span>;
      default:
        return <span className="text-[#33ff00]/60 font-bold">[SYS]</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto font-mono">
      <div className="bg-[#0a0a0a] border-2 border-[#33ff00] text-[#33ff00] w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden my-auto shadow-[0_0_20px_rgba(51,255,0,0.2)]">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-[#1f521f] flex items-center justify-between bg-[#050505]">
          <div className="flex items-center gap-2.5">
            <span className="text-[#ffb000] font-bold">[!]</span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#33ff00] tracking-wide">
                SYSTEM_AUDIT_LOG_JOURNAL // SRS_SEC_6.0
              </h3>
              <p className="text-[10px] text-[#33ff00]/60">
                // COMPLIANCE TELEMETRY: IMMUTABLE AUDIT RECORD OF WORKFLOW MUTATIONS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-0.5 text-xs text-[#ff3333] border border-[#1f521f] hover:border-[#ff3333]"
          >
            [ X ]
          </button>
        </div>

        {/* Filters */}
        <div className="px-4 py-2 border-b border-[#1f521f] flex flex-wrap items-center justify-between gap-3 bg-[#050505]">
          <div className="flex-1 max-w-sm flex items-center gap-2">
            <span className="text-[10px] text-[#33ff00]/60 shrink-0">FILTER&gt;</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH BY ACTION, TARGET OR DETAILS..."
              className="w-full text-xs px-2 py-1 bg-[#0a0a0a] border border-[#1f521f] text-[#33ff00] focus:border-[#33ff00]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] text-[#33ff00]/60 uppercase">// CATEGORY:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-[#1f521f] px-2 py-1 bg-[#0a0a0a] text-[#33ff00] text-xs focus:border-[#33ff00]"
            >
              <option value="all">[ALL_TYPES]</option>
              <option value="RFI">[RFI_INQUIRIES]</option>
              <option value="TASK">[KANBAN_TASKS]</option>
              <option value="ATTACHMENT">[FILE_ATTACHMENTS]</option>
            </select>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-[#33ff00]/40 text-xs font-mono">
              // NO AUDIT ENTRIES MATCH THE SPECIFIED QUERY PARAMETERS
            </div>
          ) : (
            filteredLogs.map((log) => {
              const user = users.find((u) => u.id === log.userId);
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-2.5 bg-[#050505] hover:bg-[#1f521f]/20 border border-[#1f521f] transition-colors"
                >
                  <div className="w-6 h-6 border border-[#1f521f] bg-[#0a0a0a] text-[#33ff00] flex items-center justify-center text-[10px] shrink-0 font-bold mt-0.5">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#33ff00]">@{user?.fullName || 'SYSTEM'}</span>
                        <span className="px-1.5 py-0.2 text-[10px] border border-[#ffb000] text-[#ffb000] bg-[#0a0a0a]">
                          [{log.action.toUpperCase()}]
                        </span>
                      </div>
                      <span className="text-[10px] text-[#33ff00]/60 font-mono">
                        [{new Date(log.timestamp).toLocaleString()}]
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs mb-1">
                      {getTargetTag(log.targetType)}
                      <span className="font-mono text-[#ffb000] font-bold">{log.targetName}</span>
                    </div>

                    <p className="text-[#33ff00]/80 bg-[#0a0a0a] p-2 border border-[#1f521f] text-[11px] leading-relaxed">
                      &gt; {log.details}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#1f521f] bg-[#050505] flex justify-between items-center text-xs text-[#33ff00]/70 font-mono">
          <span>// TOTAL_LOGGED_EVENTS: {filteredLogs.length}</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#33ff00] text-black font-bold text-xs hover:bg-white transition-colors"
          >
            [ DISMISS ]
          </button>
        </div>
      </div>
    </div>
  );
};
