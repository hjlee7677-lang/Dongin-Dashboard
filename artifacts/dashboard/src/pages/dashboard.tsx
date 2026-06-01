import { useState } from "react";
import { Layout } from "@/components/layout";
import { FolderTree } from "@/components/folder-tree";
import { ProjectCard } from "@/components/project-card";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileStack, FolderOpen, MousePointerClick, TrendingUp } from "lucide-react";
import {
  useListProjects, useGetDashboardStats, useGetRecentProjects
} from "@workspace/api-client-react";

export default function Dashboard() {
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  const { data: stats } = useGetDashboardStats();
  const { data: projects, isLoading: projectsLoading } = useListProjects({ folderId: selectedFolderId });
  const { data: recentProjects } = useGetRecentProjects();

  return (
    <Layout>
      <FolderTree 
        selectedFolderId={selectedFolderId} 
        onSelectFolder={setSelectedFolderId} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-muted/10">
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Stats Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-sm border-border/50">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <FileStack className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">총 프로젝트</p>
                  <p className="text-2xl font-bold">{stats?.totalProjects || 0}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-border/50">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">총 폴더</p>
                  <p className="text-2xl font-bold">{stats?.totalFolders || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/50">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">최근 추가됨</p>
                  <p className="text-2xl font-bold">{stats?.recentCount || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator className="bg-border/60" />

          {/* Projects View */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold tracking-tight">
                {selectedFolderId === null ? "모든 프로젝트" : "선택된 폴더 프로젝트"}
                <span className="ml-2 text-sm text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-full">
                  {projects?.length || 0}
                </span>
              </h2>
            </div>

            {projectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 rounded-xl bg-card border animate-pulse" />
                ))}
              </div>
            ) : projects?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 bg-card rounded-xl border border-dashed border-border text-center px-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FolderOpen className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">프로젝트가 없습니다</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  현재 폴더에 속한 프로젝트가 없습니다. 좌측 상단의 새 프로젝트 버튼을 눌러 추가해보세요.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {projects?.map((project: any) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
          
          <Separator className="bg-border/60" />

          {/* Recent Projects */}
          {selectedFolderId === null && (
            <div>
              <div className="flex items-center mb-4 gap-2">
                <ClockIcon className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold tracking-tight">최근 추가된 항목</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 opacity-90 hover:opacity-100 transition-opacity">
                {recentProjects?.map((project: any) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function ClockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
