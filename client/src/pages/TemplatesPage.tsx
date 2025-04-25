import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templates, Template } from '../api/ApiClient';
import { useToast } from '../utils/toast';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui';
import { Plus, File, Edit, Trash2, Loader2 } from 'lucide-react';

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
          <h2 className="text-lg font-semibold">Delete Template</h2>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this template? This action cannot be undone.
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

const TemplatesPage = () => {
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userTemplates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: templates.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: templates.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: 'Template deleted',
        description: 'The template has been deleted successfully',
      });
      setTemplateToDelete(null);
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
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        <Button onClick={() => navigate('/templates/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : userTemplates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userTemplates.map((template: Template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>{template.content}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created on {new Date(template.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => navigate(`/templates/${template.id}`)}>
                  View
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(`/templates/${template.id}/edit`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setTemplateToDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <File className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first template to get started with report generation
            </p>
            <Button onClick={() => navigate('/templates/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      <DeleteDialog
        isOpen={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={() => templateToDelete && deleteMutation.mutate(templateToDelete)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};

export default TemplatesPage;