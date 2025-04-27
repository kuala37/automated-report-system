import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { templates, Template } from '../api/ApiClient';
import { useToast } from '../utils/toast';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from '../components/ui';
import { Loader2 } from 'lucide-react';

const EditTemplatePage = () => {
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<Partial<Template>>({
    name: '',
    content: '',
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: template, isLoading } = useQuery<Template>({
    queryKey: ['templates', id],
    queryFn: () => templates.getById(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        content: template.content,
      });
    }
  }, [template]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Template>) => templates.update(Number(id), data),
    onSuccess: () => {
      toast({
        title: 'Template updated',
        description: 'The template has been updated successfully',
      });
      navigate('/templates');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Edit Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">
                Template Name
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="content">
                Content
              </label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={10}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => navigate('/templates')}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default EditTemplatePage;