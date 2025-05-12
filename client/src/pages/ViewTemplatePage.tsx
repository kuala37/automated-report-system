import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { templates, Template } from '../api/ApiClient';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui';
import { Edit } from 'lucide-react';

const ViewTemplatePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: template, isLoading } = useQuery<Template>({
    queryKey: ['templates', id],
    queryFn: () => templates.getById(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-8">
        <h2 className="text-lg font-semibold">Template not found</h2>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={() => navigate('/templates')}
        >
          Back to Templates
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{template.name}</CardTitle>
          <CardDescription>
            Created on {new Date(template.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Template Content</h3>
            <div className="p-4 rounded-lg border bg-muted/50 whitespace-pre-wrap">
              {template.content}
            </div>
          </div>
          {template.sections && template.sections.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Sections</h3>
              <div className="space-y-4">
                {template.sections.map((section, index) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">
                      {section.title || `Section ${index + 1}`}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Heading Level: {section.headingLevel}
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
            onClick={() => navigate('/templates')}
          >
            Back
          </Button>
          <Button 
            onClick={() => navigate(`/templates/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Template
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ViewTemplatePage;