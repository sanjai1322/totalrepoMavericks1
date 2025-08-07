import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Lightbulb, 
  Clock, 
  Star, 
  Play, 
  RefreshCw,
  TrendingUp,
  Target,
  BookOpen
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Recommendations() {
  const [filterTechnology, setFilterTechnology] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["/api/recommendations"],
  });

  const { data: recommendationStats } = useQuery({
    queryKey: ["/api/recommendations/stats"],
  });

  const refreshRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/recommendations/refresh");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Recommendations Updated",
        description: "Your learning recommendations have been refreshed based on your latest progress.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to refresh recommendations",
        variant: "destructive",
      });
    },
  });

  const technologies = Array.from(new Set(recommendations?.map((rec: any) => rec.module?.technology) || []));

  const filteredRecommendations = recommendations?.filter((rec: any) => 
    filterTechnology === "all" || rec.module?.technology?.toLowerCase() === filterTechnology.toLowerCase()
  ) || [];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-600";
      case "intermediate": return "bg-blue-100 text-blue-600";
      case "advanced": return "bg-orange-100 text-orange-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "bg-success text-white";
    if (score >= 0.6) return "bg-warning text-white";
    return "bg-slate-500 text-white";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-slate-200 rounded-xl"></div>
            <div className="h-96 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const stats = recommendationStats || {
    totalRecommendations: 0,
    actedUpon: 0,
    actionRate: 0,
    topTechnologies: []
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900" data-testid="text-recommendations-title">
            Learning Recommendations
          </h2>
          <p className="text-slate-600 mt-1" data-testid="text-recommendations-subtitle">
            AI-powered learning suggestions tailored to your skills and progress.
          </p>
        </div>
        <Button 
          onClick={() => refreshRecommendationsMutation.mutate()}
          disabled={refreshRecommendationsMutation.isPending}
          data-testid="button-refresh-recommendations"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshRecommendationsMutation.isPending ? 'animate-spin' : ''}`} />
          {refreshRecommendationsMutation.isPending ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Recommendations</p>
                <p className="text-3xl font-bold text-slate-900" data-testid="text-total-recommendations">
                  {stats.totalRecommendations}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Lightbulb className="text-primary h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Started Modules</p>
                <p className="text-3xl font-bold text-slate-900" data-testid="text-acted-upon">
                  {stats.actedUpon}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Play className="text-success h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Action Rate</p>
                <p className="text-3xl font-bold text-slate-900" data-testid="text-action-rate">
                  {stats.actionRate}%
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Target className="text-warning h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Top Focus</p>
                <p className="text-lg font-bold text-slate-900" data-testid="text-top-technology">
                  {stats.topTechnologies?.[0]?.technology || "N/A"}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="text-purple-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filter */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-700">Filter by Technology:</label>
                <Select value={filterTechnology} onValueChange={setFilterTechnology}>
                  <SelectTrigger className="w-48" data-testid="select-technology-filter">
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
              </div>
            </CardContent>
          </Card>

          {/* Recommendations List */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Personalized Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredRecommendations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No recommendations available</p>
                  <p className="text-sm">Complete more assessments or update your profile to get personalized recommendations!</p>
                </div>
              ) : (
                filteredRecommendations.map((recommendation: any, index: number) => (
                  <div key={recommendation.id} className="border border-slate-200 rounded-lg p-4 hover:border-primary transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-slate-900" data-testid={`text-recommendation-title-${index}`}>
                            {recommendation.module?.title || "Learning Module"}
                          </h3>
                          <Badge className={getDifficultyColor(recommendation.module?.difficulty || "intermediate")}>
                            {recommendation.module?.difficulty}
                          </Badge>
                          <Badge className={getScoreColor(recommendation.score)}>
                            {Math.round(recommendation.score * 100)}% match
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-3" data-testid={`text-recommendation-description-${index}`}>
                          {recommendation.module?.description || recommendation.reason}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                          <span><Clock className="inline h-4 w-4 mr-1" />{recommendation.module?.duration || 3} hours</span>
                          <span><Star className="inline h-4 w-4 mr-1" />{recommendation.module?.rating || 4.8} rating</span>
                          <span className="capitalize">{recommendation.module?.technology}</span>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm text-blue-700 font-medium">Why this is recommended:</p>
                          <p className="text-sm text-blue-600" data-testid={`text-recommendation-reason-${index}`}>
                            {recommendation.reason}
                          </p>
                        </div>
                      </div>
                      <Button className="ml-4" data-testid={`button-start-module-${index}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Learning
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats and Insights */}
        <div className="space-y-6">
          {/* Top Recommended Technologies */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.topTechnologies?.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No focus areas yet</p>
                  <p className="text-sm">Take assessments to get recommendations!</p>
                </div>
              ) : (
                stats.topTechnologies?.slice(0, 5).map((tech: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <span className="font-medium text-slate-900" data-testid={`text-focus-technology-${index}`}>
                        {tech.technology}
                      </span>
                      <p className="text-sm text-slate-600">
                        {tech.count} recommendation{tech.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-focus-count-${index}`}>
                      {tech.count}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recommendation Insights */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Recommendation Quality</h4>
                <p className="text-sm text-blue-700">
                  Your recommendations are personalized based on {recommendations?.length || 0} data points including assessment scores, skill gaps, and learning patterns.
                </p>
              </div>
              
              {stats.actionRate > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Learning Progress</h4>
                  <p className="text-sm text-green-700">
                    You've acted on {stats.actionRate}% of your recommendations. Keep up the great work!
                  </p>
                </div>
              )}

              <div className="bg-amber-50 rounded-lg p-4">
                <h4 className="font-medium text-amber-900 mb-2">Next Steps</h4>
                <p className="text-sm text-amber-700">
                  Complete more assessments in areas like {stats.topTechnologies?.[0]?.technology || "JavaScript"} to unlock more targeted recommendations.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Learning Tips */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Learning Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700">Focus on one technology at a time for better retention</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700">Start with beginner modules to build a strong foundation</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700">Take assessments after completing modules to track progress</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700">Refresh recommendations monthly for updated suggestions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
