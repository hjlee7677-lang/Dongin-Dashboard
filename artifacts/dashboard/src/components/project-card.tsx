import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ExternalLink, Pencil, Trash2, User, Folder as FolderIcon, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteProject, getListProjectsQueryKey, getGetDashboardStatsQueryKey, getGetRecentProjectsQueryKey
} from "@workspace/api-client-react";

type ProjectCardProps = {
  project: any; // Project type from schema
  onClick?: () => void;
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteProject = useDeleteProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentProjectsQueryKey() });
        toast({ title: "프로젝트가 삭제되었습니다." });
      }
    }
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) {
      deleteProject.mutate({ id: project.id });
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(project.url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card 
      className="group flex flex-col hover:border-primary/50 hover:shadow-md transition-all cursor-pointer bg-card overflow-hidden"
      onClick={onClick}
    >
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
        <div className="flex justify-between items-start">
          <div className="space-y-1 pr-4">
            <CardTitle className="text-base line-clamp-1 leading-tight">{project.title}</CardTitle>
            {project.folderName && (
              <Badge variant="secondary" className="text-[10px] font-normal rounded-sm py-0 h-4 inline-flex items-center gap-1">
                <FolderIcon className="w-2.5 h-2.5" />
                {project.folderName}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 pb-2 flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">
          {project.description || "설명이 없습니다."}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2">
          <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[80px]">{project.creator}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 opacity-70" />
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 pb-4 gap-2">
        <Button 
          className="flex-1 shadow-none font-medium h-9" 
          onClick={handleOpen}
        >
          열기
          <ExternalLink className="w-3 h-3 ml-1.5 opacity-70" />
        </Button>
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
            asChild
          >
            <Link href={`/projects/${project.id}/edit`}>
              <Pencil className="w-4 h-4" />
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-destructive/5"
            onClick={handleDelete}
            disabled={deleteProject.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
