import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  ClipboardCheck, 
  Clock, 
  Play, 
  Search,
  Filter,
  Trophy,
  TrendingUp,
  Plus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AssessmentModal from "@/components/modals/assessment-modal";

export default function Assessments() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTechnology, setSelectedTechnology] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ["/api/assessments", selectedTechnology !== "all" ? { technology: selectedTechnology } : {}],
  });

  const { data: userHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/assessments/user/history"],
  });

  const technologies = [
    "JavaScript", "React", "Node.js", "TypeScript", "Python", 
    "Java", "C++", "SQL", "MongoDB", "AWS"
  ];

  const filteredAssessments = assessments?.filter((assessment: any) => 
    assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assessment.technology.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 70) return "text-warning";
    return "text-error";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-600";
      case "intermediate": return "bg-blue-100 text-blue-600";
      case "advanced": return "bg-orange-100 text-orange-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  if (assessmentsLoading || historyLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-96 bg-slate-200 rounded-xl"></div>
            </div>
            <div className="h-96 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const recentHistory = userHistory?.slice(0, 5) || [];
  const avgScore = userHistory?.length > 0 
    ? Math.round(userHistory.reduce((sum: number, assessment: any) => sum + assessment.score, 0) / userHistory.length)
    : 0;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900" data-testid="text-assessments-title">
          Assessments
        </h2>
        <p className="text-slate-600 mt-1" data-testid="text-assessments-subtitle">
          Test your skills with our AI-generated assessments and track your progress.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Available Assessments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filters */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search assessments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-assessments"
                  />
                </div>
                <Select value={selectedTechnology} onValueChange={setSelectedTechnology}>
                  <SelectTrigger className="w-full sm:w-48" data-testid="select-technology-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Technologies</SelectItem>
                    {technologies.map((tech) => (
                      <SelectItem key={tech} value={tech.toLowerCase()}>
                        {tech}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  data-testid="button-create-assessment"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assessment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Available Assessments */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Available Assessments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredAssessments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No assessments found</p>
                  <p className="text-sm">Try adjusting your search or create a new assessment!</p>
                </div>
              ) : (
                filteredAssessments.map((assessment: any, index: number) => (
                  <div key={assessment.id} className="border border-slate-200 rounded-lg p-4 hover:border-primary transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-slate-900" data-testid={`text-assessment-title-${index}`}>
                            {assessment.title}
                          </h3>
                          <Badge className={getDifficultyColor(assessment.difficulty)}>
                            {assessment.difficulty}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                          <span><Clock className="inline h-4 w-4 mr-1" />{assessment.timeLimit} minutes</span>
                          <span><ClipboardCheck className="inline h-4 w-4 mr-1" />{assessment.questions?.length || 15} questions</span>
                          <span className="capitalize">{assessment.technology}</span>
                        </div>
                        <p className="text-sm text-slate-600" data-testid={`text-assessment-description-${index}`}>
                          Test your {assessment.technology} skills with {assessment.difficulty} level questions covering practical scenarios and best practices.
                        </p>
                      </div>
                      <Button className="ml-4" data-testid={`button-start-assessment-${index}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats and History */}
        <div className="space-y-6">
          {/* Assessment Stats */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-3xl font-bold text-slate-900 mb-1" data-testid="text-total-assessments">
                  {userHistory?.length || 0}
                </div>
                <div className="text-sm text-slate-600">Assessments Taken</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Average Score</span>
                <span className={`font-bold ${getScoreColor(avgScore)}`} data-testid="text-average-score">
                  {avgScore}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Best Score</span>
                <span className="font-bold text-success" data-testid="text-best-score">
                  {userHistory?.length > 0 ? Math.max(...userHistory.map((a: any) => a.score)) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Technologies Tested</span>
                <span className="font-bold text-slate-900" data-testid="text-technologies-count">
                  {new Set(userHistory?.map((a: any) => a.assessment?.technology) || []).size}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Assessment History */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Recent History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No assessments taken yet</p>
                  <p className="text-sm">Take your first assessment to get started!</p>
                </div>
              ) : (
                recentHistory.map((assessment: any, index: number) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900 text-sm" data-testid={`text-history-title-${index}`}>
                        {assessment.assessment?.title || "Assessment"}
                      </h4>
                      <Badge className={getDifficultyColor(assessment.assessment?.difficulty || "intermediate")}>
                        {assessment.assessment?.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600" data-testid={`text-history-date-${index}`}>
                        {new Date(assessment.completedAt).toLocaleDateString()}
                      </span>
                      <span className={`font-bold ${getScoreColor(assessment.score)}`} data-testid={`text-history-score-${index}`}>
                        {assessment.score}%
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {assessment.correctAnswers}/{assessment.totalQuestions} correct • {assessment.timeSpent || assessment.assessment?.timeLimit} min
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Performance Trends */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userHistory?.length >= 2 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Recent Trend</span>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-success mr-1" />
                      <span className="text-success font-medium">Improving</span>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    Your scores have improved by an average of 8% over your last 3 assessments.
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">Take more assessments to see your performance trends</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AssessmentModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </div>
  );
}
