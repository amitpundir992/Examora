"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderPlus,
  Trash2,
  Edit,
  Info,
  FileText,
  FolderInput,
} from "lucide-react";
import type { Exam, FolderWithExamCount } from "@/lib/types";
import { Button } from "@/components/ui";
import {
  ContextMenu,
  CreateFolderDialog,
  RenameDialog,
  PropertiesDialog,
  FolderItem,
  ExamItem,
} from "@/components/folder-components";

interface ExamsFileExplorerProps {
  folders: FolderWithExamCount[];
  exams: Exam[];
}

export function ExamsFileExplorer({ folders: initialFolders, exams: initialExams }: ExamsFileExplorerProps) {
  const router = useRouter();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<{ type: "exam" | "folder"; id: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: "exam" | "folder" | "root"; id?: string } | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [draggedExam, setDraggedExam] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Dialogs
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{ type: "exam" | "folder"; id: string; name: string } | null>(null);
  const [propertiesDialog, setPropertiesDialog] = useState<FolderWithExamCount | null>(null);

  const rootExams = useMemo(() => initialExams.filter((e) => !e.folderId), [initialExams]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItem) return;
      
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "Delete") {
        e.preventDefault();
        if (selectedItem.type === "folder") {
          const folder = initialFolders.find(f => f.id === selectedItem.id);
          if (folder && folder.examCount === 0) {
            handleDelete("folder", selectedItem.id);
          }
        } else {
          handleDelete("exam", selectedItem.id);
        }
      } else if (e.key === "F2") {
        e.preventDefault();
        if (selectedItem.type === "folder") {
          const folder = initialFolders.find(f => f.id === selectedItem.id);
          if (folder) setRenameDialog({ type: "folder", id: folder.id, name: folder.name });
        } else {
          const exam = initialExams.find(e => e.id === selectedItem.id);
          if (exam) setRenameDialog({ type: "exam", id: exam.id, name: exam.title });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, initialFolders, initialExams]);

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateFolder = async (name: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined }),
      });
      if (res.ok) {
        router.refresh();
        setShowCreateFolder(false);
      }
    } catch (err) {
      console.error("Failed to create folder:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (type: "exam" | "folder", id: string, newName: string) => {
    setLoading(true);
    try {
      const endpoint = type === "folder" ? `/api/folders?id=${id}` : `/api/exams/${id}`;
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(type === "folder" ? { name: newName } : { title: newName }),
      });
      if (res.ok) {
        router.refresh();
        setRenameDialog(null);
      }
    } catch (err) {
      console.error("Failed to rename:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: "exam" | "folder", id: string) => {
    const item = type === "folder" 
      ? initialFolders.find(f => f.id === id)
      : initialExams.find(e => e.id === id);
    
    if (!item) return;

    const itemName = type === "folder" ? (item as FolderWithExamCount).name : (item as Exam).title;
    const message = type === "folder"
      ? `Delete folder "${itemName}"?\n\nThis action cannot be undone.`
      : `Delete exam "${itemName}"?\n\nThis will permanently remove the exam and all associated attempts. This action cannot be undone.`;

    if (!confirm(message)) return;
    
    setLoading(true);
    try {
      const endpoint = type === "folder" ? `/api/folders?id=${id}` : `/api/exams/${id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const error = await res.text();
        alert(`Failed to delete ${type}: ${error}`);
      }
    } catch (err) {
      console.error("Failed to delete:", err);
      alert(`Failed to delete ${type}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveExam = async (examId: string, folderId: string | null) => {
    try {
      const res = await fetch(`/api/exams/${examId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to move exam:", err);
    }
  };

  const handleDragStart = (e: React.DragEvent, examId: string) => {
    setDraggedExam(examId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("examId", examId);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverFolder(folderId);
  };

  const handleDrop = async (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    const examId = e.dataTransfer.getData("examId");
    if (examId && draggedExam === examId) {
      await handleMoveExam(examId, folderId);
    }
    setDraggedExam(null);
    setDragOverFolder(null);
  };

  const handleContextMenu = (e: React.MouseEvent, type: "exam" | "folder" | "root", id?: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, id });
  };

  const getContextMenuItems = () => {
    if (!contextMenu) return [];

    if (contextMenu.type === "root") {
      return [
        {
          label: "New Folder",
          icon: <FolderPlus className="h-4 w-4" />,
          onClick: () => setShowCreateFolder(true),
        },
      ];
    }

    if (contextMenu.type === "folder" && contextMenu.id) {
      const folder = initialFolders.find((f) => f.id === contextMenu.id);
      if (!folder) return [];

      return [
        {
          label: "Rename",
          icon: <Edit className="h-4 w-4" />,
          onClick: () => setRenameDialog({ type: "folder", id: folder.id, name: folder.name }),
        },
        {
          label: "Properties",
          icon: <Info className="h-4 w-4" />,
          onClick: () => setPropertiesDialog(folder),
        },
        {
          label: folder.examCount > 0 ? `Delete (${folder.examCount} exam${folder.examCount !== 1 ? 's' : ''} inside)` : "Delete",
          icon: <Trash2 className="h-4 w-4" />,
          onClick: () => handleDelete("folder", folder.id),
          danger: true,
          disabled: folder.examCount > 0,
          tooltip: folder.examCount > 0 ? "Cannot delete folder with exams. Move or delete exams first." : undefined,
        },
      ];
    }

    if (contextMenu.type === "exam" && contextMenu.id) {
      const exam = initialExams.find((e) => e.id === contextMenu.id);
      if (!exam) return [];

      return [
        {
          label: "Open",
          icon: <FileText className="h-4 w-4" />,
          onClick: () => router.push(`/exams/${exam.id}`),
        },
        {
          label: exam.folderId ? "Move to Root" : "Move to Folder",
          icon: <FolderInput className="h-4 w-4" />,
          onClick: () => handleMoveExam(exam.id, exam.folderId ? null : initialFolders[0]?.id || null),
          disabled: !exam.folderId && initialFolders.length === 0,
        },
        {
          label: "Rename",
          icon: <Edit className="h-4 w-4" />,
          onClick: () => setRenameDialog({ type: "exam", id: exam.id, name: exam.title }),
        },
        {
          label: "Delete",
          icon: <Trash2 className="h-4 w-4" />,
          onClick: () => handleDelete("exam", exam.id),
          danger: true,
        },
      ];
    }

    return [];
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exams</h1>
          <p className="text-sm text-muted-foreground">
            {initialFolders.length} folder{initialFolders.length !== 1 ? "s" : ""} · {initialExams.length} exam{initialExams.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowCreateFolder(true)}>
            <FolderPlus className="mr-1 h-4 w-4" /> New Folder
          </Button>
          <Link href="/upload">
            <Button variant="secondary" size="sm">📄 Upload</Button>
          </Link>
          <Link href="/ai-generator">
            <Button size="sm">✨ Generate</Button>
          </Link>
        </div>
      </div>

      {/* File Explorer */}
      <div
        className="space-y-1 rounded-lg border bg-card p-4"
        onContextMenu={(e) => handleContextMenu(e, "root")}
      >
        {/* Folders */}
        {initialFolders.map((folder) => {
          const folderExams = initialExams.filter((e) => e.folderId === folder.id);
          const isExpanded = expandedFolders.has(folder.id);

          return (
            <div key={folder.id}>
              <FolderItem
                folder={folder}
                selected={selectedItem?.type === "folder" && selectedItem.id === folder.id}
                expanded={isExpanded}
                onClick={() => setSelectedItem({ type: "folder", id: folder.id })}
                onToggle={() => toggleFolder(folder.id)}
                onContextMenu={(e) => handleContextMenu(e, "folder", folder.id)}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDrop={(e) => handleDrop(e, folder.id)}
                isDragOver={dragOverFolder === folder.id}
              />

              {/* Exams in Folder */}
              {isExpanded && (
                <div className="ml-7 space-y-1 border-l-2 border-muted pl-3 pt-1">
                  {folderExams.map((exam) => (
                    <ExamItem
                      key={exam.id}
                      exam={exam}
                      selected={selectedItem?.type === "exam" && selectedItem.id === exam.id}
                      onClick={() => setSelectedItem({ type: "exam", id: exam.id })}
                      onContextMenu={(e) => handleContextMenu(e, "exam", exam.id)}
                      onDragStart={(e) => handleDragStart(e, exam.id)}
                    />
                  ))}
                  {folderExams.length === 0 && (
                    <p className="py-2 text-xs italic text-muted-foreground">Empty folder</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Root Exams */}
        {rootExams.length > 0 && (
          <>
            {initialFolders.length > 0 && <div className="my-3 border-t" />}
            <div
              className="space-y-1"
              onDragOver={(e) => handleDragOver(e, null)}
              onDrop={(e) => handleDrop(e, null)}
            >
              {rootExams.map((exam) => (
                <ExamItem
                  key={exam.id}
                  exam={exam}
                  selected={selectedItem?.type === "exam" && selectedItem.id === exam.id}
                  onClick={() => setSelectedItem({ type: "exam", id: exam.id })}
                  onContextMenu={(e) => handleContextMenu(e, "exam", exam.id)}
                  onDragStart={(e) => handleDragStart(e, exam.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {initialFolders.length === 0 && initialExams.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <p>No exams yet. Upload or generate one to get started.</p>
            <p className="mt-2">Right-click to create a folder.</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Dialogs */}
      {showCreateFolder && (
        <CreateFolderDialog
          onClose={() => setShowCreateFolder(false)}
          onSubmit={handleCreateFolder}
          loading={loading}
        />
      )}

      {renameDialog && (
        <RenameDialog
          initialName={renameDialog.name}
          onClose={() => setRenameDialog(null)}
          onSubmit={(newName) => handleRename(renameDialog.type, renameDialog.id, newName)}
          loading={loading}
        />
      )}

      {propertiesDialog && (
        <PropertiesDialog folder={propertiesDialog} onClose={() => setPropertiesDialog(null)} />
      )}
    </div>
  );
}
