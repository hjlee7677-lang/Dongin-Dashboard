import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Folder, FolderOpen, MoreVertical, Plus, Pencil, Trash2, ChevronRight, ChevronDown 
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useListFolders, getListFoldersQueryKey,
  useCreateFolder, useUpdateFolder, useDeleteFolder
} from "@workspace/api-client-react";

type FolderTreeProps = {
  selectedFolderId: number | null;
  onSelectFolder: (id: number | null) => void;
};

export function FolderTree({ selectedFolderId, onSelectFolder }: FolderTreeProps) {
  const { data: folders, isLoading } = useListFolders();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [targetFolder, setTargetFolder] = useState<number | null>(null);
  const [folderName, setFolderName] = useState("");
  const [parentFolderId, setParentFolderId] = useState<number | null>(null);

  const createFolder = useCreateFolder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFoldersQueryKey() });
        setIsCreateOpen(false);
        setFolderName("");
        toast({ title: "폴더가 생성되었습니다." });
      }
    }
  });

  const updateFolder = useUpdateFolder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFoldersQueryKey() });
        setIsEditOpen(false);
        toast({ title: "폴더가 수정되었습니다." });
      }
    }
  });

  const deleteFolder = useDeleteFolder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFoldersQueryKey() });
        setIsDeleteOpen(false);
        if (selectedFolderId === targetFolder) {
          onSelectFolder(null);
        }
        toast({ title: "폴더가 삭제되었습니다." });
      }
    }
  });

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateDialog = (parentId: number | null, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setParentFolderId(parentId);
    setFolderName("");
    setIsCreateOpen(true);
  };

  const openEditDialog = (id: number, name: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTargetFolder(id);
    setFolderName(name);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTargetFolder(id);
    setIsDeleteOpen(true);
  };

  // Type generated for Folder is recursive or flat. The API returns it as flat array or tree? 
  // Let's assume it returns a tree based on `children?: Folder[]` in types.
  
  const renderFolder = (folder: any, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <div key={folder.id}>
        <div 
          className={`group flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}
          style={{ paddingLeft: `${(level * 12) + 8}px` }}
          onClick={() => onSelectFolder(folder.id)}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div onClick={(e) => hasChildren ? toggleExpand(folder.id, e) : undefined} className="w-4 h-4 flex items-center justify-center opacity-70 hover:opacity-100 shrink-0">
              {hasChildren ? (
                isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
              ) : <span className="w-3" />}
            </div>
            {isExpanded || isSelected ? <FolderOpen className="w-4 h-4 shrink-0 text-primary/70" /> : <Folder className="w-4 h-4 shrink-0" />}
            <span className="truncate text-sm">{folder.name}</span>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{folder.projectCount || 0}</span>
          </div>

          <div className="opacity-0 group-hover:opacity-100 flex items-center shrink-0" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => openCreateDialog(folder.id, e)}>
              <Plus className="w-3 h-3" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={(e) => openEditDialog(folder.id, folder.name, e as any)}>
                  <Pencil className="w-3 h-3 mr-2" /> 이름 변경
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => openDeleteDialog(folder.id, e as any)}>
                  <Trash2 className="w-3 h-3 mr-2" /> 삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-1 space-y-1">
            {folder.children.map((child: any) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-card border-r w-72 shrink-0">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">폴더 구조</h2>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => openCreateDialog(null)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <div 
          className={`flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer mb-2 ${selectedFolderId === null ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50'}`}
          onClick={() => onSelectFolder(null)}
        >
          <div className="w-4 h-4 flex items-center justify-center shrink-0"></div>
          <Folder className="w-4 h-4 shrink-0" />
          <span className="text-sm">모든 프로젝트</span>
        </div>

        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">로딩중...</div>
        ) : (
          <div className="space-y-1">
            {folders?.map((folder) => renderFolder(folder, 0))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{parentFolderId ? '하위 폴더 생성' : '새 폴더 생성'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="폴더 이름" 
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && folderName.trim()) {
                  createFolder.mutate({ data: { name: folderName.trim(), parentId: parentFolderId } });
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>취소</Button>
            <Button 
              onClick={() => createFolder.mutate({ data: { name: folderName.trim(), parentId: parentFolderId } })}
              disabled={!folderName.trim() || createFolder.isPending}
            >
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>폴더 이름 변경</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="폴더 이름" 
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && folderName.trim() && targetFolder) {
                  updateFolder.mutate({ id: targetFolder, data: { name: folderName.trim() } });
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>취소</Button>
            <Button 
              onClick={() => targetFolder && updateFolder.mutate({ id: targetFolder, data: { name: folderName.trim() } })}
              disabled={!folderName.trim() || updateFolder.isPending}
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>폴더 삭제</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">이 폴더를 삭제하시겠습니까? 속한 프로젝트도 함께 처리될 수 있습니다.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>취소</Button>
            <Button 
              variant="destructive"
              onClick={() => targetFolder && deleteFolder.mutate({ id: targetFolder })}
              disabled={deleteFolder.isPending}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
