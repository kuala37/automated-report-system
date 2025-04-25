import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { auth } from '../api/ApiClient';
import { useToast } from '../utils/toast';
import { Button, Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription, Input } from '../components/ui';
import { Loader2 } from 'lucide-react';

interface LoginCredentials {
  username: string;
  password: string;
}

const LoginPage = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: (creds: LoginCredentials) => 
        auth.login({ username: creds.username, password: creds.password }),
    onSuccess: (data) => {
        toast({
            title: "Login successful",
            description: "Welcome back!"
        });
        navigate('/');
    },
    onError: (error: any) => {
        const message = error.message || "Invalid credentials";
        toast({
            title: "Login failed",
            description: message,
            variant: "destructive"
        });
    }
});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(credentials);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="username">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => navigate('/register')}>
              Register
            </Button>
            <Button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;