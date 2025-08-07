import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Code, 
  BarChart3, 
  Clock, 
  Trophy, 
  ArrowUp, 
  ArrowRight,
  ClipboardCheck,
  Upload,
  Plus,
  Calendar,
  Users,
  Star
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AssessmentModal from "@/components/modals/assessment-modal";

export default function Dashboard() {
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    skillsAssessed: 0,
    avgScore: 0,
    learningHours: 0,
    totalAssessments: 0
  };

  const recentAssessments = dashboardData?.recentAssessments || [];
  const recommendations = dashboardData?.recommendations || [];
  const activeHackathons = dashboardData?.activeHackathons || [];
  const upcomingHackathons = dashboardData?.upcomingHackathons || [];
  const profile = dashboardData?.profile;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 70) return "text-warning";
    return "text-error";
  };

  const getSkillColor = (level: number) => {
    if (level >= 80) return "bg-primary";
    if (level >= 60) return "bg-warning";
    return "bg-error";
  };

  return (
    <div className="p-6 space-y-8">
      {/* Dashboard Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900" data-testid="text-dashboard-title">
          Dashboard
        </h2>
        <p className="text-slate-600 mt-1" data-testid="text-dashboard-subtitle">
          Welcome back! Here's your learning progress overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Skills Assessed</p>
                <p className="text-3xl font-bold text-slate-900" data-testid="text-skills-assessed">
                  {stats.skillsAssessed}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Code className="text-primary h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-success flex items-center">
                <ArrowUp className="h-4 w-4 mr-1" />
                12%
              </span>
              <span className="text-slate-600 ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Score</p>
                <p className="text-3xl font-bold text-slate-900" data-testid="text-avg-score">
                  {stats.avgScore}%
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <BarChart3 className="text-success h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-success flex items-center">
                <ArrowUp className="h-4 w-4 mr-1" />
                8%
              </span>
              <span className="text-slate-600 ml-1">improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Learning Hours</p>
                <p className="text-3xl font-bold text-slate-900" data-testid="text-learning-hours">
                  {Math.round(stats.learningHours || 0)}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Clock className="text-warning h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-success flex items-center">
                <ArrowUp className="h-4 w-4 mr-1" />
                25%
              </span>
              <span className="text-slate-600 ml-1">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Assessments</p>
                <p className="text-3xl font-bold text-slate-900" data-testid="text-total-assessments">
                  {stats.totalAssessments}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Trophy className="text-purple-600 h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-slate-600">
                {recentAssessments.length} recent
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Assessments */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Recent Assessments
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary text-sm font-medium hover:text-blue-700">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentAssessments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No assessments taken yet</p>
                  <p className="text-sm">Take your first assessment to get started!</p>
                </div>
              ) : (
                recentAssessments.map((assessment: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Code className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900" data-testid={`text-assessment-title-${index}`}>
                          {assessment.assessment?.title || "Assessment"}
                        </h4>
                        <p className="text-sm text-slate-600" data-testid={`text-assessment-date-${index}`}>
                          Completed {new Date(assessment.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(assessment.score)}`} data-testid={`text-assessment-score-${index}`}>
                        {assessment.score}%
                      </div>
                      <div className="text-xs text-slate-500">
                        {assessment.correctAnswers}/{assessment.totalQuestions} correct
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Learning Recommendations */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Recommended Learning
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary text-sm font-medium hover:text-blue-700">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-center py-8 text-slate-500">
                    <div className="h-12 w-12 mx-auto mb-4 bg-slate-100 rounded-lg flex items-center justify-center">
                      <span className="text-slate-400">📚</span>
                    </div>
                    <p>No recommendations available</p>
                    <p className="text-sm">Complete assessments to get personalized recommendations!</p>
                  </div>
                </div>
              ) : (
                recommendations.map((rec: any, index: number) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 hover:border-primary transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 mb-2" data-testid={`text-recommendation-title-${index}`}>
                          {rec.module?.title || "Learning Module"}
                        </h4>
                        <p className="text-sm text-slate-600 mb-3" data-testid={`text-recommendation-description-${index}`}>
                          {rec.module?.description || rec.reason}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span><Clock className="inline h-4 w-4 mr-1" />{rec.module?.duration || 3} hours</span>
                          <span><Star className="inline h-4 w-4 mr-1" />{rec.module?.rating || 4.8} rating</span>
                          <Badge variant="secondary" className={rec.module?.difficulty === 'advanced' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-primary'}>
                            {rec.module?.difficulty || 'Intermediate'}
                          </Badge>
                        </div>
                      </div>
                      <Button className="ml-4" data-testid={`button-start-learning-${index}`}>
                        Start Learning
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Skill Progress */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Skill Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.skills?.length === 0 || !profile?.skills ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="h-12 w-12 mx-auto mb-4 bg-slate-100 rounded-lg flex items-center justify-center">
                    <span className="text-slate-400">📊</span>
                  </div>
                  <p>No skills tracked yet</p>
                  <p className="text-sm">Upload your resume or take assessments to track skills!</p>
                </div>
              ) : (
                profile.skills.slice(0, 5).map((skill: any, index: number) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700" data-testid={`text-skill-name-${index}`}>
                        {skill.skill}
                      </span>
                      <span className="text-sm text-slate-600" data-testid={`text-skill-level-${index}`}>
                        {skill.level}%
                      </span>
                    </div>
                    <Progress value={skill.level} className="h-2" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Active Hackathons */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Active Hackathons
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary text-sm font-medium hover:text-blue-700">
                Browse All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {[...activeHackathons, ...upcomingHackathons].length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No active hackathons</p>
                  <p className="text-sm">Check back later for exciting challenges!</p>
                </div>
              ) : (
                [...activeHackathons, ...upcomingHackathons].slice(0, 2).map((hackathon: any, index: number) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-900" data-testid={`text-hackathon-title-${index}`}>
                        {hackathon.title}
                      </h4>
                      <Badge variant={hackathon.status === 'active' ? 'default' : 'secondary'}>
                        {hackathon.status === 'active' ? 'Active' : 'Starting Soon'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-3" data-testid={`text-hackathon-description-${index}`}>
                      {hackathon.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-slate-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span data-testid={`text-hackathon-date-${index}`}>
                          {hackathon.status === 'active' ? `${Math.ceil((new Date(hackathon.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left` : 'Starts soon'}
                        </span>
                      </div>
                      <div className="flex items-center text-slate-500">
                        <Users className="h-4 w-4 mr-1" />
                        <span data-testid={`text-hackathon-participants-${index}`}>
                          {hackathon.currentParticipants || 0} participants
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant={hackathon.status === 'active' ? 'outline' : 'default'} 
                      className="w-full mt-3"
                      data-testid={`button-hackathon-action-${index}`}
                    >
                      {hackathon.status === 'active' ? 'View Details' : 'Join Now'}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full flex items-center justify-center"
                onClick={() => setShowAssessmentModal(true)}
                data-testid="button-take-assessment"
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Take New Assessment
              </Button>
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center"
                data-testid="button-upload-resume"
              >
                <Upload className="mr-2 h-4 w-4" />
                Update Resume
              </Button>
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center"
                data-testid="button-create-hackathon"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Hackathon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <AssessmentModal 
        open={showAssessmentModal} 
        onOpenChange={setShowAssessmentModal} 
      />
    </div>
  );
}
