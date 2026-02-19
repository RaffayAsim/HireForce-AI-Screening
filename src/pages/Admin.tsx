"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  LogOut, 
  Users, 
  Building2, 
  Link2, 
  Database,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  Phone,
  Mail,
  User
} from 'lucide-react';
import { useAuth, TenantUser, getAllUsers, addUser, deleteUser, generateCredentials } from '@/contexts/AuthContext';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const Admin = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [trialUsers, setTrialUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('pro');
  
  // New user form state
  const [newUser, setNewUser] = useState({
    companyName: '',
    n8nWebhookUrl: '',
    supabaseUrl: '',
    supabaseKey: '',
  });
  const [generatedCreds, setGeneratedCreds] = useState({ username: '', password: '' });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }
    loadUsers();
  }, [isAdmin, navigate]);

  const loadUsers = () => {
    const allUsers = getAllUsers();
    const proUsers = allUsers.filter(u => !u.isAdmin && u.userType !== 'trial');
    const trials = allUsers.filter(u => u.userType === 'trial');
    setUsers(proUsers);
    setTrialUsers(trials);
    setLoading(false);
  };

  const handleGenerateCredentials = () => {
    const creds = generateCredentials();
    setGeneratedCreds(creds);
  };

  const handleAddUser = () => {
    if (!newUser.companyName || !generatedCreds.username) {
      showError('Please fill in company name and generate credentials');
      return;
    }

    const userToAdd: Omit<TenantUser, 'id' | 'createdAt'> = {
      companyName: newUser.companyName,
      username: generatedCreds.username,
      password: generatedCreds.password,
      n8nWebhookUrl: newUser.n8nWebhookUrl,
      supabaseUrl: newUser.supabaseUrl,
      supabaseKey: newUser.supabaseKey,
      isAdmin: false,
      userType: 'pro',
    };

    addUser(userToAdd);
    showSuccess(`User ${newUser.companyName} created successfully!`);
    setShowAddDialog(false);
    setNewUser({ companyName: '', n8nWebhookUrl: '', supabaseUrl: '', supabaseKey: '' });
    setGeneratedCreds({ username: '', password: '' });
    loadUsers();
  };

  const handleDeleteUser = (userId: string, companyName: string) => {
    if (confirm(`Are you sure you want to delete ${companyName}?`)) {
      deleteUser(userId);
      showSuccess('User deleted successfully');
      loadUsers();
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    showSuccess('Copied to clipboard!');
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-cyan-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded flex items-center justify-center">
              <Zap className="text-white fill-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">HireForce</h1>
              <p className="text-xs font-semibold text-gray-500 uppercase">Admin Control Tower</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge className="bg-cyan-100 text-cyan-900 border-cyan-200 px-3 py-1 text-xs font-semibold rounded-full">
              <Users className="w-3 h-3 mr-1.5" />
              {users.length + trialUsers.length} Users
            </Badge>
            <Button onClick={handleLogout} className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold text-sm gap-2 bg-white border">
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border border-gray-200 rounded-lg">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-100 rounded flex items-center justify-center">
                <Users className="text-cyan-600" size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Pro Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 rounded-lg">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded flex items-center justify-center">
                <Sparkles className="text-amber-600" size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Trial Users</p>
                <p className="text-2xl font-bold text-gray-900">{trialUsers.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 rounded-lg">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                <Building2 className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {[...users, ...trialUsers].filter(u => {
                    const created = new Date(u.createdAt);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 rounded-lg">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
                <Database className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Active DBs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.supabaseUrl).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Pro Users and Trial Leads */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white p-0 h-auto mb-6 gap-2 rounded-lg">
            <TabsTrigger 
              value="pro" 
              className="rounded-lg px-4 py-2 font-semibold data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-gray-700 transition-all"
            >
              Pro Users
            </TabsTrigger>
            <TabsTrigger 
              value="trials" 
              className="rounded-lg px-4 py-2 font-semibold data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-gray-700 transition-all"
            >
              Trial Leads
              {trialUsers.length > 0 && (
                <Badge className="ml-2 bg-cyan-100 text-cyan-700 rounded-full text-xs">
                  {trialUsers.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pro" className="mt-0">
            <Card className="border border-gray-200 rounded-lg overflow-hidden">
              <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between bg-white border-b border-gray-200">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">Pro User Management</CardTitle>
                  <CardDescription className="text-gray-600 text-sm mt-1">
                    Manage paid tenant accounts with custom integrations
                  </CardDescription>
                </div>
                
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold gap-2 h-9 px-4 text-sm">
                      <Plus size={16} />
                      Add Pro User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] rounded-lg border border-gray-200 shadow-lg bg-white p-0 overflow-hidden">
                    <div className="h-1 bg-cyan-500" />
                    <div className="p-6">
                      <DialogHeader className="mb-6">
                        <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
                            <Plus className="text-white" size={16} />
                          </div>
                          Add New Pro User
                        </DialogTitle>
                        <DialogDescription className="text-emerald-700/70">
                          Create a new tenant with isolated data. Credentials will be auto-generated.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-emerald-800/70 uppercase tracking-widest">
                            <Building2 className="inline w-4 h-4 mr-2" />
                            Company Name
                          </Label>
                          <Input 
                            placeholder="e.g. Acme Corp"
                            value={newUser.companyName}
                            onChange={(e) => setNewUser({...newUser, companyName: e.target.value})}
                            className="h-12 rounded-xl border-emerald-200 bg-white/70 focus-visible:ring-emerald-500/30"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-emerald-800/70 uppercase tracking-widest">
                            <Link2 className="inline w-4 h-4 mr-2" />
                            n8n Webhook URL
                          </Label>
                          <Input 
                            placeholder="https://your-n8n.com/webhook"
                            value={newUser.n8nWebhookUrl}
                            onChange={(e) => setNewUser({...newUser, n8nWebhookUrl: e.target.value})}
                            className="h-12 rounded-xl border-emerald-200 bg-white/70 focus-visible:ring-emerald-500/30"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-emerald-800/70 uppercase tracking-widest">
                            <Database className="inline w-4 h-4 mr-2" />
                            Supabase URL
                          </Label>
                          <Input 
                            placeholder="https://your-project.supabase.co"
                            value={newUser.supabaseUrl}
                            onChange={(e) => setNewUser({...newUser, supabaseUrl: e.target.value})}
                            className="h-12 rounded-xl border-emerald-200 bg-white/70 focus-visible:ring-emerald-500/30"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-emerald-800/70 uppercase tracking-widest">
                            <Database className="inline w-4 h-4 mr-2" />
                            Supabase Key
                          </Label>
                          <Input 
                            placeholder="your-supabase-anon-key"
                            value={newUser.supabaseKey}
                            onChange={(e) => setNewUser({...newUser, supabaseKey: e.target.value})}
                            className="h-12 rounded-xl border-emerald-200 bg-white/70 focus-visible:ring-emerald-500/30"
                          />
                        </div>

                        {/* Generated Credentials Section */}
                        <div className="p-6 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                          <div className="flex items-center justify-between mb-4">
                            <Label className="text-sm font-bold text-emerald-800 uppercase tracking-widest">
                              Auto-Generated Credentials
                            </Label>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={handleGenerateCredentials}
                              className="rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-100 gap-2"
                            >
                              <RefreshCw size={14} />
                              Generate
                            </Button>
                          </div>
                          
                          {generatedCreds.username ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100">
                                <div>
                                  <p className="text-xs font-bold text-emerald-800/50 uppercase">Username</p>
                                  <p className="font-mono text-sm font-bold text-emerald-800">{generatedCreds.username}</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => copyToClipboard(generatedCreds.username, 'username')}
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                >
                                  {copiedField === 'username' ? <Check size={16} /> : <Copy size={16} />}
                                </Button>
                              </div>
                              
                              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100">
                                <div>
                                  <p className="text-xs font-bold text-emerald-800/50 uppercase">Password</p>
                                  <p className="font-mono text-sm font-bold text-emerald-800">{generatedCreds.password}</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => copyToClipboard(generatedCreds.password, 'password')}
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                >
                                  {copiedField === 'password' ? <Check size={16} /> : <Copy size={16} />}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-emerald-700/50 text-center py-4">
                              Click "Generate" to create credentials
                            </p>
                          )}
                        </div>
                      </div>

                      <DialogFooter className="mt-8 gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowAddDialog(false)}
                          className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold h-12 px-6"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddUser}
                          disabled={!generatedCreds.username || !newUser.companyName}
                          className="vision-button text-white rounded-xl font-bold h-12 px-8 border-none shadow-lg shadow-emerald-500/30"
                        >
                          Create Pro User
                        </Button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-emerald-100 hover:bg-transparent">
                      <TableHead className="text-emerald-800/70 font-bold uppercase tracking-widest text-xs pl-8">Company</TableHead>
                      <TableHead className="text-emerald-800/70 font-bold uppercase tracking-widest text-xs">Credentials</TableHead>
                      <TableHead className="text-emerald-800/70 font-bold uppercase tracking-widest text-xs">n8n Webhook</TableHead>
                      <TableHead className="text-emerald-800/70 font-bold uppercase tracking-widest text-xs">Supabase</TableHead>
                      <TableHead className="text-emerald-800/70 font-bold uppercase tracking-widest text-xs">Created</TableHead>
                      <TableHead className="text-emerald-800/70 font-bold uppercase tracking-widest text-xs text-right pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-16">
                          <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                            <Users className="text-emerald-600" size={32} />
                          </div>
                          <p className="text-emerald-800/70 font-bold text-lg">No pro users yet</p>
                          <p className="text-emerald-700/50 text-sm mt-1">Add your first tenant to get started</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id} className="border-emerald-100/50 hover:bg-emerald-50/30">
                          <TableCell className="pl-8">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                {user.companyName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-[#0F2E1F]">{user.companyName}</p>
                                <p className="text-xs text-emerald-700/50 font-medium">ID: {user.id.slice(-6)}</p>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-800/50 uppercase w-16">User:</span>
                                <code className="text-xs font-mono bg-emerald-100/50 px-2 py-0.5 rounded text-emerald-800">
                                  {user.username}
                                </code>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => copyToClipboard(user.username, `user-${user.id}`)}
                                  className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                >
                                  {copiedField === `user-${user.id}` ? <Check size={12} /> : <Copy size={12} />}
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-800/50 uppercase w-16">Pass:</span>
                                <code className="text-xs font-mono bg-emerald-100/50 px-2 py-0.5 rounded text-emerald-800">
                                  {showPasswords[user.id] ? user.password : '••••••••'}
                                </code>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => togglePasswordVisibility(user.id)}
                                  className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                >
                                  {showPasswords[user.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => copyToClipboard(user.password, `pass-${user.id}`)}
                                  className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                >
                                  {copiedField === `pass-${user.id}` ? <Check size={12} /> : <Copy size={12} />}
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {user.n8nWebhookUrl ? (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                <span className="text-xs text-emerald-700 font-medium truncate max-w-[120px]">
                                  {user.n8nWebhookUrl.replace('https://', '').split('/')[0]}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-emerald-700/30 font-medium">Not configured</span>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {user.supabaseUrl ? (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                <span className="text-xs text-emerald-700 font-medium truncate max-w-[120px]">
                                  {user.supabaseUrl.replace('https://', '').split('.')[0]}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-emerald-700/30 font-medium">Not configured</span>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <span className="text-sm font-medium text-emerald-800/70">
                              {formatDate(user.createdAt)}
                            </span>
                          </TableCell>
                          
                          <TableCell className="text-right pr-8">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteUser(user.id, user.companyName)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl h-10 w-10 p-0"
                            >
                              <Trash2 size={18} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trials" className="mt-0">
            <Card className="glass-card rounded-[2.5rem] border-none overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <div>
                  <CardTitle className="text-2xl font-black text-[#0F2E1F] tracking-tight flex items-center gap-3">
                    <Sparkles className="text-amber-500" size={28} />
                    Trial Leads
                  </CardTitle>
                  <CardDescription className="text-emerald-700/70 mt-1">
                    Track trial users and their usage statistics
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-emerald-100 hover:bg-transparent">
                      <TableHead className="text-emerald-800/70 font-bold uppercase tracking-widest text-xs pl-8">Lead Info</TableHead>
                      <TableHead className="text-emerald-800/70 font-bold uppercase tracking-widest text-xs">Contact</TableHead>
                      <TableHead className="text-emerald-800/70 font-bold uppercase tracking-widest text-xs">Credentials</TableHead>
                      <TableHead className="text-emerald-800/70 font-bold uppercase tracking-widest text-xs">Usage</TableHead>
                      <TableHead className="text-emerald-800/70 font-bold uppercase tracking-widest text-xs">Status</TableHead>
                      <TableHead className="text-emerald-800/70 font-bold uppercase tracking-widest text-xs text-right pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-16">
                          <div className="w-20 h-20 bg-amber-100 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="text-amber-600" size={32} />
                          </div>
                          <p className="text-emerald-800/70 font-bold text-lg">No trial leads yet</p>
                          <p className="text-emerald-700/50 text-sm mt-1">Trial users will appear here when they sign up</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      trialUsers.map((trialUser) => {
                        const usageCount = trialUser.usageCount || 0;
                        const maxScans = trialUser.maxScans || 5;
                        const remaining = maxScans - usageCount;
                        const isExhausted = remaining === 0;
                        
                        return (
                          <TableRow key={trialUser.id} className="border-emerald-100/50 hover:bg-emerald-50/30">
                            <TableCell className="pl-8">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                  {trialUser.fullName?.charAt(0).toUpperCase() || trialUser.companyName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-[#0F2E1F]">{trialUser.fullName || 'Unknown'}</p>
                                  <p className="text-xs text-emerald-700/50 font-medium">{trialUser.companyName}</p>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Mail size={12} className="text-emerald-600" />
                                  <span className="text-xs text-emerald-800 font-medium">{trialUser.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone size={12} className="text-emerald-600" />
                                  <span className="text-xs text-emerald-800 font-medium">{trialUser.phone}</span>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-emerald-800/50 uppercase">User:</span>
                                  <code className="text-xs font-mono bg-amber-100/50 px-2 py-0.5 rounded text-amber-800">
                                    {trialUser.username}
                                  </code>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => copyToClipboard(trialUser.username, `trial-user-${trialUser.id}`)}
                                    className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                  >
                                    {copiedField === `trial-user-${trialUser.id}` ? <Check size={12} /> : <Copy size={12} />}
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-emerald-800/50 uppercase">Pass:</span>
                                  <code className="text-xs font-mono bg-amber-100/50 px-2 py-0.5 rounded text-amber-800">
                                    {showPasswords[trialUser.id] ? trialUser.password : '••••••••'}
                                  </code>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => togglePasswordVisibility(trialUser.id)}
                                    className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                  >
                                    {showPasswords[trialUser.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => copyToClipboard(trialUser.password, `trial-pass-${trialUser.id}`)}
                                    className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                  >
                                    {copiedField === `trial-pass-${trialUser.id}` ? <Check size={12} /> : <Copy size={12} />}
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-emerald-800/70">Scans:</span>
                                  <span className={cn(
                                    "text-xs font-bold",
                                    isExhausted ? "text-slate-500" : remaining <= 2 ? "text-amber-600" : "text-emerald-600"
                                  )}>
                                    {usageCount}/{maxScans}
                                  </span>
                                </div>
                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      isExhausted ? "bg-slate-300" : remaining <= 2 ? "bg-amber-500" : "bg-emerald-500"
                                    )}
                                    style={{ width: `${(usageCount / maxScans) * 100}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-emerald-800/70">Jobs:</span>
                                  <span className="text-xs font-bold text-emerald-600">
                                    {trialUser.jobCount || 0}/{trialUser.maxJobs || 1}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <Badge className={cn(
                                "rounded-full px-3 py-1 font-bold text-xs",
                                isExhausted 
                                  ? "bg-slate-100 text-slate-600 border-slate-200" 
                                  : "bg-amber-100 text-amber-700 border-amber-200"
                              )}>
                                {isExhausted ? 'Expired' : 'Active'}
                              </Badge>
                            </TableCell>
                            
                            <TableCell className="text-right pr-8">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteUser(trialUser.id, trialUser.companyName)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl h-10 w-10 p-0"
                              >
                                <Trash2 size={18} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;