import React, { useState } from 'react';
import { FileText, Download, Brain, Sparkles, Calendar } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';
import { generateReport } from '@/services/aiBackend';

const reportTypes = [
  { id: 'monthly', name: 'Monthly Usage Report', description: 'Complete overview of circulation, memberships, and trends', icon: Calendar },
  { id: 'inventory', name: 'Inventory Analysis', description: 'Stock levels, popular titles, and acquisition recommendations', icon: FileText },
  { id: 'student', name: 'Student Engagement Report', description: 'Reading patterns, department-wise analysis, top readers', icon: Brain },
  { id: 'financial', name: 'Financial Summary', description: 'Fines collected, pending dues, budget allocation suggestions', icon: FileText },
  { id: 'predictive', name: 'AI Predictive Report', description: 'Next month demand forecast, trending topics, purchase recommendations', icon: Sparkles },
];

const generatedReports = [
  { name: 'March 2025 Monthly Report', type: 'Monthly', generated: '2025-04-01', pages: 24, size: '2.4 MB' },
  { name: 'Q1 2025 Inventory Analysis', type: 'Inventory', generated: '2025-03-31', pages: 18, size: '1.8 MB' },
  { name: 'Student Engagement Feb 2025', type: 'Student', generated: '2025-03-01', pages: 12, size: '1.2 MB' },
];

const AIReports: React.FC = () => {
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);

  const handleGenerate = async (id: string) => {
    setGenerating(id);
    try {
      // Mock data for reports
      const mockData = {
        totalBooks: 1250,
        borrowedThisMonth: 342,
        activeMembers: 856,
        newMembers: 45,
        overdueBooks: 23,
        popularCategories: ['Programming', 'AI/ML', 'Database', 'Networking'],
      };
      
      const report = await generateReport(id, mockData, 'April 2025');
      setGeneratedReport(report);
      toast.success('AI Report generated successfully!');
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="AI Report Generator" description="Generate comprehensive reports with AI-powered insights and recommendations" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((r) => (
            <LibCard key={r.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center"><r.icon className="h-4 w-4 text-accent" /></div>
                <h4 className="text-sm font-medium text-foreground">{r.name}</h4>
              </div>
              <p className="text-xs text-muted-foreground">{r.description}</p>
              <LibButton size="sm" className="w-full" onClick={() => handleGenerate(r.id)} disabled={generating === r.id}>
                {generating === r.id ? <><Sparkles className="h-3 w-3 animate-spin mr-1" /> Generating...</> : 'Generate Report'}
              </LibButton>
            </LibCard>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Generated Reports</h3>
          <div className="space-y-2">
            {generatedReports.map((r) => (
              <LibCard key={r.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-accent" />
                  <div><p className="text-sm font-medium text-foreground">{r.name}</p><p className="text-xs text-muted-foreground">{r.generated} · {r.pages} pages · {r.size}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <LibBadge>{r.type}</LibBadge>
                  <LibButton size="sm" variant="ghost" onClick={() => toast.success('Downloading...')} className="flex items-center gap-1"><Download className="h-3 w-3" /> PDF</LibButton>
                </div>
              </LibCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIReports;
