"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Zap, 
  Loader2, 
  Mail, 
  Calendar, 
  Send, 
  CheckCircle2, 
  Clock, 
  Settings2, 
  Trash2, 
  ExternalLink, 
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { 
  getAutomationWorkflows, 
  updateAutomationWorkflow, 
  resetAutomationWorkflowsToDefault,
  getAutomationLogs, 
  clearAutomationLogs,
  triggerAutomation,
  interpolateTemplate,
  AutomationWorkflow, 
  AutomationLog,
  AutomationTrigger,
  checkAndDispatchInterviewReminders
} from '@/lib/automationService';
import { getConnectedAccount, isEmailConnected } from '@/lib/connectedAccountService';
import { useAuth } from '@/contexts/AuthContext';

const AutomationsPage = () => {
  const { user } = useAuth();
  const connectedAcc = getConnectedAccount(user?.id);
  const hasEmail = isEmailConnected(user?.id);

  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>(() => getAutomationWorkflows());
  const [logs, setLogs] = useState<AutomationLog[]>(() => getAutomationLogs());
  const [activeCategory, setActiveCategory] = useState<'all' | 'candidate_outreach' | 'interview_coordination' | 'internal_alerts'>('all');
  
  // Template editing state
  const [editingWorkflow, setEditingWorkflow] = useState<AutomationWorkflow | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [previewTab, setPreviewTab] = useState<'editor' | 'preview'>('editor');

  // Log preview modal state
  const [selectedLog, setSelectedLog] = useState<AutomationLog | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testModalWorkflow, setTestModalWorkflow] = useState<AutomationWorkflow | null>(null);
  const [testTargetEmail, setTestTargetEmail] = useState<string>(() => connectedAcc?.email || user?.email || '');
  const [isDispatchingTest, setIsDispatchingTest] = useState(false);

  const syncState = () => {
    setWorkflows(getAutomationWorkflows());
    setLogs(getAutomationLogs());
  };

  useEffect(() => {
    checkAndDispatchInterviewReminders();
    window.addEventListener('automations_updated', syncState);
    window.addEventListener('automation_logs_updated', syncState);
    return () => {
      window.removeEventListener('automations_updated', syncState);
      window.removeEventListener('automation_logs_updated', syncState);
    };
  }, []);

  const handleToggle = (id: string, currentState: boolean) => {
    updateAutomationWorkflow(id, { enabled: !currentState });
    showSuccess(`Automation ${!currentState ? 'enabled' : 'paused'}`);
  };

  const handleOpenEdit = (wf: AutomationWorkflow) => {
    setEditingWorkflow(wf);
    setEditSubject(wf.subjectTemplate);
    setEditBody(wf.bodyTemplate);
    setPreviewTab('editor');
  };

  const handleSaveTemplate = () => {
    if (!editingWorkflow) return;
    updateAutomationWorkflow(editingWorkflow.id, {
      subjectTemplate: editSubject,
      bodyTemplate: editBody,
    });
    setEditingWorkflow(null);
    showSuccess("Automation template updated successfully!");
  };

  const handleInsertVariable = (variableTag: string) => {
    setEditBody(prev => prev + ` {{${variableTag}}}`);
  };

  const handleOpenTestModal = (wf: AutomationWorkflow) => {
    setTestModalWorkflow(wf);
    setTestTargetEmail(connectedAcc?.email || user?.email || '');
  };

  const handleExecuteTestSend = async () => {
    if (!testModalWorkflow) return;
    setIsDispatchingTest(true);
    setTestingId(testModalWorkflow.id);

    try {
      const target = testTargetEmail.trim() || connectedAcc?.email || user?.email || 'test@example.com';
      const testContext = {
        candidate_name: 'Alex Mercer',
        candidate_email: target,
        job_title: 'Senior Frontend Engineer',
        company_name: 'HireForce',
        round_type: 'Technical System Design',
        meeting_format: 'Google Meet',
        meeting_link_or_address: 'https://meet.google.com/abc-defg-hij',
        interview_date_time: 'Tomorrow, 3:00 PM PKT',
        screening_score: 91,
      };

      const result = await triggerAutomation(testModalWorkflow.trigger, testContext);
      if (result && result.status === 'delivered') {
        showSuccess(`Live email delivered to ${target}! Check your inbox or spam folder.`);
        setTestModalWorkflow(null);
      } else if (result && result.status === 'sent') {
        showSuccess(`Email dispatched and logged in your candidate thread.`);
        setTestModalWorkflow(null);
      } else {
        showError(result?.metadata?.error || 'Failed to dispatch email. Please verify connection.');
      }
    } catch (e: any) {
      showError(e?.message || 'Failed to dispatch test email.');
    } finally {
      setIsDispatchingTest(false);
      setTestingId(null);
    }
  };

  const filteredWorkflows = workflows.filter(w => {
    if (activeCategory === 'all') return true;
    return w.category === activeCategory;
  });

  const activeCount = workflows.filter(w => w.enabled).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/90 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Zap size={16} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">Recruitment Automations</h1>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                {activeCount} of {workflows.length} Active
              </Badge>
            </div>
            <p className="text-xs text-zinc-500">
              Configure automatic candidate confirmations, live meeting link generation, rejection notices, and interview reminders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm("Reset all automation email templates to system defaults?")) {
                  resetAutomationWorkflowsToDefault();
                  showSuccess("All workflows reset to factory defaults.");
                }
              }}
              className="h-8 text-xs border-zinc-200 text-zinc-600 hover:text-zinc-900 cursor-pointer"
            >
              <RefreshCw size={12} className="mr-1.5" />
              Reset Defaults
            </Button>
          </div>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="bg-white border-zinc-200/90 shadow-2xs p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <Zap size={18} />
            </div>
            <div>
              <span className="text-[11px] font-medium text-zinc-400 block uppercase tracking-wider">Active Workflows</span>
              <span className="text-lg font-bold text-zinc-900">{activeCount} / {workflows.length} running</span>
            </div>
          </Card>

          <Card className="bg-white border-zinc-200/90 shadow-2xs p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
              <Send size={18} />
            </div>
            <div>
              <span className="text-[11px] font-medium text-zinc-400 block uppercase tracking-wider">Total Dispatched</span>
              <span className="text-lg font-bold text-zinc-900">{logs.length} automated messages</span>
            </div>
          </Card>

          <Card className="bg-white border-zinc-200/90 shadow-2xs p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-200 flex items-center justify-center shrink-0">
              <Mail size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-zinc-400 block uppercase tracking-wider">Sender Mailbox</span>
              <span className="text-xs font-bold text-zinc-900 truncate block">
                {connectedAcc?.email || 'recruiting@hireforce.ai'}
              </span>
            </div>
          </Card>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
              activeCategory === 'all' ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
            )}
          >
            All Workflows ({workflows.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('candidate_outreach')}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
              activeCategory === 'candidate_outreach' ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
            )}
          >
            Candidate Outreach
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('interview_coordination')}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
              activeCategory === 'interview_coordination' ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
            )}
          >
            Interview Coordination
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('internal_alerts')}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
              activeCategory === 'internal_alerts' ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
            )}
          >
            Internal Alerts
          </button>
        </div>

        {/* Workflow Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWorkflows.map((wf) => {
            const isTesting = testingId === wf.id;
            return (
              <Card 
                key={wf.id}
                className={cn(
                  "bg-white border rounded-xl shadow-2xs overflow-hidden transition-all flex flex-col justify-between",
                  wf.enabled ? "border-zinc-200/90" : "border-zinc-200/60 opacity-80 bg-zinc-50/40"
                )}
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", wf.badgeColor)}>
                          {wf.badgeLabel}
                        </span>
                        {wf.enabled ? (
                          <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-zinc-400">Paused</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900">{wf.title}</h3>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={wf.enabled}
                      onClick={() => handleToggle(wf.id, wf.enabled)}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                        wf.enabled ? "bg-emerald-600" : "bg-zinc-300"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                          wf.enabled ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {wf.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 text-[11px] text-zinc-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-zinc-800">
                      <Mail size={12} className="text-zinc-400 shrink-0" />
                      <span className="truncate">Subject: <strong>{wf.subjectTemplate}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(wf)}
                    className="h-8 text-xs font-semibold border-zinc-200 text-zinc-700 hover:bg-zinc-100 cursor-pointer gap-1.5"
                  >
                    <Settings2 size={13} />
                    Customize Template
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    disabled={isTesting || !wf.enabled}
                    onClick={() => handleOpenTestModal(wf)}
                    className="h-8 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer gap-1.5"
                    title={wf.enabled ? "Simulate and dispatch a test execution" : "Enable workflow first to test"}
                  >
                    {isTesting ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                    Test Run
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Execution History & Audit Log */}
        <div className="space-y-3 pt-4 border-t border-zinc-200/90">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Clock size={16} className="text-zinc-600" />
                Live Automation Activity Log
              </h2>
              <p className="text-xs text-zinc-500">Real-time audit history of every automated email and calendar link dispatched.</p>
            </div>
            {logs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.confirm("Clear all automation history logs?")) {
                    clearAutomationLogs();
                  }
                }}
                className="text-xs text-zinc-400 hover:text-red-600 h-8 gap-1 cursor-pointer"
              >
                <Trash2 size={12} />
                Clear Log
              </Button>
            )}
          </div>

          <Card className="bg-white border-zinc-200/90 shadow-2xs rounded-xl overflow-hidden">
            {logs.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                  <Clock size={18} />
                </div>
                <h3 className="text-xs font-semibold text-zinc-800">No Automation Events Yet</h3>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  Automated emails will log here as candidates apply, interviews are scheduled, or rejections are processed.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-100 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Time</th>
                      <th className="py-2.5 px-4">Workflow</th>
                      <th className="py-2.5 px-4">Recipient</th>
                      <th className="py-2.5 px-4">Channel / Meeting</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-zinc-900">
                          {log.workflow_title}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-zinc-800">{log.recipient_name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{log.recipient_email}</div>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                            {log.delivery_method}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                            <CheckCircle2 size={10} />
                            Delivered
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            className="h-7 px-2 text-xs text-zinc-600 hover:text-zinc-900 gap-1 cursor-pointer"
                          >
                            <Eye size={12} />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

      </div>

      {/* Template Customization Dialog */}
      <Dialog open={!!editingWorkflow} onOpenChange={(v) => !v && setEditingWorkflow(null)}>
        <DialogContent className="sm:max-w-xl bg-white border border-zinc-200 shadow-xl rounded-xl p-6 max-h-[90vh] overflow-y-auto">
          {editingWorkflow && (
            <div className="space-y-4">
              <DialogHeader className="text-left pb-2 border-b border-zinc-100">
                <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Settings2 size={16} className="text-emerald-600" />
                  Customize Email Template
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  {editingWorkflow.title} &bull; Click variables below to insert dynamic values.
                </DialogDescription>
              </DialogHeader>

              {/* Dynamic Variables Pill Bar */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Available Dynamic Variables</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    'candidate_name',
                    'job_title',
                    'company_name',
                    'meeting_format',
                    'meeting_link_or_address',
                    'interview_date_time',
                    'round_type',
                    'recruiter_name'
                  ].map((vTag) => (
                    <button
                      key={vTag}
                      type="button"
                      onClick={() => handleInsertVariable(vTag)}
                      className="text-[10px] font-mono bg-zinc-100 hover:bg-emerald-50 text-zinc-700 hover:text-emerald-800 border border-zinc-200 hover:border-emerald-200 px-2 py-0.5 rounded transition-all cursor-pointer"
                    >
                      + {`{{${vTag}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Input */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700">Email Subject Line</Label>
                <Input 
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="h-9 text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500 font-medium"
                />
              </div>

              {/* Body Textarea */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-zinc-700">Email Message Body</Label>
                  <span className="text-[10px] text-zinc-400">Plain text with markdown line breaks</span>
                </div>
                <Textarea 
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="min-h-[180px] text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500 leading-relaxed font-sans"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Live Sample Preview:</span>
                <div className="font-semibold text-zinc-900 text-xs border-b border-zinc-200/60 pb-1">
                  Subject: {interpolateTemplate(editSubject, { candidate_name: 'Alex Mercer', job_title: 'Senior Frontend Engineer', company_name: 'HireForce', meeting_format: 'Google Meet', meeting_link_or_address: 'https://meet.google.com/abc-defg-hij', interview_date_time: 'Tomorrow, 3:00 PM', round_type: 'Technical Screen', recruiter_name: connectedAcc?.recruiter_name || 'Hiring Lead' })}
                </div>
                <div className="text-zinc-700 leading-relaxed whitespace-pre-wrap text-[11px] pt-1">
                  {interpolateTemplate(editBody, { candidate_name: 'Alex Mercer', job_title: 'Senior Frontend Engineer', company_name: 'HireForce', meeting_format: 'Google Meet', meeting_link_or_address: 'https://meet.google.com/abc-defg-hij', interview_date_time: 'Tomorrow, 3:00 PM', round_type: 'Technical Screen', recruiter_name: connectedAcc?.recruiter_name || 'Hiring Lead' })}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingWorkflow(null)} className="text-xs">
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSaveTemplate}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Save Workflow Template
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dispatched Email View Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(v) => !v && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-zinc-200 shadow-xl rounded-xl p-6">
          {selectedLog && (
            <div className="space-y-4">
              <DialogHeader className="text-left pb-2 border-b border-zinc-100">
                <DialogTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  Automated Email Dispatched
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Sent to {selectedLog.recipient_name} ({selectedLog.recipient_email}) &bull; {new Date(selectedLog.timestamp).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 space-y-2 text-xs">
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">Subject:</span>
                  <span className="font-bold text-zinc-900">{selectedLog.subject}</span>
                </div>
                <div className="pt-2 border-t border-zinc-200/60">
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block mb-1">Message Body:</span>
                  <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap text-xs bg-white p-2.5 rounded border border-zinc-200">
                    {selectedLog.body}
                  </p>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button 
                  size="sm" 
                  onClick={() => setSelectedLog(null)} 
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    
      {/* Live Test Email Dispatch Modal */}
      <Dialog open={!!testModalWorkflow} onOpenChange={(open) => !open && setTestModalWorkflow(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-zinc-200 shadow-xl rounded-xl p-6">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Send size={16} className="text-emerald-600" />
              Send Live Test Email
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Dispatches a real email from your connected recruiter mailbox to test live delivery and layout.
            </DialogDescription>
          </DialogHeader>

          {testModalWorkflow && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-[11px] font-medium">Workflow:</span>
                  <span className="font-bold text-zinc-900">{testModalWorkflow.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-[11px] font-medium">Sent From (Recruiter):</span>
                  <span className="font-mono text-zinc-800 text-[11px] font-semibold">{connectedAcc?.email || user?.email || 'Not Connected'}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-800">
                  Deliver Test Preview To Email Address:
                </Label>
                <Input 
                  type="email"
                  value={testTargetEmail}
                  onChange={(e) => setTestTargetEmail(e.target.value)}
                  placeholder="e.g. recruiter@company.com"
                  className="h-9 text-xs bg-white border-zinc-300"
                  required
                />
                <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    Why send to your own email?
                  </p>
                  <p className="text-emerald-700 leading-relaxed text-[11px]">
                    Sending the test email to your own inbox allows you to review how candidates will view your automated message.
                  </p>
                  <p className="text-zinc-500 text-[10px] pt-0.5 border-t border-emerald-200/60">
                    &bull; In real hiring: candidate emails go to the applicant, while internal match alerts go to HR.
                  </p>
                </div>
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTestModalWorkflow(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isDispatchingTest || !testTargetEmail}
                  onClick={handleExecuteTestSend}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
                >
                  {isDispatchingTest ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  {isDispatchingTest ? 'Dispatching Live...' : 'Send Live Test Email'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

export default AutomationsPage;
