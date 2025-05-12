import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reports, Report } from '../api/ApiClient';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui';
import { Download } from 'lucide-react';

const ViewReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: report, isLoading } = useQuery<Report>({
    queryKey: ['reports', id],
    queryFn: () => reports.getById(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-8">
        <h2 className="text-lg font-semibold">Report not found</h2>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={() => navigate('/reports')}
        >
          Back to Reports
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{report.title}</CardTitle>
          <CardDescription>
            Created on {new Date(report.created_at).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Report Details</h3>
            <p className="text-sm">Format: {report.format.toUpperCase()}</p>
            <p className="text-sm">Status: {report.status}</p>
          </div>
          {report.sections && report.sections.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Sections</h3>
              <div className="space-y-4">
                {report.sections.map((section, index) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">
                      {section.title || `Section ${index + 1}`}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Heading Level: {section.heading_level}
                    </p>
                    <p className="text-sm">{section.prompt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/reports')}
          >
            Back
          </Button>
          {report.file_path && (
            <Button 
                onClick={() => {
                    reports.download(report.id, report.file_path.split('/').pop() || 'report')
                    }
                }
                disabled={report.status !== 'completed'}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ViewReportPage;