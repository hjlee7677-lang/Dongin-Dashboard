import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  useGetProject, getGetProjectQueryKey,
  useCreateProject, useUpdateProject,
  useListFolders, getListProjectsQueryKey, getGetDashboardStatsQueryKey, getGetRecentProjectsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "프로젝트 이름을 입력해주세요."),
  description: z.string().optional(),
  url: z.string().url("올바른 URL을 입력해주세요."),
  creator: z.string().min(1, "생성자/담당자를 입력해주세요."),
  folderId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProjectForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEdit = !!params.id;
  const projectId = params.id ? parseInt(params.id) : undefined;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } = useGetProject(projectId as number, {
    query: {
      enabled: isEdit && !!projectId,
      queryKey: getGetProjectQueryKey(projectId as number)
    }
  });

  const { data: folders } = useListFolders();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      creator: "",
      folderId: "none",
    },
  });

  useEffect(() => {
    if (isEdit && project) {
      form.reset({
        title: project.title,
        description: project.description || "",
        url: project.url,
        creator: project.creator,
        folderId: project.folderId ? String(project.folderId) : "none",
      });
    }
  }, [isEdit, project, form]);

  const createMutation = useCreateProject({
    mutation: {
      onSuccess: () => {
        toast({ title: "프로젝트가 성공적으로 생성되었습니다." });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentProjectsQueryKey() });
        setLocation("/");
      }
    }
  });

  const updateMutation = useUpdateProject({
    mutation: {
      onSuccess: () => {
        toast({ title: "프로젝트가 성공적으로 수정되었습니다." });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId as number) });
        setLocation("/");
      }
    }
  });

  const onSubmit = (values: FormValues) => {
    const payload = {
      title: values.title,
      description: values.description,
      url: values.url,
      creator: values.creator,
      folderId: values.folderId === "none" ? null : parseInt(values.folderId as string),
    };

    if (isEdit && projectId) {
      updateMutation.mutate({ id: projectId, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  const flattenFolders = (nodes: any[], list: any[] = []) => {
    nodes.forEach(n => {
      list.push(n);
      if (n.children && n.children.length > 0) {
        flattenFolders(n.children, list);
      }
    });
    return list;
  };

  const flatFolders = folders ? flattenFolders(folders) : [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && projectLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center w-full h-full">로딩중...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto bg-muted/10 p-6 md:p-12 flex justify-center">
        <div className="w-full max-w-2xl">
          <Button 
            variant="ghost" 
            className="mb-6 -ml-4 text-muted-foreground"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            대시보드로 돌아가기
          </Button>

          <Card className="shadow-lg border-border/50">
            <CardHeader className="pb-6 border-b border-border/50 bg-card">
              <CardTitle className="text-2xl">{isEdit ? '프로젝트 수정' : '새 프로젝트 등록'}</CardTitle>
              <CardDescription>
                학교 업무나 수업에 활용하는 외부 툴, 웹사이트 등을 대시보드에 등록하여 쉽게 접근하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>프로젝트 이름</FormLabel>
                        <FormControl>
                          <Input placeholder="예: 구글 클래스룸 (2학년 1반)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>연결 URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." type="url" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="creator"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>담당자 / 등록자</FormLabel>
                          <FormControl>
                            <Input placeholder="예: 김동인 교사" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="folderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>분류 폴더</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="폴더를 선택하세요" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">분류 없음 (최상위)</SelectItem>
                              {flatFolders.map((f: any) => (
                                <SelectItem key={f.id} value={String(f.id)}>
                                  {f.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>간단한 설명 (선택)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="프로젝트나 툴에 대한 설명을 입력하세요." 
                            className="resize-none h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-4 pt-4 border-t border-border/50">
                    <Button type="button" variant="outline" onClick={() => setLocation("/")}>
                      취소
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? '저장 중...' : (isEdit ? '수정 내용 저장' : '프로젝트 등록')}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
