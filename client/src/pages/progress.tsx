import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  Clock, 
  Target, 
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Award,
  Calendar,
  BarChart3
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function ProgressPage() {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  const { data: progressData, isLoading } = useQuery({
    queryKey: ["/api/progress"],
  });

  const { data: reportData } = useQuery({
    queryKey: ["/api/progress/report", { timeframe }],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const overview = progressData?.overview || {
    totalModules: 0,
    completedModules: 0,
    inProgressModules: 0,
    completionRate: 0,
    totalHours: 0,
    avgAssessmentScore: 0,
    learningStreak: 0
  };

  const moduleProgress = progressData?.moduleProgress || [];
  const skillProgression = progressData?.skillProgression || [];
  const recentActivity = progressData?.recentActivity || [];

  const report = reportData || {
    summary: {
      modulesCompleted: 0,
      assessmentsTaken: 0,
      averageScore: 0,
      learningStreak: 0,
      totalHoursLearned: 0
    },
    stagnationAlert: false,
    recommendations: []
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-success";
    if (progress >= 50) return "bg-primary";
    return "bg-warning";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'declining': return <TrendingUp className="h-4 w-4 text-error rotate-180" />;
      default: return <TrendingUp className="h-4 w-4 text-slate-400" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assessment': return <BarChart3 className="h-4 w-4 text-primary" />;
      case 'completion': return <CheckCircle className="h-4 w-4 text-success" />;
      default: return <BookOpen className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900" data-testid="text-progress-title">
            Progress Tracker
          </h2>
          <p className="text-slate-600 mt-1" data-testid="text-progress-subtitle">
            Monitor your learning journey and identify areas for improvement.
          </p>
        </div>
        <Select value={timeframe} onValueChange={(value: 'week' | 'month' | 'quarter') => setTimeframe(value)}>
          <SelectTrigger className="w-32" data-testid="select-timeframe">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="quarter">Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completion Rate</p>
                <p className="text-3xl font-bold text-slate-900" data-testid="text-completion-rate">
                  {Math.round(overview.completionRate)}%
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Target className="text-success h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={overview.completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Learning Hours</p>
                <p className="text-3xl font-bold text-slate-900" data-testid="text-total-hours">
                  {Math.round(overview.totalHours * 10) / 10}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Clock className="text-primary h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-600">
              {report.summary.totalHoursLearned} hours this {timeframe}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Learning Streak</p>
                <p className="text-3xl font-bold text-slate-900" data-testid="text-learning-streak">
                  {overview.learningStreak}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Award className="text-warning h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-600">
              days in a row
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Assessment Score</p>
                <p className="text-3xl font-bold text-slate-900" data-testid="text-avg-assessment-score">
                  {Math.round(overview.avgAssessmentScore)}%
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <BarChart3 className="text-purple-600 h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-600">
              {report.summary.averageScore}% this {timeframe}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stagnation Alert */}
      {report.stagnationAlert && (
        <Card className="bg-warning/10 border-warning rounded-xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-warning mb-2">Learning Stagnation Detected</h3>
                <p className="text-sm text-slate-700 mb-4">
                  We noticed you haven't made progress on some learning modules recently. Here are some suggestions to get back on track:
                </p>
                <div className="space-y-2">
                  {report.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-slate-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Module Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Modules */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Module Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {moduleProgress.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No learning modules started yet</p>
                  <p className="text-sm">Start learning to track your progress!</p>
                </div>
              ) : (
                moduleProgress.slice(0, 8).map((module: any, index: number) => (
                  <div key={module.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900" data-testid={`text-module-title-${index}`}>
                          {module.module?.title || "Learning Module"}
                        </h4>
                        <p className="text-sm text-slate-600" data-testid={`text-module-technology-${index}`}>
                          {module.module?.technology} • {module.module?.duration} hours
                        </p>
                      </div>
                      <Badge 
                        variant={module.progress >= 100 ? "default" : "secondary"}
                        className={module.progress >= 100 ? "bg-success text-white" : ""}
                        data-testid={`badge-module-status-${index}`}
                      >
                        {module.progress >= 100 ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-medium" data-testid={`text-module-progress-${index}`}>
                          {Math.round(module.progress)}%
                        </span>
                      </div>
                      <Progress value={module.progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          Last accessed: {new Date(module.lastAccessedAt).toLocaleDateString()}
                        </span>
                        {module.completedAt && (
                          <span>
                            Completed: {new Date(module.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Skill Progression */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Skill Progression
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {skillProgression.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No skill progression data yet</p>
                  <p className="text-sm">Take more assessments to see your progress trends!</p>
                </div>
              ) : (
                skillProgression.map((skill: any, index: number) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-slate-900" data-testid={`text-skill-name-${index}`}>
                          {skill.technology}
                        </h4>
                        {getTrendIcon(skill.trend)}
                        <Badge variant="outline" className={
                          skill.trend === 'improving' ? 'text-success border-success' :
                          skill.trend === 'declining' ? 'text-error border-error' :
                          'text-slate-500 border-slate-300'
                        }>
                          {skill.trend}
                        </Badge>
                      </div>
                      <span className="text-sm text-slate-600">
                        {skill.scores?.length || 0} assessment{skill.scores?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {skill.scores?.length > 0 && (
                      <div className="text-sm text-slate-600">
                        Latest score: <span className="font-medium">{skill.scores[skill.scores.length - 1]?.score}%</span>
                        {skill.scores.length > 1 && (
                          <span className="ml-2">
                            (Previous: {skill.scores[skill.scores.length - 2]?.score}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity and Summary */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start learning to see your activity here!</p>
                </div>
              ) : (
                recentActivity.slice(0, 8).map((activity: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900" data-testid={`text-activity-description-${index}`}>
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{new Date(activity.date).toLocaleDateString()}</span>
                        {activity.score && (
                          <span className="text-primary font-medium">
                            {activity.score}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Progress Summary */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary" data-testid="text-summary-modules">
                    {report.summary.modulesCompleted}
                  </div>
                  <div className="text-xs text-slate-600">Modules Completed</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-success" data-testid="text-summary-assessments">
                    {report.summary.assessmentsTaken}
                  </div>
                  <div className="text-xs text-slate-600">Assessments Taken</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Average Score</span>
                  <span className="font-medium text-slate-900" data-testid="text-summary-avg-score">
                    {report.summary.averageScore}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Learning Streak</span>
                  <span className="font-medium text-slate-900" data-testid="text-summary-streak">
                    {report.summary.learningStreak} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Hours Learned</span>
                  <span className="font-medium text-slate-900" data-testid="text-summary-hours">
                    {Math.round(report.summary.totalHoursLearned * 10) / 10}h
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Modules</span>
                <span className="font-medium text-slate-900" data-testid="text-quick-total-modules">
                  {overview.totalModules}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">In Progress</span>
                <span className="font-medium text-slate-900" data-testid="text-quick-in-progress">
                  {overview.inProgressModules}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Completed</span>
                <span className="font-medium text-slate-900" data-testid="text-quick-completed">
                  {overview.completedModules}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
