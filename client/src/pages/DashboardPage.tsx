import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { templates, reports, Template, Report } from '../api/ApiClient';
import { Button, Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '../components/ui';
import { FileText, File, Plus, ChevronRight } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  
  const { data: userTemplates = [], isLoading: isLoadingTemplates } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: templates.getAll,
  });

  const { data: userReports = [], isLoading: isLoadingReports } = useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: reports.getAll,
  });

  return (
    <div className="space-y-6">
      {/* Rest of the component remains the same, but now template and report have proper types */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Button onClick={() => navigate('/generate')}>
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userReports.length}</div>
            <p className="text-xs text-muted-foreground">
              {userReports.length > 0 
                ? `Last created ${new Date(userReports[0].createdAt).toLocaleDateString()}`
                : "No reports created yet"}
            </p>
          </CardContent>
        </Card>

        {/* Similar changes for other cards */}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingReports ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : userReports.length > 0 ? (
              <div className="space-y-4">
                {userReports.slice(0, 5).map((report: Report) => (
                  <div key={report.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => window.open(report.filePath)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No reports created yet</p>
                <Button className="mt-2" variant="outline" onClick={() => navigate("/generate")}>
                  Create your first report
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTemplates ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : userTemplates.length > 0 ? (
              <div className="space-y-4">
                {userTemplates.slice(0, 5).map((template: Template) => (
                  <div key={template.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">{template.content}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => navigate(`/templates/${template.id}`)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No templates created yet</p>
                <Button className="mt-2" variant="outline" onClick={() => navigate("/templates/new")}>
                  Create your first template
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;