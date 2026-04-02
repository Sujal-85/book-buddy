import React, { useState } from 'react';
import { Camera, Upload, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';

const recentAssessments = [
  { id: '1', title: 'Clean Code', student: 'Rahul Patil', condition: 'Good', score: 92, date: '2025-03-28', issues: [] },
  { id: '2', title: 'Design Patterns', student: 'Priya Sharma', condition: 'Fair', score: 68, date: '2025-03-27', issues: ['Torn pages (pg 45-46)', 'Spine damage'] },
  { id: '3', title: 'Introduction to Algorithms', student: 'Amit Kumar', condition: 'Poor', score: 35, date: '2025-03-26', issues: ['Water damage', 'Missing cover', 'Highlighting throughout'] },
  { id: '4', title: 'Database Systems', student: 'Sneha Desai', condition: 'Excellent', score: 98, date: '2025-03-25', issues: [] },
];

const DamageDetection: React.FC = () => {
  const [assessing, setAssessing] = useState(false);

  const simulateAssessment = () => {
    setAssessing(true);
    setTimeout(() => {
      setAssessing(false);
      toast.success('AI damage assessment complete!');
    }, 2500);
  };

  const getConditionColor = (condition: string) => {
    if (condition === 'Excellent' || condition === 'Good') return 'available';
    if (condition === 'Fair') return 'default';
    return 'issued';
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="AI Damage Detection" description="Assess book condition using AI-powered image analysis" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {/* Upload Area */}
        <LibCard>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            {assessing ? (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center animate-pulse">
                  <Camera className="h-8 w-8 text-accent" />
                </div>
                <p className="text-sm font-medium text-foreground">AI is analyzing the book...</p>
                <div className="w-48 h-2 bg-secondary rounded-full mx-auto">
                  <div className="h-2 bg-accent rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
                <p className="text-xs text-muted-foreground">Checking for tears, stains, spine damage, missing pages...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium text-foreground">Upload book photos or use camera</p>
                <p className="text-xs text-muted-foreground">Take photos of front cover, back cover, spine, and any damaged pages</p>
                <div className="flex gap-3 justify-center">
                  <LibButton onClick={simulateAssessment} className="flex items-center gap-2">
                    <Camera className="h-4 w-4" /> Capture & Assess
                  </LibButton>
                  <LibButton variant="ghost" onClick={simulateAssessment} className="flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Upload Photos
                  </LibButton>
                </div>
              </div>
            )}
          </div>
        </LibCard>

        {/* Recent Assessments */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Assessments</h3>
          <div className="space-y-3">
            {recentAssessments.map((a) => (
              <LibCard key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <LibBadge variant={getConditionColor(a.condition) as 'available' | 'issued' | 'default'}>{a.condition}</LibBadge>
                  </div>
                  <p className="text-xs text-muted-foreground">Returned by {a.student} on {a.date}</p>
                  {a.issues.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.issues.map((issue) => (
                        <span key={issue} className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">{issue}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{a.score}%</p>
                    <p className="text-xs text-muted-foreground">Condition Score</p>
                  </div>
                  {a.score >= 70 ? <CheckCircle className="h-5 w-5 text-green-500" /> : a.score >= 40 ? <AlertTriangle className="h-5 w-5 text-yellow-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                </div>
              </LibCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DamageDetection;
