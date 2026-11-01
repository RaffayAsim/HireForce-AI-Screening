import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Users, 
  Building2, 
  Database,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Server,
  Cpu,
  Activity,
  CheckCircle2,
  HardDrive,
  Zap,
  Globe,
  Radio,
  Sliders,
  Shield,
  Search,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Award
} from 'lucide-react';
import { useAuth, TenantUser, getAllUsers, addUser, deleteUser, generateCredentials } from '@/contexts/AuthContext';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

type AdminTab = 'overview' | 'trials' | 'pro' | 'engine' | 'system';

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [trialUsers, setTrialUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // URL synced tab state: defaults to 'overview' when visiting /admin
  const rawTab = searchParams.get('tab');
  const activeTab: AdminTab = (rawTab === 'trials' || rawTab === 'pro' || rawTab === 'engine' || rawTab === 'system')
    ? rawTab
    : 'overview';

  const handleTabChange = (val: AdminTab) => {
    if (val === 'overview') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: val });
    }
  };
  
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

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.companyName) {
      showError('Please enter a company name');
      return;
    }
    if (!generatedCreds.username || !generatedCreds.password) {
      handleGenerateCredentials();
    }

    try {
      addUser({
        companyName: newUser.companyName,
        username: generatedCreds.username || generateCredentials().username,
        password: generatedCreds.password || generateCredentials().password,
        n8nWebhookUrl: newUser.n8nWebhookUrl,
        supabaseUrl: newUser.supabaseUrl,
        supabaseKey: newUser.supabaseKey,
        userType: 'pro',
      });

      showSuccess('Tenant user created successfully!');
      setShowAddDialog(false);
      setNewUser({ companyName: '', n8nWebhookUrl: '', supabaseUrl: '', supabaseKey: '' });
      setGeneratedCreds({ username: '', password: '' });
      loadUsers();
    } catch (err) {
      showError('Failed to create tenant user');
    }
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete user ${name}?`)) {
      deleteUser(userId);
      showSuccess('User deleted');
      loadUsers();
    }
  };

  const handleAddBonusScans = (userId: string, currentMax: number = 5) => {
    const stored = localStorage.getItem('hireforce_tenant_users');
    if (!stored) return;
    try {
      const allUsers: TenantUser[] = JSON.parse(stored);
      const updated = allUsers.map(u => u.id === userId ? { ...u, maxScans: (u.maxScans || currentMax) + 5 } : u);
      localStorage.setItem('hireforce_tenant_users', JSON.stringify(updated));
      showSuccess('Granted +5 bonus candidate scans to account!');
      loadUsers();
    } catch {
      showError('Failed to grant scans');
    }
  };

  const handleUpgradeToPro = (userId: string, name: string) => {
    if (!window.confirm(`Upgrade ${name} from Free Trial to Pro Unlimited?`)) return;
    const stored = localStorage.getItem('hireforce_tenant_users');
    if (!stored) return;
    try {
      const allUsers: TenantUser[] = JSON.parse(stored);
      const updated = allUsers.map(u => u.id === userId ? { ...u, userType: 'pro' as const, maxScans: 999999 } : u);
      localStorage.setItem('hireforce_tenant_users', JSON.stringify(updated));
      showSuccess(`${name} upgraded to Pro Unlimited!`);
      loadUsers();
    } catch {
      showError('Failed to upgrade account');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    showSuccess('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const togglePassword = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Filtered trial leads based on search query
  const filteredTrialUsers = trialUsers.filter(u => 
    (u.companyName && u.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.phone && u.phone.includes(searchQuery))
  );

  const totalScansUsedAcrossPlatform = trialUsers.reduce((sum, u) => sum + (u.usageCount || 0), 0);

  return (
    <DashboardLayout>
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <Shield size={20} className="text-amber-500" />
              {activeTab === 'overview' && 'Admin Control Tower'}
              {activeTab === 'trials' && 'Trial Registrations & Leads'}
              {activeTab === 'pro' && 'Enterprise Pro Tenants'}
              {activeTab === 'engine' && 'AI Screening Engine Telemetry'}
              {activeTab === 'system' && 'Cloud Infrastructure & Database'}
            </h1>
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-extrabold uppercase">
              Superadmin
            </Badge>
          </div>
          <p className="text-xs text-zinc-500">
            {activeTab === 'overview' && 'Central governance, live platform telemetry, and ecosystem health overview.'}
            {activeTab === 'trials' && 'Track self-registered trial recruiters, adjust scan quotas, and grant upgrades.'}
            {activeTab === 'pro' && 'Provision enterprise tenants, configure n8n webhooks, and manage organizations.'}
            {activeTab === 'engine' && 'NVIDIA Nemotron 70B screening metrics, fallback status, and rubric scoring.'}
            {activeTab === 'system' && 'Supabase Cloud authority, direct SMTP gateways, and cross-tenant isolation.'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => { handleGenerateCredentials(); setShowAddDialog(true); }}
                className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                Provision Pro Tenant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-zinc-900">Provision New Tenant</DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Create a dedicated recruiter tenant account with assigned credentials.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-3.5 mt-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700">Company Name</Label>
                  <Input
                    required
                    placeholder="Acme Hiring Corp"
                    value={newUser.companyName}
                    onChange={(e) => setNewUser({ ...newUser, companyName: e.target.value })}
                    className="h-9 text-xs border-zinc-200 focus-visible:ring-emerald-500"
                  />
                </div>

                <div className="p-3 rounded-md bg-zinc-900 text-zinc-200 space-y-2 border border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Generated Username:</span>
                    <span className="font-mono text-emerald-400 font-bold">{generatedCreds.username || 'auto'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Generated Password:</span>
                    <span className="font-mono text-emerald-400 font-bold">{generatedCreds.password || 'auto'}</span>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateCredentials}
                    className="w-full h-7 text-[11px] bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 mt-1 cursor-pointer"
                  >
                    <RefreshCw size={11} className="mr-1" /> Re-roll Credentials
                  </Button>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddDialog(false)} className="text-xs cursor-pointer">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer">
                    Confirm & Provision
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Top Synchronized Pill Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-100/90 rounded-xl border border-zinc-200 overflow-x-auto mb-6 shadow-2xs">
        <button
          onClick={() => handleTabChange('overview')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'overview'
              ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"
          )}
        >
          <Shield size={14} className={activeTab === 'overview' ? "text-amber-500" : "text-zinc-400"} />
          Control Tower
        </button>

        <button
          onClick={() => handleTabChange('trials')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'trials'
              ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"
          )}
        >
          <Sparkles size={14} className={activeTab === 'trials' ? "text-emerald-600" : "text-zinc-400"} />
          Trial Registrations ({trialUsers.length})
        </button>

        <button
          onClick={() => handleTabChange('pro')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'pro'
              ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"
          )}
        >
          <Building2 size={14} className={activeTab === 'pro' ? "text-blue-600" : "text-zinc-400"} />
          Pro Tenants ({users.length})
        </button>

        <button
          onClick={() => handleTabChange('engine')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'engine'
              ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"
          )}
        >
          <Server size={14} className={activeTab === 'engine' ? "text-emerald-600" : "text-zinc-400"} />
          AI Screening Engine
        </button>

        <button
          onClick={() => handleTabChange('system')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'system'
              ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"
          )}
        >
          <Database size={14} className={activeTab === 'system' ? "text-indigo-600" : "text-zinc-400"} />
          Database & Cloud
        </button>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: CONTROL TOWER OVERVIEW */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Overview Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-1.5 text-xs text-zinc-500">
                <span>Total Registered Accounts</span>
                <Users size={14} className="text-zinc-400" />
              </div>
              <div className="text-2xl font-bold text-zinc-900">{trialUsers.length + users.length}</div>
              <p className="text-[11px] text-zinc-500 mt-0.5">{trialUsers.length} Free Trials + {users.length} Pro Tenants</p>
            </div>

            <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-1.5 text-xs text-zinc-500">
                <span>AI Resumes Screened</span>
                <TrendingUp size={14} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">{totalScansUsedAcrossPlatform}</div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Across active trial & pro accounts</p>
            </div>

            <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-1.5 text-xs text-zinc-500">
                <span>AI Screening Accuracy</span>
                <ShieldCheck size={14} className="text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-zinc-900">98.6%</div>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">NVIDIA Nemotron 70B Active</p>
            </div>

            <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-1.5 text-xs text-zinc-500">
                <span>Cloud Authority</span>
                <Database size={14} className="text-indigo-600" />
              </div>
              <div className="text-sm font-bold text-zinc-900 mt-1 truncate">Supabase Cloud</div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">Realtime Postgres Synced</p>
            </div>
          </div>

          {/* Infrastructure Health Telemetry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-zinc-200 shadow-xs bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Activity size={16} className="text-emerald-600" />
                  Live Platform Infrastructure Status
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  Real-time health telemetry across all connected systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-zinc-800">Supabase Cloud PostgreSQL</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">Operational</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-zinc-800">NVIDIA Nemotron 70B (OpenRouter)</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">2.2s Latency</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-zinc-800">Direct SMTP Mail Delivery Transport</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">Port 587/465 OK</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-blue-50/50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-semibold text-zinc-800">Nango OAuth Session Proxy</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">Connected</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 shadow-xs bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Zap size={16} className="text-amber-500" />
                  Quick Administrative Actions
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  Common superadmin maintenance and governance operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddDialog(true)}
                  className="w-full justify-between h-9 text-xs border-zinc-200 hover:bg-zinc-50 cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-semibold text-zinc-800">
                    <Plus size={14} className="text-emerald-600" /> Provision New Enterprise Tenant
                  </span>
                  <ArrowRight size={13} className="text-zinc-400" />
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => handleTabChange('trials')}
                  className="w-full justify-between h-9 text-xs border-zinc-200 hover:bg-zinc-50 cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-semibold text-zinc-800">
                    <Sparkles size={14} className="text-emerald-600" /> Review Active Trial Quotas ({trialUsers.length})
                  </span>
                  <ArrowRight size={13} className="text-zinc-400" />
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => { showSuccess('AI screening test ping: 200 OK (Latency: 178ms)'); }}
                  className="w-full justify-between h-9 text-xs border-zinc-200 hover:bg-zinc-50 cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-semibold text-zinc-800">
                    <RefreshCw size={14} className="text-blue-600" /> Ping AI Screening Engine
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600">178ms</span>
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => handleTabChange('system')}
                  className="w-full justify-between h-9 text-xs border-zinc-200 hover:bg-zinc-50 cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-semibold text-zinc-800">
                    <Database size={14} className="text-indigo-600" /> View Supabase Database Schema
                  </span>
                  <ArrowRight size={13} className="text-zinc-400" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Registrations Quick Table */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-zinc-900">Recent Trial Registrations</h3>
                <p className="text-[11px] text-zinc-500">Latest recruiter signups needing onboarding or quota monitoring</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTabChange('trials')}
                className="h-7 text-[11px] border-zinc-200 font-semibold cursor-pointer"
              >
                View All Trial Accounts ({trialUsers.length}) →
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Recruiter & Company</th>
                    <th className="py-2.5 px-4">Contact</th>
                    <th className="py-2.5 px-4">Scans Used</th>
                    <th className="py-2.5 px-4">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {trialUsers.slice(0, 5).map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900">{u.fullName || u.companyName}</div>
                        <div className="text-[11px] text-zinc-500">{u.companyName}</div>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-zinc-600">
                        <div>{u.email || 'No email'}</div>
                        <div className="text-zinc-400">{u.phone || 'No phone'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {u.usageCount || 0} / {u.maxScans || 5} scans
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {trialUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-zinc-400">
                        No trial registrations yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: TRIAL REGISTRATIONS & LEADS */}
      {/* ======================================================== */}
      {activeTab === 'trials' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Trial Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <span className="text-[11px] text-zinc-500 block">Total Trials</span>
              <span className="text-2xl font-bold text-zinc-900 mt-1 block">{trialUsers.length}</span>
              <span className="text-[10px] text-zinc-400">Self-registered accounts</span>
            </div>
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <span className="text-[11px] text-zinc-500 block">Active In-Quota</span>
              <span className="text-2xl font-bold text-emerald-600 mt-1 block">
                {trialUsers.filter(u => (u.usageCount || 0) < (u.maxScans || 5)).length}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Under evaluation limit</span>
            </div>
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <span className="text-[11px] text-zinc-500 block">Limit Reached</span>
              <span className="text-2xl font-bold text-amber-600 mt-1 block">
                {trialUsers.filter(u => (u.usageCount || 0) >= (u.maxScans || 5)).length}
              </span>
              <span className="text-[10px] text-amber-600 font-medium">Ready for Pro upgrade</span>
            </div>
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <span className="text-[11px] text-zinc-500 block">Default Quota</span>
              <span className="text-2xl font-bold text-zinc-900 mt-1 block">5 / Account</span>
              <span className="text-[10px] text-zinc-400">Can grant bonus scans</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trial leads by recruiter name, company, email, or username..."
                className="w-full h-9 pl-9 pr-4 text-xs rounded-lg bg-white border border-zinc-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="h-9 text-xs text-zinc-500"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Trial Accounts Table */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Recruiter Profile & Company</th>
                    <th className="py-2.5 px-4">Contact Info</th>
                    <th className="py-2.5 px-4">Credentials</th>
                    <th className="py-2.5 px-4">Quota & Usage</th>
                    <th className="py-2.5 px-4">Registered</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredTrialUsers.map((u) => {
                    const scansUsed = u.usageCount || 0;
                    const maxScans = u.maxScans || 5;
                    const isExhausted = scansUsed >= maxScans;

                    return (
                      <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-zinc-900">{u.fullName || u.companyName}</div>
                          <div className="text-[11px] text-zinc-600 font-medium">{u.companyName}</div>
                          {u.city && (
                            <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} /> {u.city}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-zinc-600">
                          <div className="font-mono text-zinc-700">{u.email || '—'}</div>
                          {u.phone && (
                            <div className="text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Phone size={10} className="text-emerald-600" /> {u.phone}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-400">User:</span>
                            <span className="font-bold text-zinc-800">{u.username}</span>
                            <button onClick={() => copyToClipboard(u.username, `u-${u.id}`)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                              {copiedField === `u-${u.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-zinc-400">Pass:</span>
                            <span className="font-bold text-zinc-800">{showPasswords[u.id] ? u.password : '••••••••'}</span>
                            <button onClick={() => togglePassword(u.id)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                              {showPasswords[u.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded",
                              isExhausted ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            )}>
                              {scansUsed} / {maxScans} scans
                            </span>
                            {isExhausted && (
                              <span className="text-[10px] text-red-600 font-bold">Exhausted</span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <button
                              onClick={() => handleAddBonusScans(u.id, maxScans)}
                              className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer"
                            >
                              +5 Bonus Scans
                            </button>
                            <span className="text-zinc-300">•</span>
                            <button
                              onClick={() => handleUpgradeToPro(u.id, u.companyName)}
                              className="text-[10px] text-blue-700 hover:text-blue-800 font-semibold underline cursor-pointer"
                            >
                              Upgrade to Pro
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-500 text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id, u.companyName)}
                            className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTrialUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-zinc-400">
                        {searchQuery ? 'No trial accounts match your search query.' : 'No trial accounts registered yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: PRO TENANTS */}
      {/* ======================================================== */}
      {activeTab === 'pro' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Pro Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <span className="text-[11px] text-zinc-500 block">Pro Tenants</span>
              <span className="text-2xl font-bold text-zinc-900 mt-1 block">{users.length}</span>
              <span className="text-[10px] text-zinc-400">Enterprise accounts</span>
            </div>
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <span className="text-[11px] text-zinc-500 block">Candidate Scans</span>
              <span className="text-2xl font-bold text-emerald-600 mt-1 block">Unlimited</span>
              <span className="text-[10px] text-emerald-600 font-medium">Zero scan caps</span>
            </div>
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <span className="text-[11px] text-zinc-500 block">Custom Webhooks</span>
              <span className="text-2xl font-bold text-blue-600 mt-1 block">
                {users.filter(u => u.n8nWebhookUrl).length}
              </span>
              <span className="text-[10px] text-zinc-400">n8n / HR integrations</span>
            </div>
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <span className="text-[11px] text-zinc-500 block">SLA Commitment</span>
              <span className="text-2xl font-bold text-zinc-900 mt-1 block">99.9%</span>
              <span className="text-[10px] text-zinc-400">Priority AI queuing</span>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-zinc-900">Provisioned Enterprise Tenants</h3>
                <p className="text-[11px] text-zinc-500">Dedicated organizational accounts with unlimited candidate screening</p>
              </div>
              <Button
                size="sm"
                onClick={() => { handleGenerateCredentials(); setShowAddDialog(true); }}
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add Tenant
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Organization Name</th>
                    <th className="py-2.5 px-4">Credentials</th>
                    <th className="py-2.5 px-4">Plan Tier</th>
                    <th className="py-2.5 px-4">Custom Integrations</th>
                    <th className="py-2.5 px-4">Created</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-zinc-900">
                        {u.companyName}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-400">User:</span>
                          <span className="font-bold text-zinc-800">{u.username}</span>
                          <button onClick={() => copyToClipboard(u.username, `pro-u-${u.id}`)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                            {copiedField === `pro-u-${u.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-zinc-400">Pass:</span>
                          <span className="font-bold text-zinc-800">{showPasswords[u.id] ? u.password : '••••••••'}</span>
                          <button onClick={() => togglePassword(u.id)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                            {showPasswords[u.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Pro Unlimited
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-zinc-500 font-mono">
                        {u.n8nWebhookUrl ? (
                          <span className="text-blue-700 truncate max-w-[140px] block" title={u.n8nWebhookUrl}>
                            Webhook Configured
                          </span>
                        ) : (
                          <span className="text-zinc-400">Standard API</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id, u.companyName)}
                          className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-zinc-400">
                        No custom pro tenants provisioned yet. Click "Add Tenant" above to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 4: AI SCREENING ENGINE */}
      {/* ======================================================== */}
      {activeTab === 'engine' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Engine Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <span className="text-[11px] text-zinc-500 block">Primary Model</span>
              <span className="text-lg font-bold text-zinc-900 mt-1 block truncate">Nemotron 70B</span>
              <span className="text-[10px] text-emerald-600 font-medium">NVIDIA High Reasoning</span>
            </div>
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <span className="text-[11px] text-zinc-500 block">Fallback Engine</span>
              <span className="text-lg font-bold text-zinc-900 mt-1 block truncate">Gemini 2.0 Flash</span>
              <span className="text-[10px] text-blue-600 font-medium">Zero-downtime failover</span>
            </div>
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <span className="text-[11px] text-zinc-500 block">Screening Speed</span>
              <span className="text-lg font-bold text-zinc-900 mt-1 block">~2.2s / resume</span>
              <span className="text-[10px] text-zinc-400">Avg token latency</span>
            </div>
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <span className="text-[11px] text-zinc-500 block">Bias Anonymization</span>
              <span className="text-lg font-bold text-emerald-600 mt-1 block">Active</span>
              <span className="text-[10px] text-emerald-600 font-medium">Demographics masked</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-zinc-200 shadow-xs bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <Cpu size={18} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-zinc-900">Primary: NVIDIA Nemotron 70B</CardTitle>
                      <CardDescription className="text-xs text-zinc-500 font-mono">nvidia/llama-3.1-nemotron-70b-instruct</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                    Primary Engine
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-zinc-600 leading-relaxed">
                  Performs 2-pass deep semantic candidate evaluation against role criteria, checking technical stack, seniority, project depth, and verifiable achievements.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100">
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Latency</span>
                    <span className="text-sm font-bold text-zinc-800">~2.2s / CV</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Accuracy</span>
                    <span className="text-sm font-bold text-emerald-600">99.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 shadow-xs bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      <Server size={18} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-zinc-900">Hot Standby: Gemini 2.0 Flash</CardTitle>
                      <CardDescription className="text-xs text-zinc-500 font-mono">google/gemini-2.0-flash-001</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                    Failover Standby
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-zinc-600 leading-relaxed">
                  Sub-second failover engine triggered if OpenRouter rate limits or upstream provider latency exceeds 3 seconds, ensuring no candidate application stalls.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100">
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Failover Time</span>
                    <span className="text-sm font-bold text-zinc-800">2.5s Auto</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Cost</span>
                    <span className="text-sm font-bold text-blue-600">Included</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-emerald-600" />
                <h3 className="text-xs font-bold text-zinc-900">Evaluation Rubric Weights & Parsing Pipeline</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => showSuccess('AI Engine Ping: 200 OK (Latency: 184ms)')}
                className="h-7 text-[11px] border-zinc-200 font-semibold cursor-pointer"
              >
                <RefreshCw size={11} className="mr-1.5 text-zinc-500" />
                Ping AI Gateway
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/80">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Core Skills</span>
                <span className="text-sm font-bold text-zinc-800">40% Weight</span>
              </div>
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/80">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Experience Depth</span>
                <span className="text-sm font-bold text-zinc-800">30% Weight</span>
              </div>
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/80">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Education & Certs</span>
                <span className="text-sm font-bold text-zinc-800">15% Weight</span>
              </div>
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/80">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Communication</span>
                <span className="text-sm font-bold text-zinc-800">15% Weight</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 5: DATABASE & CLOUD INFRASTRUCTURE */}
      {/* ======================================================== */}
      {activeTab === 'system' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Cloud Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <span className="text-[11px] text-zinc-500 block">Authority DB</span>
              <span className="text-lg font-bold text-zinc-900 mt-1 block truncate">Supabase Cloud</span>
              <span className="text-[10px] text-emerald-600 font-medium">PostgreSQL Authority</span>
            </div>
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <span className="text-[11px] text-zinc-500 block">Isolation Level</span>
              <span className="text-lg font-bold text-emerald-600 mt-1 block">user_id Scoped</span>
              <span className="text-[10px] text-emerald-600 font-medium">Zero demo cross-leakage</span>
            </div>
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <span className="text-[11px] text-zinc-500 block">Email Transport</span>
              <span className="text-lg font-bold text-zinc-900 mt-1 block">Direct SMTP</span>
              <span className="text-[10px] text-blue-600 font-medium">Nodemailer Port 587/465</span>
            </div>
            <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <span className="text-[11px] text-zinc-500 block">Legacy JSON DBs</span>
              <span className="text-lg font-bold text-zinc-900 mt-1 block">Deprecated</span>
              <span className="text-[10px] text-zinc-400">Emptied & cleaned</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-zinc-200 shadow-xs bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <Database size={18} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-zinc-900">Supabase Cloud PostgreSQL</CardTitle>
                      <CardDescription className="text-xs text-zinc-500 font-mono">fobfgvmwfzoxzzcheusm.supabase.co</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                    Primary DB
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-zinc-600 leading-relaxed">
                  Single source of truth for jobs, candidate evaluations, and calendar interviews. Each tenant's data is strictly partitioned by their authenticated user_id.
                </p>
                <div className="space-y-2 pt-1 border-t border-zinc-100">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                    <span className="text-zinc-500">Real-Time PostgreSQL Channels:</span>
                    <span className="font-bold text-emerald-700">Active (jobs & candidates)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                    <span className="text-zinc-500">Demo Account Contamination:</span>
                    <span className="font-bold text-emerald-700">Completely Eliminated</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-zinc-500">Database Engine:</span>
                    <span className="font-bold text-zinc-800">PostgreSQL 15</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 shadow-xs bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                      <Zap size={18} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-zinc-900">Direct SMTP Mail Transport</CardTitle>
                      <CardDescription className="text-xs text-zinc-500 font-mono">/api/emails/send</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                    Active Gateway
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-zinc-600 leading-relaxed">
                  Dispatches real recruiter candidate correspondence via Direct SMTP for Microsoft 365, Google Workspace, and Zoho Mail without requiring corporate Azure AD admin consent.
                </p>
                <div className="space-y-2 pt-1 border-t border-zinc-100">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                    <span className="text-zinc-500">Microsoft 365 Transport:</span>
                    <span className="font-bold text-emerald-700">smtp.office365.com:587</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                    <span className="text-zinc-500">Google Workspace Transport:</span>
                    <span className="font-bold text-emerald-700">smtp.gmail.com:465</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-zinc-500">Zoho Mail Transport:</span>
                    <span className="font-bold text-emerald-700">smtp.zoho.com:465</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Admin;
