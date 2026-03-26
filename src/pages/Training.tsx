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
import { toast } from "sonner";
import { Plus, Search, GraduationCap, Award, Users, Clock, Trash2, UserPlus } from "lucide-react";
import {
  useTrainingPrograms,
  useCreateTrainingProgram,
  useDeleteTrainingProgram,
  useTrainingEnrollments,
  useEnrollEmployee,
  useUpdateEnrollment,
  useCertifications,
  useCreateCertification,
  useDeleteCertification,
} from "@/hooks/useTraining";
import { useEmployees } from "@/hooks/useSupabaseData";

const categories = ["general", "technical", "leadership", "compliance", "soft-skills"];
const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  enrolled: "bg-info/10 text-info border-info/20",
  "in-progress": "bg-warning/10 text-warning border-warning/20",
  expired: "bg-muted text-muted-foreground border-muted",
};

export default function Training() {
  const [search, setSearch] = useState("");
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");

  // Controlled form state for program
  const [programForm, setProgramForm] = useState({ title: "", description: "", category: "general", duration_hours: "1", instructor: "", max_participants: "", start_date: "", end_date: "" });
  // Controlled form state for enrollment
  const [enrollForm, setEnrollForm] = useState({ program_id: "", employee_id: "" });
  // Controlled form state for certification
  const [certForm, setCertForm] = useState({ employee_id: "", name: "", issuing_body: "", issue_date: "", expiry_date: "", credential_id: "" });

  const { data: programs = [], isLoading: loadingPrograms } = useTrainingPrograms();
  const { data: enrollments = [] } = useTrainingEnrollments();
  const { data: certifications = [] } = useCertifications();
  const { data: employees = [] } = useEmployees();
  const createProgram = useCreateTrainingProgram();
  const deleteProgram = useDeleteTrainingProgram();
  const enrollEmployee = useEnrollEmployee();
  const updateEnrollment = useUpdateEnrollment();
  const createCert = useCreateCertification();
  const deleteCert = useDeleteCertification();

  const filteredPrograms = programs.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const resetProgramForm = () => setProgramForm({ title: "", description: "", category: "general", duration_hours: "1", instructor: "", max_participants: "", start_date: "", end_date: "" });
  const resetEnrollForm = () => setEnrollForm({ program_id: "", employee_id: "" });
  const resetCertForm = () => setCertForm({ employee_id: "", name: "", issuing_body: "", issue_date: "", expiry_date: "", credential_id: "" });

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programForm.title) { toast.error("Title is required"); return; }
    createProgram.mutate(
      {
        title: programForm.title,
        description: programForm.description || null,
        category: programForm.category,
        duration_hours: parseInt(programForm.duration_hours) || 1,
        instructor: programForm.instructor || null,
        max_participants: programForm.max_participants ? parseInt(programForm.max_participants) : null,
        status: "active",
        start_date: programForm.start_date || null,
        end_date: programForm.end_date || null,
      },
      {
        onSuccess: () => { toast.success("Training program created"); setProgramDialogOpen(false); resetProgramForm(); },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollForm.program_id || !enrollForm.employee_id) { toast.error("Please select both program and employee"); return; }
    enrollEmployee.mutate(
      { program_id: enrollForm.program_id, employee_id: enrollForm.employee_id },
      {
        onSuccess: () => { toast.success("Employee enrolled"); setEnrollDialogOpen(false); resetEnrollForm(); },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleCreateCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.employee_id || !certForm.name || !certForm.issue_date) { toast.error("Employee, name, and issue date are required"); return; }
    createCert.mutate(
      {
        employee_id: certForm.employee_id,
        name: certForm.name,
        issuing_body: certForm.issuing_body || null,
        issue_date: certForm.issue_date,
        expiry_date: certForm.expiry_date || null,
        credential_id: certForm.credential_id || null,
        status: "active",
      },
      {
        onSuccess: () => { toast.success("Certification added"); setCertDialogOpen(false); resetCertForm(); },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Training & Development</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage programs, enrollments, and certifications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Programs", value: programs.length, icon: GraduationCap, color: "text-primary" },
          { label: "Active Enrollments", value: enrollments.filter((e) => e.status === "enrolled" || e.status === "in-progress").length, icon: Users, color: "text-info" },
          { label: "Completed", value: enrollments.filter((e) => e.status === "completed").length, icon: Clock, color: "text-success" },
          { label: "Certifications", value: certifications.length, icon: Award, color: "text-warning" },
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

      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
        </TabsList>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Dialog open={programDialogOpen} onOpenChange={(open) => { setProgramDialogOpen(open); if (!open) resetProgramForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Add Program</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>New Training Program</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateProgram} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input value={programForm.title} onChange={(e) => setProgramForm(f => ({ ...f, title: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={programForm.description} onChange={(e) => setProgramForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={programForm.category} onValueChange={(val) => setProgramForm(f => ({ ...f, category: val }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (hours)</Label>
                      <Input type="number" min="1" value={programForm.duration_hours} onChange={(e) => setProgramForm(f => ({ ...f, duration_hours: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Instructor</Label>
                      <Input value={programForm.instructor} onChange={(e) => setProgramForm(f => ({ ...f, instructor: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Participants</Label>
                      <Input type="number" value={programForm.max_participants} onChange={(e) => setProgramForm(f => ({ ...f, max_participants: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={programForm.start_date} onChange={(e) => setProgramForm(f => ({ ...f, start_date: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" value={programForm.end_date} onChange={(e) => setProgramForm(f => ({ ...f, end_date: e.target.value }))} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createProgram.isPending}>
                    {createProgram.isPending ? "Creating..." : "Create Program"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loadingPrograms ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredPrograms.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No training programs found.</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPrograms.map((program) => {
                const enrolled = enrollments.filter((e) => e.program_id === program.id).length;
                return (
                  <Card key={program.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{program.title}</CardTitle>
                        <Badge variant="outline" className={statusColors[program.status] || ""}>{program.status}</Badge>
                      </div>
                      <Badge variant="secondary" className="w-fit text-xs">{program.category}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {program.description && <p className="text-sm text-muted-foreground line-clamp-2">{program.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{program.duration_hours}h</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{enrolled}{program.max_participants ? `/${program.max_participants}` : ""}</span>
                      </div>
                      {program.instructor && <p className="text-xs text-muted-foreground">Instructor: {program.instructor}</p>}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedProgramId(program.id); setEnrollForm(f => ({ ...f, program_id: program.id })); setEnrollDialogOpen(true); }}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />Enroll
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteProgram.mutate(program.id, { onSuccess: () => toast.success("Program deleted") })}
                        >
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

        {/* Enrollments Tab */}
        <TabsContent value="enrollments" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={enrollDialogOpen} onOpenChange={(open) => { setEnrollDialogOpen(open); if (!open) resetEnrollForm(); }}>
              <DialogTrigger asChild>
                <Button><UserPlus className="w-4 h-4 mr-2" />Enroll Employee</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Enroll Employee</DialogTitle></DialogHeader>
                <form onSubmit={handleEnroll} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Program *</Label>
                    <Select value={enrollForm.program_id} onValueChange={(val) => setEnrollForm(f => ({ ...f, program_id: val }))}>
                      <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                      <SelectContent>
                        {programs.filter((p) => p.status === "active").map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Employee *</Label>
                    <Select value={enrollForm.employee_id} onValueChange={(val) => setEnrollForm(f => ({ ...f, employee_id: val }))}>
                      <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={enrollEmployee.isPending}>
                    {enrollEmployee.isPending ? "Enrolling..." : "Enroll"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No enrollments yet.</TableCell></TableRow>
                ) : (
                  enrollments.map((enr) => (
                    <TableRow key={enr.id}>
                      <TableCell className="font-medium">{enr.employees?.full_name || "—"}</TableCell>
                      <TableCell>{enr.training_programs?.title || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[enr.status] || ""}>{enr.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(enr.enrolled_at).toLocaleDateString()}</TableCell>
                      <TableCell>{enr.score != null ? enr.score : "—"}</TableCell>
                      <TableCell>
                        {enr.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateEnrollment.mutate(
                                { id: enr.id, status: "completed", completed_at: new Date().toISOString() },
                                { onSuccess: () => toast.success("Marked complete") }
                              )
                            }
                          >
                            Complete
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

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={certDialogOpen} onOpenChange={(open) => { setCertDialogOpen(open); if (!open) resetCertForm(); }}>
              <DialogTrigger asChild>
                <Button><Award className="w-4 h-4 mr-2" />Add Certification</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Certification</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateCert} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Employee *</Label>
                    <Select value={certForm.employee_id} onValueChange={(val) => setCertForm(f => ({ ...f, employee_id: val }))}>
                      <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Certification Name *</Label>
                    <Input value={certForm.name} onChange={(e) => setCertForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Issuing Body</Label>
                    <Input value={certForm.issuing_body} onChange={(e) => setCertForm(f => ({ ...f, issuing_body: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Issue Date *</Label>
                      <Input type="date" value={certForm.issue_date} onChange={(e) => setCertForm(f => ({ ...f, issue_date: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Input type="date" value={certForm.expiry_date} onChange={(e) => setCertForm(f => ({ ...f, expiry_date: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Credential ID</Label>
                    <Input value={certForm.credential_id} onChange={(e) => setCertForm(f => ({ ...f, credential_id: e.target.value }))} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createCert.isPending}>
                    {createCert.isPending ? "Adding..." : "Add Certification"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Certification</TableHead>
                  <TableHead>Issuing Body</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certifications.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No certifications yet.</TableCell></TableRow>
                ) : (
                  certifications.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.employees?.full_name || "—"}</TableCell>
                      <TableCell>{cert.name}</TableCell>
                      <TableCell className="text-muted-foreground">{cert.issuing_body || "—"}</TableCell>
                      <TableCell className="text-sm">{new Date(cert.issue_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">{cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[cert.status] || ""}>{cert.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteCert.mutate(cert.id, { onSuccess: () => toast.success("Certification removed") })}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
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
