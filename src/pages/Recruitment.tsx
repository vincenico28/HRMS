import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Search, Briefcase, Users, UserCheck, ClipboardList, Trash2, MapPin, Star } from "lucide-react";
import {
  useJobPostings, useCreateJobPosting, useDeleteJobPosting, useUpdateJobPosting,
  useApplicants, useCreateApplicant, useUpdateApplicant,
  useOnboardingTasks, useCreateOnboardingTask, useToggleOnboardingTask,
} from "@/hooks/useRecruitment";
import { useDepartments, useEmployees } from "@/hooks/useSupabaseData";

const applicantStatuses = ["applied", "screening", "interview", "offered", "hired", "rejected"];
const statusColors: Record<string, string> = {
  open: "bg-success/10 text-success border-success/20",
  closed: "bg-muted text-muted-foreground border-muted",
  "on-hold": "bg-warning/10 text-warning border-warning/20",
  applied: "bg-info/10 text-info border-info/20",
  screening: "bg-warning/10 text-warning border-warning/20",
  interview: "bg-primary/10 text-primary border-primary/20",
  offered: "bg-accent/10 text-accent border-accent/20",
  hired: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const defaultJobForm = { title: "", department_id: "", description: "", requirements: "", employment_type: "full-time", location: "", salary_range: "" };
const defaultApplicantForm = { job_posting_id: "", full_name: "", email: "", phone: "", cover_letter: "" };
const defaultOnboardingForm = { employee_id: "", title: "", description: "", due_date: "" };

export default function Recruitment() {
  const [search, setSearch] = useState("");
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [applicantDialogOpen, setApplicantDialogOpen] = useState(false);
  const [onboardingDialogOpen, setOnboardingDialogOpen] = useState(false);

  const [jobForm, setJobForm] = useState(defaultJobForm);
  const [applicantForm, setApplicantForm] = useState(defaultApplicantForm);
  const [onboardingForm, setOnboardingForm] = useState(defaultOnboardingForm);

  const { data: jobs = [], isLoading } = useJobPostings();
  const { data: applicants = [] } = useApplicants();
  const { data: onboardingTasks = [] } = useOnboardingTasks();
  const { data: departments = [] } = useDepartments();
  const { data: employees = [] } = useEmployees();

  const createJob = useCreateJobPosting();
  const deleteJob = useDeleteJobPosting();
  const createApplicant = useCreateApplicant();
  const updateApplicant = useUpdateApplicant();
  const createOnboardingTask = useCreateOnboardingTask();
  const toggleOnboardingTask = useToggleOnboardingTask();

  const filteredJobs = jobs.filter((j) => j.title.toLowerCase().includes(search.toLowerCase()));

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title) { toast.error("Title is required"); return; }
    createJob.mutate(
      {
        title: jobForm.title,
        department_id: jobForm.department_id || null,
        description: jobForm.description || null,
        requirements: jobForm.requirements || null,
        employment_type: jobForm.employment_type,
        location: jobForm.location || null,
        salary_range: jobForm.salary_range || null,
        status: "open",
        posted_by: null,
      },
      {
        onSuccess: () => { toast.success("Job posting created"); setJobDialogOpen(false); setJobForm(defaultJobForm); },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleCreateApplicant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantForm.job_posting_id || !applicantForm.full_name || !applicantForm.email) {
      toast.error("Job posting, name, and email are required"); return;
    }
    createApplicant.mutate(
      {
        job_posting_id: applicantForm.job_posting_id,
        full_name: applicantForm.full_name,
        email: applicantForm.email,
        phone: applicantForm.phone || null,
        cover_letter: applicantForm.cover_letter || null,
        resume_url: null,
        status: "applied",
        rating: null,
        notes: null,
        interview_date: null,
      },
      {
        onSuccess: () => { toast.success("Applicant added"); setApplicantDialogOpen(false); setApplicantForm(defaultApplicantForm); },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleCreateOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingForm.employee_id || !onboardingForm.title) { toast.error("Employee and title are required"); return; }
    createOnboardingTask.mutate(
      {
        employee_id: onboardingForm.employee_id,
        title: onboardingForm.title,
        description: onboardingForm.description || undefined,
        due_date: onboardingForm.due_date || undefined,
      },
      {
        onSuccess: () => { toast.success("Onboarding task created"); setOnboardingDialogOpen(false); setOnboardingForm(defaultOnboardingForm); },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Recruitment & Onboarding</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage job postings, applicants, and onboarding</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Open Positions", value: jobs.filter((j) => j.status === "open").length, icon: Briefcase, color: "text-primary" },
          { label: "Total Applicants", value: applicants.length, icon: Users, color: "text-info" },
          { label: "Hired", value: applicants.filter((a) => a.status === "hired").length, icon: UserCheck, color: "text-success" },
          { label: "Onboarding Tasks", value: onboardingTasks.filter((t) => !t.is_completed).length, icon: ClipboardList, color: "text-warning" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="applicants">Applicants</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search positions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Dialog open={jobDialogOpen} onOpenChange={(open) => { setJobDialogOpen(open); if (!open) setJobForm(defaultJobForm); }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Post Job</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>New Job Posting</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateJob} className="space-y-4">
                  <div className="space-y-2"><Label>Title *</Label><Input value={jobForm.title} onChange={(e) => setJobForm(f => ({ ...f, title: e.target.value }))} required /></div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={jobForm.department_id} onValueChange={(val) => setJobForm(f => ({ ...f, department_id: val }))}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Description</Label><Textarea value={jobForm.description} onChange={(e) => setJobForm(f => ({ ...f, description: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Requirements</Label><Textarea value={jobForm.requirements} onChange={(e) => setJobForm(f => ({ ...f, requirements: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={jobForm.employment_type} onValueChange={(val) => setJobForm(f => ({ ...f, employment_type: val }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["full-time", "part-time", "contract", "internship"].map((t) => (
                            <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Location</Label><Input value={jobForm.location} onChange={(e) => setJobForm(f => ({ ...f, location: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-2"><Label>Salary Range</Label><Input value={jobForm.salary_range} onChange={(e) => setJobForm(f => ({ ...f, salary_range: e.target.value }))} placeholder="e.g. $50k - $70k" /></div>
                  <Button type="submit" className="w-full" disabled={createJob.isPending}>
                    {createJob.isPending ? "Posting..." : "Post Job"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredJobs.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No job postings found.</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job) => {
                const jobApplicants = applicants.filter((a) => a.job_posting_id === job.id).length;
                return (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{job.title}</CardTitle>
                        <Badge variant="outline" className={statusColors[job.status] || ""}>{job.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {job.departments?.name && <Badge variant="secondary">{job.departments.name}</Badge>}
                        <Badge variant="outline">{job.employment_type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {job.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</p>
                      )}
                      {job.salary_range && <p className="text-xs text-muted-foreground">💰 {job.salary_range}</p>}
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />{jobApplicants} applicant{jobApplicants !== 1 ? "s" : ""}</p>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => { setApplicantForm(f => ({ ...f, job_posting_id: job.id })); setApplicantDialogOpen(true); }}>
                          <Plus className="w-3 h-3 mr-1" />Add Applicant
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteJob.mutate(job.id, { onSuccess: () => toast.success("Job deleted") })}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Applicants Tab */}
        <TabsContent value="applicants" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={applicantDialogOpen} onOpenChange={(open) => { setApplicantDialogOpen(open); if (!open) setApplicantForm(defaultApplicantForm); }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Add Applicant</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Applicant</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateApplicant} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Job Posting *</Label>
                    <Select value={applicantForm.job_posting_id} onValueChange={(val) => setApplicantForm(f => ({ ...f, job_posting_id: val }))}>
                      <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                      <SelectContent>
                        {jobs.filter((j) => j.status === "open").map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Full Name *</Label><Input value={applicantForm.full_name} onChange={(e) => setApplicantForm(f => ({ ...f, full_name: e.target.value }))} required /></div>
                  <div className="space-y-2"><Label>Email *</Label><Input type="email" value={applicantForm.email} onChange={(e) => setApplicantForm(f => ({ ...f, email: e.target.value }))} required /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={applicantForm.phone} onChange={(e) => setApplicantForm(f => ({ ...f, phone: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Cover Letter</Label><Textarea value={applicantForm.cover_letter} onChange={(e) => setApplicantForm(f => ({ ...f, cover_letter: e.target.value }))} /></div>
                  <Button type="submit" className="w-full" disabled={createApplicant.isPending}>
                    {createApplicant.isPending ? "Adding..." : "Add Applicant"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No applicants yet.</TableCell></TableRow>
                ) : (
                  applicants.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.full_name}</TableCell>
                      <TableCell className="text-sm">{app.job_postings?.title || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{app.email}</TableCell>
                      <TableCell>
                        <Select
                          defaultValue={app.status}
                          onValueChange={(val) => updateApplicant.mutate({ id: app.id, status: val }, { onSuccess: () => toast.success("Status updated") })}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {applicantStatuses.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => updateApplicant.mutate({ id: app.id, rating: star })}
                              className="hover:scale-110 transition-transform"
                            >
                              <Star className={`w-3.5 h-3.5 ${(app.rating || 0) >= star ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
                            </button>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {app.status !== "hired" && (
                          <Button size="sm" variant="outline" onClick={() => updateApplicant.mutate({ id: app.id, status: "hired" }, { onSuccess: () => toast.success("Applicant hired!") })}>
                            Hire
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={onboardingDialogOpen} onOpenChange={(open) => { setOnboardingDialogOpen(open); if (!open) setOnboardingForm(defaultOnboardingForm); }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Add Task</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Onboarding Task</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateOnboarding} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Employee *</Label>
                    <Select value={onboardingForm.employee_id} onValueChange={(val) => setOnboardingForm(f => ({ ...f, employee_id: val }))}>
                      <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Task Title *</Label><Input value={onboardingForm.title} onChange={(e) => setOnboardingForm(f => ({ ...f, title: e.target.value }))} required /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea value={onboardingForm.description} onChange={(e) => setOnboardingForm(f => ({ ...f, description: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={onboardingForm.due_date} onChange={(e) => setOnboardingForm(f => ({ ...f, due_date: e.target.value }))} /></div>
                  <Button type="submit" className="w-full" disabled={createOnboardingTask.isPending}>
                    {createOnboardingTask.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onboardingTasks.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No onboarding tasks yet.</TableCell></TableRow>
                ) : (
                  onboardingTasks.map((task) => (
                    <TableRow key={task.id} className={task.is_completed ? "opacity-60" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={task.is_completed}
                          onCheckedChange={(checked) => toggleOnboardingTask.mutate({ id: task.id, is_completed: !!checked })}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className={`font-medium text-sm ${task.is_completed ? "line-through" : ""}`}>{task.title}</p>
                          {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{task.employees?.full_name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={task.is_completed ? statusColors.hired : statusColors.applied}>
                          {task.is_completed ? "Done" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
