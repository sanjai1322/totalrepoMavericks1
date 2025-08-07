import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Trophy, 
  Calendar, 
  Users, 
  Plus, 
  Search,
  Filter,
  Clock,
  Award,
  Target,
  Zap
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createHackathonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  theme: z.string().min(1, "Theme is required"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  registrationDeadline: z.string().min(1, "Registration deadline is required"),
  maxParticipants: z.number().min(1).optional(),
});

type CreateHackathonFormValues = z.infer<typeof createHackathonSchema>;

export default function Hackathons() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: hackathons, isLoading } = useQuery({
    queryKey: ["/api/hackathons", { filter }],
  });

  const { data: userHackathons } = useQuery({
    queryKey: ["/api/hackathons/user/participated"],
  });

  const form = useForm<CreateHackathonFormValues>({
    resolver: zodResolver(createHackathonSchema),
    defaultValues: {
      difficulty: "intermediate",
    },
  });

  const createHackathonMutation = useMutation({
    mutationFn: async (data: CreateHackathonFormValues) => {
      const response = await apiRequest("POST", "/api/hackathons", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Hackathon Created",
        description: "Your hackathon has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hackathons"] });
      setShowCreateModal(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create hackathon",
        variant: "destructive",
      });
    },
  });

  const joinHackathonMutation = useMutation({
    mutationFn: async ({ hackathonId, teamName }: { hackathonId: string; teamName?: string }) => {
      const response = await apiRequest("POST", `/api/hackathons/${hackathonId}/join`, { teamName });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Joined Hackathon",
        description: "You have successfully joined the hackathon!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hackathons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hackathons/user/participated"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join hackathon",
        variant: "destructive",
      });
    },
  });

  const filteredHackathons = hackathons?.filter((hackathon: any) => 
    hackathon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hackathon.theme?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hackathon.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success text-white";
      case "upcoming": return "bg-primary text-white";
      case "registration_open": return "bg-blue-100 text-blue-600";
      case "completed": return "bg-slate-100 text-slate-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-600";
      case "intermediate": return "bg-blue-100 text-blue-600";
      case "advanced": return "bg-orange-100 text-orange-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const onSubmit = (data: CreateHackathonFormValues) => {
    createHackathonMutation.mutate(data);
  };

  if (isLoading) {
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

  const activeHackathons = hackathons?.filter((h: any) => h.status === 'active').length || 0;
  const upcomingHackathons = hackathons?.filter((h: any) => h.status === 'upcoming' || h.status === 'registration_open').length || 0;
  const userParticipations = userHackathons?.length || 0;

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900" data-testid="text-hackathons-title">
            Hackathons
          </h2>
          <p className="text-slate-600 mt-1" data-testid="text-hackathons-subtitle">
            Join exciting coding challenges and compete with developers worldwide.
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          data-testid="button-create-hackathon"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Hackathon
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Hackathons</p>
                <p className="text-3xl font-bold text-slate-900" data-testid="text-active-count">
                  {activeHackathons}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Zap className="text-success h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Upcoming</p>
                <p className="text-3xl font-bold text-slate-900" data-testid="text-upcoming-count">
                  {upcomingHackathons}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="text-primary h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Your Participations</p>
                <p className="text-3xl font-bold text-slate-900" data-testid="text-user-participations">
                  {userParticipations}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Trophy className="text-purple-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Hackathons</p>
                <p className="text-3xl font-bold text-slate-900" data-testid="text-total-hackathons">
                  {hackathons?.length || 0}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Target className="text-warning h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Hackathon List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filters */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search hackathons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-hackathons"
                  />
                </div>
                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Hackathon List */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Available Hackathons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredHackathons.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No hackathons found</p>
                  <p className="text-sm">Try adjusting your search or create a new hackathon!</p>
                </div>
              ) : (
                filteredHackathons.map((hackathon: any, index: number) => (
                  <div key={hackathon.id} className="border border-slate-200 rounded-lg p-4 hover:border-primary transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-slate-900" data-testid={`text-hackathon-title-${index}`}>
                            {hackathon.title}
                          </h3>
                          <Badge className={getStatusColor(hackathon.status)}>
                            {hackathon.status?.replace('_', ' ')}
                          </Badge>
                          <Badge className={getDifficultyColor(hackathon.difficulty)}>
                            {hackathon.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-3" data-testid={`text-hackathon-description-${index}`}>
                          {hackathon.description}
                        </p>
                        {hackathon.theme && (
                          <p className="text-sm text-primary mb-3" data-testid={`text-hackathon-theme-${index}`}>
                            Theme: {hackathon.theme}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span><Calendar className="inline h-4 w-4 mr-1" />
                            {new Date(hackathon.startDate).toLocaleDateString()} - {new Date(hackathon.endDate).toLocaleDateString()}
                          </span>
                          <span><Users className="inline h-4 w-4 mr-1" />
                            {hackathon.currentParticipants || 0} participants
                          </span>
                          {hackathon.daysRemaining !== undefined && (
                            <span><Clock className="inline h-4 w-4 mr-1" />
                              {hackathon.daysRemaining} days left
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 space-y-2">
                        {hackathon.status === 'registration_open' || hackathon.status === 'upcoming' ? (
                          <Button 
                            onClick={() => joinHackathonMutation.mutate({ hackathonId: hackathon.id })}
                            disabled={joinHackathonMutation.isPending}
                            data-testid={`button-join-hackathon-${index}`}
                          >
                            {joinHackathonMutation.isPending ? "Joining..." : "Join Now"}
                          </Button>
                        ) : (
                          <Button variant="outline" data-testid={`button-view-hackathon-${index}`}>
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                    {hackathon.challenges && hackathon.challenges.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-sm font-medium text-slate-700 mb-2">Challenges:</p>
                        <div className="flex flex-wrap gap-2">
                          {hackathon.challenges.slice(0, 3).map((challenge: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {challenge.title}
                            </Badge>
                          ))}
                          {hackathon.challenges.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{hackathon.challenges.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - User Hackathons */}
        <div className="space-y-6">
          {/* Your Hackathons */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Your Hackathons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userHackathons?.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Award className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No participations yet</p>
                  <p className="text-sm">Join a hackathon to get started!</p>
                </div>
              ) : (
                userHackathons?.slice(0, 5).map((participation: any, index: number) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900 text-sm" data-testid={`text-user-hackathon-title-${index}`}>
                        {participation.hackathon?.title}
                      </h4>
                      <Badge className={getStatusColor(participation.hackathon?.status)}>
                        {participation.hackathon?.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    {participation.participation?.teamName && (
                      <p className="text-sm text-slate-600 mb-2">
                        Team: {participation.participation.teamName}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        Joined: {new Date(participation.participation?.joinedAt).toLocaleDateString()}
                      </span>
                      {participation.participation?.score !== null && (
                        <span className="font-bold text-primary">
                          Score: {participation.participation.score}
                        </span>
                      )}
                    </div>
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
                className="w-full"
                onClick={() => setShowCreateModal(true)}
                data-testid="button-create-hackathon-quick"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Hackathon
              </Button>
              <Button variant="outline" className="w-full" data-testid="button-browse-active">
                <Zap className="h-4 w-4 mr-2" />
                Browse Active
              </Button>
              <Button variant="outline" className="w-full" data-testid="button-view-leaderboard">
                <Trophy className="h-4 w-4 mr-2" />
                View Leaderboards
              </Button>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Hackathon Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700">Read the challenges carefully before starting</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700">Form teams early for better collaboration</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700">Focus on completing core features first</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700">Submit your solution before the deadline</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Hackathon Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-create-hackathon-title">Create New Hackathon</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter hackathon title" 
                          data-testid="input-hackathon-title"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., AI Innovation, Web3, Mobile Apps" 
                          data-testid="input-hackathon-theme"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-hackathon-difficulty">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the hackathon objectives and what participants will build..."
                        className="min-h-[100px]"
                        data-testid="textarea-hackathon-description"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local"
                          data-testid="input-start-date"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local"
                          data-testid="input-end-date"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="registrationDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Deadline</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local"
                          data-testid="input-registration-deadline"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Participants (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Leave empty for unlimited"
                        data-testid="input-max-participants"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  data-testid="button-cancel-create"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createHackathonMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createHackathonMutation.isPending ? "Creating..." : "Create Hackathon"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
