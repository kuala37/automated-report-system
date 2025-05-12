import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { templates, reports, Template, Report } from '../api/ApiClient';
import { formattingApi } from '../api/ApiClient';
import { useToast } from '../utils/toast';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui';
import { Plus, AlertCircle, Loader2, Settings } from 'lucide-react';

interface Section {
  title: string;
  prompt: string;
  heading_level: number;
}

interface ReportData {
  title: string;
  template_id?: number | null;
  format: 'pdf' | 'doc' | 'docx';
  sections: Section[];
  formatting_preset_id?: number | null;
}

const GenerateReportPage = () => {
  const [step, setStep] = useState(1);
  const [reportData, setReportData] = useState<ReportData>({
    title: '',
    template_id: undefined,
    format: 'pdf',
    sections: [{ title: '', prompt: '', heading_level: 1 }],
    formatting_preset_id: null
  });

  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  
  React.useEffect(() => {
    const savedStep = localStorage.getItem('reportGenerationStep');
    const savedReportData = localStorage.getItem('reportGenerationData');
    
    if (savedStep) {
      setStep(parseInt(savedStep));
    }
    
    if (savedReportData) {
      try {
        const parsedData = JSON.parse(savedReportData) as ReportData;
        setReportData(parsedData);
      } catch (error) {
        console.error('Ошибка при разборе сохраненных данных:', error);
      }
    }
  }, []);


// Сохранение состояния при изменении
  React.useEffect(() => {
    localStorage.setItem('reportGenerationStep', step.toString());
    localStorage.setItem('reportGenerationData', JSON.stringify(reportData));
  }, [step, reportData]);

  React.useEffect(() => {
  console.log("Location state:", location.state);
  
  // Получаем ID пресета форматирования и шаг возврата
  if (location.state) {
    if (location.state.formattingPresetId) {
      setReportData(prev => ({
        ...prev,
        formatting_preset_id: location.state.formattingPresetId
      }));
    }
    
    // Восстанавливаем шаг, если он был сохранен
    if (location.state.currentStep) {
      console.log("Восстанавливаем шаг:", location.state.currentStep);
      setStep(location.state.currentStep);
    }
    
    // Восстанавливаем все данные отчета, если они были сохранены
    if (location.state.returnData) {
      console.log("Восстанавливаем данные отчета");
      setReportData(location.state.returnData);
    }
  }
}, [location.state]);

  const { data: userTemplates = [] } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: templates.getAll,
  });

  const { data: selectedTemplate } = useQuery<Template | null>({
    queryKey: ['template', reportData.template_id],
    queryFn: async () => {
      if (!reportData.template_id) return null;
      return templates.getById(reportData.template_id);
    },
    enabled: !!reportData.template_id,
  });

  const generateMutation = useMutation({
    mutationFn: (data: ReportData) => reports.generate(data),
    onSuccess: (response) => {
      // Начинаем опрос статуса
      startPolling(response.id);
      toast({
        title: 'Report generation started',
        description: 'Your report is being generated...',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const startPolling = (reportId: number) => {
    const poll = async () => {
      try {
        const report = await reports.getById(reportId);
        
        if (report.status === 'completed') {
          toast({
            title: 'Success',
            description: 'Report generated successfully',
          });
          navigate('/reports');
        } else if (report.status === 'error') {
          toast({
            title: 'Error',
            description: 'Failed to generate report',
            variant: 'destructive',
          });
        } else {
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('Polling error:', error);
        toast({
          title: 'Error',
          description: 'Failed to check report status',
          variant: 'destructive',
        });
      }
    };

    poll();
  };

  const handleTemplateSelect = (templateId: number | null) => {
    setReportData({
      ...reportData,
      template_id: templateId,
      sections: [], 
    });
  };

  const handleAddSection = () => {
    setReportData({
      ...reportData,
      sections: [...reportData.sections, { title: '', prompt: '', heading_level: 1 }],
    });
  };

  const handleRemoveSection = (index: number) => {
    const newSections = [...reportData.sections];
    newSections.splice(index, 1);
    setReportData({ ...reportData, sections: newSections });
  };

  const handleSectionChange = (index: number, field: keyof Section, value: string | number) => {
    const newSections = [...reportData.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setReportData({ ...reportData, sections: newSections });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: ReportData = {
      title: reportData.title,
      format: reportData.format,
      template_id: reportData.template_id ?? null,
      sections: reportData.sections.map(section => ({
        title: section.title,
        prompt: section.prompt,
        heading_level: section.heading_level
      })),
      formatting_preset_id: reportData.formatting_preset_id
    };
      
    console.log('Submitting report data:', submitData);
    generateMutation.mutate(submitData);
  };

  React.useEffect(() => {
    if (selectedTemplate?.sections) {
      setReportData(prev => ({
        ...prev,
        sections: selectedTemplate.sections.map(section => ({
          title: section.title,
          prompt: section.prompt,
          heading_level: section.headingLevel
        })),
      }));
    }
  }, [selectedTemplate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Generate Report</h1>
      </div>      <div className="grid grid-cols-3 gap-4 mb-8">
        <div 
          className={`p-4 text-center rounded-lg border ${
            step === 1 ? 'bg-primary text-primary-foreground' : 'bg-background'
          }`}
        >
          1. Select Template
        </div>
        <div 
          className={`p-4 text-center rounded-lg border ${
            step === 2 ? 'bg-primary text-primary-foreground' : 'bg-background'
          }`}
        >
          2. Configure Sections
        </div>
        <div 
          className={`p-4 text-center rounded-lg border ${
            step === 3 ? 'bg-primary text-primary-foreground' : 'bg-background'
          }`}
        >
          3. Generate
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Template</CardTitle>
            <CardDescription>Choose a template or create a custom report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card 
                className={`cursor-pointer transition-all ${
                  !reportData.template_id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleTemplateSelect(null)}
              >
                <CardHeader>
                  <CardTitle>Custom Report</CardTitle>
                  <CardDescription>Create a report from scratch</CardDescription>
                </CardHeader>
              </Card>

              {userTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    reportData.template_id === template.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <CardHeader>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.content}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => navigate('/')}>Cancel</Button>
              <Button onClick={() => setStep(2)}>Next</Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Report</CardTitle>
            <CardDescription>Fill in the report details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Title</label>
              <Input
                value={reportData.title}
                onChange={(e) => setReportData({ ...reportData, title: e.target.value })}
                placeholder="Enter report title"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select
                value={reportData.format}
                onValueChange={(value: 'pdf' | 'doc' | 'docx') => 
                  setReportData({ ...reportData, format: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="doc">DOC</SelectItem>
                  <SelectItem value="docx">DOCX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Sections</h3>
                {!reportData.template_id && (
                  <Button variant="outline" onClick={handleAddSection}>
                    <Plus className="h-4 w-4 mr-2" />Add Section
                  </Button>
                )}
              </div>

              {reportData.sections.map((section, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Section {index + 1}</h4>
                    {!reportData.template_id && reportData.sections.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSection(index)}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Input
                      value={section.title}
                      onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                      placeholder="Section title"
                      required
                      readOnly={!!reportData.template_id}
                    />
                    <textarea
                      className="w-full min-h-[100px] p-2 border rounded-md"
                      value={section.prompt}
                      onChange={(e) => handleSectionChange(index, 'prompt', e.target.value)}
                      placeholder="Enter content prompt"
                      required
                      readOnly={!!reportData.template_id}
                    />
                    {!reportData.template_id && (
                      <Select
                        value={section.heading_level.toString()}
                        onValueChange={(value) => 
                          handleSectionChange(index, 'heading_level', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select heading level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Heading 1</SelectItem>
                          <SelectItem value="2">Heading 2</SelectItem>
                          <SelectItem value="3">Heading 3</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button 
                onClick={() => setStep(3)}
                disabled={!reportData.title || reportData.sections.length === 0}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>Review and generate your report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Report Title</h3>
                <p className="mt-1">{reportData.title}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Format</h3>
                <p className="mt-1">{reportData.format.toUpperCase()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Template</h3>
                <p className="mt-1">
                  {reportData.template_id 
                    ? selectedTemplate?.name || "Loading..." 
                    : "Custom Report"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Sections</h3>
                <p className="mt-1">{reportData.sections.length}</p>
              </div>
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">Formatting</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p>{reportData.formatting_preset_id ? "Custom formatting preset" : "Default formatting"}</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/document-style', {
                  state: { 
                    currentStep: step,
                    formattingPresetId: reportData.formatting_preset_id,
                    returnData: reportData  // Сохраняем все данные отчета
                  }
                })}>
                  <Settings className="h-4 w-4 mr-2" />
                  {reportData.formatting_preset_id ? "Изменить стиль" : "Выбрать стиль"}
                </Button>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Sections Overview</h3>
              <ul className="space-y-1">
                {reportData.sections.map((section, index) => (
                  <li key={index} className="text-sm">
                    {index + 1}. {section.title}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button 
                onClick={handleSubmit}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Report'
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default GenerateReportPage;