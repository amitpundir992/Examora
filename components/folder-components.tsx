"use client";

import { useState } from "react";
import {
  Folder,
  FolderOpen,
  File,
  X,
  ChevronRight,
} from "lucide-react";
import type { Exam, FolderWithExamCount } from "@/lib/types";
import { Button, Card, Input, Spinner, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

// ---- Context Menu ----
interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  items: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
    tooltip?: string;
  }>;
}

export function ContextMenu({ x, y, onClose, items }: ContextMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 min-w-48 overflow-hidden rounded-lg border bg-card shadow-lg"
        style={{ left: x, top: y }}
      >
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
            title={item.tooltip}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              item.danger
                ? "hover:bg-danger/10 hover:text-danger disabled:hover:bg-transparent disabled:hover:text-current"
                : "hover:bg-muted disabled:hover:bg-transparent"
            )}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

// ---- Create Folder Dialog ----
interface CreateFolderDialogProps {
  onClose: () => void;
  onSubmit: (name: string) => void;
  loading: boolean;
}

export function CreateFolderDialog({ onClose, onSubmit, loading }: CreateFolderDialogProps) {
  const [name, setName] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create New Folder</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) onSubmit(name);
            if (e.key === "Escape") onClose();
          }}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(name)} disabled={loading}>
            {loading ? <><Spinner /> Creating...</> : "Create"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ---- Rename Dialog ----
interface RenameDialogProps {
  initialName: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
  loading: boolean;
}

export function RenameDialog({ initialName, onClose, onSubmit, loading }: RenameDialogProps) {
  const [name, setName] = useState(initialName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rename</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New name"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading && name.trim()) onSubmit(name.trim());
            if (e.key === "Escape") onClose();
          }}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(name.trim())} disabled={loading || !name.trim()}>
            {loading ? <><Spinner /> Saving...</> : "Rename"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ---- Properties Dialog ----
interface PropertiesDialogProps {
  folder: FolderWithExamCount;
  onClose: () => void;
}

export function PropertiesDialog({ folder, onClose }: PropertiesDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-md space-y-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Folder Properties</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground">Name</p>
            <p className="font-medium">{folder.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Exams</p>
            <p className="font-medium">{folder.examCount} exam{folder.examCount !== 1 ? "s" : ""}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium">{new Date(folder.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Last modified</p>
            <p className="font-medium">{new Date(folder.updatedAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Color</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-6 w-6 rounded" style={{ backgroundColor: folder.color }} />
              <p className="font-mono text-xs">{folder.color}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </Card>
    </div>
  );
}

// ---- Folder Item ----
interface FolderItemProps {
  folder: FolderWithExamCount;
  selected: boolean;
  expanded: boolean;
  onClick: () => void;
  onToggle: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
}

export function FolderItem({
  folder,
  selected,
  expanded,
  onClick,
  onToggle,
  onContextMenu,
  onDragOver,
  onDrop,
  isDragOver,
}: FolderItemProps) {
  const FolderIcon = expanded ? FolderOpen : Folder;

  const handleClick = () => {
    onClick();
    onToggle();
  };

  return (
    <div
      onClick={handleClick}
      onContextMenu={onContextMenu}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 transition-colors",
        selected ? "bg-primary/10 text-primary" : "hover:bg-muted",
        isDragOver && "bg-primary/20 ring-2 ring-primary"
      )}
    >
      <ChevronRight 
        className={cn(
          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
          expanded && "rotate-90"
        )} 
      />
      <FolderIcon className="h-5 w-5 shrink-0" style={{ color: folder.color }} />
      <span className="flex-1 truncate font-medium">{folder.name}</span>
      <Badge className="text-xs">{folder.examCount}</Badge>
    </div>
  );
}

// ---- Exam Item ----
interface ExamItemProps {
  exam: Exam;
  selected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
}

export function ExamItem({ exam, selected, onClick, onContextMenu, onDragStart }: ExamItemProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        selected ? "bg-primary/10" : "hover:bg-muted"
      )}
    >
      <File className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{exam.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {exam.questions.length} questions · {exam.source}
        </p>
      </div>
      <Badge>{exam.source}</Badge>
    </div>
  );
}

// ---- Clipboard Types ----
export type ClipboardOperation = "cut" | "copy" | null;
export interface ClipboardItem {
  type: "exam" | "folder";
  id: string;
  operation: "cut" | "copy";
}
