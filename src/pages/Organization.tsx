"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  TrendingUp, 
  Target, 
  Award, 
  Calendar,
  MapPin,
  Globe,
  Building,
  Zap,
  Star,
  ArrowUpRight,
  Briefcase,
  Clock,
  CheckCircle,
  Eye,
  Lock,
  ExternalLink
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, trend, color, description }: any) => (
  <Card className="glass-card rounded-[2.5rem] overflow-hidden group hover:translate-y-[-4px] transition-all duration-500">
    <CardContent className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-[1.5rem] ${color} bg-opacity-10 ring-1 ring-inset ${color.replace('bg-', 'ring-')}/20`}>
          <Icon className={color.replace('bg-', 'text-')} size={24} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">
            <ArrowUpRight size={14} />
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">{title}</p>
        <h3 className="text-4xl font-black text-[#0F172A] mt-2 tracking-tight">{value}</h3>
        {description && <p className="text-xs text-slate-400 mt-2">{description}</p>}
      </div>
    </CardContent>
  </Card>
);

const TeamMember = ({ name, role, avatar, status }: any) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 border border-white/20 hover:bg-white/70 transition-all">
    <Avatar className="h-12 w-12 border-2 border-white shadow-md">
      <AvatarImage src={avatar} />
      <AvatarFallback>{name[0]}</AvatarFallback>
    </Avatar>
    <div className="flex-1">
      <h4 className="font-bold text-[#0F172A]">{name}</h4>
      <p className="text-sm text-slate-600">{role}</p>
    </div>
    <div className={`w-3 h-3 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
  </div>
);

const Organization = () => {
  const { userRole, setUserRole, isAdmin, isViewer } = useRole();
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);

  const teamMembers = [
    { name: "Sarah Johnson", role: "Head of People", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah", status: "active" },
    { name: "Mike Chen", role: "Engineering Manager", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike", status: "active" },
    { name: "Emily Rodriguez", role: "Product Lead", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily", status: "active" },
    { name: "David Kim", role: "Design Director", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david", status: "active" },
    { name: "Lisa Wang", role: "Data Scientist", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa", status: "active" },
    { name: "Alex Thompson", role: "Marketing Manager", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex", status: "active" }
  ];

  const recentActivities = [
    { action: "New hire onboarding", person: "Alex Rivera", time: "2 hours ago", type: "success" },
    { action: "Performance review completed", person: "Sarah Chen", time: "4 hours ago", type: "info" },
    { action: "Team expansion approved", person: "Mike Chen", time: "1 day ago", type: "success" },
    { action: "Training program launched", person: "Emily Rodriguez", time: "2 days ago", type: "info" }
  ];

  return (
    <DashboardLayout>
      <div className="mb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-purple-500/20 ring-1 ring-white/20">
              <Building className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Organization Overview</h1>
              <p className="text-slate-500 mt-2 text-lg font-medium">Team insights, company metrics, and organizational health.</p>
            </div>
          </div>
          
          {/* Role Toggle */}
          <Card className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Eye className={`${isViewer ? 'text-blue-600' : 'text-slate-400'}`} size={20} />
                <span className={`font-bold ${isViewer ? 'text-blue-600' : 'text-slate-500'}`}>Viewer</span>
              </div>
              <Switch 
                checked={isAdmin}
                onCheckedChange={(checked) => setUserRole(checked ? 'admin' : 'viewer')}
              />
              <div className="flex items-center gap-2">
                <Lock className={`${isAdmin ? 'text-emerald-600' : 'text-slate-400'}`} size={20} />
                <span className={`font-bold ${isAdmin ? 'text-emerald-600' : 'text-slate-500'}`}>Admin</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Role Indicator Banner */}
      <Card className={`mb-8 rounded-2xl ${isViewer ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isViewer ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
              {isViewer ? <Eye className="text-amber-600" size={24} /> : <Lock className="text-emerald-600" size={24} />}
            </div>
            <div>
              <h3 className={`font-bold ${isViewer ? 'text-amber-800' : 'text-emerald-800'}`}>
                Currently in {isViewer ? 'Viewer' : 'Admin'} Mode
              </h3>
              <p className={`text-sm ${isViewer ? 'text-amber-600' : 'text-emerald-600'}`}>
                {isViewer 
                  ? 'Read-only access. Cannot modify candidates or create jobs.' 
                  : 'Full access to all features and actions.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <StatCard 
          title="Total Employees" 
          value="247" 
          icon={Users} 
          trend="+12 this month"
          color="bg-blue-600"
          description="Growing team across all departments"
        />
        <StatCard 
          title="Open Positions" 
          value="18" 
          icon={Target} 
          color="bg-emerald-600"
          description="Active recruitment campaigns"
        />
        <StatCard 
          title="Employee Satisfaction" 
          value="4.7/5" 
          icon={Star} 
          trend="+0.2 this quarter"
          color="bg-amber-600"
          description="Based on quarterly surveys"
        />
        <StatCard 
          title="Retention Rate" 
          value="94.2%" 
          icon={Award} 
          trend="+2.1% vs last year"
          color="bg-purple-600"
          description="12-month rolling average"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card rounded-[3rem] p-10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A]">Team Directory</h2>
              <p className="text-slate-500 text-sm mt-1">Key team members and their roles</p>
            </div>
            {isAdmin && (
              <Button variant="outline" className="rounded-2xl">
                View All Teams
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map((member, i) => (
              <TeamMember key={i} {...member} />
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <Card className="glass-card rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-3">
                <Clock className="text-blue-600" size={20} />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              {recentActivities.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{activity.action}</p>
                    <p className="text-xs text-slate-500">{activity.person} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Careers Page Preview */}
          <Card className="glass-card rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-3">
                <Globe className="text-purple-600" size={20} />
                Careers Page Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <p className="text-sm text-slate-500 mb-4">
                Preview how your public job board appears to candidates.
              </p>
              <div className="bg-slate-100 rounded-2xl p-4 mb-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Zap className="text-white" size={16} />
                    </div>
                    <span className="font-bold text-sm">HireFlow Careers</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
              <Button 
                className="w-full rounded-xl font-bold gap-2"
                onClick={() => navigate('/jobs')}
              >
                <ExternalLink size={16} />
                View Public Careers Page
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#0F172A] rounded-[2.5rem] overflow-hidden text-white">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-3">
                <Zap className="text-blue-400" size={20} />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              {isAdmin ? (
                <>
                  <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold text-sm">
                    <Users className="mr-2" size={16} />
                    Add New Team Member
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-2xl font-bold text-sm border-white/20 text-white hover:bg-white/10"
                    onClick={() => navigate('/jobs')}
                  >
                    <Target className="mr-2" size={16} />
                    Create Job Opening
                  </Button>
                  <Button variant="outline" className="w-full h-12 rounded-2xl font-bold text-sm border-white/20 text-white hover:bg-white/10">
                    <Calendar className="mr-2" size={16} />
                    Schedule Team Review
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <Eye className="text-slate-400 mx-auto mb-2" size={32} />
                  <p className="text-slate-400 text-sm">Viewer mode - Actions disabled</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-12">
        <Card className="glass-card rounded-[3rem] overflow-hidden">
          <CardHeader className="p-10 pb-6">
            <CardTitle className="text-2xl font-bold text-[#0F172A]">Department Breakdown</CardTitle>
            <p className="text-slate-500 text-sm mt-2">Current team distribution across departments</p>
          </CardHeader>
          <CardContent className="p-10 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { dept: "Engineering", count: 89, growth: "+8 this quarter", color: "bg-blue-500" },
                { dept: "Product", count: 34, growth: "+3 this quarter", color: "bg-emerald-500" },
                { dept: "Design", count: 28, growth: "+2 this quarter", color: "bg-purple-500" },
                { dept: "Marketing", count: 22, growth: "+1 this quarter", color: "bg-amber-500" },
                { dept: "Sales", count: 31, growth: "+4 this quarter", color: "bg-indigo-500" },
                { dept: "Operations", count: 18, growth: "Stable", color: "bg-slate-500" },
                { dept: "Finance", count: 12, growth: "Stable", color: "bg-emerald-600" },
                { dept: "HR", count: 13, growth: "+2 this quarter", color: "bg-pink-500" }
              ].map((dept, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/50 border border-white/20 hover:bg-white/70 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-4 h-4 rounded-full ${dept.color}`}></div>
                    <h3 className="font-bold text-[#0F172A]">{dept.dept}</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-black text-[#0F172A]">{dept.count}</p>
                    <p className="text-xs text-slate-500 font-medium">{dept.growth}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Organization;