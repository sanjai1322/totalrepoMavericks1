import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, User, Github, Linkedin, Globe, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const profileFormSchema = z.object({
  github: z.string().optional(),
  linkedin: z.string().optional(),
  portfolio: z.string().optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function Profile() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["/api/profile"],
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      github: profileData?.profile?.github || "",
      linkedin: profileData?.profile?.linkedin || "",
      portfolio: profileData?.profile?.portfolio || "",
      experience: profileData?.profile?.experience || "",
      education: profileData?.profile?.education || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const uploadResumeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      const response = await fetch("/api/profile/resume", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Resume Uploaded",
        description: "Your resume has been parsed and your profile has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setIsUploading(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload resume",
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      uploadResumeMutation.mutate(file);
    }
  };

  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
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

  const profile = profileData?.profile;
  const stats = profileData?.stats || {
    skillsAssessed: 0,
    avgScore: 0,
    learningHours: 0,
    totalAssessments: 0
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900" data-testid="text-profile-title">
          Profile
        </h2>
        <p className="text-slate-600 mt-1" data-testid="text-profile-subtitle">
          Manage your professional profile and track your progress.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="github"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GitHub Profile</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input 
                                placeholder="https://github.com/username" 
                                className="pl-10"
                                data-testid="input-github"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn Profile</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input 
                                placeholder="https://linkedin.com/in/username" 
                                className="pl-10"
                                data-testid="input-linkedin"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="portfolio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portfolio Website</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                              placeholder="https://your-portfolio.com" 
                              className="pl-10"
                              data-testid="input-portfolio"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Experience</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your work experience..."
                            className="min-h-[100px]"
                            data-testid="textarea-experience"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="education"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Education</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your educational background..."
                            className="min-h-[100px]"
                            data-testid="textarea-education"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Resume Upload */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Resume Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-medium text-slate-900 mb-2">Upload your resume</p>
                <p className="text-sm text-slate-600 mb-4">
                  PDF or text files only. Our AI will automatically extract your skills and experience.
                </p>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-upload"
                  data-testid="input-resume-upload"
                />
                <label htmlFor="resume-upload">
                  <Button 
                    asChild 
                    disabled={isUploading || uploadResumeMutation.isPending}
                    data-testid="button-upload-resume"
                  >
                    <span className="cursor-pointer">
                      {isUploading || uploadResumeMutation.isPending ? "Uploading..." : "Choose File"}
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats and Skills */}
        <div className="space-y-6">
          {/* Profile Stats */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Profile Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Skills Assessed</span>
                <span className="font-bold text-slate-900" data-testid="text-profile-skills-count">
                  {stats.skillsAssessed}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Average Score</span>
                <span className="font-bold text-slate-900" data-testid="text-profile-avg-score">
                  {stats.avgScore}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Learning Hours</span>
                <span className="font-bold text-slate-900" data-testid="text-profile-learning-hours">
                  {Math.round(stats.learningHours)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Assessments Taken</span>
                <span className="font-bold text-slate-900" data-testid="text-profile-assessments-count">
                  {stats.totalAssessments}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Skills Overview */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Skills Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!profile?.skills || profile.skills.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <User className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No skills detected yet</p>
                  <p className="text-sm">Upload your resume or take assessments to track your skills!</p>
                </div>
              ) : (
                profile.skills.map((skill: any, index: number) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700" data-testid={`text-skill-name-${index}`}>
                        {skill.skill}
                      </span>
                      <Badge variant="secondary" data-testid={`badge-skill-level-${index}`}>
                        {skill.level}%
                      </Badge>
                    </div>
                    <Progress value={skill.level} className="h-2" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Profile Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Overall Completion</span>
                  <span className="font-bold text-slate-900" data-testid="text-profile-completion">
                    {Math.round(((profile?.github ? 1 : 0) + 
                                (profile?.linkedin ? 1 : 0) + 
                                (profile?.portfolio ? 1 : 0) + 
                                (profile?.experience ? 1 : 0) + 
                                (profile?.education ? 1 : 0) + 
                                (profile?.skills?.length > 0 ? 1 : 0)) / 6 * 100)}%
                  </span>
                </div>
                <Progress value={Math.round(((profile?.github ? 1 : 0) + 
                                            (profile?.linkedin ? 1 : 0) + 
                                            (profile?.portfolio ? 1 : 0) + 
                                            (profile?.experience ? 1 : 0) + 
                                            (profile?.education ? 1 : 0) + 
                                            (profile?.skills?.length > 0 ? 1 : 0)) / 6 * 100)} className="h-3" />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">GitHub Profile</span>
                    <span className={profile?.github ? "text-success" : "text-slate-400"}>
                      {profile?.github ? "✓" : "○"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">LinkedIn Profile</span>
                    <span className={profile?.linkedin ? "text-success" : "text-slate-400"}>
                      {profile?.linkedin ? "✓" : "○"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Portfolio Website</span>
                    <span className={profile?.portfolio ? "text-success" : "text-slate-400"}>
                      {profile?.portfolio ? "✓" : "○"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Work Experience</span>
                    <span className={profile?.experience ? "text-success" : "text-slate-400"}>
                      {profile?.experience ? "✓" : "○"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Education</span>
                    <span className={profile?.education ? "text-success" : "text-slate-400"}>
                      {profile?.education ? "✓" : "○"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Skills Detected</span>
                    <span className={profile?.skills?.length > 0 ? "text-success" : "text-slate-400"}>
                      {profile?.skills?.length > 0 ? "✓" : "○"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
