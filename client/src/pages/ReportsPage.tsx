import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reports, Report } from '../api/ApiClient';
import { useToast } from '../utils/toast';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui';
import {
  Plus,
  FileText,
  Download,
  Trash2,
  Loader2,
} from 'lucide-react';

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 rounded-lg">
        <div className="flex flex-col space-y-2 text-center sm:text-left">
          <h2 className="text-lg font-semibold">Delete Report</h2>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this report? This action cannot be undone.
          </p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const ReportsPage = () => {
  const [reportToDelete, setReportToDelete] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userReports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: reports.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: reports.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: 'Report deleted',
        description: 'The report has been deleted successfully',
      });
      setReportToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <Button onClick={() => navigate('/generate')}>
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : userReports.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase border-b">
                  <tr>
                    <th scope="col" className="px-6 py-3">Title</th>
                    <th scope="col" className="px-6 py-3">Template</th>
                    <th scope="col" className="px-6 py-3">Format</th>
                    <th scope="col" className="px-6 py-3">Created</th>
                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userReports.map((report: Report) => (
                    <tr key={report.id} className="border-b">
                      <td className="px-6 py-4 font-medium">{report.title}</td>
                      <td className="px-6 py-4">
                        {report.templateId ? `Template #${report.templateId}` : 'Custom'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full border">
                          {report.format}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(report.filePath)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setReportToDelete(report.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No reports found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Generate your first report to get started
            </p>
            <Button onClick={() => navigate('/generate')}>
              <Plus className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      )}

      <DeleteDialog
        isOpen={!!reportToDelete}
        onClose={() => setReportToDelete(null)}
        onConfirm={() => reportToDelete && deleteMutation.mutate(reportToDelete)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};

export default ReportsPage;