import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { templates, reports, Template, Report } from '../api/ApiClient';
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
import { Plus, AlertCircle, Loader2 } from 'lucide-react';

interface Section {
  title: string;
  prompt: string;
  headingLevel: number;
}

interface ReportData {
  title: string;
  templateId?: number;
  format: 'pdf' | 'doc' | 'docx';
  sections: Section[];
}

const GenerateReportPage = () => {
  const [step, setStep] = useState(1);
  const [reportData, setReportData] = useState<ReportData>({
    title: '',
    templateId: undefined,
    format: 'pdf',
    sections: [{ title: '', prompt: '', headingLevel: 1 }],
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: userTemplates = [] } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: templates.getAll,
  });

  const { data: selectedTemplate } = useQuery<Template | null>({
    queryKey: ['template', reportData.templateId],
    queryFn: async () => {
      if (!reportData.templateId) return null;
      return templates.getById(reportData.templateId);
    },
    enabled: !!reportData.templateId,
  });

  const generateMutation = useMutation<Report, Error, ReportData>({
    mutationFn: (data: ReportData) => reports.generate(data.templateId!, data),
    onSuccess: () => {
      toast({
        title: 'Report generated',
        description: 'Your report has been generated successfully',
      });
      navigate('/reports');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleTemplateSelect = (templateId: number | undefined) => {
    setReportData({
      ...reportData,
      templateId,
      sections: [], // Will be loaded from template if templateId is provided
    });
  };

  const handleAddSection = () => {
    setReportData({
      ...reportData,
      sections: [...reportData.sections, { title: '', prompt: '', headingLevel: 1 }],
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
    generateMutation.mutate(reportData);
  };

  React.useEffect(() => {
    if (selectedTemplate?.sections) {
      setReportData(prev => ({
        ...prev,
        sections: selectedTemplate.sections,
      }));
    }
  }, [selectedTemplate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Generate Report</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
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
                  !reportData.templateId ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleTemplateSelect(undefined)}
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
                    reportData.templateId === template.id ? 'ring-2 ring-primary' : ''
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
                {!reportData.templateId && (
                  <Button variant="outline" onClick={handleAddSection}>
                    <Plus className="h-4 w-4 mr-2" />Add Section
                  </Button>
                )}
              </div>

              {reportData.sections.map((section, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Section {index + 1}</h4>
                    {!reportData.templateId && reportData.sections.length > 1 && (
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
                      readOnly={!!reportData.templateId}
                    />
                    <textarea
                      className="w-full min-h-[100px] p-2 border rounded-md"
                      value={section.prompt}
                      onChange={(e) => handleSectionChange(index, 'prompt', e.target.value)}
                      placeholder="Enter content prompt"
                      required
                      readOnly={!!reportData.templateId}
                    />
                    {!reportData.templateId && (
                      <Select
                        value={section.headingLevel.toString()}
                        onValueChange={(value) => 
                          handleSectionChange(index, 'headingLevel', parseInt(value))}
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
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
                  {reportData.templateId 
                    ? selectedTemplate?.name || "Loading..." 
                    : "Custom Report"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Sections</h3>
                <p className="mt-1">{reportData.sections.length}</p>
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