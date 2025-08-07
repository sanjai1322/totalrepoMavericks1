import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const technologies = [
  "JavaScript",
  "React",
  "Node.js",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "SQL",
  "MongoDB",
  "AWS"
];

const difficultyLevels = [
  { value: "beginner", label: "Beginner", color: "bg-green-100 text-green-600" },
  { value: "intermediate", label: "Intermediate", color: "bg-blue-100 text-blue-600" },
  { value: "advanced", label: "Advanced", color: "bg-orange-100 text-orange-600" },
];

export default function AssessmentModal({ open, onOpenChange }: AssessmentModalProps) {
  const [selectedTechnology, setSelectedTechnology] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("intermediate");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createAssessmentMutation = useMutation({
    mutationFn: async (data: { technology: string; difficulty: string }) => {
      const response = await apiRequest("POST", "/api/assessments", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Assessment Created",
        description: "Your assessment has been generated successfully. You can now take it!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      onOpenChange(false);
      // In a real app, you might navigate to the assessment page
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create assessment",
        variant: "destructive",
      });
    },
  });

  const handleStartAssessment = () => {
    if (!selectedTechnology) {
      toast({
        title: "Error",
        description: "Please select a technology",
        variant: "destructive",
      });
      return;
    }

    createAssessmentMutation.mutate({
      technology: selectedTechnology,
      difficulty: selectedDifficulty,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">Quick Assessment</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Technology
            </label>
            <Select value={selectedTechnology} onValueChange={setSelectedTechnology}>
              <SelectTrigger data-testid="select-technology">
                <SelectValue placeholder="Choose a technology to assess" />
              </SelectTrigger>
              <SelectContent>
                {technologies.map((tech) => (
                  <SelectItem key={tech} value={tech} data-testid={`option-${tech.toLowerCase()}`}>
                    {tech}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {difficultyLevels.map((level) => (
                <Button
                  key={level.value}
                  variant={selectedDifficulty === level.value ? "default" : "outline"}
                  className={cn(
                    "h-auto py-3",
                    selectedDifficulty === level.value && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setSelectedDifficulty(level.value)}
                  data-testid={`button-difficulty-${level.value}`}
                >
                  <div className="text-center">
                    <div className="font-medium">{level.label}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-700 mb-1">Assessment Details</p>
                <ul className="space-y-1 text-slate-600">
                  <li>• Duration: 15-20 minutes</li>
                  <li>• Questions: 15 multiple-choice questions</li>
                  <li>• Real-time scoring and feedback</li>
                  <li>• Detailed explanations provided</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartAssessment}
              disabled={!selectedTechnology || createAssessmentMutation.isPending}
              data-testid="button-start-assessment"
            >
              {createAssessmentMutation.isPending ? "Creating..." : "Start Assessment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
